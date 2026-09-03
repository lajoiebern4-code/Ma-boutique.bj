import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  MessageCircle,
  Send,
  Loader2,
  Headphones,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
} from 'lucide-react'
import {
  obtenirConversationAssistance,
  lierVisiteursAuCompteParEmail,
  creerConversationAssistance,
  creerVisiteurAssistance,
  ouvrirConversationVisiteurAssistance,
  rouvrirConversationVisiteurAssistance,
  obtenirMessagesAssistance,
  envoyerMessageAssistance,
  appelerRobotAssistance,
  ecouterMessagesAssistance,
  type AssistanceConversation,
  type AssistanceMessage,
} from '../services/assistance'
import { supabase } from '../lib/supabase'

const VISITOR_STORAGE_KEY = 'cs_assistance_visitor'

function visiteurExisteLocalement() {
  try {
    const raw = sessionStorage.getItem(VISITOR_STORAGE_KEY)

    if (!raw) return false

    const parsed = JSON.parse(raw)

    return (
      typeof parsed?.visitor_id === 'string' &&
      typeof parsed?.access_token === 'string'
    )
  } catch {
    return false
  }
}

export default function Assistance() {
  const [searchParams] = useSearchParams()
  const commandeId = searchParams.get('commandeId')

  const [conversation, setConversation] =
    useState<AssistanceConversation | null>(null)

  const [messages, setMessages] =
    useState<AssistanceMessage[]>([])

  const [message, setMessage] = useState('')
  const [fichier, setFichier] = useState<File | null>(null)

  const [chargement, setChargement] = useState(true)
  const [envoi, setEnvoi] = useState(false)

  const [erreur, setErreur] =
    useState<string | null>(null)

  const [sessionVerifiee, setSessionVerifiee] =
    useState(false)

  const [visiteurIdentifie, setVisiteurIdentifie] =
    useState(false)
  const [clientConnecte, setClientConnecte] = useState(false)

  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')

  const [creationVisiteur, setCreationVisiteur] =
    useState(false)

  useEffect(() => {
    let actif = true

    async function verifierAcces() {
      try {
        const { data, error } =
          await supabase.auth.getSession()

        if (error) throw error

        if (!actif) return

        if (data.session?.user) {
          setSessionVerifiee(true)
      setClientConnecte(true)
          setVisiteurIdentifie(false)
          return
        }

        const visiteurLocal =
          visiteurExisteLocalement()

        setSessionVerifiee(true)
        setVisiteurIdentifie(visiteurLocal)

        if (!visiteurLocal) {
          setChargement(false)
        }
      } catch (error) {
        console.error(
          'Vérification assistance:',
          error,
        )

        if (actif) {
          setErreur(
            'Impossible de vérifier votre accès à l’assistance.',
          )
          setChargement(false)
        }
      }
    }

    verifierAcces()

    return () => {
      actif = false
    }
  }, [])

  useEffect(() => {
    if (!sessionVerifiee || !visiteurIdentifie) {
      return
    }

    let actif = true
    let intervalle: ReturnType<typeof setInterval> | null = null
    let conversationId: string | null = null

    async function actualiserMessages() {
      if (!actif || !conversationId) return

      try {
        const nouveauxMessages =
          await obtenirMessagesAssistance(conversationId)

        if (!actif) return

        setMessages((anciens) => {
          if (
            anciens.length === nouveauxMessages.length &&
            anciens.length > 0 &&
            anciens[anciens.length - 1]?.id ===
              nouveauxMessages[nouveauxMessages.length - 1]?.id
          ) {
            return anciens
          }

          return nouveauxMessages
        })
      } catch (error) {
        console.error(
          'Assistance visiteur - actualisation:',
          error,
        )
      }
    }

    async function initialiserVisiteur() {
      try {
        setChargement(true)
        setErreur(null)

        const conv =
          await ouvrirConversationVisiteurAssistance(
            commandeId,
          )

        if (!actif) return

        conversationId = conv.id
        setConversation(conv)

        const historique =
          await obtenirMessagesAssistance(conv.id)

        if (!actif) return

        setMessages(historique)

        intervalle = setInterval(
          actualiserMessages,
          1000,
        )

      } catch (error) {
        console.error(
          'Assistance visiteur:',
          error,
        )

        if (actif) {
          setErreur(
            'Impossible de charger votre conversation.',
          )
        }
      } finally {
        if (actif) {
          setChargement(false)
        }
      }
    }

    initialiserVisiteur()

    return () => {
      actif = false

      if (intervalle) {
        clearInterval(intervalle)
      }
    }
  }, [
    sessionVerifiee,
    visiteurIdentifie,
    commandeId,
  ])

  useEffect(() => {
    if (!sessionVerifiee || visiteurIdentifie) {
      return
    }

    let actif = true
    let channelMessages:
      | ReturnType<typeof ecouterMessagesAssistance>
      | null = null

    let channelConversation:
      | ReturnType<typeof supabase.channel>
      | null = null

    async function initialiserClient() {
      try {
        setChargement(true)
        setErreur(null)

        await lierVisiteursAuCompteParEmail()

        const conv =
          await obtenirConversationAssistance(
            commandeId,
          )

        if (!conv) {
          if (actif) {
            setConversation(null)
          }

          return
        }

        if (!actif) return

        setConversation(conv)

        const historique =
          await obtenirMessagesAssistance(conv.id)

        if (!actif) return

        setMessages(historique)

        channelMessages = ecouterMessagesAssistance(
          conv.id,
          async () => {
            const nouveauxMessages =
              await obtenirMessagesAssistance(conv.id)

            if (actif) {
              setMessages(nouveauxMessages)
            }
          },
        )

        channelConversation = supabase
          .channel(`assistance-conversation-${conv.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'cs_assistance_conversations',
              filter: `id=eq.${conv.id}`,
            },
            (payload) => {
              if (!actif) return

              const nouvelleConversation =
                payload.new as AssistanceConversation

              setConversation((ancienne) => {
                if (!ancienne) return nouvelleConversation

                return {
                  ...ancienne,
                  ...nouvelleConversation,
                }
              })
            },
          )
          .subscribe()
      } catch (error) {
        console.error(
          'Assistance client:',
          error,
        )

        if (actif) {
          setErreur(
            'Impossible de charger votre conversation.',
          )
        }
      } finally {
        if (actif) {
          setChargement(false)
        }
      }
    }

    async function verifierClientOuVisiteur() {
      const { data } =
        await supabase.auth.getSession()

      if (data.session?.user) {
        initialiserClient()
      } else if (actif) {
        setChargement(false)
      }
    }

    verifierClientOuVisiteur()

    return () => {
      actif = false

      if (channelMessages) {
        channelMessages.unsubscribe()
      }

      if (channelConversation) {
        channelConversation.unsubscribe()
      }
    }
  }, [
    sessionVerifiee,
    visiteurIdentifie,
    commandeId,
  ])

  async function commencerDiscussion(
    event: React.FormEvent,
  ) {
    event.preventDefault()

    if (
      !nom.trim() ||
      !telephone.trim() ||
      creationVisiteur
    ) {
      return
    }

    try {
      setCreationVisiteur(true)
      setErreur(null)

      await creerVisiteurAssistance(
        nom,
        telephone,
        email || null,
      )

      setVisiteurIdentifie(true)
    } catch (error) {
      console.error(
        'Création visiteur:',
        error,
      )

      setErreur(
        error instanceof Error
          ? error.message
          : 'Impossible de commencer la discussion.',
      )
    } finally {
      setCreationVisiteur(false)
    }
  }

  async function rouvrir() {
    if (!conversation || conversation.statut !== 'closed') {
      return
    }

    try {
      setErreur(null)
      setChargement(true)

      await rouvrirConversationVisiteurAssistance(conversation.id)

      const conv = {
        ...conversation,
        statut: 'open' as const,
        updated_at: new Date().toISOString(),
        last_message_at: conversation.last_message_at,
      }

      setConversation(conv)

      const historique = await obtenirMessagesAssistance(conv.id)
      setMessages(historique)
    } catch (error) {
      console.error('Réouverture assistance:', error)

      setErreur(
        error instanceof Error
          ? error.message
          : 'Impossible de rouvrir la conversation.',
      )
    } finally {
      setChargement(false)
    }
  }

  async function envoyer() {
    const texte = message.trim()

    if (
      (!texte && !fichier) ||
      !conversation ||
      conversation.statut !== 'open' ||
      envoi
    ) {
      return
    }

    if (fichier && visiteurIdentifie) {
      setErreur(
        'Les pièces jointes seront bientôt disponibles pour les visiteurs.',
      )
      return
    }

    setMessage('')
    setEnvoi(true)
    setErreur(null)

    try {
      const nouveauMessage =
        await envoyerMessageAssistance(
          conversation.id,
          texte,
          fichier,
        )

      setMessages((anciens) => {
        if (
          anciens.some(
            (item) => item.id === nouveauMessage.id,
          )
        ) {
          return anciens
        }

        return [...anciens, nouveauMessage]
      })

      setFichier(null)

      // Le message client est déjà enregistré.
      // Le robot travaille ensuite sur la même conversation.
      try {
        console.log('🤖 ROBOT APPEL — début', {
          conversationId: conversation.id,
          message: texte,
        })

        const robotResult = await appelerRobotAssistance(
          conversation.id,
          texte,
        )

        console.log('🤖 ROBOT APPEL — résultat', robotResult)

        const messagesApresRobot =
          await obtenirMessagesAssistance(conversation.id)

        setMessages(messagesApresRobot)

        if (
          robotResult.status === 'human_requested' ||
          robotResult.status === 'human'
        ) {
          setErreur(null)
        }
      } catch (robotError) {
        console.error(
          '🤖 ROBOT ASSISTANCE — ERREUR',
          robotError,
        )
        setErreur(
          'DEBUG ROBOT ERREUR : ' +
          (
            robotError instanceof Error
              ? robotError.message
              : JSON.stringify(robotError, null, 2)
          )
        )
      }
    } catch (error) {
      console.error(
        'Envoi assistance:',
        error,
      )

      setMessage(texte)
      setErreur(
        error instanceof Error
          ? error.message
          : typeof error === 'object'
            ? JSON.stringify(error, null, 2)
            : String(error),
      )
    } finally {
      setEnvoi(false)
    }
  }

  const afficherFormulaireVisiteur =
    sessionVerifiee &&
    !clientConnecte &&
    !visiteurIdentifie &&
    !conversation

  if (
    chargement &&
    !afficherFormulaireVisiteur
  ) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-4xl items-center justify-center">
          <Loader2
            size={28}
            className="animate-spin text-orange-500"
          />
        </div>
      </div>
    )
  }

  if (afficherFormulaireVisiteur) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 px-4 py-8 dark:bg-slate-950">
        <div className="mx-auto max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-100 text-orange-600 dark:bg-orange-500/10">
                <Headphones size={30} />
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Assistance ChinaShop
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Avant de commencer, indiquez-nous
                quelques informations pour que notre
                équipe puisse vous identifier.
              </p>
            </div>

            <form
              onSubmit={commencerDiscussion}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nom *
                </label>

                <input
                  type="text"
                  value={nom}
                  onChange={(event) =>
                    setNom(event.target.value)
                  }
                  placeholder="Votre nom"
                  autoComplete="name"
                  disabled={creationVisiteur}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Téléphone / WhatsApp *
                </label>

                <input
                  type="tel"
                  value={telephone}
                  onChange={(event) =>
                    setTelephone(event.target.value)
                  }
                  placeholder="+229 XX XX XX XX"
                  autoComplete="tel"
                  disabled={creationVisiteur}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email
                  <span className="ml-1 text-slate-400">
                    (facultatif)
                  </span>
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="vous@example.com"
                  autoComplete="email"
                  disabled={creationVisiteur}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {erreur && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {erreur}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  !nom.trim() ||
                  !telephone.trim() ||
                  creationVisiteur
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creationVisiteur ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Connexion...
                  </>
                ) : (
                  <>
                    <MessageCircle size={18} />
                    Commencer la discussion
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-4xl flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/10">
              <Headphones size={23} />
            </div>

            <div>
              <h1 className="font-semibold text-slate-900 dark:text-white">
                Assistance ChinaShop
              </h1>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Notre équipe est là pour vous aider
              </p>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-hidden">
          {erreur && !conversation ? (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <p className="text-sm text-red-500">
                {erreur}
              </p>
            </div>
          ) : conversation ? (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-100 text-orange-600 dark:bg-orange-500/10">
                      <MessageCircle size={30} />
                    </div>

                    <h2 className="font-semibold text-slate-900 dark:text-white">
                      Bonjour 👋
                    </h2>

                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Bienvenue dans votre espace
                      d’assistance. Écrivez-nous votre
                      demande et notre équipe vous
                      répondra.
                    </p>
                  </div>
                )}

                {messages.map((item) => (
                  <div
                    key={item.id}
                    className={`flex ${
                      item.sender_type === 'client'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                        item.sender_type === 'client'
                          ? 'rounded-br-md bg-orange-500 text-white'
                          : 'rounded-bl-md bg-white text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200'
                      }`}
                    >
                      {item.contenu}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">              {conversation.statut === 'closed' ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <X size={22} />
                  </div>

                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Cette discussion est fermée.
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Vous pouvez la rouvrir pour continuer la conversation.
                  </p>

                  <button
                    type="button"
                    onClick={rouvrir}
                    disabled={chargement}
                    className="mt-4 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {chargement ? 'Réouverture...' : 'Rouvrir la discussion'}
                  </button>
                </div>
              ) : (
                <>
                {erreur && (
                  <p className="mb-2 px-2 text-xs text-red-500">
                    {erreur}
                  </p>
                )}

                {fichier && (
                  <div className="mb-2 flex items-center justify-between rounded-xl bg-orange-50 px-3 py-2 text-xs dark:bg-orange-500/10">
                    <span className="min-w-0 truncate text-slate-600 dark:text-slate-300">
                      📎 {fichier.name}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setFichier(null)
                      }
                      className="ml-3 shrink-0 font-bold text-red-500"
                      disabled={envoi}
                    >
                      Retirer
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-orange-400 dark:border-slate-700 dark:bg-slate-950">
                  <label
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition ${
                      visiteurIdentifie
                        ? 'cursor-not-allowed opacity-40'
                        : 'cursor-pointer hover:bg-orange-100 hover:text-orange-500 dark:hover:bg-orange-500/10'
                    }`}
                    aria-label="Joindre un fichier"
                  >
                    <Paperclip size={19} />

                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      disabled={
                        envoi ||
                        visiteurIdentifie
                      }
                      onChange={(event) => {
                        const selected =
                          event.target.files?.[0] ??
                          null

                        if (
                          selected &&
                          selected.size >
                            10 * 1024 * 1024
                        ) {
                          setErreur(
                            'Le fichier ne doit pas dépasser 10 Mo.',
                          )
                          event.target.value = ''
                          return
                        }

                        setErreur(null)
                        setFichier(selected)
                        event.target.value = ''
                      }}
                    />
                  </label>

                  <input
                    type="text"
                    value={message}
                    onChange={(event) =>
                      setMessage(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        envoyer()
                      }
                    }}
                    placeholder="Écrivez votre message..."
                    disabled={envoi}
                    className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={envoyer}
                    disabled={
                      (!message.trim() &&
                        !fichier) ||
                      envoi
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Envoyer"
                  >
                    {envoi ? (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>

                {visiteurIdentifie && (
                  <p className="mt-2 px-1 text-center text-[11px] text-slate-400">
                    Les pièces jointes seront
                    disponibles prochainement pour les
                    visiteurs.
                  </p>
                )}
                </>
              )}
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  )
}
