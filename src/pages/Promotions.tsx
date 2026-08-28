import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowDownUp,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Package,
  Percent,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react'
import { obtenirProduits, type Produit } from '../services/produits'
import { useCart, type CartProduct } from '../context/CartContext'

type Tri =
  | 'pertinence'
  | 'prix-croissant'
  | 'prix-decroissant'
  | 'remise'

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

function CartePromotion({
  produit,
  onAjouter,
}: {
  produit: Produit
  onAjouter: (produit: CartProduct) => void
}) {
  const navigate = useNavigate()

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
    <article className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF7A1A] px-3 py-1.5 text-[10px] font-black text-white shadow-lg">
            <Percent size={12} />
            -{produit.promo}%
          </span>
        </div>

        {produit.nouveau && (
          <span className="absolute right-3 top-3 rounded-full bg-[#0052CC] px-3 py-1.5 text-[10px] font-black text-white shadow-lg">
            Nouveau
          </span>
        )}
      </Link>

      <div className="p-4 sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#0052CC]">
          {produit.categorie || 'Produit'}
        </p>

        <Link to={`/produit/${produit.id}`}>
          <h2 className="mt-2 line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-[#081A33] transition group-hover:text-[#0052CC]">
            {produit.nom}
          </h2>
        </Link>

        <div className="mt-4">
          <p className="text-lg font-black tracking-tight text-[#FF7A1A]">
            {formatPrix(produit.prix)}
          </p>

          {produit.prixOriginal &&
            produit.prixOriginal > produit.prix && (
              <div className="mt-1 flex items-center gap-2">
                <p className="text-xs text-slate-400 line-through">
                  {formatPrix(produit.prixOriginal)}
                </p>
                <span className="text-[10px] font-bold text-emerald-600">
                  Offre avantageuse
                </span>
              </div>
            )}
        </div>

        <div className="mt-4">
          <BadgeDisponibilite produit={produit} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={indisponible}
            onClick={ajouterAuPanier}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[#081A33] px-2 text-xs font-black text-[#081A33] transition hover:border-[#0052CC] hover:bg-blue-50 hover:text-[#0052CC] disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >
            <ShoppingBag size={15} />
            Ajouter
          </button>

          <button
            type="button"
            disabled={indisponible}
            onClick={commander}
            className="min-h-11 rounded-xl bg-[#081A33] px-2 text-xs font-black text-white transition hover:bg-[#0052CC] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            Commander
          </button>
        </div>
      </div>
    </article>
  )
}

export default function Promotions() {
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
          'Erreur chargement promotions:',
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

  const promotions = useMemo(() => {
    const terme = recherche.trim().toLowerCase()

    const resultat = produits.filter((produit) => {
      const visible =
        produit.stock > 0 ||
        produit.disponibilite === 'sur_commande'

      if (!visible || produit.promo <= 0) return false

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

      if (tri === 'remise') {
        return b.promo - a.promo
      }

      return 0
    })
  }, [produits, recherche, tri])

  function reinitialiser() {
    setRecherche('')
    setTri('pertinence')
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-[#F7F9FC]">
        <div className="absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-orange-100/70 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-blue-100/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-xs font-bold text-[#FF7A1A] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#FF7A1A]" />
              <Percent size={14} />
              Offres du moment
            </div>

            <h1 className="mt-6 text-4xl font-black leading-[1.04] tracking-tight text-[#081A33] sm:text-5xl lg:text-6xl">
              Profitez des bonnes affaires.
              <span className="mt-2 block text-[#FF7A1A]">
                Les promotions ChinaShop.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Découvrez les produits actuellement proposés à prix réduit.
              Les offres affichées correspondent aux promotions disponibles
              dans notre catalogue.
            </p>

            <div className="mt-8 flex max-w-xl items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/50">
              <Search className="ml-3 shrink-0 text-slate-400" size={20} />

              <input
                value={recherche}
                onChange={(event) => setRecherche(event.target.value)}
                placeholder="Rechercher une promotion..."
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-medium text-[#081A33] outline-none placeholder:text-slate-400"
              />

              {recherche && (
                <button
                  type="button"
                  onClick={() => setRecherche('')}
                  className="mr-1 rounded-xl p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                  aria-label="Effacer la recherche"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/catalogue"
                className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A1A] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-[#F06D0A]"
              >
                Découvrir le catalogue
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/nouveautes"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-[#081A33] shadow-sm transition hover:border-blue-200 hover:text-[#0052CC]"
              >
                Voir les nouveautés
                <Sparkles size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FF7A1A]">
                Sélection promotionnelle
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-[#081A33] sm:text-4xl">
                Nos promotions
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                Les offres actuellement disponibles sur ChinaShop-Bénin.
              </p>
            </div>

            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm sm:min-w-60">
              <ArrowDownUp size={16} className="text-slate-400" />

              <select
                value={tri}
                onChange={(event) =>
                  setTri(event.target.value as Tri)
                }
                className="w-full bg-transparent text-sm font-semibold text-[#081A33] outline-none"
              >
                <option value="pertinence">Pertinence</option>
                <option value="remise">Réduction la plus forte</option>
                <option value="prix-croissant">Prix croissant</option>
                <option value="prix-decroissant">Prix décroissant</option>
              </select>
            </label>
          </div>

          <div className="mt-7">
            <p className="text-sm font-bold text-[#081A33]">
              {chargement
                ? 'Chargement des offres...'
                : `${promotions.length} offre${
                    promotions.length > 1 ? 's' : ''
                  } disponible${promotions.length > 1 ? 's' : ''}`}
            </p>

            {!chargement && (
              <p className="mt-1 text-xs text-slate-400">
                Les prix et disponibilités sont actualisés depuis le catalogue.
              </p>
            )}
          </div>

          {chargement ? (
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
                >
                  <div className="aspect-square animate-pulse bg-slate-200" />

                  <div className="space-y-3 p-4 sm:p-5">
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                    <div className="h-5 w-4/5 animate-pulse rounded bg-slate-200" />
                    <div className="h-5 w-2/5 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                    <div className="h-11 animate-pulse rounded-xl bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : promotions.length > 0 ? (
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {promotions.map((produit) => (
                <CartePromotion
                  key={produit.id}
                  produit={produit}
                  onAjouter={ajouter}
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-[2rem] border border-slate-100 bg-[#F7F9FC] px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-[#FF7A1A]">
                <Percent size={28} />
              </div>

              <h2 className="mt-5 text-2xl font-black text-[#081A33]">
                Aucune promotion disponible
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                {recherche
                  ? 'Aucun produit en promotion ne correspond à votre recherche.'
                  : 'Nos offres évoluent régulièrement. Consultez le catalogue pour découvrir les produits actuellement disponibles.'}
              </p>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                {recherche && (
                  <button
                    type="button"
                    onClick={reinitialiser}
                    className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-[#081A33] transition hover:bg-slate-50"
                  >
                    Effacer la recherche
                  </button>
                )}

                <Link
                  to="/catalogue"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#081A33] px-5 text-sm font-black text-white transition hover:bg-[#0052CC]"
                >
                  Explorer le catalogue
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
