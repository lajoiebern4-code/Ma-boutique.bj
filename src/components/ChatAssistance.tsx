import { useEffect, useRef, useState } from 'react'
import { X, Send, Loader2, Bot, Sparkles, ArrowRight, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  obtenirConversationAssistance,
  creerConversationAssistance,
  appelerRobotAssistance,
  envoyerMessageAssistance,
  creerVisiteurAssistance,
  ouvrirConversationVisiteurAssistance,
  obtenirVisiteurLocal,
} from '../services/assistance'

type Message = {
  id: string
  role: 'client' | 'assistant'
  contenu: string
}

type Props = {
  ouvert: boolean
  onFermer: () => void
}

const SUGGESTIONS = [
  'Quels sont les délais de livraison ?',
  'Comment payer ma commande ?',
  'Livrez-vous à Parakou ?',
  'Comment suivre ma commande ?',
]

export default function ChatAssistance({ ouvert, onFermer }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [texte, setTexte] = useState('')
  const [chargement, setChargement] = useState(true)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [robotReflechit, setRobotReflechit] = useState(false)

  // Identification visiteur
  const [besoinIdentification, setBesoinIdentification] = useState(false)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [identifEnCours, setIdentifEnCours] = useState(false)

  const messagesFin = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ouvert) return
    let actif = true

    async function init() {
      try {
        setChargement(true)
        setErreur('')

        const { data: session } = await supabase.auth.getSession()

        if (session.session?.user) {
          // Client connecté
          let conv = await obtenirConversationAssistance()
          if (!conv) conv = await creerConversationAssistance()
          if (actif && conv) {
            setConversationId(conv.id)
            await chargerHistorique(conv.id, actif)
          }
        } else {
          // Visiteur — vérifie s'il existe localement
          const visiteur = obtenirVisiteurLocal()
          if (visiteur) {
            const conv = await ouvrirConversationVisiteurAssistance()
            if (actif && conv) {
              setConversationId(conv.id)
              await chargerHistorique(conv.id, actif)
            }
          } else {
            if (actif) setBesoinIdentification(true)
          }
        }
      } catch (err) {
        if (actif) setErreur(err instanceof Error ? err.message : 'Erreur')
      } finally {
        if (actif) setChargement(false)
      }
    }

    async function chargerHistorique(convId: string, actif: boolean) {
      const { data: msgs } = await supabase
        .from('cs_assistance_messages')
        .select('id, sender_type, contenu, created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (actif && msgs) {
        setMessages(
          msgs
            .reverse()
            .filter((m) => m.sender_type === 'client' || m.sender_type === 'assistant')
            .map((m) => ({
              id: m.id,
              role: m.sender_type === 'client' ? ('client' as const) : ('assistant' as const),
              contenu: m.contenu,
            })),
        )
      }
    }

    void init()
    return () => {
      actif = false
    }
  }, [ouvert])

  useEffect(() => {
    if (messages.length > 0 || robotReflechit) {
      messagesFin.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, robotReflechit])

  async function identifier(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')

    const telPropre = telephone.replace(/\D/g, '')

    if (!nom.trim() || nom.trim().length < 2) {
      setErreur('Veuillez saisir votre nom (2 caractères minimum).')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setErreur('Veuillez saisir un email valide.')
      return
    }
    if (!/^01\d{8}$/.test(telPropre)) {
      setErreur('Numéro invalide. Format attendu : 01XXXXXXXX (10 chiffres).')
      return
    }

    setIdentifEnCours(true)

    try {
      await creerVisiteurAssistance(
        nom.trim(),
        telPropre,
        email.trim().toLowerCase(),
      )
      const conv = await ouvrirConversationVisiteurAssistance()
      setConversationId(conv.id)
      setBesoinIdentification(false)
    } catch (err) {
      setErreur(
        err instanceof Error ? err.message : "Impossible de démarrer la discussion.",
      )
    } finally {
      setIdentifEnCours(false)
    }
  }

  async function envoyer() {
    if (!conversationId || !texte.trim() || envoi) return

    const mon = texte.trim()
    setTexte('')
    setErreur('')

    setMessages((prev) => [...prev, { id: 'temp-' + Date.now(), role: 'client', contenu: mon }])
    setEnvoi(true)
    setRobotReflechit(true)

    try {
      await envoyerMessageAssistance(conversationId, mon)
      const reponse = await appelerRobotAssistance(conversationId, mon)

      if (reponse?.answer) {
        setMessages((prev) => [
          ...prev,
          { id: 'ia-' + Date.now(), role: 'assistant', contenu: reponse.answer! },
        ])
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur envoi')
    } finally {
      setEnvoi(false)
      setRobotReflechit(false)
    }
  }

  if (!ouvert) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onFermer}
    >
      <div
        className="flex h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-auto sm:max-h-[85vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center gap-3 bg-gradient-to-br from-[#1E1B2E] via-[#2A2344] to-[#3B2D5F] px-5 py-4 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/20">
            <Sparkles size={20} />
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-black">Assistant ChinaShop</p>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              En ligne · Réponse instantanée
            </p>
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {chargement ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#0F1B3D]" />
          </div>
        ) : besoinIdentification ? (
          /* Écran d'identification */
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF9F6] text-[#0F1B3D]">
                <Sparkles size={24} />
              </div>
              <h3 className="text-lg font-black text-[#1A1A2E]">Démarrer une discussion</h3>
              <p className="mt-1.5 text-[13px] leading-5 text-[#6B7280]">
                Renseignez vos coordonnées pour discuter avec notre assistant.
              </p>
            </div>

            <form onSubmit={identifier} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-[#1A1A2E]">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Votre nom"
                  disabled={identifEnCours}
                  className="h-12 w-full rounded-xl border border-[#FAF9F6] bg-[#FFFFFF] px-4 text-[13px] font-semibold text-[#1A1A2E] outline-none transition-all placeholder:text-[#9A93A5] focus:border-[#0F1B3D] focus:bg-white focus:ring-4 focus:ring-[#FAF9F6]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-[#1A1A2E]">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  disabled={identifEnCours}
                  className="h-12 w-full rounded-xl border border-[#FAF9F6] bg-[#FFFFFF] px-4 text-[13px] font-semibold text-[#1A1A2E] outline-none transition-all placeholder:text-[#9A93A5] focus:border-[#0F1B3D] focus:bg-white focus:ring-4 focus:ring-[#FAF9F6]"
                />
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-[#1A1A2E]">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="01XXXXXXXX"
                  inputMode="numeric"
                  maxLength={10}
                  disabled={identifEnCours}
                  className="h-12 w-full rounded-xl border border-[#FAF9F6] bg-[#FFFFFF] px-4 text-[13px] font-semibold text-[#1A1A2E] outline-none transition-all placeholder:text-[#9A93A5] focus:border-[#0F1B3D] focus:bg-white focus:ring-4 focus:ring-[#FAF9F6]"
                />
                <p className="mt-1 text-[10px] font-medium text-[#9A93A5]">
                  Format : 01XXXXXXXX (10 chiffres)
                </p>
              </div>
              </div>

              {erreur && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] font-semibold text-red-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{erreur}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={identifEnCours}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F1B3D] text-[13px] font-black text-white shadow-lg shadow-[#0F1B3D]/25 transition-all hover:bg-[#C9A24B] hover:text-[#0F1B3D] disabled:opacity-60"
              >
                {identifEnCours ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Démarrage…
                  </>
                ) : (
                  <>
                    Commencer la discussion
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-[#FFFFFF] px-4 py-4">
              {messages.length === 0 && (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF9F6] text-[#0F1B3D]">
                    <Bot size={22} />
                  </div>
                  <p className="text-sm font-bold text-[#1A1A2E]">Bonjour 👋</p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    Posez votre question, je réponds immédiatement.
                  </p>
                  <div className="mx-auto mt-5 flex max-w-sm flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTexte(s)}
                        className="rounded-full border border-[#FAF9F6] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#6B7280] transition-colors hover:border-[#0F1B3D]/30 hover:bg-[#FAF9F6] hover:text-[#0F1B3D]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === 'client' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 ${
                        m.role === 'client'
                          ? 'rounded-br-md bg-[#0F1B3D] !text-white'
                          : 'rounded-bl-md border border-[#FAF9F6] bg-white text-[#1A1A2E]'
                      }`}
                    >
                      {m.contenu}
                    </div>
                  </div>
                ))}

                {robotReflechit && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md border border-[#FAF9F6] bg-white px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9A93A5]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9A93A5] [animation-delay:120ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9A93A5] [animation-delay:240ms]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div ref={messagesFin} />
            </div>

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
                  className="min-h-[44px] w-full resize-none rounded-xl border border-[#FAF9F6] bg-[#FFFFFF] px-3.5 py-3 text-[13px] font-medium text-[#1A1A2E] outline-none transition-colors placeholder:text-[#9A93A5] focus:border-[#0F1B3D] focus:bg-white disabled:opacity-60"
                  style={{ maxHeight: 120 }}
                />
                <button
                  type="submit"
                  disabled={envoi || !texte.trim()}
                  className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-[#0F1B3D] !text-white shadow-md transition-all hover:bg-[#C9A24B] hover:text-[#0F1B3D] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {envoi ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
              {erreur && (
                <p className="mt-2 text-[11px] font-semibold text-red-600">{erreur}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
