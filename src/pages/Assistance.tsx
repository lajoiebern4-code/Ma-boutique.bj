import { useState, useEffect } from 'react'
import {
  Headphones,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react'
import ChatAssistance from '../components/ChatAssistance'
import { supabase } from '../lib/supabase'

export default function Assistance() {
  const [chatOuvert, setChatOuvert] = useState(false)
  const [prenom, setPrenom] = useState('')
  const [clientConnecte, setClientConnecte] = useState(false)

  useEffect(() => {
    let actif = true

    async function charger() {
      if (!supabase) return
      const { data } = await supabase.auth.getSession()
      if (!actif) return

      if (data.session?.user) {
        setClientConnecte(true)
        const nom = (data.session.user.user_metadata?.nom as string) || ''
        const email = data.session.user.email || ''
        const p = nom.trim().split(' ')[0] || email.split('@')[0] || ''
        setPrenom(p)
      }
    }

    void charger()
    return () => {
      actif = false
    }
  }, [])

  return (
    <main className="min-h-[calc(100vh-180px)] bg-[#FFFFFF] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#FAF9F6] bg-white shadow-[0_30px_90px_rgba(118,84,198,0.12)] lg:grid-cols-[1.05fr_1fr]">

        {/* Panneau gauche — Marque */}
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#1E1B2E] via-[#2A2344] to-[#3B2D5F] p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#0F1B3D]/30 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#E8E4DC]/25 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_50%)]" />

          <div className="relative">
            <div className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/10 text-white backdrop-blur ring-1 ring-white/20">
                <Headphones size={20} strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight text-white">AndyShop-Bénin</p>
                <p className="text-[11px] font-medium text-white/60">Chine · Bénin</p>
              </div>
            </div>
          </div>

          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                Support disponible
              </span>
            </div>

            <h2 className="text-[32px] font-black leading-[1.1] tracking-tight text-white">
              Nous sommes là
              <br />
              pour vous aider.
            </h2>

            <p className="max-w-md text-sm leading-6 text-white/70">
              Une question sur une commande, une livraison ou un produit ? Notre équipe et notre assistant IA sont disponibles pour vous répondre rapidement.
            </p>

            <ul className="space-y-3.5 pt-4">
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                  <Sparkles size={16} />
                </span>
                <span className="text-sm font-semibold text-white/85">
                  Assistant IA disponible 24h/24
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                  <MessageCircle size={16} />
                </span>
                <span className="text-sm font-semibold text-white/85">
                  Support humain par WhatsApp
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                  <Clock size={16} />
                </span>
                <span className="text-sm font-semibold text-white/85">
                  Réponse sous 24h maximum
                </span>
              </li>
            </ul>
          </div>

          <div className="relative flex items-center gap-2 text-[11px] font-medium text-white/50">
            <ShieldCheck size={14} />
            <span>Support fiable · Équipe dédiée</span>
          </div>
        </aside>

        {/* Panneau droit — Options */}
        <section className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14">

          <div className="mb-8">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#0F1B3D]">
              Centre d'assistance
            </p>
            <h1 className="text-[26px] font-black leading-tight tracking-tight text-[#1A1A2E] sm:text-[30px]">
              {clientConnecte && prenom ? (
                <>
                  Bonjour <span className="text-[#0F1B3D]">{prenom}</span> 👋
                </>
              ) : (
                <>Comment pouvons-nous vous aider ?</>
              )}
            </h1>
            <p className="mt-2.5 text-sm leading-6 text-[#6B7280]">
              Choisissez le mode de contact qui vous convient.
            </p>
          </div>

          <div className="space-y-4">

            {/* Bloc Messagerie */}
            <div className="rounded-2xl border border-[#FAF9F6] bg-white p-5 shadow-sm transition-all hover:border-[#0F1B3D]/30 hover:shadow-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F1B3D] to-[#E8E4DC] text-white shadow-md shadow-[#0F1B3D]/20">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-[#1A1A2E]">Messagerie</h3>
                  <p className="text-[11px] font-semibold text-[#9A93A5]">
                    Réponse instantanée · 24h/24
                  </p>
                </div>
              </div>

              <ul className="mb-4 space-y-1.5 text-[13px] text-[#6B7280]">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#0F1B3D]" />
                  <span>Discutez avec notre assistant IA</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#0F1B3D]" />
                  <span>Réponse en quelques secondes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#0F1B3D]" />
                  <span>Transfert possible vers un humain</span>
                </li>
              </ul>

              <button
                type="button"
                onClick={() => setChatOuvert(true)}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1A1A2E] text-[13px] font-black text-white shadow-lg shadow-[#1A1A2E]/15 transition-all hover:bg-[#2A2344] active:scale-[0.99]"
              >
                <MessageCircle size={16} />
                Envoyer un message
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Bloc WhatsApp */}
            <a
              href="https://wa.me/22951517876?text=Bonjour%20AndyShop-B%C3%A9nin%2C%20j%27ai%20une%20question"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-[#FAF9F6] bg-white p-5 shadow-sm transition-all hover:border-[#25D366]/40 hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-md shadow-[#25D366]/25">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-[#1A1A2E]">WhatsApp</h3>
                  <p className="text-[11px] font-semibold text-[#9A93A5]">
                    Lun-Sam · 8h-18h
                  </p>
                </div>
              </div>

              <ul className="mb-4 space-y-1.5 text-[13px] text-[#6B7280]">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#25D366]" />
                  <span>Discutez avec un conseiller humain</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#25D366]" />
                  <span>Réponse en quelques minutes</span>
                </li>
              </ul>

              <div className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-[13px] font-black text-white shadow-lg shadow-[#25D366]/25 transition-all hover:bg-[#1EBE5A]">
                <MessageCircle size={16} />
                Ouvrir WhatsApp
              </div>
            </a>

          </div>

          {/* Info bas */}
          <div className="mt-8 flex items-center justify-center gap-2 text-[11px] font-semibold text-[#9A93A5]">
            <ShieldCheck size={13} className="text-[#0F1B3D]" />
            <span>Vos échanges sont confidentiels</span>
          </div>
        </section>
      </div>

      {/* Modal Chat */}
      <ChatAssistance ouvert={chatOuvert} onFermer={() => setChatOuvert(false)} />
    </main>
  )
}
