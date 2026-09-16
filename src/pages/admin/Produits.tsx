import { useCallback, useEffect, useState, type ChangeEvent } from 'react'
import {
  Check,
  ImagePlus,
  ArrowLeft,
  ArrowRight,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

import type { ProduitPhotoAdmin, ProduitVariante } from '../../services/supabase'

import {
  ajouterProduit,
  ajouterPhotoProduitAdmin,
  definirPhotoPrincipaleAdmin,
  modifierProduit,
  recupererPhotosProduit,
  recupererProduitsAdmin,
  reordonnerPhotosProduitAdmin,
  supprimerPhotoProduit,
  supprimerPhotoProduitAdmin,
  supprimerProduit,
  televerserPhotoProduit,
  ajouterVarianteProduit,
  modifierVarianteProduit,
  recupererVariantesProduit,
  supprimerVarianteProduit,
  reordonnerVariantesProduit,
} from '../../services/supabase'

const COULEURS_PRODUIT = [
  'Noir',
  'Blanc',
  'Rouge',
  'Bleu',
  'Bleu ciel',
  'Bleu marine',
  'Vert',
  'Vert foncé',
  'Jaune',
  'Orange',
  'Rose',
  'Violet',
  'Marron',
  'Beige',
  'Gris',
  'Doré',
  'Argenté',
  'Bordeaux',
  'Camel',
] as const

type Produit = {
  id: string
  nom?: string
  prix?: number
  prix_original?: number | null
  stock?: number
  disponibilite?: string
  poids_kg?: number | null
  volume_cbm?: number | null
  image_url?: string | null
  description?: string
  categorie?: string | null
  sous_categorie?: string | null
  genre?: string | null
  promo?: number
  nouveau?: boolean
  date_ajout?: string | null
  created_at?: string | null
  produit_source_id?: string | null
  promo_fin?: string | null
}

type Statut = 'stock' | 'sur_commande'

type FormulaireProduit = {
  nom: string
  description: string
  prix: string
  prixOriginal: string
  categorie: string
  sousCategorie: string
  genre: string
  stock: string
  disponibilite: Statut
  poidsKg: string
  volumeCbm: string
  promo: string
  nouveau: boolean
  dateAjout: string
  promoFin: string
  produitSourceId: string
  image: string
}

const formulaireInitial: FormulaireProduit = {
  nom: '',
  description: '',
  prix: '',
  prixOriginal: '',
  categorie: '',
  sousCategorie: '',
  genre: '',
  stock: '0',
  disponibilite: 'stock',
  poidsKg: '',
  volumeCbm: '',
  promo: '0',
  nouveau: false,
  dateAjout: new Date().toISOString().slice(0, 10),
  promoFin: '',
  produitSourceId: '',
  image: '',
}

function formaterPrix(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`
}

function libelleStatut(statut: string) {
  if (statut === 'sur_commande') return 'Sur commande'
  return 'En stock'
}


function detecterCategorieDepuisTitre(titre: string) {
  const t = titre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (
    /\bsac\b/.test(t) ||
    /\bsacs\b/.test(t) ||
    t.includes('sac en main') ||
    t.includes('sac a main') ||
    t.includes('sacoche') ||
    t.includes('cartable') ||
    t.includes('portefeuille')
  ) {
    return {
      categorie: 'sacs',
      sousCategorie: /\bfemme\b|\bdame\b/.test(t) ? 'femme' : '',
      genre: /\bfemme\b|\bdame\b/.test(t) ? 'femme' : '',
    }
  }

  if (
    /\biphone\b/.test(t) ||
    /\bsamsung\b/.test(t) ||
    /\bxiaomi\b/.test(t) ||
    /\btecno\b/.test(t) ||
    /\binfinix\b/.test(t) ||
    /\bsmartphone\b/.test(t) ||
    /\btelephone\b/.test(t) ||
    /\btelephones\b/.test(t)
  ) {
    return {
      categorie: 'telephones',
      sousCategorie: '',
      genre: '',
    }
  }

  if (
    t.includes('airfryer') ||
    t.includes('friteuse') ||
    t.includes('mixeur') ||
    t.includes('blender') ||
    t.includes('robot aspirateur') ||
    t.includes('aspirateur') ||
    t.includes('cuisine')
  ) {
    return {
      categorie: 'cuisine',
      sousCategorie:
        t.includes('aspirateur') || t.includes('airfryer') || t.includes('friteuse')
          ? 'electromenager'
          : '',
      genre: '',
    }
  }

  if (
    t.includes('airpods') ||
    t.includes('casque') ||
    t.includes('ecouteurs') ||
    t.includes('enceinte') ||
    t.includes('sony wh')
  ) {
    return {
      categorie: 'electronique',
      sousCategorie: 'audio',
      genre: '',
    }
  }

  if (
    t.includes('macbook') ||
    t.includes('ordinateur') ||
    t.includes('laptop') ||
    t.includes('pc portable')
  ) {
    return {
      categorie: 'electronique',
      sousCategorie: 'ordinateur',
      genre: '',
    }
  }

  if (
    t.includes('chaussure') ||
    t.includes('chaussures') ||
    t.includes('basket') ||
    t.includes('sandale') ||
    t.includes('sandal')
  ) {
    return {
      categorie: 'chaussures',
      sousCategorie: '',
      genre: /\bfemme\b|\bdame\b/.test(t)
        ? 'femme'
        : /\bhomme\b|\bhomme\b/.test(t)
          ? 'homme'
          : '',
    }
  }

  if (
    t.includes('robe') ||
    t.includes('jupe') ||
    t.includes('pantalon') ||
    t.includes('chemise') ||
    t.includes('tshirt') ||
    t.includes('t-shirt') ||
    t.includes('vetement') ||
    t.includes('vetements')
  ) {
    const femme = /\bfemme\b|\bdame\b/.test(t)
    const homme = /\bhomme\b|\bmonsieur\b/.test(t)

    return {
      categorie: 'vetements',
      sousCategorie: '',
      genre: femme ? 'femme' : homme ? 'homme' : '',
    }
  }

  return null
}

export default function Produits() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [sauvegardeId, setSauvegardeId] = useState<string | null>(null)
  const [suppressionId, setSuppressionId] = useState<string | null>(null)
  const [produitASupprimer, setProduitASupprimer] = useState<Produit | null>(null)

  const [ajoutOuvert, setAjoutOuvert] = useState(false)
  const [produitModificationId, setProduitModificationId] = useState<string | null>(null)
  const [creationEnCours, setCreationEnCours] = useState(false)
  const [generationDescriptionEnCours, setGenerationDescriptionEnCours] = useState(false)
  const [formulaire, setFormulaire] =
    useState<FormulaireProduit>(formulaireInitial)
  const [photosFichiers, setPhotosFichiers] = useState<File[]>([])
  const [photosApercus, setPhotosApercus] = useState<string[]>([])
  const [photosProduit, setPhotosProduit] = useState<ProduitPhotoAdmin[]>([])

  const [variantesProduit, setVariantesProduit] = useState<ProduitVariante[]>([])
  const [varianteNom, setVarianteNom] = useState('')
  const [varianteStock, setVarianteStock] = useState('0')
  const [varianteChargement, setVarianteChargement] = useState(false)
  const [varianteSauvegardeId, setVarianteSauvegardeId] = useState<string | null>(null)

  const chargerProduits = useCallback(async () => {
    setChargement(true)
    setErreur('')

    const resultat = await recupererProduitsAdmin()

    if (!resultat.success) {
      setErreur(
        resultat.error || 'Impossible de récupérer les produits.',
      )
      setProduits([])
    } else {
      setProduits((resultat.data || []) as Produit[])
    }

    setChargement(false)
  }, [])

  useEffect(() => {
    chargerProduits()
  }, [chargerProduits])

  function modifierFormulaire(
    champ: keyof FormulaireProduit,
    valeur: string | boolean,
  ) {
    setFormulaire((actuel) => ({
      ...actuel,
      [champ]: valeur,
    }))
    setErreur('')
    setMessage('')
  }

  async function ajouterVariante() {
    if (!produitModificationId) return

    const nom = varianteNom.trim()
    const stock = Math.max(
      0,
      Math.floor(Number(varianteStock) || 0),
    )

    if (!nom) {
      setErreur('Le nom de la variante est obligatoire.')
      return
    }

    setVarianteChargement(true)
    setErreur('')
    setMessage('')

    try {
      const resultat = await ajouterVarianteProduit(
        produitModificationId,
        nom,
        stock,
      )

      if (!resultat.success) {
        throw new Error(
          resultat.error || 'Impossible d’ajouter la variante.',
        )
      }

      const recharge = await recupererVariantesProduit(
        produitModificationId,
      )

      if (!recharge.success) {
        throw new Error(
          recharge.error || 'Impossible de recharger les variantes.',
        )
      }

      setVariantesProduit(recharge.data)
      setVarianteNom('')
      setVarianteStock('0')
      setMessage(`Variante « ${nom} » ajoutée.`)
    } catch (err) {
      setErreur(
        err instanceof Error
          ? err.message
          : 'Erreur lors de l’ajout de la variante.',
      )
    } finally {
      setVarianteChargement(false)
    }
  }

  async function sauvegarderVariante(
    variante: ProduitVariante,
  ) {
    const nom = variante.nom.trim()
    const stock = Math.max(
      0,
      Math.floor(Number(variante.stock) || 0),
    )

    if (!nom) {
      setErreur('Le nom de la variante est obligatoire.')
      return
    }

    setVarianteSauvegardeId(variante.id)
    setErreur('')
    setMessage('')

    try {
      const resultat = await modifierVarianteProduit(
        variante.id,
        nom,
        stock,
        variante.position,
      )

      if (!resultat.success) {
        throw new Error(
          resultat.error || 'Impossible de modifier la variante.',
        )
      }

      const recharge = await recupererVariantesProduit(
        variante.produit_id,
      )

      if (!recharge.success) {
        throw new Error(
          recharge.error || 'Impossible de recharger les variantes.',
        )
      }

      setVariantesProduit(recharge.data)
      setMessage(`Variante « ${nom} » mise à jour.`)
    } catch (err) {
      setErreur(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la modification de la variante.',
      )
    } finally {
      setVarianteSauvegardeId(null)
    }
  }

  async function supprimerVarianteAdmin(
    variante: ProduitVariante,
  ) {
    if (varianteSauvegardeId) return

    setVarianteSauvegardeId(variante.id)
    setErreur('')
    setMessage('')

    try {
      const resultat = await supprimerVarianteProduit(
        variante.id,
      )

      if (!resultat.success) {
        throw new Error(
          resultat.error || 'Impossible de supprimer la variante.',
        )
      }

      setVariantesProduit((actuelles) =>
        actuelles.filter((item) => item.id !== variante.id),
      )
      setMessage(`Variante « ${variante.nom} » supprimée.`)
    } catch (err) {
      setErreur(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la suppression de la variante.',
      )
    } finally {
      setVarianteSauvegardeId(null)
    }
  }

  async function deplacerVariante(
    index: number,
    direction: -1 | 1,
  ) {
    if (!produitModificationId || varianteSauvegardeId) return

    const cible = index + direction

    if (
      cible < 0 ||
      cible >= variantesProduit.length
    ) {
      return
    }

    const nouvelOrdre = variantesProduit.map(
      (variante) => variante.id,
    )

    ;[
      nouvelOrdre[index],
      nouvelOrdre[cible],
    ] = [
      nouvelOrdre[cible],
      nouvelOrdre[index],
    ]

    setVarianteSauvegardeId(variantesProduit[index].id)
    setErreur('')
    setMessage('')

    try {
      const resultat = await reordonnerVariantesProduit(
        produitModificationId,
        nouvelOrdre,
      )

      if (!resultat.success) {
        throw new Error(
          resultat.error || 'Impossible de déplacer la variante.',
        )
      }

      const recharge = await recupererVariantesProduit(
        produitModificationId,
      )

      if (!recharge.success) {
        throw new Error(
          recharge.error || 'Impossible de recharger les variantes.',
        )
      }

      setVariantesProduit(recharge.data)
      setMessage('Variante déplacée.')
    } catch (err) {
      setErreur(
        err instanceof Error
          ? err.message
          : 'Erreur lors du déplacement de la variante.',
      )
    } finally {
      setVarianteSauvegardeId(null)
    }
  }

  function ouvrirAjout() {
    setFormulaire({
      ...formulaireInitial,
      dateAjout: new Date().toISOString().slice(0, 10),
    })
    setPhotosFichiers([])
    setPhotosApercus([])
    setPhotosProduit([])
    setVariantesProduit([])
    setVarianteNom('')
    setVarianteStock('0')
    setErreur('')
    setMessage('')
    setAjoutOuvert(true)
  }

  async function ouvrirModification(produit: Produit) {
    setProduitModificationId(produit.id)

    setFormulaire({
      nom: produit.nom || '',
      description: produit.description || '',
      prix: String(produit.prix ?? ''),
      prixOriginal: String(produit.prix_original ?? ''),
      categorie: produit.categorie || '',
      sousCategorie: produit.sous_categorie || '',
      genre: produit.genre || '',
      disponibilite:
        produit.disponibilite === 'sur_commande'
          ? 'sur_commande'
          : 'stock',
      stock: String(produit.stock ?? 0),
      promo: String(produit.promo ?? 0),
      promoFin: produit.promo_fin || '',
      dateAjout: produit.created_at
        ? String(produit.created_at).slice(0, 10)
        : '',
      produitSourceId: produit.produit_source_id || '',
      nouveau: Boolean(produit.nouveau),
      image: produit.image_url || '',
      poidsKg: String(produit.poids_kg ?? ''),
      volumeCbm: String(produit.volume_cbm ?? ''),
    })

    setPhotosFichiers([])
    setPhotosProduit([])
    setVariantesProduit([])
    setVarianteNom('')
    setVarianteStock('0')
    setPhotosApercus(
      produit.image_url ? [produit.image_url] : [],
    )
    setErreur('')
    setMessage('')
    setAjoutOuvert(true)

    const resultat = await recupererPhotosProduit(produit.id)

    if (resultat.success && resultat.data.length > 0) {
      setPhotosProduit(resultat.data)
      setPhotosApercus(
        resultat.data.map((photo) => photo.url),
      )
    }

    const variantes = await recupererVariantesProduit(produit.id)

    if (variantes.success) {
      setVariantesProduit(variantes.data)
    } else {
      setErreur(
        variantes.error ||
          'Impossible de récupérer les variantes du produit.',
      )
    }
  }

  function fermerAjout() {
    if (creationEnCours) return

    setAjoutOuvert(false)
    setProduitModificationId(null)
    setPhotosFichiers([])
    setPhotosApercus([])
    setPhotosProduit([])
    setVariantesProduit([])
    setVarianteNom('')
    setVarianteStock('0')
  }

  function choisirPhoto(event: ChangeEvent<HTMLInputElement>) {
    const fichiers = Array.from(event.target.files || [])

    if (!fichiers.length) return

    const typesAutorises = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    for (const fichier of fichiers) {
      if (!typesAutorises.includes(fichier.type)) {
        setErreur('Format accepté : JPG, PNG ou WEBP.')
        event.target.value = ''
        return
      }

      if (fichier.size > 5 * 1024 * 1024) {
        setErreur(
          `La photo "${fichier.name}" doit faire moins de 5 Mo.`,
        )
        event.target.value = ''
        return
      }
    }

    setPhotosFichiers((actuels) => [
      ...actuels,
      ...fichiers,
    ])

    setPhotosApercus((actuels) => [
      ...actuels,
      ...fichiers.map((fichier) =>
        URL.createObjectURL(fichier),
      ),
    ])

    setErreur('')
    event.target.value = ''
  }

  function fichierVersDataUrl(fichier: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const lecteur = new FileReader()

      lecteur.onload = () => {
        if (typeof lecteur.result === 'string') {
          resolve(lecteur.result)
        } else {
          reject(new Error('Impossible de lire la photo sélectionnée.'))
        }
      }

      lecteur.onerror = () => {
        reject(new Error('Impossible de lire la photo sélectionnée.'))
      }

      lecteur.readAsDataURL(fichier)
    })
  }

  async function genererDescription() {
    setErreur('')
    setMessage('')

    const nom = formulaire.nom.trim()

    if (!nom && !photosFichiers.length) {
      setErreur('Renseignez le nom du produit ou ajoutez une photo.')
      return
    }

    setGenerationDescriptionEnCours(true)

    try {
      let image: string | undefined

      if (photosFichiers[0]) {
        image = await fichierVersDataUrl(photosFichiers[0])
      }

      const produit = {
        nom,
        categorie: formulaire.categorie.trim(),
        sousCategorie: formulaire.sousCategorie.trim(),
        genre: formulaire.genre.trim(),
        prix: formulaire.prix.trim(),
        disponibilite: formulaire.disponibilite,
        stock: formulaire.stock.trim(),
        caracteristiques: [
          formulaire.poidsKg.trim()
            ? `Poids : ${formulaire.poidsKg.trim()} kg`
            : '',
          formulaire.volumeCbm.trim()
            ? `Volume : ${formulaire.volumeCbm.trim()} CBM`
            : '',
        ]
          .filter(Boolean)
          .join(' ; '),
        description: formulaire.description.trim(),
      }

      const { data, error } = await supabase.functions.invoke(
        'generer-description-produit',
        {
          body: {
            produit,
            ...(image ? { image } : {}),
          },
        },
      )

      if (error) {
        let message = error.message || 'Le service de génération est indisponible.'

        try {
          const details = await error.context?.json?.()

          if (details?.error) {
            message = details.error
          }
        } catch {
          // Le service peut ne pas retourner de JSON exploitable.
        }

        throw new Error(message)
      }

      if (!data?.success || !data?.description?.trim()) {
        throw new Error(
          data?.error || 'L’IA n’a pas retourné de description exploitable.',
        )
      }

      setFormulaire((precedent) => ({
        ...precedent,
        nom: data.titre?.trim() || precedent.nom,
        description: data.description.trim(),
      }))

      setMessage(
        data.titre?.trim()
          ? 'Titre et description générés avec succès.'
          : 'Description générée avec succès.',
      )
    } catch (error) {
      setErreur(
        error instanceof Error
          ? error.message
          : 'Impossible de générer la description.',
      )
    } finally {
      setGenerationDescriptionEnCours(false)
    }
  }

  async function creerProduit() {
    setErreur('')
    setMessage('')

    const nom = formulaire.nom.trim()
    const description = formulaire.description.trim()
    const prix = Number(formulaire.prix)

    if (!nom) {
      setErreur('Le nom du produit est obligatoire.')
      return
    }

    if (!description) {
      setErreur('La description du produit est obligatoire.')
      return
    }

    if (!Number.isFinite(prix) || prix <= 0) {
      setErreur('Le prix de vente doit être supérieur à 0.')
      return
    }

    const stock =
      formulaire.disponibilite === 'sur_commande'
        ? 0
        : Math.max(
            0,
            Math.floor(Number(formulaire.stock) || 0),
          )

    const promo = Math.min(
      100,
      Math.max(0, Number(formulaire.promo) || 0),
    )

    if (promo > 0 && !formulaire.prixOriginal) {
      setErreur(
        'Indiquez le prix original lorsqu’une promotion est appliquée.',
      )
      return
    }

    if (
      formulaire.promoFin &&
      formulaire.dateAjout &&
      formulaire.promoFin < formulaire.dateAjout
    ) {
      setErreur(
        'La fin de promotion ne peut pas être avant la date d’ajout.',
      )
      return
    }

    setCreationEnCours(true)

    try {
      let imageUrl = formulaire.image.trim() || null

      if (photosFichiers[0]) {
        const upload = await televerserPhotoProduit(photosFichiers[0])

        if (!upload.success) {
          throw new Error(
            upload.error || 'Impossible de téléverser la photo principale.',
          )
        }

        imageUrl = upload.url || null

        if (!imageUrl) {
          throw new Error(
            'La photo principale a été téléversée mais aucune URL publique n’a été retournée.',
          )
        }
      }

      const resultat = await ajouterProduit({
        nom,
        description,
        prix,
        prixOriginal: formulaire.prixOriginal
          ? Number(formulaire.prixOriginal)
          : null,
        categorie: formulaire.categorie.trim() || null,
        sousCategorie:
          formulaire.sousCategorie.trim() || null,
        genre: formulaire.genre.trim() || null,
        image: imageUrl,
        stock,
        disponibilite: formulaire.disponibilite,
        poidsKg: formulaire.poidsKg,
        volumeCbm: formulaire.volumeCbm,
        promo,
        nouveau: formulaire.nouveau,
        dateAjout: formulaire.dateAjout || null,
        promoFin: formulaire.promoFin || null,
        produitSourceId:
          formulaire.produitSourceId.trim() || null,
      })

      if (!resultat.success) {
        throw new Error(
          resultat.error || 'Impossible de créer le produit.',
        )
      }

      const produitId =
        resultat.data && typeof resultat.data === 'object'
          ? (resultat.data as { id?: string }).id
          : undefined

      if (!produitId) {
        throw new Error(
          'Le produit a été créé mais son identifiant est introuvable.',
        )
      }

      if (photosFichiers.length > 0) {
        for (let index = 0; index < photosFichiers.length; index += 1) {
          const fichier = photosFichiers[index]

          const upload =
            index === 0
              ? { success: true, url: imageUrl }
              : await televerserPhotoProduit(fichier)

          if (!upload.success || !upload.url) {
            throw new Error(
              `Impossible de téléverser la photo ${index + 1}.`,
            )
          }

          const photo = await ajouterPhotoProduitAdmin(
            produitId,
            upload.url,
            index,
            index === 0,
            upload.chemin,
          )

          if (!photo.success) {
            throw new Error(
              photo.error ||
                `Impossible d'enregistrer la photo ${index + 1}.`,
            )
          }
        }
      }

      setMessage(`"${nom}" a été ajouté au catalogue.`)
      setAjoutOuvert(false)
      setFormulaire(formulaireInitial)
      setPhotosFichiers([])
      setPhotosApercus([])

      await chargerProduits()
    } catch (err) {
      setErreur(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la création du produit.',
      )
    } finally {
      setCreationEnCours(false)
    }
  }

  async function modifierProduitDepuisFormulaire() {
    if (!produitModificationId) return

    setErreur('')
    setMessage('')

    const nom = formulaire.nom.trim()
    const description = formulaire.description.trim()
    const prix = Number(formulaire.prix)

    if (!nom) {
      setErreur('Le nom du produit est obligatoire.')
      return
    }

    if (!description) {
      setErreur('La description du produit est obligatoire.')
      return
    }

    if (!Number.isFinite(prix) || prix <= 0) {
      setErreur('Le prix de vente doit être supérieur à 0.')
      return
    }

    const stock =
      formulaire.disponibilite === 'sur_commande'
        ? 0
        : Math.max(
            0,
            Math.floor(Number(formulaire.stock) || 0),
          )

    const promo = Math.min(
      100,
      Math.max(0, Number(formulaire.promo) || 0),
    )

    if (promo > 0 && !formulaire.prixOriginal) {
      setErreur(
        'Indiquez le prix original lorsqu’une promotion est appliquée.',
      )
      return
    }

    setCreationEnCours(true)

    try {
      const resultat = await modifierProduit(
        produitModificationId,
        {
          stock,
          disponibilite: formulaire.disponibilite,
          poidsKg: formulaire.poidsKg,
          volumeCbm: formulaire.volumeCbm,
          promo,
          prixOriginal: formulaire.prixOriginal
            ? Number(formulaire.prixOriginal)
            : null,
          promoFin: formulaire.promoFin || null,
          description,
        },
      )

      if (!resultat.success) {
        throw new Error(
          resultat.error || 'Impossible de modifier le produit.',
        )
      }

      if (photosFichiers.length > 0) {
        const photosExistantes = await recupererPhotosProduit(
          produitModificationId,
        )

        if (!photosExistantes.success) {
          throw new Error(
            photosExistantes.error ||
              'Impossible de récupérer les photos existantes.',
          )
        }

        const positionDepart =
          photosExistantes.data.length > 0
            ? Math.max(...photosExistantes.data.map((photo) => photo.position)) + 1
            : 0

        for (
          let index = 0;
          index < photosFichiers.length;
          index += 1
        ) {
          const fichier = photosFichiers[index]

          const upload = await televerserPhotoProduit(fichier)

          if (!upload.success || !upload.url) {
            throw new Error(
              `Impossible de téléverser la nouvelle photo ${index + 1}.`,
            )
          }

          const photo = await ajouterPhotoProduitAdmin(
            produitModificationId,
            upload.url,
            positionDepart + index,
            false,
            upload.chemin,
          )

          if (!photo.success) {
            throw new Error(
              photo.error ||
                `Impossible d'enregistrer la nouvelle photo ${index + 1}.`,
            )
          }
        }
      }

      setMessage(`"${nom}" a été mis à jour.`)
      setAjoutOuvert(false)
      setProduitModificationId(null)
      setFormulaire(formulaireInitial)
      setPhotosFichiers([])
      setPhotosApercus([])
      setPhotosProduit([])
      await chargerProduits()
    } catch (err) {
      setErreur(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la modification du produit.',
      )
    } finally {
      setCreationEnCours(false)
    }
  }

  function modifierLocal(
    id: string,
    champ:
      | 'stock'
      | 'disponibilite'
      | 'poids_kg'
      | 'volume_cbm'
      | 'promo'
      | 'promo_fin',
    valeur: string | number,
  ) {
    setProduits((actuels) =>
      actuels.map((produit) =>
        produit.id === id
          ? { ...produit, [champ]: valeur }
          : produit,
      ),
    )

    setMessage('')
    setErreur('')
  }

  async function sauvegarder(produit: Produit) {
    const stock = Math.max(
      0,
      Math.floor(Number(produit.stock) || 0),
    )

    const disponibilite = (
      produit.disponibilite === 'sur_commande'
        ? 'sur_commande'
        : 'stock'
    ) as Statut

    setSauvegardeId(produit.id)
    setMessage('')
    setErreur('')

    const resultat = await modifierProduit(produit.id, {
      stock,
      disponibilite,
      poidsKg: produit.poids_kg ?? null,
      volumeCbm: produit.volume_cbm ?? null,
      promo: Number(produit.promo || 0),
      prixOriginal: produit.prix_original ?? null,
      promoFin: produit.promo_fin || null,
      description: produit.description || '',
    })

    if (!resultat.success) {
      setErreur(
        resultat.error ||
          `Impossible de modifier ${
            produit.nom || 'ce produit'
          }.`,
      )
    } else {
      setProduits((actuels) =>
        actuels.map((item) =>
          item.id === produit.id
            ? {
                ...item,
                stock,
                disponibilite,
              }
            : item,
        ),
      )

      setMessage(
        `"${produit.nom || 'Produit'}" mis à jour.`,
      )
    }

    setSauvegardeId(null)
  }

  function supprimerProduitAdmin(produit: Produit) {
    setMessage('')
    setErreur('')
    setProduitASupprimer(produit)
  }

  async function confirmerSuppressionProduit() {
    if (!produitASupprimer) return

    const produit = produitASupprimer
    const nom = produit.nom || 'ce produit'

    setSuppressionId(produit.id)
    setMessage('')
    setErreur('')

    const resultat = await supprimerProduit(produit.id)

    if (!resultat.success) {
      setErreur(
        resultat.error ||
          `Impossible de supprimer ${nom}.`,
      )
    } else {
      setProduits((actuels) =>
        actuels.filter((item) => item.id !== produit.id),
      )
      setMessage(`« ${nom} » a été supprimé.`)
    }

    setSuppressionId(null)
    setProduitASupprimer(null)
  }

  const produitsFiltres = produits.filter((produit) => {
    const terme = recherche.trim().toLowerCase()

    return (
      !terme ||
      String(produit.nom || '')
        .toLowerCase()
        .includes(terme)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[#163B70]">
            Catalogue
          </p>

          <h1 className="mt-1 text-2xl font-black text-[#0B1E3D] sm:text-3xl">
            Produits
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Gérez vos produits, leurs détails, leur stock et leur disponibilité.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={chargerProduits}
            disabled={chargement}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#0B1E3D] transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={chargement ? 'animate-spin' : ''}
            />
            Actualiser
          </button>

          <button
            type="button"
            onClick={ouvrirAjout}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0369A1]"
          >
            <Plus size={17} />
            Ajouter un produit
          </button>
        </div>
      </div>

      {ajoutOuvert && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[#0284C7]">
                {produitModificationId
                  ? 'Modification du produit'
                  : 'Nouveau produit'}
              </p>

              <h2 className="mt-1 text-xl font-black text-[#0B1E3D]">
                {produitModificationId
                  ? 'Modifier le produit'
                  : 'Ajouter un article au catalogue'}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {produitModificationId
                  ? 'Modifiez les informations et les photos de ce produit.'
                  : 'Tous les détails seront enregistrés avec le produit.'}
              </p>
            </div>

            <button
              type="button"
              onClick={fermerAjout}
              disabled={creationEnCours}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Nom / titre *
                  </span>
                  <input
                    value={formulaire.nom}
                    onChange={(e) => {
                            const titre = e.target.value
                            const detection = detecterCategorieDepuisTitre(titre)

                            setFormulaire((actuel) => ({
                              ...actuel,
                              nom: titre,
                              ...(detection
                                ? {
                                    categorie: detection.categorie,
                                    sousCategorie: detection.sousCategorie,
                                    genre: detection.genre,
                                  }
                                : {}),
                            }))

                            setErreur('')
                            setMessage('')
                          }}
                    placeholder="Ex. Sac en main pour femme"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#163B70] focus:ring-4 focus:ring-[#163B70]/10"
                  />
                </label>

                <label className="sm:col-span-2">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Description *
                    </span>

                    <button
                      type="button"
                      onClick={genererDescription}
                      disabled={generationDescriptionEnCours || creationEnCours}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#163B70]/20 bg-[#163B70]/5 px-3 py-2 text-xs font-bold text-[#163B70] transition hover:bg-[#163B70]/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {generationDescriptionEnCours
                        ? '⏳ Génération...'
                        : '✨ Générer la description'}
                    </button>
                  </div>

                  <textarea
                    value={formulaire.description}
                    onChange={(e) =>
                      modifierFormulaire(
                        'description',
                        e.target.value,
                      )
                    }
                    rows={5}
                    placeholder="Décrivez précisément le produit : matière, dimensions, caractéristiques, contenu, utilisation..."
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-800 outline-none focus:border-[#163B70] focus:ring-4 focus:ring-[#163B70]/10"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Prix de vente *
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formulaire.prix}
                    onChange={(e) =>
                      modifierFormulaire('prix', e.target.value)
                    }
                    placeholder="Ex. 45000"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#163B70]"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Prix original
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formulaire.prixOriginal}
                    onChange={(e) =>
                      modifierFormulaire(
                        'prixOriginal',
                        e.target.value,
                      )
                    }
                    placeholder="Ex. 50000"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#163B70]"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Catégorie
                  </span>
                  <input
                    value={formulaire.categorie}
                    onChange={(e) =>
                      modifierFormulaire(
                        'categorie',
                        e.target.value,
                      )
                    }
                    placeholder="Ex. cuisine"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#163B70]"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Sous-catégorie
                  </span>
                  <input
                    value={formulaire.sousCategorie}
                    onChange={(e) =>
                      modifierFormulaire(
                        'sousCategorie',
                        e.target.value,
                      )
                    }
                    placeholder="Ex. electromenager"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#163B70]"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Genre
                  </span>
                  <input
                    value={formulaire.genre}
                    onChange={(e) =>
                      modifierFormulaire('genre', e.target.value)
                    }
                    placeholder="Ex. femme"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#163B70]"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Disponibilité *
                  </span>
                  <select
                    value={formulaire.disponibilite}
                    onChange={(e) =>
                      modifierFormulaire(
                        'disponibilite',
                        e.target.value as Statut,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#163B70]"
                  >
                    <option value="stock">En stock</option>
                    <option value="sur_commande">
                      Sur commande
                    </option>
                  </select>
                </label>

                {formulaire.disponibilite === 'stock' && (
                  <label>
                    <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                      Stock
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formulaire.stock}
                      onChange={(e) =>
                        modifierFormulaire(
                          'stock',
                          e.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#163B70]"
                    />
                  </label>
                )}

                {formulaire.disponibilite === 'sur_commande' && (
                  <>
                    <label>
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                        Poids (kg)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={formulaire.poidsKg}
                        onChange={(e) =>
                          modifierFormulaire(
                            'poidsKg',
                            e.target.value,
                          )
                        }
                        placeholder="Ex. 2.5"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#163B70]"
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                        Volume (CBM)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={formulaire.volumeCbm}
                        onChange={(e) =>
                          modifierFormulaire(
                            'volumeCbm',
                            e.target.value,
                          )
                        }
                        placeholder="Ex. 0.018"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#163B70]"
                      />
                    </label>
                  </>
                )}

                <label>
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Promotion (%)
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formulaire.promo}
                    onChange={(e) =>
                      modifierFormulaire('promo', e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#163B70]"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Fin de promotion
                  </span>
                  <input
                    type="date"
                    value={formulaire.promoFin}
                    onChange={(e) =>
                      modifierFormulaire(
                        'promoFin',
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#163B70]"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Date d'ajout
                  </span>
                  <input
                    type="date"
                    value={formulaire.dateAjout}
                    onChange={(e) =>
                      modifierFormulaire(
                        'dateAjout',
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#163B70]"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Référence produit source
                  </span>
                  <input
                    value={formulaire.produitSourceId}
                    onChange={(e) =>
                      modifierFormulaire(
                        'produitSourceId',
                        e.target.value,
                      )
                    }
                    placeholder="Optionnel : référence 1688 / fournisseur / source"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#163B70]"
                  />
                </label>

                <label className="sm:col-span-2 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={formulaire.nouveau}
                    onChange={(e) =>
                      modifierFormulaire(
                        'nouveau',
                        e.target.checked,
                      )
                    }
                    className="h-5 w-5 rounded border-slate-300"
                  />
                  <span>
                    <span className="block text-sm font-bold text-slate-800">
                      Marquer comme nouveau produit
                    </span>
                    <span className="block text-xs text-slate-500">
                      Le produit pourra être identifié comme nouveauté.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Photo du produit
                </p>

                <div className="min-h-56 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {photosApercus.length > 0 ? (
                    <div className="grid w-full grid-cols-2 gap-3 p-3 sm:grid-cols-3">
                      {photosApercus.map((src, index) => {
                        const photoExistante = photosProduit[index]

                        return (
                          <div
                            key={`${src}-${index}`}
                            className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                          >
                            <img
                              src={src}
                              alt={`Aperçu du produit ${index + 1}`}
                              className="h-full w-full object-contain"
                            />

                            {photoExistante?.principale && (
                              <span className="absolute left-2 top-2 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                                Principale
                              </span>
                            )}

                            {photoExistante && (
                              <div className="absolute inset-x-2 bottom-2 flex gap-2">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={async () => {
                                    if (index === 0) return

                                    const nouvelOrdre = photosProduit.map(
                                      (photo) => photo.id,
                                    )

                                    ;[
                                      nouvelOrdre[index - 1],
                                      nouvelOrdre[index],
                                    ] = [
                                      nouvelOrdre[index],
                                      nouvelOrdre[index - 1],
                                    ]

                                    const resultat =
                                      await reordonnerPhotosProduitAdmin(
                                        photoExistante.produit_id,
                                        nouvelOrdre,
                                      )

                                    if (!resultat.success) {
                                      setErreur(
                                        resultat.error ||
                                          'Impossible de déplacer la photo.',
                                      )
                                      return
                                    }

                                    const recharge =
                                      await recupererPhotosProduit(
                                        photoExistante.produit_id,
                                      )

                                    if (recharge.success) {
                                      setPhotosProduit(recharge.data)
                                      setPhotosApercus(
                                        recharge.data.map(
                                          (photo) => photo.url,
                                        ),
                                      )
                                    }

                                    setMessage('Photo déplacée.')
                                    setErreur('')
                                  }}
                                  className="rounded-lg bg-white/95 px-3 py-2 text-[10px] font-black text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label="Déplacer la photo vers la gauche"
                                >
                                  <ArrowLeft size={14} />
                                </button>

                                <button
                                  type="button"
                                  disabled={index === photosProduit.length - 1}
                                  onClick={async () => {
                                    if (index === photosProduit.length - 1) return

                                    const nouvelOrdre = photosProduit.map(
                                      (photo) => photo.id,
                                    )

                                    ;[
                                      nouvelOrdre[index],
                                      nouvelOrdre[index + 1],
                                    ] = [
                                      nouvelOrdre[index + 1],
                                      nouvelOrdre[index],
                                    ]

                                    const resultat =
                                      await reordonnerPhotosProduitAdmin(
                                        photoExistante.produit_id,
                                        nouvelOrdre,
                                      )

                                    if (!resultat.success) {
                                      setErreur(
                                        resultat.error ||
                                          'Impossible de déplacer la photo.',
                                      )
                                      return
                                    }

                                    const recharge =
                                      await recupererPhotosProduit(
                                        photoExistante.produit_id,
                                      )

                                    if (recharge.success) {
                                      setPhotosProduit(recharge.data)
                                      setPhotosApercus(
                                        recharge.data.map(
                                          (photo) => photo.url,
                                        ),
                                      )
                                    }

                                    setMessage('Photo déplacée.')
                                    setErreur('')
                                  }}
                                  className="rounded-lg bg-white/95 px-3 py-2 text-[10px] font-black text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label="Déplacer la photo vers la droite"
                                >
                                  <ArrowRight size={14} />
                                </button>

                                {!photoExistante.principale && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const resultat =
                                        await definirPhotoPrincipaleAdmin(
                                          photoExistante.produit_id,
                                          photoExistante.id,
                                        )

                                      if (!resultat.success) {
                                        setErreur(
                                          resultat.error ||
                                            'Impossible de définir la photo principale.',
                                        )
                                        return
                                      }

                                      const recharge =
                                        await recupererPhotosProduit(
                                          photoExistante.produit_id,
                                        )

                                      if (recharge.success) {
                                        setPhotosProduit(recharge.data)
                                        setPhotosApercus(
                                          recharge.data.map(
                                            (photo) => photo.url,
                                          ),
                                        )
                                      }

                                      setMessage(
                                        'Photo principale mise à jour.',
                                      )
                                      setErreur('')
                                    }}
                                    className="flex-1 rounded-lg bg-white/95 px-2 py-2 text-[10px] font-black text-slate-700 shadow-sm"
                                  >
                                    Principale
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={async () => {
                                    const resultat =
                                      await supprimerPhotoProduitAdmin(
                                        photoExistante.produit_id,
                                        photoExistante.id,
                                      )

                                    if (!resultat.success) {
                                      setErreur(
                                        resultat.error ||
                                          'Impossible de supprimer la photo.',
                                      )
                                      return
                                    }

                                    if (resultat.data?.chemin_storage) {
                                      const suppressionStorage =
                                        await supprimerPhotoProduit(
                                          resultat.data.chemin_storage,
                                        )

                                      if (!suppressionStorage.success) {
                                        setErreur(
                                          `Photo supprimée de la base, mais impossible de supprimer le fichier Storage : ${
                                            suppressionStorage.error ||
                                            'erreur inconnue'
                                          }`,
                                        )
                                      }
                                    }

                                    const recharge =
                                      await recupererPhotosProduit(
                                        photoExistante.produit_id,
                                      )

                                    if (recharge.success) {
                                      setPhotosProduit(recharge.data)
                                      setPhotosApercus(
                                        recharge.data.map(
                                          (photo) => photo.url,
                                        ),
                                      )
                                    }

                                    setMessage('Photo supprimée.')
                                    setErreur('')
                                  }}
                                  className="rounded-lg bg-red-600 px-3 py-2 text-[10px] font-black text-white shadow-sm"
                                >
                                  Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImagePlus
                        size={36}
                        className="mx-auto text-slate-300"
                      />
                      <p className="mt-3 text-sm font-bold text-slate-600">
                        Choisir une ou plusieurs photos
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        JPG, PNG ou WEBP · 5 Mo maximum par photo
                      </p>
                    </div>
                  )}

                  <input
                    id="photos-produit-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={choisirPhoto}
                    className="hidden"
                  />
                </div>

                <label
                  htmlFor="photos-produit-input"
                  className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <ImagePlus size={16} className="mr-2" />
                  Ajouter des photos
                </label>

                <div className="mt-4">
                  <label>
                    <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                      URL image
                    </span>
                    <input
                      value={formulaire.image}
                      onChange={(e) =>
                        modifierFormulaire(
                          'image',
                          e.target.value,
                        )
                      }
                      placeholder="Ou collez une URL d'image"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#163B70]"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {produitModificationId && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#163B70]">
                  Variantes / couleurs
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Gérez les couleurs ou autres variantes et leur stock individuel.
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px_auto]">
                <select
                  value={varianteNom}
                  onChange={(e) => setVarianteNom(e.target.value)}
                  disabled={varianteChargement}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#163B70] focus:ring-4 focus:ring-[#163B70]/10 disabled:opacity-60"
                >
                  <option value="">Sélectionner une couleur</option>
                  {COULEURS_PRODUIT.filter(
                    (couleur) =>
                      !variantesProduit.some(
                        (variante) =>
                          variante.nom.trim().toLowerCase() ===
                          couleur.toLowerCase(),
                      ),
                  ).map((couleur) => (
                    <option key={couleur} value={couleur}>
                      {couleur}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={varianteStock}
                  onChange={(e) => setVarianteStock(e.target.value)}
                  disabled={varianteChargement}
                  placeholder="Stock"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#163B70] focus:ring-4 focus:ring-[#163B70]/10 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => void ajouterVariante()}
                  disabled={
                    varianteChargement ||
                    !varianteNom.trim()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#163B70] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0B1E3D] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {varianteChargement ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                      Ajout...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Ajouter
                    </>
                  )}
                </button>
              </div>

              {variantesProduit.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center">
                  <p className="text-sm font-bold text-slate-600">
                    Aucune variante pour ce produit.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Ajoutez par exemple Rouge, Noir, Bleu...
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {variantesProduit.map((variante, index) => (
                    <div
                      key={variante.id}
                      className="rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto] sm:items-end">
                        <label>
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">
                            Nom
                          </span>
                          <select
                            value={variante.nom}
                            onChange={(e) =>
                              setVariantesProduit((actuelles) =>
                                actuelles.map((item) =>
                                  item.id === variante.id
                                    ? {
                                        ...item,
                                        nom: e.target.value,
                                      }
                                    : item,
                                ),
                              )
                            }
                            disabled={
                              varianteSauvegardeId ===
                              variante.id
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#163B70]"
                          >
                            {COULEURS_PRODUIT
                              .filter(
                                (couleur) =>
                                  couleur.toLowerCase() ===
                                    variante.nom.trim().toLowerCase() ||
                                  !variantesProduit.some(
                                    (autre) =>
                                      autre.id !== variante.id &&
                                      autre.nom.trim().toLowerCase() ===
                                        couleur.toLowerCase(),
                                  ),
                              )
                              .map((couleur) => (
                                <option key={couleur} value={couleur}>
                                  {couleur}
                                </option>
                              ))}
                          </select>
                        </label>

                        <label>
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">
                            Stock
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={variante.stock}
                            onChange={(e) =>
                              setVariantesProduit((actuelles) =>
                                actuelles.map((item) =>
                                  item.id === variante.id
                                    ? {
                                        ...item,
                                        stock: Math.max(
                                          0,
                                          Math.floor(
                                            Number(
                                              e.target.value,
                                            ) || 0,
                                          ),
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                            disabled={
                              varianteSauvegardeId ===
                              variante.id
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#163B70]"
                          />
                        </label>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void deplacerVariante(
                                index,
                                -1,
                              )
                            }
                            disabled={
                              index === 0 ||
                              varianteSauvegardeId !== null
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-600 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Monter la variante"
                          >
                            <ArrowLeft size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void deplacerVariante(
                                index,
                                1,
                              )
                            }
                            disabled={
                              index ===
                                variantesProduit.length - 1 ||
                              varianteSauvegardeId !== null
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-600 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Descendre la variante"
                          >
                            <ArrowRight size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void sauvegarderVariante(
                                variante,
                              )
                            }
                            disabled={
                              varianteSauvegardeId !== null
                            }
                            className="rounded-lg bg-[#0284C7] px-3 py-2.5 text-xs font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Enregistrer ${variante.nom}`}
                          >
                            {varianteSauvegardeId ===
                            variante.id ? (
                              <RefreshCw
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Save size={15} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void supprimerVarianteAdmin(
                                variante,
                              )
                            }
                            disabled={
                              varianteSauvegardeId !== null
                            }
                            className="rounded-lg bg-red-600 px-3 py-2.5 text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Supprimer ${variante.nom}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {erreur && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {erreur}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={fermerAjout}
              disabled={creationEnCours}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={() => {
                if (produitModificationId) {
                  void modifierProduitDepuisFormulaire()
                  return
                }

                void creerProduit()
              }}
              disabled={creationEnCours}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-6 py-3 text-sm font-bold text-white hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creationEnCours ? (
                <>
                  <RefreshCw
                    size={17}
                    className="animate-spin"
                  />
                  Création en cours...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Créer le produit
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Produits</p>
          <p className="mt-1 text-2xl font-black text-[#0B1E3D]">
            {produits.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">En stock</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">
            {
              produits.filter(
                (p) => Number(p.stock || 0) > 0,
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">À traiter</p>
          <p className="mt-1 text-2xl font-black text-[#163B70]">
            {
              produits.filter(
                (p) => p.disponibilite === 'sur_commande',
              ).length
            }
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={recherche}
            onChange={(event) =>
              setRecherche(event.target.value)
            }
            placeholder="Rechercher un produit..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#163B70] focus:bg-white"
          />
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <Check size={17} />
          {message}
        </div>
      )}

      {erreur && !ajoutOuvert && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {erreur}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        {chargement ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm font-semibold text-slate-500">
            <RefreshCw size={18} className="animate-spin" />
            Chargement des produits...
          </div>
        ) : produitsFiltres.length === 0 ? (
          <div className="p-12 text-center">
            <Package
              size={32}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-bold text-[#0B1E3D]">
              Aucun produit trouvé
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {produitsFiltres.map((produit) => {
              const statut =
                produit.disponibilite === 'sur_commande'
                  ? 'sur_commande'
                  : 'stock'

              const stock = Number(produit.stock || 0)

              return (
                <div
                  key={produit.id}
                  className="p-4 sm:p-5"
                >
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h2 className="text-lg font-extrabold text-[#0B1E3D]">
                            {produit.nom ||
                              'Produit sans nom'}
                          </h2>

                          <p className="mt-1 text-sm font-bold text-[#0B1E3D]">
                            {formaterPrix(
                              Number(produit.prix || 0),
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => ouvrirModification(produit)}
                            disabled={suppressionId === produit.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-[#0B1E3D] transition hover:border-[#0284C7] hover:text-[#0284C7] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Modifier
                          </button>

                          <button
                            type="button"
                            onClick={() => supprimerProduitAdmin(produit)}
                            disabled={suppressionId === produit.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {suppressionId === produit.id ? (
                              <RefreshCw
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={15} />
                            )}
                            {suppressionId === produit.id
                              ? 'Suppression...'
                              : 'Supprimer'}
                          </button>
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-extrabold ${
                            statut === 'sur_commande'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {libelleStatut(statut)}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {produit.description && (
                          <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2 lg:col-span-4">
                            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                              Description
                            </p>

                            <p className="mt-1 text-sm leading-6 text-slate-700">
                              {produit.description}
                            </p>
                          </div>
                        )}

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                            Catégorie
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-700">
                            {produit.categorie ||
                              'Non définie'}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                            Sous-catégorie
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-700">
                            {produit.sous_categorie ||
                              'Non définie'}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                            Genre
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-700">
                            {produit.genre ||
                              'Non défini'}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                            Promotion
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-700">
                            {Number(produit.promo || 0) > 0
                              ? `${Number(
                                  produit.promo,
                                ).toLocaleString(
                                  'fr-FR',
                                )} %`
                              : 'Aucune'}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
                          {statut === 'stock' && (
                            <label className="block">
                              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                Stock
                              </span>

                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={stock}
                                onChange={(event) =>
                                  modifierLocal(
                                    produit.id,
                                    'stock',
                                    Math.max(
                                      0,
                                      Math.floor(
                                        Number(
                                          event.target.value,
                                        ) || 0,
                                      ),
                                    ),
                                  )
                                }
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#163B70] sm:w-28"
                              />
                            </label>
                          )}

                          <label className="block">
                            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                              Disponibilité
                            </span>

                            <select
                              value={statut}
                              onChange={(event) =>
                                modifierLocal(
                                  produit.id,
                                  'disponibilite',
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#163B70] sm:w-44"
                            >
                              <option value="stock">
                                En stock
                              </option>

                              <option value="sur_commande">
                                Sur commande
                              </option>
                            </select>
                          </label>

                          {statut === 'sur_commande' && (
                            <>
                              <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Poids (kg)
                                </span>

                                <input
                                  type="number"
                                  min="0"
                                  step="0.001"
                                  value={
                                    produit.poids_kg ?? ''
                                  }
                                  onChange={(event) =>
                                    modifierLocal(
                                      produit.id,
                                      'poids_kg',
                                      event.target.value === ''
                                        ? ''
                                        : Math.max(
                                            0,
                                            Number(
                                              event.target.value,
                                            ) || 0,
                                          ),
                                    )
                                  }
                                  placeholder="Ex. 2.5"
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#163B70] sm:w-32"
                                />
                              </label>

                              <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Volume (CBM)
                                </span>

                                <input
                                  type="number"
                                  min="0"
                                  step="0.0001"
                                  value={
                                    produit.volume_cbm ?? ''
                                  }
                                  onChange={(event) =>
                                    modifierLocal(
                                      produit.id,
                                      'volume_cbm',
                                      event.target.value === ''
                                        ? ''
                                        : Math.max(
                                            0,
                                            Number(
                                              event.target.value,
                                            ) || 0,
                                          ),
                                    )
                                  }
                                  placeholder="Ex. 0.018"
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#163B70] sm:w-32"
                                />
                              </label>
                            </>
                          )}

                          <label className="block">
                            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                              Promotion (%)
                            </span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={Number(produit.promo || 0)}
                              onChange={(event) =>
                                modifierLocal(
                                  produit.id,
                                  'promo',
                                  Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      Number(event.target.value) || 0,
                                    ),
                                  ),
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#163B70] sm:w-28"
                            />
                          </label>

                          <label className="block">
                            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                              Fin promotion
                            </span>
                            <input
                              type="date"
                              value={produit.promo_fin || ''}
                              onChange={(event) =>
                                modifierLocal(
                                  produit.id,
                                  'promo_fin',
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-[#163B70]"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              sauvegarder(produit)
                            }
                            disabled={
                              sauvegardeId === produit.id
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {sauvegardeId === produit.id ? (
                              <RefreshCw
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Save size={16} />
                            )}

                            {sauvegardeId === produit.id
                              ? 'Enregistrement...'
                              : 'Enregistrer'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {produitASupprimer && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="suppression-produit-titre"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && suppressionId !== produitASupprimer.id) {
              setProduitASupprimer(null)
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="p-6 sm:p-7">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <Trash2 size={26} />
              </div>

              <div className="mt-5 text-center">
                <h2
                  id="suppression-produit-titre"
                  className="text-xl font-black text-[#0B1E3D]"
                >
                  Supprimer l’article ?
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Voulez-vous vraiment supprimer définitivement
                  {' '}
                  <span className="font-extrabold text-[#0B1E3D]">
                    « {produitASupprimer.nom || 'ce produit'} »
                  </span>
                  {' '}?
                </p>

                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-left">
                  <p className="text-xs font-bold leading-5 text-red-700">
                    Cette action est définitive. Le produit sera retiré de la
                    liste des articles.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setProduitASupprimer(null)}
                disabled={suppressionId === produitASupprimer.id}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-[#0B1E3D] transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={confirmerSuppressionProduit}
                disabled={suppressionId === produitASupprimer.id}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {suppressionId === produitASupprimer.id ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Supprimer définitivement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
