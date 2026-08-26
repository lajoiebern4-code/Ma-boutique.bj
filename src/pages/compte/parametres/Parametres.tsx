import {
  ArrowLeft,
  Bell,
  ChevronRight,
  LockKeyhole,
  Palette,
  ShieldCheck,
  UserRound,
  Gift,
  Trophy,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const options = [
  {
    to: '/compte/parametres/informations',
    icon: UserRound,
    titre: 'Mes informations',
    sousTitre: 'Nom, téléphone et informations personnelles',
  },
  {
    to: '/compte/parametres/securite',
    icon: LockKeyhole,
    titre: 'Sécurité',
    sousTitre: 'Mot de passe et sécurité du compte',
  },
  {
    to: '/compte/parametres/notifications',
    icon: Bell,
    titre: 'Notifications',
    sousTitre: 'Gérez les notifications que vous recevez',
  },
  {
    to: '/compte/parametres/preferences',
    icon: Palette,
    titre: 'Préférences',
    sousTitre: 'Personnalisez votre expérience ChinaShop',
  },
  {
    to: '/compte/parametres/confidentialite',
    icon: ShieldCheck,
    titre: 'Confidentialité',
    sousTitre: 'Gérez vos données et votre confidentialité',
  },
  {
    to: '/parrainage',
    icon: Gift,
    titre: 'Parrainage',
    sousTitre: 'Invitez vos proches et gagnez des crédits ChinaShop',
  },
  {
    to: '/compte/parametres/niveau',
    icon: Trophy,
    titre: 'Mon niveau',
    sousTitre: 'Suivez votre progression Bronze, Argent ou Or',
  },
]

export default function Parametres() {
  return (
    <section className="min-h-[calc(100vh-180px)] bg-[#F7F5F1] px-4 py-10 text-[#0B1E3D] sm:px-6 lg:py-14 dark:bg-[#0B1220] dark:text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5">
          <Link
            to="/compte"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"
          >
            <ArrowLeft size={18} />
            Retour à mon compte
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
            Espace client
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl">
            Paramètres
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Gérez les informations, la sécurité et les préférences de votre
            compte ChinaShop-Benin.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111827]">
          {options.map((option, index) => {
            const Icon = option.icon

            return (
              <Link
                key={option.to}
                to={option.to}
                className={`group flex items-center gap-4 px-5 py-5 transition hover:bg-slate-50 sm:px-6 dark:hover:bg-slate-800/60 ${
                  index !== options.length - 1
                    ? 'border-b border-slate-100'
                    : ''
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 transition group-hover:bg-orange-100">
                  <Icon size={22} />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-black text-[#0B1E3D] dark:text-white">
                    {option.titre}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-400 dark:text-slate-500">
                    {option.sousTitre}
                  </p>
                </div>

                <ChevronRight
                  size={19}
                  className="shrink-0 text-slate-300 transition dark:text-slate-600 group-hover:translate-x-0.5 group-hover:text-orange-500"
                />
              </Link>
            )
          })}
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400 dark:text-slate-500">
          Vos paramètres sont propres à votre compte client.
        </p>
      </div>
    </section>
  )
}
