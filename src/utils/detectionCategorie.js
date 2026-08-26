import { CATEGORIES_PRODUIT } from '../data/categories';

const normaliser = (texte = '') =>
  texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const REGLES = [
  {
    mots: ['iphone', 'smartphone', 'samsung galaxy', 'xiaomi', 'redmi', 'pixel'],
    categorie: 'telephones',
    sousCategorie: 'smartphones'
  },
  {
    mots: ['tablette', 'ipad', 'galaxy tab'],
    categorie: 'telephones',
    sousCategorie: 'tablettes'
  },
  {
    mots: ['airpods', 'ecouteur', 'ecouteurs', 'casque audio', 'casque bluetooth', 'enceinte'],
    categorie: 'electronique',
    sousCategorie: 'audio'
  },
  {
    mots: ['macbook', 'ordinateur', 'laptop', 'pc portable'],
    categorie: 'electronique',
    sousCategorie: 'ordinateur'
  },
  {
    mots: ['imprimante'],
    categorie: 'electronique',
    sousCategorie: 'imprimante'
  },
  {
    mots: ['chargeur', 'cable usb', 'adaptateur', 'accessoire electronique'],
    categorie: 'electronique',
    sousCategorie: 'accessoire'
  },
  {
    mots: ['sac', 'sac a main', 'sacoche', 'cartable', 'sac de voyage'],
    categorie: 'sacs'
  },
  {
    mots: ['robe', 'pantalon', 'chemise', 't-shirt', 'tee-shirt', 'costume', 'tailleur', 'vetement'],
    categorie: 'vetements'
  },
  {
    mots: ['chaussure', 'chaussures', 'basket', 'baskets', 'sandale', 'sandales', 'bottine', 'bottes'],
    categorie: 'chaussures'
  },
  {
    mots: ['friteuse', 'airfryer', 'four', 'micro onde', 'electromenager'],
    categorie: 'cuisine',
    sousCategorie: 'electromenager'
  }
];

const REGLES_GENRE = [
  {
    mots: ['enfant', 'enfants', 'fille', 'garcon'],
    genre: 'enfant'
  },
  {
    mots: ['femme', 'dame'],
    genre: 'femme'
  },
  {
    mots: ['homme', 'monsieur'],
    genre: 'homme'
  },
  {
    mots: ['bebe', 'nouveau ne'],
    genre: 'bebe'
  }
];

export function detecterCategorie(nomProduit = '') {
  const texte = normaliser(nomProduit);

  if (!texte.trim()) {
    return null;
  }

  const regle = REGLES.find((item) =>
    item.mots.some((mot) => texte.includes(normaliser(mot)))
  );

  if (!regle) {
    return null;
  }

  const regleGenre = REGLES_GENRE.find((item) =>
    item.mots.some((mot) => texte.includes(normaliser(mot)))
  );

  const genre = regleGenre?.genre || '';

  let sousCategorie = regle.sousCategorie || '';

  if (!sousCategorie && genre) {
    const categorie = CATEGORIES_PRODUIT.find(
      (item) => item.id === regle.categorie
    );

    const sousCategorieGenre = categorie?.sousCategories?.find(
      (item) => item.genre === genre
    );

    if (sousCategorieGenre) {
      sousCategorie = sousCategorieGenre.id;
    }
  }

  return {
    categorie: regle.categorie,
    sousCategorie,
    genre
  };
}
