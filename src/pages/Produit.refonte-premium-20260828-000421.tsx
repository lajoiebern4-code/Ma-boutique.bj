import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  Heart,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
  WalletCards,
  X,
  Zap,
} from 'lucide-react'
import {
  ajouterFavori,
  estFavori,
  obtenirProduits,
  supprimerFavori,
  type Produit,
} from '../services/produits'
import { useCart, type CartProduct } from '../context/CartContext'
import { supabase } from '../lib/supabase'

function formatPrix(prix: number) {
  return `${Number(prix || 0).toLocaleString('fr-FR')} FCFA`
}

function calculerTempsRestant(dateFin: string | null | undefined) {
  if (!dateFin) return 0
  return Math.max(0, new Date(dateFin).getTime() - Date.now())
}

function formaterDecompte(ms: number) {
  if (ms <= 0) return 'Promotion terminée'

  const totalSecondes = Math.floor(ms / 1000)
  const jours = Math.floor(totalSecondes / 86400)
  const heures = Math.floor((totalSecondes % 86400) / 3600)
  const minutes = Math.floor((totalSecondes % 3600) / 60)
  const secondes = totalSecondes % 60

  if (jours > 0) {
    return `${jours}j ${String(heures).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
  }

  return `${String(heures).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(secondes).padStart(2, '0')}s`
}

function BadgeDisponibilite({ produit }: { produit: Produit }) {
  const enStock = produit.stock > 0
  const surCommande =
    produit.stock <= 0 && produit.disponibilite === 'sur_commande'

  if (enStock) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Disponible en stock
      </span>
    )
  }

  if (surCommande) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 ring-1 ring-amber-100">
        <Clock3 size={14} />
        Disponible sur commande
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
      <X size={14} />
      Indisponible
    </span>
  )
}

function BlocAvantage({
  icon: Icon,
  titre,
  texte,
}: {
  icon: typeof ShieldCheck
  titre: string
  texte: string
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0052CC]">
        <Icon size={19} />
      </div>

      <div>
        <p className="text-sm font-black text-[#0B1E3D]">{titre}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{texte}</p>
      </div>
    </div>
  )
}

function SkeletonProduit() {
  return (
    <main className="min-h-screen bg-[#F7F9FC]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-5 w-36 animate-pulse rounded-full bg-slate-200" />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <div className="aspect-square animate-pulse rounded-[2rem] bg-slate-200" />

          <div className="space-y-5">
            <div className="h-8 w-2/3 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-12 w-1/2 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-14 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    </main>
  )
}

export default function Produit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { ajouter } = useCart()

  const [produit, setProduit] = useState<Produit | null>(null)
  const [chargement, setChargement] = useState(true)
  const [quantite, setQuantite] = useState(1)
  const [utilisateur, setUtilisateur] = useState<any>(null)
  const [favori, setFavori] = useState(false)
  const [chargementFavori, setChargementFavori] = useState(false)
  const [tempsPromo, setTempsPromo] = useState(0)
  const [imageErreur, setImageErreur] = useState(false)

  useEffect(() => {
    let actif = true

    async function chargerProduit() {
      try {
        const resultat = await obtenirProduits()

        if (!actif) return

        const trouve = resultat.find(
          (item) => String(item.id) === String(id),
        )

        setProduit(trouve ?? null)
      } catch (err) {
        console.error('Erreur chargement produit:', err)
        if (actif) setProduit(null)
      } finally {
        if (actif) setChargement(false)
      }
    }

    chargerProduit()

    return () => {
      actif = false
    }
  }, [id])

  useEffect(() => {
    let actif = true

    async function chargerFavori() {
      if (!id) return

      const { data, error } = await supabase.auth.getUser()

      if (!actif) return

      if (error || !data?.user) {
        setUtilisateur(null)
        setFavori(false)
        return
      }

      const user = data.user
      setUtilisateur(user)

      try {
        const resultat = await estFavori(id, user.id)

        if (actif) {
          setFavori(resultat)
        }
      } catch (err) {
        console.error('Erreur chargement favori:', err)
      }
    }

    chargerFavori()

    return () => {
      actif = false
    }
  }, [id])

  useEffect(() => {
    if (!produit?.promo || !produit.promoFin) {
      setTempsPromo(0)
      return
    }

    const actualiser = () => {
      setTempsPromo(calculerTempsRestant(produit.promoFin))
    }

    actualiser()

    const intervalle = window.setInterval(actualiser, 1000)

    return () => window.clearInterval(intervalle)
  }, [produit])

  async function basculerFavori() {
    if (!id) return

    if (!utilisateur) {
      navigate('/connexion', {
        state: { retour: `/produit/${id}` },
      })
      return
    }

    setChargementFavori(true)

    try {
      if (favori) {
        await supprimerFavori(id, utilisateur.id)
        setFavori(false)
      } else {
        await ajouterFavori(id, utilisateur.id)
        setFavori(true)
      }
    } catch (err) {
      console.error('Erreur modification favori:', err)
    } finally {
      setChargementFavori(false)
    }
  }

  if (chargement) {
    return <SkeletonProduit />
  }

  if (!produit) {
    return (
      <main className="min-h-[70vh] bg-[#F7F9FC] px-4 py-16">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Package size={28} />
          </div>

          <h1 className="mt-5 text-2xl font-black text-[#0B1E3D]">
            Produit introuvable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Ce produit n'est plus disponible ou le lien utilisé est incorrect.
          </p>

          <Link
            to="/catalogue"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0052CC] px-5 py-3 text-sm font-black text-white transition hover:bg-[#003F9E]"
          >
            Retour au catalogue
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    )
  }

  const enStock = produit.stock > 0
  const surCommande =
    produit.stock <= 0 && produit.disponibilite === 'sur_commande'
  const indisponible =
    produit.stock <= 0 && produit.disponibilite !== 'sur_commande'

  const prixActuel = Number(produit.prix || 0)
  const prixOriginal = Number(produit.prixOriginal || 0)
  const economie =
    produit.promo > 0 && prixOriginal > prixActuel
      ? prixOriginal - prixActuel
      : 0

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

    for (let i = 0; i < quantite; i += 1) {
      ajouter(produitPanier)
    }
  }

  function commanderMaintenant() {
    if (indisponible) return

    ajouterAuPanier()
    navigate('/panier')
  }

  function diminuerQuantite() {
    setQuantite((valeur) => Math.max(1, valeur - 1))
  }

  function augmenterQuantite() {
    setQuantite((valeur) => {
      if (enStock) return Math.min(produit.stock, valeur + 1)
      return valeur + 1
    })
  }

  const categorie = produit.categorie || 'Sélection ChinaShop'

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#0B1E3D]">
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 text-xs sm:px-6 lg:px-8">
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 font-bold text-slate-500 transition hover:text-[#0052CC]"
          >
            <ArrowLeft size={15} />
            Catalogue
          </Link>

          <span className="text-slate-300">/</span>

          <span className="truncate font-semibold text-slate-400">
            {produit.nom}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.03fr_.97fr] lg:items-start">
          <section>
            <div className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(11,30,61,0.08)]">
              <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2 sm:left-5 sm:top-5">
                {produit.nouveau && (
                  <span className="rounded-full bg-[#0B1E3D] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                    Nouveau
                  </span>
                )}

                {produit.promo > 0 && (
                  <span className="rounded-full bg-[#FF7A1A] px-3 py-1.5 text-[10px] font-black text-white shadow-lg">
                    -{produit.promo}% aujourd'hui
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={basculerFavori}
                disabled={chargementFavori}
                aria-label={
                  favori ? 'Retirer des favoris' : 'Ajouter aux favoris'
                }
                className={`absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border shadow-lg backdrop-blur transition sm:right-5 sm:top-5 ${
                  favori
                    ? 'border-red-100 bg-red-50 text-red-500'
                    : 'border-white/80 bg-white/90 text-slate-500 hover:text-red-500'
                }`}
              >
                <Heart
                  size={19}
                  fill={favori ? 'currentColor' : 'none'}
                />
              </button>

              <div className="aspect-square bg-gradient-to-br from-slate-50 via-white to-slate-100">
                {produit.image_url && !imageErreur ? (
                  <img
                    src={produit.image_url}
                    alt={produit.nom}
                    onError={() => setImageErreur(true)}
                    className="h-full w-full object-contain p-4 transition duration-700 group-hover:scale-[1.025] sm:p-8"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                    <Package size={42} />
                    <span className="text-sm font-semibold">
                      Image non disponible
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                <ShieldCheck className="mx-auto text-[#0052CC]" size={20} />
                <p className="mt-2 text-[11px] font-black text-[#0B1E3D]">
                  Achat sécurisé
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                <Truck className="mx-auto text-[#0052CC]" size={20} />
                <p className="mt-2 text-[11px] font-black text-[#0B1E3D]">
                  Livraison Bénin
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                <BadgeCheck className="mx-auto text-[#0052CC]" size={20} />
                <p className="mt-2 text-[11px] font-black text-[#0B1E3D]">
                  Sélection contrôlée
                </p>
              </div>
            </div>
          </section>

          <section className="lg:sticky lg:top-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(11,30,61,0.06)] sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#0052CC]">
                  {categorie}
                </span>

                <button
                  type="button"
                  onClick={basculerFavori}
                  disabled={chargementFavori}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-red-500 lg:hidden"
                >
                  <Heart
                    size={15}
                    fill={favori ? 'currentColor' : 'none'}
                  />
                  {favori ? 'Favori' : 'Ajouter'}
                </button>
              </div>

              <h1 className="mt-5 text-2xl font-black leading-tight tracking-tight sm:text-3xl lg:text-[2.2rem]">
                {produit.nom}
              </h1>

              <div className="mt-5">
                <BadgeDisponibilite produit={produit} />
              </div>

              <div className="mt-6 border-y border-slate-100 py-6">
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="text-3xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl">
                    {formatPrix(prixActuel)}
                  </span>

                  {prixOriginal > prixActuel && (
                    <span className="pb-1 text-sm font-bold text-slate-400 line-through">
                      {formatPrix(prixOriginal)}
                    </span>
                  )}
                </div>

                {economie > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-emerald-600">
                    <Check size={14} />
                    Économisez {formatPrix(economie)}
                  </div>
                )}
              </div>

              {produit.promo > 0 && tempsPromo > 0 && (
                <div className="mt-5 overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF7A1A] text-white">
                      <Zap size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-black text-orange-800">
                        Offre promotionnelle
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-orange-700">
                        Se termine dans {formaterDecompte(tempsPromo)}
                      </p>
                    </div>
                  </div>

                  <div className="h-1 bg-orange-100">
                    <div
                      key={tempsPromo}
                      className="h-full bg-[#FF7A1A]"
                      style={{
                        width: '100%',
                        animation: 'promoPulse 1s linear infinite',
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  Quantité
                </p>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                  <button
                    type="button"
                    onClick={diminuerQuantite}
                    disabled={quantite <= 1}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#0B1E3D] shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Diminuer la quantité"
                  >
                    <Minus size={17} />
                  </button>

                  <span className="text-base font-black">{quantite}</span>

                  <button
                    type="button"
                    onClick={augmenterQuantite}
                    disabled={enStock && quantite >= produit.stock}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B1E3D] text-white shadow-sm transition hover:bg-[#0052CC] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Augmenter la quantité"
                  >
                    <Plus size={17} />
                  </button>
                </div>

                {enStock && (
                  <p className="mt-2 text-[11px] font-semibold text-slate-400">
                    {produit.stock} unité{produit.stock > 1 ? 's' : ''} disponible{produit.stock > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {surCommande && (
                <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <Clock3 className="mt-0.5 shrink-0 text-amber-600" size={18} />
                    <div>
                      <p className="text-xs font-black text-amber-800">
                        Article disponible sur commande
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-amber-700">
                        Vous pouvez commander cet article même s'il n'est pas
                        actuellement en stock.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  onClick={commanderMaintenant}
                  disabled={indisponible}
                  className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#0052CC] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(0,82,204,0.22)] transition hover:-translate-y-0.5 hover:bg-[#003F9E] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  <ShoppingBag size={19} />
                  {indisponible ? 'Produit indisponible' : 'Commander maintenant'}
                  {!indisponible && (
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={ajouterAuPanier}
                  disabled={indisponible}
                  className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl border-2 border-[#0B1E3D] bg-white px-5 text-sm font-black text-[#0B1E3D] transition hover:bg-[#0B1E3D] hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <ShoppingCart size={19} />
                  Ajouter au panier
                </button>
              </div>

              <div className="mt-6 grid gap-3">
                <BlocAvantage
                  icon={ShieldCheck}
                  titre="Paiement sécurisé"
                  texte="Un parcours de commande clair et sécurisé."
                />

                <BlocAvantage
                  icon={Truck}
                  titre="Livraison ou retrait"
                  texte="Choisissez l'option qui vous convient au Bénin."
                />

                <BlocAvantage
                  icon={WalletCards}
                  titre="Prix transparents"
                  texte="Le prix affiché vous permet de préparer votre commande."
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <div className="flex items-start gap-3">
                <Package className="mt-0.5 shrink-0 text-[#0052CC]" size={18} />
                <div>
                  <p className="text-xs font-black text-[#0B1E3D]">
                    Besoin d'informations ?
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Consultez les conditions de livraison, retrait et commande
                    avant votre achat.
                  </p>

                  <Link
                    to="/infos"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[#0052CC]"
                  >
                    Voir les informations
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-10">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF7A1A]">
                  Votre commande
                </p>

                <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
                  Une expérience simple, du produit à la réception
                </h2>
              </div>

              <Link
                to="/catalogue"
                className="inline-flex items-center gap-2 text-xs font-black text-[#0052CC]"
              >
                Continuer mes achats
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-[#F7F9FC] p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0052CC] shadow-sm">
                  <ShoppingBag size={18} />
                </div>
                <h3 className="mt-4 text-sm font-black">1. Choisissez</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Sélectionnez votre produit et la quantité souhaitée.
                </p>
              </div>

              <div className="rounded-2xl bg-[#F7F9FC] p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0052CC] shadow-sm">
                  <WalletCards size={18} />
                </div>
                <h3 className="mt-4 text-sm font-black">2. Commandez</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Validez votre panier avec les informations nécessaires.
                </p>
              </div>

              <div className="rounded-2xl bg-[#F7F9FC] p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0052CC] shadow-sm">
                  <Truck size={18} />
                </div>
                <h3 className="mt-4 text-sm font-black">3. Recevez</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Choisissez la livraison ou le retrait selon votre commande.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes promoPulse {
          0%, 100% { opacity: .65; }
          50% { opacity: 1; }
        }
      `}</style>
    </main>
  )
}
