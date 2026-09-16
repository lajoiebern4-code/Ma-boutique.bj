import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../lib/supabase'
import {
  BarChart3,
  ShoppingCart,
  Users,
  MessageSquare,
  MessageCircle,
  Package,
  BadgePercent,
  CreditCard,
  Image,
  Truck,
  Receipt,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Store,
  ShieldCheck,
} from 'lucide-react'

const sections = [
  {
    label: 'Pilotage',
    items: [
      { label: 'Dashboard', to: '/admin-cs2026/dashboard', icon: BarChart3 },
    ],
  },
  {
    label: 'Ventes',
    items: [
      { label: 'Commandes', to: '/admin-cs2026/commandes', icon: ShoppingCart },
      { label: 'Clients', to: '/admin-cs2026/clients', icon: Users },
      { label: 'Avis', to: '/admin-cs2026/avis', icon: MessageSquare },
      { label: 'Assistance', to: '/admin-cs2026/assistance', icon: MessageCircle },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { label: 'Produits', to: '/admin-cs2026/produits', icon: Package },
      { label: 'Promotions', to: '/admin-cs2026/promotions', icon: BadgePercent },
      { label: 'Photos', to: '/admin-cs2026/photos', icon: Image },
    ],
  },
  {
    label: 'Logistique',
    items: [
      { label: 'Livraison & Retrait', to: '/admin-cs2026/livraison', icon: Truck },
    ],
  },
  {
    label: 'Finances',
    items: [
      { label: 'Paiements', to: '/admin-cs2026/paiements', icon: CreditCard },
      { label: 'Factures', to: '/admin-cs2026/factures', icon: Receipt },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Notifications', to: '/admin-cs2026/notifications', icon: Bell },
      { label: 'Annonces', to: '/admin-cs2026/annonces', icon: Bell },
    ],
  },
  {
    label: 'Système',
    items: [
      { label: 'Paramètres', to: '/admin-cs2026/parametres', icon: Settings },
    ],
  },
]

function navigationItems() {
  return sections.flatMap((section) => section.items)
}

function NavItem({
  item,
  mobile = false,
  onNavigate,
  messagesAssistanceNonLus = 0,
}: {
  item: (typeof sections)[number]['items'][number]
  mobile?: boolean
  onNavigate?: () => void
  messagesAssistanceNonLus?: number
}) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'group relative flex items-center transition-all duration-200',
          mobile
            ? 'min-w-[145px] shrink-0 gap-2.5 rounded-2xl px-3.5 py-3'
            : 'gap-3 rounded-2xl px-3 py-2.5',
          isActive
            ? 'bg-[#E8F5FB] text-[#0284C7]'
            : 'text-slate-600 hover:bg-slate-50 hover:text-[#0B1E3D]',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !mobile && (
            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#0284C7]" />
          )}

          <span
            className={[
              'flex shrink-0 items-center justify-center rounded-xl transition',
              mobile ? 'h-9 w-9' : 'h-9 w-9',
              isActive
                ? 'bg-[#0284C7] text-white shadow-sm shadow-sky-200'
                : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#0284C7]',
            ].join(' ')}
          >
            <Icon size={17} strokeWidth={2.2} />
          </span>

          <span className="truncate text-[13px] font-bold">{item.label}</span>
                  {item.label === 'Assistance' && messagesAssistanceNonLus > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow-sm">
                      {messagesAssistanceNonLus > 99 ? '99+' : messagesAssistanceNonLus}
                    </span>
                  )}

          {isActive && !mobile && (
            <ChevronRight
              size={15}
              className="ml-auto text-[#0284C7]"
              strokeWidth={2.5}
            />
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Layout() {
  const { user, estAdmin, deconnexion } = useAuth()
  const location = useLocation()
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [messagesAssistanceNonLus, setMessagesAssistanceNonLus] = useState(0)

  useEffect(() => {
    let actif = true

    async function chargerMessagesNonLus() {
      const { count, error } = await supabase
        .from('cs_assistance_messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_type', 'client')
        .is('lu_at', null)

      console.log('===== DEBUG COMPTEUR ASSISTANCE =====')
      console.log('COUNT MESSAGES NON LUS:', count)
      console.log('ERREUR COMPTEUR:', error || 'AUCUNE')
      console.log('=====================================')

      if (!error && actif) {
        setMessagesAssistanceNonLus(count ?? 0)
      }
    }

    chargerMessagesNonLus()

    const actualiserCompteur = () => {
      chargerMessagesNonLus()
    }

    window.addEventListener(
      'cs-assistance-compteur-refresh',
      actualiserCompteur,
    )

    const channel = supabase
      .channel('admin-assistance-unread-counter')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cs_assistance_messages',
        },
        chargerMessagesNonLus,
      )
      .subscribe()

    return () => {
      actif = false
      window.removeEventListener(
        'cs-assistance-compteur-refresh',
        actualiserCompteur,
      )
      channel.unsubscribe()
    }
  }, [])

  const currentItem =
    navigationItems().find((item) => location.pathname.startsWith(item.to)) ||
    navigationItems()[0]

  const email = user?.email || 'Administrateur'
  const initiale = email.charAt(0).toUpperCase()

  const fermerMenu = () => setMenuOuvert(false)

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#0B1E3D]">
      <div className="flex min-h-screen">

        {/* SIDEBAR DESKTOP */}
        <aside className="hidden w-[278px] shrink-0 border-r border-slate-200/80 bg-white lg:flex lg:flex-col">
          <div className="px-5 pb-4 pt-5">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0284C7] text-white shadow-lg shadow-sky-100">
                <Store size={21} strokeWidth={2.2} />
              </div>

              <div className="min-w-0">
                <div className="truncate text-[15px] font-black tracking-tight">
                  ChinaShop<span className="text-orange-500">-Benin</span>
                </div>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Administration
                </p>
              </div>
            </div>
          </div>

          <div className="mx-5 mb-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-bold text-emerald-700">
              Système opérationnel
            </span>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 pb-5">
            <div className="space-y-5">
              {sections.map((section) => (
                <div key={section.label}>
                  <div className="mb-2 px-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {section.label}
                  </div>

                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <NavItem key={item.to} item={item} messagesAssistanceNonLus={messagesAssistanceNonLus} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B1E3D] text-sm font-black text-white">
                {initiale}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black text-[#0B1E3D]">
                  Administrateur
                </p>
                <p className="truncate text-[10px] font-medium text-slate-400">
                  {email}
                </p>
              </div>

              {estAdmin && (
                <ShieldCheck
                  size={17}
                  className="shrink-0 text-emerald-500"
                />
              )}
            </div>

            <button
              type="button"
              onClick={deconnexion}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* CONTENU */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* HEADER */}
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
            <div className="flex h-[72px] items-center justify-between px-4 sm:px-6 lg:px-8">

              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMenuOuvert(true)}
                  aria-label="Ouvrir le menu"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
                >
                  <Menu size={19} />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-sm font-black text-[#0B1E3D] sm:text-base">
                      {currentItem?.label || 'Administration'}
                    </h1>
                    <ChevronRight
                      size={14}
                      className="hidden text-slate-300 sm:block"
                    />
                    <span className="hidden text-xs font-semibold text-slate-400 sm:block">
                      ChinaShop-Benin
                    </span>
                  </div>

                  <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                    Espace d’administration
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 sm:flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-700">
                    En ligne
                  </span>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B1E3D] text-xs font-black text-white lg:hidden">
                  {initiale}
                </div>
              </div>
            </div>

            {/* NAV MOBILE */}
            <div className="border-t border-slate-100 px-3 py-2 lg:hidden">
              <nav className="flex gap-1 overflow-x-auto pb-0.5">
                {navigationItems().map((item) => (
                  <NavItem
                    key={item.to}
                    item={item}
                    messagesAssistanceNonLus={messagesAssistanceNonLus}
                    mobile
                    onNavigate={fermerMenu}
                  />
                ))}
              </nav>
            </div>
          </header>

          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-[1480px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* DRAWER MOBILE */}
      {menuOuvert && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={fermerMenu}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
          />

          <aside className="relative flex h-full w-[310px] max-w-[88vw] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0284C7] text-white">
                  <Store size={21} />
                </div>

                <div>
                  <div className="text-sm font-black">
                    ChinaShop<span className="text-orange-500">-Benin</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Administration
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fermerMenu}
                aria-label="Fermer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-5">
                {sections.map((section) => (
                  <div key={section.label}>
                    <div className="mb-2 px-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                      {section.label}
                    </div>

                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <NavItem
                          key={item.to}
                          item={item}
                          messagesAssistanceNonLus={messagesAssistanceNonLus}
                          onNavigate={fermerMenu}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </nav>

            <div className="border-t border-slate-100 p-4">
              <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B1E3D] text-sm font-black text-white">
                  {initiale}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black">Administrateur</p>
                  <p className="truncate text-[10px] font-medium text-slate-400">
                    {email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={deconnexion}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
