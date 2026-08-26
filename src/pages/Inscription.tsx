import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Inscription() {
  const navigate = useNavigate()

  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [voirMotDePasse, setVoirMotDePasse] = useState(false)
  const [voirConfirmation, setVoirConfirmation] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')

  async function inscrire(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur('')
    setMessage('')

    const nomPropre = nom.trim()
    const emailPropre = email.trim().toLowerCase()

    if (!nomPropre) {
      setErreur('Veuillez renseigner votre nom.')
      return
    }

    if (!emailPropre) {
      setErreur('Veuillez renseigner votre adresse e-mail.')
      return
    }

    if (motDePasse.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }

    setChargement(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: emailPropre,
        password: motDePasse,
        options: {
          data: {
            nom: nomPropre,
          },
        },
      })

      if (error) {
        throw error
      }

      if (data.session) {
        navigate('/compte', { replace: true })
        return
      }

      setMessage(
        'Votre compte a été créé. Vérifiez votre e-mail pour confirmer votre adresse avant de vous connecter.',
      )

      setMotDePasse('')
      setConfirmation('')
    } catch (err) {
      setErreur(
        err instanceof Error
          ? err.message
          : 'Impossible de créer le compte.',
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
            Créer mon compte
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Retrouvez plus facilement vos commandes, favoris et informations
            personnelles.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(11,30,61,0.08)] sm:p-7">
          <form onSubmit={inscrire} className="space-y-5">
            <div>
              <label
                htmlFor="nom"
                className="mb-2 block text-sm font-bold text-[#0B1E3D]"
              >
                Nom
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="nom"
                  type="text"
                  autoComplete="name"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Votre nom"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-[#0B1E3D] outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  disabled={chargement}
                />
              </div>
            </div>

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
                  autoComplete="new-password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="8 caractères minimum"
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

            <div>
              <label
                htmlFor="confirmation"
                className="mb-2 block text-sm font-bold text-[#0B1E3D]"
              >
                Confirmer le mot de passe
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="confirmation"
                  type={voirConfirmation ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="Retapez votre mot de passe"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm font-medium text-[#0B1E3D] outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  disabled={chargement}
                />

                <button
                  type="button"
                  onClick={() => setVoirConfirmation((v) => !v)}
                  aria-label={
                    voirConfirmation
                      ? 'Masquer la confirmation'
                      : 'Afficher la confirmation'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#0B1E3D]"
                  disabled={chargement}
                >
                  {voirConfirmation ? (
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

            {message && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-5 text-emerald-700"
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={chargement}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#0284C7] px-5 text-sm font-black text-white shadow-[0_6px_20px_rgba(11,30,61,0.22)] transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {chargement ? 'Création du compte…' : 'Créer mon compte'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
            Vous avez déjà un compte ?{' '}
            <Link
              to="/connexion"
              className="font-black text-orange-600 hover:text-orange-700"
            >
              Se connecter
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
