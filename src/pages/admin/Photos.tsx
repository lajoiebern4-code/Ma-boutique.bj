import { useEffect, useRef, useState } from 'react'
import { Image, Upload, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
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

export default function Photos() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [chargement, setChargement] = useState(true)
  const [uploadId, setUploadId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Image className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Photos</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Gérez les photos des produits depuis l'administration.
          </p>
        </div>

        <button
          type="button"
          onClick={charger}
          disabled={chargement}
          className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${chargement ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          {message}
        </div>
      )}

      {erreur && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" />
          {erreur}
        </div>
      )}

      {chargement ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">
          Chargement des produits...
        </div>
      ) : produits.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">
          Aucun produit trouvé.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {produits.map((produit) => {
            const enCours = uploadId === produit.id

            return (
              <div
                key={produit.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              >
                <div className="aspect-square bg-gray-100">
                  {produit.image_url ? (
                    <img
                      src={produit.image_url}
                      alt={produit.nom || 'Produit'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-gray-400">
                      <Image className="h-12 w-12" />
                      <span className="mt-2 text-sm">Aucune photo</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <h2 className="line-clamp-2 font-semibold">
                    {produit.nom || 'Produit sans nom'}
                  </h2>

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
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    {enCours ? 'Téléversement...' : 'Changer la photo'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
