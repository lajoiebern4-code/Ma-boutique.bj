import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AdminGuard from './components/AdminGuard'
import AssistanceAdmin from './pages/admin/Assistance'
import TestV6Identity from './pages/TestV6Identity'

const Accueil = lazy(() => import('./pages/Accueil'))
const Catalogue = lazy(() => import('./pages/Catalogue'))
const Produit = lazy(() => import('./pages/Produit'))
const Nouveautes = lazy(() => import('./pages/Nouveautes'))
const Promotions = lazy(() => import('./pages/Promotions'))
const Panier = lazy(() => import('./pages/Panier'))
const Commande = lazy(() => import('./pages/Commande'))
const Confirmation = lazy(() => import('./pages/Confirmation'))
const Infos = lazy(() => import('./pages/Infos'))
const Suivi = lazy(() => import('./pages/Suivi'))
const MesCommandes = lazy(() => import('./pages/MesCommandes'))
const Parrainage = lazy(() => import('./pages/Parrainage'))
const Inscription = lazy(() => import('./pages/Inscription'))
const Connexion = lazy(() => import('./pages/Connexion'))
const Compte = lazy(() => import('./pages/Compte'))
const Assistance = lazy(() => import('./pages/Assistance'))

const ParametresCompte = lazy(() =>
  import('./pages/compte/parametres/Parametres')
)
const Informations = lazy(() =>
  import('./pages/compte/parametres/Informations')
)
const Niveau = lazy(() =>
  import('./pages/compte/parametres/Niveau')
)
const Securite = lazy(() =>
  import('./pages/compte/parametres/Securite')
)
const NotificationsCompte = lazy(() =>
  import('./pages/compte/parametres/Notifications')
)
const Preferences = lazy(() =>
  import('./pages/compte/parametres/Preferences')
)
const Confidentialite = lazy(() =>
  import('./pages/compte/parametres/Confidentialite')
)

const AdminLayout = lazy(() => import('./pages/admin/Layout'))
const AdminLogin = lazy(() => import('./pages/admin/Login'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Commandes = lazy(() => import('./pages/admin/Commandes'))
const Produits = lazy(() => import('./pages/admin/Produits'))
const AdminPromotions = lazy(() => import('./pages/admin/Promotions'))
const Livraison = lazy(() => import('./pages/admin/Livraison'))
const Clients = lazy(() => import('./pages/admin/Clients'))
const Avis = lazy(() => import('./pages/admin/Avis'))
const Factures = lazy(() => import('./pages/admin/Factures'))
const Notifications = lazy(() => import('./pages/admin/Notifications'))
const Annonces = lazy(() => import('./pages/admin/Annonces'))
const Parametres = lazy(() => import('./pages/admin/Parametres'))
const Photos = lazy(() => import('./pages/admin/Photos'))



function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-white px-6">
      <div className="flex w-full flex-col items-center justify-center text-center">
          <img
            src="/logo-splash.png"
            alt="ChinaShop-Bénin"
            className="h-auto w-[65vw] max-w-[420px] object-contain"
          />

        <div className="mt-8 flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-500" />
        </div>
      </div>
    </div>
  )
}

function ChargementPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-orange-500 dark:border-slate-800 dark:border-t-orange-500" />
    </div>
  )
}

function App() {
  const [splashVisible, setSplashVisible] = useState(true)

  useEffect(() => {

    const timer = window.setTimeout(() => {
      setSplashVisible(false)
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [])

  if (splashVisible) {
    return <SplashScreen />
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<ChargementPage />}>
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
            <Route path="/mes-commandes" element={<MesCommandes />} />
            <Route path="/parrainage" element={<Parrainage />} />
            <Route path="/inscription" element={<Inscription />} />
            <Route path="/connexion" element={<Connexion />} />
            <Route path="/compte" element={<Compte />} />
            <Route path="/assistance" element={<Assistance />} />
          <Route path="/test-v6-identity" element={<TestV6Identity />} />

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
              <Route path="assistance" element={<AssistanceAdmin />} />
              <Route path="factures" element={<Factures />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="annonces" element={<Annonces />} />
              <Route path="parametres" element={<Parametres />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
