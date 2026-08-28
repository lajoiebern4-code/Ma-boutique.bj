import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
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
  X,
} from 'lucide-react'
import { obtenirProduits, type Produit } from '../services/produits'
import { useCart } from '../context/CartContext'

function formatPrix(prix: number) {
  return `${Number(prix || 0).toLocaleString('fr-FR')} FCFA`
}

function BadgeDisponibilite({ produit }: { produit: Produit }) {
  const surCommande =
    produit.stock <= 0 && produit.disponibilite === 'sur_commande'

  if (surCommande) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
        <Clock3 size={12} />
        Sur commande
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
      <CheckCircle2 size={12} />
      Disponible
    </span>
  )
}

function Bandeau() {
  return (
    <div className="bg-[#0B1E3D] px-4 py-2.5 text-center text-xs font-semibold text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        <Sparkles size={14} className="text-orange-400" />
        <span>Découvrez nos produits • En stock ou sur commande • Livraison ou retrait au Bénin</span>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#F6F8FC]">
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-orange-200/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold text-[#0052CC] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            ChinaShop-Bénin
          </span>

          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-[#0B1E3D] sm:text-5xl lg:text-6xl">
            Trouvez ce qu'il vous faut.
            <span className="mt-2 block text-[#0052CC]">
              Commandez simplement.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Découvrez notre sélection de produits, disponibles en stock ou
            proposés sur commande. Choisissez vos articles, passez votre
            commande et choisissez la livraison ou le retrait.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/catalogue"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0052CC] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-[#003D99]"
            >
              <ShoppingBag size={18} />
              Découvrir les produits
              <ArrowRight size={17} />
            </Link>

            <Link
              to="/infos"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-[#0B1E3D] transition hover:border-blue-200 hover:bg-blue-50"
            >
              Comment ça marche
              <ChevronRight size={17} />
            </Link>
          </div>

          <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ['Articles en stock', Package],
              ['Commande sur demande', Search],
              ['Livraison ou retrait', Truck],
            ].map(([texte, Icon]) => (
              <div
                key={texte as string}
                className="flex items-center gap-2.5 text-sm font-semibold text-slate-600"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#0052CC] shadow-sm">
                  <Icon size={16} />
                </div>
                {texte as string}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] bg-[#0B1E3D] p-5 shadow-2xl shadow-blue-950/20 sm:p-7">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-[#0052CC] to-[#1A6BFF] p-6 text-white sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
                Votre expérience d'achat
              </p>

              <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
                Simple.
                <br />
                Clair.
                <br />
                Accessible.
              </h2>

              <p className="mt-5 max-w-sm text-sm leading-6 text-blue-100">
                Parcourez les produits, vérifiez leur disponibilité et ajoutez
                directement vos articles au panier.
              </p>

              <div className="mt-7 space-y-3">
                {[
                  'Choisissez vos produits',
                  'Vérifiez votre commande',
                  'Choisissez livraison ou retrait',
                ].map((texte, index) => (
                  <div
                    key={texte}
                    className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-[#0052CC]">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold">{texte}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute -bottom-4 -left-3 hidden rounded-xl bg-white p-4 shadow-xl sm:block">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0B1E3D]">Commande sécurisée</p>
                <p className="text-xs text-slate-500">Suivez votre commande</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Categories() {
  const categories = [
    { nom: 'Mode Femme', emoji: '👗', couleur: 'bg-pink-50', lien: '/catalogue' },
    { nom: 'Mode Homme', emoji: '👔', couleur: 'bg-blue-50', lien: '/catalogue' },
    { nom: 'Chaussures', emoji: '👟', couleur: 'bg-orange-50', lien: '/catalogue' },
    { nom: 'Sacs', emoji: '👜', couleur: 'bg-violet-50', lien: '/catalogue' },
    { nom: 'Téléphones', emoji: '📱', couleur: 'bg-cyan-50', lien: '/catalogue' },
    { nom: 'Électronique', emoji: '🎧', couleur: 'bg-indigo-50', lien: '/catalogue' },
    { nom: 'Maison & Cuisine', emoji: '🍳', couleur: 'bg-emerald-50', lien: '/catalogue' },
    { nom: 'Découvrir tout', emoji: '✨', couleur: 'bg-amber-50', lien: '/catalogue' },
  ]

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0052CC]">
              Explorer
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl">
              Qu'est-ce que vous cherchez ?
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Parcourez rapidement nos principales catégories.
            </p>
          </div>

          <Link
            to="/catalogue"
            className="hidden items-center gap-1 text-sm font-bold text-[#0052CC] sm:flex"
          >
            Tout voir
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((categorie) => (
            <Link
              key={categorie.nom}
              to={categorie.lien}
              className={`group rounded-2xl ${categorie.couleur} p-4 text-center transition hover:-translate-y-1 hover:shadow-md`}
            >
              <div className="text-3xl transition group-hover:scale-110">
                {categorie.emoji}
              </div>
              <p className="mt-3 text-xs font-bold leading-4 text-[#0B1E3D]">
                {categorie.nom}
              </p>
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
  const [favoris, setFavoris] = useState<string[]>([])

  useEffect(() => {
    let actif = true

    async function charger() {
      try {
        const resultat = await obtenirProduits()

        if (actif) {
          setProduits(resultat.slice(0, 8))
        }
      } catch (erreur) {
        console.error('Erreur de chargement des produits :', erreur)
      } finally {
        if (actif) setChargement(false)
      }
    }

    charger()

    return () => {
      actif = false
    }
  }, [])

  function ajouterFavori(id: string) {
    setFavoris((actuels) =>
      actuels.includes(id)
        ? actuels.filter((favori) => favori !== id)
        : [...actuels, id]
    )
  }

  return (
    <section className="bg-[#F6F8FC] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0052CC]">
              Notre sélection
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl">
              Produits à découvrir
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Retrouvez ici une sélection de produits disponibles sur notre
              boutique.
            </p>
          </div>

          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#0052CC]"
          >
            Voir tout le catalogue
            <ArrowRight size={16} />
          </Link>
        </div>

        {chargement ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="h-[360px] animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        ) : produits.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Package className="mx-auto text-slate-300" size={42} />
            <h3 className="mt-4 font-bold text-[#0B1E3D]">
              Les produits arrivent bientôt
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Consultez le catalogue pour découvrir notre sélection.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {produits.map((produit) => {
              const favori = favoris.includes(produit.id)
              const surCommande =
                produit.stock <= 0 &&
                produit.disponibilite === 'sur_commande'

              return (
                <article
                  key={produit.id}
                  className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-100">
                    <Link to={`/produit/${produit.id}`} className="block h-full">
                      {produit.image_url ? (
                        <img
                          src={produit.image_url}
                          alt={produit.nom}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300">
                          <Package size={48} />
                        </div>
                      )}
                    </Link>

                    {produit.nouveau && (
                      <span className="absolute left-3 top-3 rounded-full bg-[#0052CC] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                        Nouveau
                      </span>
                    )}

                    {produit.promo > 0 && (
                      <span className="absolute left-3 top-11 rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-black text-white">
                        -{produit.promo}%
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => ajouterFavori(produit.id)}
                      aria-label={
                        favori
                          ? `Retirer ${produit.nom} des favoris`
                          : `Ajouter ${produit.nom} aux favoris`
                      }
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-md backdrop-blur transition hover:scale-105"
                    >
                      <Heart
                        size={17}
                        className={favori ? 'fill-red-500 text-red-500' : ''}
                      />
                    </button>
                  </div>

                  <div className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#0052CC]">
                      {produit.categorie || 'ChinaShop-Bénin'}
                    </p>

                    <Link to={`/produit/${produit.id}`}>
                      <h3 className="mt-1.5 min-h-[40px] text-sm font-bold leading-5 text-[#0B1E3D] transition hover:text-[#0052CC]">
                        {produit.nom}
                      </h3>
                    </Link>

                    <div className="mt-3">
                      <BadgeDisponibilite produit={produit} />
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-2">
                      <div>
                        {produit.prixOriginal && produit.promo > 0 && (
                          <p className="text-xs text-slate-400 line-through">
                            {formatPrix(produit.prixOriginal)}
                          </p>
                        )}

                        <p className="text-lg font-black text-[#0B1E3D]">
                          {formatPrix(produit.prix)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        ajouter({
                          id: produit.id,
                          nom: produit.nom,
                          prix: produit.prix,
                          image_url: produit.image_url || null,
                          stock: produit.stock,
                          surCommande,
                        })
                      }
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052CC] py-3 text-xs font-bold text-white transition hover:bg-[#003D99] active:scale-[0.98]"
                    >
                      <ShoppingBag size={15} />
                      Ajouter au panier
                    </button>
                  </div>
                </article>
              )
            })}
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
      texte: 'Parcourez le catalogue et sélectionnez les produits qui vous intéressent.',
      icone: Search,
    },
    {
      numero: '02',
      titre: 'Commandez',
      texte: 'Ajoutez vos articles au panier puis vérifiez tranquillement votre commande.',
      icone: ShoppingBag,
    },
    {
      numero: '03',
      titre: 'Recevez',
      texte: 'Choisissez la livraison à domicile ou le retrait selon les options disponibles.',
      icone: Truck,
    },
  ]

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0052CC]">
            Simple du début à la fin
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl">
            Comment ça marche ?
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Pas besoin de vous compliquer la vie. Quelques étapes suffisent
            pour passer votre commande.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {etapes.map((etape) => {
            const Icon = etape.icone

            return (
              <div
                key={etape.numero}
                className="relative rounded-2xl border border-slate-100 bg-[#F8FAFC] p-7"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-[#0052CC]">
                    <Icon size={22} />
                  </div>
                  <span className="text-4xl font-black text-slate-100">
                    {etape.numero}
                  </span>
                </div>

                <h3 className="mt-6 text-lg font-black text-[#0B1E3D]">
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
  const elements = [
    {
      titre: 'Paiement',
      texte: 'Des options de paiement adaptées au mode de commande proposé.',
      icone: WalletCards,
    },
    {
      titre: 'Livraison',
      texte: 'Choisissez la livraison à domicile lorsque cette option est disponible.',
      icone: Truck,
    },
    {
      titre: 'Retrait',
      texte: 'Vous pouvez choisir le retrait lorsque cette option est proposée.',
      icone: Package,
    },
    {
      titre: 'Suivi',
      texte: 'Retrouvez les informations de votre commande depuis l’espace de suivi.',
      icone: ShieldCheck,
    },
  ]

  return (
    <section className="bg-[#F6F8FC] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0052CC]">
              ChinaShop-Bénin
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl">
              Une expérience pensée pour commander simplement.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-500">
              Notre objectif est simple : vous permettre de trouver vos
              produits, comprendre les conditions de votre commande et choisir
              le mode de réception qui vous convient.
            </p>

            <Link
              to="/infos"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0B1E3D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0052CC]"
            >
              En savoir plus
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {elements.map((element) => {
              const Icon = element.icone

              return (
                <div
                  key={element.titre}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0052CC]">
                    <Icon size={20} />
                  </div>

                  <h3 className="mt-4 font-black text-[#0B1E3D]">
                    {element.titre}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {element.texte}
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
      nom: "Mamadou A.",
      ville: "Cotonou",
      role: "Client ChinaShop",
      initiales: "MA",
      texte:
        "J'ai commandé plusieurs articles et tout s'est déroulé simplement. Les produits correspondaient aux photos et la commande a été bien suivie.",
    },
    {
      nom: "Fatima T.",
      ville: "Porto-Novo",
      role: "Cliente ChinaShop",
      initiales: "FT",
      texte:
        "La possibilité de choisir entre livraison et retrait est vraiment pratique. Le processus de commande est clair et rapide.",
    },
    {
      nom: "Jean-Baptiste K.",
      ville: "Parakou",
      role: "Client ChinaShop",
      initiales: "JK",
      texte:
        "J'apprécie surtout la simplicité. Je trouve mon produit, je commande et je peux suivre l'évolution de ma commande sans complication.",
    },
    {
      nom: "Aminata S.",
      ville: "Abomey",
      role: "Cliente ChinaShop",
      initiales: "AS",
      texte:
        "Très bonne expérience. J'ai pu commander les articles dont j'avais besoin sans devoir chercher plusieurs fournisseurs.",
    },
    {
      nom: "Kofi M.",
      ville: "Ouidah",
      role: "Client ChinaShop",
      initiales: "KM",
      texte:
        "Une boutique pensée pour commander facilement au Bénin. Le catalogue est pratique et le parcours d'achat est beaucoup plus simple.",
    },
  ]

  const [index, setIndex] = useState(0)

  useEffect(() => {
    const intervalle = window.setInterval(() => {
      setIndex((ancien) => (ancien + 1) % temoignages.length)
    }, 3000)

    return () => window.clearInterval(intervalle)
  }, [])

  const temoignage = temoignages[index]

  return (
    <section className="relative overflow-hidden bg-[#071428] py-20 sm:py-24">
      <div className="absolute -left-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-orange-300">
            <Heart size={14} />
            Avis clients
          </span>

          <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Ils commandent avec
            <span className="text-orange-400"> confiance.</span>
          </h2>

          <p className="mt-4 text-sm leading-6 text-blue-100/70 sm:text-base">
            Découvrez l'expérience de clients qui utilisent ChinaShop-Bénin.
          </p>
        </div>

        <div className="mt-12">
          <div
            key={index}
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur-xl sm:p-10 md:p-12"
          >
            <div className="absolute right-7 top-6 text-7xl font-black leading-none text-white/[0.04]">
              “
            </div>

            <div className="relative">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0052CC] to-[#1A6BFF] text-sm font-black text-white shadow-lg shadow-blue-500/20">
                    {temoignage.initiales}
                  </div>

                  <div>
                    <h3 className="font-black text-white">
                      {temoignage.nom}
                    </h3>
                    <p className="mt-0.5 text-xs text-blue-200/60">
                      {temoignage.role} · {temoignage.ville}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((etoile) => (
                    <span
                      key={etoile}
                      className="text-lg text-orange-400"
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <blockquote className="mt-8 max-w-3xl text-xl font-medium leading-8 text-white/90 sm:text-2xl sm:leading-9">
                “{temoignage.texte}”
              </blockquote>

              <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <CheckCircle2 size={16} />
                Expérience client vérifiée
              </div>
            </div>
          </div>

          <div className="mt-7 flex items-center justify-center gap-2">
            {temoignages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Afficher le témoignage ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === index
                    ? "w-10 bg-orange-400"
                    : "w-2.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          <div className="mx-auto mt-4 h-0.5 max-w-xs overflow-hidden rounded-full bg-white/10">
            <div
              key={index}
              className="h-full origin-left rounded-full bg-orange-400"
              style={{
                animation: "temoignageProgress 3s linear forwards",
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes temoignageProgress {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
      `}</style>
    </section>
  )
}

function AppelAction() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#0B1E3D] px-6 py-12 text-center sm:px-10 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <Sparkles className="mx-auto text-orange-400" size={28} />

          <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Prêt à trouver votre prochain produit ?
          </h2>

          <p className="mt-4 text-sm leading-6 text-blue-100">
            Parcourez le catalogue ChinaShop-Bénin et commencez votre commande
            en quelques clics.
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

export default function AccueilNouveau() {
  return (
    <div className="min-h-screen bg-white">
      <Bandeau />
      <Hero />
      <Categories />
      <ProduitsVedette />
      <CommentCaMarche />
      <BlocConfiance />
      <TemoignagesPremium />
      <AppelAction />
    </div>
  )
}
