import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Menu,
  ShoppingBag,
  UserRound,
  X,
  PackageSearch,
  Sparkles
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext.jsx'

const navItems = [
  { label: 'Catalogue', to: '/catalogue' },
  { label: 'Nouveautés', to: '/nouveautes' },
  { label: 'Promotions', to: '/promotions' },
  { label: 'Infos', to: '/infos' },
]

export default function Header() {
  const [menuOuvert, setMenuOuvert] = useState(false)
  const { nombreArticles } = useCart()
  const { user } = useAuth()

  const fermerMenu = () => setMenuOuvert(false)

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-4 py-2 text-sm font-bold transition-all duration-300 ${
      isActive
        ? 'bg-gradient-to-r from-[#0052CC] to-[#1A6BFF] text-white shadow-lg shadow-blue-500/25'
        : 'text-gray-600 hover:bg-gray-100 hover:text-[#0052CC]'
    }`

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            onClick={fermerMenu}
            className="shrink-0 transition-opacity hover:opacity-80"
          >
            <div className="flex items-baseline">
              <span className="text-2xl font-black tracking-tight text-[#001433]">
                ChinaShop
              </span>
              <span className="text-2xl font-black tracking-tight text-[#FF7A1A]">
                -Bénin
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400">
              <Sparkles size={10} className="text-[#FF7A1A]" />
              Chine · Bénin
            </p>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" className={navClass}>
              Accueil
            </NavLink>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/suivi"
              className="hidden h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-bold text-[#001433] transition-all duration-300 hover:border-[#0052CC] hover:bg-[#EBF5FF] lg:inline-flex"
            >
              <PackageSearch size={17} />
              Suivi
            </Link>

            <Link
              to={user ? '/compte' : '/connexion'}
              className="hidden h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-bold text-[#001433] transition-all duration-300 hover:border-[#0052CC] hover:bg-[#EBF5FF] sm:inline-flex"
            >
              <UserRound size={17} />
              {user ? 'Compte' : 'Connexion'}
            </Link>

            <Link
              to="/panier"
              className={`relative flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-all duration-300 active:scale-95 ${
                nombreArticles > 0
                  ? 'bg-gradient-to-r from-[#0052CC] to-[#1A6BFF] text-white shadow-lg shadow-blue-500/25 hover:shadow-xl'
                  : 'border border-gray-200 text-[#001433] hover:border-[#0052CC] hover:bg-[#EBF5FF]'
              }`}
            >
              <ShoppingBag size={18} strokeWidth={2.2} />
              <span className="hidden sm:inline">Panier</span>
              {nombreArticles > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-[#FF7A1A] to-[#FF9C4D] px-1 text-[9px] font-bold text-white shadow-lg">
                  {nombreArticles > 99 ? '99+' : nombreArticles}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMenuOuvert(!menuOuvert)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-[#001433] transition-all duration-300 hover:border-[#0052CC] hover:bg-[#EBF5FF] md:hidden"
              aria-label={menuOuvert ? 'Fermer' : 'Ouvrir'}
            >
              {menuOuvert ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOuvert && (
          <div className="border-t border-gray-200 bg-white md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
              <NavLink
                to="/"
                onClick={fermerMenu}
                className={({ isActive }) =>
                  `flex min-h-11 items-center justify-between rounded-lg px-4 text-sm font-bold ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0052CC] to-[#1A6BFF] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <span>Accueil</span>
              </NavLink>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={fermerMenu}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center justify-between rounded-lg px-4 text-sm font-bold ${
                      isActive
                        ? 'bg-gradient-to-r from-[#0052CC] to-[#1A6BFF] text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <NavLink
                to={user ? '/compte' : '/connexion'}
                onClick={fermerMenu}
                className="mt-1 flex min-h-11 items-center justify-between rounded-lg border border-gray-200 px-4 text-sm font-bold text-[#001433]"
              >
                <span>{user ? 'Mon compte' : 'Se connecter'}</span>
                <UserRound size={17} />
              </NavLink>
              <NavLink
                to="/suivi"
                onClick={fermerMenu}
                className="mt-1 flex min-h-11 items-center justify-between rounded-lg bg-gradient-to-r from-[#0052CC] to-[#1A6BFF] px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25"
              >
                <span>Suivre ma commande</span>
                <PackageSearch size={17} />
              </NavLink>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
