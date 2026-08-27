#!/bin/bash

echo "🔧 Début des corrections..."

# Correction Accueil.tsx
sed -i 's/Image indisponible/Image non disponible/g' src/pages/Accueil.tsx
sed -i 's/Sélection ChinaShop/Sélection ChinaShop-Bénin/g' src/pages/Accueil.tsx
echo "✅ Accueil.tsx corrigé"

# Correction Catalogue.tsx
sed -i 's/Sélection/Sélection ChinaShop-Bénin/g' src/pages/Catalogue.tsx
sed -i 's/Image indisponible/Image non disponible/g' src/pages/Catalogue.tsx
sed -i 's/En stock/Disponible/g' src/pages/Catalogue.tsx
sed -i 's/Disponible maintenant/En stock/g' src/pages/Catalogue.tsx
echo "✅ Catalogue.tsx corrigé"

# Correction Infos.tsx
sed -i 's/Je renseigne/Je renseigne mes coordonnées/g' src/pages/Infos.tsx
sed -i 's/commande reçoit un numéro/commande reçoit un numéro unique/g' src/pages/Infos.tsx
echo "✅ Infos.tsx corrigé"

# Correction Compte.tsx
sed -i 's/Préparation/En préparation/g' src/pages/Compte.tsx
sed -i 's/Expédition/En expédition/g' src/pages/Compte.tsx
sed -i 's/En livraison/En cours de livraison/g' src/pages/Compte.tsx
echo "✅ Compte.tsx corrigé"

# Correction Commande.tsx
sed -i 's/tarifLivraison/Frais de livraison/g' src/pages/Commande.tsx
echo "✅ Commande.tsx corrigé"

# Correction Footer.tsx
sed -i 's/Des produits sélectionnés en Chine/Des produits soigneusement sélectionnés en Chine/g' src/components/Footer.tsx
sed -i 's/un parcours de commande simple et un suivi clair/un parcours de commande simple et un suivi transparent/g' src/components/Footer.tsx
echo "✅ Footer.tsx corrigé"

echo "🎉 Toutes les corrections sont terminées !"
