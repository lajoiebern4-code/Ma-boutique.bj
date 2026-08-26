import {
  ArrowLeft,
  Database,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Confidentialite() {
  return (
    <section className="min-h-[calc(100vh-180px)] bg-[#F7F5F1] px-4 py-10 text-[#0B1E3D] sm:px-6 lg:py-14 dark:bg-[#0B1220] dark:text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5">
          <Link
            to="/compte/parametres"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"
          >
            <ArrowLeft size={18} />
            Retour aux paramètres
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
            Espace client
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0B1E3D] dark:text-white sm:text-4xl">
            Confidentialité
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Comprenez quelles informations sont utilisées dans votre espace
            client et comment elles servent au fonctionnement de ChinaShop-Benin.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827] sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                <UserRound size={22} />
              </div>

              <div>
                <h2 className="font-black text-[#0B1E3D] dark:text-white">
                  Vos informations
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Votre nom et votre numéro de téléphone peuvent être utilisés
                  pour gérer votre compte, vos commandes et vous contacter
                  lorsque cela est nécessaire.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827] sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Database size={22} />
              </div>

              <div>
                <h2 className="font-black text-[#0B1E3D] dark:text-white">
                  Vos données de compte
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Les informations liées à votre compte, vos commandes et vos
                  favoris servent à vous fournir les fonctionnalités de votre
                  espace client.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827] sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h2 className="font-black text-[#0B1E3D] dark:text-white">
                  Protection du compte
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  L'accès aux informations de votre espace client est lié à
                  votre authentification. Ne partagez jamais vos identifiants
                  ou codes de connexion.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm leading-6 text-orange-900 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-200">
          Pour modifier vos informations personnelles, rendez-vous dans
          <Link
            to="/compte/parametres/informations"
            className="ml-1 font-black underline underline-offset-2"
          >
            Mes informations
          </Link>
          .
        </div>
      </div>
    </section>
  )
}
