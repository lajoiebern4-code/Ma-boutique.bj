import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'

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

      if (error) throw error

      if (!data?.user) {
        throw new Error('Connexion impossible.')
      }

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
    <section className="min-h-[calc(100vh-180px)] bg-[#F7F5F1] px-4 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-orange-600">
            ChinaShop-Benin
          </p>

          <h1 className="text-3xl font-black tracking-tight text-[#0B1E3D]">
            Bienvenue
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Connectez-vous à votre espace client.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(11,30,61,0.08)] sm:p-7">
          <form onSubmit={connecter} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-[#0B1E3D]"
              >
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
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-[#0B1E3D] outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  disabled={chargement}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="mot-de-passe"
                className="mb-2 block text-sm font-bold text-[#0B1E3D]"
              >
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
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm font-medium text-[#0B1E3D] outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  disabled={chargement}
                />

                <button
                  type="button"
                  onClick={() => setVoirMotDePasse((v) => !v)}
                  aria-label={
                    voirMotDePasse
                      ? 'Masquer le mot de passe'
                      : 'Afficher le mot de passe'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#0B1E3D]"
                  disabled={chargement}
                >
                  {voirMotDePasse ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {erreur && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-700"
              >
                {erreur}
              </div>
            )}

            <button
              type="submit"
              disabled={chargement}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#0284C7] px-5 text-sm font-black text-white shadow-[0_6px_20px_rgba(11,30,61,0.22)] transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {chargement ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
            Vous n'avez pas encore de compte ?{' '}
            <Link
              to="/inscription"
              className="font-black text-orange-600 hover:text-orange-700"
            >
              Créer un compte
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          Vous pouvez toujours commander sans créer de compte.
        </p>
      </div>
    </section>
  )
}
