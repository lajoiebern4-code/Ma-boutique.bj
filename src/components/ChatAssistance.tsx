import { useEffect, useRef, useState } from 'react'
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  obtenirConversationAssistance,
  creerConversationAssistance,
  appelerRobotAssistance,
  envoyerMessageAssistance,
} from '../services/assistance'

type Message = {
  id: string
  role: 'client' | 'assistant'
  contenu: string
  created_at: string
}

type Props = {
  onTransferer?: () => void
}

const SUGGESTIONS = [
  'Quels sont les délais de livraison ?',
  'Comment payer ma commande ?',
  'Livrez-vous à Parakou ?',
  'Comment suivre ma commande ?',
]

export default function ChatAssistance({ onTransferer }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [texte, setTexte] = useState('')
  const [chargement, setChargement] = useState(true)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [robotReflechit, setRobotReflechit] = useState(false)

  const messagesFin = useRef<HTMLDivElement | null>(null)

  // Créer/récupérer la conversation
  useEffect(() => {
    let actif = true

    async function init() {
      try {
        setChargement(true)
        const { data: session } = await supabase.auth.getSession()
        if (!session.session?.user) {
          setErreur('Connectez-vous pour discuter avec notre assistant.')
          setChargement(false)
          return
        }

        let conv = await obtenirConversationAssistance()
        if (!conv) {
          conv = await creerConversationAssistance()
        }

        if (actif && conv) {
          setConversationId(conv.id)
          // Charger les messages existants
          const { data: msgs } = await supabase
            .from('cs_assistance_messages')
            .select('id, sender_type, contenu, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true })

          if (actif && msgs) {
            setMessages(
              msgs
                .filter((m) => m.sender_type === 'client' || m.sender_type === 'assistant')
                .map((m) => ({
                  id: m.id,
                  role: m.sender_type === 'client' ? ('client' as const) : ('assistant' as const),
                  contenu: m.contenu,
                  created_at: m.created_at,
                })),
            )
          }
        }
      } catch (err) {
        if (actif) setErreur(err instanceof Error ? err.message : 'Erreur')
      } finally {
        if (actif) setChargement(false)
      }
    }

    void init()
    return () => {
      actif = false
    }
  }, [])

  // Scroll automatique en bas
  useEffect(() => {
    messagesFin.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, robotReflechit])

  async function envoyer() {
    if (!conversationId || !texte.trim() || envoi) return

    const monMessage = texte.trim()
    setTexte('')
    setErreur('')

    // Ajouter mon message optimiste
    const tempId = 'temp-' + Date.now()
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: 'client', contenu: monMessage, created_at: new Date().toISOString() },
    ])

    setEnvoi(true)
    setRobotReflechit(true)

    try {
      await envoyerMessageAssistance(conversationId, monMessage)
      const reponse = await appelerRobotAssistance(conversationId, monMessage)

      if (reponse?.answer) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'ia-' + Date.now(),
            role: 'assistant',
            contenu: reponse.answer!,
            created_at: new Date().toISOString(),
          },
        ])
      }

      if (reponse?.status === 'human_requested' || reponse?.status === 'human') {
        setMessages((prev) => [
          ...prev,
          {
            id: 'sys-' + Date.now(),
            role: 'assistant',
            contenu:
              "Je vous mets en relation avec un membre de notre équipe. Vous pouvez aussi remplir le formulaire ci-dessous, nous vous répondrons par email sous 24h.",
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur envoi message')
    } finally {
      setEnvoi(false)
      setRobotReflechit(false)
    }
  }

  if (chargement) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-[#E8E3EF] bg-white py-12">
        <Loader2 size={22} className="animate-spin text-[#7654C6]" />
      </div>
    )
  }

  if (erreur && !conversationId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
        <Bot size={28} className="mx-auto text-amber-600" />
        <p className="mt-3 text-sm font-bold text-amber-900">{erreur}</p>
        <p className="mt-1 text-xs text-amber-700">
          Utilisez le formulaire ci-dessous ou WhatsApp.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8E3EF] bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#F0F0F2] bg-gradient-to-r from-[#F1ECFA] to-white px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7654C6] to-[#8B6DD1] text-white shadow-md">
          <Sparkles size={18} />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-black text-[#18151F]">Assistant ChinaShop</p>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            En ligne · Réponse instantanée
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="max-h-[400px] min-h-[240px] space-y-3 overflow-y-auto bg-[#FAF9FC] px-4 py-4">
        {messages.length === 0 && (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F1ECFA] text-[#7654C6]">
              <Bot size={22} />
            </div>
            <p className="text-sm font-bold text-[#18151F]">
              Bonjour 👋 Comment puis-je vous aider ?
            </p>
            <p className="mt-1 text-xs text-[#6F687A]">
              Posez votre question, je réponds immédiatement.
            </p>

            <div className="mx-auto mt-5 flex max-w-md flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTexte(s)}
                  className="rounded-full border border-[#E8E3EF] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#6F687A] transition-colors hover:border-[#7654C6]/30 hover:bg-[#F1ECFA] hover:text-[#7654C6]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.role === 'client' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F1ECFA] text-[#7654C6]">
                <Bot size={14} />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 ${
                m.role === 'client'
                  ? 'bg-[#7654C6] text-white'
                  : 'border border-[#E8E3EF] bg-white text-[#18151F]'
              }`}
            >
              {m.contenu}
            </div>
            {m.role === 'client' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8E3EF] text-[#6F687A]">
                <User size={14} />
              </div>
            )}
          </div>
        ))}

        {robotReflechit && (
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F1ECFA] text-[#7654C6]">
              <Bot size={14} />
            </div>
            <div className="rounded-2xl border border-[#E8E3EF] bg-white px-3.5 py-3">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9A93A5]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9A93A5] [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9A93A5] [animation-delay:240ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesFin} />
      </div>

      {/* Bouton transfert */}
      {messages.length > 0 && onTransferer && (
        <div className="border-t border-[#F0F0F2] bg-[#FAF9FC] px-4 py-2">
          <button
            type="button"
            onClick={onTransferer}
            className="text-[11px] font-bold text-[#7654C6] hover:text-[#6544B3]"
          >
            ⚡ Besoin d'un humain ? Envoyer une demande →
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[#F0F0F2] bg-white p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void envoyer()
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void envoyer()
              }
            }}
            placeholder="Écrivez votre question..."
            rows={1}
            disabled={envoi}
            className="min-h-[42px] w-full resize-none rounded-xl border border-[#E8E3EF] bg-[#FAF9FC] px-3.5 py-2.5 text-[13px] font-medium text-[#18151F] outline-none transition-colors placeholder:text-[#9A93A5] focus:border-[#7654C6] focus:bg-white disabled:opacity-60"
            style={{ maxHeight: 120 }}
          />
          <button
            type="submit"
            disabled={envoi || !texte.trim()}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#7654C6] text-white shadow-md transition-all hover:bg-[#6544B3] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {envoi ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
        {erreur && conversationId && (
          <p className="mt-2 text-[11px] font-semibold text-red-600">{erreur}</p>
        )}
      </div>
    </div>
  )
}
