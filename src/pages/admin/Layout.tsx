import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  BarChart3,
  ShoppingCart,
  Users,
  MessageSquare,
  Package,
  BadgePercent,
  Image,
  Truck,
  Receipt,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react'

const sections = [
  {
    label: 'Pilotage',
    items: [
      {
        label: 'Dashboard',
        to: '/admin-cs2026/dashboard',
        icon: BarChart3,
      },
    ],
  },
  {
    label: 'Ventes',
    items: [
      {
        label: 'Commandes',
        to: '/admin-cs2026/commandes',
        icon: ShoppingCart,
      },
      {
        label: 'Clients',
        to: '/admin-cs2026/clients',
        icon: Users,
      },
      {
        label: 'Avis',
        to: '/admin-cs2026/avis',
        icon: MessageSquare,
      },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      {
        label: 'Produits',
        to: '/admin-cs2026/produits',
        icon: Package,
      },
      {
        label: 'Promotions',
        to: '/admin-cs2026/promotions',
        icon: BadgePercent,
      },
      {
        label: 'Photos',
        to: '/admin-cs2026/photos',
        icon: Image,
      },
    ],
  },
  {
    label: 'Logistique',
    items: [
      {
        label: 'Livraison & Retrait',
        to: '/admin-cs2026/livraison',
        icon: Truck,
      },
    ],
  },
  {
    label: 'Finances',
    items: [
      {
        label: 'Factures',
        to: '/admin-cs2026/factures',
        icon: Receipt,
      },
    ],
  },
  {
    label: 'Communication',
    items: [
      {
        label: 'Notifications',
        to: '/admin-cs2026/notifications',
        icon: Bell,
      },
            {
              label: 'Annonces',
              to: '/admin-cs2026/annonces',
              icon: Bell,
            },
    ],
  },
  {
    label: 'Système',
    items: [
      {
        label: 'Paramètres',
        to: '/admin-cs2026/parametres',
        icon: Settings,
      },
    ],
  },
]

export default function Layout() {
  const { deconnexion } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 text-[#0B1E3D]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="text-lg font-black tracking-tight">
              ChinaShop<span className="text-orange-500">-Benin</span>
            </div>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Administration
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-5">
            <div className="space-y-6">
              {sections.map((section) => (
                <div key={section.label}>
                  <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    {section.label}
                  </p>

                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon

                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={({ isActive }) =>
                            [
                              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                              isActive
                                ? 'bg-[#0284C7] text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B1E3D]',
                            ].join(' ')
                          }
                        >
                          <Icon size={18} strokeWidth={2} />
                          <span>{item.label}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="border-t border-slate-200 p-3">
            <button
              type="button"
              onClick={deconnexion}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
            <div className="flex min-h-16 items-center justify-between px-4">
              <div>
                <div className="text-base font-black">
                  ChinaShop<span className="text-orange-500">-Benin</span>
                </div>

                <p className="text-[11px] font-medium text-slate-500">
                  Administration
                </p>
              </div>

              <button
                type="button"
                onClick={deconnexion}
                aria-label="Déconnexion"
                className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
              >
                <LogOut size={18} />
              </button>
            </div>

            <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2">
              {sections
                .flatMap((section) => section.items)
                .map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        [
                          'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold',
                          isActive
                            ? 'bg-[#0284C7] text-white'
                            : 'text-slate-500 hover:bg-slate-100',
                        ].join(' ')
                      }
                    >
                      <Icon size={15} />
                      {item.label}
                    </NavLink>
                  )
                })}
            </nav>
          </header>

          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-[1440px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
