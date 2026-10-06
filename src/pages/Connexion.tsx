import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Truck,
  Package,
  Headphones,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { lierVisiteurAuCompte } from '../services/assistance'
import { lierCommandesAuCompte } from '../services/supabase'

function traduireErreurConnexion(code: string | undefined, message: string): string {
  const c = (code || '').toLowerCase()
  const m = (message || '').toLowerCase()
  if (c === 'invalid_credentials' || m.includes('invalid login credentials')) {
    return "E-mail ou mot de passe incorrect. Vérifiez vos informations."
  }
  if (c === 'email_not_confirmed' || m.includes('email not confirmed')) {
    return "Votre e-mail n'a pas encore été confirmé. Vérifiez votre boîte de réception."
  }
  if (c === 'too_many_requests' || m.includes('too many')) {
    return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
  }
  if (c === 'user_not_found' || m.includes('user not found')) {
    return "Aucun compte n'est associé à cette adresse e-mail."
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Problème de connexion internet. Vérifiez votre réseau.'
  }
  return 'Impossible de vous connecter pour le moment. Réessayez.'
}

export default function Connexion() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [voirMotDePasse, setVoirMotDePasse] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [seSouvenir, setSeSouvenir] = useState(true)
  const [modeReset, setModeReset] = useState(false)
  const [resetChargement, setResetChargement] = useState(false)

  async function connecter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur('')
    setSucces('')
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
        setErreur(traduireErreurConnexion(error.code, error.message))
        return
      }
      if (!data?.user) throw new Error('Connexion impossible.')
      await lierVisiteurAuCompte()
      await lierCommandesAuCompte()
      navigate('/compte', { replace: true })
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Impossible de vous connecter.')
    } finally {
      setChargement(false)
    }
  }

  async function envoyerReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur('')
    setSucces('')
    const emailPropre = email.trim().toLowerCase()
    if (!emailPropre) {
      setErreur('Renseignez votre adresse e-mail pour réinitialiser.')
      return
    }
    setResetChargement(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailPropre, {
        redirectTo: window.location.origin + '/compte',
      })
      if (error) {
        console.error('ERREUR RESET SUPABASE:', error)
        setErreur("Impossible d'envoyer l'e-mail. Vérifiez l'adresse saisie.")
        return
      }
      setSucces('E-mail envoyé ! Consultez votre boîte de réception.')
      setTimeout(() => setModeReset(false), 4000)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setResetChargement(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-180px)] bg-[#FFFFFF] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#FAF9F6] bg-white shadow-[0_30px_90px_rgba(118,84,198,0.12)] lg:grid-cols-[1.05fr_1fr]">
        {/* Panneau gauche — Marque */}
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#1E1B2E] via-[#2A2344] to-[#3B2D5F] p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#0F1B3D]/30 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#E8E4DC]/25 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_50%)]" />

          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/10 text-white backdrop-blur ring-1 ring-white/20">
                <Sparkles size={20} strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight text-white">AndyShop-Bénin</p>
                <p className="text-[11px] font-medium text-white/60">Chine · Bénin</p>
              </div>
            </Link>
          </div>

          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Espace client sécurisé</span>
            </div>

            <h2 className="text-[32px] font-black leading-[1.1] tracking-tight text-white">
              Vos commandes,
              <br />
              à portée de main.
            </h2>

            <p className="max-w-md text-sm leading-6 text-white/70">
              Connectez-vous pour suivre vos livraisons, retrouver vos factures et profiter de vos avantages fidélité.
            </p>

            <ul className="space-y-3.5 pt-4">
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                  <Truck size={16} />
                </span>
                <span className="text-sm font-semibold text-white/85">Suivi en temps réel de vos colis</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                  <Package size={16} />
                </span>
                <span className="text-sm font-semibold text-white/85">Historique complet de vos achats</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                  <Headphones size={16} />
                </span>
                <span className="text-sm font-semibold text-white/85">Support dédié par chat</span>
              </li>
            </ul>
          </div>

          <div className="relative flex items-center gap-2 text-[11px] font-medium text-white/50">
            <ShieldCheck size={14} />
            <span>Données chiffrées · Connexion sécurisée</span>
          </div>
        </aside>

        {/* Panneau droit — Formulaire */}
        <section className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-gradient-to-br from-[#0F1B3D] to-[#E8E4DC] text-white shadow-md shadow-[#0F1B3D]/25">
                <Sparkles size={18} strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight text-[#1A1A2E]">AndyShop-Bénin</p>
                <p className="text-[10px] font-semibold text-[#9A93A5]">Chine · Bénin</p>
              </div>
            </Link>
          </div>

          {!modeReset ? (
            <>
              <div className="mb-8">
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#0F1B3D]">Espace client</p>
                <h1 className="text-[28px] font-black leading-tight tracking-tight text-[#1A1A2E] sm:text-[32px]">
                  Bienvenue chez vous.
                </h1>
                <p className="mt-2.5 text-sm leading-6 text-[#6B7280]">
                  Connectez-vous pour accéder à votre espace personnel.
                </p>
              </div>

              <form onSubmit={connecter} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-[13px] font-bold text-[#1A1A2E]">Adresse e-mail</label>
                  <div className="group relative">
                    <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A93A5] transition-colors group-focus-within:text-[#0F1B3D]" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      disabled={chargement}
                      className="h-[52px] w-full rounded-[13px] border border-[#FAF9F6] bg-[#FFFFFF] pl-11 pr-4 text-sm font-semibold text-[#1A1A2E] outline-none transition-all placeholder:text-[#9A93A5] focus:border-[#0F1B3D] focus:bg-white focus:ring-4 focus:ring-[#FAF9F6]"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="mot-de-passe" className="block text-[13px] font-bold text-[#1A1A2E]">Mot de passe</label>
                    <button
                      type="button"
                      onClick={() => { setModeReset(true); setErreur(''); setSucces('') }}
                      className="text-[12px] font-bold text-[#0F1B3D] transition-colors hover:text-[#C9A24B]"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="group relative">
                    <LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A93A5] transition-colors group-focus-within:text-[#0F1B3D]" />
                    <input
                      id="mot-de-passe"
                      type={voirMotDePasse ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={motDePasse}
                      onChange={(e) => setMotDePasse(e.target.value)}
                      placeholder="••••••••"
                      disabled={chargement}
                      className="h-[52px] w-full rounded-[13px] border border-[#FAF9F6] bg-[#FFFFFF] pl-11 pr-12 text-sm font-semibold text-[#1A1A2E] outline-none transition-all placeholder:text-[#9A93A5] focus:border-[#0F1B3D] focus:bg-white focus:ring-4 focus:ring-[#FAF9F6]"
                    />
                    <button
                      type="button"
                      onClick={() => setVoirMotDePasse((v) => !v)}
                      aria-label={voirMotDePasse ? 'Masquer' : 'Afficher'}
                      disabled={chargement}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[10px] p-2.5 text-[#9A93A5] transition-colors hover:bg-[#FAF9F6] hover:text-[#0F1B3D]"
                    >
                      {voirMotDePasse ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 select-none">
                  <span className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={seSouvenir}
                      onChange={(e) => setSeSouvenir(e.target.checked)}
                      disabled={chargement}
                      className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded-[6px] border-2 border-[#D9D2E5] bg-white transition-all checked:border-[#0F1B3D] checked:bg-[#0F1B3D] focus:outline-none focus:ring-2 focus:ring-[#FAF9F6]"
                    />
                    <CheckCircle2 size={12} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                  </span>
                  <span className="text-[12.5px] font-semibold text-[#6B7280]">Rester connecté</span>
                </label>

                {erreur && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-[12px] border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-semibold leading-5 text-red-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{erreur}</span>
                  </div>
                )}

                {succes && (
                  <div role="status" className="flex items-start gap-2.5 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[13px] font-semibold leading-5 text-emerald-700">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    <span>{succes}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={chargement}
                  className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#0F1B3D] !text-white px-5 text-sm font-black text-white shadow-lg shadow-[#0F1B3D]/25 transition-all hover:bg-[#C9A24B] hover:text-[#0F1B3D] hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {chargement ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Connexion…
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-7 border-t border-[#FAF9F6] pt-6 text-center">
                <p className="text-[13px] text-[#6B7280]">
                  Pas encore de compte ?{' '}
                  <Link to="/inscription" className="font-black text-[#0F1B3D] transition-colors hover:text-[#C9A24B]">
                    Créer un compte →
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-8">
                <button
                  type="button"
                  onClick={() => { setModeReset(false); setErreur(''); setSucces('') }}
                  className="mb-5 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0F1B3D] transition-colors hover:text-[#C9A24B]"
                >
                  <ArrowLeft size={15} />
                  Retour
                </button>
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#0F1B3D]">Mot de passe oublié</p>
                <h1 className="text-[26px] font-black leading-tight tracking-tight text-[#1A1A2E] sm:text-[30px]">
                  Réinitialiser votre accès.
                </h1>
                <p className="mt-2.5 text-sm leading-6 text-[#6B7280]">
                  Entrez votre e-mail, nous vous enverrons un lien pour définir un nouveau mot de passe.
                </p>
              </div>

              <form onSubmit={envoyerReset} className="space-y-5">
                <div>
                  <label htmlFor="email-reset" className="mb-2 block text-[13px] font-bold text-[#1A1A2E]">Adresse e-mail</label>
                  <div className="group relative">
                    <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A93A5] transition-colors group-focus-within:text-[#0F1B3D]" />
                    <input
                      id="email-reset"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      disabled={resetChargement}
                      className="h-[52px] w-full rounded-[13px] border border-[#FAF9F6] bg-[#FFFFFF] pl-11 pr-4 text-sm font-semibold text-[#1A1A2E] outline-none transition-all placeholder:text-[#9A93A5] focus:border-[#0F1B3D] focus:bg-white focus:ring-4 focus:ring-[#FAF9F6]"
                    />
                  </div>
                </div>

                {erreur && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-[12px] border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-semibold leading-5 text-red-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{erreur}</span>
                  </div>
                )}

                {succes && (
                  <div role="status" className="flex items-start gap-2.5 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[13px] font-semibold leading-5 text-emerald-700">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    <span>{succes}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetChargement}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#0F1B3D] !text-white px-5 text-sm font-black text-white shadow-lg shadow-[#0F1B3D]/25 transition-all hover:bg-[#C9A24B] hover:text-[#0F1B3D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resetChargement ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Envoi…
                    </>
                  ) : (
                    'Envoyer le lien'
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-8 flex items-center justify-center gap-3 text-[11px] font-semibold text-[#9A93A5]">
            <Link to="/infos" className="transition-colors hover:text-[#0F1B3D]">Conditions</Link>
            <span className="h-3 w-px bg-[#FAF9F6]" />
            <Link to="/infos" className="transition-colors hover:text-[#0F1B3D]">Confidentialité</Link>
            <span className="h-3 w-px bg-[#FAF9F6]" />
            <Link to="/infos" className="transition-colors hover:text-[#0F1B3D]">Aide</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
