import { supabase } from '../lib/supabase'

export type AssistanceConversation = {
  id: string
  client_user_id: string | null
  visitor_id: string | null
  owner_type?: 'client' | 'visitor'
  commande_id: string | null
  statut: 'open' | 'closed'
  created_at: string
  updated_at: string
  last_message_at: string
  needs_human_reply: boolean
  client?: {
    nom: string | null
    telephone: string | null
  } | null
  commande?: {
    numero: string | null
    statut: string | null
    total: number | null
  } | null
}

export type AssistanceMessage = {
  id: string
  conversation_id: string
  sender_type: 'client' | 'assistant' | 'system'
  sender_user_id: string | null
  contenu: string | null
  created_at: string
  lu_at: string | null
  has_attachment: boolean
  attachment_path: string | null
  attachment_name: string | null
  attachment_type: string | null
}

export type AssistanceVisitor = {
  visitor_id: string
  access_token: string
}

const VISITOR_STORAGE_KEY = 'cs_assistance_visitor'

function obtenirVisiteurLocal(): AssistanceVisitor | null {
  try {
    const raw = sessionStorage.getItem(VISITOR_STORAGE_KEY)

    if (!raw) return null

    const parsed = JSON.parse(raw)

    if (
      typeof parsed?.visitor_id !== 'string' ||
      typeof parsed?.access_token !== 'string'
    ) {
      sessionStorage.removeItem(VISITOR_STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    sessionStorage.removeItem(VISITOR_STORAGE_KEY)
    return null
  }
}

function enregistrerVisiteurLocal(visitor: AssistanceVisitor) {
  sessionStorage.setItem(
    VISITOR_STORAGE_KEY,
    JSON.stringify(visitor),
  )
}

export function supprimerVisiteurLocal() {
  sessionStorage.removeItem(VISITOR_STORAGE_KEY)
}

async function obtenirUtilisateurConnecte() {
  const { data, error } = await supabase.auth.getSession()

  if (error) throw error

  return data.session?.user ?? null
}

export async function lierVisiteursAuCompteParEmail() {
  const utilisateur = await obtenirUtilisateurConnecte()

  if (!utilisateur) {
    return {
      visiteursLies: 0,
      conversationsLiees: 0,
    }
  }

  const { data, error } = await supabase.rpc(
    'cs_assistance_visiteur_lier_compte_par_email',
  )

  if (error) throw error

  const resultat = data?.[0]

  return {
    visiteursLies: Number(resultat?.visiteurs_lies ?? 0),
    conversationsLiees: Number(
      resultat?.conversations_liees ?? 0,
    ),
  }
}

export async function lierVisiteurAuCompte() {
  const visitor = obtenirVisiteurLocal()

  if (!visitor) {
    return {
      lie: false,
      conversationsLiees: 0,
    }
  }

  const utilisateur = await obtenirUtilisateurConnecte()

  if (!utilisateur) {
    return {
      lie: false,
      conversationsLiees: 0,
    }
  }

  const { data, error } = await supabase.rpc(
    'cs_assistance_visiteur_lier_compte',
    {
      p_visitor_id: visitor.visitor_id,
      p_access_token: visitor.access_token,
    },
  )

  if (error) throw error

  const resultat = data?.[0]

  return {
    lie: true,
    conversationsLiees:
      Number(resultat?.conversations_liees ?? 0),
  }
}

export async function creerVisiteurAssistance(
  nom: string,
  telephone: string,
  email?: string | null,
) {
  const { data, error } = await supabase.rpc(
    'cs_assistance_visiteur_creer',
    {
      p_nom: nom.trim(),
      p_telephone: telephone.trim(),
      p_email: email?.trim() || null,
    },
  )

  if (error) throw error

  const visitor = data?.[0]

  if (
    !visitor?.visitor_id ||
    !visitor?.access_token
  ) {
    throw new Error(
      'Impossible de créer votre identité visiteur.',
    )
  }

  const resultat: AssistanceVisitor = {
    visitor_id: visitor.visitor_id,
    access_token: visitor.access_token,
  }

  enregistrerVisiteurLocal(resultat)

  return resultat
}

export async function ouvrirConversationVisiteurAssistance(
  commandeId?: string | null,
) {
  const visitor = obtenirVisiteurLocal()

  if (!visitor) {
    throw new Error('Identité visiteur introuvable.')
  }

  const { data, error } = await supabase.rpc(
    'cs_assistance_visiteur_ouvrir',
    {
      p_visitor_id: visitor.visitor_id,
      p_access_token: visitor.access_token,
      p_commande_id: commandeId ?? null,
    },
  )

  if (error) throw error

  const conversation = data?.[0]

  if (!conversation?.conversation_id) {
    throw new Error(
      'Impossible d’ouvrir la conversation.',
    )
  }

  return {
    id: conversation.conversation_id,
    client_user_id: '',
    commande_id: conversation.commande_id ?? null,
    statut: conversation.statut as 'open' | 'closed',
    created_at: '',
    updated_at: '',
    last_message_at: '',
    needs_human_reply: false,
    client: null,
    commande: null,
  } as AssistanceConversation
}


export async function rouvrirConversationVisiteurAssistance(
  conversationId: string,
) {
  const user = await obtenirUtilisateurConnecte()

  if (user) {
    const { data, error } = await supabase.rpc(
      'cs_assistance_client_rouvrir',
      {
        p_conversation_id: conversationId,
      },
    )

    if (error) throw error

    if (data !== true) {
      throw new Error('Impossible de rouvrir la conversation.')
    }

    return true
  }

  const visitor = obtenirVisiteurLocal()

  if (!visitor) {
    throw new Error('Identité visiteur introuvable.')
  }

  const { data, error } = await supabase.rpc(
    'cs_assistance_visiteur_rouvrir',
    {
      p_visitor_id: visitor.visitor_id,
      p_access_token: visitor.access_token,
      p_conversation_id: conversationId,
    },
  )

  if (error) throw error

  if (data !== true) {
    throw new Error('Impossible de rouvrir la conversation.')
  }

  return true
}

export async function obtenirConversationAssistance(
  commandeId?: string | null,
) {
  const user = await obtenirUtilisateurConnecte()

  if (!user) {
    return null
  }

  let requete = supabase
    .from('cs_assistance_conversations')
    .select('*')
    .eq('client_user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)

  if (commandeId) {
    requete = requete.eq('commande_id', commandeId)
  }

  const { data, error } = await requete.maybeSingle()

  if (error) throw error

  return data as AssistanceConversation | null
}

export async function creerConversationAssistance(
  commandeId?: string | null,
) {
  const user = await obtenirUtilisateurConnecte()

  if (!user) {
    throw new Error('Utilisateur non connecté.')
  }

  const { data, error } = await supabase
    .from('cs_assistance_conversations')
    .insert({
      client_user_id: user.id,
      commande_id: commandeId ?? null,
    })
    .select()
    .single()

  if (error) throw error

  return data as AssistanceConversation
}

export async function obtenirMessagesAssistance(
  conversationId: string,
) {
  const user = await obtenirUtilisateurConnecte()

  if (user) {
    const { data, error } = await supabase
      .from('cs_assistance_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return (data ?? []) as AssistanceMessage[]
  }

  const visitor = obtenirVisiteurLocal()

  if (visitor) {
    const { data, error } = await supabase.rpc(
      'cs_assistance_visiteur_lire',
      {
        p_visitor_id: visitor.visitor_id,
        p_access_token: visitor.access_token,
        p_conversation_id: conversationId,
      },
    )

    if (error) throw error

    return (data ?? []) as AssistanceMessage[]
  }

  return []
}


export async function appelerRobotAssistance(
  conversationId: string,
  message: string,
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Priorité à l'utilisateur authentifié.
  // Un ancien visiteur local ne doit jamais remplacer
  // l'identité du compte actuellement connecté.
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  } else {
    const visitor = obtenirVisiteurLocal()

    if (visitor) {
      headers['x-visitor-id'] = visitor.visitor_id
      headers['x-visitor-token'] = visitor.access_token
    }
  }

  const { data, error } = await supabase.functions.invoke(
    'assistance-robot-v2',
    {
      body: {
        message: message.trim(),
        conversation_id: conversationId,
      },
      headers,
    },
  )

  if (error) {
    console.error('[Assistance] Robot error:', {
      name: error.name,
      message: error.message,
      status: (error as any).context?.status,
      statusText: (error as any).context?.statusText,
    })

    let serverBody = ''
    try {
      const response = (error as any).context
      if (response?.text) {
        serverBody = await response.text()
      }
    } catch (bodyError) {
      console.error('[Assistance] Impossible de lire le corps erreur:', bodyError)
    }

    throw new Error(
      [
        `name=${error.name}`,
        `message=${error.message}`,
        `status=${(error as any).context?.status ?? 'inconnu'}`,
        `body=${serverBody || 'vide'}`,
      ].join(' | '),
    )
  }

  return data as {
    status:
      | 'robot'
      | 'human_requested'
      | 'human'
      | 'closed'
    answer?: string
    message_id?: string | null
    intent?: string
    confidence?: number
  }
}

export async function envoyerMessageAssistance(
  conversationId: string,
  contenu: string,
  fichier?: File | null,
) {
  if (fichier) {
    throw new Error(
      'Les pièces jointes visiteurs seront activées après sécurisation du Storage.',
    )
  }

  const texte = contenu.trim()

  if (!texte) {
    throw new Error('Message vide')
  }

  // Priorité à l'utilisateur authentifié.
  // Un ancien visiteur local ne doit jamais remplacer
  // l'identité du compte actuellement connecté.
  const user = await obtenirUtilisateurConnecte()

  if (user) {
    const { data, error } = await supabase
      .from('cs_assistance_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'client',
        sender_user_id: user.id,
        contenu: texte,
        has_attachment: false,
      })
      .select()
      .single()

    if (error) throw error

    return data as AssistanceMessage
  }

  // Aucun compte connecté : on peut utiliser l'identité visiteur.
  const visitor = obtenirVisiteurLocal()

  if (!visitor) {
    throw new Error('Utilisateur non connecté ou identité visiteur introuvable.')
  }

  console.log('ASSISTANCE RPC ENVOYER', {
    p_visitor_id: visitor.visitor_id,
    p_access_token: visitor.access_token ? '[PRESENT]' : '[ABSENT]',
    p_conversation_id: conversationId,
    p_contenu: texte,
  })

  const { data, error } = await supabase.rpc(
    'cs_assistance_visiteur_envoyer',
    {
      p_visitor_id: visitor.visitor_id,
      p_access_token: visitor.access_token,
      p_conversation_id: conversationId,
      p_contenu: texte,
    },
  )

  if (error) throw error

  const { data: messages, error: messageError } =
    await supabase.rpc(
      'cs_assistance_visiteur_lire',
      {
        p_visitor_id: visitor.visitor_id,
        p_access_token: visitor.access_token,
        p_conversation_id: conversationId,
      },
    )

  if (messageError) throw messageError

  const message = (messages ?? []).find(
    (item: AssistanceMessage) => item.id === data,
  )

  if (!message) {
    throw new Error(
      'Message envoyé mais impossible de le récupérer.',
    )
  }

  return message as AssistanceMessage
}

export async function obtenirUrlPieceJointeAssistance(
  attachmentPath: string,
) {
  const { data, error } = await supabase.storage
    .from('assistance')
    .createSignedUrl(attachmentPath, 300)

  if (error) throw error

  return data.signedUrl
}

export async function envoyerReponseAssistanceAdmin(
  conversationId: string,
  contenu: string,
) {
  const { data: authData } =
    await supabase.auth.getUser()

  const user = authData.user

  if (!user) {
    throw new Error('Utilisateur non connecté')
  }

  const texte = contenu.trim()

  if (!texte) {
    throw new Error('Message vide')
  }

  const { data, error } = await supabase
    .from('cs_assistance_messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'assistant',
      sender_user_id: user.id,
      contenu: texte,
      has_attachment: false,
    })
    .select()
    .single()

  if (error) throw error

  return data as AssistanceMessage
}

export async function notifierEmailAssistanceAdmin(
  type: 'reply' | 'closed',
  conversationId: string,
  messageId?: string,
) {
  try {
    const body: {
      type: 'reply' | 'closed'
      conversation_id: string
      message_id?: string
    } = {
      type,
      conversation_id: conversationId,
    }

    if (messageId) {
      body.message_id = messageId
    }

    const { data, error } = await supabase.functions.invoke(
      'notify-assistance-reply',
      {
        body,
      },
    )

    if (error) {
      console.error(
        '[Assistance] Notification email échouée :',
        error,
      )
      return {
        ok: false,
        error,
      }
    }

    return data
  } catch (error) {
    console.error(
      '[Assistance] Erreur notification email :',
      error,
    )

    return {
      ok: false,
      error,
    }
  }
}

export async function marquerMessagesAssistanceLus(
  conversationId: string,
) {
  const { error } = await supabase.rpc(
    'cs_assistance_marquer_messages_lus',
    {
      p_conversation_id: conversationId,
    },
  )

  if (error) throw error
}

export function ecouterMessagesAssistance(
  conversationId: string,
  callback: () => void,
) {
  const channel = supabase
    .channel(`assistance-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'cs_assistance_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback,
    )
    .subscribe()

  return channel
}
export async function fermerConversationAssistanceAdmin(
  conversationId: string,
) {
  const { data, error } = await supabase.rpc(
    'cs_assistance_admin_fermer',
    {
      p_conversation_id: conversationId,
    },
  )

  if (error) throw error

  return Boolean(data)
}
