import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AdminGuard from './components/AdminGuard'

import Accueil from './pages/Accueil'
import Catalogue from './pages/Catalogue'
import Produit from './pages/Produit'
import Nouveautes from './pages/Nouveautes'
import Promotions from './pages/Promotions'
import Panier from './pages/Panier'
import Commande from './pages/Commande'
import Confirmation from './pages/Confirmation'
import Infos from './pages/Infos'
import Suivi from './pages/Suivi'
import Parrainage from './pages/Parrainage'
import ColisGroupe from './pages/ColisGroupe'
import Inscription from './pages/Inscription'
import Connexion from './pages/Connexion'
import Compte from './pages/Compte'
import ParametresCompte from './pages/compte/parametres/Parametres'
import Informations from './pages/compte/parametres/Informations'
import Niveau from './pages/compte/parametres/Niveau'
import Securite from './pages/compte/parametres/Securite'
import NotificationsCompte from './pages/compte/parametres/Notifications'
import Preferences from './pages/compte/parametres/Preferences'
import Confidentialite from './pages/compte/parametres/Confidentialite'


import AdminLayout from './pages/admin/Layout'
import AdminLogin from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Commandes from './pages/admin/Commandes'
import Produits from './pages/admin/Produits'
import AdminPromotions from './pages/admin/Promotions'
import Livraison from './pages/admin/Livraison'
import Clients from './pages/admin/Clients'
import Avis from './pages/admin/Avis'
import Factures from './pages/admin/Factures'
import Notifications from './pages/admin/Notifications'
import Annonces from './pages/admin/Annonces'
import Parametres from './pages/admin/Parametres'
import Photos from './pages/admin/Photos'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* SITE PUBLIC */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Accueil />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/produit/:id" element={<Produit />} />
          <Route path="/nouveautes" element={<Nouveautes />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/panier" element={<Panier />} />
          <Route path="/commande" element={<Commande />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/infos" element={<Infos />} />
          <Route path="/suivi" element={<Suivi />} />
          <Route path="/parrainage" element={<Parrainage />} />
          <Route path="/colis-groupe" element={<ColisGroupe />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/compte" element={<Compte />} />
          <Route path="/compte/parametres" element={<ParametresCompte />} />
          <Route path="/compte/parametres/informations" element={<Informations />} />
          <Route path="/compte/parametres/niveau" element={<Niveau />} />
          <Route path="/compte/parametres/securite" element={<Securite />} />
          <Route path="/compte/parametres/notifications" element={<NotificationsCompte />} />
          <Route path="/compte/parametres/preferences" element={<Preferences />} />
          <Route path="/compte/parametres/confidentialite" element={<Confidentialite />} />
        </Route>

        {/* ADMIN */}
        <Route path="/admin-cs2026/login" element={<AdminLogin />} />

        <Route path="/admin-cs2026" element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="commandes" element={<Commandes />} />
            <Route path="produits" element={<Produits />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="photos" element={<Photos />} />
            <Route path="livraison" element={<Livraison />} />
            <Route path="clients" element={<Clients />} />
            <Route path="avis" element={<Avis />} />
            <Route path="factures" element={<Factures />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="annonces" element={<Annonces />} />
            <Route path="parametres" element={<Parametres />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
