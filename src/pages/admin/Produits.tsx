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

const TAILLES_VETEMENTS = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
  '4XL',
  '5XL',
] as const

const POINTURES_CHAUSSURES = [
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '47',
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
  longueur_cm?: number | null
  largeur_cm?: number | null
  hauteur_cm?: number | null
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
  promo_debut?: string | null
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
  longueurCm: string
  largeurCm: string
  hauteurCm: string
  promo: string
  nouveau: boolean
  dateAjout: string
  promoDebut: string
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
  longueurCm: '',
  largeurCm: '',
  hauteurCm: '',
  promo: '0',
  nouveau: false,
  dateAjout: new Date().toISOString().slice(0, 10),
  promoDebut: '',
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
    t.includes('nuisette') ||
    t.includes('ensemble') ||
    t.includes('robe') ||
    t.includes('jupe') ||
    t.includes('pantalon') ||
    t.includes('chemise') ||
    t.includes('tshirt') ||
    t.includes('t-shirt') ||
    t.includes('vetement') ||
    t.includes('vetements')
  ) {
    const femme = /\bfemme\b|\bdame\b/.test(t) || t.includes('nuisette')
    const homme = /\bhomme\b|\bmonsieur\b/.test(t)

    return {
      categorie: 'vetements',
      sousCategorie: t.includes('nuisette')
        ? 'nuisette'
        : t.includes('ensemble')
          ? 'ensemble'
          : '',
      genre: femme ? 'femme' : homme ? 'homme' : '',
    }
  }

  return null
}

type VarianteCreationProduit = {
  id: string
  nom: string
  stock: number
  couleur: string
  taille: string
  pointure: string
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
  const [varianteCouleur, setVarianteCouleur] = useState('')
  const [varianteTaille, setVarianteTaille] = useState('')
  const [variantePointure, setVariantePointure] = useState('')
  const [varianteChargement, setVarianteChargement] = useState(false)
  const [varianteSauvegardeId, setVarianteSauvegardeId] = useState<string | null>(null)
  const [variantesCreation, setVariantesCreation] = useState<
    VarianteCreationProduit[]
  >([])
  const [varianteCreationStock, setVarianteCreationStock] = useState('0')
  const [varianteCreationCouleur, setVarianteCreationCouleur] = useState('')
  const [varianteCreationTaille, setVarianteCreationTaille] = useState('')
  const [varianteCreationPointure, setVarianteCreationPointure] = useState('')

  // Nouveau configurateur professionnel de variantes.
  // Les combinaisons générées restent compatibles avec ajouterVarianteProduit().
  const [attributsVariantes, setAttributsVariantes] = useState<{
    couleurs: string[]
    tailles: string[]
    pointures: string[]
  }>({
    couleurs: [],
    tailles: [],
    pointures: [],
  })

  const [combinaisonsVariantes, setCombinaisonsVariantes] = useState<
    VarianteCreationProduit[]
  >([])

  const [variantesConfigActive, setVariantesConfigActive] = useState(true)

  function basculerAttributVariante(
    attribut: 'couleurs' | 'tailles' | 'pointures',
    valeur: string,
  ) {
    setAttributsVariantes((precedent) => {
      const valeurs = precedent[attribut]
      const dejaSelectionnee = valeurs.includes(valeur)

      return {
        ...precedent,
        [attribut]: dejaSelectionnee
          ? valeurs.filter((item) => item !== valeur)
          : [...valeurs, valeur],
      }
    })
  }

  function genererCombinaisonsVariantes() {
    const couleurs = attributsVariantes.couleurs
    const tailles =
      formulaire.categorie === 'vetements'
        ? attributsVariantes.tailles
        : ['']

    const pointures =
      formulaire.categorie === 'chaussures'
        ? attributsVariantes.pointures
        : ['']

    if (couleurs.length === 0) {
      setErreur('Ajoutez au moins une couleur.')
      return
    }

    if (formulaire.categorie === 'vetements' && tailles.length === 0) {
      setErreur('Ajoutez au moins une taille.')
      return
    }

    if (formulaire.categorie === 'chaussures' && pointures.length === 0) {
      setErreur('Ajoutez au moins une pointure.')
      return
    }

    const combinaisons: VarianteCreationProduit[] = []

    for (const couleur of couleurs) {
      for (const taille of tailles) {
        for (const pointure of pointures) {
          const nom =
            formulaire.categorie === 'vetements'
              ? `${couleur} / ${taille}`
              : formulaire.categorie === 'chaussures'
                ? `${couleur} / ${pointure}`
                : couleur

          combinaisons.push({
            id: `combinaison-${Date.now()}-${combinaisons.length}`,
            nom,
            stock: 0,
            couleur,
            taille,
            pointure,
          })
        }
      }
    }

    setCombinaisonsVariantes(combinaisons)
    setVariantesCreation(combinaisons)
    setErreur('')
    setMessage('')
  }

  function modifierStockCombinaison(id: string, stock: number) {
    const nouveauStock = Math.max(0, Math.floor(stock) || 0)

    setCombinaisonsVariantes((actuelles) =>
      actuelles.map((variante) =>
        variante.id === id
          ? { ...variante, stock: nouveauStock }
          : variante,
      ),
    )

    setVariantesCreation((actuelles) =>
      actuelles.map((variante) =>
        variante.id === id
          ? { ...variante, stock: nouveauStock }
          : variante,
      ),
    )
  }

  function supprimerCombinaisonVariante(id: string) {
    setCombinaisonsVariantes((actuelles) =>
      actuelles.filter((variante) => variante.id !== id),
    )

    setVariantesCreation((actuelles) =>
      actuelles.filter((variante) => variante.id !== id),
    )
  }

  function synchroniserVariantesCreation() {
    setVariantesCreation(combinaisonsVariantes)
  }


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

    if (champ === 'categorie') {
      setCombinaisonsVariantes([])
      setVariantesCreation([])
      setAttributsVariantes((actuels) => ({
        ...actuels,
        tailles: [],
        pointures: [],
      }))
    }

    setErreur('')
    setMessage('')
  }

  async function ajouterVariante() {
    if (!produitModificationId) return

    const couleur = varianteCouleur.trim()
    const taille =
      formulaire.categorie === 'vetements'
        ? varianteTaille.trim()
        : ''
    const pointure =
      formulaire.categorie === 'chaussures'
        ? variantePointure.trim()
        : ''
    const nomSimple = varianteNom.trim()

    const nom =
      formulaire.categorie === 'vetements'
        ? `${couleur} / ${taille}`.trim()
        : formulaire.categorie === 'chaussures'
          ? `${couleur} / ${pointure}`.trim()
          : nomSimple || couleur

    const stock = Math.max(
      0,
      Math.floor(Number(varianteStock) || 0),
    )

    if (!couleur) {
      setErreur('La couleur est obligatoire.')
      return
    }

    if (formulaire.categorie === 'vetements' && !taille) {
      setErreur('La taille est obligatoire pour un vêtement.')
      return
    }

    if (formulaire.categorie === 'chaussures' && !pointure) {
      setErreur('La pointure est obligatoire pour une chaussure.')
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
        undefined,
        couleur,
        taille || null,
        pointure || null,
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
      setVarianteCouleur('')
      setVarianteTaille('')
      setVariantePointure('')
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
        variante.couleur ?? null,
        variante.taille ?? null,
        variante.pointure ?? null,
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
      nouvelOrdre[index]!,
      nouvelOrdre[cible]!,
    ] = [
      nouvelOrdre[cible]!,
      nouvelOrdre[index]!,
    ]

    setVarianteSauvegardeId(variantesProduit[index]!.id)
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
      promoDebut: produit.promo_debut || '',
                                                 promoFin: produit.promo_fin || '',
      dateAjout: produit.created_at
        ? String(produit.created_at).slice(0, 10)
        : '',
      produitSourceId: produit.produit_source_id || '',
      nouveau: Boolean(produit.nouveau),
      image: produit.image_url || '',
      poidsKg: String(produit.poids_kg ?? ''),
      volumeCbm: String(produit.volume_cbm ?? ''),
      longueurCm: String(produit.longueur_cm ?? ''),
      largeurCm: String(produit.largeur_cm ?? ''),
      hauteurCm: String(produit.hauteur_cm ?? ''),
    })

    setPhotosFichiers([])
    setPhotosProduit([])
    setVariantesProduit([])
    setVarianteNom('')
    setVarianteStock('0')
    setVarianteCouleur('')
    setVarianteTaille('')
    setVariantePointure('')
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
        if (typeof lecteur.result !== 'string') {
          reject(new Error('Impossible de lire la photo sélectionnée.'))
          return
        }

        const image = new Image()

        image.onload = () => {
          const tailleMax = 1280
          const ratio = Math.min(
            1,
            tailleMax / Math.max(image.naturalWidth, image.naturalHeight),
          )

          const largeur = Math.max(1, Math.round(image.naturalWidth * ratio))
          const hauteur = Math.max(1, Math.round(image.naturalHeight * ratio))

          const canvas = document.createElement('canvas')
          canvas.width = largeur
          canvas.height = hauteur

          const contexte = canvas.getContext('2d')

          if (!contexte) {
            reject(new Error('Impossible de préparer la photo sélectionnée.'))
            return
          }

          contexte.drawImage(image, 0, 0, largeur, hauteur)

          const dataUrl = canvas.toDataURL('image/jpeg', 0.82)

          if (!dataUrl || dataUrl.length < 100) {
            reject(new Error('Impossible de préparer la photo sélectionnée.'))
            return
          }

          resolve(dataUrl)
        }

        image.onerror = () => {
          reject(new Error('Impossible de charger la photo sélectionnée.'))
        }

        image.src = lecteur.result
      }

      lecteur.onerror = () => {
        reject(new Error('Impossible de lire la photo sélectionnée.'))
      }

      lecteur.readAsDataURL(fichier)
    })
  }

  function ajouterVarianteCreation() {
    const couleur = varianteCreationCouleur.trim()
    const taille =
      formulaire.categorie === 'vetements'
        ? varianteCreationTaille.trim()
        : ''
    const pointure =
      formulaire.categorie === 'chaussures'
        ? varianteCreationPointure.trim()
        : ''
    const stock = Math.max(
      0,
      Math.floor(Number(varianteCreationStock) || 0),
    )

    if (!couleur) {
      setErreur('La couleur est obligatoire pour la variante.')
      return
    }

    if (formulaire.categorie === 'vetements' && !taille) {
      setErreur('La taille est obligatoire pour cette variante.')
      return
    }

    if (formulaire.categorie === 'chaussures' && !pointure) {
      setErreur('La pointure est obligatoire pour cette variante.')
      return
    }

    const nom =
      formulaire.categorie === 'vetements'
        ? `${couleur} / ${taille}`
        : formulaire.categorie === 'chaussures'
          ? `${couleur} / ${pointure}`
          : couleur

    setVariantesCreation((actuelles) => [
      ...actuelles,
      {
        id: `${Date.now()}-${actuelles.length}`,
        nom,
        stock,
        couleur,
        taille,
        pointure,
      },
    ])

    setVarianteCreationCouleur('')
    setVarianteCreationTaille('')
    setVarianteCreationPointure('')
    setVarianteCreationStock('0')
    setErreur('')
    setMessage('')
  }

  function supprimerVarianteCreation(id: string) {
    setVariantesCreation((actuelles) =>
      actuelles.filter((variante) => variante.id !== id),
    )
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

      const titreGenere = data.titre?.trim() || nom
      const detection = detecterCategorieDepuisTitre(titreGenere)

      setFormulaire((precedent) => ({
        ...precedent,
        nom: titreGenere,
        description: data.description.trim(),
        ...(detection
          ? {
              categorie: detection.categorie,
              sousCategorie: detection.sousCategorie,
              genre: detection.genre,
            }
          : {}),
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
        longueurCm: formulaire.longueurCm,
        largeurCm: formulaire.largeurCm,
        hauteurCm: formulaire.hauteurCm,
        promo,
        nouveau: formulaire.nouveau,
        dateAjout: formulaire.dateAjout || null,
        promoDebut: formulaire.promoDebut || null,
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

      for (const variante of variantesCreation) {
        const resultatVariante = await ajouterVarianteProduit(
          produitId,
          variante.nom,
          variante.stock,
          undefined,
          variante.couleur || null,
          variante.taille || null,
          variante.pointure || null,
        )

        if (!resultatVariante.success) {
          throw new Error(
            resultatVariante.error ||
              `Impossible d'enregistrer la variante « ${variante.nom} ».`,
          )
        }
      }

      if (photosFichiers.length > 0) {
        for (let index = 0; index < photosFichiers.length; index += 1) {
          const fichier = photosFichiers[index]
          if (!fichier && index !== 0) continue

          const upload =
            index === 0
              ? { success: true, url: imageUrl }
              : await televerserPhotoProduit(fichier!)

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
            'chemin' in upload ? upload.chemin : undefined,
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
      setVariantesCreation([])
      setVarianteCreationCouleur('')
      setVarianteCreationTaille('')
      setVarianteCreationPointure('')
      setVarianteCreationStock('0')

      await chargerProduits()
    } catch (err) {
      console.error('DEBUG CREATION PRODUIT ERROR:', err)
      console.error('DEBUG CREATION PRODUIT ERROR JSON:', JSON.stringify(err))
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
          if (!fichier) continue

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
      | 'longueur_cm'
      | 'largeur_cm'
      | 'hauteur_cm'
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
        <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_20px_60px_-30px_rgba(76,29,149,0.28)] sm:rounded-[2.25rem]">
          <div className="border-b border-slate-200/70 bg-gradient-to-br from-violet-50 via-white to-sky-50 px-5 py-6 sm:px-8 sm:py-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-violet-700 shadow-sm">
                  Gestion catalogue
                </div>

                <p className="text-sm font-bold text-violet-600">
                  {produitModificationId
                    ? 'Modification du produit'
                    : 'Nouveau produit'}
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {produitModificationId
                    ? 'Modifier le produit'
                    : 'Ajouter un article au catalogue'}
                </h2>

                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                  {produitModificationId
                    ? 'Modifiez les informations et les photos de ce produit.'
                    : 'Configurez les informations, le stock, les variantes, le transport et les photos depuis un seul espace.'}
                </p>
              </div>

              <button
                type="button"
                onClick={fermerAjout}
                disabled={creationEnCours}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50 sm:self-start"
                aria-label="Fermer"
              >
                <X size={19} />
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-8">

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
                    className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                      className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-xs font-black text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="w-full resize-y rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-medium leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                    className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                    className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                    className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                    className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                    className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                    className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                      className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                        className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                        Longueur (cm)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formulaire.longueurCm}
                        onChange={(e) =>
                          modifierFormulaire(
                            'longueurCm',
                            e.target.value,
                          )
                        }
                        placeholder="Ex. 30"
                        className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                        Largeur (cm)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formulaire.largeurCm}
                        onChange={(e) =>
                          modifierFormulaire(
                            'largeurCm',
                            e.target.value,
                          )
                        }
                        placeholder="Ex. 20"
                        className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                        Hauteur (cm)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formulaire.hauteurCm}
                        onChange={(e) =>
                          modifierFormulaire(
                            'hauteurCm',
                            e.target.value,
                          )
                        }
                        placeholder="Ex. 15"
                        className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                        Volume (CBM)
                      </span>
                      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                        {formulaire.longueurCm !== '' &&
                        formulaire.largeurCm !== '' &&
                        formulaire.hauteurCm !== ''
                          ? (
                              (Number(formulaire.longueurCm) *
                                Number(formulaire.largeurCm) *
                                Number(formulaire.hauteurCm)) /
                              1000000
                            ).toFixed(6)
                          : formulaire.volumeCbm !== ''
                            ? Number(formulaire.volumeCbm).toFixed(6)
                            : '—'}
                      </div>
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
                    className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Début de promotion
                  </span>
                  <input
                    type="datetime-local"
                    value={formulaire.promoDebut}
                    onChange={(e) =>
                      modifierFormulaire(
                        'promoDebut',
                        e.target.value,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                    Fin de promotion
                  </span>
                  <input
                    type="datetime-local"
                    value={formulaire.promoFin}
                    onChange={(e) =>
                      modifierFormulaire(
                        'promoFin',
                        e.target.value,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                    className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                    className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
              <div className="rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-sky-50/60 p-4 shadow-sm sm:p-5">
                <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-violet-700">
        Variantes du produit
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Configurez les combinaisons couleur, taille ou pointure avec un stock indépendant.
      </p>
    </div>

    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <input
        type="checkbox"
        checked={variantesConfigActive}
        onChange={(e) => {
          setVariantesConfigActive(e.target.checked)
          if (!e.target.checked) {
            setAttributsVariantes({
              couleurs: [],
              tailles: [],
              pointures: [],
            })
            setCombinaisonsVariantes([])
            setVariantesCreation([])
          }
          setErreur('')
          setMessage('')
        }}
        disabled={creationEnCours}
        className="h-4 w-4 accent-violet-600"
      />
      <span className="text-xs font-black text-slate-700">
        Produit avec variantes
      </span>
    </label>
  </div>

  {variantesConfigActive ? (
    <div className="mt-5 space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
            Couleurs
          </p>
          <span className="text-[10px] font-bold text-slate-400">
            {attributsVariantes.couleurs.length} sélectionnée(s)
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {COULEURS_PRODUIT.map((couleur) => {
            const active = attributsVariantes.couleurs.includes(couleur)

            return (
              <button
                key={couleur}
                type="button"
                onClick={() => basculerAttributVariante('couleurs', couleur)}
                disabled={creationEnCours}
                className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                  active
                    ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {couleur}
              </button>
            )
          })}
        </div>
      </div>

      {formulaire.categorie === 'vetements' && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
              Tailles
            </p>
            <span className="text-[10px] font-bold text-slate-400">
              {attributsVariantes.tailles.length} sélectionnée(s)
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {TAILLES_VETEMENTS.map((taille) => {
              const active = attributsVariantes.tailles.includes(taille)

              return (
                <button
                  key={taille}
                  type="button"
                  onClick={() => basculerAttributVariante('tailles', taille)}
                  disabled={creationEnCours}
                  className={`min-w-12 rounded-xl border px-3 py-2 text-xs font-black transition ${
                    active
                      ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {taille}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {formulaire.categorie === 'chaussures' && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
              Pointures
            </p>
            <span className="text-[10px] font-bold text-slate-400">
              {attributsVariantes.pointures.length} sélectionnée(s)
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {POINTURES_CHAUSSURES.map((pointure) => {
              const active = attributsVariantes.pointures.includes(pointure)

              return (
                <button
                  key={pointure}
                  type="button"
                  onClick={() => basculerAttributVariante('pointures', pointure)}
                  disabled={creationEnCours}
                  className={`min-w-12 rounded-xl border px-3 py-2 text-xs font-black transition ${
                    active
                      ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {pointure}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-800">
            Générer les combinaisons
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Chaque combinaison aura son propre stock.
          </p>
        </div>

        <button
          type="button"
          onClick={genererCombinaisonsVariantes}
          disabled={
            creationEnCours ||
            attributsVariantes.couleurs.length === 0 ||
            (formulaire.categorie === 'vetements' &&
              attributsVariantes.tailles.length === 0) ||
            (formulaire.categorie === 'chaussures' &&
              attributsVariantes.pointures.length === 0)
          }
          className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-black text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Générer les variantes
        </button>
      </div>

      {combinaisonsVariantes.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-700">
                Combinaisons générées
              </p>
              <p className="mt-1 text-[11px] font-semibold text-slate-400">
                {combinaisonsVariantes.length} variante(s)
              </p>
            </div>

            <p className="text-sm font-black text-violet-700">
              Stock total : {combinaisonsVariantes.reduce(
                (total, variante) => total + variante.stock,
                0,
              )}
            </p>
          </div>

          <div className="divide-y divide-slate-100 bg-white">
            {combinaisonsVariantes.map((variante, index) => (
              <div
                key={variante.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500">
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-800">
                      {variante.nom}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400">
                      {formulaire.categorie === 'vetements'
                        ? `Couleur : ${variante.couleur} · Taille : ${variante.taille}`
                        : formulaire.categorie === 'chaussures'
                          ? `Couleur : ${variante.couleur} · Pointure : ${variante.pointure}`
                          : `Couleur : ${variante.couleur}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:shrink-0">
                  <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                    Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={variante.stock}
                    onChange={(e) =>
                      modifierStockCombinaison(
                        variante.id,
                        Number(e.target.value),
                      )
                    }
                    disabled={creationEnCours}
                    className="w-24 rounded-2xl border border-slate-200/90 bg-slate-50/70 px-3 py-2.5 text-center text-sm font-black text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />

                  <button
                    type="button"
                    onClick={() => supprimerCombinaisonVariante(variante.id)}
                    disabled={creationEnCours}
                    className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-black text-red-600 shadow-sm transition hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
      <p className="text-sm font-black text-slate-700">
        Produit simple
      </p>
      <p className="mt-1 text-xs font-semibold text-slate-400">
        Le stock global du produit sera utilisé.
      </p>
    </div>
  )}
</div>

<p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                  Photo du produit
                </p>

                <div className="min-h-56 overflow-hidden rounded-[1.5rem] border border-violet-100 bg-gradient-to-br from-violet-50/60 via-white to-sky-50/40 shadow-sm">
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
                                      nouvelOrdre[index - 1]!,
                                      nouvelOrdre[index]!,
                                    ] = [
                                      nouvelOrdre[index]!,
                                      nouvelOrdre[index - 1]!,
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
                                      nouvelOrdre[index]!,
                                      nouvelOrdre[index + 1]!,
                                    ] = [
                                      nouvelOrdre[index + 1]!,
                                      nouvelOrdre[index]!,
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
                      className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-3.5 py-3 text-xs font-medium text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {produitModificationId && (
            <div className="mt-6 rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-violet-50/70 via-white to-sky-50/50 p-4 shadow-sm sm:p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-violet-700">
                  Variantes / couleurs
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Gérez les couleurs ou autres variantes et leur stock individuel.
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_140px_auto]">
                <select
                  value={varianteCouleur}
                  onChange={(e) => setVarianteCouleur(e.target.value)}
                  disabled={varianteChargement}
                  className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                >
                  <option value="">Sélectionner une couleur</option>
                  {COULEURS_PRODUIT.map((couleur) => (
                    <option key={couleur} value={couleur}>
                      {couleur}
                    </option>
                  ))}
                </select>

                {formulaire.categorie === 'vetements' && (
                  <select
                    value={varianteTaille}
                    onChange={(e) => setVarianteTaille(e.target.value)}
                    disabled={varianteChargement}
                    className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                  >
                    <option value="">Sélectionner une taille</option>
                    {TAILLES_VETEMENTS.map((taille) => (
                      <option key={taille} value={taille}>
                        {taille}
                      </option>
                    ))}
                  </select>
                )}

                {formulaire.categorie === 'chaussures' && (
                  <select
                    value={variantePointure}
                    onChange={(e) => setVariantePointure(e.target.value)}
                    disabled={varianteChargement}
                    className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                  >
                    <option value="">Sélectionner une pointure</option>
                    {POINTURES_CHAUSSURES.map((pointure) => (
                      <option key={pointure} value={pointure}>
                        {pointure}
                      </option>
                    ))}
                  </select>
                )}

                {formulaire.categorie !== 'vetements' &&
                  formulaire.categorie !== 'chaussures' && (
                    <input
                      value={varianteNom}
                      onChange={(e) => setVarianteNom(e.target.value)}
                      disabled={varianteChargement}
                      placeholder="Nom de la variante"
                      className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                    />
                  )}

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={varianteStock}
                  onChange={(e) => setVarianteStock(e.target.value)}
                  disabled={varianteChargement}
                  placeholder="Stock"
                  className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3.5 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => void ajouterVariante()}
                  disabled={
                    varianteChargement ||
                    !varianteCouleur.trim() ||
                    (formulaire.categorie === 'vetements' &&
                      !varianteTaille.trim()) ||
                    (formulaire.categorie === 'chaussures' &&
                      !variantePointure.trim()) ||
                    false
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
                    >
                      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px_auto] sm:items-end">
                        <label>
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">
                            Couleur
                          </span>
                          <select
                            value={variante.couleur || ''}
                            onChange={(e) =>
                              setVariantesProduit((actuelles) =>
                                actuelles.map((item) =>
                                  item.id === variante.id
                                    ? {
                                        ...item,
                                        couleur: e.target.value,
                                        nom:
                                          formulaire.categorie === 'vetements'
                                            ? `${e.target.value} / ${item.taille || ''}`.trim()
                                            : formulaire.categorie === 'chaussures'
                                              ? `${e.target.value} / ${item.pointure || ''}`.trim()
                                              : e.target.value,
                                      }
                                    : item,
                                ),
                              )
                            }
                            disabled={varianteSauvegardeId === variante.id}
                            className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                          >
                            <option value="">Couleur</option>
                            {COULEURS_PRODUIT.map((couleur) => (
                              <option key={couleur} value={couleur}>
                                {couleur}
                              </option>
                            ))}
                          </select>
                        </label>

                        {formulaire.categorie === 'vetements' && (
                          <label>
                            <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">
                              Taille
                            </span>
                            <select
                              value={variante.taille || ''}
                              onChange={(e) =>
                                setVariantesProduit((actuelles) =>
                                  actuelles.map((item) =>
                                    item.id === variante.id
                                      ? {
                                          ...item,
                                          taille: e.target.value,
                                          nom: `${item.couleur || ''} / ${e.target.value}`.trim(),
                                        }
                                      : item,
                                  ),
                                )
                              }
                              disabled={varianteSauvegardeId === variante.id}
                              className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                            >
                              <option value="">Taille</option>
                              {TAILLES_VETEMENTS.map((taille) => (
                                <option key={taille} value={taille}>
                                  {taille}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}

                        {formulaire.categorie === 'chaussures' && (
                          <label>
                            <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">
                              Pointure
                            </span>
                            <select
                              value={variante.pointure || ''}
                              onChange={(e) =>
                                setVariantesProduit((actuelles) =>
                                  actuelles.map((item) =>
                                    item.id === variante.id
                                      ? {
                                          ...item,
                                          pointure: e.target.value,
                                          nom: `${item.couleur || ''} / ${e.target.value}`.trim(),
                                        }
                                      : item,
                                  ),
                                )
                              }
                              disabled={varianteSauvegardeId === variante.id}
                              className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                            >
                              <option value="">Pointure</option>
                              {POINTURES_CHAUSSURES.map((pointure) => (
                                <option key={pointure} value={pointure}>
                                  {pointure}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}

                        {formulaire.categorie !== 'vetements' &&
                          formulaire.categorie !== 'chaussures' && (
                            <input
                              value={variante.nom}
                              onChange={(e) =>
                                setVariantesProduit((actuelles) =>
                                  actuelles.map((item) =>
                                    item.id === variante.id
                                      ? {
                                          ...item,
                                          nom: e.target.value,
                                          couleur: e.target.value,
                                        }
                                      : item,
                                  ),
                                )
                              }
                              disabled={varianteSauvegardeId === variante.id}
                              placeholder="Nom / couleur"
                              className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                            />
                          )}

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
                                          Math.floor(Number(e.target.value) || 0),
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                            disabled={varianteSauvegardeId === variante.id}
                            className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                            className="rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-slate-500 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
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
                            className="rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-slate-500 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
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
                            className="rounded-xl bg-violet-600 px-3 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                            className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-red-600 shadow-sm transition hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3.5 text-sm font-semibold text-red-700 shadow-sm">
              {erreur}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={fermerAjout}
              disabled={creationEnCours}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
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
          </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Produits</p>
          <p className="mt-1 text-2xl font-black text-violet-700">
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
                                  value={produit.poids_kg ?? ''}
                                  onChange={(event) =>
                                    modifierLocal(
                                      produit.id,
                                      'poids_kg',
                                      event.target.value === ''
                                        ? ''
                                        : Math.max(
                                            0,
                                            Number(event.target.value) || 0,
                                          ),
                                    )
                                  }
                                  placeholder="Ex. 2.5"
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#163B70] sm:w-32"
                                />
                              </label>

                              <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Longueur (cm)
                                </span>

                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={produit.longueur_cm ?? ''}
                                  onChange={(event) =>
                                    modifierLocal(
                                      produit.id,
                                      'longueur_cm',
                                      event.target.value === ''
                                        ? ''
                                        : Math.max(
                                            0,
                                            Number(event.target.value) || 0,
                                          ),
                                    )
                                  }
                                  placeholder="Ex. 30"
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#163B70] sm:w-32"
                                />
                              </label>

                              <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Largeur (cm)
                                </span>

                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={produit.largeur_cm ?? ''}
                                  onChange={(event) =>
                                    modifierLocal(
                                      produit.id,
                                      'largeur_cm',
                                      event.target.value === ''
                                        ? ''
                                        : Math.max(
                                            0,
                                            Number(event.target.value) || 0,
                                          ),
                                    )
                                  }
                                  placeholder="Ex. 20"
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#163B70] sm:w-32"
                                />
                              </label>

                              <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Hauteur (cm)
                                </span>

                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={produit.hauteur_cm ?? ''}
                                  onChange={(event) =>
                                    modifierLocal(
                                      produit.id,
                                      'hauteur_cm',
                                      event.target.value === ''
                                        ? ''
                                        : Math.max(
                                            0,
                                            Number(event.target.value) || 0,
                                          ),
                                    )
                                  }
                                  placeholder="Ex. 15"
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#163B70] sm:w-32"
                                />
                              </label>

                              <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Volume (CBM)
                                </span>

                                <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 sm:w-32">
                                  {produit.longueur_cm != null &&
                                  produit.largeur_cm != null &&
                                  produit.hauteur_cm != null
                                    ? (
                                        (Number(produit.longueur_cm) *
                                          Number(produit.largeur_cm) *
                                          Number(produit.hauteur_cm)) /
                                        1000000
                                      ).toFixed(6)
                                    : produit.volume_cbm != null
                                      ? Number(produit.volume_cbm).toFixed(6)
                                      : '—'}
                                </div>
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
