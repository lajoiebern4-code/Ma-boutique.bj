import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  ChevronRight,
  Heart,
  LogOut,
  Package,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { recupererMesCommandes } from '../services/supabase'
import {
  obtenirFavoris,
  supprimerFavori,
} from '../services/produits'

type Utilisateur = {
  id: string
  email?: string
  user_metadata?: {
    nom?: string
  }
}

type Profil = {
  user_id: string
  nom: string
  telephone: string | null
}

type Commande = {
  id?: string
  numero?: string
  created_at?: string
  statut?: string
  total?: number
  mode_reception?: string
  code_suivi?: string
  acompte_requis?: number
  acompte_paye?: number
}

type Favori = {
  id: string
  created_at?: string
  produit?: {
    id: string
    nom: string
    prix: number
    image_url?: string | null
  } | null
}

const statutLabels: Record<string, string> = {
  acompte_requis: 'Acompte requis',
  acompte_paye: 'Acompte reçu',
  commande_recue: 'Commande reçue',
  en_attente: 'En attente',
  en_attente_paiement: 'Paiement en attente',
  confirmee: 'Confirmée',
  preparation: 'Préparation',
  pret: 'Prête',
  expedition: 'Expédition',
  transit: 'En transit',
  en_cours_livraison: 'En livraison',
  livree: 'Livrée',
  annulee: 'Annulée',
}

function getStatutLabel(statut?: string) {
  const value = String(statut || 'en_attente').toLowerCase()
  return statutLabels[value] || statut || 'En attente'
}

function getStatutClass(statut?: string) {
  const value = String(statut || '').toLowerCase()

  if (value === 'livree') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
  }

  if (value === 'annulee') {
    return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
  }

  if (
    value === 'en_cours_livraison' ||
    value === 'expedition' ||
    value === 'transit'
  ) {
    return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
  }

  if (
    value === 'confirmee' ||
    value === 'commande_recue' ||
    value === 'preparation' ||
    value === 'pret'
  ) {
    return 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
  }

  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
}

function formatDate(date?: string) {
  if (!date) return 'Date indisponible'

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function formatMoney(value: number) {
  return `${Math.round(Number(value) || 0).toLocaleString('fr-FR')} FCFA`
}

export default function Compte() {
  const navigate = useNavigate()

  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [favoris, setFavoris] = useState<Favori[]>([])
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [chargement, setChargement] = useState(true)
  const [chargementFavoris, setChargementFavoris] = useState(false)
  const [chargementCommandes, setChargementCommandes] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true

    async function chargerCompte() {
      setChargement(true)
      setErreur('')

      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (!actif) return

      if (authError || !authData?.user) {
        setUtilisateur(null)
        setChargement(false)
        return
      }

      const user = authData.user as Utilisateur

      setUtilisateur(user)

      const { data: client, error: clientError } = await supabase
        .from('cs_clients')
        .select('user_id, nom, telephone')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!actif) return

      if (clientError) {
        console.error('Erreur chargement profil client:', clientError)
        setErreur('Impossible de charger votre profil.')
        setChargement(false)
        return
      }

      setProfil(client || null)

      await Promise.all([
        chargerFavoris(user.id),
        chargerCommandes(),
      ])

      if (actif) {
        setChargement(false)
      }
    }

    chargerCompte()

    return () => {
      actif = false
    }
  }, [])

  async function chargerFavoris(userId: string) {
    setChargementFavoris(true)

    try {
      const resultat = await obtenirFavoris(userId)
      setFavoris(resultat as Favori[])
    } catch (err) {
      console.error('Erreur chargement favoris:', err)
      setErreur('Impossible de charger vos favoris.')
    } finally {
      setChargementFavoris(false)
    }
  }

  async function chargerCommandes() {
    setChargementCommandes(true)

    try {
      const resultat = await recupererMesCommandes()

      if (!resultat.success) {
        throw new Error(
          resultat.error || 'Impossible de charger les commandes',
        )
      }

      setCommandes(resultat.data as Commande[])
    } catch (err) {
      console.error('Erreur chargement commandes:', err)
      setErreur('Impossible de charger vos commandes.')
    } finally {
      setChargementCommandes(false)
    }
  }

  async function retirerFavori(favoriId: string, produitId: string) {
    if (!utilisateur) return

    try {
      await supprimerFavori(produitId, utilisateur.id)

      setFavoris((actuels) =>
        actuels.filter((item) => item.id !== favoriId),
      )
    } catch (err) {
      console.error('Erreur suppression favori:', err)
      setErreur('Impossible de retirer ce favori.')
    }
  }

  async function deconnexion() {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  const nomClient =
    profil?.nom ||
    utilisateur?.user_metadata?.nom ||
    'Client ChinaShop'

  const initiales = nomClient
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((mot) => mot.charAt(0).toUpperCase())
    .join('')

  const statistiques = useMemo(() => {
    const enCours = commandes.filter((commande) => {
      const statut = String(commande.statut || '').toLowerCase()

      return !['livree', 'annulee'].includes(statut)
    }).length

    const livrees = commandes.filter(
      (commande) =>
        String(commande.statut || '').toLowerCase() === 'livree',
    ).length

    const acomptesRestants = commandes.reduce((total, commande) => {
      const requis = Number(commande.acompte_requis || 0)
      const paye = Number(commande.acompte_paye || 0)

      return total + Math.max(0, requis - paye)
    }, 0)

    return {
      total: commandes.length,
      enCours,
      livrees,
      acomptesRestants,
    }
  }, [commandes])

  if (chargement) {
    return (
      <section className="min-h-[calc(100vh-180px)] bg-[#F7F5F1] px-4 py-10 dark:bg-[#0B1220]">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-5">
            <div className="h-44 rounded-[2rem] bg-white dark:bg-[#111827]" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-2xl bg-white dark:bg-[#111827]"
                />
              ))}
            </div>
            <div className="h-72 rounded-[2rem] bg-white dark:bg-[#111827]" />
          </div>
        </div>
      </section>
    )
  }

  if (!utilisateur) {
    return (
      <section className="flex min-h-[calc(100vh-180px)] items-center justify-center bg-[#F7F5F1] px-4 py-12 dark:bg-[#0B1220]">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-700 dark:bg-[#111827]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
            <UserRound size={30} />
          </div>

          <h1 className="mt-6 text-2xl font-black text-[#0B1E3D] dark:text-white">
            Votre espace client
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Connectez-vous pour suivre vos commandes, gérer vos favoris
            et accéder à vos paramètres.
          </p>

          <Link
            to="/connexion"
            className="mt-7 flex h-12 items-center justify-center rounded-xl bg-[#0284C7] px-5 text-sm font-black text-white transition hover:bg-[#0369A1]"
          >
            Se connecter
          </Link>

          <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
            Pas encore de compte ?{' '}
            <Link
              to="/inscription"
              className="font-black text-orange-600"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-[calc(100vh-180px)] bg-[#F7F5F1] px-4 py-7 text-[#0B1E3D] dark:bg-[#0B1220] dark:text-white sm:px-6 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-6xl">
        {erreur && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <span>{erreur}</span>
            <button
              type="button"
              onClick={() => setErreur('')}
              className="font-black"
            >
              ×
            </button>
          </div>
        )}

        {/* HEADER PROFIL */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0B1E3D] p-5 text-white shadow-xl sm:p-7">
          <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-orange-500/20 blur-2xl" />
          <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-xl font-black shadow-lg sm:h-20 sm:w-20 sm:text-2xl">
                {initiales || 'CS'}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                  Espace client
                </p>

                <h1 className="mt-1 truncate text-2xl font-black sm:text-3xl">
                  Bonjour, {nomClient}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
                  {profil?.telephone && (
                    <span>{profil.telephone}</span>
                  )}

                  {utilisateur.email && (
                    <span className="truncate">
                      {utilisateur.email}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <ShieldCheck size={13} />
                    Compte actif
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/compte/parametres"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-black backdrop-blur transition hover:bg-white/15"
              >
                <Settings size={16} />
                Paramètres
              </Link>

              <button
                type="button"
                onClick={deconnexion}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-300/20 bg-red-500/10 px-4 text-xs font-black text-red-100 transition hover:bg-red-500/20"
              >
                <LogOut size={16} />
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        {/* STATISTIQUES */}
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#111827]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400">
                  Commandes
                </p>
                <p className="mt-1 text-2xl font-black">
                  {statistiques.total}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <ShoppingBag size={19} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#111827]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400">
                  En cours
                </p>
                <p className="mt-1 text-2xl font-black">
                  {statistiques.enCours}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Truck size={19} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#111827]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400">
                  Livrées
                </p>
                <p className="mt-1 text-2xl font-black">
                  {statistiques.livrees}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Package size={19} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#111827]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-400">
                  Acomptes restants
                </p>
                <p className="mt-1 truncate text-lg font-black">
                  {formatMoney(statistiques.acomptesRestants)}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <RefreshCw size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS RAPIDES */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/suivi"
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md dark:border-slate-700 dark:bg-[#111827]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Truck size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">Suivre une commande</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Consultez votre livraison
              </p>
            </div>
            <ChevronRight
              size={17}
              className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-500"
            />
          </Link>

          <Link
            to="/catalogue"
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md dark:border-slate-700 dark:bg-[#111827]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <ShoppingBag size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">Continuer mes achats</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Découvrir le catalogue
              </p>
            </div>
            <ChevronRight
              size={17}
              className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-500"
            />
          </Link>

          <Link
            to="/parrainage"
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md dark:border-slate-700 dark:bg-[#111827]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <UserRound size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">Parrainage</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Inviter un proche
              </p>
            </div>
            <ChevronRight
              size={17}
              className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-500"
            />
          </Link>

          <Link
            to="/compte/parametres/notifications"
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md dark:border-slate-700 dark:bg-[#111827]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
              <Bell size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">Notifications</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Gérer mes alertes
              </p>
            </div>
            <ChevronRight
              size={17}
              className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-500"
            />
          </Link>
        </div>

        {/* COMMANDES + FAVORIS */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                  <Package size={21} />
                </div>

                <div>
                  <h2 className="text-base font-black">
                    Mes commandes
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Vos commandes les plus récentes
                  </p>
                </div>
              </div>

              <Link
                to="/suivi"
                className="inline-flex items-center gap-1 text-xs font-black text-orange-600"
              >
                Tout voir
                <ArrowRight size={14} />
              </Link>
            </div>

            {chargementCommandes ? (
              <div className="mt-5 space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"
                  >
                    <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-3 h-3 w-48 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                ))}
              </div>
            ) : commandes.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-slate-50 px-5 py-8 text-center dark:bg-slate-800/70">
                <Package
                  size={30}
                  className="mx-auto text-slate-300"
                />
                <p className="mt-3 text-sm font-black">
                  Aucune commande
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Votre historique apparaîtra ici.
                </p>

                <Link
                  to="/catalogue"
                  className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#0284C7] px-4 text-xs font-black text-white"
                >
                  Découvrir les produits
                </Link>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {commandes.slice(0, 4).map((commande) => {
                  const total = Number(commande.total || 0)
                  const acompteRequis = Number(
                    commande.acompte_requis || 0,
                  )
                  const acomptePaye = Number(
                    commande.acompte_paye || 0,
                  )
                  const resteAcompte = Math.max(
                    0,
                    acompteRequis - acomptePaye,
                  )

                  return (
                    <div
                      key={commande.id || commande.numero}
                      className="rounded-2xl border border-slate-100 p-4 transition hover:border-orange-100 hover:bg-orange-50/30 dark:border-slate-700 dark:hover:bg-slate-800/60"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black">
                            {commande.numero || 'Commande'}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {formatDate(commande.created_at)}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black ${getStatutClass(commande.statut)}`}
                        >
                          {getStatutLabel(commande.statut)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-[11px] text-slate-400">
                            Total
                          </p>
                          <p className="mt-1 text-sm font-black">
                            {formatMoney(total)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-slate-400">
                            Réception
                          </p>
                          <p className="mt-1 text-sm font-bold">
                            {commande.mode_reception === 'livraison'
                              ? 'Livraison'
                              : 'Retrait'}
                          </p>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-[11px] text-slate-400">
                            Suivi
                          </p>
                          <p className="mt-1 truncate text-sm font-bold">
                            {commande.code_suivi ||
                              'En préparation'}
                          </p>
                        </div>
                      </div>

                      {resteAcompte > 0 && (
                        <div className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-xs dark:bg-orange-950/30">
                          <span className="font-bold text-slate-500 dark:text-slate-400">
                            Acompte restant :
                          </span>{' '}
                          <span className="font-black text-orange-600">
                            {formatMoney(resteAcompte)}
                          </span>
                        </div>
                      )}

                      {commande.code_suivi && (
                        <Link
                          to={`/suivi?code=${encodeURIComponent(commande.code_suivi)}`}
                          className="mt-3 flex h-10 items-center justify-center rounded-xl bg-[#0284C7] text-xs font-black text-white transition hover:bg-[#0369A1]"
                        >
                          Voir le suivi
                          <ArrowRight size={14} className="ml-1" />
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
                  <Heart size={21} />
                </div>

                <div>
                  <h2 className="text-base font-black">
                    Mes favoris
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Vos produits enregistrés
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                {favoris.length}
              </span>
            </div>

            {chargementFavoris ? (
              <div className="mt-5 space-y-3">
                {[1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-20 animate-pulse rounded-2xl bg-slate-50 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : favoris.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-8 text-center dark:bg-slate-800/70">
                <Heart
                  size={28}
                  className="mx-auto text-slate-300"
                />
                <p className="mt-3 text-sm font-black">
                  Aucun favori
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Enregistrez vos produits préférés.
                </p>

                <Link
                  to="/catalogue"
                  className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#0284C7] px-4 text-xs font-black text-white"
                >
                  Explorer
                </Link>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {favoris.slice(0, 5).map((favori) => {
                  const produit = favori.produit

                  if (!produit) return null

                  return (
                    <div
                      key={favori.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 p-2.5 dark:border-slate-700"
                    >
                      <Link
                        to={`/produit/${produit.id}`}
                        className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800"
                      >
                        {produit.image_url ? (
                          <img
                            src={produit.image_url}
                            alt={produit.nom}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[9px] text-slate-400">
                            Pas d'image
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/produit/${produit.id}`}
                          className="line-clamp-2 text-xs font-black transition hover:text-orange-600"
                        >
                          {produit.nom}
                        </Link>

                        <p className="mt-1 text-sm font-black text-orange-600">
                          {formatMoney(produit.prix)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          retirerFavori(favori.id, produit.id)
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500 transition hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
                        aria-label={`Retirer ${produit.nom} des favoris`}
                      >
                        <Heart size={16} fill="currentColor" />
                      </button>
                    </div>
                  )
                })}

                {favoris.length > 5 && (
                  <Link
                    to="/catalogue"
                    className="flex h-10 items-center justify-center rounded-xl border border-slate-200 text-xs font-black text-slate-600 transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    Voir tous mes favoris
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER COMPTE */}
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#111827] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <ShieldCheck size={19} />
            </div>

            <div>
              <p className="text-xs font-black">
                Votre espace est sécurisé
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Vos informations sont liées à votre compte authentifié.
              </p>
            </div>
          </div>

          <Link
            to="/compte/parametres/confidentialite"
            className="text-xs font-black text-orange-600 hover:text-orange-700"
          >
            Confidentialité →
          </Link>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          ChinaShop-Benin · Votre espace client
        </p>
      </div>
    </section>
  )
}
