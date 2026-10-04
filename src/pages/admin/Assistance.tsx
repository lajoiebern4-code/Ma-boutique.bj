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
  ChevronLeft,
  Filter,
} from 'lucide-react'
import {
  listerDemandesAssistance,
  repondreDemandeAssistance,
  marquerDemandeLue,
  envoyerEmailReponseDemande,
  type AssistanceDemande,
} from '../../services/assistance-demandes'

type FiltreStatut = 'tous' | 'nouveau' | 'repondu'

function formatDate(iso: string) {
  const d = new Date(iso)
  const maintenant = Date.now()
  const diff = maintenant - d.getTime()
  const min = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const j = Math.floor(diff / 86400000)

  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  if (h < 24) return `il y a ${h}h`
  if (j < 7) return `il y a ${j}j`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export default function AdminAssistance() {
  const [demandes, setDemandes] = useState<AssistanceDemande[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState<FiltreStatut>('tous')
  const [recherche, setRecherche] = useState('')
  const [selection, setSelection] = useState<AssistanceDemande | null>(null)
  const [reponse, setReponse] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [succesMsg, setSuccesMsg] = useState('')

  async function charger() {
    setChargement(true)
    setErreur('')
    const r = await listerDemandesAssistance()
    if (r.success) {
      setDemandes(r.data)
    } else {
      setErreur(r.error)
    }
    setChargement(false)
  }

  useEffect(() => {
    void charger()
  }, [])

  async function ouvrir(d: AssistanceDemande) {
    setSelection(d)
    setReponse(d.reponse || '')
    setSuccesMsg('')
    if (!d.lu) {
      void marquerDemandeLue(d.id)
      setDemandes((prev) =>
        prev.map((x) => (x.id === d.id ? { ...x, lu: true } : x)),
      )
    }
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
      setDemandes((prev) =>
        prev.map((x) => (x.id === selection.id ? { ...x, ...r.data! } : x)),
      )
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
      const terme = recherche.toLowerCase()
      return (
        d.nom.toLowerCase().includes(terme) ||
        d.email.toLowerCase().includes(terme) ||
        d.sujet.toLowerCase().includes(terme) ||
        d.message.toLowerCase().includes(terme)
      )
    }
    return true
  })

  const nbNouveaux = demandes.filter((d) => d.statut === 'nouveau').length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Inbox size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                Demandes d'assistance
              </h1>
              <p className="text-xs font-medium text-slate-500">
                {demandes.length} au total · {nbNouveaux} non traitées
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void charger()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RefreshCw size={15} className={chargement ? 'animate-spin' : ''} />
            Rafraîchir
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[400px_1fr] lg:p-8">
        {/* Colonne gauche : liste */}
        <div className="space-y-4">
          {/* Filtres */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="relative mb-3">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
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

          {/* Liste */}
          {chargement ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
              <Loader2 size={24} className="animate-spin text-violet-600" />
            </div>
          ) : demandesFiltrees.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
              <Inbox size={32} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-500">
                Aucune demande
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {demandesFiltrees.map((d) => {
                const actif = selection?.id === d.id
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => void ouvrir(d)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      actif
                        ? 'border-violet-300 bg-violet-50 shadow-md'
                        : d.statut === 'nouveau' && !d.lu
                          ? 'border-slate-200 bg-white shadow-sm hover:border-violet-200'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {d.statut === 'nouveau' && !d.lu && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                        )}
                        <span className="truncate text-sm font-black text-slate-900">
                          {d.nom}
                        </span>
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-slate-400">
                        {formatDate(d.created_at)}
                      </span>
                    </div>

                    <p className="mt-1.5 truncate text-[11px] font-semibold text-violet-700">
                      {d.sujet}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {d.message}
                    </p>

                    {d.statut === 'repondu' && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                        <CheckCircle2 size={10} />
                        Répondu
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Colonne droite : détail */}
        <div>
          {!selection ? (
            <div className="flex h-full min-h-[500px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
              <div className="text-center">
                <MessageSquare
                  size={40}
                  className="mx-auto text-slate-300"
                />
                <p className="mt-4 text-sm font-bold text-slate-500">
                  Sélectionnez une demande à gauche
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  pour lire et répondre au client
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* En-tête détail */}
              <div className="border-b border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                      <UserRound size={22} />
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-900">
                        {selection.nom}
                      </p>
                      <a
                        href={`mailto:${selection.email}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline"
                      >
                        <Mail size={11} />
                        {selection.email}
                      </a>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                      selection.statut === 'repondu'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {selection.statut === 'repondu' ? 'Répondu' : 'Non traité'}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(selection.created_at).toLocaleString('fr-FR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Filter size={11} />
                    Sujet : <strong className="text-violet-700">{selection.sujet}</strong>
                  </span>
                </div>
              </div>

              {/* Message du client */}
              <div className="border-b border-slate-200 p-5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Message du client
                </p>
                <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-800 whitespace-pre-wrap">
                  {selection.message}
                </div>
              </div>

              {/* Réponse */}
              <div className="p-5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {selection.reponse ? 'Votre réponse' : 'Votre réponse au client'}
                </p>

                <textarea
                  value={reponse}
                  onChange={(e) => setReponse(e.target.value)}
                  placeholder="Écrivez votre réponse ici... Le client la recevra par email."
                  rows={7}
                  disabled={envoi}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-900 outline-none transition-colors focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                />

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
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

                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelection(null)
                      setReponse('')
                      setErreur('')
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    <ChevronLeft size={14} />
                    Retour
                  </button>

                  <button
                    type="button"
                    onClick={() => void envoyerReponse()}
                    disabled={envoi || reponse.trim().length < 5}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {envoi ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Envoi…
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        Envoyer la réponse
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
