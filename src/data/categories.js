export const CATEGORIES = [
  {
    id: 'tous',
    label: 'Tous les produits',
    sousCategories: []
  },
  {
    id: 'telephones',
    label: 'Téléphones & Tablettes',
    sousCategories: [
      { id: 'smartphones', label: 'Smartphones' },
      { id: 'telephones', label: 'Téléphones' },
      { id: 'tablettes', label: 'Tablettes' },
      { id: 'accessoire', label: 'Accessoires' }
    ]
  },
  {
    id: 'vetements',
    label: 'Vêtements',
    sousCategories: [
      { id: 'homme', label: 'Homme', genre: 'homme' },
      { id: 'femme', label: 'Femme', genre: 'femme' },
      { id: 'enfant', label: 'Enfant', genre: 'enfant' },
      { id: 'bebe', label: 'Bébé', genre: 'bebe' }
    ]
  },
  {
    id: 'chaussures',
    label: 'Chaussures',
    sousCategories: [
      { id: 'homme', label: 'Homme', genre: 'homme' },
      { id: 'femme', label: 'Femme', genre: 'femme' },
      { id: 'enfant', label: 'Enfant', genre: 'enfant' },
      { id: 'sport', label: 'Sport' }
    ]
  },
  {
    id: 'sacs',
    label: 'Sacs',
    sousCategories: [
      { id: 'femme', label: 'Femme', genre: 'femme' },
      { id: 'homme', label: 'Homme', genre: 'homme' },
      { id: 'enfant', label: 'Enfant', genre: 'enfant' },
      { id: 'voyage', label: 'Voyage' },
      { id: 'professionnel', label: 'Professionnel' }
    ]
  },
  {
    id: 'electronique',
    label: 'Électronique',
    sousCategories: [
      { id: 'audio', label: 'Audio' },
      { id: 'ordinateur', label: 'Ordinateurs' },
      { id: 'imprimante', label: 'Imprimantes' },
      { id: 'accessoire', label: 'Accessoires' },
      { id: 'television', label: 'Télévision' },
      { id: 'autre', label: 'Autres' }
    ]
  },
  {
    id: 'cuisine',
    label: 'Cuisine & Électroménager',
    sousCategories: [
      { id: 'electromenager', label: 'Électroménager' },
      { id: 'cuisson', label: 'Cuisson' },
      { id: 'ustensiles', label: 'Ustensiles de cuisine' },
      { id: 'rangement', label: 'Rangement' },
      { id: 'autre', label: 'Autres' }
    ]
  },
  {
    id: 'sport',
    label: 'Sport & Loisirs',
    sousCategories: [
      { id: 'fitness', label: 'Fitness' },
      { id: 'football', label: 'Football' },
      { id: 'plein-air', label: 'Plein air' },
      { id: 'loisirs', label: 'Loisirs' },
      { id: 'autre', label: 'Autres' }
    ]
  },
  {
    id: 'beaute',
    label: 'Beauté & Accessoires',
    sousCategories: [
      { id: 'soins', label: 'Soins' },
      { id: 'cheveux', label: 'Cheveux' },
      { id: 'maquillage', label: 'Maquillage' },
      { id: 'accessoires', label: 'Accessoires' },
      { id: 'autre', label: 'Autres' }
    ]
  }
];

export const CATEGORIES_PRODUIT = CATEGORIES.filter(
  (categorie) => categorie.id !== 'tous'
);

export const getCategorie = (id) =>
  CATEGORIES.find((categorie) => categorie.id === id) || null;

export const getSousCategorie = (categorieId, sousCategorieId) => {
  const categorie = getCategorie(categorieId);

  return (
    categorie?.sousCategories?.find(
      (sousCategorie) => sousCategorie.id === sousCategorieId
    ) || null
  );
};
