import { useEffect, useState } from 'react'
import {
  MessageCircle,
  Send,
  Loader2,
  UserRound,
  CheckCircle2,
  Mail,
} from 'lucide-react'
import {
  obtenirMessagesAssistance,
  marquerMessagesAssistanceLus,
  envoyerReponseAssistanceAdmin,
  obtenirUrlPieceJointeAssistance,
  fermerConversationAssistanceAdmin,
  notifierEmailAssistanceAdmin,
  ecouterMessagesAssistance,
  type AssistanceConversation,
  type AssistanceMessage,
} from '../../services/assistance'
import { supabase } from '../../lib/supabase'

function PieceJointeAdmin({
  message,
}: {
  message: AssistanceMessage
}) {
  const [chargement, setChargement] = useState(false)

  async function ouvrir() {
    if (!message.attachment_path || chargement) return

    try {
      setChargement(true)
const url = await obtenirUrlPieceJointeAssistance(
        message.attachment_path,
      )

      if (!url) {
        throw new Error('URL signée introuvable')
      }
window.open(url, '_blank')
    } catch (error) {
      console.error(
        '[Assistance] Impossible d’ouvrir la pièce jointe :',
        error,
      )

      alert(
        error instanceof Error
          ? `Impossible d’ouvrir le fichier : ${error.message}`
          : 'Impossible d’ouvrir le fichier.',
      )
    } finally {
      setChargement(false)
    }
  }

  return (
    <button
      type="button"
      onClick={ouvrir}
      disabled={chargement}
      className="mt-2 flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-50"
    >
      <span>
        {message.attachment_type?.startsWith('image/')
          ? '🖼️'
          : '📎'}
      </span>

      <span className="min-w-0 truncate">
        {chargement
          ? 'Ouverture...'
          : message.attachment_name || 'Pièce jointe'}
      </span>
    </button>
  )
}

export default function Assistance() {
type ConversationInbox = AssistanceConversation & {
    client_email?: string | null
    dernierMessage: AssistanceMessage | null
    messagesNonLus: number
  }

  const [conversations, setConversations] = useState<ConversationInbox[]>([])
  const [conversationSelectionnee, setConversationSelectionnee] =
    useState<ConversationInbox | null>(null)
  const [messages, setMessages] = useState<AssistanceMessage[]>([])
  const [message, setMessage] = useState('')
  const [chargement, setChargement] = useState(true)
  const [chargementMessages, setChargementMessages] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    let actif = true

    async function chargerConversations() {
      try {
        setChargement(true)
        setErreur(null)
        const { data, error } = await supabase.rpc(
          'cs_assistance_admin_inbox',
        )

        if (error) throw error

        const conversationsBrutes = (data ?? []) as Array<
          AssistanceConversation & {
            visitor_id?: string | null
            client_nom?: string | null
            client_telephone?: string | null
            client_email?: string | null
            commande_numero?: string | null
            commande_statut?: string | null
            commande_total?: number | null
          }
        >

        const conversationsVisibles = conversationsBrutes

        const conversationIds = conversationsVisibles.map(
          (conversation) => conversation.id,
        )

        const informationsMessages = new Map<
          string,
          { dernierMessage: AssistanceMessage | null; messagesNonLus: number }
        >()

        if (conversationIds.length > 0) {
          const { data: messagesData, error: messagesError } =
            await supabase
              .from('cs_assistance_messages')
              .select(
                'id, conversation_id, sender_type, sender_user_id, contenu, created_at, lu_at, has_attachment, attachment_path, attachment_name, attachment_type',
              )
              .in('conversation_id', conversationIds)
              .order('created_at', { ascending: true })

          if (messagesError) throw messagesError

          for (const item of (messagesData ?? []) as AssistanceMessage[]) {
            const actuel =
              informationsMessages.get(item.conversation_id) ?? {
                dernierMessage: null,
                messagesNonLus: 0,
              }

            actuel.dernierMessage = item

            if (
              item.sender_type === 'client' &&
              item.lu_at === null
            ) {
              actuel.messagesNonLus += 1
            }

            informationsMessages.set(item.conversation_id, actuel)
          }
        }

        const conversationsEnrichies: ConversationInbox[] =
          conversationsVisibles.map((conversation) => {
            const informations =
              informationsMessages.get(conversation.id)

            return {
              ...conversation,
              client: {
                nom: conversation.client_nom ?? null,
                telephone: conversation.client_telephone ?? null,
              },
              client_email: conversation.client_email ?? null,
              owner_type: conversation.owner_type ?? 'client',
              commande: conversation.commande_numero
                ? {
                    numero: conversation.commande_numero,
                    statut: conversation.commande_statut ?? null,
                    total: conversation.commande_total ?? null,
                  }
                : null,
              dernierMessage:
                informations?.dernierMessage ?? null,
              messagesNonLus:
                informations?.messagesNonLus ?? 0,
            }
          })

        if (actif) {
          setConversations(conversationsEnrichies)
        }
      } catch (error) {
        console.error('Assistance admin:', error)
        if (actif) {
          setErreur(
            error instanceof Error
              ? `Erreur Assistance : ${error.message}`
              : `Erreur Assistance : ${String(error)}`
          )
        }
      } finally {
        if (actif) setChargement(false)
      }
    }

    chargerConversations()

    const channel = supabase
      .channel('admin-assistance-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cs_assistance_conversations',
        },
        () => {
          chargerConversations()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cs_assistance_messages',
        },
        () => {
          chargerConversations()
        },
      )
      .subscribe()

    return () => {
      actif = false
      channel.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!conversationSelectionnee) {
      setMessages([])
      return
    }

    let actif = true
    let channel: ReturnType<typeof ecouterMessagesAssistance> | null = null

    async function chargerMessages() {
      try {
        setChargementMessages(true)
        const historique = await obtenirMessagesAssistance(
          conversationSelectionnee!.id,
        )

        if (!actif) return

        setMessages(historique)

        await marquerMessagesAssistanceLus(
          conversationSelectionnee!.id,
        )

        window.dispatchEvent(
          new Event('cs-assistance-compteur-refresh'),
        )

        channel = ecouterMessagesAssistance(
          conversationSelectionnee!.id,
          async () => {
            const nouveauxMessages = await obtenirMessagesAssistance(
              conversationSelectionnee!.id,
            )

            if (actif) {
              setMessages(nouveauxMessages)
            }
          },
        )
      } catch (error) {
        console.error('Messages assistance admin:', error)
        if (actif) {
          setErreur(
              error instanceof Error
                ? `Erreur Assistance : ${error.message}`
                : `Erreur Assistance : ${String(error)}`
            )
        }
      } finally {
        if (actif) setChargementMessages(false)
      }
    }

    chargerMessages()

    return () => {
      actif = false
      if (channel) channel.unsubscribe()
    }
  }, [conversationSelectionnee])

  async function fermer() {
    if (!conversationSelectionnee) return

    const conversationId = conversationSelectionnee.id

    try {
      await fermerConversationAssistanceAdmin(conversationId)

      // L'email est secondaire : une erreur ne doit jamais bloquer la fermeture.
      void notifierEmailAssistanceAdmin(
        'closed',
        conversationId,
      )

      setConversationSelectionnee(null)
      setMessages([])
    } catch (error) {
      console.error('Fermeture assistance:', error)
      setErreur("Impossible de fermer la conversation.")
    }
  }

  async function envoyer() {
    const texte = message.trim()

    if (!texte || !conversationSelectionnee || envoi) return

    setMessage('')
    setEnvoi(true)
    setErreur(null)

    try {
      const nouveauMessage = await envoyerReponseAssistanceAdmin(
        conversationSelectionnee.id,
        texte,
      )

      setMessages((anciens) => [...anciens, nouveauMessage])

      // L'email est secondaire : une erreur ne doit jamais bloquer le chat.
      void notifierEmailAssistanceAdmin(
        'reply',
        conversationSelectionnee.id,
        nouveauMessage.id,
      )
    } catch (error) {
      console.error('Réponse assistance:', error)
      setMessage(texte)
      setErreur("Impossible d'envoyer la réponse.")
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-136px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <aside className="flex w-[340px] shrink-0 flex-col border-r border-slate-200">
        <div className="border-b border-slate-100 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F5FB] text-[#0284C7]">
              <MessageCircle size={22} />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0B1E3D]">
                Assistance
              </h2>
              <p className="text-xs font-medium text-slate-400">
                Conversations clients
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chargement ? (
            <div className="flex justify-center py-12">
              <Loader2
                size={24}
                className="animate-spin text-[#0284C7]"
              />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <MessageCircle
                size={30}
                className="mx-auto mb-3 text-slate-300"
              />
              <p className="text-sm font-bold text-slate-500">
                Aucune conversation
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Les nouvelles demandes clients apparaîtront ici.
              </p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setConversationSelectionnee(conversation)}
                className={`w-full border-b border-slate-100 px-5 py-4 text-left transition ${
                  conversationSelectionnee?.id === conversation.id
                    ? 'bg-[#F0F9FF]'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <UserRound size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#0B1E3D]">
                      {conversation.client?.nom || 'Client'}
                    </p>
                    <p className="mt-1 truncate text-[11px] font-medium text-slate-400">
                      {conversation.client?.telephone || 'Téléphone non renseigné'}
                    </p>

                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-black ${
                          conversation.owner_type === 'visitor'
                            ? 'bg-orange-50 text-orange-600'
                            : 'bg-sky-50 text-sky-600'
                        }`}
                      >
                        {conversation.owner_type === 'visitor'
                          ? 'Visiteur'
                          : 'Client'}
                      </span>

                      {conversation.client_email && (
                        <span className="flex min-w-0 items-center gap-1 truncate text-[10px] text-slate-400">
                          <Mail size={11} />
                          {conversation.client_email}
                        </span>
                      )}
                    </div>
                    {conversation.commande?.numero && (
                      <p className="mt-1 truncate text-[11px] font-bold text-[#0284C7]">
                        Commande {conversation.commande.numero}
                      </p>
                    )}

                    {conversation.dernierMessage?.contenu && (
                      <p className="mt-1 truncate text-xs font-medium text-slate-500">
                        {conversation.dernierMessage.contenu}
                      </p>
                    )}

                    <p className="mt-1 text-[11px] font-medium text-slate-400">
                      {new Date(
                        conversation.last_message_at,
                      ).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {conversation.messagesNonLus > 0 && (
                    <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white">
                      {conversation.messagesNonLus > 99
                        ? '99+'
                        : conversation.messagesNonLus}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {!conversationSelectionnee ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#E8F5FB] text-[#0284C7]">
              <MessageCircle size={30} />
            </div>
            <h3 className="text-base font-black text-[#0B1E3D]">
              Assistance client
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
              Sélectionnez une conversation pour consulter les messages et
              répondre au client.
            </p>
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <UserRound size={18} />
                </div>
                <div>
                    <p className="text-sm font-black text-[#0B1E3D]">
                      {conversationSelectionnee.client?.nom || 'Client'}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400">
                      {conversationSelectionnee.client?.telephone ||
                        'Téléphone non renseigné'}
                    </p>

                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-black ${
                          conversationSelectionnee.owner_type === 'visitor'
                            ? 'bg-orange-50 text-orange-600'
                            : 'bg-sky-50 text-sky-600'
                        }`}
                      >
                        {conversationSelectionnee.owner_type === 'visitor'
                          ? 'Visiteur'
                          : 'Client'}
                      </span>

                      {conversationSelectionnee.client_email && (
                        <span className="flex min-w-0 items-center gap-1 text-[10px] text-slate-400">
                          <Mail size={11} />
                          {conversationSelectionnee.client_email}
                        </span>
                      )}
                    </div>
                    {conversationSelectionnee.commande?.numero && (
                      <p className="mt-1 text-[11px] font-bold text-[#0284C7]">
                        Commande {conversationSelectionnee.commande.numero}
                      </p>
                    )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {conversationSelectionnee.needs_human_reply && (
                  <div className="flex items-center gap-1.5 rounded-xl bg-orange-50 px-3 py-2 text-[11px] font-bold text-orange-600">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    Réponse requise
                  </div>
                )}

                <button
                  type="button"
                  onClick={fermer}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-200"
                >
                  <CheckCircle2 size={15} />
                  Fermer
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto bg-[#F8FAFC] p-5">
              {chargementMessages ? (
                <div className="flex justify-center py-10">
                  <Loader2
                    size={24}
                    className="animate-spin text-[#0284C7]"
                  />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-slate-400">
                    Aucun message.
                  </p>
                </div>
              ) : (
                messages.map((item) => {
                  const estClient = item.sender_type === 'client'

                  return (
                    <div
                      key={item.id}
                      className={`flex ${
                        estClient ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                          estClient
                            ? 'rounded-bl-md bg-white text-slate-700 shadow-sm'
                            : 'rounded-br-md bg-[#0284C7] text-white'
                        }`}
                      >
                        <p
                          className={`mb-1 text-[10px] font-bold ${
                            estClient
                              ? 'text-slate-500'
                              : 'text-white/80'
                          }`}
                        >
                          {estClient
                            ? `Client · ${conversationSelectionnee.client?.nom || 'Client'}`
                            : 'Assistance ChinaShop-Bénin'}
                        </p>
                        {item.contenu && <p>{item.contenu}</p>}

                        {item.has_attachment && item.attachment_path && (
                          <PieceJointeAdmin message={item} />
                        )}
                        <p
                          className={`mt-1 text-[9px] ${
                            estClient
                              ? 'text-slate-400'
                              : 'text-white/70'
                          }`}
                        >
                          {new Date(item.created_at).toLocaleString(
                            'fr-FR',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="border-t border-slate-200 bg-white p-4">
              {erreur && (
                <p className="mb-2 px-1 text-xs font-medium text-red-500">
                  {erreur}
                </p>
              )}

              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-[#0284C7]">
                <input
                  type="text"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      envoyer()
                    }
                  }}
                  placeholder="Répondre au client..."
                  disabled={envoi}
                  className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={envoyer}
                  disabled={!message.trim() || envoi}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0284C7] text-white transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Envoyer la réponse"
                >
                  {envoi ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
