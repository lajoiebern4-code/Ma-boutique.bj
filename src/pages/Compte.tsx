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
  preparation: 'En préparation',
  pret: 'Prête',
  expedition: 'En expédition',
  transit: 'En transit',
  en_cours_livraison: 'En cours de livraison',
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
        <div className="group relative overflow-hidden rounded-[2rem] border border-slate-800/60 bg-[#08172F] p-5 text-white shadow-[0_20px_60px_-25px_rgba(11,30,61,0.45)] sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl transition-transform duration-700 group-hover:scale-110" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.07),transparent_35%)]" />

          <div className="relative">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                <div className="relative shrink-0">
                  <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-orange-400 to-orange-600 text-xl font-black text-white shadow-[0_12px_30px_-10px_rgba(249,115,22,0.7)] ring-4 ring-white/10 sm:h-20 sm:w-20 sm:text-2xl">
                    {initiales || 'CS'}
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-4 border-[#08172F] bg-emerald-500">
                    <span className="h-2 w-2 rounded-full bg-white" />
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Espace client
                    </p>
                    <span className="h-1 w-1 rounded-full bg-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      ChinaShop-Bénin
                    </span>
                  </div>

                  <h1 className="mt-2 truncate text-2xl font-black tracking-tight sm:text-3xl lg:text-[2rem]">
                    Bonjour, {nomClient}
                  </h1>

                  <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                    {utilisateur.email && (
                      <span className="max-w-full truncate text-xs font-medium text-slate-300 sm:max-w-[280px]">
                        {utilisateur.email}
                      </span>
                    )}

                    {profil?.telephone && (
                      <>
                        <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:block" />
                        <span className="text-xs font-medium text-slate-300">
                          {profil.telephone}
                        </span>
                      </>
                    )}

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Compte actif
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                <Link
                  to="/compte/parametres"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-4 text-xs font-black text-white shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.12] hover:shadow-lg"
                >
                  <Settings size={16} />
                  Paramètres
                </Link>

                <button
                  type="button"
                  onClick={deconnexion}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-500/10 px-4 text-xs font-black text-red-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-400/25 hover:bg-red-500/15 hover:shadow-lg"
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold text-white/80">
                  Votre espace personnel
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Gérez vos commandes, votre suivi et vos préférences depuis un seul endroit.
                </p>
              </div>

              <div className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 sm:flex">
                <ShieldCheck size={14} className="text-emerald-400" />
                Compte sécurisé
              </div>
            </div>
          </div>
        </div>

        {/* STATISTIQUES */}
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_-18px_rgba(11,30,61,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_18px_40px_-20px_rgba(11,30,61,0.3)] dark:border-slate-700/80 dark:bg-[#111827]">
            <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-orange-500/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Commandes
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-[#0B1E3D] dark:text-white">
                  {statistiques.total}
                </p>
                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                  Total effectué
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] bg-orange-50 text-orange-600 ring-1 ring-orange-100 transition-transform duration-300 group-hover:scale-105 dark:bg-orange-950/40 dark:text-orange-400 dark:ring-orange-900/30">
                <ShoppingBag size={19} strokeWidth={2.2} />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_-18px_rgba(11,30,61,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_18px_40px_-20px_rgba(11,30,61,0.3)] dark:border-slate-700/80 dark:bg-[#111827]">
            <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-sky-500/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  En cours
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-[#0B1E3D] dark:text-white">
                  {statistiques.enCours}
                </p>
                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                  Commandes actives
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] bg-sky-50 text-sky-600 ring-1 ring-sky-100 transition-transform duration-300 group-hover:scale-105 dark:bg-sky-950/40 dark:text-sky-400 dark:ring-sky-900/30">
                <Truck size={19} strokeWidth={2.2} />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_-18px_rgba(11,30,61,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_18px_40px_-20px_rgba(11,30,61,0.3)] dark:border-slate-700/80 dark:bg-[#111827]">
            <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-emerald-500/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Livrées
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-[#0B1E3D] dark:text-white">
                  {statistiques.livrees}
                </p>
                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                  Commandes terminées
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 transition-transform duration-300 group-hover:scale-105 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900/30">
                <Package size={19} strokeWidth={2.2} />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_-18px_rgba(11,30,61,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_18px_40px_-20px_rgba(11,30,61,0.3)] dark:border-slate-700/80 dark:bg-[#111827]">
            <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-amber-500/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Acomptes restants
                </p>
                <p className="mt-2 truncate text-lg font-black tracking-tight text-[#0B1E3D] dark:text-white">
                  {formatMoney(statistiques.acomptesRestants)}
                </p>
                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                  Solde disponible
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] bg-amber-50 text-amber-600 ring-1 ring-amber-100 transition-transform duration-300 group-hover:scale-105 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900/30">
                <RefreshCw size={18} strokeWidth={2.2} />
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS RAPIDES */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/mes-commandes"
            className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_-18px_rgba(11,30,61,0.3)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_18px_40px_-18px_rgba(11,30,61,0.3)] dark:border-slate-700/80 dark:bg-[#111827]"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-sky-500/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.9rem] bg-sky-50 text-sky-600 ring-1 ring-sky-100 transition-transform duration-300 group-hover:scale-105 dark:bg-sky-950/40 dark:text-sky-400 dark:ring-sky-900/30">
                <Truck size={20} strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#0B1E3D] dark:text-white">
                  Suivre une commande
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Consultez votre livraison
                </p>
              </div>
              <ChevronRight
                size={17}
                strokeWidth={2.2}
                className="shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-sky-500"
              />
            </div>
          </Link>

          <Link
            to="/catalogue"
            className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_-18px_rgba(11,30,61,0.3)] transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_18px_40px_-18px_rgba(11,30,61,0.3)] dark:border-slate-700/80 dark:bg-[#111827]"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.9rem] bg-orange-50 text-orange-600 ring-1 ring-orange-100 transition-transform duration-300 group-hover:scale-105 dark:bg-orange-950/40 dark:text-orange-400 dark:ring-orange-900/30">
                <ShoppingBag size={20} strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#0B1E3D] dark:text-white">
                  Continuer mes achats
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Découvrir le catalogue
                </p>
              </div>
              <ChevronRight
                size={17}
                strokeWidth={2.2}
                className="shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-orange-500"
              />
            </div>
          </Link>

          <Link
            to="/parrainage"
            className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_-18px_rgba(11,30,61,0.3)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_18px_40px_-18px_rgba(11,30,61,0.3)] dark:border-slate-700/80 dark:bg-[#111827]"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.9rem] bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 transition-transform duration-300 group-hover:scale-105 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900/30">
                <UserRound size={20} strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#0B1E3D] dark:text-white">
                  Parrainage
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Inviter un proche
                </p>
              </div>
              <ChevronRight
                size={17}
                strokeWidth={2.2}
                className="shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-emerald-500"
              />
            </div>
          </Link>

          <Link
            to="/compte/parametres/notifications"
            className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_-18px_rgba(11,30,61,0.3)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_18px_40px_-18px_rgba(11,30,61,0.3)] dark:border-slate-700/80 dark:bg-[#111827]"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.9rem] bg-violet-50 text-violet-600 ring-1 ring-violet-100 transition-transform duration-300 group-hover:scale-105 dark:bg-violet-950/40 dark:text-violet-400 dark:ring-violet-900/30">
                <Bell size={20} strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#0B1E3D] dark:text-white">
                  Notifications
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Gérer mes alertes
                </p>
              </div>
              <ChevronRight
                size={17}
                strokeWidth={2.2}
                className="shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-violet-500"
              />
            </div>
          </Link>
        </div>

        {/* COMMANDES + FAVORIS */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_-24px_rgba(11,30,61,0.35)] dark:border-slate-700/80 dark:bg-[#111827] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-950/40 dark:text-orange-400 dark:ring-orange-900/30">
                  <Package size={21} strokeWidth={2.2} />
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-black tracking-tight text-[#0B1E3D] dark:text-white">
                    Mes commandes
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-400">
                    Vos commandes les plus récentes
                  </p>
                </div>
              </div>

              <Link
                to="/mes-commandes"
                className="group inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-black text-orange-600 transition-all hover:bg-orange-50 dark:hover:bg-orange-950/30"
              >
                Tout voir
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            {chargementCommandes ? (
              <div className="mt-5 space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                        <div className="mt-3 h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                      </div>
                      <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
                      <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
                      <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : commandes.length === 0 ? (
              <div className="mt-5 rounded-[1.35rem] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-800/60">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm dark:bg-slate-900 dark:text-slate-600">
                  <Package size={29} strokeWidth={1.8} />
                </div>
                <p className="mt-4 text-sm font-black text-[#0B1E3D] dark:text-white">
                  Aucune commande
                </p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-400">
                  Votre historique de commandes apparaîtra ici.
                </p>

                <Link
                  to="/catalogue"
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#0B1E3D] px-4 text-xs font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#102B55] hover:shadow-md"
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
                      className="group rounded-[1.35rem] border border-slate-100 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_12px_30px_-20px_rgba(11,30,61,0.35)] dark:border-slate-700 dark:bg-slate-900/30 dark:hover:border-orange-900/60 dark:hover:bg-slate-800/60"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black tracking-tight text-[#0B1E3D] dark:text-white">
                            {commande.numero || 'Commande'}
                          </p>
                          <p className="mt-1 text-[10px] font-medium text-slate-400">
                            {formatDate(commande.created_at)}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black ${getStatutClass(commande.statut)}`}
                        >
                          {getStatutLabel(commande.statut)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <div className="rounded-xl bg-slate-50/90 px-3 py-2.5 dark:bg-slate-800/70">
                          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                            Total
                          </p>
                          <p className="mt-1 text-sm font-black text-[#0B1E3D] dark:text-white">
                            {formatMoney(total)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50/90 px-3 py-2.5 dark:bg-slate-800/70">
                          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                            Réception
                          </p>
                          <p className="mt-1 text-sm font-bold text-[#0B1E3D] dark:text-white">
                            {commande.mode_reception === 'livraison'
                              ? 'Livraison'
                              : 'Retrait'}
                          </p>
                        </div>

                        <div className="col-span-2 rounded-xl bg-slate-50/90 px-3 py-2.5 dark:bg-slate-800/70 sm:col-span-1">
                          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                            Suivi
                          </p>
                          <p className="mt-1 truncate text-sm font-bold text-[#0B1E3D] dark:text-white">
                            {commande.code_suivi || 'En préparation'}
                          </p>
                        </div>
                      </div>

                      {resteAcompte > 0 && (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50/70 px-3 py-2.5 dark:border-orange-900/30 dark:bg-orange-950/20">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            Acompte restant
                          </span>
                          <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                            {formatMoney(resteAcompte)}
                          </span>
                        </div>
                      )}

                      {commande.code_suivi && (
                        <Link
                          to={`/suivi?code=${encodeURIComponent(commande.code_suivi)}`}
                          className="mt-3 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#0B1E3D] text-xs font-black text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#102B55] hover:shadow-md"
                        >
                          Voir le suivi
                          <ArrowRight size={14} />
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="group rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_-24px_rgba(11,30,61,0.35)] dark:border-slate-700/80 dark:bg-[#111827] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] bg-rose-50 text-rose-500 ring-1 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-900/30">
                  <Heart size={21} strokeWidth={2.2} />
                  {favoris.length > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-sm">
                      {favoris.length}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-black tracking-tight text-[#0B1E3D] dark:text-white">
                    Mes favoris
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-400">
                    Vos produits enregistrés
                  </p>
                </div>
              </div>

              {favoris.length > 0 && (
                <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black text-rose-600 ring-1 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900/30">
                  {favoris.length} {favoris.length === 1 ? 'article' : 'articles'}
                </span>
              )}
            </div>

            {chargementFavoris ? (
              <div className="mt-5 space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-[1.25rem] border border-slate-100 bg-slate-50/80 p-2.5 animate-pulse dark:border-slate-700 dark:bg-slate-800/70"
                  >
                    <div className="h-16 w-16 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-700" />
                    <div className="min-w-0 flex-1">
                      <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="mt-2 h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700" />
                  </div>
                ))}
              </div>
            ) : favoris.length === 0 ? (
              <div className="mt-5 rounded-[1.35rem] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-800/60">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-200 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:text-rose-900 dark:ring-slate-800">
                  <Heart size={29} strokeWidth={1.8} />
                </div>

                <p className="mt-4 text-sm font-black tracking-tight text-[#0B1E3D] dark:text-white">
                  Aucun favori pour le moment
                </p>

                <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-400">
                  Enregistrez vos produits préférés pour les retrouver rapidement.
                </p>

                <Link
                  to="/catalogue"
                  className="mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#0B1E3D] px-4 text-xs font-black text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#102B55] hover:shadow-md"
                >
                  Explorer le catalogue
                  <ArrowRight size={14} />
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
                      className="group/item flex items-center gap-3 rounded-[1.25rem] border border-slate-100 bg-white p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-[0_12px_30px_-20px_rgba(11,30,61,0.35)] dark:border-slate-700 dark:bg-slate-900/30 dark:hover:border-rose-900/60 dark:hover:bg-slate-800/60"
                    >
                      <Link
                        to={`/produit/${produit.id}`}
                        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/70 dark:bg-slate-800 dark:ring-slate-700"
                      >
                        {produit.image_url ? (
                          <img
                            src={produit.image_url}
                            alt={produit.nom}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover/item:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[9px] font-medium text-slate-400">
                            Pas d'image
                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover/item:opacity-100" />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/produit/${produit.id}`}
                          className="line-clamp-2 text-xs font-black leading-5 text-[#0B1E3D] transition-colors hover:text-orange-600 dark:text-white dark:hover:text-orange-400"
                        >
                          {produit.nom}
                        </Link>

                        <p className="mt-1 text-sm font-black text-orange-600 dark:text-orange-400">
                          {formatMoney(produit.prix)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          retirerFavori(favori.id, produit.id)
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500 transition-all duration-200 hover:scale-105 hover:bg-rose-100 hover:text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/50"
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
                    className="group flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:text-orange-600 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-300 dark:hover:border-orange-900/50 dark:hover:text-orange-400"
                  >
                    Voir tous mes favoris
                    <ArrowRight
                      size={14}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </Link>
                )}
              </div>
            )}
          </div>        </div>

        {/* FOOTER COMPTE */}
        <div className="group relative mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-[0_10px_35px_-24px_rgba(11,30,61,0.35)] transition-all duration-300 hover:shadow-[0_16px_45px_-25px_rgba(11,30,61,0.4)] dark:border-slate-700/80 dark:bg-[#111827] sm:p-5">
          <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-emerald-400/5 blur-3xl transition-transform duration-700 group-hover:scale-125" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900/30">
                <ShieldCheck size={20} strokeWidth={2.2} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-black tracking-tight text-[#0B1E3D] dark:text-white">
                    Votre espace est sécurisé
                  </p>

                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900/30">
                    Compte protégé
                  </span>
                </div>

                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  Vos informations sont liées à votre compte authentifié.
                </p>
              </div>
            </div>

            <Link
              to="/compte/parametres/confidentialite"
              className="group/link inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-[11px] font-black text-[#0B1E3D] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-orange-900/50 dark:hover:bg-orange-950/20 dark:hover:text-orange-400"
            >
              Confidentialité
              <ArrowRight
                size={13}
                className="transition-transform duration-200 group-hover/link:translate-x-0.5"
              />
            </Link>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center justify-center gap-1 text-center">
          <p className="text-[11px] font-black tracking-tight text-slate-400">
            ChinaShop-Benin · Votre espace client
          </p>
          <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-slate-300 dark:text-slate-600">
            Importation · Suivi · Livraison au Bénin
          </p>
        </div>
      </div>
    </section>
  )
}
