import { supabase } from '../lib/supabase'

export type ConversationIA = {
  id: string
  created_at: string
  updated_at: string
  statut: string
  mode_assistance: string
  visiteur_nom: string | null
  visiteur_email: string | null
  client_user_id: string | null
  nb_messages: number
  dernier_message: string | null
  dernier_message_at: string | null
  non_lu: boolean
}

export type MessageIA = {
  id: string
  contenu: string
  sender_type: 'client' | 'robot' | 'assistant' | 'system'
  created_at: string
  conversation_id: string
}

export async function listerConversationsIA(): Promise<{
  success: boolean
  data: ConversationIA[]
  error: string
}> {
  if (!supabase) return { success: false, data: [], error: 'Supabase non configuré' }

  try {
    const { data, error } = await supabase.rpc('cs_admin_lister_conversations_ia')
    if (error) throw error

    return { success: true, data: (data || []) as ConversationIA[], error: '' }
  } catch (err) {
    console.error('Erreur liste conversations IA:', err)
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}

export async function obtenirMessagesConversationIA(conversationId: string): Promise<{
  success: boolean
  data: MessageIA[]
  error: string
}> {
  if (!supabase) return { success: false, data: [], error: 'Supabase non configuré' }

  try {
    const { data, error } = await supabase.rpc('cs_admin_lire_messages_ia', {
      p_conversation_id: conversationId,
    })
    if (error) throw error

    return { success: true, data: (data || []) as MessageIA[], error: '' }
  } catch (err) {
    console.error('Erreur messages conversation IA:', err)
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}

export async function marquerConversationLue(conversationId: string): Promise<{
  success: boolean
  error: string
}> {
  if (!supabase) return { success: false, error: 'Supabase non configuré' }

  try {
    const { error } = await supabase.rpc('cs_admin_marquer_conversation_lue', {
      p_conversation_id: conversationId,
    })
    if (error) throw error
    return { success: true, error: '' }
  } catch (err) {
    console.error('Erreur marquage conversation lue:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}

export async function marquerMessagesConversationLus(conversationId: string): Promise<{
  success: boolean
  error: string
}> {
  if (!supabase) return { success: false, error: 'Supabase non configuré' }

  try {
    const { error } = await supabase.rpc('cs_admin_marquer_messages_lus', {
      p_conversation_id: conversationId,
    })
    if (error) throw error
    return { success: true, error: '' }
  } catch (err) {
    console.error('Erreur marquage messages lus:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}
