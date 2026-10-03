import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  MessageCircle,
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
  const { user, estAdmin } = useAuth()

  const fermerMenu = () => setMenuOuvert(false)

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-[14px] px-4 py-2 text-sm font-bold transition-colors duration-200 ${
      isActive
        ? 'bg-[#7654C6] text-white shadow-[0_4px_14px_rgba(118,84,198,0.18)]'
        : 'text-[#6F687A] hover:bg-[#F1ECFA] hover:text-[#6544B3]'
    }`

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-[#E8E3EF]/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            onClick={fermerMenu}
            className="shrink-0 transition-opacity hover:opacity-90"
          >
            <div className="flex items-baseline">
              <span className="text-2xl font-black tracking-tight text-[#18151F]">
                ChinaShop
              </span>
              <span className="text-2xl font-black tracking-tight text-[#7654C6]">
                -Bénin
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400">
              <Sparkles size={10} className="text-[#7654C6]" />
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
              to="/assistance"
              className="hidden h-10 items-center gap-2 rounded-lg border border-[#E8E3EF] px-4 text-sm font-bold text-[#18151F] transition-all duration-300 hover:border-[#D8CBEF] hover:bg-[#F1ECFA]"
            >
              <MessageCircle size={17} />
              Assistance
            </Link>

            <Link
              to="/suivi"
              className="hidden h-10 items-center gap-2 rounded-lg border border-[#E8E3EF] px-4 text-sm font-bold text-[#18151F] transition-all duration-300 hover:border-[#D8CBEF] hover:bg-[#F1ECFA] lg:inline-flex"
            >
              <PackageSearch size={17} />
              Suivi
            </Link>

            <Link
              to={user && !estAdmin ? '/compte' : '/connexion'}
              className="hidden h-10 items-center gap-2 rounded-lg border border-[#E8E3EF] px-4 text-sm font-bold text-[#18151F] transition-all duration-300 hover:border-[#D8CBEF] hover:bg-[#F1ECFA] sm:inline-flex"
            >
              <UserRound size={17} />
              {user && !estAdmin ? 'Compte' : 'Connexion'}
            </Link>

            <Link
              to="/panier"
              className={`relative flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-all duration-300 active:scale-95 ${
                nombreArticles > 0
                  ? 'bg-[#7654C6] text-white shadow-[0_4px_14px_rgba(24,21,31,0.06)] hover:shadow-[0_6px_18px_rgba(24,21,31,0.09)]'
                  : 'border border-[#E8E3EF] text-[#18151F] hover:border-[#D8CBEF] hover:bg-[#F1ECFA]'
              }`}
            >
              <ShoppingBag size={18} strokeWidth={2.2} />
              <span className="hidden sm:inline">Panier</span>
              {nombreArticles > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7654C6] px-1 text-[9px] font-bold text-white shadow-[0_4px_14px_rgba(24,21,31,0.06)]">
                  {nombreArticles > 99 ? '99+' : nombreArticles}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMenuOuvert(!menuOuvert)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E8E3EF] text-[#18151F] transition-all duration-300 hover:border-[#D8CBEF] hover:bg-[#F1ECFA] md:hidden"
              aria-label={menuOuvert ? 'Fermer' : 'Ouvrir'}
            >
              {menuOuvert ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOuvert && (
          <div className="border-t border-[#E8E3EF] bg-white md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
              <NavLink
                to="/"
                onClick={fermerMenu}
                className={({ isActive }) =>
                  `flex min-h-11 items-center justify-between rounded-lg px-4 text-sm font-bold ${
                    isActive
                      ? 'bg-[#7654C6] text-white'
                      : 'text-gray-600 hover:bg-[#FAF9FC]'
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
                        ? 'bg-[#7654C6] text-white'
                        : 'text-gray-600 hover:bg-[#FAF9FC]'
                    }`
                  }
                >
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <NavLink
                to={user && !estAdmin ? '/compte' : '/connexion'}
                onClick={fermerMenu}
                className="mt-1 flex min-h-11 items-center justify-between rounded-lg border border-[#E8E3EF] px-4 text-sm font-bold text-[#18151F]"
              >
                <span>{user && !estAdmin ? 'Mon compte' : 'Se connecter'}</span>
                <UserRound size={17} />
              </NavLink>
              <NavLink
                to="/assistance"
                onClick={fermerMenu}
                className="mt-1 flex min-h-11 items-center justify-between rounded-lg border border-[#E8DDFB] bg-[#F1ECFA] px-4 text-sm font-bold text-[#6544B3] transition hover:bg-[#E8DDFB]"
              >
                <span>Contacter l'assistance</span>
                <MessageCircle size={17} />
              </NavLink>

              <NavLink
                to="/suivi"
                onClick={fermerMenu}
                className="mt-1 flex min-h-11 items-center justify-between rounded-lg bg-[#7654C6] px-4 text-sm font-bold text-white shadow-[0_4px_14px_rgba(24,21,31,0.06)]"
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
