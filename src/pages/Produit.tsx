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
import {
  recupererPhotosProduit,
  recupererVariantesProduit,
  type ProduitVariante,
} from '../services/supabase'
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
    <span className="inline-flex items-center gap-2 rounded-full bg-[#FAF9F6] px-3 py-1.5 text-xs font-black text-[#6B7280]">
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
    <div className="flex gap-3 rounded-[14px] border border-[#FAF9F6] bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#0F1B3D]">
        <Icon size={19} />
      </div>

      <div>
        <p className="text-sm font-black text-[#1A1A2E]">{titre}</p>
        <p className="mt-1 text-xs leading-5 text-[#6B7280]">{texte}</p>
      </div>
    </div>
  )
}

function SkeletonProduit() {
  return (
    <main className="min-h-screen bg-[#FFFFFF]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="h-5 w-36 animate-pulse rounded-full bg-[#FAF9F6]" />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <div className="aspect-square animate-pulse rounded-[18px] bg-[#FAF9F6]" />

          <div className="space-y-5">
            <div className="h-8 w-2/3 animate-pulse rounded-xl bg-[#FAF9F6]" />
            <div className="h-12 w-1/2 animate-pulse rounded-xl bg-[#FAF9F6]" />
            <div className="h-24 animate-pulse rounded-2xl bg-[#FAF9F6]" />
            <div className="h-14 animate-pulse rounded-2xl bg-[#FAF9F6]" />
          </div>
        </div>
      </div>
    </main>
  )
}


const COULEURS_VISUELLES: Record<string, string> = {
  noir: '#111827',
  blanc: '#FFFFFF',
  rouge: '#EF4444',
  bleu: '#2563EB',
  'bleu ciel': '#38BDF8',
  'bleu marine': '#1E3A8A',
  vert: '#22C55E',
  'vert foncé': '#166534',
  jaune: '#FACC15',
  orange: '#F97316',
  rose: '#EC4899',
  violet: '#8B5CF6',
  marron: '#92400E',
  beige: '#D6B98C',
  gris: '#9CA3AF',
  doré: '#D4AF37',
  argenté: '#C0C0C0',
  bordeaux: '#7F1D1D',
  camel: '#C19A6B',
}

function obtenirCouleurVisuelle(nom: string) {
  return COULEURS_VISUELLES[nom.trim().toLowerCase()] || '#CBD5E1'
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
  const [photosProduit, setPhotosProduit] = useState<string[]>([])
  const [photoSelectionnee, setPhotoSelectionnee] = useState(0)
  const [variantesProduit, setVariantesProduit] = useState<ProduitVariante[]>([])
  const [varianteSelectionnee, setVarianteSelectionnee] =
    useState<ProduitVariante | null>(null)
  const [couleurSelectionnee, setCouleurSelectionnee] = useState('')
  const [tailleSelectionnee, setTailleSelectionnee] = useState('')
  const [pointureSelectionnee, setPointureSelectionnee] = useState('')

  const categorieProduit = (produit?.categorie || '').trim().toLowerCase()
  const estVetement = categorieProduit === 'vetements'
  const estChaussure = categorieProduit === 'chaussures'

  const couleursDisponibles = Array.from(
    new Set(
      variantesProduit
        .map((variante) => variante.couleur?.trim())
        .filter(Boolean),
    ),
  )

  const taillesDisponibles = Array.from(
    new Set(
      variantesProduit
        .filter(
          (variante) =>
            variante.couleur === couleurSelectionnee &&
            variante.taille?.trim(),
        )
        .map((variante) => variante.taille!.trim()),
    ),
  )

  const pointuresDisponibles = Array.from(
    new Set(
      variantesProduit
        .filter(
          (variante) =>
            variante.couleur === couleurSelectionnee &&
            variante.pointure?.trim(),
        )
        .map((variante) => variante.pointure!.trim()),
    ),
  )

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

    async function chargerPhotos() {
      if (!id) {
        setPhotosProduit([])
        setPhotoSelectionnee(0)
        return
      }

      const resultat = await recupererPhotosProduit(id)

      if (!actif) return

      if (resultat.success && resultat.data.length > 0) {
        setPhotosProduit(resultat.data.map((photo) => photo.url))
      } else {
        setPhotosProduit([])
      }

      setPhotoSelectionnee(0)
    }

    chargerPhotos()

    return () => {
      actif = false
    }
  }, [id])

  useEffect(() => {
    let actif = true

    async function chargerVariantes() {
      if (!id) {
        setVariantesProduit([])
        setVarianteSelectionnee(null)
        return
      }

      const resultat = await recupererVariantesProduit(id)

      if (!actif) return

      if (resultat.success) {
        const variantes = resultat.data || []
        setVariantesProduit(variantes)

        const categorie = (produit?.categorie || '').trim().toLowerCase()
        const estVetement = categorie === 'vetements'
        const estChaussure = categorie === 'chaussures'

        setCouleurSelectionnee('')
        setTailleSelectionnee('')
        setPointureSelectionnee('')

        if (estVetement || estChaussure) {
          setVarianteSelectionnee(null)
        } else {
          const premiereDisponible =
            variantes.find((variante) => variante.stock > 0) || null

          setVarianteSelectionnee(premiereDisponible)
        }
      } else {
        setVariantesProduit([])
        setVarianteSelectionnee(null)
      }
    }

    chargerVariantes()

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
    if (!produit) {
      setTempsPromo(0)
      return
    }

    const actualiser = () => {
      const etat = obtenirEtatPromotion(produit)

      if (etat === 'programmee' && produit.promo_debut) {
        setTempsPromo(calculerTempsRestant(produit.promo_debut))
        return
      }

      if (etat === 'active' && produit.promo_fin) {
        setTempsPromo(calculerTempsRestant(produit.promo_fin))
        return
      }

      setTempsPromo(0)
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
      <main className="min-h-[70vh] bg-[#FFFFFF] px-4 py-16">
        <div className="mx-auto max-w-lg rounded-[14px] border border-[#FAF9F6] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FAF9F6] text-[#9A93A5]">
            <Package size={28} />
          </div>

          <h1 className="mt-5 text-2xl font-black text-[#1A1A2E]">
            Produit introuvable
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#6B7280]">
            Ce produit n'est plus disponible ou le lien utilisé est incorrect.
          </p>

          <Link
            to="/catalogue"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0F1B3D] !text-white px-5 py-3 text-sm font-black text-white transition hover:bg-[#C9A24B] hover:text-[#0F1B3D]"
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
  const varianteRequise = variantesProduit.length > 0
  const varianteIndisponible =
    varianteRequise && (!varianteSelectionnee || varianteSelectionnee.stock <= 0)

  const indisponible =
    (produit.stock <= 0 && produit.disponibilite !== 'sur_commande') ||
    varianteIndisponible

  const prixActuel = Number(produit.prix || 0)
  const prixOriginal = Number(produit.prixOriginal || 0)
  const economie =
    produit.promo > 0 && prixOriginal > prixActuel
      ? prixOriginal - prixActuel
      : 0

  const stockPanier = varianteSelectionnee
    ? varianteSelectionnee.stock
    : produit.stock

  const produitPanier: CartProduct = {
    id: produit.id,
    nom: produit.nom,
    prix: produit.prix,
    image_url: varianteSelectionnee?.image_url || produit.image_url || null,
    stock: stockPanier,
    poids_kg: produit.poids_kg,
    volume_cbm: produit.volume_cbm,
    surCommande,
    categorie: produit.categorie,
    sous_categorie: produit.sous_categorie,
    variante_id: varianteSelectionnee?.id || null,
    variante_nom: varianteSelectionnee?.nom || null,
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

  const stockProduit = varianteSelectionnee
    ? varianteSelectionnee.stock
    : produit.stock

  function augmenterQuantite() {
    setQuantite((valeur) => {
      if (enStock || varianteSelectionnee) {
        return Math.min(stockProduit, valeur + 1)
      }
      return valeur + 1
    })
  }

  const categorie = produit.categorie || 'Sélection ChinaShop'

  return (
    <main className="min-h-screen bg-[#FFFFFF] text-[#1A1A2E]">
      {/* Fil d’Ariane */}
      <div className="border-b border-[#FAF9F6]/70 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-black text-[#6B7280] transition hover:bg-[#FAF9F6] hover:text-[#0F1B3D]"
          >
            <ArrowLeft size={14} />
            Catalogue
          </Link>

          <span className="text-[#C8C1D2]">/</span>

          <span className="min-w-0 truncate text-xs font-bold text-[#9A93A5]">
            {produit.nom}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 sm:py-10 lg:px-8">
        {/* PRODUIT */}
        <div className="grid gap-8 lg:grid-cols-[1.08fr_.92fr] lg:items-start">

          {/* VISUEL */}
          <section>
            <div className="relative overflow-hidden rounded-[14px] border border-[#FAF9F6] bg-white shadow-[0_8px_24px_rgba(24,21,31,0.06)]">

              {/* Badges */}
              <div className="absolute left-4 top-4 z-10 flex max-w-[75%] flex-wrap gap-2 sm:left-5 sm:top-5">
                {produit.nouveau && (
                  <span className="rounded-full bg-[#1A1A2E] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-lg">
                    Nouveau
                  </span>
                )}

                {obtenirEtatPromotion(produit) === 'active' && (
                  <span className="rounded-full bg-[#0F1B3D] !text-white px-3.5 py-2 text-[10px] font-black text-white shadow-lg">
                    -{produit.promo}% aujourd'hui
                  </span>
                )}
              </div>

              {/* Favori */}
              <button
                type="button"
                onClick={basculerFavori}
                disabled={chargementFavori}
                aria-label={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                className={`absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border shadow-lg backdrop-blur transition sm:right-5 sm:top-5 ${
                  favori
                    ? 'border-red-100 bg-red-50 text-red-500'
                    : 'border-white/80 bg-white/90 text-[#6B7280] hover:border-red-100 hover:bg-red-50 hover:text-red-500'
                }`}
              >
                <Heart size={19} fill={favori ? 'currentColor' : 'none'} />
              </button>

              {/* Galerie photos */}
              {(() => {
                const imageVariante = varianteSelectionnee?.image_url
                const galerie =
                  photosProduit.length > 0
                    ? photosProduit
                    : produit.image_url
                      ? [produit.image_url]
                      : []

                const indexSecurise = Math.min(
                  photoSelectionnee,
                  Math.max(0, galerie.length - 1),
                )

                const photoActuelle = imageVariante || galerie[indexSecurise]

                return (
                  <>
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#FAF9F6] via-white to-[#FAF9F6]">
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,.95),transparent_52%)]" />

                      {photoActuelle && !imageErreur ? (
                        <img
                          src={photoActuelle}
                          alt={`${produit.nom} - photo ${indexSecurise + 1}`}
                          onError={() => setImageErreur(true)}
                          className="relative h-full w-full object-contain p-6 transition duration-700 hover:scale-[1.025] sm:p-12"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-3 text-[#9A93A5]">
                          <Package size={44} strokeWidth={1.5} />
                          <span className="text-sm font-bold">
                            Image non disponible
                          </span>
                        </div>
                      )}

                      {galerie.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setPhotoSelectionnee(
                                (index) =>
                                  (index - 1 + galerie.length) %
                                  galerie.length,
                              )
                            }
                            aria-label="Photo précédente"
                            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-[#1A1A2E] shadow-lg backdrop-blur transition hover:bg-white"
                          >
                            <ArrowLeft size={18} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setPhotoSelectionnee(
                                (index) =>
                                  (index + 1) % galerie.length,
                              )
                            }
                            aria-label="Photo suivante"
                            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-[#1A1A2E] shadow-lg backdrop-blur transition hover:bg-white"
                          >
                            <ArrowRight size={18} />
                          </button>

                          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1A1A2E]/80 px-3 py-1 text-[10px] font-black text-white backdrop-blur">
                            {indexSecurise + 1} / {galerie.length}
                          </span>
                        </>
                      )}
                    </div>

                    {galerie.length > 1 && (
                      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
                        {galerie.map((photo, index) => (
                          <button
                            key={`${photo}-${index}`}
                            type="button"
                            onClick={() => {
                              setPhotoSelectionnee(index)
                              setImageErreur(false)
                            }}
                            aria-label={`Afficher la photo ${index + 1}`}
                            className={`aspect-square overflow-hidden rounded-xl border-2 bg-white transition ${
                              index === indexSecurise
                                ? 'border-[#0F1B3D] ring-2 ring-[#FAF9F6]'
                                : 'border-[#FAF9F6] hover:border-[#DCD5E8]'
                            }`}
                          >
                            <img
                              src={photo}
                              alt={`${produit.nom} - miniature ${index + 1}`}
                              className="h-full w-full object-contain p-1"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
            {/* Réassurance */}
            <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className="rounded-[14px] border border-[#FAF9F6] bg-white p-3.5 text-center shadow-sm sm:p-4">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#0F1B3D]">
                  <ShieldCheck size={18} />
                </div>
                <p className="mt-2.5 text-[10px] font-black leading-4 text-[#1A1A2E] sm:text-[11px]">
                  Achat sécurisé
                </p>
              </div>

              <div className="rounded-[14px] border border-[#FAF9F6] bg-white p-3.5 text-center shadow-sm sm:p-4">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#0F1B3D]">
                  <Truck size={18} />
                </div>
                <p className="mt-2.5 text-[10px] font-black leading-4 text-[#1A1A2E] sm:text-[11px]">
                  Livraison Bénin
                </p>
              </div>

              <div className="rounded-[14px] border border-[#FAF9F6] bg-white p-3.5 text-center shadow-sm sm:p-4">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#0F1B3D]">
                  <BadgeCheck size={18} />
                </div>
                <p className="mt-2.5 text-[10px] font-black leading-4 text-[#1A1A2E] sm:text-[11px]">
                  Sélection contrôlée
                </p>
              </div>
            </div>
          </section>

          {/* INFORMATIONS / ACHAT */}
          <section className="lg:sticky lg:top-5">
            <div className="rounded-[14px] border border-[#FAF9F6] bg-white p-5 shadow-[0_8px_24px_rgba(24,21,31,0.06)] sm:p-7">

              {/* Catégorie */}
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#FAF9F6] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#0F1B3D]">
                  {categorie}
                </span>

                <button
                  type="button"
                  onClick={basculerFavori}
                  disabled={chargementFavori}
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-black text-[#9A93A5] transition hover:bg-red-50 hover:text-red-500 lg:hidden"
                >
                  <Heart
                    size={15}
                    fill={favori ? 'currentColor' : 'none'}
                  />
                  {favori ? 'Favori' : 'Ajouter'}
                </button>
              </div>

              {/* Nom */}
              <h1 className="mt-5 text-[1.75rem] font-black leading-[1.12] tracking-[-0.025em] text-[#1A1A2E] sm:text-3xl lg:text-[2.35rem]">
                {produit.nom}
              </h1>

              {/* Disponibilité */}
              <div className="mt-5">
                <BadgeDisponibilite produit={produit} />
              </div>

              {/* Prix */}
              <div className="mt-6 border-y border-[#FAF9F6] py-6">
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="text-3xl font-black tracking-[-0.03em] text-[#1A1A2E] sm:text-4xl">
                    {formatPrix(prixActuel)}
                  </span>

                  {prixOriginal > prixActuel && (
                    <span className="pb-1 text-sm font-bold text-[#9A93A5] line-through">
                      {formatPrix(prixOriginal)}
                    </span>
                  )}
                </div>

                {economie > 0 && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                    <Check size={13} />
                    Économisez {formatPrix(economie)}
                  </div>
                )}
              </div>

              {/* Promotion */}
              {obtenirEtatPromotion(produit) === 'active' && tempsPromo > 0 && (
                <div className="mt-5 overflow-hidden rounded-2xl border border-orange-100 bg-[#FFFFFF]">
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F1B3D] !text-white shadow-sm">
                      <Zap size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-black text-[#C9A24B]">
                        Offre promotionnelle
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-orange-700">
                        Se termine dans {formaterDecompte(tempsPromo)}
                      </p>
                    </div>
                  </div>

                  <div className="h-1 bg-[#FAF9F6]">
                    <div
                      key={tempsPromo}
                      className="h-full bg-[#0F1B3D]"
                      style={{
                        width: '100%',
                        animation: 'promoPulse 1s linear infinite',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Variantes */}
              {variantesProduit.length > 0 && (
                <div className="mt-6 rounded-[14px] border border-[#FAF9F6] bg-[#FFFFFF] p-5">
                  {(estVetement || estChaussure) ? (
                    <>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9A93A5]">
                        Choisir une couleur
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {couleursDisponibles.map((couleur) => {
                          const couleurActive =
                            couleur === couleurSelectionnee

                          const varianteCouleur = variantesProduit.find(
                            (variante) =>
                              variante.couleur?.trim() === couleur &&
                              variante.stock > 0,
                          )

                          return (
                            <button
                              key={couleur}
                              type="button"
                              disabled={!varianteCouleur}
                              onClick={() => {
                                if (!varianteCouleur) return

                                setCouleurSelectionnee(couleur)
                                setTailleSelectionnee('')
                                setPointureSelectionnee('')
                                setVarianteSelectionnee(null)
                                setQuantite(1)
                              }}
                              aria-label={
                                varianteCouleur
                                  ? `Couleur ${couleur}`
                                  : `Couleur ${couleur} épuisée`
                              }
                              className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 transition ${
                                couleurActive
                                  ? 'border-[#0F1B3D] ring-4 ring-[#FAF9F6]'
                                  : varianteCouleur
                                    ? 'border-white shadow-md hover:scale-105'
                                    : 'cursor-not-allowed border-[#DCD5E8] opacity-35 grayscale'
                              }`}
                            >
                              <span
                                className="h-8 w-8 rounded-full border border-black/10 shadow-inner"
                                style={{
                                  backgroundColor:
                                    obtenirCouleurVisuelle(couleur),
                                }}
                              />
                              {!varianteCouleur && (
                                <span className="absolute h-0.5 w-10 rotate-45 rounded-full bg-[#6B7280]" />
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {couleurSelectionnee && (
                        <>
                          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.14em] text-[#9A93A5]">
                            {estVetement ? 'Choisir une taille' : 'Choisir une pointure'}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {(estVetement
                              ? taillesDisponibles
                              : pointuresDisponibles
                            ).map((valeur) => {
                              const variante = variantesProduit.find(
                                (item) =>
                                  item.couleur?.trim() ===
                                    couleurSelectionnee &&
                                  (estVetement
                                    ? item.taille?.trim() === valeur
                                    : item.pointure?.trim() === valeur),
                              )

                              const disponible = !!variante && variante.stock > 0

                              const selectionnee = estVetement
                                ? tailleSelectionnee === valeur
                                : pointureSelectionnee === valeur

                              return (
                                <button
                                  key={valeur}
                                  type="button"
                                  disabled={!disponible}
                                  onClick={() => {
                                    if (!variante || !disponible) return

                                    if (estVetement) {
                                      setTailleSelectionnee(valeur)
                                      setPointureSelectionnee('')
                                    } else {
                                      setPointureSelectionnee(valeur)
                                      setTailleSelectionnee('')
                                    }

                                    setVarianteSelectionnee(variante)
                                    setImageErreur(false)
                                    setQuantite(1)
                                  }}
                                  className={`min-w-[52px] rounded-xl border px-4 py-2.5 text-xs font-black transition ${
                                    selectionnee
                                      ? 'border-[#0F1B3D] bg-[#FAF9F6] text-[#C9A24B]'
                                      : disponible
                                        ? 'border-[#FAF9F6] bg-white text-[#1A1A2E] hover:border-[#0F1B3D]'
                                        : 'cursor-not-allowed border-[#FAF9F6] bg-[#F3F1F5] text-[#AAA4B1] line-through'
                                  }`}
                                >
                                  {valeur}
                                </button>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9A93A5]">
                        Choisir une variante
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {variantesProduit.map((variante) => {
                          const disponible = variante.stock > 0
                          const selectionnee =
                            varianteSelectionnee?.id === variante.id
                          const nomAffiche =
                            variante.couleur?.trim() || variante.nom
                          const imageVar = variante.image_url

                          return (
                            <button
                              key={variante.id}
                              type="button"
                              disabled={!disponible}
                              onClick={() => {
                                if (disponible) {
                                  setVarianteSelectionnee(variante)
                                  setImageErreur(false)
                                  setCouleurSelectionnee(
                                    variante.couleur?.trim() || '',
                                  )
                                  setQuantite(1)
                                }
                              }}
                              aria-label={
                                disponible
                                  ? `Variante ${nomAffiche}`
                                  : `Variante ${nomAffiche} épuisée`
                              }
                              className={`group flex flex-col items-center gap-1.5 transition ${
                                disponible ? '' : 'cursor-not-allowed opacity-40 grayscale'
                              }`}
                            >
                              <span
                                className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 transition ${
                                  selectionnee
                                    ? 'border-[#0F1B3D] ring-4 ring-[#FAF9F6]'
                                    : 'border-white shadow-md group-hover:scale-105'
                                }`}
                              >
                                {imageVar ? (
                                  <img
                                    src={imageVar}
                                    alt={nomAffiche}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span
                                    className="h-full w-full"
                                    style={{
                                      backgroundColor: obtenirCouleurVisuelle(nomAffiche),
                                    }}
                                  />
                                )}

                                {selectionnee && (
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                                    <Check size={20} className="text-white" strokeWidth={3} />
                                  </span>
                                )}

                                {!disponible && (
                                  <span className="absolute h-0.5 w-16 rotate-45 rounded-full bg-[#6B7280]" />
                                )}
                              </span>

                              <span
                                className={`max-w-[80px] truncate text-[10px] font-bold leading-tight ${
                                  selectionnee ? 'text-[#0F1B3D]' : 'text-[#6B7280]'
                                }`}
                              >
                                {nomAffiche}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Description */}
              {produit.description?.trim() && (
                <div className="mt-6 rounded-[14px] border border-[#FAF9F6] bg-[#FFFFFF] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9A93A5]">
                    Description
                  </p>

                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#6B7280]">
                    {produit.description.trim()}
                  </p>
                </div>
              )}

              {/* Quantité */}
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9A93A5]">
                    Quantité
                  </p>

                  {enStock && (
                    <span className="text-[10px] font-bold text-[#9A93A5]">
                      Disponible en stock
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-[#FAF9F6] bg-[#FFFFFF] p-1.5">
                  <button
                    type="button"
                    onClick={diminuerQuantite}
                    disabled={quantite <= 1}
                    aria-label="Diminuer la quantité"
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#1A1A2E] shadow-sm transition hover:bg-[#FAF9F6] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={17} />
                  </button>

                  <span className="text-base font-black text-[#1A1A2E]">
                    {quantite}
                  </span>

                  <button
                    type="button"
                    onClick={augmenterQuantite}
                    disabled={
                      Boolean(enStock || varianteSelectionnee) &&
                      quantite >= stockProduit
                    }
                    aria-label="Augmenter la quantité"
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F1B3D] !text-white shadow-sm transition hover:bg-[#C9A24B] hover:text-[#0F1B3D] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={17} />
                  </button>
                </div>
              </div>

              {/* Sur commande */}
              {surCommande && (
                <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <Clock3
                      className="mt-0.5 shrink-0 text-amber-600"
                      size={18}
                    />

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

              {/* Actions */}
              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  onClick={commanderMaintenant}
                  disabled={indisponible}
                  className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-[10px] bg-[#0F1B3D] !text-white px-5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(118,84,198,0.16)] transition-all duration-150 hover:bg-[#C9A24B] hover:text-[#0F1B3D] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#FAF9F6] disabled:shadow-none"
                >
                  <Zap size={17} />
                  {indisponible ? 'Produit indisponible' : 'Commander maintenant'}

                  {!indisponible && (
                    <span aria-hidden="true" className="text-white/70">›</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={ajouterAuPanier}
                  disabled={indisponible}
                  className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-[10px] border border-[#F59E0B] bg-[#F59E0B] px-5 text-sm font-bold text-[#0F1B3D] shadow-[0_4px_14px_rgba(245,158,11,0.25)] transition-all duration-150 hover:border-[#D97706] hover:bg-[#D97706] active:scale-[0.99] disabled:cursor-not-allowed disabled:border-[#FAF9F6] disabled:bg-[#FAF9F6] disabled:text-[#9A93A5]"
                >
                  <ShoppingCart size={17} />
                  Ajouter au panier
                </button>
              </div>

              {/* Avantages */}
              <div className="mt-6 grid gap-2.5">
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

            {/* Informations */}
            <div className="mt-4 rounded-[14px] border border-[#FAF9F6] bg-white px-5 py-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#0F1B3D]">
                  <Package size={17} />
                </div>

                <div>
                  <p className="text-xs font-black text-[#1A1A2E]">
                    Besoin d'informations ?
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-[#6B7280]">
                    Consultez les conditions de livraison, retrait et commande
                    avant votre achat.
                  </p>

                  <Link
                    to="/infos"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[#0F1B3D] hover:text-[#C9A24B]"
                  >
                    Voir les informations
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* PARCOURS CLIENT */}
        <section className="mt-10">
          <div className="overflow-hidden rounded-[14px] border border-[#FAF9F6] bg-white shadow-sm">
            <div className="border-b border-[#FAF9F6] px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0F1B3D]">
                    Votre commande
                  </p>

                  <h2 className="mt-2 text-xl font-black tracking-tight text-[#1A1A2E] sm:text-2xl">
                    Une expérience simple, du produit à la réception
                  </h2>
                </div>

                <Link
                  to="/catalogue"
                  className="inline-flex items-center gap-2 text-xs font-black text-[#0F1B3D] hover:text-[#C9A24B]"
                >
                  Continuer mes achats
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-3">
              <div className="border-b border-[#FAF9F6] p-6 md:border-b-0 md:border-r sm:p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#0F1B3D]">
                  <ShoppingBag size={19} />
                </div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#0F1B3D]">
                  Étape 01
                </p>

                <h3 className="mt-1 text-sm font-black">
                  Choisissez
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-[#6B7280]">
                  Sélectionnez votre produit et la quantité souhaitée.
                </p>
              </div>

              <div className="border-b border-[#FAF9F6] p-6 md:border-b-0 md:border-r sm:p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#0F1B3D]">
                  <WalletCards size={19} />
                </div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#0F1B3D]">
                  Étape 02
                </p>

                <h3 className="mt-1 text-sm font-black">
                  Commandez
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-[#6B7280]">
                  Validez votre panier avec les informations nécessaires.
                </p>
              </div>

              <div className="p-6 sm:p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#0F1B3D]">
                  <Truck size={19} />
                </div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#0F1B3D]">
                  Étape 03
                </p>

                <h3 className="mt-1 text-sm font-black">
                  Recevez
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-[#6B7280]">
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
