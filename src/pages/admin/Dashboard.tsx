import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Box,
  CheckCircle2,
  Clock3,
  CreditCard,
  Package,
  RefreshCw,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { listerPaiementsAdmin, recupererCommandesAdminV2 } from '../../services/supabase'

type Commande = Record<string, any>

const STATUTS_TERMES = [
  'attente',
  'recue',
  'commande_recue',
  'confirmee',
  'preparation',
  'pret',
  'retire',
  'livree',
  'annulee',
]

function normaliser(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function montantCommande(commande: Commande) {
  return Number(
    commande.prix_total ??
      commande.montant_total ??
      commande.total ??
      commande.prix ??
      0,
  ) || 0
}

function dateCommande(commande: Commande) {
  const value =
    commande.created_at ??
    commande.date_creation ??
    commande.date_commande ??
    commande.createdAt

  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function estAujourdHui(commande: Commande) {
  const date = dateCommande(commande)
  if (!date) return false

  const maintenant = new Date()

  return (
    date.getFullYear() === maintenant.getFullYear() &&
    date.getMonth() === maintenant.getMonth() &&
    date.getDate() === maintenant.getDate()
  )
}

function formatMontant(value: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value))
}

function formatDate(value: unknown) {
  if (!value) return 'Date inconnue'

  const date = new Date(String(value))

  if (Number.isNaN(date.getTime())) {
    return 'Date inconnue'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function statutLabel(statut: string) {
  const labels: Record<string, string> = {
    attente: 'En attente',
    recue: 'Reçue',
    commande_recue: 'Commande reçue',
    confirmee: 'Confirmée',
    preparation: 'Préparation',
    pret: 'Prête',
    retire: 'Retirée',
    en_route: 'En livraison',
    arrivee: 'Arrivée',
    livree: 'Livrée',
    annulee: 'Annulée',
  }

  return labels[statut] || statut.replace(/_/g, ' ') || 'Inconnu'
}

function statutClasses(statut: string) {
  if (['livree', 'retire'].includes(statut)) {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (['annulee'].includes(statut)) {
    return 'bg-red-50 text-red-700'
  }

  if (['en_route', 'arrivee'].includes(statut)) {
    return 'bg-blue-50 text-blue-700'
  }

  if (['pret'].includes(statut)) {
    return 'bg-violet-50 text-violet-700'
  }

  if (['preparation', 'confirmee'].includes(statut)) {
    return 'bg-amber-50 text-amber-700'
  }

  return 'bg-slate-100 text-slate-600'
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  href,
  tone = 'blue',
}: {
  label: string
  value: string | number
  detail?: string
  icon: typeof ShoppingCart
  href?: string
  tone?: 'blue' | 'emerald' | 'amber' | 'violet' | 'slate'
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    slate: 'bg-slate-100 text-slate-600',
  }

  const content = (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg">
      <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-slate-50 transition-transform duration-300 group-hover:scale-125" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 truncate text-3xl font-black tracking-tight text-[#0B1E3D]">
            {value}
          </p>

          {detail && (
            <p className="mt-1.5 truncate text-xs font-semibold text-slate-500">
              {detail}
            </p>
          )}
        </div>

        <div
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tones[tone]} ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105`}
        >
          <Icon size={21} />
        </div>
      </div>

      {href && (
        <div className="relative mt-4 flex items-center gap-1 text-xs font-bold text-slate-400 transition-colors group-hover:text-[#0B1E3D]">
          Voir les détails
          <ArrowRight size={13} />
        </div>
      )}
    </div>
  )

  return href ? <Link to={href}>{content}</Link> : content
}

export default function Dashboard() {
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [paiementsEnAttente, setPaiementsEnAttente] = useState(0)
  const [chargement, setChargement] = useState(true)
  const [actualisation, setActualisation] = useState(false)
  const [erreur, setErreur] = useState('')

  const chargerDashboard = useCallback(async (silencieux = false) => {
    if (silencieux) {
      setActualisation(true)
    } else {
      setChargement(true)
    }

    setErreur('')

    try {
      const [resultat, paiements] = await Promise.all([
        recupererCommandesAdminV2(),
        listerPaiementsAdmin(),
      ])

      const liste =
        Array.isArray(resultat)
          ? resultat
          : Array.isArray((resultat as any)?.commandes)
            ? (resultat as any).commandes
            : Array.isArray((resultat as any)?.data)
              ? (resultat as any).data
              : []

      setCommandes(liste)

        const paiementsListe = Array.isArray(paiements) ? paiements : []
        const paiementsEnVerification = paiementsListe.filter((item: any) => {
          const statut = String(item?.paiement?.statut || '').trim().toLowerCase()
          return ['en_attente', 'initie', 'pending'].includes(statut)
        }).length

        setPaiementsEnAttente(paiementsEnVerification)
    } catch (error) {
      console.error('Erreur Dashboard admin:', error)
      setErreur(
        'Impossible de récupérer les données du tableau de bord.',
      )
    } finally {
      setChargement(false)
      setActualisation(false)
    }
  }, [])

  useEffect(() => {
    chargerDashboard()

    const intervalle = window.setInterval(() => {
      chargerDashboard(true)
    }, 30000)

    const actualiserAuRetour = () => {
      if (document.visibilityState === 'visible') {
        chargerDashboard(true)
      }
    }

    document.addEventListener('visibilitychange', actualiserAuRetour)

    return () => {
      window.clearInterval(intervalle)
      document.removeEventListener('visibilitychange', actualiserAuRetour)
    }
  }, [chargerDashboard])

  const statistiques = useMemo(() => {
    const total = commandes.length

    const aujourdHui = commandes.filter(estAujourdHui).length

    const attente = commandes.filter((commande) => {
      const statut = normaliser(commande.statut)
      return ['attente', 'recue', 'commande_recue'].includes(statut)
    }).length

    const traitement = commandes.filter((commande) => {
      const statut = normaliser(commande.statut)
      return ['confirmee', 'preparation'].includes(statut)
    }).length

    const pretes = commandes.filter(
      (commande) => normaliser(commande.statut) === 'pret',
    ).length

    const retirees = commandes.filter(
      (commande) => normaliser(commande.statut) === 'retire',
    ).length

    const livraisonsEnCours = commandes.filter((commande) => {
      const livraison = normaliser(commande.livraison_statut)

      return ['en_route', 'arrivee'].includes(livraison)
    }).length

    const retraitsPrets = commandes.filter((commande) => {
      const statut = normaliser(commande.statut)
      const mode = normaliser(commande.mode_reception)

      return statut === 'pret' && mode === 'retrait'
    }).length

    const chiffreAffaires = commandes.reduce(
      (totalMontant, commande) =>
        totalMontant + montantCommande(commande),
      0,
    )

    const chiffreAffairesJour = commandes
      .filter(estAujourdHui)
      .reduce(
        (totalMontant, commande) =>
          totalMontant + montantCommande(commande),
        0,
      )

    return {
      total,
      aujourdHui,
      attente,
      traitement,
      pretes,
      retirees,
      livraisonsEnCours,
      retraitsPrets,
      chiffreAffaires,
      chiffreAffairesJour,
      paiementsEnAttente,
    }
  }, [commandes, paiementsEnAttente])

  const commandesRecentes = useMemo(() => {
    return [...commandes]
      .sort((a, b) => {
        const da = dateCommande(a)?.getTime() || 0
        const db = dateCommande(b)?.getTime() || 0
        return db - da
      })
      .slice(0, 6)
  }, [commandes])

  const activite7Jours = useMemo(() => {
    const maintenant = new Date()

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(maintenant)
      date.setHours(0, 0, 0, 0)
      date.setDate(maintenant.getDate() - (6 - index))

      const count = commandes.filter((commande) => {
        const d = dateCommande(commande)
        if (!d) return false

        return (
          d.getFullYear() === date.getFullYear() &&
          d.getMonth() === date.getMonth() &&
          d.getDate() === date.getDate()
        )
      }).length

      return {
        label: new Intl.DateTimeFormat('fr-FR', {
          weekday: 'short',
        }).format(date),
        count,
      }
    })
  }, [commandes])

  const maximumActivite = Math.max(
    ...activite7Jours.map((jour) => jour.count),
    1,
  )

  return (
    <main className="min-h-screen bg-[#F6F8FB]">
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">

        {/* HEADER */}
        <section className="rounded-3xl bg-[#0284C7] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100">
                <Activity size={13} />
                Administration
              </div>

              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Tableau de bord
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Vue opérationnelle de AndyShop-Bénin : commandes,
                préparation, retraits, livraisons et activité commerciale.
              </p>
            </div>

            <button
              type="button"
              onClick={() => chargerDashboard(true)}
              disabled={actualisation}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-extrabold text-[#0B1E3D] shadow-sm transition hover:bg-slate-100 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={actualisation ? 'animate-spin' : ''}
              />
              {actualisation ? 'Actualisation…' : 'Actualiser'}
            </button>
          </div>
        </section>

        {/* ERREUR */}
        {erreur && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <XCircle size={19} />
            <span>{erreur}</span>
          </div>
        )}

        {/* KPI PRINCIPAUX */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Commandes"
            value={chargement ? '—' : statistiques.total}
            detail={`${statistiques.aujourdHui} aujourd'hui`}
            icon={ShoppingCart}
            href="/admin-cs2026/commandes"
            tone="blue"
          />

          <StatCard
            label="À traiter"
            value={chargement ? '—' : statistiques.attente}
            detail="Nouvelles commandes"
            icon={Clock3}
            href="/admin-cs2026/commandes"
            tone="amber"
          />

          <StatCard
            label="Paiements en attente"
            value={chargement ? '—' : statistiques.paiementsEnAttente}
            detail="À vérifier"
            icon={Clock3}
            href="/admin-cs2026/paiements"
            tone="amber"
          />

          <StatCard
            label="En préparation"
            value={chargement ? '—' : statistiques.traitement}
            detail="Commandes en traitement"
            icon={Package}
            href="/admin-cs2026/commandes"
            tone="violet"
          />

          <StatCard
            label="Prêtes"
            value={chargement ? '—' : statistiques.pretes}
            detail={`${statistiques.retraitsPrets} retrait(s) prêt(s)`}
            icon={CheckCircle2}
            href="/admin-cs2026/livraison"
            tone="emerald"
          />

          <StatCard
            label="Livraisons"
            value={chargement ? '—' : statistiques.livraisonsEnCours}
            detail="Trajets en cours"
            icon={Truck}
            href="/admin-cs2026/livraison"
            tone="blue"
          />
        </section>

        {/* CA + ACTIVITÉ */}
        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Wallet size={18} />
                  </div>

                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    Volume commercial
                  </p>
                </div>

                <h2 className="mt-3 text-xl font-black tracking-tight text-[#0B1E3D]">
                  Performance des commandes
                </h2>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-black">
                  {formatMontant(statistiques.chiffreAffaires)} FCFA
                </span>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-slate-200 hover:bg-slate-50">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                  Volume total
                </p>
                <p className="mt-2 text-lg font-black text-[#0B1E3D]">
                  {formatMontant(statistiques.chiffreAffaires)} FCFA
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 transition hover:bg-blue-50">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-blue-500">
                  Aujourd'hui
                </p>
                <p className="mt-2 text-lg font-black text-blue-800">
                  {formatMontant(statistiques.chiffreAffairesJour)} FCFA
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 transition hover:bg-emerald-50">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-600">
                  Retraits terminés
                </p>
                <p className="mt-2 text-lg font-black text-emerald-800">
                  {statistiques.retirees}
                </p>
              </div>
            </div>

            <div className="mt-7">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-[#0B1E3D]">
                    Activité des 7 derniers jours
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                    Nombre de commandes par jour
                  </p>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                  <BarChart3 size={16} />
                </div>
              </div>

              <div className="flex h-36 items-end gap-2 sm:gap-4">
                {activite7Jours.map((jour, index) => {
                  const hauteur =
                    jour.count === 0
                      ? 4
                      : Math.max(
                          12,
                          Math.round(
                            (jour.count / maximumActivite) * 100,
                          ),
                        )

                  return (
                    <div
                      key={`${jour.label}-${index}`}
                      className="group flex h-full flex-1 flex-col justify-end"
                    >
                      <div className="mb-2 text-center text-[11px] font-black text-slate-500">
                        {jour.count}
                      </div>

                      <div
                        className="rounded-t-lg bg-blue-500 transition-all duration-300 group-hover:bg-blue-600"
                        style={{ height: `${hauteur}%` }}
                        title={`${jour.count} commande(s)`}
                      />

                      <div className="mt-2 text-center text-[10px] font-black capitalize text-slate-400">
                        {jour.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* CENTRE OPÉRATIONNEL */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B1E3D] text-white">
                    <Activity size={17} />
                  </div>

                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    Centre opérationnel
                  </p>
                </div>

                <h2 className="mt-3 text-xl font-black tracking-tight text-[#0B1E3D]">
                  Priorités du moment
                </h2>

                <p className="mt-1 text-xs font-medium text-slate-400">
                  Vue rapide des actions à traiter
                </p>
              </div>

              <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 sm:flex">
                <Activity size={16} />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                to="/admin-cs2026/commandes"
                className="group/item flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50 hover:shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 transition-transform duration-200 group-hover/item:scale-105">
                    <Clock3 size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#0B1E3D]">
                      Commandes à traiter
                    </p>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                      Nouvelles commandes reçues
                    </p>
                  </div>
                </div>

                <span className="ml-3 flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 px-2 text-lg font-black text-amber-600">
                  {statistiques.attente}
                </span>
              </Link>

              <Link
                to="/admin-cs2026/livraison"
                className="group/item flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-transform duration-200 group-hover/item:scale-105">
                    <Package size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#0B1E3D]">
                      Commandes prêtes
                    </p>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                      Retrait ou expédition à organiser
                    </p>
                  </div>
                </div>

                <span className="ml-3 flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 px-2 text-lg font-black text-violet-600">
                  {statistiques.pretes}
                </span>
              </Link>

              <Link
                to="/admin-cs2026/livraison"
                className="group/item flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-transform duration-200 group-hover/item:scale-105">
                    <Truck size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#0B1E3D]">
                      Livraisons en cours
                    </p>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                      Trajets actuellement actifs
                    </p>
                  </div>
                </div>

                <span className="ml-3 flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 px-2 text-lg font-black text-blue-600">
                  {statistiques.livraisonsEnCours}
                </span>
              </Link>

              <Link
                to="/admin-cs2026/livraison"
                className="group/item flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-transform duration-200 group-hover/item:scale-105">
                    <CheckCircle2 size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#0B1E3D]">
                      Retraits disponibles
                    </p>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                      Clients pouvant récupérer leur commande
                    </p>
                  </div>
                </div>

                <span className="ml-3 flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 px-2 text-lg font-black text-emerald-600">
                  {statistiques.retraitsPrets}
                </span>
              </Link>
            </div>
          </div>

</section>

        {/* COMMANDES RÉCENTES */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                Activité récente
              </p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-[#0B1E3D]">
                Dernières commandes
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Les dernières commandes enregistrées
              </p>
            </div>

            <Link
              to="/admin-cs2026/commandes"
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-[#0B1E3D] hover:shadow-sm"
            >
              Toutes les commandes
              <ArrowRight size={14} />
            </Link>
          </div>

          {chargement ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm font-semibold text-slate-500">
              <RefreshCw size={18} className="animate-spin" />
              Chargement du tableau de bord…
            </div>
          ) : commandesRecentes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                <ShoppingCart size={28} />
              </div>
              <p className="mt-4 text-sm font-black text-slate-500">
                Aucune commande à afficher.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Commande
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Client
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Réception
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Statut
                    </th>
                    <th className="px-5 py-3.5 text-right text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Montant
                    </th>
                    <th className="px-5 py-3.5 text-right text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Date
                    </th>
                    <th className="w-16 px-5 py-3.5" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {commandesRecentes.map((commande, index) => {
                    const numero =
                      commande.numero ||
                      commande.numero_commande ||
                      `Commande ${index + 1}`

                    const statut = normaliser(commande.statut)

                    const client =
                      commande.nom_client ||
                      commande.client_nom ||
                      'Client'

                    const mode =
                      normaliser(commande.mode_reception) === 'retrait'
                        ? 'Retrait'
                        : 'Livraison'

                    return (
                      <tr
                        key={
                          commande.id ||
                          commande.numero ||
                          commande.numero_commande ||
                          index
                        }
                        className="group/row transition-colors duration-150 hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors duration-150 group-hover/row:bg-blue-50 group-hover/row:text-blue-600">
                              <ShoppingCart size={16} />
                            </div>
                            <p className="text-sm font-black text-[#0B1E3D]">
                              {numero}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[180px] truncate text-sm font-semibold text-slate-700">
                            {client}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600">
                            {mode}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${statutClasses(statut)}`}
                          >
                            {statutLabel(statut)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <p className="whitespace-nowrap text-sm font-black text-[#0B1E3D]">
                            {formatMontant(montantCommande(commande))} FCFA
                          </p>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <p className="whitespace-nowrap text-xs font-semibold text-slate-500">
                            {formatDate(
                              commande.created_at ||
                                commande.date_creation ||
                                commande.date_commande,
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            to="/admin-cs2026/commandes"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:text-[#0B1E3D] hover:shadow-sm"
                            aria-label={`Voir ${numero}`}
                          >
                            <ArrowRight size={15} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ACCÈS RAPIDES */}
        <section>
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Accès rapides
            </p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-[#0B1E3D]">
                  Gestion
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Les outils essentiels de votre activité
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/admin-cs2026/commandes"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="absolute right-0 top-0 h-20 w-20 -translate-y-8 translate-x-8 rounded-full bg-blue-50 transition-transform duration-300 group-hover:scale-125" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition-transform duration-200 group-hover:scale-105">
                  <ShoppingCart size={20} />
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-300 transition-all duration-200 group-hover:border-blue-100 group-hover:text-blue-600">
                  <ArrowRight size={14} />
                </div>
              </div>

              <p className="relative mt-5 text-sm font-black text-[#0B1E3D]">
                Commandes
              </p>
              <p className="relative mt-1.5 text-xs font-medium leading-5 text-slate-500">
                Piloter le workflow des commandes
              </p>
            </Link>

            <Link
              to="/admin-cs2026/livraison"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
            >
              <div className="absolute right-0 top-0 h-20 w-20 -translate-y-8 translate-x-8 rounded-full bg-emerald-50 transition-transform duration-300 group-hover:scale-125" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 transition-transform duration-200 group-hover:scale-105">
                  <Truck size={20} />
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-300 transition-all duration-200 group-hover:border-emerald-100 group-hover:text-emerald-600">
                  <ArrowRight size={14} />
                </div>
              </div>

              <p className="relative mt-5 text-sm font-black text-[#0B1E3D]">
                Logistique
              </p>
              <p className="relative mt-1.5 text-xs font-medium leading-5 text-slate-500">
                Livraisons et retraits
              </p>
            </Link>

            <Link
              to="/admin-cs2026/produits"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg"
            >
              <div className="absolute right-0 top-0 h-20 w-20 -translate-y-8 translate-x-8 rounded-full bg-violet-50 transition-transform duration-300 group-hover:scale-125" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100 transition-transform duration-200 group-hover:scale-105">
                  <Box size={20} />
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-300 transition-all duration-200 group-hover:border-violet-100 group-hover:text-violet-600">
                  <ArrowRight size={14} />
                </div>
              </div>

              <p className="relative mt-5 text-sm font-black text-[#0B1E3D]">
                Produits
              </p>
              <p className="relative mt-1.5 text-xs font-medium leading-5 text-slate-500">
                Catalogue et disponibilité
              </p>
            </Link>

            <Link
              to="/admin-cs2026/clients"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg"
            >
              <div className="absolute right-0 top-0 h-20 w-20 -translate-y-8 translate-x-8 rounded-full bg-amber-50 transition-transform duration-300 group-hover:scale-125" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100 transition-transform duration-200 group-hover:scale-105">
                  <Users size={20} />
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-300 transition-all duration-200 group-hover:border-amber-100 group-hover:text-amber-600">
                  <ArrowRight size={14} />
                </div>
              </div>

              <p className="relative mt-5 text-sm font-black text-[#0B1E3D]">
                Clients
              </p>
              <p className="relative mt-1.5 text-xs font-medium leading-5 text-slate-500">
                Suivi de la clientèle
              </p>
            </Link>
          </div>
        </section>

        {/* FOOTER ÉTAT */}
        <div className="flex flex-col gap-2 pb-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Tableau de bord opérationnel
          </div>

          <div className="flex items-center gap-2">
            <CreditCard size={13} />
            Données synchronisées automatiquement
          </div>
        </div>
      </div>
    </main>
  )
}
