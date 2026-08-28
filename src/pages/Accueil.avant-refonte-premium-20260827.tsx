import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
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
    <div className="bg-[#071428] px-4 py-2.5 text-center text-xs font-semibold text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        <Sparkles size={14} className="text-orange-400" />
        <span>
          Produits en stock ou sur commande · Livraison ou retrait au Bénin
        </span>
      </div>
    </div>
  )
}

function Hero() {
  const [recherche, setRecherche] = useState('')

  return (
    <section className="relative overflow-hidden bg-[#F7F9FC]">
      <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -bottom-48 -left-40 h-[30rem] w-[30rem] rounded-full bg-orange-200/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold text-[#0052CC] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            ChinaShop-Bénin
            <span className="text-slate-300">•</span>
            Votre boutique en ligne
          </div>

          <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.04] tracking-[-0.04em] text-[#0B1E3D] sm:text-5xl lg:text-[4.4rem]">
            Achetez simplement.
            <span className="mt-3 block text-[#0052CC]">
              Recevez sereinement.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Découvrez une sélection de produits pour votre quotidien.
            Commandez les articles disponibles ou faites votre demande pour
            les produits sur commande.
          </p>

          <div className="mt-8 flex max-w-xl items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/50">
            <Search className="ml-3 shrink-0 text-slate-400" size={20} />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Que recherchez-vous ?"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-medium text-[#0B1E3D] outline-none placeholder:text-slate-400"
            />
            <Link
              to={`/catalogue${recherche.trim() ? `?recherche=${encodeURIComponent(recherche.trim())}` : ''}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0052CC] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#003D99]"
            >
              Rechercher
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
            <span className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-[#0052CC]" />
              Paiement sécurisé
            </span>
            <span className="flex items-center gap-2">
              <Truck size={17} className="text-[#0052CC]" />
              Livraison au Bénin
            </span>
            <span className="flex items-center gap-2">
              <Package size={17} className="text-[#0052CC]" />
              Retrait disponible
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/catalogue"
              className="group inline-flex items-center gap-2 rounded-xl bg-[#FF7A1A] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-[#F56D0A]"
            >
              Découvrir les produits
              <ArrowRight
                size={17}
                className="transition group-hover:translate-x-1"
              />
            </Link>

            <Link
              to="/infos"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-[#0B1E3D] shadow-sm transition hover:border-blue-200 hover:text-[#0052CC]"
            >
              Comment ça marche
              <ChevronRight size={17} />
            </Link>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="relative mx-auto max-w-[510px]">
            <div className="absolute inset-8 rounded-[3rem] bg-gradient-to-br from-[#0052CC] to-[#1A6BFF] blur-2xl opacity-20" />

            <div className="relative overflow-hidden rounded-[2.5rem] border border-white bg-white p-5 shadow-2xl shadow-blue-900/10">
              <div className="rounded-[2rem] bg-[#F3F6FA] p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#0052CC]">
                      ChinaShop
                    </p>
                    <p className="mt-1 text-2xl font-black text-[#0B1E3D]">
                      Votre sélection
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                    <ShoppingBag className="text-[#0052CC]" size={21} />
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-4">
                  {[
                    ['Électronique', '01'],
                    ['Mode', '02'],
                    ['Maison', '03'],
                    ['Accessoires', '04'],
                  ].map(([titre, numero]) => (
                    <div
                      key={titre}
                      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                    >
                      <span className="text-xs font-black text-[#FF7A1A]">
                        {numero}
                      </span>
                      <p className="mt-7 text-sm font-black text-[#0B1E3D]">
                        {titre}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl bg-[#0B1E3D] p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-200">
                        Commande simple
                      </p>
                      <p className="mt-1 font-black">
                        Livraison ou retrait
                      </p>
                    </div>
                    <CheckCircle2 className="text-emerald-400" size={24} />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -left-8 top-12 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <BadgeCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-[#0B1E3D]">
                    Disponible
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Commande immédiate
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -right-7 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <Truck size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-[#0B1E3D]">
                    Livraison
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Partout au Bénin
                  </p>
                </div>
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
    ['Électronique', 'Technologie & appareils'],
    ['Mode', 'Vêtements & tendances'],
    ['Chaussures', 'Pour tous les styles'],
    ['Sacs', 'Femme & homme'],
    ['Maison', 'Équipement quotidien'],
    ['Téléphones', 'Smartphones & accessoires'],
  ]

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#0052CC]">
              Explorer
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl">
              Trouvez votre univers
            </h2>
          </div>

          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#0052CC]"
          >
            Voir toutes les catégories
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map(([titre, description], index) => (
            <Link
              key={titre}
              to="/catalogue"
              className="group rounded-2xl border border-slate-100 bg-[#F8FAFC] p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/60"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-black text-[#0052CC] shadow-sm transition group-hover:bg-[#0052CC] group-hover:text-white">
                0{index + 1}
              </div>

              <h3 className="mt-6 text-sm font-black text-[#0B1E3D]">
                {titre}
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {description}
              </p>

              <ChevronRight
                size={16}
                className="mt-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#0052CC]"
              />
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

        if (actif) {
          setProduits(resultat.slice(0, 8))
        }
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
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#0052CC]">
              <Sparkles size={13} />
              Sélection du moment
            </span>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl">
              Les produits du moment
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Une sélection directement issue de votre catalogue.
            </p>
          </div>

          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 text-sm font-black text-[#0052CC]"
          >
            Tout voir
            <ArrowRight size={16} />
          </Link>
        </div>

        {chargement ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="h-[360px] animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        ) : produits.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Package className="mx-auto text-slate-300" size={42} />
            <p className="mt-4 font-bold text-slate-500">
              Aucun produit à afficher pour le moment.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {produits.map((produit) => (
              <article
                key={produit.id}
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60"
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
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <Package size={48} />
                    </div>
                  )}

                  {produit.nouveau && (
                    <span className="absolute left-3 top-3 rounded-full bg-[#0B1E3D] px-2.5 py-1 text-[10px] font-black text-white">
                      NOUVEAU
                    </span>
                  )}

                  {produit.promo > 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-[#FF7A1A] px-2.5 py-1 text-[10px] font-black text-white">
                      -{produit.promo}%
                    </span>
                  )}
                </Link>

                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#0052CC]">
                      {produit.categorie || 'Sélection'}
                    </p>
                    <BadgeDisponibilite produit={produit} />
                  </div>

                  <Link to={`/produit/${produit.id}`}>
                    <h3 className="mt-2 line-clamp-2 min-h-[40px] text-sm font-black leading-5 text-[#0B1E3D] transition hover:text-[#0052CC]">
                      {produit.nom}
                    </h3>
                  </Link>

                  <div className="mt-4">
                    <p className="text-lg font-black text-[#0B1E3D]">
                      {formatPrix(produit.prix)}
                    </p>

                    <button
                      type="button"
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
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052CC] py-3 text-xs font-black text-white transition hover:bg-[#003D99]"
                    >
                      <ShoppingBag size={15} />
                      Ajouter au panier
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

function PourquoiNous() {
  const elements = [
    {
      icone: ShieldCheck,
      titre: 'Paiement sécurisé',
      texte: 'Un parcours de commande conçu pour sécuriser votre achat.',
    },
    {
      icone: Truck,
      titre: 'Livraison ou retrait',
      texte: 'Choisissez le mode de réception qui vous convient.',
    },
    {
      icone: Package,
      titre: 'Stock ou sur commande',
      texte: 'Achetez immédiatement ou demandez un article spécifique.',
    },
    {
      icone: WalletCards,
      titre: 'Prix affichés clairement',
      texte: 'Visualisez votre prix avant de confirmer votre commande.',
    },
  ]

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#0052CC]">
              Pourquoi nous
            </span>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl">
              Pensé pour acheter sans complication.
            </h2>

            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-500">
              ChinaShop-Bénin met l'accent sur une expérience simple :
              découvrir, choisir, commander et recevoir.
            </p>

            <Link
              to="/infos"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0B1E3D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0052CC]"
            >
              Découvrir notre fonctionnement
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {elements.map((element) => {
              const Icon = element.icone

              return (
                <div
                  key={element.titre}
                  className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-6 transition hover:border-blue-100 hover:bg-white hover:shadow-lg"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0052CC]">
                    <Icon size={20} />
                  </div>

                  <h3 className="mt-5 font-black text-[#0B1E3D]">
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

function CommentCaMarche() {
  const etapes = [
    ['01', 'Choisissez', 'Parcourez le catalogue et ouvrez le produit qui vous intéresse.'],
    ['02', 'Commandez', 'Ajoutez vos articles au panier puis renseignez vos informations.'],
    ['03', 'Nous préparons', 'Votre commande est prise en charge selon sa disponibilité.'],
    ['04', 'Recevez', 'Choisissez la livraison ou le retrait selon votre commande.'],
  ]

  return (
    <section className="bg-[#F7F9FC] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-[#0052CC]">
            Simple en quatre étapes
          </span>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl">
            Comment ça marche ?
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {etapes.map(([numero, titre, texte]) => (
            <div
              key={numero}
              className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <span className="text-4xl font-black tracking-tight text-blue-100">
                {numero}
              </span>

              <h3 className="mt-5 font-black text-[#0B1E3D]">{titre}</h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {texte}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TemoignagesPremium() {
  const temoignages = [
    {
      nom: 'Mamadou A.',
      ville: 'Cotonou',
      role: 'Client ChinaShop',
      initiales: 'MA',
      texte:
        'J’ai apprécié la simplicité du parcours. Je trouve mon produit, je passe ma commande et je choisis ensuite comment le recevoir.',
    },
    {
      nom: 'Fatima T.',
      ville: 'Porto-Novo',
      role: 'Cliente ChinaShop',
      initiales: 'FT',
      texte:
        'Le catalogue est facile à consulter et les informations sont beaucoup plus claires. Cela rend l’achat vraiment agréable.',
    },
    {
      nom: 'Jean-Baptiste K.',
      ville: 'Parakou',
      role: 'Client ChinaShop',
      initiales: 'JK',
      texte:
        'J’aime surtout pouvoir choisir entre les articles disponibles et ceux qui peuvent être commandés sur demande.',
    },
    {
      nom: 'Aminata S.',
      ville: 'Abomey',
      role: 'Cliente ChinaShop',
      initiales: 'AS',
      texte:
        'Une expérience simple depuis le téléphone. Je peux consulter les produits et faire ma commande sans complication.',
    },
    {
      nom: 'Kofi M.',
      ville: 'Ouidah',
      role: 'Client ChinaShop',
      initiales: 'KM',
      texte:
        'Le parcours est clair et moderne. On comprend rapidement quoi faire pour commander et récupérer son achat.',
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
      <div className="absolute -left-40 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-300">
            <Heart size={14} />
            Avis clients
          </span>

          <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Une expérience qui compte.
          </h2>
        </div>

        <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.055] p-7 shadow-2xl backdrop-blur-xl sm:p-10 md:p-12">
          <div
            key={index}
            className="animate-[fadeIn_.5s_ease-out]"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0052CC] to-[#1A6BFF] text-sm font-black text-white">
                  {temoignage.initiales}
                </div>

                <div>
                  <h3 className="font-black text-white">
                    {temoignage.nom}
                  </h3>
                  <p className="mt-1 text-xs text-blue-200/60">
                    {temoignage.role} · {temoignage.ville}
                  </p>
                </div>
              </div>

              <div className="flex gap-1 text-lg text-orange-400">
                ★ ★ ★ ★ ★
              </div>
            </div>

            <blockquote className="mt-8 max-w-3xl text-xl font-medium leading-8 text-white/90 sm:text-2xl sm:leading-9">
              “{temoignage.texte}”
            </blockquote>

            <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <CheckCircle2 size={16} />
              Avis client
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-2">
            {temoignages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Témoignage ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === index
                    ? 'w-10 bg-orange-400'
                    : 'w-2.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          <div className="mx-auto mt-4 h-0.5 max-w-xs overflow-hidden rounded-full bg-white/10">
            <div
              key={index}
              className="h-full origin-left bg-orange-400"
              style={{
                animation: 'temoignageProgress 3s linear forwards',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

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
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0B1E3D] to-[#0052CC] px-6 py-12 text-center shadow-2xl shadow-blue-900/10 sm:px-10 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <Sparkles className="mx-auto text-orange-400" size={28} />

          <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Prêt à commencer ?
          </h2>

          <p className="mt-4 text-sm leading-6 text-blue-100/80 sm:text-base">
            Découvrez les produits disponibles et passez votre commande en
            quelques étapes.
          </p>

          <Link
            to="/catalogue"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#FF7A1A] px-7 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-[#FF8B35]"
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
      <Bandeau />
      <Hero />
      <Categories />
      <ProduitsVedette />
      <PourquoiNous />
      <CommentCaMarche />
      <TemoignagesPremium />
      <AppelAction />
    </div>
  )
}
