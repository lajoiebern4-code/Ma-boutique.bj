import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowDownUp,
  ArrowRight,
  Search,
  ShoppingCart,
  Sparkles,
  X,
} from 'lucide-react'
import { obtenirProduits, type Produit } from '../services/produits'
import { useCart, type CartProduct } from '../context/CartContext'

type Tri =
  | 'pertinence'
  | 'prix-croissant'
  | 'prix-decroissant'

function formatPrix(prix: number) {
  return `${prix.toLocaleString('fr-FR')} FCFA`
}

function CarteNouveau({
  produit,
  onAjouter,
}: {
  produit: Produit
  onAjouter: (produit: CartProduct) => void
}) {
  const navigate = useNavigate()

  const enStock = produit.stock > 0
  const surCommande =
    produit.stock <= 0 && produit.disponibilite === 'sur_commande'
  const indisponible =
    produit.stock <= 0 && produit.disponibilite !== 'sur_commande'

  const produitPanier: CartProduct = {
    id: produit.id,
    nom: produit.nom,
    prix: produit.prix,
    image_url: produit.image_url || null,
    stock: produit.stock,
    surCommande,
  }

  function ajouterAuPanier() {
    if (indisponible) return
    onAjouter(produitPanier)
  }

  function commander() {
    if (indisponible) return
    onAjouter(produitPanier)
    navigate('/commande')
  }

  return (
    <article className="group overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link to={`/produit/${produit.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          {produit.image_url ? (
            <img
              src={produit.image_url}
              alt={produit.nom}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Image indisponible
            </div>
          )}

          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#0284C7] px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm">
            <Sparkles size={12} />
            Nouveau
          </span>

          {produit.promo > 0 && (
            <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm">
              -{produit.promo}%
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
          {produit.categorie || 'Produit'}
        </p>

        <Link to={`/produit/${produit.id}`}>
          <h2 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[#0B1E3D] transition hover:text-orange-600">
            {produit.nom}
          </h2>
        </Link>

        <div className="mt-3">
          <p className="text-base font-black text-[#0B1E3D]">
            {formatPrix(produit.prix)}
          </p>

          {produit.prixOriginal &&
            produit.prixOriginal > produit.prix && (
              <p className="text-xs text-slate-400 line-through">
                {formatPrix(produit.prixOriginal)}
              </p>
            )}
        </div>

        <div className="mt-4">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
              enStock
                ? 'bg-emerald-50 text-emerald-700'
                : surCommande
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-slate-100 text-slate-500'
            }`}
          >
            {enStock
              ? 'Disponible'
              : surCommande
                ? 'Sur commande'
                : 'Indisponible'}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={indisponible}
            onClick={ajouterAuPanier}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[#0B1E3D] px-2 text-xs font-bold text-[#0B1E3D] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >
            <ShoppingCart size={15} />
            Ajouter
          </button>

          <button
            type="button"
            disabled={indisponible}
            onClick={commander}
            className="min-h-11 rounded-xl bg-[#0284C7] px-2 text-xs font-bold text-white transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            Commander
          </button>
        </div>
      </div>
    </article>
  )
}

export default function Nouveautes() {
  const { ajouter } = useCart()

  const [produits, setProduits] = useState<Produit[]>([])
  const [chargement, setChargement] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [tri, setTri] = useState<Tri>('pertinence')

  useEffect(() => {
    let actif = true

    async function charger() {
      try {
        const resultat = await Promise.race([
          obtenirProduits(),
          new Promise<Produit[]>((_, reject) =>
            setTimeout(
              () => reject(new Error('TIMEOUT SUPABASE 10s')),
              10000,
            ),
          ),
        ])

        if (actif) {
          setProduits(resultat)
        }
      } catch (err) {
        console.error(
          'Erreur chargement nouveautés:',
          err instanceof Error ? err.message : String(err),
        )
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

  const nouveautes = useMemo(() => {
    const terme = recherche.trim().toLowerCase()

    const resultat = produits.filter((produit) => {
      const visible =
        produit.stock > 0 ||
        produit.disponibilite === 'sur_commande'

      if (!visible || !produit.nouveau) return false

      if (!terme) return true

      return (
        produit.nom.toLowerCase().includes(terme) ||
        produit.description?.toLowerCase().includes(terme) ||
        produit.categorie?.toLowerCase().includes(terme)
      )
    })

    return [...resultat].sort((a, b) => {
      if (tri === 'prix-croissant') {
        return a.prix - b.prix
      }

      if (tri === 'prix-decroissant') {
        return b.prix - a.prix
      }

      return 0
    })
  }, [produits, recherche, tri])

  function reinitialiser() {
    setRecherche('')
    setTri('pertinence')
  }

  return (
    <div className="min-h-[70vh]">
      <section className="relative overflow-hidden bg-[#0284C7]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-300">
              <Sparkles size={13} />
              Dernières arrivées
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Les nouveautés ChinaShop-Benin
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Découvrez les produits récemment ajoutés à notre sélection.
              Nous privilégions des articles intéressants, au juste prix et
              avec une disponibilité clairement indiquée.
            </p>

            <Link
              to="/catalogue"
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0284C7] px-5 text-sm font-bold text-white transition hover:bg-[#0369A1] active:scale-[0.98]"
            >
              Voir tout le catalogue
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-xl">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Rechercher parmi les nouveautés..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
            />

            {recherche && (
              <button
                type="button"
                onClick={() => setRecherche('')}
                className="absolute right-3 top-1/2 flex -translate-y-1/2 p-2 text-slate-400 transition hover:text-slate-700"
                aria-label="Effacer la recherche"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 lg:min-w-52">
            <ArrowDownUp size={16} className="text-slate-400" />

            <select
              value={tri}
              onChange={(event) =>
                setTri(event.target.value as Tri)
              }
              className="w-full bg-transparent text-sm font-semibold text-[#0B1E3D] outline-none"
            >
              <option value="pertinence">Pertinence</option>
              <option value="prix-croissant">Prix croissant</option>
              <option value="prix-decroissant">
                Prix décroissant
              </option>
            </select>
          </label>
        </div>

        <div className="mt-7 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#0B1E3D]">
              {chargement
                ? 'Chargement des nouveautés...'
                : `${nouveautes.length} nouveauté${
                    nouveautes.length > 1 ? 's' : ''
                  }`}
            </p>

            {!chargement && (
              <p className="mt-1 text-xs text-slate-400">
                Une sélection actualisée au fil des arrivages.
              </p>
            )}
          </div>
        </div>

        {chargement ? (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200"
              >
                <div className="aspect-square animate-pulse bg-slate-200" />
                <div className="space-y-3 p-4">
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                  <div className="h-5 w-4/5 animate-pulse rounded bg-slate-200" />
                  <div className="h-5 w-2/5 animate-pulse rounded bg-slate-200" />
                  <div className="h-10 animate-pulse rounded-xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : nouveautes.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {nouveautes.map((produit) => (
              <CarteNouveau
                key={produit.id}
                produit={produit}
                onAjouter={ajouter}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-slate-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <Sparkles size={25} />
            </div>

            <h2 className="mt-5 text-xl font-black text-[#0B1E3D]">
              Aucune nouveauté à afficher
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {recherche
                ? 'Aucun produit récent ne correspond à votre recherche.'
                : 'De nouveaux produits seront ajoutés ici au fur et à mesure de nos arrivages.'}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              {recherche && (
                <button
                  type="button"
                  onClick={reinitialiser}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-[#0B1E3D] transition hover:bg-slate-50"
                >
                  Effacer la recherche
                </button>
              )}

              <Link
                to="/catalogue"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-5 text-sm font-bold text-white transition hover:bg-[#0369A1]"
              >
                Explorer le catalogue
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
