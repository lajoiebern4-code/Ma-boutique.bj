import {
  ArrowLeft,
  Check,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme, type ThemeMode } from '../../../context/ThemeContext'

const themes: {
  value: ThemeMode
  titre: string
  description: string
  icon: typeof Monitor
}[] = [
  {
    value: 'system',
    titre: 'Automatique',
    description: 'Suit automatiquement le thème de votre appareil.',
    icon: Monitor,
  },
  {
    value: 'light',
    titre: 'Clair',
    description: 'Utiliser l’apparence claire de ChinaShop.',
    icon: Sun,
  },
  {
    value: 'dark',
    titre: 'Sombre',
    description: 'Utiliser l’apparence sombre de ChinaShop.',
    icon: Moon,
  },
]

export default function Preferences() {
  const { theme, setTheme } = useTheme()

  return (
    <section className="min-h-[calc(100vh-180px)] bg-[#F7F5F1] px-4 py-10 sm:px-6 lg:py-14 dark:bg-[#0B1220]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5">
          <Link
            to="/compte/parametres"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-orange-600 dark:text-slate-400"
          >
            <ArrowLeft size={18} />
            Retour aux paramètres
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
            Espace client
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl dark:text-white">
            Préférences
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Personnalisez l’apparence de votre expérience ChinaShop-Benin.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111827]">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6 dark:border-slate-700">
            <h2 className="text-base font-black text-[#0B1E3D] dark:text-white">
              Apparence
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Choisissez comment ChinaShop doit s’afficher.
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {themes.map((option) => {
              const Icon = option.icon
              const active = theme === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className="flex w-full items-center gap-4 px-5 py-5 text-left transition hover:bg-slate-50 sm:px-6 dark:hover:bg-slate-800/60"
                  aria-pressed={active}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      active
                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <Icon size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-[#0B1E3D] dark:text-white">
                      {option.titre}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-400 dark:text-slate-500">
                      {option.description}
                    </p>
                  </div>

                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                      active
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-slate-300 text-transparent dark:border-slate-600'
                    }`}
                  >
                    <Check size={16} strokeWidth={3} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400 dark:text-slate-500">
          Votre choix d’apparence est enregistré sur cet appareil.
        </p>
      </div>
    </section>
  )
}
