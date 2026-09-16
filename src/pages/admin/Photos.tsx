import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Image,
  RefreshCw,
  Search,
  Upload,
  X,
} from 'lucide-react'
import {
  recupererProduitsAdmin,
  televerserPhotoProduit,
  modifierPhotoProduitAdmin,
} from '../../services/supabase'

type Produit = {
  id: string
  nom?: string
  image_url?: string | null
}

type Filtre = 'tous' | 'avec' | 'sans'

export default function Photos() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [chargement, setChargement] = useState(true)
  const [uploadId, setUploadId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [apercu, setApercu] = useState<Produit | null>(null)

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  async function charger() {
    setChargement(true)
    setErreur('')

    const resultat = await recupererProduitsAdmin()

    if (!resultat.success) {
      setErreur(resultat.error || 'Impossible de charger les produits.')
      setProduits([])
    } else {
      setProduits((resultat.data || []) as Produit[])
    }

    setChargement(false)
  }

  useEffect(() => {
    charger()
  }, [])

  async function choisirPhoto(produit: Produit, file?: File) {
    if (!file) return

    setUploadId(produit.id)
    setMessage('')
    setErreur('')

    const upload = await televerserPhotoProduit(file)

    if (!upload.success || !upload.url) {
      setErreur(upload.error || 'Impossible de téléverser la photo.')
      setUploadId(null)
      return
    }

    const modification = await modifierPhotoProduitAdmin(
      produit.id,
      upload.url,
    )

    if (!modification.success) {
      setErreur(
        modification.error ||
          'La photo a été téléversée mais n’a pas pu être associée au produit.',
      )
      setUploadId(null)
      return
    }

    setProduits((actuels) =>
      actuels.map((item) =>
        item.id === produit.id
          ? { ...item, image_url: upload.url }
          : item,
      ),
    )

    setMessage(`Photo de « ${produit.nom || 'Produit'} » mise à jour.`)
    setUploadId(null)

    const input = inputRefs.current[produit.id]
    if (input) input.value = ''
  }

  const statistiques = useMemo(() => {
    const avecPhoto = produits.filter((produit) => Boolean(produit.image_url))
    return {
      total: produits.length,
      avecPhoto: avecPhoto.length,
      sansPhoto: produits.length - avecPhoto.length,
    }
  }, [produits])

  const produitsFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase()

    return produits.filter((produit) => {
      const correspondRecherche =
        !terme || (produit.nom || 'Produit').toLowerCase().includes(terme)

      const correspondFiltre =
        filtre === 'tous' ||
        (filtre === 'avec' && Boolean(produit.image_url)) ||
        (filtre === 'sans' && !produit.image_url)

      return correspondRecherche && correspondFiltre
    })
  }, [produits, recherche, filtre])

  return (
    <div className="min-h-full space-y-6 pb-8">
      <section className="overflow-hidden rounded-3xl bg-[#0B1E3D] text-white shadow-[0_20px_60px_rgba(11,30,61,0.16)]">
        <div className="relative px-5 py-7 sm:px-7 lg:px-9">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#0284C7]/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-sky-100">
                <Image className="h-3.5 w-3.5" />
                Galerie produits
              </div>

              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Photos
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Gérez rapidement les visuels de votre catalogue depuis un
                espace unique.
              </p>
            </div>

            <button
              type="button"
              onClick={charger}
              disabled={chargement}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-[#0B1E3D] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${chargement ? 'animate-spin' : ''}`}
              />
              Actualiser
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            Produits
          </p>
          <p className="mt-2 text-2xl font-black text-[#0B1E3D]">
            {statistiques.total}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Catalogue administré
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            Avec photo
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {statistiques.avecPhoto}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Visuels disponibles
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            À compléter
          </p>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {statistiques.sansPhoto}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Produits sans visuel
          </p>
        </div>
      </section>

      {message && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {erreur && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{erreur}</span>
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0284C7] focus:bg-white"
            />
            {recherche && (
              <button
                type="button"
                onClick={() => setRecherche('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ['tous', 'Tous'],
                ['avec', 'Avec photo'],
                ['sans', 'Sans photo'],
              ] as const
            ).map(([valeur, label]) => (
              <button
                key={valeur}
                type="button"
                onClick={() => setFiltre(valeur)}
                className={`rounded-xl px-3.5 py-2 text-xs font-black transition ${
                  filtre === valeur
                    ? 'bg-[#0B1E3D] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {!chargement && (
          <div className="mt-4 border-t border-slate-100 pt-4 text-xs font-bold text-slate-400">
            {produitsFiltres.length} produit
            {produitsFiltres.length > 1 ? 's' : ''} affiché
            {produitsFiltres.length > 1 ? 's' : ''}
          </div>
        )}
      </section>

      {chargement ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#0284C7]" />
          <p className="mt-4 text-sm font-bold text-slate-600">
            Chargement des produits...
          </p>
        </div>
      ) : produitsFiltres.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Image className="h-7 w-7 text-slate-400" />
          </div>
          <h2 className="mt-4 text-lg font-black text-[#0B1E3D]">
            Aucun produit trouvé
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
            Modifiez votre recherche ou votre filtre pour afficher d’autres
            produits.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {produitsFiltres.map((produit) => {
            const enCours = uploadId === produit.id

            return (
              <article
                key={produit.id}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <button
                  type="button"
                  onClick={() => produit.image_url && setApercu(produit)}
                  className={`relative block aspect-square w-full overflow-hidden bg-slate-100 ${
                    produit.image_url ? 'cursor-zoom-in' : 'cursor-default'
                  }`}
                  aria-label={
                    produit.image_url
                      ? `Aperçu de ${produit.nom || 'ce produit'}`
                      : undefined
                  }
                >
                  {produit.image_url ? (
                    <>
                      <img
                        src={produit.image_url}
                        alt={produit.nom || 'Produit'}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-3 top-3 flex justify-between">
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 shadow-sm backdrop-blur">
                          Photo active
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-slate-400">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <Image className="h-7 w-7" />
                      </div>
                      <span className="mt-3 text-xs font-black uppercase tracking-wide">
                        Aucune photo
                      </span>
                    </div>
                  )}
                </button>

                <div className="space-y-4 p-4">
                  <div>
                    <h2 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-[#0B1E3D]">
                      {produit.nom || 'Produit sans nom'}
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      JPG, PNG ou WEBP · 5 Mo max.
                    </p>
                  </div>

                  <input
                    ref={(element) => {
                      inputRefs.current[produit.id] = element
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) =>
                      choisirPhoto(produit, event.target.files?.[0])
                    }
                  />

                  <button
                    type="button"
                    disabled={enCours}
                    onClick={() =>
                      inputRefs.current[produit.id]?.click()
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0284C7] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {enCours ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Téléversement...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        {produit.image_url
                          ? 'Remplacer la photo'
                          : 'Ajouter une photo'}
                      </>
                    )}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {apercu?.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#020817]/80 p-4 backdrop-blur-sm"
          onClick={() => setApercu(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu de la photo"
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-3xl bg-white p-2 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setApercu(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
              aria-label="Fermer l’aperçu"
            >
              <X className="h-5 w-5" />
            </button>

            <img
              src={apercu.image_url}
              alt={apercu.nom || 'Produit'}
              className="max-h-[84vh] max-w-full rounded-2xl object-contain"
            />

            <div className="px-3 pb-2 pt-3">
              <p className="text-sm font-black text-[#0B1E3D]">
                {apercu.nom || 'Produit'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
