import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
} from 'lucide-react'
import { obtenirProduits, type Produit } from '../services/produits'
import { useCart } from '../context/CartContext'

function formatPrix(prix: number) {
  return `${Number(prix || 0).toLocaleString('fr-FR')} FCFA`
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

function BandeauPremium() {
  return (
    <div className="bg-[#081A33] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-[11px] font-semibold sm:text-xs">
        <Sparkles size={13} className="text-[#FF8A3D]" />
        <span>Commandez simplement • Livraison ou retrait au Bénin</span>
      </div>
    </div>
  )
}

function HeroPremium() {
  const [recherche, setRecherche] = useState('')

  return (
    <section className="relative overflow-hidden bg-[#F7F9FC]">
      <div className="absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-blue-100/70 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-orange-100/60 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold text-[#0052CC] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            ChinaShop-Bénin
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.04] tracking-tight text-[#081A33] sm:text-5xl lg:text-6xl">
            Trouvez ce qu'il vous faut.
            <span className="mt-2 block text-[#0052CC]">
              Commandez en toute simplicité.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Découvrez nos produits disponibles en stock ou sur commande.
            Choisissez vos articles et laissez ChinaShop s'occuper du reste.
          </p>

          <div className="mt-8 flex max-w-xl items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/50">
            <Search className="ml-3 shrink-0 text-slate-400" size={20} />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Que recherchez-vous ?"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-medium text-[#081A33] outline-none placeholder:text-slate-400"
            />
            <Link
              to={recherche.trim() ? `/catalogue?recherche=${encodeURIComponent(recherche)}` : '/catalogue'}
              className="rounded-xl bg-[#0052CC] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#003D99]"
            >
              Rechercher
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/catalogue"
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A1A] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-[#F06D0A]"
            >
              <ShoppingBag size={18} />
              Découvrir les produits
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/infos"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-[#081A33] shadow-sm transition hover:border-blue-200 hover:text-[#0052CC]"
            >
              Comment ça marche
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#0052CC]" />
              Paiement sécurisé
            </span>
            <span className="flex items-center gap-2">
              <Truck size={15} className="text-[#0052CC]" />
              Livraison au Bénin
            </span>
            <span className="flex items-center gap-2">
              <Package size={15} className="text-[#0052CC]" />
              Retrait disponible
            </span>
          </div>
        </div>

        <div className="relative hidden min-h-[440px] lg:block">
          <div className="absolute inset-8 rounded-[2.5rem] bg-[#081A33] shadow-2xl shadow-blue-950/20" />

          <div className="absolute left-0 top-12 w-64 rounded-3xl border border-white/60 bg-white p-5 shadow-2xl">
            <div className="flex h-36 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-slate-100">
              <ShoppingBag size={64} className="text-[#0052CC]" strokeWidth={1.2} />
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#0052CC]">
                Sélection
              </p>
              <p className="mt-1 text-lg font-black text-[#081A33]">
                Produits populaires
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Stock ou commande sur demande
              </p>
            </div>
          </div>

          <div className="absolute bottom-8 right-0 w-72 rounded-3xl border border-white/60 bg-white p-5 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <BadgeCheck size={28} />
              </div>
              <div>
                <p className="text-sm font-black text-[#081A33]">
                  Commande simplifiée
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Livraison ou retrait selon votre besoin.
                </p>
              </div>
            </div>
          </div>

          <div className="absolute right-8 top-0 rounded-2xl bg-[#FF7A1A] px-5 py-4 text-white shadow-xl shadow-orange-500/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              ChinaShop
            </p>
            <p className="mt-1 text-xl font-black">Simple.</p>
            <p className="text-xl font-black">Pratique.</p>
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
    <section className="border-b border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {categories.map((categorie) => (
            <Link
              key={categorie.nom}
              to={`/catalogue?categorie=${encodeURIComponent(categorie.nom)}`}
              className="group flex min-w-[150px] items-center gap-3 rounded-2xl border border-slate-100 bg-[#F8FAFC] px-4 py-3 transition hover:border-blue-100 hover:bg-blue-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[10px] font-black text-[#0052CC] shadow-sm">
                {categorie.symbole}
              </span>
              <span className="text-xs font-bold text-[#081A33] group-hover:text-[#0052CC]">
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
  const { ajouter } = useCart()
  const [produits, setProduits] = useState<Produit[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    let actif = true

    async function charger() {
      try {
        const resultat = await obtenirProduits()
        if (actif) setProduits(resultat.slice(0, 8))
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
    <section className="bg-[#F7F9FC] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0052CC]">
              Sélection ChinaShop
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#081A33] sm:text-4xl">
              Produits en vedette
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Une sélection directement issue de votre catalogue.
            </p>
          </div>

          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 text-sm font-black text-[#0052CC] hover:text-[#003D99]"
          >
            Voir tout le catalogue
            <ArrowRight size={16} />
          </Link>
        </div>

        {chargement ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-80 animate-pulse rounded-3xl bg-slate-200" />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {produits.map((produit) => (
              <article
                key={produit.id}
                className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70"
              >
                <Link
                  to={`/produit/${produit.id}`}
                  className="relative block aspect-square overflow-hidden bg-slate-100"
                >
                  {produit.image_url ? (
                    <img
                      src={produit.image_url}
                      alt={produit.nom}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <Package size={52} strokeWidth={1.2} />
                    </div>
                  )}

                  <div className="absolute left-3 top-3">
                    <BadgeDisponibilite produit={produit} />
                  </div>

                  {produit.promo > 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-[#FF7A1A] px-3 py-1.5 text-[10px] font-black text-white shadow-lg">
                      -{produit.promo}%
                    </span>
                  )}
                </Link>

                <div className="p-4 sm:p-5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#0052CC]">
                    {produit.categorie || 'Produit'}
                  </p>

                  <Link to={`/produit/${produit.id}`}>
                    <h3 className="mt-2 line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-[#081A33] transition group-hover:text-[#0052CC]">
                      {produit.nom}
                    </h3>
                  </Link>

                  <div className="mt-4 flex items-end justify-between gap-2">
                    <p className="text-lg font-black tracking-tight text-[#081A33]">
                      {formatPrix(produit.prix)}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      ajouter({
                        id: produit.id,
                        nom: produit.nom,
                        prix: produit.prix,
                        image_url: produit.image_url || null,
                        stock: produit.stock,
                        surCommande:
                          produit.stock <= 0 &&
                          produit.disponibilite === 'sur_commande',
                      })
                    }
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#081A33] py-3 text-xs font-black text-white transition hover:bg-[#0052CC] active:scale-[0.98]"
                  >
                    <ShoppingBag size={15} />
                    Ajouter au panier
                  </button>
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
      titre: 'Choisissez',
      texte: 'Parcourez le catalogue et trouvez les produits qui vous intéressent.',
      icone: Search,
    },
    {
      numero: '02',
      titre: 'Commandez',
      texte: 'Ajoutez vos articles au panier et renseignez vos informations.',
      icone: ShoppingBag,
    },
    {
      numero: '03',
      titre: 'Payez',
      texte: 'Choisissez le mode de paiement disponible pour votre commande.',
      icone: WalletCards,
    },
    {
      numero: '04',
      titre: 'Recevez',
      texte: 'Choisissez la livraison ou le retrait et suivez votre commande.',
      icone: Truck,
    },
  ]

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0052CC]">
            Simple du début à la fin
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#081A33] sm:text-4xl">
            Comment ça marche ?
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Une expérience pensée pour commander sans complication.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {etapes.map((etape) => {
            const Icon = etape.icone

            return (
              <div
                key={etape.numero}
                className="relative rounded-3xl border border-slate-100 bg-[#F8FAFC] p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#0052CC]">
                    {etape.numero}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#0052CC] shadow-sm">
                    <Icon size={20} />
                  </div>
                </div>

                <h3 className="mt-7 text-lg font-black text-[#081A33]">
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
      titre: 'Paiement sécurisé',
      texte: 'Un parcours de commande clair et sécurisé.',
      icone: ShieldCheck,
    },
    {
      titre: 'Livraison au Bénin',
      texte: 'Choisissez la livraison lorsque cette option vous convient.',
      icone: Truck,
    },
    {
      titre: 'Retrait',
      texte: 'Une alternative pratique lorsque vous préférez récupérer votre commande.',
      icone: Package,
    },
    {
      titre: 'Accompagnement',
      texte: 'Une expérience pensée pour rester simple et compréhensible.',
      icone: Heart,
    },
  ]

  return (
    <section className="bg-[#F7F9FC] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0052CC]">
              L'essentiel
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#081A33] sm:text-4xl">
              Une boutique conçue pour votre quotidien.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-500">
              ChinaShop-Bénin vous permet de découvrir, commander et recevoir
              vos produits avec un parcours clair, du catalogue jusqu'au suivi.
            </p>

            <Link
              to="/infos"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#081A33] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0052CC]"
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
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0052CC]">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-4 font-black text-[#081A33]">
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
      texte: 'Une expérience de commande simple et claire. J’ai apprécié la facilité pour choisir mes produits.',
    },
    {
      nom: 'Fatima',
      ville: 'Porto-Novo',
      texte: 'Le parcours est pratique et les informations de commande sont faciles à comprendre.',
    },
    {
      nom: 'Jean-Baptiste',
      ville: 'Parakou',
      texte: 'J’ai trouvé rapidement ce que je cherchais et le processus de commande est vraiment fluide.',
    },
    {
      nom: 'Aminata',
      ville: 'Abomey',
      texte: 'Le choix entre livraison et retrait est très pratique pour organiser ma commande.',
    },
    {
      nom: 'Kofi',
      ville: 'Ouidah',
      texte: 'Une boutique agréable à utiliser avec une présentation claire des produits.',
    },
  ]

  const [index, setIndex] = useState(0)

  useEffect(() => {
    const intervalle = window.setInterval(() => {
      setIndex((precedent) => (precedent + 1) % temoignages.length)
    }, 3000)

    return () => window.clearInterval(intervalle)
  }, [temoignages.length])

  const temoignage = temoignages[index]

  return (
    <section className="bg-[#081A33] py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">
            Expérience client
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Ce que nos clients pensent
          </h2>
        </div>

        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl sm:p-10">
          <div className="flex items-start justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0052CC] to-[#1A6BFF] font-black text-white">
                {temoignage.nom.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <p className="font-black text-white">{temoignage.nom}</p>
                <p className="mt-1 text-xs text-blue-200">{temoignage.ville}</p>
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

          <p className="mt-8 text-lg font-medium leading-8 text-blue-50 sm:text-xl">
            “{temoignage.texte}”
          </p>

          <div className="mt-8 h-1 overflow-hidden rounded-full bg-white/10">
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
                      ? 'w-8 bg-orange-400'
                      : 'w-2 bg-white/20'
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
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10"
                aria-label="Témoignage précédent"
              >
                <ChevronLeft size={17} />
              </button>

              <button
                onClick={() => setIndex((index + 1) % temoignages.length)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10"
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
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0052CC] to-[#081A33] px-6 py-12 text-center shadow-2xl sm:px-10 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
            Prêt à commencer ?
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Votre prochaine commande commence ici.
          </h2>

          <p className="mt-4 text-sm leading-6 text-blue-100">
            Parcourez le catalogue, choisissez vos produits et passez votre
            commande en quelques étapes.
          </p>

          <Link
            to="/catalogue"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#FF7A1A] px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-900/20 transition hover:bg-[#FF8B35]"
          >
            Commencer mes achats
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
      <Categories />
      <ProduitsVedette />
      <CommentCaMarche />
      <BlocConfiance />
      <TemoignagesPremium />
      <AppelAction />
    </div>
  )
}
