import { useState, useEffect } from 'react'
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
  const [messageIndex, setMessageIndex] = useState(0)

  const messages = [
    'Bon retour !',
    'Prêt à vous aider',
    'Connectez-vous',
    'Bienvenue'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 3000)
      return () => clearInterval(interval)
    }, [])

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
        err instanceof Error ? err.message : 'Impossible de vous connecter.',
      )
    } finally {
      setChargement(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-180px)] bg-[#FAF9FC] px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
      {/* Décorations légères */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#7654C6]/[0.06] blur-3xl" />
        <div className="absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-[#8B6DD1]/[0.07] blur-3xl" />
        <div className="absolute left-1/2 top-24 h-2 w-2 -translate-x-1/2 rounded-full bg-[#7654C6]/20" />
      </div>

      <div className="relative mx-auto w-full max-w-[520px]">
        {/* Identité */}
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#7654C6] to-[#8B6DD1] text-white shadow-lg shadow-[#7654C6]/20">
              <Sparkles size={20} strokeWidth={2.4} />
            </div>

            <div className="text-left">
              <p className="text-[15px] font-black tracking-tight text-[#18151F]">
                ChinaShop-Bénin
              </p>
              <p className="text-[11px] font-semibold tracking-wide text-[#9A93A5]">
                Chine · Bénin
              </p>
            </div>
          </Link>
        </div>

        {/* Carte principale */}
        <section className="rounded-[30px] border border-[#E8E3EF] bg-white p-6 shadow-[0_24px_80px_rgba(118,84,198,0.10)] sm:p-9 lg:p-10">
          {/* En-tête */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#F1ECFA] text-[#7654C6]">
              <LockKeyhole size={24} strokeWidth={2} />
            </div>

            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#7654C6]">
              Espace client
            </p>

            <h1 className="text-3xl font-black tracking-tight text-[#18151F] sm:text-[34px]">
              Bienvenue chez vous.
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#6F687A]">
              Connectez-vous pour retrouver vos commandes et accéder à votre espace ChinaShop.
            </p>
          </div>

          <form onSubmit={connecter} className="space-y-5">
            {/* E-mail */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-[#18151F]"
              >
                Adresse e-mail
              </label>

              <div className="group relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A93A5] transition-colors group-focus-within:text-[#7654C6]"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  disabled={chargement}
                  className="h-14 w-full rounded-[15px] border border-[#E8E3EF] bg-[#FAF9FC] pl-11 pr-4 text-sm font-semibold text-[#18151F] outline-none transition-all placeholder:text-[#9A93A5] focus:border-[#7654C6] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="mot-de-passe"
                  className="block text-sm font-bold text-[#18151F]"
                >
                  Mot de passe
                </label>

                <span className="text-xs font-semibold text-[#9A93A5]">
                  Sécurisé
                </span>
              </div>

              <div className="group relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A93A5] transition-colors group-focus-within:text-[#7654C6]"
                />

                <input
                  id="mot-de-passe"
                  type={voirMotDePasse ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="Votre mot de passe"
                  disabled={chargement}
                  className="h-14 w-full rounded-[15px] border border-[#E8E3EF] bg-[#FAF9FC] pl-11 pr-12 text-sm font-semibold text-[#18151F] outline-none transition-all placeholder:text-[#9A93A5] focus:border-[#7654C6] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                />

                <button
                  type="button"
                  onClick={() => setVoirMotDePasse((v) => !v)}
                  aria-label={
                    voirMotDePasse
                      ? 'Masquer le mot de passe'
                      : 'Afficher le mot de passe'
                  }
                  disabled={chargement}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[11px] p-2.5 text-[#9A93A5] transition-colors hover:bg-[#F1ECFA] hover:text-[#7654C6]"
                >
                  {voirMotDePasse ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Erreur */}
            {erreur && (
              <div
                role="alert"
                className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-700"
              >
                {erreur}
              </div>
            )}

            {/* Connexion */}
            <button
              type="submit"
              disabled={chargement}
              className="flex h-14 w-full items-center justify-center rounded-[15px] bg-[#7654C6] px-5 text-sm font-black text-white shadow-lg shadow-[#7654C6]/20 transition-all hover:bg-[#6544B3] hover:shadow-xl hover:shadow-[#7654C6]/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {chargement ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          {/* Inscription */}
          <div className="mt-7 border-t border-[#E8E3EF] pt-6 text-center">
            <p className="text-sm text-[#6F687A]">
              Vous n'avez pas encore de compte ?
            </p>

            <Link
              to="/inscription"
              className="mt-2 inline-flex items-center font-black text-[#7654C6] transition-colors hover:text-[#6544B3]"
            >
              Créer mon compte
              <span className="ml-1.5">→</span>
            </Link>
          </div>
        </section>

        {/* Sécurité / commande invité */}
        <div className="mt-5 flex items-center justify-center gap-2 text-center">
          <ShieldCheck size={15} className="shrink-0 text-[#7654C6]" />
          <p className="text-xs font-medium leading-5 text-[#9A93A5]">
            Connexion sécurisée · Vous pouvez aussi commander sans compte.
          </p>
        </div>
      </div>
    </main>
  )
}
