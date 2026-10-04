import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Headphones,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Truck,
  CreditCard,
  RotateCcw,
  Package,
  UserRound,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  creerDemandeAssistance,
  envoyerEmailNouvelleDemande,
  listerMesDemandesAssistance,
  SUJETS_ASSISTANCE,
  type AssistanceDemande,
} from '../services/assistance-demandes'

const FAQ = [
  {
    id: 'livraison-1',
    categorie: 'Livraison',
    icone: Truck,
    question: 'Combien de temps pour recevoir ma commande ?',
    reponse: 'À Cotonou, la livraison est effectuée en moins de 24 heures. Pour les autres villes du Bénin, comptez 2 à 5 jours ouvrés selon la zone.',
  },
  {
    id: 'livraison-2',
    categorie: 'Livraison',
    icone: Truck,
    question: 'Livrez-vous partout au Bénin ?',
    reponse: 'Oui, nous livrons dans tout le Bénin. Les délais peuvent varier selon votre localisation. Vous pouvez aussi choisir le retrait sur place.',
  },
  {
    id: 'paiement-1',
    categorie: 'Paiement',
    icone: CreditCard,
    question: 'Quels moyens de paiement acceptez-vous ?',
    reponse: 'Nous acceptons Mobile Money (MTN, Moov), carte bancaire et paiement à la livraison pour certaines zones.',
  },
  {
    id: 'paiement-2',
    categorie: 'Paiement',
    icone: CreditCard,
    question: 'Puis-je payer à la livraison ?',
    reponse: 'Oui, le paiement à la livraison est disponible pour Cotonou et les grandes villes. Pour les zones éloignées, un acompte peut être demandé.',
  },
  {
    id: 'retour-1',
    categorie: 'Retour',
    icone: RotateCcw,
    question: 'Puis-je retourner un article ?',
    reponse: 'Oui, vous disposez de 7 jours après réception pour signaler un problème. L\'article doit être dans son état d\'origine.',
  },
  {
    id: 'produit-1',
    categorie: 'Produit',
    icone: Package,
    question: 'Les produits sont-ils vérifiés ?',
    reponse: 'Oui, chaque article est inspecté avant expédition. Nous garantissons sa conformité à la description.',
  },
]

export default function Assistance() {
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [sujet, setSujet] = useState<string>('Commande')
  const [message, setMessage] = useState('')

  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)
  const [clientConnecte, setClientConnecte] = useState(false)
  const [mesDemandes, setMesDemandes] = useState<AssistanceDemande[]>([])
  const [faqOuverte, setFaqOuverte] = useState<string | null>(null)
  const [categorieActive, setCategorieActive] = useState<string>('Tous')

  useEffect(() => {
    let actif = true

    async function charger() {
      if (!supabase) return
      const { data } = await supabase.auth.getSession()
      if (!actif) return

      if (data.session?.user) {
        setClientConnecte(true)
        const nomCompte =
          (data.session.user.user_metadata?.nom as string) || ''
        setNom(nomCompte)
        setEmail(data.session.user.email || '')

        const demandes = await listerMesDemandesAssistance()
        if (actif && demandes.success) {
          setMesDemandes(demandes.data)
        }
      }
    }

    void charger()
    return () => {
      actif = false
    }
  }, [])

  async function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur('')
    setSucces(false)

    if (!nom.trim()) {
      setErreur('Veuillez indiquer votre nom.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setErreur('Veuillez indiquer un email valide.')
      return
    }
    if (message.trim().length < 10) {
      setErreur('Votre message doit contenir au moins 10 caractères.')
      return
    }

    setEnvoi(true)

    try {
      const resultat = await creerDemandeAssistance({
        nom: nom.trim(),
        email: email.trim().toLowerCase(),
        sujet,
        message: message.trim(),
      })

      if (!resultat.success || !resultat.data) {
        throw new Error(resultat.error || "Impossible d'envoyer votre demande.")
      }

      void envoyerEmailNouvelleDemande(resultat.data.id)

      setSucces(true)
      setMessage('')

      if (clientConnecte) {
        const demandes = await listerMesDemandesAssistance()
        if (demandes.success) {
          setMesDemandes(demandes.data)
        }
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.")
    } finally {
      setEnvoi(false)
    }
  }

  const categories = ['Tous', ...Array.from(new Set(FAQ.map((f) => f.categorie)))]
  const faqFiltree =
    categorieActive === 'Tous'
      ? FAQ
      : FAQ.filter((f) => f.categorie === categorieActive)

  return (
    <main className="min-h-screen bg-[#FAF9FC] pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E1B2E] via-[#2A2344] to-[#3B2D5F] px-4 py-14 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#7654C6]/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#8B6DD1]/25 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/20">
            <Headphones size={26} />
          </div>

          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#FFB47A]">
            Centre d'assistance
          </p>

          <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {clientConnecte && nom ? (
              <>
                Bonjour <span className="text-[#FFB47A]">{nom.split(' ')[0]}</span> 👋
                <br />
                Comment pouvons-nous vous aider ?
              </>
            ) : (
              <>
                Comment pouvons-nous
                <br />
                vous aider ?
              </>
            )}
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
            Consultez notre centre d'aide ou envoyez-nous votre question. Notre équipe vous répond sous 24 heures.
          </p>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="relative mx-auto -mt-8 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">

          {/* Colonne gauche — FAQ + Contact */}
          <div className="space-y-4">
            {/* Centre d'aide */}
            <div className="rounded-2xl border border-[#E8E3EF] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1ECFA] text-[#7654C6]">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#18151F]">Centre d'aide</h2>
                  <p className="text-[12px] text-[#9A93A5]">Réponses immédiates</p>
                </div>
              </div>

              {/* Filtres */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategorieActive(cat)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                      categorieActive === cat
                        ? 'bg-[#7654C6] text-white'
                        : 'bg-[#F5F5F7] text-[#6F687A] hover:bg-[#F1ECFA] hover:text-[#7654C6]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Liste FAQ */}
              <div className="space-y-2">
                {faqFiltree.map((item) => {
                  const ouverte = faqOuverte === item.id
                  const Icone = item.icone
                  return (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-xl border border-[#F0F0F2] bg-[#FAF9FC] transition-colors hover:border-[#E8E3EF]"
                    >
                      <button
                        type="button"
                        onClick={() => setFaqOuverte(ouverte ? null : item.id)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icone size={15} className="shrink-0 text-[#7654C6]" />
                          <span className="text-[13px] font-bold text-[#18151F]">
                            {item.question}
                          </span>
                        </div>
                        <ChevronDown
                          size={16}
                          className={`shrink-0 text-[#9A93A5] transition-transform ${ouverte ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {ouverte && (
                        <div className="border-t border-[#F0F0F2] bg-white px-4 py-3 text-[12.5px] leading-6 text-[#6F687A]">
                          {item.reponse}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Contact direct */}
            <div className="rounded-2xl border border-[#E8E3EF] bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-[13px] font-black uppercase tracking-wider text-[#9A93A5]">
                Contacter directement
              </h3>

              <div className="space-y-2">
                <a
                  href="tel:+22900000000"
                  className="flex items-center gap-3 rounded-xl border border-[#F0F0F2] bg-[#FAF9FC] px-4 py-3 transition-colors hover:border-[#7654C6]/30 hover:bg-[#F1ECFA]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Phone size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#9A93A5]">Téléphone</p>
                    <p className="text-[13px] font-black text-[#18151F]">Lun-Sam · 8h-18h</p>
                  </div>
                  <ChevronRight size={16} className="text-[#9A93A5]" />
                </a>

                <a
                  href="mailto:lajoiebern4@gmail.com"
                  className="flex items-center gap-3 rounded-xl border border-[#F0F0F2] bg-[#FAF9FC] px-4 py-3 transition-colors hover:border-[#7654C6]/30 hover:bg-[#F1ECFA]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Mail size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#9A93A5]">Email</p>
                    <p className="truncate text-[13px] font-black text-[#18151F]">lajoiebern4@gmail.com</p>
                  </div>
                  <ChevronRight size={16} className="text-[#9A93A5] shrink-0" />
                </a>
              </div>
            </div>

            {/* Mes demandes (si connecté) */}
            {clientConnecte && mesDemandes.length > 0 && (
              <div className="rounded-2xl border border-[#E8E3EF] bg-white p-5 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-[13px] font-black uppercase tracking-wider text-[#9A93A5]">
                  <MessageSquare size={14} />
                  Mes demandes ({mesDemandes.length})
                </h3>

                <div className="space-y-2">
                  {mesDemandes.slice(0, 5).map((d) => (
                    <div
                      key={d.id}
                      className="rounded-xl border border-[#F0F0F2] bg-[#FAF9FC] p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-black text-[#18151F]">
                          {d.sujet}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                            d.statut === 'repondu'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {d.statut === 'repondu' ? 'Répondu' : 'En attente'}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11.5px] text-[#6F687A]">
                        {d.reponse ? `↳ ${d.reponse}` : d.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite — Formulaire */}
          <div className="rounded-2xl border border-[#E8E3EF] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1ECFA] text-[#7654C6]">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-[#18151F]">Envoyer une demande</h2>
                <p className="text-[12px] text-[#9A93A5]">Réponse par email sous 24h</p>
              </div>
            </div>

            {succes ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-lg font-black text-emerald-900">
                  Demande envoyée !
                </h3>
                <p className="mt-2 text-[13px] leading-6 text-emerald-800">
                  Nous avons bien reçu votre message. Un email de confirmation a été envoyé à <strong>{email}</strong>. Notre équipe vous répondra sous 24h.
                </p>
                <button
                  type="button"
                  onClick={() => setSucces(false)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-[13px] font-black text-white transition-colors hover:bg-emerald-700"
                >
                  Envoyer une autre demande
                </button>
              </div>
            ) : (
              <form onSubmit={envoyer} className="space-y-4">
                {!clientConnecte && (
                  <>
                    <div>
                      <label htmlFor="nom" className="mb-1.5 block text-[12px] font-bold text-[#18151F]">
                        Nom complet
                      </label>
                      <div className="relative">
                        <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A93A5]" />
                        <input
                          id="nom"
                          type="text"
                          value={nom}
                          onChange={(e) => setNom(e.target.value)}
                          placeholder="Votre nom"
                          disabled={envoi}
                          className="h-12 w-full rounded-xl border border-[#E8E3EF] bg-[#FAF9FC] pl-10 pr-4 text-[13px] font-semibold text-[#18151F] outline-none transition-all placeholder:text-[#9A93A5] focus:border-[#7654C6] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="mb-1.5 block text-[12px] font-bold text-[#18151F]">
                        Adresse email
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A93A5]" />
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="vous@exemple.com"
                          disabled={envoi}
                          className="h-12 w-full rounded-xl border border-[#E8E3EF] bg-[#FAF9FC] pl-10 pr-4 text-[13px] font-semibold text-[#18151F] outline-none transition-all placeholder:text-[#9A93A5] focus:border-[#7654C6] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                        />
                      </div>
                    </div>
                  </>
                )}

                {clientConnecte && (
                  <div className="flex items-center gap-2 rounded-xl bg-[#F1ECFA] px-3.5 py-2.5">
                    <CheckCircle2 size={14} className="text-[#7654C6]" />
                    <span className="text-[12px] font-semibold text-[#6544B3]">
                      Connecté en tant que <strong>{email}</strong>
                    </span>
                  </div>
                )}

                <div>
                  <label htmlFor="sujet" className="mb-1.5 block text-[12px] font-bold text-[#18151F]">
                    Sujet
                  </label>
                  <select
                    id="sujet"
                    value={sujet}
                    onChange={(e) => setSujet(e.target.value)}
                    disabled={envoi}
                    className="h-12 w-full rounded-xl border border-[#E8E3EF] bg-[#FAF9FC] px-3.5 text-[13px] font-semibold text-[#18151F] outline-none transition-all focus:border-[#7654C6] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                  >
                    {SUJETS_ASSISTANCE.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="mb-1.5 block text-[12px] font-bold text-[#18151F]">
                    Votre message
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Décrivez votre question en détail..."
                    rows={6}
                    disabled={envoi}
                    className="w-full resize-none rounded-xl border border-[#E8E3EF] bg-[#FAF9FC] p-3.5 text-[13px] font-medium leading-6 text-[#18151F] outline-none transition-all placeholder:text-[#9A93A5] focus:border-[#7654C6] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                  />
                  <div className="mt-1.5 flex justify-between text-[11px] text-[#9A93A5]">
                    <span>Minimum 10 caractères</span>
                    <span>{message.length} caractères</span>
                  </div>
                </div>

                {erreur && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[12.5px] font-semibold leading-5 text-red-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{erreur}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={envoi}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#7654C6] text-[13px] font-black text-white shadow-lg shadow-[#7654C6]/20 transition-all hover:bg-[#6544B3] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {envoi ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Envoi…
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Envoyer ma demande
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] leading-5 text-[#9A93A5]">
                  En envoyant ce message, vous acceptez d'être contacté par email.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Lien admin si connecté admin */}
        {clientConnecte && (
          <div className="mt-6 text-center">
            <Link
              to="/admin-cs2026/assistance"
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#7654C6] transition-colors hover:text-[#6544B3]"
            >
              Voir l'admin assistance →
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
