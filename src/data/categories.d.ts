export type SousCategorie = {
  id: string
  label: string
  genre?: string
}

export type Categorie = {
  id: string
  label: string
  sousCategories: SousCategorie[]
}

export const CATEGORIES: Categorie[]

export const CATEGORIES_PRODUIT: Categorie[]

export function getCategorie(id: string): Categorie | null

export function getSousCategorie(
  categorieId: string,
  sousCategorieId: string,
): SousCategorie | null
