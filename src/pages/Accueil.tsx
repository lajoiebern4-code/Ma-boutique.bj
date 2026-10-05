import PromotionVideo from '../components/PromotionVideo'

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  WalletCards,
  Zap,
} from 'lucide-react'
import {
  recupererAnnoncesActives,
  type Annonce,
} from '../services/supabase'
import { obtenirProduits, type Produit } from '../services/produits'
import { useCart } from '../context/CartContext'

function useRevealOnScroll() {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    element.classList.add('opacity-0', 'translate-y-5')

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return

        element.classList.remove('opacity-0', 'translate-y-5')
        element.classList.add('opacity-100', 'translate-y-0')
        observer.disconnect()
      },
      { threshold: 0.12 },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return ref
}

function formatPrix(prix: number) {
  return `${Number(prix || 0).toLocaleString('fr-FR')} FCFA`
}

function calculerTempsRestant(dateCible: string | null) {
  if (!dateCible) return 0

  const cible = new Date(dateCible).getTime()
  if (!Number.isFinite(cible)) return 0

  return Math.max(0, cible - Date.now())
}

function formaterCompteRebours(duree: number) {
  const totalSecondes = Math.max(0, Math.floor(duree / 1000))
  const jours = Math.floor(totalSecondes / 86400)
  const heures = Math.floor((totalSecondes % 86400) / 3600)
  const minutes = Math.floor((totalSecondes % 3600) / 60)
  const secondes = totalSecondes % 60

  return { jours, heures, minutes, secondes }
}

function formaterHeurePromotion(dateCible: string | null) {
  if (!dateCible) return ''

  const date = new Date(dateCible)

  if (!Number.isFinite(date.getTime())) return ''

  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function obtenirEtatPromotion(produit: Produit) {
  if (
    produit.promo <= 0 ||
    !produit.promo_debut ||
    !produit.promo_fin
  ) {
    return 'aucune' as const
  }

  const maintenant = Date.now()
  const debut = new Date(produit.promo_debut).getTime()
  const fin = new Date(produit.promo_fin).getTime()

  if (!Number.isFinite(debut) || !Number.isFinite(fin)) {
    return 'aucune' as const
  }

  if (maintenant < debut) return 'programmee' as const
  if (maintenant < fin) return 'active' as const

  return 'expiree' as const
}

function BadgeDisponibilite({ produit }: { produit: Produit }) {
  const surCommande =
    produit.stock <= 0 && produit.disponibilite === 'sur_commande'

  return surCommande ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700">
      <Clock3 size={12} />
      Sur commande
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
      <CheckCircle2 size={12} />
      Disponible
    </span>
  )
}

const styleTitreAnnonce = `
.titre-annonce-anime {
  display: inline-block;
  animation: titreAnnonce 1.6s ease-in-out infinite;
  transform-origin: center;
}

@keyframes titreAnnonce {
  0%, 100% {
    color: #FFFFFF;
    text-shadow: 0 0 0 transparent;
    transform: scale(1);
  }
  50% {
    color: #FF8A3D;
    text-shadow:
      0 0 5px rgba(255, 138, 61, 0.9),
      0 0 14px rgba(255, 138, 61, 0.65);
    transform: scale(1.06);
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`

function BandeauPremium() {
  const [annonces, setAnnonces] = useState<Annonce[]>([])

  useEffect(() => {
    let actif = true

    async function charger() {
      const resultat = await recupererAnnoncesActives()
      if (actif && resultat.success) {
        setAnnonces(resultat.data || [])
      }
    }

    void charger()
    return () => {
      actif = false
    }
  }, [])

  const liste = annonces.length > 0 ? annonces : [{
    id: 'defaut',
    titre: 'Bienvenue',
    message: 'Commandez simplement • Livraison ou retrait au Bénin',
  } as Annonce]

  const contenu = liste.map((annonce) => (
    <span
      key={annonce.id}
      className="inline-flex shrink-0 items-center gap-2.5 px-8 text-[12px] font-semibold sm:text-[13px]"
    >
      <Sparkles size={13} className="shrink-0 text-[#FFB47A]" />
      {annonce.titre && (
        <span className="shrink-0 text-[11px] font-black uppercase tracking-[0.14em] text-[#FFB47A] sm:text-[12px]">
          {annonce.titre}
        </span>
      )}
      {annonce.titre && annonce.message && (
        <span className="h-3 w-px shrink-0 bg-white/20" />
      )}
      <span className="whitespace-nowrap text-white/90">
        {annonce.message}
      </span>
      <span className="ml-4 h-1 w-1 shrink-0 rounded-full bg-white/25" />
    </span>
  ))

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#1E1B2E] via-[#2A2344] to-[#3B2D5F] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(118,84,198,0.25),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_50%,rgba(139,109,209,0.2),transparent_60%)]" />

      <div className="relative flex min-h-[46px] items-center overflow-hidden">
        <div className="flex w-max shrink-0 animate-[marquee_40s_linear_infinite] items-center whitespace-nowrap hover:[animation-play-state:paused]">
          {contenu}
          {contenu}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}


function HeroPremium() {
  const [recherche, setRecherche] = useState('')
  const [texteAnimeIndex, setTexteAnimeIndex] = useState(0)
  const [texteAffiche, setTexteAffiche] = useState('')
  const [indexLettre, setIndexLettre] = useState(0)
  const [effacement, setEffacement] = useState(false)
  const textesAnimes = [
    "Livraison express au Bénin.",
    "Paiement Mobile Money sécurisé.",
    "Import direct de Chine.",
    "Suivi de commande en temps réel.",
  ]

  useEffect(() => {
    const texteComplet = textesAnimes[texteAnimeIndex]

    if (!effacement && indexLettre < texteComplet.length) {
      const timeout = setTimeout(() => {
        setTexteAffiche(texteComplet.slice(0, indexLettre + 1))
        setIndexLettre(indexLettre + 1)
      }, 70)
      return () => clearTimeout(timeout)
    }

    if (!effacement && indexLettre === texteComplet.length) {
      const timeout = setTimeout(() => setEffacement(true), 2000)
      return () => clearTimeout(timeout)
    }

    if (effacement && texteAffiche.length > 0) {
      const timeout = setTimeout(() => {
        setTexteAffiche(texteAffiche.slice(0, -1))
      }, 30)
      return () => clearTimeout(timeout)
    }

    if (effacement && texteAffiche.length === 0) {
      setEffacement(false)
      setIndexLettre(0)
      setTexteAnimeIndex((i) => (i + 1) % textesAnimes.length)
    }
  }, [indexLettre, texteAffiche, effacement, texteAnimeIndex])
  const heroReveal = useRevealOnScroll()

  return (
    <section className="relative overflow-hidden bg-[#FAF9F6]">
      {/* IMAGE EN FOND */}
      <div className="absolute inset-0">
        <img
          src="/illustration-shopping.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-right opacity-60 lg:opacity-100"
        />
        {/* DÉGRADÉ DE GAUCHE À DROITE (pour lisibilité du texte) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF9F6] via-[#FAF9F6]/95 to-[#FAF9F6]/30 lg:via-[#FAF9F6]/80 lg:to-transparent" />
      </div>

      {/* CONTENU PAR-DESSUS */}
      <div
        ref={heroReveal}
        className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-8 lg:py-28"
      >
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0F1B3D]/10 bg-white/80 px-4 py-2 text-xs font-bold text-[#0F1B3D] shadow-sm backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            ChinaShop-Bénin
          </div>

          <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-[#1A1A2E] sm:text-5xl lg:text-6xl">
            Votre passerelle vers la Chine.
            <span className="mt-2 block text-[#0F1B3D]">
              <span className="inline-block">
                {texteAffiche}
                <span className="ml-0.5 inline-block animate-pulse font-thin text-[#C9A24B]">|</span>
              </span>
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-[#6B7280] sm:text-lg">
            ChineShop-Bénin connecte directement le marché chinois à votre porte.
            Livraison express partout au Bénin — Cotonou en moins de 24 heures.
          </p>

          <div className="mt-8 flex max-w-lg items-center rounded-[14px] border border-[#E8E4DC] bg-white p-1.5 shadow-[0_8px_24px_rgba(24,21,31,0.08)]">
            <Search className="ml-3 shrink-0 text-slate-400" size={20} />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Que recherchez-vous ?"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-medium text-[#1A1A2E] outline-none placeholder:text-slate-400"
            />
            <Link
              to={recherche.trim() ? `/catalogue?recherche=${encodeURIComponent(recherche)}` : '/catalogue'}
              className="rounded-[10px] bg-gradient-to-r from-[#C9A24B] to-[#F59E0B] px-5 py-3 text-sm font-bold text-[#0F1B3D] transition hover:from-[#D97706] hover:to-[#F59E0B]"
            >
              Rechercher
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/catalogue"
              className="inline-flex items-center gap-2 rounded-[10px] bg-gradient-to-r from-[#C9A24B] to-[#F59E0B] px-6 py-3.5 text-sm font-black text-[#0F1B3D] shadow-[0_4px_14px_rgba(201,162,75,0.25)] transition hover:from-[#D97706] hover:to-[#F59E0B]"
            >
              <ShoppingBag size={18} />
              Découvrir les produits
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/infos"
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#E8E4DC] bg-white px-6 py-3.5 text-sm font-bold text-[#1A1A2E] shadow-sm transition hover:border-[#0F1B3D]/20 hover:text-[#0F1B3D]"
            >
              Comment ça marche
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-[#6B7280]">
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#0F1B3D]" />
              Paiement sécurisé
            </span>
            <span className="flex items-center gap-2">
              <Truck size={15} className="text-[#0F1B3D]" />
              Livraison express
            </span>
            <span className="flex items-center gap-2">
              <Package size={15} className="text-[#0F1B3D]" />
              Suivi en temps réel
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Categories() {
  const categories = [
    { nom: 'Électronique', symbole: '01' },
    { nom: 'Téléphones', symbole: '02' },
    { nom: 'Mode', symbole: '03' },
    { nom: 'Chaussures', symbole: '04' },
    { nom: 'Sacs', symbole: '05' },
    { nom: 'Maison', symbole: '06' },
  ]

  return (
    <section className="border-b border-[#FAF9F6] bg-white">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {categories.map((categorie) => (
            <Link
              key={categorie.nom}
              to={`/catalogue?categorie=${encodeURIComponent(categorie.nom)}`}
              className="group flex min-w-[150px] items-center gap-3 rounded-[14px] border border-[#FAF9F6] bg-[#FFFFFF] px-4 py-3 shadow-[0_2px_10px_rgba(24,21,31,0.04)] transition hover:border-[#D8CDED] hover:bg-[#FAF9F6]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white text-[10px] font-black text-[#0F1B3D] shadow-[0_2px_10px_rgba(24,21,31,0.05)]">
                {categorie.symbole}
              </span>
              <span className="text-xs font-bold text-[#1A1A2E] group-hover:text-[#0F1B3D]">
                {categorie.nom}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProduitsVedette() {
  const [maintenant, setMaintenant] = useState(Date.now())

  useEffect(() => {
    const intervalle = window.setInterval(() => {
      setMaintenant(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalle)
  }, [])

  const { ajouter } = useCart()
  const navigate = useNavigate()
  const [produits, setProduits] = useState<Produit[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    let actif = true

    async function charger() {
      try {
        const resultat = await obtenirProduits()
        if (actif) setProduits(resultat)
      } catch (erreur) {
        console.error('Erreur de chargement:', erreur)
      } finally {
        if (actif) setChargement(false)
      }
    }

    charger()
    return () => {
      actif = false
    }
  }, [])

  return (
    <section className="bg-[#FFFFFF] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F1B3D]">
              Sélection ChinaShop
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#1A1A2E] sm:text-4xl">
              Produits en vedette
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Une sélection directement issue de votre catalogue.
            </p>
          </div>

          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 text-sm font-black text-[#0F1B3D] hover:text-[#C9A24B]"
          >
            Voir tout le catalogue
            <ArrowRight size={16} />
          </Link>
        </div>

        {chargement ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-80 animate-pulse rounded-[18px] border border-[#FAF9F6] bg-[#FAF9F6]" />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {produits.filter((p) => p.stock > 0 || p.disponibilite === 'sur_commande').map((produit) => (
              <article
                key={produit.id}
                className="group overflow-hidden rounded-[18px] border border-[#FAF9F6] bg-white shadow-[0_2px_10px_rgba(24,21,31,0.05)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(24,21,31,0.08)]"
                style={{ animationDelay: `${Math.min(produits.indexOf(produit) * 70, 490)}ms` }}
              >
                <Link
                  to={`/produit/${produit.id}`}
                  className="relative block aspect-square overflow-hidden bg-[#FAF9F6]"
                >
                  {produit.image_url ? (
                    <img
                      src={produit.image_url}
                      alt={produit.nom}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <Package size={52} strokeWidth={1.2} />
                    </div>
                  )}

                  <div className="absolute left-3 top-3">
                    <BadgeDisponibilite produit={produit} />
                  </div>

                  {obtenirEtatPromotion(produit) === 'active' && (
                    <>
                      <span className="absolute right-3 top-3 rounded-full bg-[#FF7A1A] px-3 py-1.5 text-[10px] font-black text-white shadow-lg">
                        -{produit.promo}%
                      </span>
                      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[2] flex justify-center">
                        {(() => {
                          const compte = formaterCompteRebours(
                            calculerTempsRestant(produit.promo_fin),
                          )
                          return (
                            <div className="flex items-center gap-1 text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]">
                              {compte.jours > 0 && (
                                <span className="min-w-[25px] rounded-[3px] bg-[#E53935] px-1.5 py-0.5 text-center text-sm font-black tabular-nums text-white shadow-sm">
                                  {String(compte.jours).padStart(2, '0')}<small className="ml-0.5 text-[9px] font-bold uppercase">J</small>
                                </span>
                              )}
                              <span className="min-w-[25px] rounded-[3px] bg-[#E53935] px-1.5 py-0.5 text-center text-sm font-black tabular-nums text-white shadow-sm">
                                {String(compte.heures).padStart(2, '0')}<small className="ml-0.5 text-[9px] font-bold uppercase">H</small>
                              </span>
                              <span className="min-w-[25px] rounded-[3px] bg-[#E53935] px-1.5 py-0.5 text-center text-sm font-black tabular-nums text-white shadow-sm">
                                {String(compte.minutes).padStart(2, '0')}<small className="ml-0.5 text-[9px] font-bold uppercase">M</small>
                              </span>
                              <span className="min-w-[25px] rounded-[3px] bg-[#E53935] px-1.5 py-0.5 text-center text-sm font-black tabular-nums text-white shadow-sm">
                                {String(compte.secondes).padStart(2, '0')}<small className="ml-0.5 text-[9px] font-bold uppercase">S</small>
                              </span>
                            </div>
                          )
                        })()}
                      </div>
                    </>
                  )}

                  {obtenirEtatPromotion(produit) === 'programmee' && (
                    <>
                      <span className="absolute right-3 top-3 rounded-full bg-[#0F1B3D] !text-white px-3 py-1.5 text-[10px] font-black text-white shadow-lg">
                        Promotion à venir
                      </span>
                      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[2] flex justify-center">
                        {(() => {
                          const compte = formaterCompteRebours(
                            calculerTempsRestant(produit.promo_debut),
                          )
                          return (
                            <div className="flex items-center gap-1 text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]">
                              {compte.jours > 0 && (
                                <span className="min-w-[25px] rounded-[3px] bg-[#E53935] px-1.5 py-0.5 text-center text-sm font-black tabular-nums text-white shadow-sm">
                                  {String(compte.jours).padStart(2, '0')}<small className="ml-0.5 text-[9px] font-bold uppercase">J</small>
                                </span>
                              )}
                              <span className="min-w-[25px] rounded-[3px] bg-[#E53935] px-1.5 py-0.5 text-center text-sm font-black tabular-nums text-white shadow-sm">
                                {String(compte.heures).padStart(2, '0')}<small className="ml-0.5 text-[9px] font-bold uppercase">H</small>
                              </span>
                              <span className="min-w-[25px] rounded-[3px] bg-[#E53935] px-1.5 py-0.5 text-center text-sm font-black tabular-nums text-white shadow-sm">
                                {String(compte.minutes).padStart(2, '0')}<small className="ml-0.5 text-[9px] font-bold uppercase">M</small>
                              </span>
                              <span className="min-w-[25px] rounded-[3px] bg-[#E53935] px-1.5 py-0.5 text-center text-sm font-black tabular-nums text-white shadow-sm">
                                {String(compte.secondes).padStart(2, '0')}<small className="ml-0.5 text-[9px] font-bold uppercase">S</small>
                              </span>
                            </div>
                          )
                        })()}
                      </div>
                    </>
                  )}
                </Link>

                <div className="p-4 sm:p-5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#0F1B3D]">
                    {produit.categorie || 'Produit'}
                  </p>

                  <Link to={`/produit/${produit.id}`}>
                    <h3 className="mt-2 line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-[#1A1A2E] transition group-hover:text-[#0F1B3D]">
                      {produit.nom}
                    </h3>
                  </Link>

                  {produit.description?.trim() && (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#6B7280]">
                      {produit.description.trim()}
                    </p>
                  )}

                  <div className="mt-4 flex items-end justify-between gap-2">
                    <p className="text-lg font-black tracking-tight text-[#1A1A2E]">
                      {formatPrix(produit.prix)}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_1.12fr] gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        ajouter({
                          id: produit.id,
                          nom: produit.nom,
                          prix: produit.prix,
                          image_url: produit.image_url || null,
                          stock: produit.stock,
                          poids_kg: produit.poids_kg,
                          volume_cbm: produit.volume_cbm,
                          categorie: produit.categorie,
                          sous_categorie: produit.sous_categorie,
                          surCommande:
                            produit.stock <= 0 &&
                            produit.disponibilite === 'sur_commande',
                        })
                      }
                      aria-label="Ajouter au panier"
                      className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#FAF9F6] bg-white px-3 text-[#1A1A2E] shadow-none transition-colors duration-150 hover:border-[#D8CDED] hover:bg-[#FAF9F6]"
                    >
                      <ShoppingBag size={17} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        ajouter({
                          id: produit.id,
                          nom: produit.nom,
                          prix: produit.prix,
                          image_url: produit.image_url || null,
                          stock: produit.stock,
                          poids_kg: produit.poids_kg,
                          volume_cbm: produit.volume_cbm,
                          categorie: produit.categorie,
                          sous_categorie: produit.sous_categorie,
                          surCommande:
                            produit.stock <= 0 &&
                            produit.disponibilite === 'sur_commande',
                        })
                        navigate('/commande')
                      }}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[10px] bg-gradient-to-r from-[#C9A24B] to-[#F59E0B] px-4 text-xs font-bold text-[#0F1B3D] shadow-[0_2px_10px_rgba(24,21,31,0.08)] transition-colors duration-150 hover:from-[#D97706] hover:to-[#F59E0B]"
                    >
                      <Zap size={15} aria-hidden="true" />
                      <span>Commander</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function CommentCaMarche() {
  const etapes = [
    {
      numero: '01',
      titre: 'Sélectionnez',
      texte: 'Explorez notre catalogue et choisissez vos articles parmi des produits rigoureusement sélectionnés.',
      icone: Search,
    },
    {
      numero: '02',
      titre: 'Validez',
      texte: 'Confirmez votre commande en quelques clics. Paiement sécurisé, confirmation immédiate.',
      icone: ShoppingBag,
    },
    {
      numero: '03',
      titre: 'Recevez',
      texte: 'Livraison express au Bénin. Cotonou en moins de 24 heures, suivi en temps réel inclus.',
      icone: Truck,
    },
  ]

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F1B3D]">
            Simple du début à la fin
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#1A1A2E] sm:text-4xl">
            Un processus clair, de la sélection à la réception.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {etapes.map((etape) => {
            const Icon = etape.icone

            return (
              <div
                key={etape.numero}
                className="relative rounded-[18px] border border-[#FAF9F6] bg-white p-6 shadow-[0_2px_10px_rgba(24,21,31,0.05)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(24,21,31,0.08)]"
                style={{ animationDelay: `${(Number(etape.numero) - 1) * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#0F1B3D]">
                    {etape.numero}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#FAF9F6] text-[#0F1B3D] shadow-[0_2px_10px_rgba(24,21,31,0.05)]">
                    <Icon size={20} />
                  </div>
                </div>

                <h3 className="mt-7 text-lg font-black text-[#1A1A2E]">
                  {etape.titre}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {etape.texte}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function BlocConfiance() {
  const avantages = [
    {
      titre: 'Livraison express',
      texte: 'Cotonou en moins de 24 heures. Livraison rapide dans tout le Bénin.',
      icone: Truck,
    },
    {
      titre: 'Paiement sécurisé',
      texte: 'Transactions protégées. Mobile Money, carte bancaire ou paiement à la livraison.',
      icone: ShieldCheck,
    },
    {
      titre: 'Qualité contrôlée',
      texte: 'Chaque article est inspecté avant expédition. Conformité garantie.',
      icone: Package,
    },
    {
      titre: 'Accompagnement dédié',
      texte: 'Une équipe disponible en français avant, pendant et après votre achat.',
      icone: Heart,
    },
  ]


  return (
    <section className="bg-[#FFFFFF] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F1B3D]">
              L'essentiel
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#1A1A2E] sm:text-4xl">
              L'exigence d'un service pensé pour vous.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-500">
              ChinaShop-Bénin vous permet de découvrir, commander et recevoir
              vos produits avec un parcours clair, du catalogue jusqu'au suivi.
            </p>

            <Link
              to="/infos"
              className="mt-7 inline-flex items-center gap-2 rounded-[14px] border border-[#FAF9F6] bg-white px-5 py-3 text-sm font-black text-[#1A1A2E] shadow-[0_2px_10px_rgba(24,21,31,0.05)] transition hover:border-[#D8CDED] hover:bg-[#FAF9F6] hover:text-[#0F1B3D]"
            >
              En savoir plus
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {avantages.map((avantage) => {
              const Icon = avantage.icone

              return (
                <div
                  key={avantage.titre}
                  className="rounded-[18px] border border-[#FAF9F6] bg-white p-5 shadow-[0_2px_10px_rgba(24,21,31,0.05)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(24,21,31,0.08)]"
                  style={{ animationDelay: `${avantages.indexOf(avantage) * 90}ms` }}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#FAF9F6] text-[#0F1B3D]">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-4 font-black text-[#1A1A2E]">
                    {avantage.titre}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {avantage.texte}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function TemoignagesPremium() {
  const temoignages = [
    {
      nom: 'Mamadou',
      ville: 'Cotonou',
      texte: 'Commande confirmée en matinée, colis reçu le lendemain. Service irréprochable.',
    },
    {
      nom: 'Fatima',
      ville: 'Porto-Novo',
      texte: 'Produits parfaitement conformes. Délais respectés à la lettre.',
    },
    {
      nom: 'Jean-Baptiste',
      ville: 'Parakou',
      texte: 'Une logistique sérieuse et fiable. Je recommande sans réserve.',
    },
    {
      nom: 'Aminata',
      ville: 'Abomey',
      texte: 'Processus fluide du début à la fin. Suivi précis et colis soigné.',
    },
    {
      nom: 'Kofi',
      ville: 'Ouidah',
      texte: 'Réactivité du support et respect des engagements. Expérience concluante.',
    },
  ]

  const [index, setIndex] = useState(0)

  useEffect(() => {
    const intervalle = window.setInterval(() => {
      setIndex((precedent) => (precedent + 1) % temoignages.length)
    }, 3000)

    return () => window.clearInterval(intervalle)
  }, [temoignages.length])

  const temoignage = temoignages[index] ?? temoignages[0]

  if (!temoignage) {
    return null
  }
  return (
    <section className="bg-[#FFFFFF] py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F1B3D]">
            Expérience client
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#1A1A2E] sm:text-4xl">
            La confiance de nos clients, notre meilleure référence.
          </h2>
        </div>

        <div className="mt-10 rounded-[18px] border border-[#FAF9F6] bg-white p-7 shadow-[0_2px_10px_rgba(24,21,31,0.05)] transition-shadow duration-200 sm:p-10 hover:shadow-[0_8px_24px_rgba(24,21,31,0.08)]">
          <div className="flex items-start justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#FAF9F6] font-black text-[#0F1B3D]">
                {temoignage.nom.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <p className="font-black text-[#1A1A2E]">{temoignage.nom}</p>
                <p className="mt-1 text-xs text-[#6B7280]">{temoignage.ville}</p>
              </div>
            </div>

            <div className="hidden items-center gap-1 sm:flex">
              {[1, 2, 3, 4, 5].map((etoile) => (
                <span key={etoile} className="text-orange-400">
                  ★
                </span>
              ))}
            </div>
          </div>

          <p className="mt-8 text-lg font-medium leading-8 text-[#6B7280] sm:text-xl">
            “{temoignage.texte}”
          </p>

          <div className="mt-8 h-1 overflow-hidden rounded-full bg-[#FAF9F6]">
            <div
              key={index}
              className="h-full rounded-full bg-orange-400"
              style={{
                animation: 'temoignageProgress 3s linear forwards',
              }}
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-2">
              {temoignages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Afficher le témoignage ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === index
                      ? 'w-8 bg-[#0F1B3D]'
                      : 'w-2 bg-[#FAF9F6]'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setIndex(
                    (index - 1 + temoignages.length) % temoignages.length
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#FAF9F6] text-[#6B7280] transition hover:border-[#D8CDED] hover:bg-[#FAF9F6] hover:text-[#0F1B3D]"
                aria-label="Témoignage précédent"
              >
                <ChevronLeft size={17} />
              </button>

              <button
                onClick={() => setIndex((index + 1) % temoignages.length)}
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#FAF9F6] text-[#6B7280] transition hover:border-[#D8CDED] hover:bg-[#FAF9F6] hover:text-[#0F1B3D]"
                aria-label="Témoignage suivant"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes temoignageProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  )
}

function AppelAction() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[18px] border border-[#FAF9F6] bg-[#FFFFFF] px-6 py-12 text-center shadow-[0_2px_10px_rgba(24,21,31,0.05)] transition-shadow duration-200 sm:px-10 sm:py-16 hover:shadow-[0_8px_24px_rgba(24,21,31,0.08)] sm:px-10 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F1B3D]">
            Prêt à recevoir votre colis ?
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#1A1A2E] sm:text-4xl">
            Passez votre commande dès aujourd'hui.
          </h2>

          <p className="mt-4 text-sm leading-6 text-[#6B7280]">
            Parcourez notre catalogue, validez en quelques minutes et recevez votre colis en livraison express.
          </p>

          <Link
            to="/catalogue"
            className="mt-8 inline-flex items-center gap-2 rounded-[14px] bg-[#0F1B3D] !text-white px-7 py-3.5 text-sm font-black text-white shadow-[0_2px_10px_rgba(24,21,31,0.08)] transition hover:bg-[#C9A24B] hover:text-[#0F1B3D] hover:shadow-[0_8px_24px_rgba(24,21,31,0.08)]"
          >
            Explorer le catalogue
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function Accueil() {
  return (
    <div className="min-h-screen bg-white">
      <BandeauPremium />
      <HeroPremium />
      <PromotionVideo />
      <Categories />
      <ProduitsVedette />
      <CommentCaMarche />
      <BlocConfiance />
      <TemoignagesPremium />
      <AppelAction />
    </div>
  )
}
