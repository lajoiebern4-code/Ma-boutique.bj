import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowDownUp,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  Heart,
  Package,
  Search,
  ShoppingCart,
  Sparkles,
  Truck,
  X,
  Zap,
} from 'lucide-react'
import { obtenirProduits, type Produit } from '../services/produits'
import { useCart, type CartProduct } from '../context/CartContext'
import { CATEGORIES } from '../data/categories'

type Tri =
  | 'pertinence'
  | 'prix-croissant'
  | 'prix-decroissant'
  | 'nouveautes'

function formatPrix(prix: number) {
  return `${Number(prix || 0).toLocaleString('fr-FR')} FCFA`
}

function convertirProduitPanier(
  produit: Produit,
  surCommande: boolean,
): CartProduct {
  return {
    id: produit.id,
    nom: produit.nom,
    prix: produit.prix,
    image_url: produit.image_url || null,
    stock: produit.stock,
    surCommande,
  }
}

function BadgeDisponibilite({ produit }: { produit: Produit }) {
  const enStock = produit.stock > 0
  const surCommande =
    produit.stock <= 0 && produit.disponibilite === 'sur_commande'

  if (enStock) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/95 px-3 py-1.5 text-[10px] font-black text-emerald-700 shadow-sm backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Disponible
      </span>
    )
  }

  if (surCommande) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/95 px-3 py-1.5 text-[10px] font-black text-amber-700 shadow-sm backdrop-blur">
        <Clock3 size={12} />
        Sur commande
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1.5 text-[10px] font-black text-white">
      Indisponible
    </span>
  )
}

function CarteProduit({
  produit,
  onAjouter,
}: {
  produit: Produit
  onAjouter: (produit: CartProduct) => void
}) {
  const navigate = useNavigate()
  const [favori, setFavori] = useState(false)

  const enStock = produit.stock > 0
  const surCommande =
    produit.stock <= 0 && produit.disponibilite === 'sur_commande'
  const indisponible = !enStock && !surCommande

  const produitPanier = convertirProduitPanier(produit, surCommande)

  const ajouterAuPanier = () => {
    if (indisponible) return
    onAjouter(produitPanier)
  }

  const commander = () => {
    if (indisponible) return
    onAjouter(produitPanier)
    navigate('/commande')
  }

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white shadow-[0_8px_35px_rgba(15,23,42,0.05)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_25px_60px_rgba(15,23,42,0.12)]">
      <div className="absolute right-3 top-3 z-10">
        <button
          type="button"
          onClick={() => setFavori((value) => !value)}
          aria-label={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur transition ${
            favori
              ? 'border-red-100 bg-red-50 text-red-500'
              : 'border-white/70 bg-white/90 text-slate-500 hover:text-red-500'
          }`}
        >
          <Heart size={16} fill={favori ? 'currentColor' : 'none'} />
        </button>
      </div>

      <Link
        to={`/produit/${produit.id}`}
        className="block"
        aria-label={`Voir ${produit.nom}`}
      >
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          {produit.image_url ? (
            <img
              src={produit.image_url}
              alt={produit.nom}
              className={`h-full w-full object-cover transition duration-700 ${
                indisponible ? 'grayscale-[0.35]' : ''
              } group-hover:scale-[1.07]`}
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300">
              <Package size={48} strokeWidth={1.2} />
            </div>
          )}

          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {produit.nouveau && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#0052CC] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white shadow-lg">
                  <Sparkles size={11} />
                  Nouveau
                </span>
              )}

              {produit.promo > 0 && (
                <span className="rounded-full bg-[#FF7A1A] px-3 py-1.5 text-[10px] font-black text-white shadow-lg">
                  -{produit.promo}%
                </span>
              )}
            </div>

            <BadgeDisponibilite produit={produit} />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/15 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="truncate text-[10px] font-black uppercase tracking-[0.15em] text-[#0052CC]">
          {produit.categorie || 'Sélection ChinaShop'}
        </p>

        <Link to={`/produit/${produit.id}`}>
          <h3 className="mt-2 line-clamp-2 min-h-[2.8rem] text-sm font-extrabold leading-5 text-[#0B1E3D] transition-colors group-hover:text-[#0052CC] sm:text-[15px]">
            {produit.nom}
          </h3>
        </Link>

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-lg font-black tracking-tight text-[#0B1E3D] sm:text-xl">
                {formatPrix(produit.prix)}
              </p>

              {produit.promo > 0 && (
                <p className="mt-0.5 text-[11px] font-semibold text-slate-400 line-through">
                  Prix habituel
                </p>
              )}
            </div>

            {enStock && (
              <span className="text-[10px] font-bold text-slate-400">
                {produit.stock} disponible{produit.stock > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <button
              type="button"
              onClick={ajouterAuPanier}
              disabled={indisponible}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0052CC] px-3 text-xs font-black text-white transition-all hover:bg-[#003D99] hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              <ShoppingCart size={16} />
              Ajouter
            </button>

            {!indisponible && (
              <button
                type="button"
                onClick={commander}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0B1E3D] transition hover:border-[#0052CC] hover:text-[#0052CC]"
                aria-label="Commander maintenant"
              >
                <ArrowRight size={17} />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

function SkeletonCarte() {
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-slate-100 bg-white">
      <div className="aspect-square animate-pulse bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-2.5 w-24 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
        <div className="pt-3">
          <div className="h-6 w-32 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="h-11 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </div>
  )
}

export default function Catalogue() {
  const { ajouter } = useCart()

  const [produits, setProduits] = useState<Produit[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [categorie, setCategorie] = useState('tous')
  const [sousCategorie, setSousCategorie] = useState('tous')
  const [disponibilite, setDisponibilite] = useState('tous')
  const [tri, setTri] = useState<Tri>('pertinence')
  const [filtresOuverts, setFiltresOuverts] = useState(false)

  useEffect(() => {
    let actif = true

    async function charger() {
      setChargement(true)
      setErreur('')

      try {
        const resultat = await obtenirProduits()

        if (actif) {
          setProduits(resultat)
        }
      } catch (err) {
        console.error(err)

        if (actif) {
          setErreur(
            err instanceof Error
              ? err.message
              : 'Impossible de charger le catalogue.',
          )
        }
      } finally {
        if (actif) {
          setChargement(false)
        }
      }
    }

    charger()

    return () => {
      actif = false
    }
  }, [])

  const categorieActive = CATEGORIES.find(
    (item) => item.id === categorie,
  )

  const produitsVisibles = useMemo(() => {
    return produits.filter(
      (produit) =>
        produit.stock > 0 ||
        produit.disponibilite === 'sur_commande',
    )
  }, [produits])

  const produitsFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase()

    const resultat = produitsVisibles.filter((produit) => {
      const correspondRecherche =
        !terme ||
        produit.nom.toLowerCase().includes(terme) ||
        String(produit.categorie || '')
          .toLowerCase()
          .includes(terme)

      const correspondCategorie =
        categorie === 'tous' ||
        produit.categorie === categorie ||
        produit.categorie_id === categorie

      const correspondSousCategorie =
        sousCategorie === 'tous' ||
        produit.sous_categorie === sousCategorie ||
        produit.sousCategorie === sousCategorie

      const correspondDisponibilite =
        disponibilite === 'tous' ||
        (disponibilite === 'disponible' && produit.stock > 0) ||
        (disponibilite === 'sur_commande' &&
          produit.disponibilite === 'sur_commande')

      return (
        correspondRecherche &&
        correspondCategorie &&
        correspondSousCategorie &&
        correspondDisponibilite
      )
    })

    return [...resultat].sort((a, b) => {
      if (tri === 'prix-croissant') {
        return a.prix - b.prix
      }

      if (tri === 'prix-decroissant') {
        return b.prix - a.prix
      }

      if (tri === 'nouveautes') {
        return Number(b.nouveau) - Number(a.nouveau)
      }

      return 0
    })
  }, [
    produitsVisibles,
    recherche,
    categorie,
    sousCategorie,
    disponibilite,
    tri,
  ])

  const nombreFiltresActifs =
    (recherche.trim() ? 1 : 0) +
    (categorie !== 'tous' ? 1 : 0) +
    (sousCategorie !== 'tous' ? 1 : 0) +
    (disponibilite !== 'tous' ? 1 : 0)

  function changerCategorie(value: string) {
    setCategorie(value)
    setSousCategorie('tous')
  }

  function reinitialiserFiltres() {
    setRecherche('')
    setCategorie('tous')
    setSousCategorie('tous')
    setDisponibilite('tous')
    setTri('pertinence')
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1E3D]">
      {/* TOP BAR */}
      <div className="bg-[#071428] px-4 py-2.5 text-center text-[11px] font-bold text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
          <Zap size={13} className="text-orange-400" />
          <span>
            Produits disponibles au Bénin · Livraison ou retrait · Commande
            simple et sécurisée
          </span>
        </div>
      </div>

      {/* HERO CATALOGUE */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute -bottom-48 -left-40 h-[30rem] w-[30rem] rounded-full bg-orange-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 lg:px-8 lg:pt-16">
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-[#0052CC]">
                <Sparkles size={13} />
                Catalogue ChinaShop-Bénin
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.035em] text-[#0B1E3D] sm:text-5xl lg:text-6xl">
                Trouvez le bon produit.
                <span className="block text-[#0052CC]">
                  Achetez sans complication.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                Explorez notre sélection de produits disponibles au Bénin ou
                accessibles sur commande. Recherchez, comparez et ajoutez
                directement vos articles au panier.
              </p>
            </div>

            <div className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={21} />
                </div>
                <div>
                  <p className="text-xs font-black text-[#0B1E3D]">
                    Sélection active
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Produits vérifiés pour commander
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH */}
          <div className="mt-10 rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_15px_50px_rgba(11,30,61,0.08)]">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={recherche}
                  onChange={(event) => setRecherche(event.target.value)}
                  placeholder="Rechercher un produit, une catégorie..."
                  className="h-14 w-full rounded-xl bg-slate-50 pl-12 pr-11 text-sm font-semibold text-[#0B1E3D] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

                {recherche && (
                  <button
                    type="button"
                    onClick={() => setRecherche('')}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Effacer la recherche"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setFiltresOuverts((value) => !value)}
                className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition ${
                  filtresOuverts || nombreFiltresActifs > 0
                    ? 'bg-[#0B1E3D] text-white'
                    : 'bg-slate-50 text-[#0B1E3D] hover:bg-slate-100'
                }`}
              >
                <Filter size={17} />
                Filtres
                {nombreFiltresActifs > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF7A1A] px-1 text-[10px] text-white">
                    {nombreFiltresActifs}
                  </span>
                )}
              </button>

              <div className="relative">
                <ArrowDownUp
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={tri}
                  onChange={(event) => setTri(event.target.value as Tri)}
                  className="h-14 w-full min-w-[190px] appearance-none rounded-xl bg-slate-50 pl-10 pr-10 text-xs font-black text-[#0B1E3D] outline-none transition hover:bg-slate-100 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="pertinence">Pertinence</option>
                  <option value="nouveautes">Nouveautés</option>
                  <option value="prix-croissant">Prix croissant</option>
                  <option value="prix-decroissant">Prix décroissant</option>
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {/* CATEGORIES */}
        <section className="-mt-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-600">
                Explorer
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#0B1E3D]">
                Catégories
              </h2>
            </div>

            <span className="hidden text-xs font-semibold text-slate-400 sm:block">
              {produitsVisibles.length} référence
              {produitsVisibles.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => changerCategorie('tous')}
              className={`shrink-0 rounded-full px-5 py-3 text-xs font-black transition ${
                categorie === 'tous'
                  ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-500/20'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-[#0052CC]'
              }`}
            >
              Tout
            </button>

            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => changerCategorie(item.id)}
                className={`shrink-0 rounded-full px-5 py-3 text-xs font-black transition ${
                  categorie === item.id
                    ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-500/20'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-[#0052CC]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {/* FILTER PANEL */}
        <section
          className={`overflow-hidden transition-all duration-300 ${
            filtresOuverts
              ? 'mt-5 max-h-[700px] opacity-100'
              : 'max-h-0 opacity-0'
          }`}
        >
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Sous-catégorie
                </span>
                <select
                  value={sousCategorie}
                  onChange={(event) =>
                    setSousCategorie(event.target.value)
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0B1E3D] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="tous">Toutes les sous-catégories</option>
                  {categorieActive?.sousCategories?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Disponibilité
                </span>
                <select
                  value={disponibilite}
                  onChange={(event) =>
                    setDisponibilite(event.target.value)
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0B1E3D] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="tous">Toutes les disponibilités</option>
                  <option value="disponible">En stock</option>
                  <option value="sur_commande">Sur commande</option>
                </select>
              </label>
            </div>

            {nombreFiltresActifs > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
                <span className="mr-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Actifs
                </span>

                {recherche.trim() && (
                  <button
                    type="button"
                    onClick={() => setRecherche('')}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-700"
                  >
                    Recherche
                    <X size={12} />
                  </button>
                )}

                {categorie !== 'tous' && (
                  <button
                    type="button"
                    onClick={() => changerCategorie('tous')}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black text-blue-700"
                  >
                    Catégorie
                    <X size={12} />
                  </button>
                )}

                {sousCategorie !== 'tous' && (
                  <button
                    type="button"
                    onClick={() => setSousCategorie('tous')}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black text-blue-700"
                  >
                    Sous-catégorie
                    <X size={12} />
                  </button>
                )}

                {disponibilite !== 'tous' && (
                  <button
                    type="button"
                    onClick={() => setDisponibilite('tous')}
                    className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-black text-orange-700"
                  >
                    Disponibilité
                    <X size={12} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={reinitialiserFiltres}
                  className="ml-auto text-[10px] font-black text-[#0052CC] underline underline-offset-4"
                >
                  Tout effacer
                </button>
              </div>
            )}
          </div>
        </section>

        {/* RESULTATS */}
        <section className="mt-10">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Sélection actuelle
                </p>
              </div>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0B1E3D] sm:text-3xl">
                {recherche.trim()
                  ? `Résultats pour « ${recherche.trim()} »`
                  : 'Tous les produits'}
              </h2>
            </div>

            {!chargement && (
              <p className="text-xs font-bold text-slate-400">
                {produitsFiltres.length} produit
                {produitsFiltres.length > 1 ? 's' : ''} trouvé
                {produitsFiltres.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {erreur ? (
            <div className="mt-8 rounded-[1.5rem] border border-red-100 bg-red-50 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm">
                <X size={24} />
              </div>
              <h2 className="mt-4 text-lg font-black text-[#0B1E3D]">
                Le catalogue n'a pas pu être chargé
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                {erreur}
              </p>
            </div>
          ) : chargement ? (
            <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCarte key={index} />
              ))}
            </div>
          ) : produitsFiltres.length > 0 ? (
            <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {produitsFiltres.map((produit) => (
                <CarteProduit
                  key={produit.id}
                  produit={produit}
                  onAjouter={ajouter}
                />
              ))}
            </div>
          ) : (
            <div className="mt-7 overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search size={27} />
              </div>

              <h2 className="mt-5 text-xl font-black text-[#0B1E3D]">
                Aucun produit trouvé
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Nous n'avons trouvé aucun article correspondant à ces
                critères. Modifiez votre recherche ou réinitialisez les
                filtres.
              </p>

              <button
                type="button"
                onClick={reinitialiserFiltres}
                className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0052CC] px-6 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#003D99]"
              >
                <Check size={17} />
                Afficher toute la sélection
              </button>
            </div>
          )}
        </section>

        {/* TRUST STRIP */}
        {!chargement && produitsVisibles.length > 0 && (
          <section className="mt-12 overflow-hidden rounded-[1.7rem] bg-[#0B1E3D]">
            <div className="grid md:grid-cols-3">
              <div className="flex items-center gap-4 border-b border-white/10 p-6 md:border-b-0 md:border-r">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-orange-400">
                  <ShieldCheckIcon />
                </div>
                <div>
                  <p className="text-xs font-black text-white">
                    Commande sécurisée
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-blue-100/60">
                    Processus clair et suivi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 border-b border-white/10 p-6 md:border-b-0 md:border-r">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-orange-400">
                  <Truck size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-white">
                    Livraison au Bénin
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-blue-100/60">
                    Livraison ou retrait selon votre choix
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-orange-400">
                  <Package size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-white">
                    Stock ou commande
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-blue-100/60">
                    Une solution selon la disponibilité
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* INFO */}
        {!chargement && produitsVisibles.length > 0 && (
          <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-[#0B1E3D]">
                  Une question avant votre commande ?
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Consultez les informations concernant les commandes,
                  paiements, livraison et retrait.
                </p>
              </div>

              <Link
                to="/infos"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-5 text-xs font-black text-[#0B1E3D] transition hover:border-[#0052CC] hover:text-[#0052CC]"
              >
                Voir les informations
                <ArrowRight size={15} />
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function ShieldCheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 3 5 6v5c0 4.5 2.9 8.5 7 10 4.1-1.5 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
