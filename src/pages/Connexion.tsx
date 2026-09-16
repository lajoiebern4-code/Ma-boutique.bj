import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { lierVisiteurAuCompte } from '../services/assistance'
import { lierCommandesAuCompte } from '../services/supabase'

export default function Connexion() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [voirMotDePasse, setVoirMotDePasse] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  async function connecter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur('')

    const emailPropre = email.trim().toLowerCase()

    if (!emailPropre || !motDePasse) {
      setErreur('Veuillez renseigner votre e-mail et votre mot de passe.')
      return
    }

    setChargement(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailPropre,
        password: motDePasse,
      })

      if (error) {
        console.error('ERREUR CONNEXION SUPABASE:', error)
        setErreur(`${error.message} (${error.code ?? 'sans code'})`)
        return
      }

      if (!data?.user) {
        throw new Error('Connexion impossible.')
      }

      await lierVisiteurAuCompte()
      await lierCommandesAuCompte()

      navigate('/compte', { replace: true })
    } catch (err) {
      setErreur(
        err instanceof Error
          ? err.message
          : 'Impossible de vous connecter.',
      )
    } finally {
      setChargement(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-180px)] bg-[#F7F5F1] px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(11,30,61,0.12)] lg:grid-cols-[0.9fr_1.1fr]">

        <div className="relative hidden overflow-hidden bg-[#0B1E3D] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 shadow-lg">
                <Sparkles size={21} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight">ChinaShop-Benin</p>
                <p className="text-xs font-medium text-white/55">Votre shopping, autrement.</p>
              </div>
            </div>

            <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-orange-400">
              Espace client
            </p>

            <h2 className="max-w-md text-4xl font-black leading-[1.05] tracking-tight">
              Retrouvez votre univers ChinaShop.
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-white/65">
              Commandes, suivi, informations personnelles et avantages :
              tout votre espace client au même endroit.
            </p>
          </div>

          <div className="relative mt-12 space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
              <ShieldCheck size={19} className="text-orange-400" />
              <span className="text-sm font-semibold text-white/80">
                Connexion sécurisée
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 lg:p-14">
          <div className="mx-auto max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0B1E3D] text-orange-400">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-[#0B1E3D]">ChinaShop-Benin</p>
                  <p className="text-xs font-medium text-slate-400">Espace client</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-orange-600">
                Bienvenue
              </p>
              <h1 className="text-3xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl">
                Bon retour.
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Connectez-vous pour accéder à votre espace ChinaShop.
              </p>
            </div>

            <form onSubmit={connecter} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-black text-[#0B1E3D]">
                  Adresse e-mail
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    disabled={chargement}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-[#0B1E3D] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="mot-de-passe" className="mb-2 block text-sm font-black text-[#0B1E3D]">
                  Mot de passe
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="mot-de-passe"
                    type={voirMotDePasse ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    placeholder="Votre mot de passe"
                    disabled={chargement}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm font-semibold text-[#0B1E3D] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />

                  <button
                    type="button"
                    onClick={() => setVoirMotDePasse((v) => !v)}
                    aria-label={voirMotDePasse ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    disabled={chargement}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#0B1E3D]"
                  >
                    {voirMotDePasse ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {erreur && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-700"
                >
                  {erreur}
                </div>
              )}

              <button
                type="submit"
                disabled={chargement}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#0B1E3D] px-5 text-sm font-black text-white shadow-[0_10px_30px_rgba(11,30,61,0.20)] transition hover:-translate-y-0.5 hover:bg-[#142b50] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {chargement ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>

            <div className="mt-8 rounded-2xl bg-[#F7F5F1] p-4 text-center">
              <p className="text-sm text-slate-500">
                Vous n'avez pas encore de compte ?
              </p>
              <Link
                to="/inscription"
                className="mt-1 inline-block text-sm font-black text-orange-600 transition hover:text-orange-700"
              >
                Créer mon compte →
              </Link>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
              Vous pouvez toujours commander sans créer de compte.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
