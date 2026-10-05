import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowDownUp,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Package,
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

function CarteNouveaute({
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
    poids_kg: produit.poids_kg,
    volume_cbm: produit.volume_cbm,
    surCommande,
    categorie: produit.categorie,
    sous_categorie: produit.sous_categorie,
  }

  function ajouterAuPanier() {
    if (indisponible) return
    onAjouter(produitPanier)
  }

  function commander() {
    if (indisponible) return
    onAjouter(produitPanier)
    navigate('/panier')
  }

  return (
    <article className="group overflow-hidden rounded-[14px] border border-[#FAF9F6] bg-white shadow-sm transition duration-300">
      <Link
        to={`/produit/${produit.id}`}
        className="relative block aspect-square overflow-hidden bg-[#FAF9F6]"
      >
        {produit.image_url ? (
          <img
            src={produit.image_url}
            alt={produit.nom}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#B0A9BA]">
            <Package size={52} strokeWidth={1.2} />
          </div>
        )}

        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F1B3D] !text-white px-3 py-1.5 text-[10px] font-black text-white shadow-sm">
            <Sparkles size={12} />
            Nouveau
          </span>
        </div>

        {produit.promo > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-[#0F1B3D] !text-white px-3 py-1.5 text-[10px] font-black text-white shadow-sm">
            -{produit.promo}%
          </span>
        )}
      </Link>

      <div className="p-4 sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#0F1B3D]">
          {produit.categorie || 'Produit'}
        </p>

        <Link to={`/produit/${produit.id}`}>
          <h2 className="mt-2 line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-[#1A1A2E] transition group-hover:text-[#0F1B3D]">
            {produit.nom}
          </h2>
        </Link>

        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-black tracking-tight text-[#1A1A2E]">
              {formatPrix(produit.prix)}
            </p>

            {produit.prixOriginal &&
              produit.prixOriginal > produit.prix && (
                <p className="mt-1 text-xs text-[#9A93A5] line-through">
                  {formatPrix(produit.prixOriginal)}
                </p>
              )}
          </div>
        </div>

        <div className="mt-4">
          <BadgeDisponibilite produit={produit} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            disabled={indisponible}
            onClick={ajouterAuPanier}
            className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#FAF9F6] bg-white px-3 shrink-0 text-[#1A1A2E] transition hover:border-[#0F1B3D] hover:bg-[#FAF9F6] hover:text-[#0F1B3D] disabled:cursor-not-allowed disabled:border-[#FAF9F6] disabled:text-[#9A93A5]"
          >
            <ShoppingBag size={15} />
          </button>

          <button
            type="button"
            disabled={indisponible}
            onClick={commander}
            className="inline-flex flex-1 min-h-9 items-center justify-center gap-1 rounded-[10px] bg-gradient-to-r from-[#C9A24B] to-[#F59E0B] px-3 text-[11px] font-bold text-[#0F1B3D] shadow-[0_4px_14px_rgba(201,162,75,0.25)] transition-all duration-150 hover:from-[#D97706] hover:to-[#F59E0B] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#FAF9F6] disabled:text-[#9A93A5]"
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
    <div className="min-h-screen bg-white">
      <section className="relative isolate overflow-hidden bg-[#FFFFFF] border-b border-[#FAF9F6]">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#0F1B3D]/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[28rem] w-[28rem] rounded-full bg-[#0F1B3D]/5 blur-3xl" />
        <div className="absolute inset-0 " />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.7fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#1A1A2E] backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-[#0F1B3D]" />
                <Sparkles size={14} />
                Nouveautés ChinaShop-Bénin
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-tight text-[#1A1A2E] sm:text-5xl lg:text-6xl">
                Découvrez ce qui vient
                <span className="mt-2 block text-[#0F1B3D]">
                  d'arriver.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-sm leading-7 text-[#6B7280] sm:text-base">
                Les derniers produits ajoutés à ChinaShop-Bénin,
                sélectionnés pour vous permettre de découvrir rapidement
                les nouveaux arrivages disponibles en stock ou sur commande.
              </p>

              <div className="mt-8 flex max-w-2xl items-center rounded-[10px] border border-[#FAF9F6] bg-white p-2 shadow-sm">
                <Search
                  className="ml-3 shrink-0 text-[#9A93A5]"
                  size={20}
                />

                <input
                  value={recherche}
                  onChange={(event) => setRecherche(event.target.value)}
                  placeholder="Rechercher une nouveauté..."
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-medium text-[#1A1A2E] outline-none placeholder:text-[#9A93A5]"
                />

                {recherche && (
                  <button
                    type="button"
                    onClick={() => setRecherche('')}
                    className="mr-1 rounded-[10px] p-2 text-[#9A93A5] transition hover:bg-[#FAF9F6] hover:text-[#1A1A2E]"
                    aria-label="Effacer la recherche"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/catalogue"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-[#0F1B3D] !text-white px-6 text-sm font-black text-white shadow-sm transition hover:bg-[#C9A24B] hover:text-[#0F1B3D]"
                >
                  Explorer le catalogue
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to="/promotions"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-[#FAF9F6] bg-white px-6 text-sm font-black text-[#1A1A2E] backdrop-blur transition hover:bg-white/15"
                >
                  Voir les promotions
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm">
              <div className="rounded-[14px] border border-white/10 bg-white/10 p-3 shadow-sm backdrop-blur">
                <div className="rounded-[14px] bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                        Sélection récente
                      </p>
                      <p className="mt-1 text-xl font-black text-[#1A1A2E]">
                        Nouveaux arrivages
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#FAF9F6] text-[#0F1B3D]">
                      <Sparkles size={21} />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {([
                      ['01', 'Nouveaux produits', Sparkles],
                      ['02', 'Disponibles en stock', CheckCircle2],
                      ['03', 'Sur commande', Clock3],
                    ] as const).map(([n, label, Icon]) => {
                      const StepIcon = Icon as typeof CheckCircle2

                      return (
                        <div
                          key={String(n)}
                          className="flex items-center gap-3 rounded-[10px] bg-[#FFFFFF] p-3"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#FAF9F6] text-xs font-black text-[#0F1B3D]">
                            {n}
                          </span>

                          <span className="flex-1 text-sm font-bold text-[#1A1A2E]">
                            {label}
                          </span>

                          <StepIcon
                            size={17}
                            className="text-[#0F1B3D]"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-3 hidden rounded-[10px] border border-[#FAF9F6] bg-white px-4 py-3 text-[#1A1A2E] shadow-sm sm:block">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#6B7280]">
                  ChinaShop-Bénin
                </p>
                <p className="mt-1 text-sm font-black">
                  Arrivages réguliers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F1B3D]">
                Sélection récente
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-[#1A1A2E] sm:text-4xl">
                Nos nouveautés
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#6B7280]">
                Les derniers articles ajoutés à votre catalogue.
              </p>
            </div>

            <label className="flex min-h-11 items-center gap-2 rounded-[10px] border border-[#FAF9F6] bg-white px-3 shadow-sm sm:min-w-56">
              <ArrowDownUp size={16} className="text-[#9A93A5]" />

              <select
                value={tri}
                onChange={(event) =>
                  setTri(event.target.value as Tri)
                }
                className="w-full bg-transparent text-sm font-semibold text-[#1A1A2E] outline-none"
              >
                <option value="pertinence">Pertinence</option>
                <option value="prix-croissant">Prix croissant</option>
                <option value="prix-decroissant">Prix décroissant</option>
              </select>
            </label>
          </div>

          <div className="mt-7">
            <p className="text-sm font-bold text-[#1A1A2E]">
              {chargement
                ? 'Chargement des nouveautés...'
                : `${nouveautes.length} nouveauté${
                    nouveautes.length > 1 ? 's' : ''
                  }`}
            </p>

            {!chargement && (
              <p className="mt-1 text-xs text-[#9A93A5]">
                Une sélection actualisée au fil des arrivages.
              </p>
            )}
          </div>

          {chargement ? (
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-[14px] border border-[#FAF9F6] bg-white shadow-sm"
                >
                  <div className="aspect-square animate-pulse bg-[#FAF9F6]" />

                  <div className="space-y-3 p-4 sm:p-5">
                    <div className="h-3 w-20 animate-pulse rounded bg-[#FAF9F6]" />
                    <div className="h-5 w-4/5 animate-pulse rounded bg-[#FAF9F6]" />
                    <div className="h-5 w-2/5 animate-pulse rounded bg-[#FAF9F6]" />
                    <div className="h-4 w-24 animate-pulse rounded bg-[#FAF9F6]" />
                    <div className="h-11 animate-pulse rounded-[10px] bg-[#FAF9F6]" />
                  </div>
                </div>
              ))}
            </div>
          ) : nouveautes.length > 0 ? (
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {nouveautes.map((produit) => (
                <CarteNouveaute
                  key={produit.id}
                  produit={produit}
                  onAjouter={ajouter}
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-[14px] border border-[#FAF9F6] bg-[#FFFFFF] px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[10px] bg-[#FAF9F6] text-[#0F1B3D]">
                <Sparkles size={28} />
              </div>

              <h2 className="mt-5 text-2xl font-black text-[#1A1A2E]">
                Aucune nouveauté à afficher
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6B7280]">
                {recherche
                  ? 'Aucun produit récent ne correspond à votre recherche.'
                  : 'De nouveaux produits seront ajoutés ici au fur et à mesure de nos arrivages.'}
              </p>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                {recherche && (
                  <button
                    type="button"
                    onClick={reinitialiser}
                    className="min-h-11 rounded-[10px] border border-[#FAF9F6] bg-white px-5 text-sm font-bold text-[#1A1A2E] transition hover:bg-[#FFFFFF]"
                  >
                    Effacer la recherche
                  </button>
                )}

                <Link
                  to="/catalogue"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0F1B3D] !text-white px-5 text-sm font-black text-white transition hover:bg-[#C9A24B] hover:text-[#0F1B3D]"
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
