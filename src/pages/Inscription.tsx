import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
  UserRound,
  Gift,
  Truck,
  Package,
  Headphones,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { lierVisiteurAuCompte } from '../services/assistance'
import { lierCommandesAuCompte } from '../services/supabase'

function traduireErreurInscription(code: string | undefined, message: string): string {
  const c = (code || '').toLowerCase()
  const m = (message || '').toLowerCase()
  if (c === 'user_already_exists' || m.includes('already registered') || m.includes('already exists')) {
    return 'Un compte existe déjà avec cette adresse e-mail. Connectez-vous plutôt.'
  }
  if (c === 'weak_password' || m.includes('weak password') || m.includes('password should be')) {
    return 'Mot de passe trop faible. Utilisez au moins 8 caractères avec chiffres et lettres.'
  }
  if (c === 'invalid_email' || m.includes('invalid email')) {
    return 'Adresse e-mail invalide. Vérifiez votre saisie.'
  }
  if (c === 'over_email_send_rate_limit' || m.includes('rate limit')) {
    return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Problème de connexion internet. Vérifiez votre réseau.'
  }
  return "Impossible de créer le compte pour le moment. Réessayez."
}

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

  const forceMotDePasse = (() => {
    let score = 0
    if (motDePasse.length >= 8) score++
    if (/[A-Z]/.test(motDePasse)) score++
    if (/[0-9]/.test(motDePasse)) score++
    if (/[^A-Za-z0-9]/.test(motDePasse)) score++
    return score
  })()

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
            ...(parrainPropre ? { code_parrainage: parrainPropre } : {}),
          },
        },
      })

      if (error) {
        console.error('ERREUR INSCRIPTION SUPABASE:', error)
        setErreur(traduireErreurInscription(error.code, error.message))
        return
      }

      if (data?.session) {
        await lierVisiteurAuCompte()
        await lierCommandesAuCompte()
        navigate('/compte', { replace: true })
        return
      }

      setMessage(
        'Compte créé ! Vérifiez votre boîte e-mail pour confirmer votre adresse avant de vous connecter.',
      )
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Impossible de créer le compte.")
    } finally {
      setChargement(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-180px)] bg-[#FAF9FC] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#E8E3EF] bg-white shadow-[0_30px_90px_rgba(118,84,198,0.12)] lg:grid-cols-[1.05fr_1fr]">
        {/* Panneau gauche — Marque */}
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#1E1B2E] via-[#2A2344] to-[#3B2D5F] p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#7654C6]/30 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#8B6DD1]/25 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_50%)]" />

          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/10 text-white backdrop-blur ring-1 ring-white/20">
                <Sparkles size={20} strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight text-white">ChinaShop-Bénin</p>
                <p className="text-[11px] font-medium text-white/60">Chine · Bénin</p>
              </div>
            </Link>
          </div>

          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Inscription gratuite</span>
            </div>

            <h2 className="text-[32px] font-black leading-[1.1] tracking-tight text-white">
              Rejoignez
              <br />
              ChinaShop-Bénin.
            </h2>

            <p className="max-w-md text-sm leading-6 text-white/70">
              Créez votre compte en 30 secondes et profitez de tous les avantages réservés à nos membres.
            </p>

            <ul className="space-y-3.5 pt-4">
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                  <Package size={16} />
                </span>
                <span className="text-sm font-semibold text-white/85">Commandez plus vite, sans ressaisir vos infos</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                  <Truck size={16} />
                </span>
                <span className="text-sm font-semibold text-white/85">Suivi en temps réel de vos livraisons</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                  <Gift size={16} />
                </span>
                <span className="text-sm font-semibold text-white/85">Parrainez vos proches et gagnez des avantages</span>
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
            <span>Inscription gratuite · Aucune carte requise</span>
          </div>
        </aside>

        {/* Panneau droit — Formulaire */}
        <section className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-12">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-gradient-to-br from-[#7654C6] to-[#8B6DD1] text-white shadow-md shadow-[#7654C6]/25">
                <Sparkles size={18} strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight text-[#18151F]">ChinaShop-Bénin</p>
                <p className="text-[10px] font-semibold text-[#9A93A5]">Chine · Bénin</p>
              </div>
            </Link>
          </div>

          <div className="mb-8">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#7654C6]">Nouveau compte</p>
            <h1 className="text-[28px] font-black leading-tight tracking-tight text-[#18151F] sm:text-[32px]">
              Créer votre compte.
            </h1>
            <p className="mt-2.5 text-sm leading-6 text-[#6F687A]">
              Quelques informations et c'est parti.
            </p>
          </div>

          <form onSubmit={inscrire} className="space-y-4">
            <div>
              <label htmlFor="nom" className="mb-2 block text-[13px] font-bold text-[#18151F]">Nom complet</label>
              <div className="group relative">
                <UserRound size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A93A5] transition-colors group-focus-within:text-[#7654C6]" />
                <input
                  id="nom"
                  type="text"
                  autoComplete="name"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Votre nom complet"
                  disabled={chargement}
                  className="h-[52px] w-full rounded-[13px] border border-[#E8E3EF] bg-[#FAF9FC] pl-11 pr-4 text-sm font-semibold text-[#18151F] outline-none transition-all placeholder:text-[#9A93A5] focus:border-[#7654C6] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-[13px] font-bold text-[#18151F]">Adresse e-mail</label>
              <div className="group relative">
                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A93A5] transition-colors group-focus-within:text-[#7654C6]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  disabled={chargement}
                  className="h-[52px] w-full rounded-[13px] border border-[#E8E3EF] bg-[#FAF9FC] pl-11 pr-4 text-sm font-semibold text-[#18151F] outline-none transition-all placeholder:text-[#9A93A5] focus:border-[#7654C6] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="mot-de-passe" className="mb-2 block text-[13px] font-bold text-[#18151F]">Mot de passe</label>
              <div className="group relative">
                <LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A93A5] transition-colors group-focus-within:text-[#7654C6]" />
                <input
                  id="mot-de-passe"
                  type={voirMotDePasse ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="Au moins 8 caractères"
                  disabled={chargement}
                  className="h-[52px] w-full rounded-[13px] border border-[#E8E3EF] bg-[#FAF9FC] pl-11 pr-12 text-sm font-semibold text-[#18151F] outline-none transition-all placeholder:text-[#9A93A5] focus:border-[#7654C6] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                />
                <button
                  type="button"
                  onClick={() => setVoirMotDePasse((v) => !v)}
                  aria-label={voirMotDePasse ? 'Masquer' : 'Afficher'}
                  disabled={chargement}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[10px] p-2.5 text-[#9A93A5] transition-colors hover:bg-[#F1ECFA] hover:text-[#7654C6]"
                >
                  {voirMotDePasse ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {motDePasse.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < forceMotDePasse
                          ? forceMotDePasse <= 1
                            ? 'bg-red-400'
                            : forceMotDePasse === 2
                              ? 'bg-amber-400'
                              : forceMotDePasse === 3
                                ? 'bg-emerald-400'
                                : 'bg-emerald-500'
                          : 'bg-[#E8E3EF]'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmation" className="mb-2 block text-[13px] font-bold text-[#18151F]">Confirmer le mot de passe</label>
              <div className="group relative">
                <LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A93A5] transition-colors group-focus-within:text-[#7654C6]" />
                <input
                  id="confirmation"
                  type={voirConfirmation ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  disabled={chargement}
                  className="h-[52px] w-full rounded-[13px] border border-[#E8E3EF] bg-[#FAF9FC] pl-11 pr-12 text-sm font-semibold text-[#18151F] outline-none transition-all placeholder:text-[#9A93A5] focus:border-[#7654C6] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                />
                <button
                  type="button"
                  onClick={() => setVoirConfirmation((v) => !v)}
                  aria-label={voirConfirmation ? 'Masquer' : 'Afficher'}
                  disabled={chargement}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[10px] p-2.5 text-[#9A93A5] transition-colors hover:bg-[#F1ECFA] hover:text-[#7654C6]"
                >
                  {voirConfirmation ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {confirmation.length > 0 && motDePasse !== confirmation && (
                <p className="mt-1.5 text-[11px] font-semibold text-red-500">
                  Les mots de passe ne correspondent pas.
                </p>
              )}
              {confirmation.length > 0 && motDePasse === confirmation && (
                <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">
                  ✓ Les mots de passe correspondent.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="parrainage" className="mb-2 block text-[13px] font-bold text-[#18151F]">
                Code de parrainage <span className="font-medium text-[#9A93A5]">(optionnel)</span>
              </label>
              <div className="group relative">
                <Gift size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A93A5] transition-colors group-focus-within:text-[#7654C6]" />
                <input
                  id="parrainage"
                  type="text"
                  value={codeParrainage}
                  onChange={(e) => setCodeParrainage(e.target.value.toUpperCase())}
                  placeholder="Entrez votre code"
                  disabled={chargement}
                  className="h-[52px] w-full rounded-[13px] border border-[#E8E3EF] bg-[#FAF9FC] pl-11 pr-4 text-sm font-semibold uppercase tracking-wider text-[#18151F] outline-none transition-all placeholder:normal-case placeholder:tracking-normal placeholder:text-[#9A93A5] focus:border-[#7654C6] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                />
              </div>
            </div>

            {erreur && (
              <div role="alert" className="flex items-start gap-2.5 rounded-[12px] border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-semibold leading-5 text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{erreur}</span>
              </div>
            )}

            {message && (
              <div role="status" className="flex items-start gap-2.5 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[13px] font-semibold leading-5 text-emerald-700">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={chargement}
              className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#7654C6] px-5 text-sm font-black text-white shadow-lg shadow-[#7654C6]/25 transition-all hover:bg-[#6544B3] hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {chargement ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Création…
                </>
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <p className="pt-1 text-center text-[11px] leading-5 text-[#9A93A5]">
              En créant un compte, vous acceptez nos{' '}
              <Link to="/infos" className="font-bold text-[#7654C6] hover:text-[#6544B3]">conditions</Link>{' '}
              et notre{' '}
              <Link to="/infos" className="font-bold text-[#7654C6] hover:text-[#6544B3]">politique de confidentialité</Link>.
            </p>
          </form>

          <div className="mt-7 border-t border-[#F1ECFA] pt-6 text-center">
            <p className="text-[13px] text-[#6F687A]">
              Déjà un compte ?{' '}
              <Link to="/connexion" className="font-black text-[#7654C6] transition-colors hover:text-[#6544B3]">
                Se connecter →
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
