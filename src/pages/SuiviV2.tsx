import { Component, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Truck,
  Phone,
  Upload,
  CreditCard,
  Smartphone,
  ChevronRight,
  AlertCircle,
  MessageCircle,
  Star,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Calendar,
  Check,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { helix, quantum } from 'ldrs'

import {
  recupererMoyensPaiementActifs,
  initierPaiementAcompte,
  initierPaiementSolde,
  initierPaiementSoldeInvite,
  initierPaiementSoldeParSuiviV2,
  reinitierPaiementNormal,
  reinitierPaiementParSuivi,
  enregistrerReferenceTransaction,
  enregistrerReferenceTransactionNormal,
  enregistrerReferenceTransactionParSuiviV2,
  enregistrerReferenceTransactionParSuivi,
  enregistrerReferenceTransactionAcompteParSuivi,
  envoyerPreuvePaiement,
  envoyerPreuvePaiementConnecte,
  envoyerPreuvePaiementParSuivi,
  envoyerPreuvePaiementParSuiviV2,
  verifierCommandePaiementInvite,
  confirmerReceptionCommande,
  creerAvisClientCommande,
  recupererAvisClientCommande,
} from '../services/supabase'

helix.register()
quantum.register()

// ============ TYPES ============
type Etape = {
  id: string
  titre: string
  statut: 'termine' | 'en_cours' | 'attente'
  date?: string
  description?: string
}

type Transport = {
  id: string
  numero: string
  type: string
  origine: string
  destination: string
  statut: string
  departPrevu?: string
  departReel?: string
  arriveePrevue?: string
  arriveeReelle?: string
}

type Article = {
  id?: string
  produit_id?: string
  nom_produit?: string
  nom?: string

  prix_unitaire?: number
  quantite?: number
  origine?: string
  total_ligne?: number
}

type Commande = {
  id: string
  numero: string
  statut: string
  code_suivi: string
  code_retrait?: string
  mode_reception: 'livraison' | 'retrait'
  total: number
  acompte_requis: number
  acompte_paye: number
  solde_restant: number
  created_at: string
  livraisonStatut?: string
  pointDepart?: string
  pointDestination?: string
  departPrevu?: string
  departReel?: string
  arriveePrevue?: string
  arriveeReelle?: string
  articles: Article[]
  paiement?: {
    id: string
    statut: string
    reference_paiement?: string
    reference_transaction?: string
    preuve_uploaded_at?: string
  } | null
  livreur?: {
    nom: string
    telephone: string
  } | null
  etapes: Etape[]
  transport?: Transport
}

// ============ UTILITAIRES ============
const formatPrix = (v?: number) => {
  const n = Math.round(Number(v || 0))
  return `${n.toLocaleString('fr-FR').replace(/[\u00A0\u202F]/g, ' ')} FCFA`
}

const formatDate = (v?: string) => {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(d)
}

// ============ COMPOSANT: TIMELINE ============

function Timeline({ etapes }: { etapes: Etape[] }) {
  return (
    <div className="relative">
      <div className="space-y-5">
        {etapes.map((etape, idx) => {
          const estTermine = etape.statut === 'termine'
          const estEnCours = etape.statut === 'en_cours'
          const estAttente = etape.statut === 'attente'

          return (
            <div key={etape.id || idx} className="relative flex gap-4">
              {/* LIGNE VERTICALE */}
              {idx < etapes.length - 1 && (
                <div
                  className={`absolute left-[18px] top-10 bottom-0 w-0.5 ${
                    estTermine ? 'bg-emerald-400' : 'bg-[#FAF9F6]'
                  }`}
                />
              )}

              {/* POINT */}
              <div className="relative z-10 shrink-0">
                {estEnCours && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#0F1B3D]/30" />
                )}
                <div
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full ring-4 ring-white transition ${
                    estTermine
                      ? 'bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]'
                      : estEnCours
                        ? 'bg-[#0F1B3D] !text-white shadow-[0_2px_10px_rgba(118,84,198,0.4)]'
                        : 'bg-[#FAF9F6] text-[#9A93A5] ring-[#FFFFFF]'
                  }`}
                >
                  {estTermine ? (
                    <Check size={16} strokeWidth={3} />
                  ) : estEnCours ? (
                    <Clock3 size={16} strokeWidth={2.5} />
                  ) : (
                    <span className="text-[11px] font-black">{idx + 1}</span>
                  )}
                </div>
              </div>

              {/* CONTENU */}
              <div className="flex-1 pb-1">
                <div
                  className={`rounded-[12px] border px-4 py-3 transition ${
                    estEnCours
                      ? 'border-[#0F1B3D]/30 bg-[#FAF9F6]/60 shadow-[0_2px_12px_rgba(118,84,198,0.08)]'
                      : estTermine
                        ? 'border-emerald-100 bg-emerald-50/50'
                        : 'border-[#FAF9F6] bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4
                      className={`text-sm font-black ${
                        estAttente ? 'text-[#9A93A5]' : 'text-[#1A1A2E]'
                      }`}
                    >
                      {etape.titre}
                    </h4>

                    <div className="flex shrink-0 items-center gap-2">
                      {estEnCours && (
                        <span className="rounded-full bg-[#0F1B3D] !text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                          Actuel
                        </span>
                      )}
                      {estTermine && (
                        <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                          Fait
                        </span>
                      )}
                      {etape.date && (
                        <span className="text-[10px] font-bold text-[#9A93A5]">
                          {formatDate(etape.date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {etape.description && (
                    <p
                      className={`mt-1.5 text-xs leading-5 ${
                        estAttente ? 'text-[#9A93A5]' : 'text-[#6B7280]'
                      }`}
                    >
                      {etape.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
// ============ COMPOSANT: CARTE INFO ============
function InfoCard({ titre, valeur, icone: Icon, couleur = 'bleu' }: any) {
  const colors: Record<string, string> = {
    bleu: 'bg-[#FAF9F6] border-[#FAF9F6] text-[#0F1B3D]',
    orange: 'bg-orange-50 border-orange-100 text-orange-700',
    vert: 'bg-green-50 border-green-100 text-green-700',
    rouge: 'bg-red-50 border-red-100 text-red-700',
  }
  
  return (
    <div className={`rounded-[10px] border p-4 ${colors[couleur] || colors.bleu}`}>
      <div className="flex items-center gap-2">
        <Icon size={18} />
        <span className="text-xs font-bold uppercase tracking-wider opacity-70">{titre}</span>
      </div>
      <p className="mt-2 text-lg font-black">{valeur}</p>
    </div>
  )
}

// ============ COMPOSANT: PAIEMENT SOLDE ============
function PaiementSolde({
  commande,
  userId,
  onRefresh,
  afficherFormulaireInitialement = true,
}: {
  commande: Commande
  userId?: string
  onRefresh: () => void
  afficherFormulaireInitialement?: boolean
}) {
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(() => {
    // Lecture synchrone du token URL au premier rendu
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const urlToken = params.get('paiement_acces_token')?.trim()
      if (urlToken) return urlToken
    }
    return ''
  })
  const [isInvite, setIsInvite] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return !!params.get('paiement_acces_token')?.trim()    }
    return false
  })
  
  const [provider, setProvider] = useState('mtn')
  const [telephone, setTelephone] = useState('')
  const [fichier, setFichier] = useState<File | null>(null)
  const [moyens, setMoyens] = useState<any[]>([])
  const [reference, setReference] = useState<string | null>(null)
  const [paiementId, setPaiementId] = useState<string | null>(null)
  const [referenceTransaction, setReferenceTransaction] = useState('')
  const [referenceEnregistree, setReferenceEnregistree] = useState(false)
  const [preuveEnvoyee, setPreuveEnvoyee] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingPreuve, setLoadingPreuve] = useState(false)
  const [erreur, setErreur] = useState('')

  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)

  const modeSuivi = !isInvite && !!commande?.code_suivi
  const estCommandeStock =
    (commande?.articles?.length || 0) > 0 &&
    !commande.articles.some((article) => article.origine === 'sur_commande')
  const paiementStatut = String(commande?.paiement?.statut || '').toLowerCase()
  const paiementValideGlobal = paiementStatut === 'paye'
  const paiementRefuseNormal =
    paiementStatut === 'echec' &&
    commande.statut !== 'solde_requis'

  useEffect(() => {
    if (!commande.paiement?.id) return

    const paiementRefuseNormal =
      String(commande.paiement.statut || '').toLowerCase() === 'echec' &&
      commande.statut !== 'solde_requis'

    if (paiementRefuseNormal) {
      setPaiementId(null)
      setReference(null)
      setReferenceTransaction('')
      setReferenceEnregistree(false)
      setPreuveEnvoyee(false)
      return
    }

    setPaiementId(commande.paiement.id)
    setReference(commande.paiement.reference_paiement || null)

    if (commande.paiement.reference_transaction) {
      setReferenceTransaction(commande.paiement.reference_transaction)
      setReferenceEnregistree(true)
    }

    if (commande.paiement.preuve_uploaded_at) {
      setPreuveEnvoyee(true)
    }
  }, [modeSuivi, commande.paiement])

  // Récupérer token
  useEffect(() => {
    const urlToken = searchParams.get('paiement_acces_token')?.trim()
    if (urlToken) {
      setToken(urlToken)
      setIsInvite(true)
      return
    }
    
    try {
      const data = JSON.parse(sessionStorage.getItem('chinashop_commande_resultat') || '{}')
      if (
        !commande.code_suivi &&
        data?.numeroCommande === commande.numero &&
        data?.paiementAccesToken
      ) {
        setToken(data.paiementAccesToken)
        setIsInvite(true)
      }
    } catch (e) { /* ignore */ }
  }, [searchParams, commande.numero])



    // Charger le téléphone du client connecté pour l'initialisation de l'acompte
    useEffect(() => {
      if (isInvite || !userId) return

      let actif = true

      supabase
        .from('cs_commandes')
        .select('telephone')
        .eq('numero', commande.numero)
        .eq('client_user_id', userId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!actif) return

          if (error) {
            console.error('Erreur chargement téléphone commande:', error)
            return
          }

          setTelephone(data?.telephone || '')
        })

      return () => {
        actif = false
      }
    }, [isInvite, userId])

    // Charger moyens de paiement
    useEffect(() => {
      if (!userId && !token && !modeSuivi) return
      const paiementRefuseNormal =
        String(commande.paiement?.statut || '').toLowerCase() === 'echec' &&
        commande.statut !== 'solde_requis'

      const paiementNormalEnAttente =
        modeSuivi &&
        String(commande.paiement?.statut || '').toLowerCase() === 'en_attente' &&
        commande.statut !== 'solde_requis'

      if (
        commande.statut !== 'solde_requis' &&
        !paiementRefuseNormal &&
        !paiementNormalEnAttente
      ) return

      recupererMoyensPaiementActifs()
        .then(setMoyens)
        .catch(console.error)
    }, [userId, token, modeSuivi, commande.statut])

    const initier = useCallback(async () => {
      console.log('DEBUG CLICK PREPARER PAIEMENT', {
        codeSuivi: commande.code_suivi,
        numero: commande.numero,
        modeSuivi,
        isInvite,
        tokenPresent: !!token,
        paiementId,
        provider,
      })
      setLoading(true)
      setErreur('')

      try {
        let res

        if (isInvite && token) {
          res = await initierPaiementSoldeInvite(
            commande.numero,
            token,
            provider
          )
        } else if (
          modeSuivi &&
          commande.code_suivi &&
          !(
            String(commande.paiement?.statut || '').toLowerCase() === 'echec' &&
            commande.statut !== 'solde_requis'
          )
        ) {
          res = await initierPaiementSoldeParSuiviV2(
            commande.code_suivi,
            provider
          )
        } else if (
          modeSuivi &&
          String(commande.paiement?.statut || '').toLowerCase() === 'echec' &&
          commande.statut !== 'solde_requis'
        ) {
          if (commande.acompte_requis > commande.acompte_paye) {
            res = await initierPaiementAcompte(
              commande.numero,
              telephone,
              provider
            )
          } else if (!commande.client_user_id) {
            // Commande invité : utiliser le code_suivi
            res = await reinitierPaiementParSuivi(
              commande.code_suivi,
              provider
            )
          } else {
            res = await reinitierPaiementNormal(
              commande.numero,
              provider
            )
          }
        } else {
          res = await initierPaiementSolde(
            commande.numero,
            telephone,
            provider
          )
        }

        console.log('DEBUG PAIEMENT SOLDE INITIE:', res)
        if (!res?.success) throw new Error(res?.error || 'Échec')

        setReference(res.reference_paiement || res.reference || null)
          if (modeSuivi) setPaiementId(res.paiement_id || null)
        setMessage('Paiement initialisé. Effectuez le transfert.')
        onRefresh()
      } catch (err: any) {
        setErreur(err.message || 'Erreur')
      } finally {
        setLoading(false)
      }
    }, [commande.numero, commande.code_suivi, token, isInvite, modeSuivi, provider, telephone, onRefresh])

    const gererEnregistrementReferenceTransaction = useCallback(async () => {
      const pid = paiementId || commande.paiement?.id
      if (!commande.code_suivi || !pid) return

      const referenceSaisie = referenceTransaction.trim()

      if (!referenceSaisie) {
        setErreur('Veuillez saisir la référence de transaction.')
        return
      }

      setLoading(true)
      setErreur('')
      setMessage('')

      try {
        if (token) {
          await enregistrerReferenceTransaction(
            commande.numero,
            token,
            pid,
            referenceSaisie,
          )
        } else if (modeSuivi && estCommandeStock && user?.id) {
          await enregistrerReferenceTransactionNormal(
            commande.numero,
            pid,
            referenceSaisie,
          )
        } else if (commande.acompte_requis > commande.acompte_paye) {
          await enregistrerReferenceTransactionAcompteParSuivi(
            commande.code_suivi,
            pid,
            referenceSaisie,
          )
        } else {
          await enregistrerReferenceTransactionParSuivi(
            commande.code_suivi,
            pid,
            referenceSaisie,
          )
        }

        setReferenceEnregistree(true)
        setMessage(
          'Référence enregistrée. Vous pouvez maintenant envoyer votre preuve de paiement.',
        )
        onRefresh()
      } catch (err: any) {
        setErreur(err.message || 'Impossible d’enregistrer la référence de transaction.')
      } finally {
        setLoading(false)
      }
    }, [
      commande.code_suivi,
      paiementId,
      referenceTransaction,
      onRefresh,
    ])

    const envoyerPreuve = useCallback(async () => {
      if (!fichier || (modeSuivi ? !paiementId : !commande.paiement?.id)) return

      const paiementIdGaranti = paiementId ?? commande.paiement?.id
      if (!paiementIdGaranti) return

      setLoadingPreuve(true)
      setErreur('')

      try {
        if (isInvite && token) {
          await envoyerPreuvePaiement(
            commande.numero,
            token,
            commande.paiement!.id,
            fichier
          )
        } else if (modeSuivi && estCommandeStock) {
          await envoyerPreuvePaiementConnecte(
            commande.numero,
            paiementIdGaranti,
            fichier
          )
        } else if (modeSuivi && commande.code_suivi) {
          await envoyerPreuvePaiementParSuiviV2(
            commande.code_suivi,
            paiementIdGaranti,
            fichier
          )
        } else {
          await envoyerPreuvePaiementConnecte(
            commande.numero,
            commande.paiement!.id,
            fichier
          )
        }

        setFichier(null)
    setPreuveEnvoyee(true)
        setMessage('Preuve envoyée ! En attente de validation.')
        onRefresh()
      } catch (err: any) {
        setErreur(err.message || 'Erreur envoi')
      } finally {
        setLoadingPreuve(false)
      }
    }, [fichier, commande, paiementId, token, isInvite, modeSuivi, telephone, onRefresh])


  return (
    <div className="space-y-4">

      {paiementRefuseNormal && !showForm ? (
        <button
          type="button"
          onClick={() => {
      setShowForm(true)
      void initier()
    }}
          className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#0F1B3D] !text-white px-4 py-2.5 text-xs font-black text-white shadow-[0_6px_16px_rgba(24,21,31,0.06)] transition hover:bg-[#C9A24B] hover:text-[#0F1B3D] active:scale-[0.99]"
        >
          Soumettre à nouveau
          <CreditCard size={17} />
        </button>
      ) : null}

      <div className={paiementRefuseNormal && !showForm ? "hidden" : "space-y-3"}>

        {/* Moyens de paiement */}


        {modeSuivi ? (
          <div className="overflow-hidden rounded-[14px] border border-[#FAF9F6] bg-white shadow-[0_2px_10px_rgba(24,21,31,0.05)]">

            {!paiementId ? (
              <div className="p-4 sm:p-5">

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#FFCC00] shadow-sm">
                    <div className="flex h-6 w-7 items-center justify-center rounded-[45%] border-2 border-black bg-[#FFCC00]">
                      <span className="font-black text-[7px] leading-none tracking-[-0.09em] text-black">
                        MTN
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9A93A5]">
                      Paiement mobile
                    </p>

                  </div>

                  <span className="ml-auto shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                    Sécurisé
                  </span>
                </div>

                <div className="mt-4 rounded-[10px] border border-[#FAF9F6] bg-[#FFFFFF] px-4 py-3.5">
                    <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#9A93A5]">
                      Numéro AndyShop
                    </p>
                    <p className="mt-1 text-lg font-black tracking-tight text-[#1A1A2E]">
                      {moyens.find((m: any) => m.code === provider)?.numero || 'Numéro indisponible'}
                    </p>
                  </div>

                  <button
                  onClick={initier}
                  disabled={loading}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#0F1B3D] !text-white py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#C9A24B] hover:text-[#0F1B3D] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? 'Chargement...'
                    : paiementRefuseNormal
                      ? 'Réessayer le paiement'
                      : 'Préparer le paiement'}
                  <CreditCard size={16} />
                </button>

              </div>
            ) : preuveEnvoyee && referenceEnregistree ? (

              paiementValideGlobal ? (
                <div className="px-4 py-5 text-center">
                  <CheckCircle2 className="mx-auto text-emerald-600" size={38} />
                  <p className="mt-2 text-sm font-black text-emerald-700">
                    Paiement validé
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                    Votre paiement a été confirmé par notre équipe.
                  </p>
                </div>
              ) : (
                <div className="px-4 py-6 text-center">
                  <div className="relative mx-auto flex h-14 w-14 items-center justify-center">
                    <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/30" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-50 ring-1 ring-amber-200">
                      <Clock3 size={26} strokeWidth={2.5} className="text-amber-600" />
                    </div>
                  </div>
                  <p className="mt-4 text-base font-black text-[#1A1A2E]">
                    Paiement en cours de validation
                  </p>
                  <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-[#6B7280]">
                    Votre paiement a bien été reçu. Notre équipe vérifie votre référence et votre preuve.
                  </p>
                  <div className="mx-auto mt-4 flex max-w-xs items-start gap-2.5 rounded-[12px] border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-left">
                    <AlertCircle size={15} strokeWidth={2.5} className="mt-0.5 shrink-0 text-amber-600" />
                    <p className="text-[11px] font-bold leading-4 text-amber-800">
                      N'effectuez pas un second paiement.
                    </p>
                  </div>
                </div>
              )

            ) : (

              <div className="p-4 sm:p-5">

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFCC00] shadow-sm">

                      <div className="flex h-5 w-6 items-center justify-center rounded-[45%] border-2 border-black bg-[#FFCC00]">

                        <span className="font-black text-[6px] leading-none tracking-[-0.09em] text-black">

                          MTN

                        </span>

                      </div>

                    </div>

                  </div>

                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-emerald-700">
                    Sécurisé
                  </span>
                </div>

                <div className="mt-4">

                  <div className="rounded-[10px] border border-[#FAF9F6] bg-[#FFFFFF] px-4 py-3.5">
                    <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[#9A93A5]">
                      Numéro AndyShop
                    </p>
                    <p className="mt-1 text-base font-black tracking-tight text-[#1A1A2E]">
                      {moyens.find((m: any) => m.code === provider)?.numero || 'Numéro indisponible'}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-black text-[#1A1A2E]">
                    Référence de transaction
                  </label>
                  <p className="mt-1 text-[11px] leading-4 text-[#6B7280]">
                    La référence reçue après votre transfert Mobile Money.
                  </p>

                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={referenceTransaction}
                      onChange={e => setReferenceTransaction(e.target.value)}
                      placeholder="Référence de transaction"
                      disabled={loading || referenceEnregistree}
                      className="min-w-0 flex-1 rounded-[13px] border border-[#FAF9F6] bg-white px-3.5 py-3 text-sm font-bold text-[#1A1A2E] outline-none transition focus:border-[#0F1B3D] focus:ring-4 focus:ring-[#0F1B3D]/10 disabled:cursor-not-allowed disabled:bg-[#FFFFFF] disabled:text-[#9A93A5]"
                    />

                    {!referenceEnregistree && (
                      <button
                        onClick={gererEnregistrementReferenceTransaction}
                        className="shrink-0 rounded-[13px] bg-gradient-to-r from-[#C9A24B] to-[#F59E0B] px-4 py-3 text-xs font-black text-[#0F1B3D] transition hover:from-[#D97706] hover:to-[#F59E0B] disabled:cursor-not-allowed disabled:opacity-50"
                        className="shrink-0 rounded-[13px] bg-[#0F1B3D] !text-white px-4 py-3 text-xs font-black text-white transition hover:bg-[#C9A24B] hover:text-[#0F1B3D] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? '...' : 'Valider'}
                      </button>
                    )}
                  </div>

                  {referenceEnregistree && (
                    <p className="mt-2 text-[11px] font-bold text-emerald-600">
                      ✓ Référence enregistrée
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="text-xs font-black text-[#1A1A2E]">
                    Preuve de paiement
                  </label>
                  <p className="mt-1 text-[11px] leading-4 text-[#6B7280]">
                    Ajoutez une capture lisible de votre paiement.
                  </p>

                  <div className="mt-2 rounded-[15px] border border-dashed border-[#DCD5E8] bg-[#FFFFFF] px-3 py-3">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={!referenceEnregistree || preuveEnvoyee}
                      onChange={e => setFichier(e.target.files?.[0] || null)}
                      className="block w-full text-xs font-medium text-[#6B7280] file:mr-3 file:rounded-lg file:border-0 file:bg-[#0F1B3D] file:px-3 file:py-2 file:text-xs file:font-black file:text-white disabled:opacity-50"
                    />
                  </div>

                  {loadingPreuve ? (
                    <div className="mt-3 flex items-center justify-center gap-3 rounded-[14px] bg-[#FFFFFF] px-4 py-3">
                      <l-helix size="28" speed="2.5" color="black"></l-helix>
                      <p className="text-xs font-bold text-[#1A1A2E]">
                        Envoi de la preuve...
                      </p>
                    </div>
                  ) : fichier && !preuveEnvoyee ? (
                    <button
                      onClick={envoyerPreuve}
                      disabled={!referenceEnregistree}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-[13px] bg-[#0F1B3D] !text-white py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#C9A24B] hover:text-[#0F1B3D] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Envoyer la preuve
                      <Upload size={15} />
                    </button>
                  ) : null}
                </div>

              </div>
            )}
          </div>
        ) : (
          !reference ? (
            <div className="space-y-3">
              <button
                onClick={initier}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#0F1B3D] !text-white py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#C9A24B] hover:text-[#0F1B3D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Chargement...' : 'Obtenir la référence'}
                <CreditCard size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-sm font-black text-emerald-800">
                  Référence : {reference}
                </p>
                <p className="mt-0.5 text-xs text-emerald-700">
                  Effectuez le transfert puis envoyez la preuve.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setFichier(e.target.files?.[0] || null)}
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:bg-[#0F1B3D] file:px-3 file:py-2 file:text-xs file:font-black file:text-white"
                />

                {fichier && (
                  <button
                    onClick={envoyerPreuve}
                    disabled={loadingPreuve}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#0F1B3D] !text-white py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#C9A24B] hover:text-[#0F1B3D] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingPreuve ? 'Envoi...' : 'Envoyer la preuve'}
                    <Upload size={15} />
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {erreur && (
        <div className="flex items-start gap-3 rounded-[12px] border border-red-200 bg-red-50/60 px-4 py-3.5">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle size={14} strokeWidth={2.5} />
          </div>
          <p className="text-sm font-semibold leading-5 text-red-800">{erreur}</p>
        </div>
      )}

      {message && (
        <div className="flex items-start gap-3 rounded-[12px] border border-emerald-200 bg-emerald-50/60 px-4 py-3.5">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={14} strokeWidth={2.5} />
          </div>
          <p className="text-sm font-semibold leading-5 text-emerald-800">{message}</p>
        </div>
      )}
    </div>
  )
}

class SuiviErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#991b1b' }}>
          <h2>Erreur SuiviV2</h2>
          <p>{this.state.error.message}</p>
          <pre>{this.state.error.stack}</pre>
        </div>
      )
    }

    return this.props.children
  }
}

// ============ PAGE PRINCIPALE ============
function SuiviV2Page() {
  const [maintenant, setMaintenant] = useState(() => Date.now())

  useEffect(() => {
    const intervalle = window.setInterval(() => {
      setMaintenant(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalle)
  }, [])

  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [code, setCode] = useState('')
  const [commande, setCommande] = useState<Commande | null>(null)
  const [chargement, setChargement] = useState(false)
  const [confirmationReceptionEnCours, setConfirmationReceptionEnCours] = useState(false)
  const [erreur, setErreur] = useState('')
  const [avisCharge, setAvisCharge] = useState(false)
  const [avisDejaDepose, setAvisDejaDepose] = useState(false)
  const [noteAvis, setNoteAvis] = useState(0)
  const [commentaireAvis, setCommentaireAvis] = useState('')
  const [avisEnvoiEnCours, setAvisEnvoiEnCours] = useState(false)

  // Recherche
  const rechercher = useCallback(async (codeRecherche?: string) => {
    const valeur = (codeRecherche || code).trim().toUpperCase()
    if (valeur.length < 3) {
      setErreur('Code invalide')
      return
    }

    setChargement(true)
    setErreur('')
    
    try {
      const paiementAccesToken = searchParams.get('paiement_acces_token')?.trim()

      const { data, error } = paiementAccesToken
        ? await supabase.rpc('suivre_commande_avec_acces', {
            p_code_suivi: valeur,
            p_paiement_acces_token: paiementAccesToken
          })
        : await supabase.rpc('suivre_commande', {
            p_code_suivi: valeur
          })
      
      if (error) {
        console.error('ERREUR RPC SUIVI:', error)
        setErreur(`Erreur RPC: ${error.message || 'Erreur inconnue'}`)
        return
      }
      
      const resultat = Array.isArray(data) ? data[0] : data
      if (!resultat?.commande) {
        setErreur('Commande introuvable')
        return
      }
      
      // Debug retiré
      console.log("DEBUG COMMANDE FIELDS:", JSON.stringify(Object.keys(resultat?.commande || {}), null, 2))
      console.log("DEBUG TOTAL VALUE:", resultat?.commande?.total, resultat?.commande?.montant_total)
      // Mapper les données au format attendu
      const cmd = resultat.commande
      const mappedCommande: Commande = {
        id: cmd.id || '',
        numero: cmd.numero || '',
        statut: cmd.statut || '',
        code_suivi: cmd.code_suivi || '',
        code_retrait: cmd.code_retrait,
        mode_reception: cmd.mode_reception || 'livraison',
        total: Number(cmd.total) || 0,
        acompte_requis: Number(cmd.acompte_requis) || 0,
        acompte_paye: Number(cmd.acompte_paye) || 0,
        solde_restant: Number(cmd.solde_restant) || 0,
        created_at: cmd.created_at || '',
        livraisonStatut: cmd.livraison_statut || undefined,
        pointDepart: cmd.point_depart || undefined,
        pointDestination: cmd.point_destination || undefined,
        departPrevu: cmd.depart_prevu_at || undefined,
        departReel: cmd.depart_reel_at || undefined,
        arriveePrevue: cmd.arrivee_prevue_at || undefined,
        arriveeReelle: cmd.arrivee_reelle_at || undefined,
        articles: Array.isArray(resultat.articles)
          ? resultat.articles.map((a: any, idx: number) => ({
              id: a.id || String(idx),
              nom: a.nom || a.nom_produit || a.produit_nom || 'Article',
              quantite: Number(a.quantite ?? a.quantity ?? 1) || 1,
              prix_unitaire: Number(a.prix_unitaire ?? a.prix ?? a.price ?? 0) || 0,
              total_ligne: Number(a.total_ligne ?? a.total ?? 0) || 0,
        origine: a.origine || undefined
            }))
          : [],
        paiement: cmd.paiement || null,
        livreur: cmd.livreur_nom ? {
          nom: cmd.livreur_nom,
          telephone: cmd.livreur_telephone || ''
        } : null,
        etapes: Array.isArray(resultat.etapes) 
          ? resultat.etapes.map((e: any, idx: number) => ({
              id: e.id || String(idx),
              titre:
                e.statut === 'acompte_requis' ? 'Acompte requis' :
                e.statut === 'acompte_confirme' ? 'Acompte confirmé' :
                e.statut === 'achat_fournisseur' ? 'Achat fournisseur' :
                e.statut === 'preparation_chine' ? 'Préparation en Chine' :
                e.statut === 'chargee' ? 'Chargée' :
                e.statut === 'partie_chine' ? 'Partie de Chine' :
                e.statut === 'en_transit' ? 'En transit' :
                e.statut === 'arrivee_cotonou' ? 'Arrivée à Cotonou' :
                e.statut === 'solde_requis' ? 'Solde requis' :
                e.statut === 'solde_confirme' ? 'Solde confirmé' :
                e.statut === 'pret' ? 'Commande prête' :
                e.statut === 'confirmee' ? 'Commande confirmée' :
                e.statut === 'preparation' ? 'Préparation' :
                e.titre || e.statut || 'Étape',
              statut: e.statut === cmd.statut ? 'en_cours' :
                        e.position < (resultat.etapes.find((x: any) => x.statut === cmd.statut)?.position || 0) ? 'termine' : 'attente',
              date: e.date_etape || e.created_at,
              description: e.description
            }))
          : [],
        ...(resultat.transports?.[0] ? {
          transport: {
            id: resultat.transports[0].id || '',
            numero: resultat.transports[0].numero || '',
            type: resultat.transports[0].type_transport || 'avion',
            origine: resultat.transports[0].origine || 'Chine',
            destination: resultat.transports[0].destination || 'Cotonou',
            statut: resultat.transports[0].statut || '',
            departPrevu: resultat.transports[0].depart_prevu_at || undefined,
            departReel: resultat.transports[0].depart_reel_at || undefined,
            arriveePrevue: resultat.transports[0].arrivee_prevue_at || undefined,
            arriveeReelle: resultat.transports[0].arrivee_reelle_at || undefined
          }
        } : {})
      }
      
      console.log("SUIVI DEBUG mappedCommande:", mappedCommande)
      setCommande(mappedCommande)
      await chargerAvisClient(mappedCommande)
      
      // Récupérer les montants via l'API sécurisée si token disponible
      const urlToken = searchParams.get("paiement_acces_token")?.trim()
      if (urlToken && mappedCommande.numero) {
        try {
          const paiementInfo = await verifierCommandePaiementInvite(mappedCommande.numero, urlToken)
          if (paiementInfo?.success) {
            setCommande(prev => prev ? {
              ...prev,
              solde_restant: Number(paiementInfo.solde_restant) || prev.solde_restant,
              acompte_paye: Number(paiementInfo.acompte_paye) || prev.acompte_paye,
              acompte_requis: Number(paiementInfo.acompte_requis) || prev.acompte_requis,
              total: Number(paiementInfo.total) || prev.total,
              paiement: paiementInfo.paiement || prev.paiement
            } : null)
          }
        } catch (e) {
          console.warn("Impossible de récupérer les infos de paiement:", e)
        }
      }
    } catch (err) {
      setErreur('Erreur de recherche')
    } finally {
      setChargement(false)
    }
  }, [code])

  const confirmerReception = useCallback(async () => {
    if (!commande?.numero || confirmationReceptionEnCours) return

    setConfirmationReceptionEnCours(true)
    setErreur('')

    try {
      let paiementAccesToken =
        searchParams.get('paiement_acces_token')?.trim() || null

      if (!paiementAccesToken) {
        try {
          const data = JSON.parse(
            sessionStorage.getItem('chinashop_commande_resultat') || '{}',
          )

          if (data?.numeroCommande === commande.numero && data?.paiementAccesToken) {
            paiementAccesToken = String(data.paiementAccesToken).trim()
          }
        } catch (e) {
          // ignore
        }
      }

      const resultat = await confirmerReceptionCommande(
        commande.numero,
        paiementAccesToken,
      )

      if (!resultat?.success) {
        throw new Error(resultat?.error || 'Impossible de confirmer la réception.')
      }

      await rechercher(commande.code_suivi)
    } catch (err) {
      setErreur(
        err instanceof Error
          ? err.message
          : 'Impossible de confirmer la réception.',
      )
    } finally {
      setConfirmationReceptionEnCours(false)
    }
  }, [
    commande?.numero,
    commande?.code_suivi,
    confirmationReceptionEnCours,
    rechercher,
    searchParams,
  ])

  const chargerAvisClient = useCallback(async (commandeCible: Commande) => {
    if (!commandeCible?.numero) return

    setAvisCharge(false)

    try {
      let paiementAccesToken =
        searchParams.get('paiement_acces_token')?.trim() || null

      if (!paiementAccesToken) {
        try {
          const data = JSON.parse(
            sessionStorage.getItem('chinashop_commande_resultat') || '{}',
          )

          if (
            data?.numeroCommande === commandeCible.numero &&
            data?.paiementAccesToken
          ) {
            paiementAccesToken = String(data.paiementAccesToken).trim()
          }
        } catch (e) {
          // ignore
        }
      }

      const resultat = await recupererAvisClientCommande(
        commandeCible.numero,
        paiementAccesToken,
      )

      setAvisDejaDepose(Boolean(resultat?.a_depose))

      if (resultat?.a_depose) {
        setNoteAvis(Number(resultat.note) || 0)
        setCommentaireAvis(resultat.commentaire || '')
      }
    } catch (err) {
      console.warn('Impossible de récupérer l’avis client:', err)
    } finally {
      setAvisCharge(true)
    }
  }, [searchParams])

  const envoyerAvisClient = useCallback(async () => {
    if (!commande?.numero || avisEnvoiEnCours || noteAvis < 1 || noteAvis > 5) return

    setAvisEnvoiEnCours(true)
    setErreur('')

    try {
      let paiementAccesToken =
        searchParams.get('paiement_acces_token')?.trim() || null

      if (!paiementAccesToken) {
        try {
          const data = JSON.parse(
            sessionStorage.getItem('chinashop_commande_resultat') || '{}',
          )

          if (
            data?.numeroCommande === commande.numero &&
            data?.paiementAccesToken
          ) {
            paiementAccesToken = String(data.paiementAccesToken).trim()
          }
        } catch (e) {
          // ignore
        }
      }

      const resultat = await creerAvisClientCommande(
        commande.numero,
        noteAvis,
        commentaireAvis,
        paiementAccesToken,
      )

      if (!resultat?.success) {
        throw new Error(resultat?.error || 'Impossible d’envoyer votre avis.')
      }

      setAvisDejaDepose(true)
    } catch (err) {
      setErreur(
        err instanceof Error
          ? err.message
          : 'Impossible d’envoyer votre avis.',
      )
    } finally {
      setAvisEnvoiEnCours(false)
    }
  }, [
    commande?.numero,
    avisEnvoiEnCours,
    noteAvis,
    commentaireAvis,
    searchParams,
  ])

  // Recherche auto depuis URL
  useEffect(() => {
    const codeUrl = searchParams.get('code')?.trim()
    if (codeUrl) {
      setCode(codeUrl.toUpperCase())
      rechercher(codeUrl.toUpperCase())
    }
  }, [searchParams, rechercher])


  // Actualisation automatique du suivi après une modification admin
  useEffect(() => {
    if (!commande?.code_suivi) return

    const channel = supabase
      .channel(`suivi-commande-${commande.code_suivi}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cs_commandes',
          filter: `code_suivi=eq.${commande.code_suivi}`,
        },
        () => {
          rechercher(commande.code_suivi)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [commande?.code_suivi, rechercher])

  // Transformer les étapes pour la timeline
  const etapesTimeline: Etape[] = commande?.etapes || []

  if (!commande && !chargement) {
    return (
      <div className="min-h-screen bg-[#FFFFFF]">
        <section className="relative overflow-hidden bg-[#FFFFFF] px-5 pb-12 pt-12 text-[#1A1A2E] sm:px-8 sm:pb-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#6B7280]">
                Suivi de commande
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-6xl">
                Retrouvez votre commande.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-[#6B7280] sm:text-lg">
                Entrez votre code de suivi pour connaître l’avancement réel de votre commande,
                qu’elle soit disponible au Bénin, sur commande ou mixte.
              </p>
            </div>
          </div>
        </section>

        <section className="relative px-4 pb-16 sm:px-6">
          <div className="mx-auto -mt-7 max-w-3xl">
            <div className="rounded-[14px] border border-[#FAF9F6] bg-white p-5 shadow-[0_2px_10px_rgba(24,21,31,0.05)] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0F1B3D]">
                    Suivi sécurisé
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[#1A1A2E] sm:text-3xl">
                    Où en est votre commande ?
                  </h2>
                </div>

                <div className="hidden rounded-[10px] bg-[#FFFFFF] px-3 py-2 text-xs font-black text-[#6B7280] sm:block">
                  CR / CS
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                Utilisez le code reçu après votre commande pour accéder à son suivi.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="CR-XXXXXX / CS-XXXXXX"
                  className="min-w-0 flex-1 rounded-[14px] border border-[#FAF9F6] bg-[#FFFFFF] px-4 py-4 text-sm font-black uppercase tracking-wide text-[#1A1A2E] outline-none transition-all placeholder:text-[#9A93A5] focus:border-[#0F1B3D] focus:bg-white focus:ring-4 focus:ring-[#0F1B3D]/10"
                />

                <button
                  onClick={() => rechercher()}
                  disabled={chargement}
                  className="rounded-[14px] bg-[#0F1B3D] !text-white px-7 py-4 text-sm font-black text-white shadow-[0_2px_10px_rgba(24,21,31,0.05)] transition-all  hover:bg-[#C9A24B] hover:text-[#0F1B3D] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {chargement ? '...' : 'Suivre ma commande'}
                </button>
              </div>

              {erreur && (
                <p className="mt-3 text-sm font-bold text-red-600">{erreur}</p>
              )}

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#FAF9F6] pt-5 text-xs font-bold text-[#6B7280]">
                <span>✓ Suivi sécurisé</span>
                <span>✓ Informations actualisées</span>
                <span>✓ Parcours transparent</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-bold text-[#9A93A5]">
              <span>Disponible au Bénin</span>
              <span className="text-[#9A93A5]">•</span>
              <span>Sur commande</span>
              <span className="text-[#9A93A5]">•</span>
              <span>Commande mixte</span>
            </div>
          </div>
        </section>
      </div>
    )
  }
  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFFFF]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F1B3D] border-t-transparent" />
      </div>
    )
  }

  if (!commande) return null

  const statut = commande.statut

  const transportDepart = commande.transport?.departReel
    ? new Date(commande.transport.departReel).getTime()
    : null

  const transportArriveePrevue = commande.transport?.arriveePrevue
    ? new Date(commande.transport.arriveePrevue).getTime()
    : null

  const transportArriveeReelle = commande.transport?.arriveeReelle
    ? new Date(commande.transport.arriveeReelle).getTime()
    : null

  const progressionTransport = (() => {
    if (transportArriveeReelle) return 1
    if (!transportDepart || !transportArriveePrevue) return 0
    if (maintenant >= transportArriveePrevue) return 1
    if (maintenant <= transportDepart) return 0

    const duree = transportArriveePrevue - transportDepart
    const ecoule = maintenant - transportDepart

    return Math.max(0, Math.min(1, ecoule / duree))
  })()

  const transportEstArrive =
    Boolean(transportArriveeReelle) ||
    Boolean(transportArriveePrevue && maintenant >= transportArriveePrevue)

  const livraisonDepart = commande.departReel
    ? new Date(commande.departReel).getTime()
    : null

  const livraisonArriveePrevue = commande.arriveePrevue
    ? new Date(commande.arriveePrevue).getTime()
    : null

  const livraisonArriveeReelle = commande.arriveeReelle
    ? new Date(commande.arriveeReelle).getTime()
    : null

  const progressionLivraison = (() => {
    const livraisonStatut = String(commande.livraisonStatut || '').toLowerCase()

    if (
      statut === 'livree' ||
      livraisonStatut === 'livree' ||
      livraisonArriveeReelle
    ) {
      return 1
    }

    if (livraisonStatut === 'arrivee') {
      return 1
    }

    if (livraisonStatut === 'en_route') {
      const debut = livraisonDepart

      if (
        debut &&
        livraisonArriveePrevue &&
        livraisonArriveePrevue > debut
      ) {
        const dureeTotale = livraisonArriveePrevue - debut
        const tempsEcoule = maintenant - debut

        return Math.max(
          0.02,
          Math.min(0.97, tempsEcoule / dureeTotale),
        )
      }

      return 0.02
    }

    if (livraisonStatut === 'planifiee') {
      return 0
    }

    return 0
  })()

  const livraisonEstArrivee =
    Boolean(livraisonArriveeReelle) ||
    String(commande.livraisonStatut || '').toLowerCase() === 'arrivee' ||
    String(commande.livraisonStatut || '').toLowerCase() === 'livree'

    const estSoldeRequis = statut === 'solde_requis'
    const soldeDejaConfirme = commande.etapes.some(
      (etape) => etape.titre === 'Solde confirmé',
    )
  const estLivree = statut === 'livree' || statut === 'termine'
    const estCommandeStock =
      commande.articles.length > 0 &&
      !commande.articles.some((article) => article.origine === 'sur_commande')
      return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A2E]">
          <header className="relative overflow-hidden bg-gradient-to-br from-[#0F1B3D] via-[#E8E4DC] to-[#3B2D5F] text-white shadow-[0_20px_60px_rgba(118,84,198,0.25)]">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

            <div className="relative mx-auto max-w-5xl px-5 pb-8 pt-5 sm:px-8 sm:pb-10 sm:pt-6">
              {/* BARRE DU HAUT */}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
                  aria-label="Retour"
                >
                  <ArrowLeft size={18} strokeWidth={2.5} />
                </button>

                <div className="rounded-[10px] border border-white/20 bg-white/10 px-4 py-2.5 text-right backdrop-blur-sm">
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/90">
                    AndyShop
                  </div>
                  <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[9px] font-semibold text-white/70">
                    <ShieldCheck size={10} strokeWidth={2.5} />
                    Suivi sécurisé
                  </div>
                </div>
              </div>

              {/* TITRE + NUMÉRO */}
              <div className="mt-8 sm:mt-10">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/85">
                    Suivi de commande
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                    {commande.numero}
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${
                    estSoldeRequis
                      ? 'bg-amber-400 text-amber-950 shadow-sm'
                      : statut === 'pret'
                        ? 'bg-emerald-400 text-emerald-950 shadow-sm'
                        : statut === 'retire' || estLivree
                          ? 'bg-white text-[#0F1B3D] shadow-sm'
                          : 'bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-sm'
                  }`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {estSoldeRequis
                      ? 'Action requise'
                      : statut === 'pret'
                        ? 'Prête'
                        : statut === 'retire' || estLivree
                          ? 'Terminée'
                          : 'En cours'}
                  </span>
                </div>
              </div>

              {/* CARTES INFO */}
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[12px] border border-white/15 bg-white/10 px-4 py-3.5 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <KeyRound size={12} strokeWidth={2.5} className="text-white/70" />
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">
                      Code de suivi
                    </div>
                  </div>
                  <div className="mt-2 font-mono text-base font-black tracking-wide text-white">
                    {commande.code_suivi}
                  </div>
                </div>

                <div className="rounded-[12px] border border-white/15 bg-white/10 px-4 py-3.5 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} strokeWidth={2.5} className="text-white/70" />
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">
                      Commande créée
                    </div>
                  </div>
                  <div className="mt-2 text-sm font-bold text-white">
                    {formatDate(commande.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-5xl px-5 pb-16 sm:px-8">


              <section className="rounded-[14px] border border-[#FAF9F6] bg-white p-6 shadow-[0_2px_10px_rgba(24,21,31,0.05)] sm:p-8">
                <div className="flex items-start gap-4">
                  <div className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-[14px] border border-white/10 shadow-sm ${
                    estSoldeRequis ? 'bg-[#FFF0ED] text-[#0F1B3D]' : 'bg-[#FAF9F6] text-[#0F1B3D]'
                  }`}>
                    <Package size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-black uppercase tracking-[0.23em] text-[#9A93A5]">
                      Situation actuelle
                    </div>

                    {commande.mode_reception === 'retrait' ? (
                          <div className="mt-7">
                            {(() => {
                              const etapesRetrait = [
                                {
                                  numero: '1',
                                  titre: 'Commande enregistrée',
                                  message: 'Votre commande a bien été enregistrée. Nous préparons sa prise en charge.',
                                },
                                {
                                  numero: '2',
                                  titre: 'En préparation',
                                  message: 'Votre commande est actuellement en préparation. Nous vous informerons dès qu’elle sera prête.',
                                },
                                {
                                  numero: '3',
                                  titre: 'Prête au retrait',
                                  message: 'Votre commande est prête. Vous pouvez maintenant procéder à son retrait.',
                                },
                                {
                                  numero: '4',
                                  titre: 'Commande retirée',
                                  message: 'Votre commande a été retirée avec succès. Merci pour votre confiance.',
                                },
                              ]

                              const positionActuelle =
                                statut === 'retire' ? 3 :
                                statut === 'pret' ? 2 :
                                0

                              const indexDebut = Math.max(
                                0,
                                Math.min(positionActuelle - 1, etapesRetrait.length - 3)
                              )

                              const etapesVisibles = etapesRetrait.slice(
                                indexDebut,
                                indexDebut + 3
                              )

                              return (
                                <div className="relative">
                                  <div className="absolute bottom-5 left-[17px] top-5 w-px bg-[#FAF9F6]" />

                                  <div className="space-y-4">
                                    {etapesVisibles.map((etape) => {
                                      const numero = Number(etape.numero)

                                      const estActuelle =
                                        (statut === 'pret' && numero === 3) ||
                                        false

                                      const estTerminee =
                                        statut === 'retire' ||
                                        (statut === 'pret' && numero < 3)

                                      return (
                                        <div
                                          key={etape.numero}
                                          className="relative flex gap-4"
                                        >
                                          <div
                                            className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-sm ${
                                              estActuelle
                                                ? 'bg-[#0F1B3D] !text-white ring-4 ring-[#0F1B3D]/10 animate-pulse'
                                                : estTerminee
                                                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/10'
                                                  : 'bg-white text-[#9A93A5] ring-1 ring-[#FAF9F6]'
                                            }`}
                                          >
                                            {estTerminee && !estActuelle ? (
                                              <CheckCircle2 size={15} />
                                            ) : (
                                              <span className="text-[11px] font-black">
                                                {etape.numero}
                                              </span>
                                            )}
                                          </div>

                                          <div
                                            className={`min-w-0 flex-1 rounded-[20px] border p-4 transition-all ${
                                              estActuelle
                                                ? 'border-[#0F1B3D]/15 bg-[#FAF9F6] shadow-sm'
                                                : estTerminee
                                                  ? 'border-emerald-100 bg-emerald-50/40'
                                                  : 'border-[#FAF9F6] bg-white'
                                            }`}
                                          >
                                            <div className="flex items-start justify-between gap-3">
                                              <div className="min-w-0">
                                                <div
                                                  className={`text-[9px] font-black uppercase tracking-[0.16em] ${
                                                    estActuelle
                                                      ? 'text-[#0F1B3D]'
                                                      : estTerminee
                                                        ? 'text-emerald-600'
                                                        : 'text-[#9A93A5]'
                                                  }`}
                                                >
                                                  Étape {etape.numero}
                                                </div>

                                                <div
                                                  className={`mt-1.5 text-[15px] font-black tracking-tight ${
                                                    estActuelle
                                                      ? 'text-[#1A1A2E]'
                                                      : estTerminee
                                                        ? 'text-emerald-700'
                                                        : 'text-[#9A93A5]'
                                                  }`}
                                                >
                                                  {etape.titre}
                                                </div>
                                              </div>

                                              {estActuelle && (
                                                <span className="shrink-0 rounded-full bg-[#0F1B3D]/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-[#0F1B3D]">
                                                  En cours
                                                </span>
                                              )}
                                            </div>

                                            <p
                                              className={`mt-2 text-xs leading-5 ${
                                                estActuelle
                                                  ? 'text-[#6B7280]'
                                                  : estTerminee
                                                    ? 'text-emerald-700/70'
                                                    : 'text-[#9A93A5]'
                                              }`}
                                            >
                                              {etape.message}
                                            </p>

                                            {etape.numero === '3' &&
                                              statut === 'pret' &&
                                              commande.code_retrait && (
                                                <div className="mt-4 rounded-[14px] border border-[#0F1B3D]/15 bg-white p-4 shadow-sm">
                                                  <div className="text-[8px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                                                    Code de retrait
                                                  </div>

                                                  <div className="mt-1.5 text-lg font-black tracking-[0.14em] text-[#0F1B3D]">
                                                    {commande.code_retrait}
                                                  </div>

                                                  <div className="mt-1 text-[9px] leading-4 text-[#6B7280]">
                                                    Présentez ce code lors du retrait.
                                                  </div>
                                                </div>
                                              )}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                        ) : !estCommandeStock ? (
                        <div className="mt-7">
                          <div className="mb-6">
                            <h2 className="text-[26px] font-black leading-tight tracking-[-0.025em] text-[#1A1A2E] sm:text-3xl">
                              {estSoldeRequis
                                ? 'Votre commande est arrivée à Cotonou'
                                : commande.etapes.find(e => e.statut === 'en_cours')?.titre || 'Votre commande poursuit son parcours'}
                            </h2>

                            <p className="mt-2.5 max-w-2xl text-[13px] leading-6 text-[#6B7280] sm:text-sm">
                              {estSoldeRequis
                                ? 'Une dernière action est nécessaire avant la remise de votre commande.'
                                : 'Suivez ici chaque étape réelle du parcours de votre commande sur commande.'}
                            </p>
                          </div>

                            <div className="relative">
                              <div className="absolute bottom-5 left-[17px] top-5 w-px bg-[#FAF9F6]" />

                              <div className="space-y-4">
                                {(() => {
                                  const etapes = commande.etapes
                                  const indexActuel = etapes.findIndex(
                                    (etape) => etape.statut === 'en_cours'
                                  )
                                  const positionActuelle = indexActuel >= 0 ? indexActuel : 0
                                  const indexDebut = Math.max(
                                    0,
                                    Math.min(
                                      positionActuelle - 1,
                                      Math.max(0, etapes.length - 3)
                                    )
                                  )
                                  const etapesVisibles = etapes.slice(indexDebut, indexDebut + 3)

                                  return etapesVisibles.map((etape, index) => {
                                    const estActuelle = etape.statut === 'en_cours' && !estLivree
                                    const numeroEtape = indexDebut + index + 1

                                    return (
                                      <div
                                        key={etape.id || `${etape.statut}-${numeroEtape}`}
                                        className="relative flex gap-4"
                                      >
                                        <div
                                          className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-sm ${
                                            estActuelle
                                              ? 'bg-[#0F1B3D] !text-white ring-4 ring-[#0F1B3D]/10 animate-pulse'
                                              : 'bg-emerald-500 text-white ring-4 ring-emerald-500/10'
                                          }`}
                                        >
                                          {estActuelle ? (
                                            <Clock3 size={15} />
                                          ) : (
                                            <CheckCircle2 size={15} />
                                          )}
                                        </div>

                                        <div
                                          className={`min-w-0 flex-1 rounded-[20px] border p-4 ${
                                            estActuelle
                                              ? 'border-[#0F1B3D]/15 bg-[#FAF9F6] shadow-sm'
                                              : 'border-emerald-100 bg-emerald-50/40'
                                          }`}
                                        >
                                          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                            <div className="flex items-center gap-2">
                                              <span
                                                className={`text-[8px] font-black uppercase tracking-[0.16em] ${
                                                  estActuelle
                                                    ? 'text-[#0F1B3D]'
                                                    : 'text-emerald-600'
                                                }`}
                                              >
                                                Étape {numeroEtape}
                                              </span>

                                              {estActuelle && (
                                                <span className="rounded-full bg-[#0F1B3D]/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-[#0F1B3D]">
                                                  En cours
                                                </span>
                                              )}
                                            </div>

                                            {etape.date && (
                                              <span className="text-[10px] font-medium text-[#9A93A5]">
                                                {formatDate(etape.date)}
                                              </span>
                                            )}
                                          </div>

                                          <h3
                                            className={`mt-2 text-[15px] font-black leading-snug tracking-[-0.01em] ${
                                              estActuelle
                                                ? 'text-[#1A1A2E]'
                                                : 'text-emerald-700'
                                            }`}
                                          >
                                            {etape.titre}
                                          </h3>

                                          {etape.description && (
                                            <p
                                              className={`mt-1 text-xs leading-5 ${
                                                estActuelle
                                                  ? 'text-[#6B7280]'
                                                  : 'text-emerald-700/70'
                                              }`}
                                            >
                                              {etape.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })
                                })()}
                              </div>
                            </div>
                        </div>
                      ) : (
                        <div className="mt-7">
                          {(() => {
                          const statutCommande = String(commande.statut || '').toLowerCase()
                          const statutLivraison = String(commande.livraisonStatut || '').toLowerCase()

                          const progression =
                            ['livree', 'termine'].includes(statutCommande) ||
                            statutLivraison === 'livree' ||
                            livraisonEstArrivee
                              ? 4
                              : ['livraison_planifiee', 'livraison_en_cours'].includes(statutCommande) ||
                                ['planifiee', 'en_route', 'arrivee'].includes(statutLivraison) ||
                                Boolean(commande.departReel)
                              ? 3
                              : ['preparation', 'pret'].includes(statutCommande)
                              ? 2
                              : 1

                          return [
                            {
                              numero: '1',
                              titre: 'Commande enregistrée',
                              description:
                                'Votre commande a bien été enregistrée. Nous préparons sa prise en charge.',
                            },
                            {
                              numero: '2',
                              titre: 'En préparation',
                              description:
                                'Votre commande est actuellement en préparation. Nous vous informerons dès qu’elle sera prête.',
                            },
                            {
                              numero: '3',
                              titre: 'En livraison',
                              description:
                                'Votre commande est actuellement en route vers votre adresse.',
                            },
                            {
                              numero: '4',
                              titre: 'Commande livrée',
                              description:
                                'Votre commande a été livrée avec succès. Merci pour votre confiance.',
                            },
                          ].map((etape) => ({
                            ...etape,
                            actif: Number(etape.numero) <= progression,
                          }))
                        })().map((etape) => (
                            <div key={etape.numero} className="relative flex gap-4">
                              <div
                                className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                                  etape.actif
                                    ? 'bg-[#0F1B3D] !text-white shadow-sm'
                                    : 'border border-[#FAF9F6] bg-white text-[#9A93A5]'
                                }`}
                              >
                                {etape.numero}
                              </div>

                              <div className="min-w-0 pb-4">
                                <div
                                  className={`text-sm font-black ${
                                    etape.actif ? 'text-[#1A1A2E]' : 'text-[#9A93A5]'
                                  }`}
                                >
                                  {etape.titre}
                                </div>

                                <div
                                  className={`mt-1 text-xs leading-5 ${
                                    etape.actif ? 'text-[#6B7280]' : 'text-[#9A93A5]'
                                  }`}
                                >
                                  {etape.description}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </section>

            <section className="mt-5 overflow-hidden rounded-[14px] border border-[#FAF9F6] bg-white text-[#1A1A2E] shadow-[0_2px_10px_rgba(24,21,31,0.05)]">
              <div className="relative overflow-hidden bg-[#FFFFFF] p-5 sm:p-8">
                <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#0F1B3D]/[0.05] blur-3xl" />

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="inline-flex items-center rounded-full border border-[#0F1B3D]/15 bg-[#0F1B3D]/[0.05] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#0F1B3D]">
                      Votre achat
                    </div>

                    <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
                      Montant d'achat
                    </h2>
                  </div>

                  <div className="shrink-0 rounded-[10px] border border-[#FAF9F6] bg-white px-4 py-3.5 text-left shadow-sm sm:min-w-[190px] sm:text-right">
                    <div className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9A93A5]">
                      Total
                    </div>
                    <div className="mt-1 text-2xl font-black tracking-tight text-[#1A1A2E] sm:text-3xl">
                      {formatPrix(commande.total)}
                    </div>
                  </div>
                </div>

                {commande.articles.length > 0 && (
                  <div className="relative mt-7 overflow-hidden rounded-[14px] border border-[#FAF9F6] bg-white shadow-sm">
                    {commande.articles.map((article, index) => (
                      <div
                        key={article.id}
                        className={`flex items-center justify-between gap-4 px-4 py-4 transition-colors sm:px-5 ${
                          index > 0 ? 'border-t border-[#FAF9F6]' : ''
                        } hover:bg-white/70`}
                      >
                        <div className="flex min-w-0 items-center gap-3.5">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#FAF9F6] text-xs font-black text-[#0F1B3D] shadow-sm">
                            {article.quantite}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-black leading-5 text-[#1A1A2E] sm:text-sm">
                              {article.nom}
                            </div>
                            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#9A93A5]">
                              Quantité : {article.quantite}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 rounded-[10px] bg-[#FFFFFF] px-3.5 py-2.5 text-sm font-black tracking-tight text-[#1A1A2E] ring-1 ring-[#FAF9F6]">
                          {formatPrix(article.total_ligne)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                  {estCommandeStock ? (
                    (() => {
                      const statutPaiement = String(
                        commande.paiement?.statut || ''
                      ).toLowerCase()

                      const paiementValide = statutPaiement === 'paye'
                      const paiementEnAttente = [
                        'en_attente',
                        'initie',
                        'pending',
                      ].includes(statutPaiement)
                      const paiementRefuse = [
                        'echec',
                        'refuse',
                        'rejected',
                        'failed',
                      ].includes(statutPaiement)

                      const paiementTermine = paiementValide && estLivree
                      const receptionTerminee =
                        commande.mode_reception === 'retrait'
                          ? 'retirée'
                          : 'livrée'

                      const paiementStyle = paiementRefuse
                        ? {
                            border: 'border-red-100',
                            background: 'bg-red-50/50',
                            icon: 'text-red-600 ring-1 ring-red-100',
                            title: 'text-red-700',
                            text: 'text-red-800/70',
                          }
                        : paiementEnAttente
                          ? {
                              border: 'border-amber-100',
                              background: 'bg-amber-50/50',
                              icon: 'text-amber-600 ring-1 ring-amber-100',
                              title: 'text-amber-700',
                              text: 'text-amber-800/70',
                            }
                          : paiementValide
                            ? {
                                border: 'border-emerald-100',
                                background: 'bg-emerald-50/50',
                                icon: 'text-emerald-600 ring-1 ring-emerald-100',
                                title: 'text-emerald-700',
                                text: 'text-emerald-800/70',
                              }
                            : {
                                border: 'border-[#FAF9F6]',
                                background: 'bg-[#FFFFFF]',
                                icon: 'text-[#1A1A2E] ring-1 ring-[#FAF9F6]',
                                title: 'text-[#1A1A2E]',
                                text: 'text-[#6B7280]',
                              }

                      return (
                        <div
                          className={`rounded-[14px] border p-4 shadow-sm ${paiementStyle.border} ${paiementStyle.background}`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white shadow-sm ${paiementStyle.icon}`}
                            >
                              {paiementRefuse ? (
                                <AlertCircle size={17} />
                              ) : paiementValide ? (
                                <CheckCircle2 size={17} />
                              ) : (
                                <Clock3 size={17} />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div
                                className={`text-[9px] font-black uppercase tracking-[0.2em] ${paiementStyle.title}`}
                              >
                                {paiementRefuse
                                  ? 'Paiement refusé'
                                  : paiementEnAttente
                                    ? 'Paiement en attente de validation'
                                    : paiementValide
                                      ? 'Paiement validé'
                                      : 'Paiement'}
                              </div>

                              <div
                                className={`mt-2 text-xs font-medium leading-5 ${paiementStyle.text}`}
                              >
                                {paiementRefuse ? (
                                  'Le paiement n’a pas été validé. Consultez les informations de paiement avant toute nouvelle tentative.'
                                ) : paiementEnAttente ? (
                                  'Votre paiement a été reçu et reste en attente de validation par notre équipe.'
                                ) : paiementTermine ? (
                                  <>
                                    Votre paiement a été confirmé.
                                    <br />
                                    Votre commande a été {receptionTerminee} avec succès.
                                  </>
                                ) : paiementValide ? (
                                  'Votre paiement a été confirmé. Votre commande poursuit son parcours.'
                                ) : (
                                  'Les informations de paiement de cette commande sont en cours de traitement.'
                                )}
                              </div>
                            </div>
                          </div>

                          {(paiementRefuse || paiementEnAttente) && (
                            <div className="mt-4">
                              <PaiementSolde
                                commande={commande}
                                {...(user?.id ? { userId: user.id } : {})}
                                onRefresh={() => rechercher(commande.code_suivi)}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })()
                  ) : (
                    <div className="relative grid gap-3 sm:grid-cols-2">
                      <div className={`rounded-[14px] border p-4 ${
                        String(commande?.paiement?.statut || '').toLowerCase() === 'paye' && Number(commande.acompte_paye) > 0
                          ? 'border-emerald-100 bg-emerald-50/50'
                          : ['echec', 'refuse', 'rejected', 'failed'].includes(String(commande?.paiement?.statut || '').toLowerCase())
                            ? 'border-[#0F1B3D]/15 bg-[#FAF9F6]'
                            : 'border-amber-100 bg-amber-50/40'
                      }`}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[9px] font-black uppercase tracking-[0.17em] text-[#9A93A5]">
                            Acompte
                          </span>

                          <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm ${
                            String(commande?.paiement?.statut || '').toLowerCase() === 'paye' && Number(commande.acompte_paye) > 0
                              ? 'text-emerald-600'
                              : ['echec', 'refuse', 'rejected', 'failed'].includes(String(commande?.paiement?.statut || '').toLowerCase())
                                ? 'text-[#0F1B3D]'
                                : 'text-amber-600'
                          }`}>
                            {String(commande?.paiement?.statut || '').toLowerCase() === 'paye' && Number(commande.acompte_paye) > 0 ? (
                              <CheckCircle2 size={15} />
                            ) : (
                              <Clock3 size={15} />
                            )}
                          </div>
                        </div>

                        <div className="mt-2 text-lg font-black text-[#1A1A2E]">
                          {formatPrix(commande.acompte_paye)}
                        </div>

                        {String(commande?.paiement?.statut || '').toLowerCase() === 'paye' && Number(commande.acompte_paye) > 0 ? (
                          <div className="mt-1 text-[10px] font-medium text-emerald-700/70">
                            Acompte confirmé
                          </div>
                        ) : ['echec', 'refuse', 'rejected', 'failed'].includes(String(commande?.paiement?.statut || '').toLowerCase()) ? (
                          <div className="mt-2">
                            <div className="text-[10px] font-medium text-[#0F1B3D]">
                              Paiement refusé
                            </div>
                            <div className="mt-2">
                              <PaiementSolde
                                commande={commande}
                                {...(user?.id ? { userId: user.id } : {})}
                                onRefresh={() => rechercher(commande.code_suivi)}
                                afficherFormulaireInitialement={false}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <PaiementSolde
                              commande={commande}
                              {...(user?.id ? { userId: user.id } : {})}
                              onRefresh={() => rechercher(commande.code_suivi)}
                              afficherFormulaireInitialement={false}
                            />
                          </div>
                        )}
                      </div>

                      <div
                        className={`rounded-[14px] border p-4 ${
                          estSoldeRequis
                            ? 'border-[#0F1B3D]/15 bg-[#FAF9F6]'
                            : statut === 'solde_confirme'
                              ? 'border-emerald-100 bg-emerald-50/50'
                              : 'border-[#FAF9F6] bg-[#FFFFFF]'
                        }`}
                      >
                        {soldeDejaConfirme ? (
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
                              <CheckCircle2 size={17} />
                            </div>

                            <div className="min-w-0">
                              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                                Solde réglé
                              </div>

                              <div className="mt-1.5 text-[11px] font-medium leading-relaxed text-emerald-800/70">
                                Le paiement de votre solde a été confirmé.
                                <br />
                                Votre commande est désormais entièrement réglée.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[9px] font-black uppercase tracking-[0.17em] text-[#9A93A5]">
                                Solde restant
                              </span>

                              {estSoldeRequis && (
                                <span className="rounded-full bg-[#0F1B3D]/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-[#0F1B3D]">
                                  À payer
                                </span>
                              )}
                            </div>

                            <div
                              className={`mt-2 text-lg font-black ${
                                estSoldeRequis
                                  ? 'text-[#0F1B3D]'
                                  : 'text-[#1A1A2E]'
                              }`}
                            >
                              {formatPrix(commande.solde_restant)}
                            </div>

                            <div className="mt-1 text-[10px] font-medium text-[#9A93A5]">
                              Montant restant
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

              </div>
            </section>

            {commande.transport && (

              <section className="mt-5 overflow-hidden rounded-[14px] border border-[#FAF9F6] bg-white text-[#1A1A2E] shadow-[0_2px_10px_rgba(24,21,31,0.05)]">
                <div className="relative overflow-hidden p-5 sm:p-8">
                  <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#0F1B3D]/[0.06] blur-3xl" />

                  <div className="relative flex flex-wrap items-start justify-between gap-5">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[#FAF9F6] text-[#0F1B3D] shadow-sm">
                        <Truck size={19} />
                      </div>

                      <div>
                        <div className="text-[9px] font-black uppercase tracking-[0.24em] text-[#9A93A5]">
                          Transport international
                        </div>
                        <h2 className="mt-1.5 text-xl font-black tracking-tight sm:text-2xl">
                          Chine <span className="mx-1 text-[#9A93A5]">→</span> Cotonou
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 rounded-full border border-[#0F1B3D]/15 bg-[#FFF5F3] px-3.5 py-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0F1B3D]" />
                        <span className={`text-[9px] font-black uppercase tracking-[0.16em] ${
                          transportEstArrive ? 'text-emerald-700' : 'text-[#0F1B3D]'
                        }`}>
                          {transportEstArrive ? 'Arrivé à Cotonou' : 'En transit'}
                        </span>
                      </div>

                      <div className="rounded-full border border-[#FAF9F6] bg-[#FFFFFF] px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-[#1A1A2E]/65">
                        {commande.transport.type === 'avion' ? '✈ Avion' : '⚓ Bateau'}
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-8 rounded-[14px] border border-[#FAF9F6] bg-[#FFFFFF] p-5 shadow-sm sm:p-7">
                    <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4 sm:gap-7">
                      <div className="min-w-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#FAF9F6] bg-[#FAF9F6] text-[10px] font-black tracking-wide text-[#0F1B3D] shadow-sm">
                          CN
                        </div>

                        <div className="mt-3 text-sm font-black text-[#1A1A2E]">
                          {commande.transport.origine}
                        </div>

                        {commande.transport.departReel && (
                          <div className="mt-1 max-w-[120px] text-[10px] font-medium leading-4 text-[#9A93A5]">
                            {formatDate(commande.transport.departReel)}
                          </div>
                        )}
                      </div>

                      <div className="relative mt-6 px-1">
                        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#FAF9F6]" />

                        <div
                          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#0F1B3D] transition-[width] duration-1000 linear"
                          style={{
                            width: `${Math.min(100, Math.max(0, progressionTransport * 100))}%`,
                          }}
                        />

                        <div
                          className="absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-white bg-[#0F1B3D] text-sm shadow-sm"
                          style={{
                            left: `${Math.min(100, Math.max(0, progressionTransport * 100))}%`,
                          }}
                        >
                          {commande.transport.type === 'avion' ? '✈️' : '🚢'}
                        </div>
                      </div>

                      <div className="min-w-0 text-right">
                        <div className="ml-auto flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#FAF9F6] bg-[#FAF9F6] text-[10px] font-black tracking-wide text-[#0F1B3D] shadow-sm">
                          BJ
                        </div>

                        <div className="mt-3 text-sm font-black text-[#1A1A2E]">
                          {commande.transport.destination}
                        </div>

                        {commande.transport.arriveeReelle && (
                          <div className="mt-1 text-[10px] font-medium leading-4 text-[#9A93A5]">
                            {formatDate(commande.transport.arriveeReelle)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-[#FAF9F6] pt-4">
                      <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9A93A5]">
                        Départ Chine
                      </span>

                      <div className="mx-4 h-px flex-1 bg-[#FAF9F6]" />

                      <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9A93A5]">
                        Arrivée Cotonou
                      </span>
                    </div>
                  </div>

                  <div className="relative mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[14px] border border-[#FAF9F6] bg-white p-4 shadow-sm transition-shadow">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0F1B3D]" />
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                          État
                        </div>
                      </div>

                      <div className="mt-2 text-sm font-black text-[#1A1A2E]">
                        {transportEstArrive
                          ? 'Votre commande est arrivée'
                          : commande.transport.departReel
                            ? 'En transit vers Cotonou'
                            : 'Préparation du départ'}
                      </div>
                    </div>

                    <div className="rounded-[14px] border border-[#FAF9F6] bg-white p-4 shadow-sm transition-shadow">
                      <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                        Transport
                      </div>

                      <div className="mt-2 truncate font-mono text-xs font-bold text-[#1A1A2E]/70">
                        {commande.transport.numero}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {(estSoldeRequis || statut === 'solde_confirme') && (
              <section className="mt-5 overflow-hidden rounded-[14px] border border-[#FAF9F6] bg-white text-[#1A1A2E] shadow-sm">
                <div className="border-b border-[#FAF9F6] bg-[#FFFBFA] px-6 py-6 sm:px-8">
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#0F1B3D] !text-white shadow-sm">
                        <CreditCard size={19} />
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-[0.24em] text-[#0F1B3D]">
                          Action requise
                        </div>
                        <h2 className="mt-1.5 text-xl font-black tracking-tight sm:text-2xl">
                          Régler le solde
                        </h2>
                        <p className="mt-1.5 text-xs font-medium leading-5 text-[#6B7280]">
                          Finalisez votre paiement pour poursuivre votre commande.
                        </p>
                      </div>
                    </div>

                    {statut === 'solde_confirme' ? (
                      <div className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-700 ring-1 ring-emerald-200">
                        Confirmé
                      </div>
                    ) : (
                      <div className="shrink-0 rounded-full bg-[#0F1B3D]/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-[#0F1B3D]">
                        À régler
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  {statut === 'solde_confirme' ? (
                    <div className="rounded-[14px] border border-emerald-200 bg-emerald-50/70 p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-emerald-600 text-white">
                          <CheckCircle2 size={22} />
                        </div>
                        <div>
                          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700">
                            Paiement validé
                          </div>
                          <h3 className="mt-1.5 text-base font-black text-emerald-950">
                            Règlement confirmé
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-emerald-800">
                            Votre paiement a bien été reçu et validé. Votre commande peut maintenant poursuivre son parcours.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-[14px] border border-[#FAF9F6] bg-[#FAFAF9] p-5 sm:p-6">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-[#9A93A5]">
                              Solde restant
                            </div>
                            <div className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#1A1A2E] sm:text-4xl">
                              {formatPrix(commande.solde_restant)}
                            </div>
                          </div>
                          <div className="hidden h-11 w-11 items-center justify-center rounded-[10px] bg-white text-[#0F1B3D] shadow-sm ring-1 ring-[#FAF9F6]/80 sm:flex">
                            <CreditCard size={19} />
                          </div>
                        </div>

                        <div className="mt-5 h-px bg-[#FAF9F6]" />

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-[#6B7280]">
                            Montant d’achat restant
                          </span>
                          <span className="text-xs font-black text-[#1A1A2E]">
                            À régler maintenant
                          </span>
                        </div>
                      </div>

                      <div className="mt-5">
                        <PaiementSolde
                          commande={commande}
                          {...(user?.id ? { userId: user.id } : {})}
                          onRefresh={() => rechercher(commande.code_suivi)}
                          afficherFormulaireInitialement={false}
                        />
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}

            <section className="mt-5 overflow-hidden rounded-[14px] border border-[#FAF9F6] bg-white text-[#1A1A2E] shadow-sm">
              <div className="relative overflow-hidden p-5 sm:p-8">
                <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#0F1B3D]/[0.05] blur-3xl" />

                <div className="relative flex flex-wrap items-start justify-between gap-5">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[#FAF9F6] text-[#0F1B3D] shadow-sm">
                      {commande.mode_reception === 'livraison'
                        ? <Truck size={19} />
                        : <MapPin size={19} />}
                    </div>

                    <div>
                      <div className="text-[9px] font-black uppercase tracking-[0.24em] text-[#9A93A5]">
                        {estCommandeStock ? 'Dernière partie du parcours' : 'Cotonou → Vous'}
                      </div>

                      <h2 className="mt-1.5 text-xl font-black tracking-tight sm:text-2xl">
                          {commande.mode_reception === 'livraison'
                            ? <>Cotonou <span className="mx-1 text-[#9A93A5]">→</span> Votre adresse</>
                            : 'Retrait sur place'}
                      </h2>

                      <p className="mt-1.5 text-xs font-medium text-[#9A93A5]">
                        {commande.mode_reception === 'livraison'
                          ? 'Acheminement'
                            : 'Votre commande vous attend au point de retrait'}
                      </p>
                    </div>
                  </div>

                </div>

                {commande.mode_reception === 'livraison' ? (
                  <div className="relative mt-7 overflow-hidden rounded-[14px] border border-[#FAF9F6] bg-white p-5 shadow-sm sm:p-7">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#0F1B3D]/[0.05] blur-3xl" />

                    <div className="relative flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="mt-3 text-lg font-black tracking-[-0.02em] text-[#1A1A2E] sm:text-xl">
                          {livraisonEstArrivee
                            ? 'Livraison terminée'
                            : commande.departReel
                              ? 'Votre commande est en route'
                              : 'Préparation de la livraison'}
                        </div>
                      </div>
                      </div>

                        <div className="relative mt-4">

                          {estCommandeStock ? (
                            <div className="space-y-5">
                              <div className="rounded-[14px] border border-[#FAF9F6] bg-[#FFFFFF] p-5 sm:p-6">
                                <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                                    Statut
                                  </div>
                                  <p className="mt-1.5 text-sm font-black text-[#1A1A2E]">
                                    {livraisonEstArrivee
                                      ? 'Commande livrée'
                                      : commande.departReel
                                        ? 'En route vers votre adresse'
                                        : 'Préparation en cours'}
                                  </p>
                                  <p className="mt-1.5 text-xs leading-5 text-[#6B7280]">
                                    {livraisonEstArrivee
                                      ? 'Votre commande a été livrée avec succès. Merci pour votre confiance.'
                                      : commande.departReel
                                        ? 'Votre colis est en route vers votre adresse.'
                                        : 'Votre commande est en préparation avant sa remise au livreur.'}
                                  </p>
                                </div>

                                </div>

                                {commande.departReel && (
                                  <>
                                    <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#FAF9F6]">
                                      <div
                                        className="h-full rounded-full bg-[#0F1B3D] transition-all duration-700"
                                        style={{
                                          width: `${Math.round(progressionLivraison * 100)}%`,
                                        }}
                                      />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-[#9A93A5]">
                                      <span>Départ</span>
                                      <span>Votre adresse</span>
                                    </div>
                                  </>
                                )}

                                {String(commande.livraisonStatut || '').toLowerCase() === 'arrivee' && (
                                  <div className="mt-5 rounded-[14px] border border-[#0F1B3D]/20 bg-[#FAF9F6] p-4">
                                    <div className="flex items-center gap-2">
                                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#0F1B3D]" />
                                      <span className="text-xs font-black uppercase tracking-[0.12em] text-[#0F1B3D]">
                                        Livreur arrivé
                                      </span>
                                    </div>
                                    <p className="mt-2 text-xs leading-5 text-[#6B7280]">
                                      Votre livreur est arrivé à destination. Confirmez la réception lorsque vous avez reçu votre commande.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={confirmerReception}
                                      disabled={confirmationReceptionEnCours}
                                      className="mt-4 flex min-h-11 w-full items-center justify-center rounded-[10px] bg-[#0F1B3D] !text-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-sm transition hover:bg-[#C9A24B] hover:text-[#0F1B3D] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {confirmationReceptionEnCours
                                        ? 'Confirmation en cours...'
                                        : 'J’ai reçu ma commande'}
                                    </button>
                                  </div>
                                )}

                                {commande.livreur && (
                                  <div className="mt-5 border-t border-[#FAF9F6] pt-5">
                                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                                      Votre livreur
                                    </div>

                                    <div className="mt-2 flex items-center gap-3">
                                      <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-black text-[#1A1A2E]">
                                          {commande.livreur.nom}
                                        </div>

                                        {commande.livreur.telephone && (
                                          <div className="mt-1 text-xs font-semibold text-[#6B7280]">
                                            {commande.livreur.telephone}
                                          </div>
                                        )}
                                      </div>

                                    </div>

                                    {commande.livreur.telephone && (
                                      <div className="mt-4 grid grid-cols-2 gap-2.5">
                                        <a
                                          href={`tel:${commande.livreur.telephone}`}
                                          className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#FAF9F6] bg-white px-3 py-3 text-[10px] font-black uppercase tracking-[0.08em] text-[#1A1A2E] shadow-sm transition hover:border-[#0F1B3D] hover:bg-[#FFFFFF]"
                                        >
                                          <Phone size={14} />
                                          Appeler
                                        </a>

                                        <a
                                          href={`https://wa.me/${commande.livreur.telephone.replace(/\D/g, '')}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#FAF9F6] bg-white px-3 py-3 text-[10px] font-black uppercase tracking-[0.08em] text-[#1A1A2E] shadow-sm transition hover:border-[#0F1B3D] hover:bg-[#FFFFFF]"
                                        >
                                          <MessageCircle size={14} />
                                          WhatsApp
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>                          ) : (
                            <div className="rounded-[14px] border border-[#FAF9F6] bg-[#FFFFFF] p-5 sm:p-6">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-xs font-black text-[#1A1A2E]">
                                  {commande.statut === 'solde_requis'
                                    ? 'Solde requis'
                                    : commande.statut === 'solde_confirme'
                                      ? 'Solde confirmé'
                                      : commande.statut === 'pret'
                                        ? 'Commande prête'
                                        : commande.statut === 'livraison_en_cours'
                                          ? 'Livraison en cours'
                                          : commande.statut === 'livraison_planifiee'
                                            ? 'Livraison planifiée'
                                            : commande.statut === 'en_route'
                                              ? 'En route'
                                              : livraisonEstArrivee
                                                ? 'Commande livrée'
                                                : 'Acheminement'}
                                </div>

                                <div className="text-xs font-black text-[#0F1B3D]">
                                  {livraisonEstArrivee
                                    ? 'Arrivée'
                                    : ['en_route', 'arrivee', 'livree'].includes(
                                        String(commande.livraisonStatut || '').toLowerCase(),
                                      ) || Boolean(commande.departReel)
                                      ? 'En cours'
                                      : ''}
                                </div>
                              </div>

                              {['en_route', 'arrivee', 'livree'].includes(
                                String(commande.livraisonStatut || '').toLowerCase(),
                              ) && (
                                <>

                                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#FAF9F6]">
                                    <div
                                      className="h-full rounded-full bg-[#0F1B3D] transition-all duration-700"
                                      style={{
                                        width: `${Math.round(progressionLivraison * 100)}%`,
                                      }}
                                    />
                                  </div>

                                  <div className="mt-3 flex justify-between text-[9px] font-bold text-[#9A93A5]">
                                    <span>Départ</span>
                                    <span>En route</span>
                                    <span>Arrivée</span>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                  </div>
                ) : (
                  <div className="relative mt-7 overflow-hidden rounded-[14px] border border-[#FAF9F6] bg-white p-5 shadow-[0_2px_10px_rgba(24,21,31,0.05)] sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#1A1A2E] shadow-sm ring-1 ring-[#FAF9F6]/80">
                          <MapPin size={17} />
                        </div>

                        <div>
                          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                            Retrait sur place
                          </div>

                            <div className="mt-2 text-base font-black text-[#1A1A2E]">
                              {statut === 'retire'
                                ? '✓ Commande retirée'
                                : statut === 'pret'
                                  ? 'Votre commande est prête au retrait'
                                  : 'Votre commande est en cours de préparation'}
                            </div>

                            {statut === 'pret' && commande.code_retrait && (
                              <div className="mt-5 rounded-[10px] border border-[#0F1B3D]/15 bg-white p-4 shadow-[0_2px_10px_rgba(24,21,31,0.05)]">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="text-[8px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                                      Code de retrait
                                    </div>
                                    <div className="mt-1 text-xs font-medium text-[#6B7280]">
                                      Présentez ce code lors du retrait de votre commande.
                                    </div>
                                  </div>
                                  <div className="rounded-[10px] bg-[#0F1B3D]/10 px-3 py-2 text-base font-black tracking-[0.1em] text-[#0F1B3D]">
                                    {commande.code_retrait}
                                  </div>
                                </div>
                              </div>
                            )}

                            {statut === 'retire' && (
                              <div className="mt-4 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                                <div className="text-sm font-black text-emerald-800">
                                  Votre commande a été remise avec succès.
                                </div>
                                <div className="mt-1 text-xs font-medium text-emerald-700">
                                  Merci pour votre confiance.
                                </div>
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="rounded-full bg-[#0F1B3D]/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.13em] text-[#0F1B3D]">
                        Terminé
                      </div>
                    </div>
                  </div>
                )}

                {commande.mode_reception === 'livraison' &&
                  String(commande.livraisonStatut || '').toLowerCase() === 'livree' &&
                  avisCharge && (
                    <div className="mt-5 rounded-[14px] border border-[#FAF9F6] bg-white p-5 shadow-[0_2px_10px_rgba(24,21,31,0.05)] sm:p-6">
                      {avisDejaDepose ? (
                        <div>
                          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                            Votre avis
                          </div>
                          <div className="mt-3 flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((etoile) => (
                              <Star
                                key={etoile}
                                size={20}
                                className={
                                  etoile <= noteAvis
                                    ? 'fill-[#0F1B3D] text-[#0F1B3D]'
                                    : 'text-[#9A93A5]'
                                }
                              />
                            ))}
                          </div>
                          {commentaireAvis && (
                            <p className="mt-3 text-xs leading-5 text-[#6B7280]">
                              {commentaireAvis}
                            </p>
                          )}
                          <p className="mt-3 text-xs font-semibold text-emerald-700">
                            Merci pour votre retour.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                            Votre avis
                          </div>
                          <div className="mt-2 text-base font-black text-[#1A1A2E]">
                            Comment s’est passée votre livraison ?
                          </div>

                          <div className="mt-4 flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((etoile) => (
                              <button
                                key={etoile}
                                type="button"
                                onClick={() => setNoteAvis(etoile)}
                                aria-label={`Donner ${etoile} étoile${etoile > 1 ? 's' : ''}`}
                                className="flex h-11 w-11 items-center justify-center rounded-[10px] transition hover:bg-[#FFFFFF]"
                              >
                                <Star
                                  size={24}
                                  className={
                                    etoile <= noteAvis
                                      ? 'fill-[#0F1B3D] text-[#0F1B3D]'
                                      : 'text-[#9A93A5]'
                                  }
                                />
                              </button>
                            ))}
                          </div>

                          <textarea
                            value={commentaireAvis}
                            onChange={(e) => setCommentaireAvis(e.target.value)}
                            maxLength={1000}
                            rows={4}
                            placeholder="Votre commentaire (facultatif)"
                            className="mt-3 w-full resize-none rounded-[10px] border border-[#FAF9F6] bg-[#FFFFFF] px-4 py-3 text-sm font-medium text-[#1A1A2E] outline-none transition focus:border-[#0F1B3D] focus:bg-white"
                          />

                          <button
                            type="button"
                            onClick={envoyerAvisClient}
                            disabled={avisEnvoiEnCours || noteAvis < 1}
                            className="mt-3 flex min-h-11 w-full items-center justify-center rounded-[10px] bg-[#0F1B3D] !text-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-sm transition hover:bg-[#C9A24B] hover:text-[#0F1B3D] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {avisEnvoiEnCours
                              ? 'Envoi en cours...'
                              : 'Envoyer mon avis'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </section>


            <div className="mt-10 text-center text-[9px] font-bold uppercase tracking-[0.22em] text-[#9A93A5]">
              AndyShop Bénin · Suivi sécurisé
              </div>
            </main>
          </div>
        )
  }


export default function SuiviV2() {
  return (
    <SuiviErrorBoundary>
      <SuiviV2Page />
    </SuiviErrorBoundary>
  )
}
