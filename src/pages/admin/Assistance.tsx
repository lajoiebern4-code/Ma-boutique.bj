import { useEffect, useState } from 'react'
import {
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Inbox,
  MessageSquare,
  UserRound,
  RefreshCw,
  Search,
  X,
  Filter,
  Bot,
  User,
} from 'lucide-react'
import {
  listerDemandesAssistance,
  repondreDemandeAssistance,
  marquerDemandeLue,
  envoyerEmailReponseDemande,
  type AssistanceDemande,
} from '../../services/assistance-demandes'
import {
  listerConversationsIA,
  obtenirMessagesConversationIA,
  type ConversationIA,
  type MessageIA,
  marquerConversationLue,
} from '../../services/assistance-messages'
import { envoyerReponseAssistanceAdmin } from '../../services/assistance'

type FiltreStatut = 'tous' | 'nouveau' | 'repondu'
type Onglet = 'demandes' | 'messages'

function formatDate(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const j = Math.floor(diff / 86400000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  if (h < 24) return `il y a ${h}h`
  if (j < 7) return `il y a ${j}j`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function formatHeure(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function AdminAssistance() {
  const [onglet, setOnglet] = useState<Onglet>('demandes')

  // Demandes
  const [demandes, setDemandes] = useState<AssistanceDemande[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState<FiltreStatut>('tous')
  const [recherche, setRecherche] = useState('')
  const [selection, setSelection] = useState<AssistanceDemande | null>(null)
  const [reponse, setReponse] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [succesMsg, setSuccesMsg] = useState('')

  // Conversations IA
  const [conversations, setConversations] = useState<ConversationIA[]>([])
  const [chargementConv, setChargementConv] = useState(false)
  const [convSelectionnee, setConvSelectionnee] = useState<ConversationIA | null>(null)
  const [messagesIA, setMessagesIA] = useState<MessageIA[]>([])
  const [chargementMsg, setChargementMsg] = useState(false)
  const [reponseIA, setReponseIA] = useState('')
  const [envoiIA, setEnvoiIA] = useState(false)
  const [succesIA, setSuccesIA] = useState('')
  const [erreurIA, setErreurIA] = useState('')

  async function charger() {
    setChargement(true)
    setErreur('')
    const r = await listerDemandesAssistance()
    if (r.success) setDemandes(r.data)
    else setErreur(r.error)
    setChargement(false)
  }

  async function chargerConversations() {
    setChargementConv(true)
    const r = await listerConversationsIA()
    if (r.success) setConversations(r.data)
    setChargementConv(false)
  }

  useEffect(() => {
    void charger()
  }, [])

  useEffect(() => {
    if (onglet === 'messages') {
      void chargerConversations()
    }
  }, [onglet])

  async function ouvrirConversation(c: ConversationIA) {
    setConvSelectionnee(c)
    setChargementMsg(true)
    setReponseIA('')
    setSuccesIA('')
    setErreurIA('')
    const r = await obtenirMessagesConversationIA(c.id)
    if (r.success) setMessagesIA(r.data)
    void marquerConversationLue(c.id)
    setConversations((prev) => prev.map((x) => (x.id === c.id ? { ...x, non_lu: false } : x)))
    setChargementMsg(false)
  }

  function fermerConversation() {
    setConvSelectionnee(null)
    setMessagesIA([])
    setReponseIA('')
    setSuccesIA('')
    setErreurIA('')
  }

  async function envoyerReponseIA() {
    if (!convSelectionnee) return
    if (reponseIA.trim().length < 2) {
      setErreurIA('Votre message doit contenir au moins 2 caractères.')
      return
    }

    setEnvoiIA(true)
    setErreurIA('')

    try {
      await envoyerReponseAssistanceAdmin(convSelectionnee.id, reponseIA.trim())
      setSuccesIA('Réponse envoyée au client.')
      setReponseIA('')

      const r = await obtenirMessagesConversationIA(convSelectionnee.id)
      if (r.success) setMessagesIA(r.data)

      setTimeout(() => setSuccesIA(''), 3000)
    } catch (err) {
      setErreurIA(err instanceof Error ? err.message : 'Erreur envoi')
    } finally {
      setEnvoiIA(false)
    }
  }

  function ouvrir(d: AssistanceDemande) {
    setSelection(d)
    setReponse(d.reponse || '')
    setSuccesMsg('')
    setErreur('')
    if (!d.lu) {
      void marquerDemandeLue(d.id)
      setDemandes((prev) => prev.map((x) => (x.id === d.id ? { ...x, lu: true } : x)))
    }
  }

  function fermerModal() {
    setSelection(null)
    setReponse('')
    setSuccesMsg('')
    setErreur('')
  }

  async function envoyerReponse() {
    if (!selection) return
    if (reponse.trim().length < 5) {
      setErreur('La réponse doit contenir au moins 5 caractères.')
      return
    }
    setEnvoi(true)
    setErreur('')
    try {
      const r = await repondreDemandeAssistance(selection.id, reponse.trim())
      if (!r.success) throw new Error(r.error)
      void envoyerEmailReponseDemande(selection.id)
      setSuccesMsg('Réponse envoyée au client par email.')
      setDemandes((prev) => prev.map((x) => (x.id === selection.id ? { ...x, ...r.data! } : x)))
      setSelection(r.data)
      setTimeout(() => setSuccesMsg(''), 4000)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setEnvoi(false)
    }
  }

  const demandesFiltrees = demandes.filter((d) => {
    if (filtre !== 'tous' && d.statut !== filtre) return false
    if (recherche.trim()) {
      const t = recherche.toLowerCase()
      return (
        d.nom.toLowerCase().includes(t) ||
        d.email.toLowerCase().includes(t) ||
        d.sujet.toLowerCase().includes(t) ||
        d.message.toLowerCase().includes(t)
      )
    }
    return true
  })

  const nbNouveaux = demandes.filter((d) => d.statut === 'nouveau').length

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Inbox size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 sm:text-xl">Assistance</h1>
              <p className="text-xs font-medium text-slate-500">
                {onglet === 'demandes'
                  ? `${demandes.length} demandes · ${nbNouveaux} non traitées`
                  : `${conversations.length} conversations IA`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => (onglet === 'demandes' ? void charger() : void chargerConversations())}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RefreshCw size={15} className={chargement || chargementConv ? 'animate-spin' : ''} />
            Rafraîchir
          </button>
        </div>

        <div className="mx-auto mt-4 flex max-w-5xl gap-1 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setOnglet('demandes')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition-all ${
              onglet === 'demandes'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Inbox size={15} />
            Demandes
            {nbNouveaux > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white">
                {nbNouveaux}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setOnglet('messages')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition-all ${
              onglet === 'messages'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Bot size={15} />
            Messages IA
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6 lg:p-8">
        {onglet === 'demandes' && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher (nom, email, sujet...)"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-medium outline-none transition-colors focus:border-violet-300 focus:bg-white"
                />
              </div>
              <div className="flex gap-1.5">
                {(
                  [
                    { v: 'tous', l: 'Toutes' },
                    { v: 'nouveau', l: 'Non traitées' },
                    { v: 'repondu', l: 'Répondues' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.v}
                    type="button"
                    onClick={() => setFiltre(f.v)}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-black transition-colors ${
                      filtre === f.v
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.l}
                  </button>
                ))}
              </div>
            </div>

            {chargement ? (
              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
                <Loader2 size={24} className="animate-spin text-violet-600" />
              </div>
            ) : demandesFiltrees.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
                <Inbox size={32} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-500">Aucune demande</p>
              </div>
            ) : (
              <div className="space-y-2">
                {demandesFiltrees.map((d) => (
                  <div
                    key={d.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => ouvrir(d)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') ouvrir(d)
                    }}
                    className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition-all active:scale-[0.99] ${
                      d.statut === 'nouveau' && !d.lu
                        ? 'border-violet-200 bg-white shadow-sm hover:border-violet-400 hover:shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {d.statut === 'nouveau' && !d.lu && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                        )}
                        <span className="truncate text-sm font-black text-slate-900">{d.nom}</span>
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-slate-400">
                        {formatDate(d.created_at)}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-[11px] font-semibold text-violet-700">{d.sujet}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{d.message}</p>
                    {d.statut === 'repondu' && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                        <CheckCircle2 size={10} />
                        Répondu
                      </span>
                    )}
                    <div className="mt-3 flex items-center justify-end">
                      <span className="text-[11px] font-bold text-violet-600">Ouvrir →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {onglet === 'messages' && (
          <>
            {chargementConv ? (
              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
                <Loader2 size={24} className="animate-spin text-violet-600" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
                <Bot size={32} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-500">Aucune conversation avec l'IA</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => void ouvrirConversation(c)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') void ouvrirConversation(c)
                    }}
                    className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all active:scale-[0.99] hover:border-violet-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                          <UserRound size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 truncate text-sm font-black text-slate-900">
                            {c.non_lu && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                            {c.visiteur_nom || 'Visiteur anonyme'}
                          </p>
                          {c.visiteur_email && (
                            <p className="truncate text-[11px] font-medium text-slate-500">
                              {c.visiteur_email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-[11px] font-medium text-slate-400">
                          {formatDate(c.dernier_message_at || c.updated_at)}
                        </span>
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black text-violet-700">
                          {c.nb_messages} msg
                        </span>
                      </div>
                    </div>
                    {c.dernier_message && (
                      <p className="mt-2 line-clamp-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        {c.dernier_message}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-end">
                      <span className="text-[11px] font-bold text-violet-600">
                        Voir la conversation →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL DEMANDE */}
      {selection && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={fermerModal}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                  <UserRound size={20} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-slate-900">{selection.nom}</p>
                  <a
                    href={`mailto:${selection.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline"
                  >
                    <Mail size={11} />
                    {selection.email}
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={fermerModal}
                aria-label="Fermer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {new Date(selection.created_at).toLocaleString('fr-FR')}
              </span>
              <span className="flex items-center gap-1">
                <Filter size={11} />
                Sujet : <strong className="text-violet-700">{selection.sujet}</strong>
              </span>
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                  selection.statut === 'repondu'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {selection.statut === 'repondu' ? 'Répondu' : 'Non traité'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Message du client
              </p>
              <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-800 whitespace-pre-wrap">
                {selection.message}
              </div>

              <p className="mb-2 mt-5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                {selection.reponse ? 'Votre réponse' : 'Votre réponse au client'}
              </p>
              <textarea
                value={reponse}
                onChange={(e) => setReponse(e.target.value)}
                placeholder="Écrivez votre réponse ici... Le client la recevra par email."
                rows={6}
                disabled={envoi}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-900 outline-none transition-colors focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Minimum 5 caractères</span>
                <span>{reponse.length} caractères</span>
              </div>

              {erreur && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{erreur}</span>
                </div>
              )}

              {succesMsg && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  <span>{succesMsg}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4">
              <button
                type="button"
                onClick={fermerModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => void envoyerReponse()}
                disabled={envoi || reponse.trim().length < 5}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {envoi ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Envoi…
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONVERSATION IA */}
      {convSelectionnee && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={fermerConversation}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-br from-[#1E1B2E] to-[#3B2D5F] px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                  <Bot size={20} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-black">
                    {convSelectionnee.visiteur_nom || 'Visiteur anonyme'}
                  </p>
                  <p className="truncate text-xs text-white/70">
                    {convSelectionnee.visiteur_email || 'Sans email'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={fermerConversation}
                aria-label="Fermer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {new Date(convSelectionnee.created_at).toLocaleString('fr-FR')}
              </span>
              <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase text-violet-700">
                {messagesIA.length} messages
              </span>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#FAF9FC] p-4">
              {chargementMsg ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={22} className="animate-spin text-violet-600" />
                </div>
              ) : messagesIA.length === 0 ? (
                <div className="py-16 text-center">
                  <MessageSquare size={28} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-500">Aucun message</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messagesIA.map((m) => {
                    const estClient = m.sender_type === 'client'
                    const estRobot = m.sender_type === 'robot'
                    const estAssist = m.sender_type === 'assistant'
                    return (
                      <div
                        key={m.id}
                        className={`flex items-start gap-2.5 ${
                          estClient ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!estClient && (
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                              estAssist
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-[#F1ECFA] text-[#7654C6]'
                            }`}
                          >
                            {estAssist ? <User size={13} /> : <Bot size={13} />}
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 ${
                            estClient
                              ? 'rounded-br-md bg-[#7654C6] text-white'
                              : estAssist
                                ? 'rounded-bl-md border border-emerald-200 bg-emerald-50 text-emerald-900'
                                : 'rounded-bl-md border border-[#E8E3EF] bg-white text-[#18151F]'
                          }`}
                        >
                          {estAssist && (
                            <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                              Vous (équipe)
                            </p>
                          )}
                          <p className="whitespace-pre-wrap">{m.contenu}</p>
                          <p
                            className={`mt-1 text-[10px] ${
                              estClient
                                ? 'text-white/60'
                                : estAssist
                                  ? 'text-emerald-700/70'
                                  : 'text-[#9A93A5]'
                            }`}
                          >
                            {formatHeure(m.created_at)}
                          </p>
                        </div>
                        {estClient && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8E3EF] text-[#6F687A]">
                            <User size={13} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-white p-4">
              <textarea
                value={reponseIA}
                onChange={(e) => setReponseIA(e.target.value)}
                placeholder="Répondez au client en tant qu'équipe..."
                rows={2}
                disabled={envoiIA}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-900 outline-none transition-colors focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
              />

              {erreurIA && (
                <p className="mt-2 text-[11px] font-semibold text-red-600">{erreurIA}</p>
              )}
              {succesIA && (
                <p className="mt-2 text-[11px] font-semibold text-emerald-600">{succesIA}</p>
              )}

              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={fermerConversation}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => void envoyerReponseIA()}
                  disabled={envoiIA || reponseIA.trim().length < 2}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {envoiIA ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Envoi…
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Répondre
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
