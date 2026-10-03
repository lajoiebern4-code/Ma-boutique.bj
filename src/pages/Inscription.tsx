import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Check,
  Eye,
  EyeOff,
  Gift,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { lierVisiteurAuCompte } from '../services/assistance'
import { lierCommandesAuCompte } from '../services/supabase'

export default function Inscription() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const parrainInitial = searchParams.get('parrain')?.trim() || ''

  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [codeParrainage, setCodeParrainage] = useState(parrainInitial)
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
    const parrainPropre = codeParrainage.trim()

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
            ...(parrainPropre
              ? { code_parrainage: parrainPropre }
              : {}),
          },
        },
      })

      if (error) {
        throw error
      }

      if (data.session) {
        await lierVisiteurAuCompte()
        await lierCommandesAuCompte()
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
    <main className="min-h-[calc(100vh-180px)] bg-[#FAF9FC] px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[18px] border border-[#E8E3EF] bg-white shadow-[0_2px_10px_rgba(24,21,31,0.05)] lg:grid-cols-[0.85fr_1.15fr]">

        <div className="relative hidden overflow-hidden bg-[#18151F] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-[#7654C6]/20 blur-3xl" />
          <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-[#7654C6]/10 blur-3xl" />

          <div className="relative">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#7654C6] shadow-sm">
                <Sparkles size={21} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-black">ChinaShop-Benin</p>
                <p className="text-xs font-medium text-white/55">Bienvenue dans votre shopping.</p>
              </div>
            </div>

            <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-[#8B6DD1]">
              Nouveau client
            </p>

            <h2 className="max-w-md text-4xl font-black leading-[1.05] tracking-tight">
              Votre espace ChinaShop commence ici.
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-white/65">
              Créez votre compte pour retrouver vos commandes, suivre vos
              achats et profiter plus facilement de votre expérience.
            </p>

            <div className="mt-8 space-y-3">
              {[
                'Suivez vos commandes facilement',
                'Retrouvez vos informations personnelles',
                'Partagez votre code de parrainage',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                    <Check size={14} className="text-[#8B6DD1]" />
                  </div>
                  <span className="text-sm font-semibold text-white/75">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-[10px] border border-white/10 bg-white/[0.06] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-white/40">
              Bon à savoir
            </p>
            <p className="mt-1 text-sm font-semibold text-white/75">
              La création d'un compte reste facultative pour commander.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-xl">
            <div className="mb-7 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#18151F] text-[#8B6DD1]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-[#18151F]">ChinaShop-Benin</p>
                  <p className="text-xs font-medium text-[#9A93A5]">Créer mon compte</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-[#7654C6]">
                Inscription
              </p>
              <h1 className="text-3xl font-black tracking-tight text-[#18151F] sm:text-4xl">
                Créez votre compte.
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-[#6F687A]">
                Quelques informations suffisent pour rejoindre votre espace
                client ChinaShop-Benin.
              </p>
            </div>

            <form onSubmit={inscrire} className="space-y-5">
              <div>
                <label htmlFor="nom" className="mb-2 block text-sm font-black text-[#18151F]">
                  Nom
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A93A5]"
                  />
                  <input
                    id="nom"
                    type="text"
                    autoComplete="name"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Votre nom"
                    disabled={chargement}
                    className="h-14 w-full rounded-[10px] border border-[#E8E3EF] bg-[#FAF9FC] pl-11 pr-4 text-sm font-semibold text-[#18151F] outline-none transition placeholder:text-[#9A93A5] focus:border-[#8B6DD1] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-black text-[#18151F]">
                  Adresse e-mail
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A93A5]"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    disabled={chargement}
                    className="h-14 w-full rounded-[10px] border border-[#E8E3EF] bg-[#FAF9FC] pl-11 pr-4 text-sm font-semibold text-[#18151F] outline-none transition placeholder:text-[#9A93A5] focus:border-[#8B6DD1] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                  />
                </div>
              </div>

              <div className="rounded-[10px] border border-[#E8E3EF] bg-[#F1ECFA] p-4">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFA] text-[#7654C6]">
                    <Gift size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#18151F]">
                      Vous avez un code de parrainage ?
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-[#6F687A]">
                      Facultatif. Vous pourrez le renseigner si quelqu'un vous a invité.
                    </p>
                  </div>
                </div>

                <input
                  id="code-parrainage"
                  type="text"
                  value={codeParrainage}
                  onChange={(e) => setCodeParrainage(e.target.value)}
                  placeholder="Ex. CS-PARRAIN"
                  disabled={chargement}
                  className="h-12 w-full rounded-xl border border-[#E8E3EF] bg-white px-4 text-sm font-bold uppercase tracking-wide text-[#18151F] outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-[#9A93A5] focus:border-[#8B6DD1] focus:ring-4 focus:ring-[#F1ECFA]"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="mot-de-passe" className="mb-2 block text-sm font-black text-[#18151F]">
                    Mot de passe
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A93A5]"
                    />

                    <input
                      id="mot-de-passe"
                      type={voirMotDePasse ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={motDePasse}
                      onChange={(e) => setMotDePasse(e.target.value)}
                      placeholder="8 caractères minimum"
                      disabled={chargement}
                      className="h-14 w-full rounded-[10px] border border-[#E8E3EF] bg-[#FAF9FC] pl-11 pr-12 text-sm font-semibold text-[#18151F] outline-none transition placeholder:text-[#9A93A5] focus:border-[#8B6DD1] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                    />

                    <button
                      type="button"
                      onClick={() => setVoirMotDePasse((v) => !v)}
                      aria-label={voirMotDePasse ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      disabled={chargement}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#9A93A5] hover:bg-[#F1ECFA]"
                    >
                      {voirMotDePasse ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmation" className="mb-2 block text-sm font-black text-[#18151F]">
                    Confirmation
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A93A5]"
                    />

                    <input
                      id="confirmation"
                      type={voirConfirmation ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      placeholder="Retapez le mot de passe"
                      disabled={chargement}
                      className="h-14 w-full rounded-[10px] border border-[#E8E3EF] bg-[#FAF9FC] pl-11 pr-12 text-sm font-semibold text-[#18151F] outline-none transition placeholder:text-[#9A93A5] focus:border-[#8B6DD1] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                    />

                    <button
                      type="button"
                      onClick={() => setVoirConfirmation((v) => !v)}
                      aria-label={voirConfirmation ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                      disabled={chargement}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#9A93A5] hover:bg-[#F1ECFA]"
                    >
                      {voirConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {erreur && (
                <div
                  role="alert"
                  className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-700"
                >
                  {erreur}
                </div>
              )}

              {message && (
                <div
                  role="status"
                  className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-5 text-emerald-700"
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={chargement}
                className="flex h-14 w-full items-center justify-center rounded-[10px] bg-[#18151F] px-5 text-sm font-black text-white shadow-[0_2px_10px_rgba(24,21,31,0.05)] transition  hover:bg-[#6544B3] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {chargement ? 'Création du compte…' : 'Créer mon compte'}
              </button>
            </form>

            <div className="mt-8 rounded-[10px] bg-[#FAF9FC] p-4 text-center">
              <p className="text-sm text-[#6F687A]">
                Vous avez déjà un compte ?
              </p>
              <Link
                to="/connexion"
                className="mt-1 inline-block text-sm font-black text-[#7654C6] transition hover:text-[#6544B3]"
              >
                Se connecter →
              </Link>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-[#9A93A5]">
              Vous pouvez toujours commander sans créer de compte.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
