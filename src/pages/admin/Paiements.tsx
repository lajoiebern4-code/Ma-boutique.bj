import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CreditCard,
  RefreshCw,
  Search,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import {
  listerPaiementsAdmin,
  obtenirPaiementAdmin,
  validerPaiementAdmin,
  refuserPaiementAdmin,
  supabase,
} from '../../services/supabase'

type Paiement = Record<string, any>
type Commande = Record<string, any>

type PaiementAdmin = {
  paiement: Paiement
  commande: Commande
}

function formatPrix(value: unknown) {
  return `${new Intl.NumberFormat('fr-FR').format(Number(value || 0))} FCFA`
}

function formatDate(value: unknown) {
  if (!value) return '—'

  const date = new Date(String(value))

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function statutInfo(statut: unknown) {
  const value = String(statut || '').toLowerCase()

  if (value === 'paye') {
    return {
      label: 'VALIDÉ',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    }
  }

  if (['echec', 'refuse', 'rejected', 'failed'].includes(value)) {
    return {
      label: 'REFUSÉ',
      className: 'bg-red-50 text-red-700 border-red-200',
      icon: XCircle,
    }
  }

  if (['en_attente', 'initie', 'pending'].includes(value)) {
    return {
      label: 'À VÉRIFIER',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock3,
    }
  }

  return {
    label: String(statut || 'INCONNU').toUpperCase(),
    className: 'bg-slate-50 text-slate-600 border-slate-200',
    icon: AlertCircle,
  }
}

function nomClient(commande: Commande) {
  return (
    commande.nom_client ||
    commande.client_nom ||
    commande.nom ||
    'Client'
  )
}

function numeroCommande(commande: Commande) {
  return (
    commande.numero_commande ||
    commande.numero ||
    commande.code_commande ||
    commande.id?.slice(0, 8) ||
    '—'
  )
}

export default function Paiements() {
  const [items, setItems] = useState<PaiementAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState('tous')
  const [paiementSelectionne, setPaiementSelectionne] =
    useState<PaiementAdmin | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [chargementDetail, setChargementDetail] = useState(false)
  const [erreurDetail, setErreurDetail] = useState('')
  const [actionPaiement, setActionPaiement] = useState<'valider' | 'refuser' | null>(null)
  const [motifRefus, setMotifRefus] = useState('')
  const [erreurAction, setErreurAction] = useState('')
const [refusOuvert, setRefusOuvert] = useState(false)

  const ouvrirDetail = useCallback(async (item: PaiementAdmin) => {
    const paiement = item.paiement || {}

    if (!paiement.id) return

    setPaiementSelectionne(item)
    setDetail(null)
    setErreurDetail('')
    setChargementDetail(true)

    try {
      const data = await obtenirPaiementAdmin(String(paiement.id))

      if (data?.paiement?.preuve_path && supabase) {
        const { data: signedData, error: signedError } = await supabase.storage
          .from('payment-proofs')
          .createSignedUrl(String(data.paiement.preuve_path), 600)

        if (signedError) {
          console.error('Erreur URL signée preuve paiement:', signedError)
        } else if (signedData?.signedUrl) {
          data.paiement.preuve_url = signedData.signedUrl
        }
      }

      console.log('DEBUG PREUVE PAIEMENT:', data?.paiement?.preuve_path, data?.paiement)
      setDetail(data)
    } catch (err) {
      console.error('Erreur détail paiement admin:', err)
      setErreurDetail(
        err instanceof Error
          ? err.message
          : 'Impossible de récupérer le détail du paiement.'
      )
    } finally {
      setChargementDetail(false)
    }
  }, [])

  const fermerDetail = useCallback(() => {
    setPaiementSelectionne(null)
    setDetail(null)
    setErreurDetail('')
  }, [])

  const charger = useCallback(async (refresh = false) => {
    try {
      setError('')

      if (refresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const data = await listerPaiementsAdmin()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Erreur chargement paiements admin:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de récupérer les paiements.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])


  const executerValidation = useCallback(async () => {
    const paiementId = detail?.paiement?.id

    if (!paiementId) return

    setActionPaiement('valider')
    setErreurAction('')

    try {
      const resultat = await validerPaiementAdmin(String(paiementId))

      if (!resultat?.success) {
        throw new Error(
          resultat?.error || 'Impossible de valider le paiement.'
        )
      }

      await charger(true)
      const data = await obtenirPaiementAdmin(String(paiementId))
      setDetail(data)
    } catch (err) {
      console.error('Erreur validation paiement:', err)
      setErreurAction(
        err instanceof Error
          ? err.message
          : 'Impossible de valider le paiement.'
      )
    } finally {
      setActionPaiement(null)
    }
  }, [detail?.paiement?.id, charger])

  const executerRefus = useCallback(async () => {
    const paiementId = detail?.paiement?.id
    const motif = motifRefus.trim()

    if (!paiementId) return

    if (motif.length < 3) {
      setErreurAction('Le motif du refus est obligatoire.')
      return
    }

    setActionPaiement('refuser')
    setErreurAction('')

    try {
      await refuserPaiementAdmin(String(paiementId), motif)
      setMotifRefus('')
      await charger(true)
      const data = await obtenirPaiementAdmin(String(paiementId))
      setDetail(data)
    } catch (err) {
      console.error('Erreur refus paiement:', err)
      setErreurAction(
        err instanceof Error
          ? err.message
          : 'Impossible de refuser le paiement.'
      )
    } finally {
      setActionPaiement(null)
    }
  }, [detail?.paiement?.id, motifRefus, charger])

  useEffect(() => {
    charger()
  }, [charger])

  const compteurs = useMemo(() => {
    let verification = 0
    let valides = 0
    let refuses = 0

    for (const item of items) {
      const statut = String(item.paiement?.statut || '').toLowerCase()

      if (statut === 'paye') {
        valides++
      } else if (['echec', 'refuse', 'rejected', 'failed'].includes(statut)) {
        refuses++
      } else {
        verification++
      }
    }

    return {
      tous: items.length,
      verification,
      valides,
      refuses,
    }
  }, [items])

  const paiementsFiltres = useMemo(() => {
    const query = recherche.trim().toLowerCase()

    return items.filter((item) => {
      const paiement = item.paiement || {}
      const commande = item.commande || {}
      const statut = String(paiement.statut || '').toLowerCase()

      const correspondFiltre =
        filtre === 'tous' ||
        (filtre === 'verification' &&
          ['en_attente', 'initie', 'pending'].includes(statut)) ||
        (filtre === 'valides' && statut === 'paye') ||
        (filtre === 'refuses' &&
          ['echec', 'refuse', 'rejected', 'failed'].includes(statut))

      if (!correspondFiltre) return false
      if (!query) return true

      const texte = [
        numeroCommande(commande),
        nomClient(commande),
        commande.telephone,
        paiement.telephone,
        paiement.provider,
        paiement.type,
        paiement.reference_transaction,
        paiement.reference_paiement,
        paiement.statut,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return texte.includes(query)
    })
  }, [items, filtre, recherche])

  const filtres = [
    {
      id: 'tous',
      label: 'Tous',
      count: compteurs.tous,
    },
    {
      id: 'verification',
      label: 'À vérifier',
      count: compteurs.verification,
    },
    {
      id: 'valides',
      label: 'Validés',
      count: compteurs.valides,
    },
    {
      id: 'refuses',
      label: 'Refusés',
      count: compteurs.refuses,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <CreditCard size={21} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Paiements
              </h1>
              <p className="text-sm text-slate-500">
                Suivi des paiements et vérification des transactions.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => charger(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={refreshing ? 'animate-spin' : ''}
          />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Total
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {compteurs.tous}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
            À vérifier
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {compteurs.verification}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
            Validés
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {compteurs.valides}
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Refusés
          </p>
          <p className="mt-1 text-2xl font-bold text-red-700">
            {compteurs.refuses}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filtres.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFiltre(item.id)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  filtre === item.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
                <span className="ml-2 opacity-70">{item.count}</span>
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Rechercher..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {paiementSelectionne && (
  <div className="border-b border-slate-200 bg-slate-50/80 p-5">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={fermerDetail}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
          aria-label="Fermer le détail"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Détail du paiement
          </p>
          <h2 className="text-lg font-bold text-slate-900">
            {numeroCommande(
              detail?.commande ||
                paiementSelectionne.commande ||
                {}
            )}
          </h2>
        </div>
      </div>

      {detail?.paiement && (
        <span
          className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
            statutInfo(detail.paiement.statut).className
          }`}
        >
          {statutInfo(detail.paiement.statut).label}
        </span>
      )}
    </div>

    {chargementDetail ? (
      <div className="flex min-h-40 items-center justify-center text-sm text-slate-500">
        Chargement du détail...
      </div>
    ) : erreurDetail ? (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {erreurDetail}
      </div>
    ) : detail ? (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Paiement
          </p>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Type</span>
              <span className="font-semibold text-slate-900">
                {detail.paiement?.type || '—'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Montant</span>
              <span className="font-bold text-slate-900">
                {formatPrix(detail.paiement?.montant)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Opérateur</span>
              <span className="font-semibold text-slate-900">
                {detail.paiement?.provider || '—'}
              </span>
            </div>
            <div>
              <p className="text-slate-500">Référence transaction</p>
              <p className="mt-1 break-all font-mono text-xs font-semibold text-slate-900">
                {detail.paiement?.reference_transaction ||
                  detail.paiement?.reference_paiement ||
                  '—'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Preuve de paiement</p>
              {detail.paiement?.preuve_url ? (
                <a
                  href={detail.paiement.preuve_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                >
                  <img
                    src={detail.paiement.preuve_url}
                    alt="Preuve de paiement"
                    className="max-h-[500px] w-full object-contain"
                  />
                </a>
              ) : (
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Aucune preuve disponible.
                </p>
              )}
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Téléphone</span>
              <span className="font-semibold text-slate-900">
                {detail.paiement?.telephone ||
                  detail.commande?.telephone ||
                  '—'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Créé le</span>
              <span className="text-right font-medium text-slate-700">
                {formatDate(detail.paiement?.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Commande & client
          </p>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Commande</span>
              <span className="font-bold text-slate-900">
                {numeroCommande(detail.commande || {})}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Client</span>
              <span className="text-right font-semibold text-slate-900">
                {nomClient(detail.commande || {})}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Téléphone</span>
              <span className="font-semibold text-slate-900">
                {detail.paiement?.telephone ||
                  detail.commande?.telephone ||
                  '—'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Statut commande</span>
              <span className="font-semibold text-slate-900">
                {detail.commande?.statut || '—'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Mode paiement</span>
              <span className="font-semibold text-slate-900">
                {detail.commande?.mode_paiement || '—'}
              </span>
            </div>
          </div>
        </div>

          {['en_attente', 'initie'].includes(
            String(detail.paiement?.statut || '').toLowerCase()
          ) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 md:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-slate-900">
                    Validation du paiement
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Vérifiez la référence et la preuve avant de valider.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={executerValidation}
                    disabled={actionPaiement !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 size={17} />
                    {actionPaiement === 'valider'
                      ? 'Validation...'
                      : 'Valider le paiement'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErreurAction('')
                      setMotifRefus('')
                      setRefusOuvert(true)
                    }}
                    disabled={actionPaiement !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XCircle size={17} />
                    Refuser le paiement
                  </button>
                </div>
              </div>

              {erreurAction && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
                  {erreurAction}
                </div>
              )}
            </div>
          )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Historique des actions
          </p>

          {Array.isArray(detail.journal) &&
          detail.journal.length > 0 ? (
            <div className="mt-3 divide-y divide-slate-100">
              {detail.journal.map(
                (entry: Record<string, any>) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {entry.action || 'Action'}
                      </p>
                      {entry.metadata?.motif && (
                        <p className="mt-1 text-sm text-slate-500">
                          Motif : {entry.metadata.motif}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              Aucune action enregistrée.
            </p>
          )}
        </div>
      </div>
    ) : null}
  </div>
)}

        {refusOuvert && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="refus-paiement-title"
          >
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <XCircle size={22} />
                  </div>

                  <h2
                    id="refus-paiement-title"
                    className="text-lg font-bold text-slate-900"
                  >
                    Refuser le paiement
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Indiquez clairement pourquoi ce paiement est refusé.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRefusOuvert(false)
                    setErreurAction('')
                    setMotifRefus('')
                  }}
                  disabled={actionPaiement !== null}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Fermer"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="motif-refus-paiement"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Motif du refus <span className="text-red-500">*</span>
                </label>

                <textarea
                  id="motif-refus-paiement"
                  value={motifRefus}
                  onChange={(event) => {
                    setMotifRefus(event.target.value)
                    if (erreurAction) setErreurAction('')
                  }}
                  disabled={actionPaiement !== null}
                  rows={5}
                  maxLength={500}
                  placeholder="Ex. Référence incorrecte, preuve illisible, montant différent..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Minimum 3 caractères
                  </span>
                  <span className="text-slate-400">
                    {motifRefus.length}/500
                  </span>
                </div>
              </div>

              {erreurAction && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {erreurAction}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setRefusOuvert(false)
                    setErreurAction('')
                    setMotifRefus('')
                  }}
                  disabled={actionPaiement !== null}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={executerRefus}
                  disabled={
                    actionPaiement !== null ||
                    motifRefus.trim().length < 3
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XCircle size={17} />
                  {actionPaiement === 'refuser'
                    ? 'Refus en cours...'
                    : 'Confirmer le refus'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-56 items-center justify-center text-sm text-slate-500">
            Chargement des paiements...
          </div>
        ) : paiementsFiltres.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <CreditCard size={30} className="text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">
              Aucun paiement trouvé
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Aucun paiement ne correspond aux critères actuels.
            </p>
          </div>
        ) : (

<div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {[
                    'Commande',
                    'Client',
                    'Téléphone',
                    'Type',
                    'Montant',
                    'Opérateur',
                    'Référence',
                    'Statut',
                    'Date',
                  ].map((title) => (
                    <th
                      key={title}
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paiementsFiltres.map((item) => {
                  const paiement = item.paiement || {}
                  const commande = item.commande || {}
                  const status = statutInfo(paiement.statut)
                  const StatusIcon = status.icon

                  return (
                    <tr
                      key={paiement.id}
                        onClick={() => ouvrirDetail(item)}
                      className="cursor-pointer transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-900">
                          {numeroCommande(commande)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-medium text-slate-700">
                          {nomClient(commande)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {paiement.telephone ||
                          commande.telephone ||
                          '—'}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase text-slate-600">
                          {paiement.type || '—'}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-bold text-slate-900">
                        {formatPrix(paiement.montant)}
                      </td>

                      <td className="px-4 py-4 text-sm font-medium text-slate-600">
                        {paiement.provider || '—'}
                      </td>

                      <td className="max-w-52 truncate px-4 py-4 font-mono text-xs text-slate-600">
                        {paiement.reference_transaction ||
                          paiement.reference_paiement ||
                          '—'}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}
                        >
                          <StatusIcon size={13} />
                          {status.label}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                        {formatDate(paiement.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
