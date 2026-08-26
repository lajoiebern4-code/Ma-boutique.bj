import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Gift,
  Share2,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function Parrainage() {
  const [copie, setCopie] = useState(false)

  const code = 'CS-PARRAIN'
  const lien = `${window.location.origin}/inscription?parrain=${code}`

  async function copierLien() {
    try {
      await navigator.clipboard.writeText(lien)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      setCopie(false)
    }
  }

  function partagerWhatsApp() {
    const texte = encodeURIComponent(
      `Rejoins ChinaShop-Benin avec mon lien de parrainage : ${lien}`,
    )

    window.open(
      `https://wa.me/?text=${texte}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <section className="min-h-[calc(100vh-180px)] bg-[#F7F5F1] px-4 py-10 text-[#0B1E3D] sm:px-6 lg:py-14 dark:bg-[#0B1220] dark:text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/compte/parametres"
          className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"
        >
          <ArrowLeft size={18} />
          Retour aux paramètres
        </Link>

        <div className="mt-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
            Espace client
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Parrainage
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Invitez vos proches à découvrir ChinaShop-Benin et suivez vos
            récompenses depuis votre compte.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827]">
            <Users className="text-orange-600" size={24} />
            <p className="mt-4 text-xs font-bold text-slate-400">
              Filleuls
            </p>
            <p className="mt-1 text-2xl font-black">0</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827]">
            <Gift className="text-orange-600" size={24} />
            <p className="mt-4 text-xs font-bold text-slate-400">
              Récompenses
            </p>
            <p className="mt-1 text-2xl font-black">0 FCFA</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827]">
            <CheckCircle2 className="text-emerald-600" size={24} />
            <p className="mt-4 text-xs font-bold text-slate-400">
              Crédits disponibles
            </p>
            <p className="mt-1 text-2xl font-black">0 FCFA</p>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#111827] sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
              <Gift size={23} />
            </div>

            <div>
              <h2 className="font-black">Votre code de parrainage</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Partagez ce code avec vos proches.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Code
            </p>

            <p className="mt-2 text-2xl font-black tracking-widest text-orange-600">
              {code}
            </p>
          </div>

          <div className="mt-4 break-all rounded-2xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {lien}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={copierLien}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-5 text-sm font-black text-white transition hover:bg-[#0369A1]"
            >
              <Copy size={18} />
              {copie ? 'Lien copié !' : 'Copier le lien'}
            </button>

            <button
              type="button"
              onClick={partagerWhatsApp}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-black text-white transition hover:bg-orange-700"
            >
              <Share2 size={18} />
              Partager
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#111827]">
          <h2 className="font-black">Comment ça fonctionne ?</h2>

          <div className="mt-5 space-y-4 text-sm text-slate-500 dark:text-slate-400">
            <p>
              <strong className="text-[#0B1E3D] dark:text-white">1.</strong>{' '}
              Partagez votre lien de parrainage.
            </p>

            <p>
              <strong className="text-[#0B1E3D] dark:text-white">2.</strong>{' '}
              Votre proche crée son compte avec votre lien.
            </p>

            <p>
              <strong className="text-[#0B1E3D] dark:text-white">3.</strong>{' '}
              Le système enregistre automatiquement le parrainage.
            </p>

            <p>
              <strong className="text-[#0B1E3D] dark:text-white">4.</strong>{' '}
              Les récompenses sont créditées lorsque les conditions du
              programme sont remplies.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
