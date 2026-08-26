import { FormEvent, useEffect, useState } from 'react'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

export default function Securite() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [chargement, setChargement] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(false)

  const [ancienMotDePasse, setAncienMotDePasse] = useState('')
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const [voirAncien, setVoirAncien] = useState(false)
  const [voirNouveau, setVoirNouveau] = useState(false)
  const [voirConfirmation, setVoirConfirmation] = useState(false)

  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true

    async function chargerUtilisateur() {
      setChargement(true)
      setErreur('')

      const { data, error } = await supabase.auth.getUser()

      if (!actif) return

      if (error || !data?.user) {
        navigate('/connexion', { replace: true })
        return
      }

      setEmail(data.user.email || '')
      setChargement(false)
    }

    chargerUtilisateur()

    return () => {
      actif = false
    }
  }, [navigate])

  async function changerMotDePasse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErreur('')
    setMessage('')

    if (!ancienMotDePasse) {
      setErreur('Veuillez renseigner votre mot de passe actuel.')
      return
    }

    if (!nouveauMotDePasse) {
      setErreur('Veuillez renseigner votre nouveau mot de passe.')
      return
    }

    if (nouveauMotDePasse.length < 6) {
      setErreur('Le nouveau mot de passe doit contenir au moins 6 caractères.')
      return
    }

    if (nouveauMotDePasse !== confirmation) {
      setErreur('La confirmation du nouveau mot de passe ne correspond pas.')
      return
    }

    if (ancienMotDePasse === nouveauMotDePasse) {
      setErreur('Le nouveau mot de passe doit être différent de l’ancien.')
      return
    }

    if (!email) {
      setErreur('Impossible de récupérer votre adresse e-mail.')
      return
    }

    setSauvegarde(true)

    try {
      // Vérification du mot de passe actuel avant toute modification.
      const { error: connexionError } =
        await supabase.auth.signInWithPassword({
          email,
          password: ancienMotDePasse,
        })

      if (connexionError) {
        throw new Error('Votre mot de passe actuel est incorrect.')
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: nouveauMotDePasse,
      })

      if (updateError) {
        throw updateError
      }

      setAncienMotDePasse('')
      setNouveauMotDePasse('')
      setConfirmation('')
      setMessage('Votre mot de passe a été modifié avec succès.')
    } catch (err) {
      console.error('Erreur changement mot de passe:', err)

      setErreur(
        err instanceof Error
          ? err.message
          : 'Impossible de modifier votre mot de passe.',
      )
    } finally {
      setSauvegarde(false)
    }
  }

  if (chargement) {
    return (
      <section className="flex min-h-[calc(100vh-180px)] items-center justify-center bg-[#F7F5F1] px-4">
        <div className="rounded-2xl bg-white px-6 py-5 text-sm font-semibold text-slate-500 shadow-sm">
          Chargement de votre sécurité…
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-[calc(100vh-180px)] bg-[#F7F5F1] px-4 py-10 sm:px-6 lg:py-14">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/compte/parametres"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-orange-600"
        >
          <ArrowLeft size={17} />
          Retour aux paramètres
        </Link>

        <div className="mt-6 mb-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
            Paramètres du compte
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0B1E3D]">
            Sécurité
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Protégez votre compte et modifiez votre mot de passe en toute sécurité.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 p-6 sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <ShieldCheck size={23} />
            </div>

            <div>
              <h2 className="font-black text-[#0B1E3D]">
                Mot de passe
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Modification sécurisée de votre mot de passe
              </p>
            </div>
          </div>

          <form
            onSubmit={changerMotDePasse}
            className="space-y-5 p-6 sm:p-7"
          >
            <div>
              <label
                htmlFor="ancien-mot-de-passe"
                className="mb-1.5 block text-sm font-bold text-slate-700"
              >
                Mot de passe actuel
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="ancien-mot-de-passe"
                  type={voirAncien ? 'text' : 'password'}
                  value={ancienMotDePasse}
                  onChange={(event) => setAncienMotDePasse(event.target.value)}
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  disabled={sauvegarde}
                />

                <button
                  type="button"
                  onClick={() => setVoirAncien((value) => !value)}
                  aria-label={
                    voirAncien
                      ? 'Masquer le mot de passe actuel'
                      : 'Afficher le mot de passe actuel'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#0B1E3D]"
                  disabled={sauvegarde}
                >
                  {voirAncien ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="nouveau-mot-de-passe"
                className="mb-1.5 block text-sm font-bold text-slate-700"
              >
                Nouveau mot de passe
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="nouveau-mot-de-passe"
                  type={voirNouveau ? 'text' : 'password'}
                  value={nouveauMotDePasse}
                  onChange={(event) => setNouveauMotDePasse(event.target.value)}
                  autoComplete="new-password"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  disabled={sauvegarde}
                />

                <button
                  type="button"
                  onClick={() => setVoirNouveau((value) => !value)}
                  aria-label={
                    voirNouveau
                      ? 'Masquer le nouveau mot de passe'
                      : 'Afficher le nouveau mot de passe'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#0B1E3D]"
                  disabled={sauvegarde}
                >
                  {voirNouveau ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Minimum 6 caractères.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmation-mot-de-passe"
                className="mb-1.5 block text-sm font-bold text-slate-700"
              >
                Confirmer le nouveau mot de passe
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="confirmation-mot-de-passe"
                  type={voirConfirmation ? 'text' : 'password'}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="new-password"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  disabled={sauvegarde}
                />

                <button
                  type="button"
                  onClick={() => setVoirConfirmation((value) => !value)}
                  aria-label={
                    voirConfirmation
                      ? 'Masquer la confirmation'
                      : 'Afficher la confirmation'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#0B1E3D]"
                  disabled={sauvegarde}
                >
                  {voirConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {erreur && (
              <div
                role="alert"
                className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-700"
              >
                {erreur}
              </div>
            )}

            {message && (
              <div
                role="status"
                className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-5 text-emerald-700"
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={sauvegarde}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-5 text-sm font-black text-white transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LockKeyhole size={17} />
              {sauvegarde ? 'Modification…' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          Votre mot de passe n’est jamais enregistré dans ChinaShop-Benin.
        </p>
      </div>
    </section>
  )
}
