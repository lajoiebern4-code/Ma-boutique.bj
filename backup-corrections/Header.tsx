import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  ChevronRight,
  Menu,
  PackageSearch,
  ShoppingBag,
  UserRound,
  X,
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
    `rounded-lg px-3 py-2 text-[13px] font-bold transition ${
      isActive
        ? 'bg-slate-100 text-[#0B1E3D]'
        : 'text-slate-500 hover:bg-slate-50 hover:text-[#0B1E3D]'
    }`

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-slate-200/80 bg-white/95 shadow-[0_2px_18px_rgba(11,30,61,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-[66px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          <Link
            to="/"
            onClick={fermerMenu}
            aria-label="ChinaShop-Benin - Accueil"
            className="shrink-0"
          >
            <div className="flex items-baseline leading-none">
              <span className="text-[19px] font-black tracking-[-0.045em] text-[#0B1E3D] sm:text-[21px]">
                ChinaShop
              </span>
              <span className="text-[19px] font-black tracking-[-0.045em] text-orange-500 sm:text-[21px]">
                -Benin
              </span>
            </div>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Chine · Bénin
            </p>
          </Link>

          <nav
            aria-label="Navigation principale"
            className="hidden items-center gap-0.5 md:flex"
          >
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
              aria-label="Suivre une commande"
              className="hidden h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-[13px] font-bold text-[#0B1E3D] transition hover:bg-slate-50 lg:inline-flex"
            >
              <PackageSearch size={17} />
              <span>Suivi</span>
            </Link>

            <Link
              to={user ? '/compte' : '/connexion'}
              aria-label={user ? 'Mon compte' : 'Se connecter'}
              className="hidden h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-[13px] font-bold text-[#0B1E3D] transition hover:bg-slate-50 sm:inline-flex"
            >
              <UserRound size={17} />
              <span>{user ? 'Compte' : 'Connexion'}</span>
            </Link>

            <Link
              to="/panier"
              aria-label={
                nombreArticles > 0
                  ? `Voir le panier, ${nombreArticles} article${nombreArticles > 1 ? 's' : ''}`
                  : 'Voir le panier'
              }
              className={`relative flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-[13px] font-bold transition active:scale-[0.98] sm:px-3.5 ${
                nombreArticles > 0
                  ? 'bg-[#0284C7] text-white hover:bg-[#0369A1]'
                  : 'border border-slate-200 text-[#0B1E3D] hover:bg-slate-50'
              }`}
            >
              <ShoppingBag size={17} strokeWidth={2.3} />
              <span className="hidden sm:inline">Panier</span>

              {nombreArticles > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-orange-500 px-1 text-[9px] font-black text-white">
                  {nombreArticles > 99 ? '99+' : nombreArticles}
                </span>
              )}
            </Link>

            <button
              type="button"
              aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOuvert}
              onClick={() => setMenuOuvert((ouvert) => !ouvert)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-[#0B1E3D] transition hover:bg-slate-50 active:scale-[0.98] md:hidden"
            >
              {menuOuvert ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOuvert && (
          <div className="border-t border-slate-200 bg-white md:hidden">
            <nav
              aria-label="Navigation mobile"
              className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6"
            >
              <NavLink
                to="/"
                onClick={fermerMenu}
                className={({ isActive }) =>
                  `flex min-h-11 items-center justify-between rounded-lg px-4 text-sm font-bold ${
                    isActive
                      ? 'bg-slate-100 text-[#0B1E3D]'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>Accueil</span>
                    <ChevronRight
                      size={17}
                      className={isActive ? 'text-[#0284C7]' : 'text-slate-400'}
                    />
                  </>
                )}
              </NavLink>

              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={fermerMenu}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center justify-between rounded-lg px-4 text-sm font-bold ${
                      isActive
                        ? 'bg-slate-100 text-[#0B1E3D]'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{item.label}</span>
                      <ChevronRight
                        size={17}
                        className={isActive ? 'text-[#0284C7]' : 'text-slate-400'}
                      />
                    </>
                  )}
                </NavLink>
              ))}

              <NavLink
                to={user ? '/compte' : '/connexion'}
                onClick={fermerMenu}
                className="mt-1 flex min-h-11 items-center justify-between rounded-lg border border-slate-200 px-4 text-sm font-bold text-[#0B1E3D]"
              >
                <span>{user ? 'Mon compte' : 'Se connecter'}</span>
                <UserRound size={17} />
              </NavLink>

              <NavLink
                to="/suivi"
                onClick={fermerMenu}
                className="mt-1 flex min-h-11 items-center justify-between rounded-lg bg-[#0284C7] px-4 text-sm font-bold text-white"
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
