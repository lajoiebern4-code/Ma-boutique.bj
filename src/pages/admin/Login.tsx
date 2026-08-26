import { FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail, ShieldCheck, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { user, estAdmin, connexion, chargement } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erreur, setErreur] = useState('')
  const [connexionEnCours, setConnexionEnCours] = useState(false)

  if (!chargement && user && estAdmin) {
    return <Navigate to="/admin-cs2026/dashboard" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErreur('')

    if (!email.trim() || !password) {
      setErreur('Veuillez renseigner votre email et votre mot de passe.')
      return
    }

    setConnexionEnCours(true)

    try {
      const utilisateur = await connexion(email, password)

      if (utilisateur?.id) {
        navigate('/admin-cs2026/dashboard', { replace: true })
      }
    } catch (error) {
      console.error('ERREUR LOGIN DETAILLEE:', error)
      setErreur(
        error instanceof Error
          ? error.message
          : 'Erreur inconnue lors de la connexion.',
      )
    } finally {
      setConnexionEnCours(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F5F1] px-4 py-8">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0284C7] text-white shadow-lg">
            <ShieldCheck size={30} strokeWidth={2} />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1E3D]">
            Administration
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Connectez-vous pour accéder à votre espace ChinaShop-Benin.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8"
        >
          {erreur && (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {erreur}
            </div>
          )}

          <div>
            <label
              htmlFor="admin-email"
              className="mb-2 block text-sm font-semibold text-[#0B1E3D]"
            >
              Adresse email
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@chinashop-benin.com"
                disabled={connexionEnCours}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-[#0B1E3D] outline-none transition focus:border-[#0B1E3D] focus:ring-4 focus:ring-[#0B1E3D]/10 disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="admin-password"
              className="mb-2 block text-sm font-semibold text-[#0B1E3D]"
            >
              Mot de passe
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Votre mot de passe"
                disabled={connexionEnCours}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-[#0B1E3D] outline-none transition focus:border-[#0B1E3D] focus:ring-4 focus:ring-[#0B1E3D]/10 disabled:bg-slate-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={connexionEnCours}
            className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-5 text-sm font-bold text-white transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {connexionEnCours ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Connexion…
              </>
            ) : (
              'Se connecter'
            )}
          </button>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <ShieldCheck
              size={18}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <p className="text-xs leading-5 text-slate-500">
              Accès réservé à l'administrateur autorisé. Les données
              d'administration restent protégées par l'authentification.
            </p>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          ChinaShop-Benin · Espace sécurisé
        </p>
      </section>
    </main>
  )
}
