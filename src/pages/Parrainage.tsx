import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Gift,
  MessageCircle,
  Share2,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Parrainage() {
  const [copieCode, setCopieCode] = useState(false)
  const [copieLien, setCopieLien] = useState(false)
  const [code, setCode] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    async function chargerProfil() {
      setChargement(true)
      setErreur('')

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw userError

        if (!user) {
          setErreur('Vous devez être connecté pour accéder à votre parrainage.')
          return
        }

        const { data, error } = await supabase
          .from('cs_profils_compte')
          .select('code_parrainage')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error

        if (!data?.code_parrainage) {
          setErreur('Votre code de parrainage est momentanément indisponible.')
          return
        }

        setCode(data.code_parrainage)
      } catch (err) {
        setErreur(
          err instanceof Error
            ? err.message
            : 'Impossible de récupérer votre code de parrainage.',
        )
      } finally {
        setChargement(false)
      }
    }

    void chargerProfil()
  }, [])

  const lien = code
    ? `${window.location.origin}/inscription?parrain=${encodeURIComponent(code)}`
    : ''

  async function copierCode() {
    if (!code) return

    try {
      await navigator.clipboard.writeText(code)
      setCopieCode(true)
      window.setTimeout(() => setCopieCode(false), 2000)
    } catch {
      setCopieCode(false)
    }
  }

  async function copierLien() {
    if (!lien) return

    try {
      await navigator.clipboard.writeText(lien)
      setCopieLien(true)
      window.setTimeout(() => setCopieLien(false), 2000)
    } catch {
      setCopieLien(false)
    }
  }

  function partagerWhatsApp() {
    if (!lien) return

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
    <section className="min-h-[calc(100vh-180px)] bg-[#F7F5F1] px-4 py-8 text-[#0B1E3D] sm:px-6 sm:py-12 lg:py-16 dark:bg-[#0B1220] dark:text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/compte/parametres"
          className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-500 shadow-sm transition hover:-translate-x-0.5 hover:border-orange-200 hover:text-orange-600 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-400 dark:hover:border-orange-900 dark:hover:text-orange-400"
        >
          <ArrowLeft size={16} />
          Retour aux paramètres
        </Link>

        <header className="relative mt-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-white p-6 shadow-[0_20px_60px_rgba(11,30,61,0.07)] sm:p-10 dark:border-slate-800 dark:bg-[#111827]">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-orange-100/70 blur-3xl dark:bg-orange-950/30" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-sky-100/70 blur-3xl dark:bg-sky-950/20" />

          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300">
              <Sparkles size={13} />
              Programme de parrainage
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
              Invitez vos proches.
              <span className="block text-orange-600 dark:text-orange-400">
                Partagez votre lien.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base dark:text-slate-400">
              Faites découvrir ChinaShop-Benin à votre entourage grâce à votre
              lien personnel de parrainage.
            </p>
          </div>
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_20px_60px_rgba(11,30,61,0.07)] dark:border-slate-800 dark:bg-[#111827]">
            <div className="border-b border-slate-100 p-6 sm:p-8 dark:border-slate-800">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
                  <Gift size={23} />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400">
                    Votre invitation
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    Votre code de parrainage
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Utilisez ce code ou votre lien pour inviter vos proches.
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-[1.5rem] border border-orange-100 bg-orange-50/70 p-5 sm:p-6 dark:border-orange-900/40 dark:bg-orange-950/20">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700 dark:text-orange-300">
                  Votre code
                </p>

                {chargement ? (
                  <div className="mt-4 h-12 w-48 animate-pulse rounded-xl bg-orange-100 dark:bg-orange-900/40" />
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <p className="break-all text-3xl font-black tracking-[0.18em] text-[#0B1E3D] sm:text-4xl dark:text-white">
                      {code || 'Indisponible'}
                    </p>

                    {code && (
                      <button
                        type="button"
                        onClick={copierCode}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 text-xs font-black text-orange-700 transition hover:border-orange-300 hover:bg-orange-50 dark:border-orange-900/50 dark:bg-[#111827] dark:text-orange-300 dark:hover:bg-orange-950/40"
                      >
                        {copieCode ? <Check size={16} /> : <Copy size={16} />}
                        {copieCode ? 'Copié' : 'Copier'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {erreur && (
                <div
                  role="alert"
                  className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                >
                  {erreur}
                </div>
              )}

              {lien && (
                <div className="mt-6">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    Votre lien personnel
                  </p>

                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {lien}
                    </div>

                    <button
                      type="button"
                      onClick={copierLien}
                      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#0B1E3D] px-3 text-xs font-black text-white transition hover:bg-[#142d54] dark:bg-white dark:text-[#0B1E3D] dark:hover:bg-slate-100"
                    >
                      {copieLien ? <Check size={15} /> : <Copy size={15} />}
                      <span className="hidden sm:inline">
                        {copieLien ? 'Copié' : 'Copier'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {lien && (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={partagerWhatsApp}
                    disabled={chargement}
                    className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-orange-600 px-5 text-sm font-black text-white shadow-[0_14px_35px_rgba(234,88,12,0.22)] transition hover:-translate-y-0.5 hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <MessageCircle
                      size={20}
                      className="transition group-hover:scale-110"
                    />
                    Partager sur WhatsApp
                    <Share2 size={17} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-[#0B1E3D] p-6 text-white shadow-[0_20px_60px_rgba(11,30,61,0.14)] sm:p-8 dark:border-slate-700">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Users size={22} />
            </div>

            <p className="mt-7 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
              Pourquoi partager ?
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Une invitation simple, directement depuis votre compte.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-300">
              Votre proche utilise votre lien lors de son inscription. Le code
              de parrainage est alors transmis avec son inscription.
            </p>

            <div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-6">
              <CheckCircle2 className="shrink-0 text-orange-300" size={20} />
              <p className="text-xs font-semibold leading-5 text-slate-300">
                Votre lien est personnel et prêt à être partagé.
              </p>
            </div>
          </div>
        </div>

        <section className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-[#111827]">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">
              En 3 étapes
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Comment ça fonctionne ?
            </h2>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
                  <Share2 size={19} />
                </div>
                <span className="text-3xl font-black text-slate-200 dark:text-slate-700">
                  01
                </span>
              </div>
              <h3 className="mt-5 font-black">Partagez</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Envoyez votre lien personnel à vos proches.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                  <UserPlus size={19} />
                </div>
                <span className="text-3xl font-black text-slate-200 dark:text-slate-700">
                  02
                </span>
              </div>
              <h3 className="mt-5 font-black">Inscription</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Votre proche crée son compte depuis votre invitation.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <CheckCircle2 size={19} />
                </div>
                <span className="text-3xl font-black text-slate-200 dark:text-slate-700">
                  03
                </span>
              </div>
              <h3 className="mt-5 font-black">Parrainage enregistré</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Le code est transmis avec l'inscription de votre proche.
              </p>
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}
