import { useEffect, useMemo, useState } from 'react'
import {
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Package,
  Percent,
  RefreshCw,
  Search,
  Tag,
  TrendingDown,
  X,
  XCircle,
} from 'lucide-react'
import { recupererProduitsAdmin, modifierPromotionAdmin } from '../../services/supabase'

type ProduitAdmin = {
  id: string
  nom: string
  prix: number
  stock: number
  disponibilite: string
  actif: boolean
  prix_original?: number | null
  categorie?: string | null
  sous_categorie?: string | null
  genre?: string | null
  image_url?: string | null
  promo?: number
  promo_debut?: string | null
  promo_fin?: string | null
  nouveau?: boolean
}

type Filtre = 'tous' | 'actives' | 'expirees' | 'sans'

type Formulaire = {
  promo: string
  prixOriginal: string
  promoDebut: string
  promoFin: string
}

const formulaireInitial: Formulaire = {
  promo: '',
  prixOriginal: '',
  promoDebut: '',
  promoFin: '',
}

function convertirVersDateHeureLocale(
  value: string | null | undefined,
) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const annee = date.getFullYear()
  const mois = String(date.getMonth() + 1).padStart(2, '0')
  const jour = String(date.getDate()).padStart(2, '0')
  const heures = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${annee}-${mois}-${jour}T${heures}:${minutes}`
}

function convertirDateHeureLocaleEnIso(value: string) {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

function formatPrix(value: number | null | undefined) {
  return `${Number(value || 0).toLocaleString('fr-FR')} FCFA`
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Aucune date'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Date invalide'

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function estExpiree(value: string | null | undefined) {
  if (!value) return false

  const fin = new Date(value)

  if (Number.isNaN(fin.getTime())) return false

  fin.setHours(23, 59, 59, 999)

  return fin.getTime() < Date.now()
}

function statutPromotion(produit: ProduitAdmin) {
  const promo = Number(produit.promo || 0)

  if (promo <= 0) {
    return {
      label: 'Sans promotion',
      classe: 'border-slate-200 bg-slate-50 text-slate-500',
      icone: <XCircle size={13} />,
    }
  }

  if (estExpiree(produit.promo_fin)) {
    return {
      label: 'Expirée',
      classe: 'border-red-200 bg-red-50 text-red-600',
      icone: <Clock3 size={13} />,
    }
  }

  return {
    label: 'Active',
    classe: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icone: <CheckCircle2 size={13} />,
  }
}

function CarteProduit({
  produit,
  onModifier,
}: {
  produit: ProduitAdmin
  onModifier: (produit: ProduitAdmin) => void
}) {
  const promo = Number(produit.promo || 0)
  const statut = statutPromotion(produit)

  const prixOriginal =
    Number(produit.prix_original || 0) > 0
      ? Number(produit.prix_original)
      : null

  const economie =
    prixOriginal && prixOriginal > Number(produit.prix)
      ? prixOriginal - Number(produit.prix)
      : 0

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/50">
      <div className="relative aspect-[1.15/1] overflow-hidden bg-slate-100">
        {produit.image_url ? (
          <img
            src={produit.image_url}
            alt={produit.nom}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Package size={48} strokeWidth={1.2} />
          </div>
        )}

        {promo > 0 && !estExpiree(produit.promo_fin) && (
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF7A1A] px-3 py-1.5 text-[11px] font-black text-white shadow-lg">
              <Percent size={12} />
              -{promo}%
            </span>
          </div>
        )}

        <div className="absolute right-3 top-3">
          <span
            className={[
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black',
              statut.classe,
            ].join(' ')}
          >
            {statut.icone}
            {statut.label}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0284C7]">
              {produit.categorie || 'Produit'}
            </p>

            <h3 className="mt-1 line-clamp-2 text-[15px] font-black leading-5 text-[#0B1E3D]">
              {produit.nom}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onModifier(produit)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-[#0284C7] hover:bg-[#E8F5FB] hover:text-[#0284C7]"
            title="Modifier la promotion"
          >
            <Edit3 size={16} />
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Prix actuel
              </p>
              <p className="mt-1 text-lg font-black text-[#FF7A1A]">
                {formatPrix(produit.prix)}
              </p>
            </div>

            {prixOriginal && prixOriginal > Number(produit.prix) && (
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Prix original
                </p>
                <p className="mt-1 text-xs font-bold text-slate-400 line-through">
                  {formatPrix(prixOriginal)}
                </p>
              </div>
            )}
          </div>

          {economie > 0 && (
            <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-emerald-600">
              <TrendingDown size={14} />
              Économie client : {formatPrix(economie)}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-bold text-slate-500">
            <Tag size={13} />
            {promo > 0 ? `${promo}% de remise` : 'Aucune remise'}
          </span>

          {promo > 0 && produit.promo_fin && (
            <span className="inline-flex items-center gap-1.5 font-bold text-slate-500">
              <CalendarDays size={13} />
              {formatDate(produit.promo_fin)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onModifier(produit)}
          className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1E3D] px-4 text-xs font-black text-white transition hover:bg-[#0284C7]"
        >
          <Edit3 size={15} />
          {promo > 0 ? 'Modifier la promotion' : 'Créer une promotion'}
        </button>
      </div>
    </article>
  )
}

export default function Promotions() {
  const [produits, setProduits] = useState<ProduitAdmin[]>([])
  const [chargement, setChargement] = useState(true)
  const [actualisation, setActualisation] = useState(false)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')

  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('tous')

  const [modalOuverte, setModalOuverte] = useState(false)
  const [produitSelectionne, setProduitSelectionne] =
    useState<ProduitAdmin | null>(null)

  const [formulaire, setFormulaire] =
    useState<Formulaire>(formulaireInitial)

  const [enregistrement, setEnregistrement] = useState(false)

  async function chargerProduits(silencieux = false) {
    if (silencieux) {
      setActualisation(true)
    } else {
      setChargement(true)
    }

    setErreur('')

    try {
      const resultat = await recupererProduitsAdmin()

      if (!resultat.success) {
        setErreur(
          resultat.error || 'Impossible de charger les produits.',
        )
        setProduits([])
        return
      }

      setProduits((resultat.data || []) as ProduitAdmin[])
    } catch (err) {
      setErreur(
        err instanceof Error
          ? err.message
          : 'Impossible de charger les produits.',
      )
    } finally {
      setChargement(false)
      setActualisation(false)
    }
  }

  useEffect(() => {
    chargerProduits()
  }, [])

  const statistiques = useMemo(() => {
    const actifs = produits.filter(
      (produit) =>
        Number(produit.promo || 0) > 0 &&
        !estExpiree(produit.promo_fin),
    ).length

    const expirees = produits.filter(
      (produit) =>
        Number(produit.promo || 0) > 0 &&
        estExpiree(produit.promo_fin),
    ).length

    const sans = produits.filter(
      (produit) => Number(produit.promo || 0) <= 0,
    ).length

    return {
      total: produits.length,
      actifs,
      expirees,
      sans,
    }
  }, [produits])

  const produitsFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase()

    return produits.filter((produit) => {
      const promo = Number(produit.promo || 0)
      const expiree = estExpiree(produit.promo_fin)

      if (filtre === 'actives' && !(promo > 0 && !expiree)) {
        return false
      }

      if (filtre === 'expirees' && !(promo > 0 && expiree)) {
        return false
      }

      if (filtre === 'sans' && promo > 0) {
        return false
      }

      if (!terme) return true

      return (
        produit.nom.toLowerCase().includes(terme) ||
        produit.categorie?.toLowerCase().includes(terme) ||
        produit.sous_categorie?.toLowerCase().includes(terme)
      )
    })
  }, [produits, recherche, filtre])

  function ouvrirPromotion(produit: ProduitAdmin) {
    setProduitSelectionne(produit)

    setFormulaire({
      promo:
        Number(produit.promo || 0) > 0
          ? String(produit.promo)
          : '',
      prixOriginal:
        produit.prix_original != null
          ? String(produit.prix_original)
          : '',
      promoDebut: convertirVersDateHeureLocale(
        produit.promo_debut,
      ),
      promoFin: convertirVersDateHeureLocale(
        produit.promo_fin,
      ),
    })

    setErreur('')
    setMessage('')
    setModalOuverte(true)
  }

  function fermerModal() {
    if (enregistrement) return

    setModalOuverte(false)
    setProduitSelectionne(null)
    setFormulaire(formulaireInitial)
  }

  function modifierChamp(
    champ: keyof Formulaire,
    valeur: string,
  ) {
    setFormulaire((ancien) => ({
      ...ancien,
      [champ]: valeur,
    }))
  }

  const prixPromotionnel = (() => {
    const prixOriginal = Number(formulaire.prixOriginal)
    const promo = Number(formulaire.promo)

    if (
      !Number.isFinite(prixOriginal) ||
      prixOriginal <= 0 ||
      !Number.isFinite(promo) ||
      promo <= 0
    ) {
      return null
    }

    return Math.round(
      prixOriginal * (1 - Math.min(100, Math.max(0, promo)) / 100),
    )
  })()

  async function enregistrerPromotion() {
    if (!produitSelectionne) return

    setErreur('')
    setMessage('')

    const promo = Math.min(
      100,
      Math.max(0, Number(formulaire.promo) || 0),
    )

    const prixOriginal =
      formulaire.prixOriginal.trim() !== ''
        ? Number(formulaire.prixOriginal)
        : null

    if (promo > 0 && (!prixOriginal || prixOriginal <= 0)) {
      setErreur(
        'Indiquez un prix original valide lorsqu’une promotion est active.',
      )
      return
    }

    if (
      promo > 0 &&
      prixOriginal != null &&
      prixOriginal <= Number(produitSelectionne.prix)
    ) {
      setErreur(
        'Le prix original doit être supérieur au prix actuel.',
      )
      return
    }

    if (promo > 0 && !formulaire.promoDebut) {
      setErreur(
        'Indiquez la date et l’heure de début de la promotion.',
      )
      return
    }

    if (promo > 0 && !formulaire.promoFin) {
      setErreur(
        'Indiquez la date et l’heure de fin de la promotion.',
      )
      return
    }

    const promoDebut =
      promo > 0 && formulaire.promoDebut
        ? convertirDateHeureLocaleEnIso(
            formulaire.promoDebut,
          )
        : null

    const promoFin =
      promo > 0 && formulaire.promoFin
        ? convertirDateHeureLocaleEnIso(
            formulaire.promoFin,
          )
        : null

    if (promo > 0 && (!promoDebut || !promoFin)) {
      setErreur(
        'Les dates de promotion sont invalides.',
      )
      return
    }

    if (
      promo > 0 &&
      promoDebut &&
      promoFin &&
      new Date(promoFin).getTime() <=
        new Date(promoDebut).getTime()
    ) {
      setErreur(
        'La fin de promotion doit être après le début.',
      )
      return
    }

    setEnregistrement(true)

    try {
      const resultat = await modifierPromotionAdmin(
        produitSelectionne.id,
        {
          promo,
          prixOriginal: promo > 0 ? prixOriginal : null,
          promoDebut,
          promoFin,
        },
      )

      if (!resultat.success) {
        setErreur(
          resultat.error ||
            'Impossible d’enregistrer la promotion.',
        )
        return
      }

      setMessage(
        promo > 0
          ? 'Promotion enregistrée avec succès.'
          : 'Promotion désactivée avec succès.',
      )

      await chargerProduits(true)

      setTimeout(() => {
        setModalOuverte(false)
        setProduitSelectionne(null)
        setFormulaire(formulaireInitial)
        setMessage('')
      }, 700)
    } catch (err) {
      setErreur(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue.',
      )
    } finally {
      setEnregistrement(false)
    }
  }

  const onglets: Array<{
    id: Filtre
    label: string
    nombre: number
  }> = [
    { id: 'tous', label: 'Tous', nombre: statistiques.total },
    {
      id: 'actives',
      label: 'Actives',
      nombre: statistiques.actifs,
    },
    {
      id: 'expirees',
      label: 'Expirées',
      nombre: statistiques.expirees,
    },
    {
      id: 'sans',
      label: 'Sans promotion',
      nombre: statistiques.sans,
    },
  ]

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="relative overflow-hidden rounded-[30px] bg-[#0B1E3D] p-6 text-white shadow-xl shadow-slate-200/50 sm:p-8">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#0284C7]/30 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#FF7A1A]/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-sky-100">
                <BadgePercent size={14} />
                Studio promotions
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Pilotez vos promotions.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Créez, modifiez et désactivez les offres commerciales
                directement depuis votre catalogue.
              </p>
            </div>

            <button
              type="button"
              onClick={() => chargerProduits(true)}
              disabled={actualisation}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-black text-white transition hover:bg-white/15 disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={actualisation ? 'animate-spin' : ''}
              />
              Actualiser
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              Produits catalogue
            </p>
            <p className="mt-2 text-3xl font-black text-[#0B1E3D]">
              {statistiques.total}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600">
              Promotions actives
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {statistiques.actifs}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50/70 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-red-500">
              Promotions expirées
            </p>
            <p className="mt-2 text-3xl font-black text-red-600">
              {statistiques.expirees}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              Sans promotion
            </p>
            <p className="mt-2 text-3xl font-black text-slate-700">
              {statistiques.sans}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative min-w-0 flex-1 xl:max-w-xl">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={recherche}
                onChange={(event) =>
                  setRecherche(event.target.value)
                }
                placeholder="Rechercher un produit..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0284C7] focus:bg-white"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {onglets.map((onglet) => (
                <button
                  key={onglet.id}
                  type="button"
                  onClick={() => setFiltre(onglet.id)}
                  className={[
                    'inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-black transition',
                    filtre === onglet.id
                      ? 'bg-[#0B1E3D] text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                  ].join(' ')}
                >
                  {onglet.label}
                  <span
                    className={[
                      'rounded-full px-2 py-0.5 text-[10px]',
                      filtre === onglet.id
                        ? 'bg-white/15 text-white'
                        : 'bg-white text-slate-500',
                    ].join(' ')}
                  >
                    {onglet.nombre}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {erreur && !modalOuverte && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <XCircle size={18} className="mt-0.5 shrink-0" />
            <span>{erreur}</span>
          </div>
        )}

        {chargement ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[430px] animate-pulse rounded-3xl bg-slate-200/70"
              />
            ))}
          </div>
        ) : produitsFiltres.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {produitsFiltres.map((produit) => (
              <CarteProduit
                key={produit.id}
                produit={produit}
                onModifier={ouvrirPromotion}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Search size={24} />
            </div>

            <h2 className="mt-4 text-lg font-black text-[#0B1E3D]">
              Aucun produit trouvé
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Modifiez votre recherche ou sélectionnez un autre filtre.
            </p>
          </div>
        )}
      </div>

      {modalOuverte && produitSelectionne && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B1E3D]/60 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[30px] bg-white shadow-2xl sm:max-w-xl sm:rounded-[30px]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0284C7]">
                  Promotion produit
                </p>
                <h2 className="mt-1 line-clamp-1 text-lg font-black text-[#0B1E3D]">
                  {produitSelectionne.nom}
                </h2>
              </div>

              <button
                type="button"
                onClick={fermerModal}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Prix actuel
                    </p>
                    <p className="mt-1 text-xl font-black text-[#FF7A1A]">
                      {formatPrix(produitSelectionne.prix)}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F5FB] text-[#0284C7]">
                    <BadgePercent size={22} />
                  </div>
                </div>
              </div>

              {erreur && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  <XCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{erreur}</span>
                </div>
              )}

              {message && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                  <CheckCircle2 size={18} />
                  {message}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Remise (%)
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formulaire.promo}
                      onChange={(event) =>
                        modifierChamp(
                          'promo',
                          event.target.value,
                        )
                      }
                      placeholder="Ex. 15"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-black text-slate-800 outline-none focus:border-[#0284C7]"
                    />
                    <Percent
                      size={16}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </label>

                <label>
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Prix original
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={formulaire.prixOriginal}
                    onChange={(event) =>
                      modifierChamp(
                        'prixOriginal',
                        event.target.value,
                      )
                    }
                    placeholder="Ex. 25000"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 outline-none focus:border-[#0284C7]"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-[#BAE6FD] bg-[#F0F9FF] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#0284C7]">
                      Prix promotionnel calculé
                    </p>
                    <p className="mt-1 text-2xl font-black text-[#0B1E3D]">
                      {prixPromotionnel != null
                        ? formatPrix(prixPromotionnel)
                        : '—'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white px-3 py-2 text-xs font-black text-[#0284C7] shadow-sm">
                    {prixPromotionnel != null
                      ? `-${Math.min(100, Math.max(0, Number(formulaire.promo) || 0))}%`
                      : 'Remplissez les champs'}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Début de promotion
                  </span>
                  <div className="relative">
                    <CalendarDays
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="datetime-local"
                      value={formulaire.promoDebut}
                      onChange={(event) =>
                        modifierChamp(
                          'promoDebut',
                          event.target.value,
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0284C7]"
                    />
                  </div>
                </label>

                <label>
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Fin de promotion
                  </span>
                  <div className="relative">
                    <Clock3
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="datetime-local"
                      value={formulaire.promoFin}
                      onChange={(event) =>
                        modifierChamp(
                          'promoFin',
                          event.target.value,
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-[#0284C7]"
                    />
                  </div>
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <Clock3
                    size={17}
                    className="mt-0.5 shrink-0 text-[#0284C7]"
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    Pour désactiver la promotion, mettez simplement la
                    remise à <strong>0%</strong>. Les données seront
                    enregistrées via le système de promotion existant.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={fermerModal}
                  disabled={enregistrement}
                  className="min-h-11 rounded-xl border border-slate-200 px-5 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={enregistrerPromotion}
                  disabled={enregistrement}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-5 text-xs font-black text-white transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enregistrement ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
