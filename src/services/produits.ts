import { supabase } from '../lib/supabase'

export type Produit = {
  id: string
  nom: string
  prix: number
  prixOriginal: number | null
  stock: number
  disponibilite: string
  actif: boolean
  description: string
  image_url: string
  categorie: string | null
  sous_categorie: string | null
  genre: string | null
  promo: number
  nouveau: boolean
  date_ajout: string | null
  promo_fin: string | null
}

type ProduitRow = {
  id: string
  nom: string
  prix: number
  stock: number
  disponibilite: string
  actif: boolean
  cs_produit_details:
    | {
        description: string | null
        image_url: string | null
        prix_original: number | null
        categorie: string | null
        sous_categorie: string | null
        genre: string | null
        promo: number | null
        nouveau: boolean | null
        date_ajout: string | null
        promo_fin: string | null
      }
    | {
        description: string | null
        image_url: string | null
        prix_original: number | null
        categorie: string | null
        sous_categorie: string | null
        genre: string | null
        promo: number | null
        nouveau: boolean | null
        date_ajout: string | null
        promo_fin: string | null
      }[]
    | null
}

function transformerProduit(produit: ProduitRow): Produit {
  const details = Array.isArray(produit.cs_produit_details)
    ? produit.cs_produit_details[0]
    : produit.cs_produit_details

  return {
    id: produit.id,
    nom: produit.nom,
    prix: produit.prix,
    prixOriginal: details?.prix_original ?? null,
    stock: produit.stock,
    disponibilite: produit.disponibilite,
    actif: produit.actif,
    description: details?.description ?? '',
    image_url: details?.image_url ?? '',
    categorie: details?.categorie ?? null,
    sous_categorie: details?.sous_categorie ?? null,
    genre: details?.genre ?? null,
    promo: Number(details?.promo ?? 0),
    nouveau: details?.nouveau === true,
    date_ajout: details?.date_ajout ?? null,
    promo_fin: details?.promo_fin ?? null,
  }
}

export async function obtenirProduits(): Promise<Produit[]> {
  const { data, error } = await supabase
    .from('cs_produits')
    .select(`
      id,
      nom,
      prix,
      stock,
      disponibilite,
      actif,
      cs_produit_details (
        description,
        image_url,
        prix_original,
        categorie,
        sous_categorie,
        genre,
        promo,
        nouveau,
        date_ajout,
        promo_fin
      )
    `)
    .eq('actif', true)
    .order('created_at', { ascending: true })

  console.log('OBTENIR PRODUITS:', { nombre: data?.length ?? 0, error, data })

  if (error) {
    console.error('Erreur chargement produits:', error)
    throw new Error('Impossible de charger les produits')
  }

  try {
    const produits = ((data ?? []) as ProduitRow[]).map(transformerProduit)
    console.log('TRANSFORMATION PRODUITS OK:', produits.length)
    return produits
  } catch (err) {
    console.error('ERREUR TRANSFORMATION PRODUITS:', err)
    throw err
  }
}

export async function obtenirProduit(id: string): Promise<Produit | null> {
  const { data, error } = await supabase
    .from('cs_produits')
    .select(`
      id,
      nom,
      prix,
      stock,
      disponibilite,
      actif,
      cs_produit_details (
        description,
        image_url,
        prix_original,
        categorie,
        sous_categorie,
        genre,
        promo,
        nouveau,
        date_ajout,
        promo_fin
      )
    `)
    .eq('id', id)
    .eq('actif', true)
    .maybeSingle()

  if (error) {
    console.error('Erreur chargement produit:', error)
    throw new Error('Impossible de charger le produit')
  }

  if (!data) {
    return null
  }

  return transformerProduit(data as ProduitRow)
}

export async function estFavori(produitId: string, userId: string) {
  const { data, error } = await supabase
    .from('cs_favoris')
    .select('id')
    .eq('client_user_id', userId)
    .eq('produit_id', produitId)
    .maybeSingle()

  if (error) {
    console.error('Erreur vérification favori:', error)
    throw new Error('Impossible de vérifier le favori')
  }

  return Boolean(data)
}

export async function ajouterFavori(produitId: string, userId: string) {
  const { error } = await supabase
    .from('cs_favoris')
    .insert({
      client_user_id: userId,
      produit_id: produitId,
    })

  if (error) {
    if (error.code === '23505') {
      return
    }

    console.error('Erreur ajout favori:', error)
    throw new Error('Impossible d’ajouter ce produit aux favoris')
  }
}

export async function supprimerFavori(produitId: string, userId: string) {
  const { error } = await supabase
    .from('cs_favoris')
    .delete()
    .eq('client_user_id', userId)
    .eq('produit_id', produitId)

  if (error) {
    console.error('Erreur suppression favori:', error)
    throw new Error('Impossible de retirer ce produit des favoris')
  }
}

export async function obtenirFavoris(userId: string) {
  const { data, error } = await supabase
    .from('cs_favoris')
    .select('id, produit_id, created_at')
    .eq('client_user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur chargement favoris:', error)
    throw new Error('Impossible de charger vos favoris')
  }

  if (!data?.length) {
    return []
  }

  const produitIds = data.map((favori) => favori.produit_id)

  const { data: produits, error: produitsError } = await supabase
    .from('cs_produits')
    .select(`
      id,
      nom,
      prix,
      stock,
      disponibilite,
      actif,
      cs_produit_details (
        description,
        image_url,
        prix_original,
        categorie,
        sous_categorie,
        genre,
        promo,
        nouveau,
        date_ajout,
        promo_fin
      )
    `)
    .in('id', produitIds)
    .eq('actif', true)

  if (produitsError) {
    console.error('Erreur chargement produits favoris:', produitsError)
    throw new Error('Impossible de charger vos produits favoris')
  }

  const produitsTransformes = ((produits ?? []) as ProduitRow[]).map(
    transformerProduit,
  )

  return data
    .map((favori) => ({
      id: favori.id,
      created_at: favori.created_at,
      produit:
        produitsTransformes.find(
          (item) => item.id === favori.produit_id,
        ) ?? null,
    }))
    .filter((item) => item.produit !== null)
}
