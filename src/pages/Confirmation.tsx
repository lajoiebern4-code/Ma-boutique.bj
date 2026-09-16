import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  enregistrerReferenceTransaction,
  envoyerPreuvePaiement,
  recupererMoyensPaiementActifs,
  verifierCommandePaiementInvite,
} from '../services/supabase'
import {
  Check,
  CheckCircle2,
  MessageCircle,
  ChevronRight,
  ClipboardCheck,
  Copy,
  CreditCard,
  Package,
  ShoppingBag,
  Truck,
} from 'lucide-react'

type ResultatCommande = {
  commandeId?: string
  numeroCommande?: string
  codeSuivi?: string
  codeRetrait?: string
  total?: number
  acompteRequis?: number
  acomptePaye?: number
  statut?: string
  modeReception?: 'livraison' | 'retrait'
  modePaiement?: 'especes' | 'en_ligne' | 'mobile_money'
  telephone?: string
  moyenPaiement?: string
  paiementAccesToken?: string
  paiement?: {
    success?: boolean
    paiement_existant?: boolean
    paiement_id?: string
    commande_id?: string
    numero?: string
    montant?: number
    statut?: string
    provider?: string
    reference_paiement?: string
    reference_transaction?: string
  } | null
}

function formatPrix(prix: number) {
  return `${prix.toLocaleString('fr-FR')} FCFA`
}

export default function Confirmation() {
  const navigate = useNavigate()

  const [commande, setCommande] = useState<ResultatCommande | null>(null)
  const [copie, setCopie] = useState(false)
  const [moyensPaiement, setMoyensPaiement] = useState<any[]>([])
  const [chargementPaiement, setChargementPaiement] = useState(false)
  const [fichierPreuve, setFichierPreuve] = useState<File | null>(null)
  const [envoiPreuve, setEnvoiPreuve] = useState(false)
  const [preuveEnvoyee, setPreuveEnvoyee] = useState(false)
  const [erreurPreuve, setErreurPreuve] = useState('')
  const [referenceTransaction, setReferenceTransaction] = useState('')
  const [enregistrementReference, setEnregistrementReference] = useState(false)
  const [erreurReference, setErreurReference] = useState('')
  const [verificationPaiement, setVerificationPaiement] = useState(false)
  const [erreurVerificationPaiement, setErreurVerificationPaiement] = useState('')

  useEffect(() => {
    const brut = sessionStorage.getItem('chinashop_commande_resultat')

    if (!brut) {
      navigate('/catalogue', { replace: true })
      return
    }

    try {
      setCommande(JSON.parse(brut))
    } catch {
      sessionStorage.removeItem('chinashop_commande_resultat')
      navigate('/catalogue', { replace: true })
    }
  }, [navigate])
    useEffect(() => {
      if (!commande || commande.modePaiement !== 'mobile_money') return

      let actif = true

      async function chargerMoyensPaiement() {
        setChargementPaiement(true)

        try {
          const moyens = await recupererMoyensPaiementActifs()

          if (actif) {
            setMoyensPaiement(moyens)
          }
        } catch {
          if (actif) {
            setMoyensPaiement([])
          }
        } finally {
          if (actif) {
            setChargementPaiement(false)
          }
        }
      }

      chargerMoyensPaiement()

      return () => {
        actif = false
      }
    }, [commande])



  if (!commande) return null

  const estRetrait = commande.modeReception === 'retrait'

  const code =
    (estRetrait ? commande.codeRetrait : commande.codeSuivi) ||
    commande.codeSuivi ||
    commande.codeRetrait ||
    ''

  const acompteRequis = Number(commande.acompteRequis || 0)
  const acomptePaye = Number(commande.acomptePaye || 0)

  const paiementMobile =
    commande.modePaiement === 'en_ligne' ||
    commande.modePaiement === 'mobile_money'

    const paiement = commande.paiement
    const paiementMontant = Number(paiement?.montant || 0)
    const referencePaiement = paiement?.reference_paiement || ''
    const statutPaiement = paiement?.statut || ''
    const acompteRegle =
      acomptePaye >= acompteRequis && statutPaiement === 'paye'

    const providerPaiement = String(
      paiement?.provider || commande.moyenPaiement || '',
    ).trim().toLowerCase()

    const moyenPaiement = moyensPaiement.find(
      (moyen) =>
        String(moyen.code || '').trim().toLowerCase() === providerPaiement,
    )

    const numeroMarchand = moyenPaiement?.numero || ''
    const instructionsPaiement = moyenPaiement?.instructions || ''

  async function gererEnvoiPreuve() {
    if (!commande || !paiement?.paiement_id || !commande.paiementAccesToken) {
      setErreurPreuve(
        'Les informations sécurisées du paiement sont indisponibles.',
      )
      return
    }

    if (!referenceTransaction.trim()) {
      setErreurReference(
        'Saisissez la référence de transaction reçue après votre paiement Mobile Money.',
      )
      return
    }

    if (!fichierPreuve) {
      setErreurPreuve('Sélectionnez d’abord votre capture de paiement.')
      return
    }

    setErreurPreuve('')
    setErreurReference('')
    setEnregistrementReference(true)
    setEnvoiPreuve(true)

    try {
      await enregistrerReferenceTransaction(
        commande.numeroCommande || '',
        commande.paiementAccesToken,
        paiement.paiement_id,
        referenceTransaction.trim(),
      )

      await envoyerPreuvePaiement(
        commande.numeroCommande || '',
        commande.paiementAccesToken,
        paiement.paiement_id,
        fichierPreuve,
      )

      setPreuveEnvoyee(true)
      setFichierPreuve(null)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossible d’enregistrer la référence ou d’envoyer la preuve de paiement.'

      if (message.toLowerCase().includes('référence')) {
        setErreurReference(message)
      } else {
        setErreurPreuve(message)
      }
    } finally {
      setEnregistrementReference(false)
      setEnvoiPreuve(false)
    }
  }

  async function verifierPaiementCommande() {
    if (!commande?.numeroCommande || !commande.paiementAccesToken) {
      setErreurVerificationPaiement(
        'Les informations sécurisées de la commande sont indisponibles.',
      )
      return
    }

    setErreurVerificationPaiement('')
    setVerificationPaiement(true)

    try {
      const resultat = await verifierCommandePaiementInvite(
        commande.numeroCommande,
        commande.paiementAccesToken,
      )

      const commandeVerifiee = resultat?.commande
      const paiementVerifie = resultat?.paiement

      if (!commandeVerifiee) {
        throw new Error(
          'Les informations de la commande sont indisponibles.',
        )
      }

      const commandeMiseAJour: ResultatCommande = {
        ...commande,
        statut: commandeVerifiee.statut,
        acompteRequis: Number(commandeVerifiee.acompte_requis || 0),
        acomptePaye: Number(commandeVerifiee.acompte_paye || 0),
        paiement: paiementVerifie
          ? {
              paiement_id: paiementVerifie.id,
              commande_id: commandeVerifiee.id,
              montant: Number(paiementVerifie.montant || 0),
              statut: paiementVerifie.statut,
              provider: paiementVerifie.provider,
              reference_paiement: paiementVerifie.reference_paiement,
              reference_transaction: paiementVerifie.reference_transaction,

            }
          : commande.paiement,
      }

      setCommande(commandeMiseAJour)

      sessionStorage.setItem(
        'chinashop_commande_resultat',
        JSON.stringify(commandeMiseAJour),
      )

      const acompteConfirme =
        Number(commandeVerifiee.acompte_paye || 0) >=
        Number(commandeVerifiee.acompte_requis || 0)

      if (acompteConfirme) {
        const codeSuivi =
          commandeMiseAJour.codeSuivi ||
          commandeMiseAJour.codeRetrait ||
          ''

        if (codeSuivi) {
          navigate(`/suivi?code=${encodeURIComponent(codeSuivi)}`)
        }
      }
    } catch (error) {
      setErreurVerificationPaiement(
        error instanceof Error
          ? error.message
          : 'Impossible de vérifier le paiement de la commande.',
      )
    } finally {
      setVerificationPaiement(false)
    }
  }

  async function copierCode() {
    if (!code) return

    try {
      await navigator.clipboard.writeText(code)
      setCopie(true)
      setTimeout(() => setCopie(false), 1800)
    } catch {
      // Le code reste visible.
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-3 py-4 sm:px-5 sm:py-7">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <header className="mb-4 flex items-center justify-between px-1 sm:mb-6">
          <button
            type="button"
            onClick={() => navigate('/catalogue')}
            className="group flex items-center gap-2"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#081A33] text-white shadow-sm">
              <ShoppingBag size={19} />
            </span>

            <span className="hidden text-left sm:block">
              <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                ChinaShop
              </span>
              <span className="block text-sm font-black text-[#081A33]">
                Bénin
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
              Commande sécurisée
            </span>
          </div>
        </header>

        {/* SUCCESS HERO */}
        <section className="relative overflow-hidden rounded-[30px] bg-[#081A33] px-5 py-8 text-white shadow-[0_20px_60px_rgba(8,26,51,0.16)] sm:rounded-[36px] sm:px-10 sm:py-11">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#0052CC]/30 blur-3xl" />
          <div className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#FF7A1A]/15 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left">
              <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[25px] bg-emerald-400/10 ring-1 ring-emerald-300/20">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400">
                  <Check
                    size={31}
                    strokeWidth={3}
                    className="text-[#081A33]"
                  />
                </div>
              </div>

              <div className="mt-5 sm:ml-5 sm:mt-0">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-300">
                  Commande enregistrée
                </p>

                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-4xl">
                  Merci pour votre commande !
                </h1>

                <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-300 sm:text-sm">
                  Votre commande a bien été enregistrée. Gardez précieusement
                  votre numéro et votre code.
                </p>
              </div>
            </div>

            {/* ORDER NUMBER */}
            <div className="mt-7 rounded-[24px] border border-white/10 bg-white/[0.06] p-4 sm:p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                Numéro de commande
              </p>

              <div className="mt-2 flex items-center justify-between gap-4">
                <p className="break-all text-xl font-black tracking-tight sm:text-2xl">
                  {commande.numeroCommande || '—'}
                </p>

                <CheckCircle2
                  size={23}
                  className="shrink-0 text-emerald-400"
                />
              </div>
            </div>
          </div>
        </section>

        {/* MAIN GRID */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">

          <div className="space-y-4">

            {/* CODE PRINCIPAL */}
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#0052CC]">
                      Votre identifiant
                    </p>

                    <h2 className="mt-1 text-lg font-black text-[#081A33]">
                      {estRetrait ? 'Code de retrait' : 'Code de suivi'}
                    </h2>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0F6FF] text-[#0052CC]">
                    {estRetrait ? (
                      <Package size={20} />
                    ) : (
                      <Truck size={20} />
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className="rounded-[24px] bg-[#F7F9FC] px-4 py-6 text-center ring-1 ring-slate-100 sm:px-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Code à conserver
                  </p>

                  <p className="mt-3 break-all text-3xl font-black tracking-[0.12em] text-[#0052CC] sm:text-4xl">
                    {code || '—'}
                  </p>

                  {code && (
                    <button
                      type="button"
                      onClick={copierCode}
                      className="mx-auto mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-black text-[#081A33] shadow-sm ring-1 ring-slate-200 transition hover:bg-[#F0F6FF] active:scale-[0.98]"
                    >
                      {copie ? (
                        <>
                          <Check
                            size={16}
                            className="text-emerald-600"
                          />
                          Code copié
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copier le code
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#FFF8F2] p-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FF7A1A]/10">
                    <ClipboardCheck
                      size={16}
                      className="text-[#FF7A1A]"
                    />
                  </div>

                  <p className="text-xs font-semibold leading-5 text-slate-600">
                    {estRetrait
                      ? 'Présentez ce code lors du retrait de votre commande.'
                      : 'Conservez ce code pour suivre l’avancement de votre livraison.'}
                  </p>
                </div>
              </div>
            </section>

            {/* ACOMPTE */}
            {acompteRequis > 0 && (
              <section
                className={`overflow-hidden rounded-[28px] border p-5 shadow-sm sm:p-6 ${
                  acompteRegle
                    ? 'border-emerald-100 bg-emerald-50'
                    : 'border-amber-100 bg-amber-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      acompteRegle
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <CreditCard size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        className={`text-lg font-black ${
                          acompteRegle
                            ? 'text-emerald-900'
                            : 'text-amber-900'
                        }`}
                      >
                        {acompteRegle
                          ? 'Acompte reçu'
                          : 'Acompte à régler'}
                      </h2>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-wide ${
                          acompteRegle
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {acompteRegle ? 'Réglé' : 'En attente'}
                      </span>
                    </div>

                    <p
                      className={`mt-1 text-sm ${
                        acompteRegle
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      Montant requis :{' '}
                      <strong>{formatPrix(acompteRequis)}</strong>
                    </p>
                  </div>
                </div>

                {!acompteRegle && (
                  <>
                    <div className="mt-5 rounded-2xl bg-white/70 p-4">
                      <p className="text-xs font-semibold leading-5 text-amber-800">
                        Votre commande est enregistrée. L’acompte doit être
                        réglé avant le traitement des articles sur commande.
                      </p>
                    </div>

                    {commande.modePaiement === 'mobile_money' ? (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-[#0052CC]/15 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-[#F7F9FC] p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0052CC]/10 text-[#0052CC]">
                              <CreditCard size={18} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-black text-[#081A33]">
                                  Paiement Mobile Money
                                </p>
                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[8px] font-black uppercase tracking-wide text-amber-700">
                                  En attente
                                </span>
                              </div>

                              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                                Effectuez le transfert puis conservez votre preuve de paiement.
                              </p>
                            </div>
                          </div>
                        </div>

                        {chargementPaiement ? (
                          <div className="p-5 text-center">
                            <p className="text-xs font-bold text-slate-500">
                              Chargement des informations de paiement…
                            </p>
                          </div>
                        ) : moyenPaiement && numeroMarchand ? (
                          <div className="space-y-4 p-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                                Moyen de paiement
                              </p>
                              <p className="mt-1 text-sm font-black text-[#081A33]">
                                {moyenPaiement.nom}
                              </p>

                              <div className="mt-3 rounded-xl bg-[#F7F9FC] px-3 py-2.5">
                                <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                                  Numéro marchand
                                </p>
                                <p className="mt-0.5 text-base font-black tracking-wide text-[#081A33]">
                                  {numeroMarchand}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-2xl bg-[#081A33] p-4 text-white">
                              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/50">
                                Montant exact à envoyer
                              </p>
                              <p className="mt-1 text-2xl font-black">
                                {paiementMontant > 0
                                  ? formatPrix(paiementMontant)
                                  : 'Montant indisponible'}
                              </p>
                            </div>

                            {referencePaiement && (
                              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-500">
                                  Référence à indiquer
                                </p>
                                <p className="mt-1 break-all text-sm font-black tracking-wide text-[#081A33]">
                                  {referencePaiement}
                                </p>
                                <p className="mt-1 text-[11px] font-semibold leading-5 text-blue-700">
                                  Indiquez cette référence dans le motif du transfert si votre opérateur le permet.
                                </p>
                              </div>
                            )}

                            {instructionsPaiement && (
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                                  Instructions
                                </p>
                                <p className="mt-1 whitespace-pre-line text-xs font-semibold leading-5 text-slate-600">
                                  {instructionsPaiement}
                                </p>
                              </div>
                            )}

                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                              <p className="text-xs font-black text-amber-900">
                                Paiement en attente de confirmation
                              </p>
                              <p className="mt-1 text-[11px] font-semibold leading-5 text-amber-800">
                                Votre commande est enregistrée. Après réception et vérification du paiement, notre équipe validera l’acompte.
                              </p>
                              {statutPaiement && (
                                <p className="mt-2 text-[9px] font-black uppercase tracking-wide text-amber-600">
                                  Statut : {statutPaiement}
                                </p>
                              )}
                            </div>

                            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                              <label
                                htmlFor="reference-transaction"
                                className="block text-[9px] font-black uppercase tracking-[0.16em] text-blue-600"
                              >
                                Référence de transaction
                              </label>

                              <p className="mt-1 text-[11px] font-semibold leading-5 text-blue-800">
                                Saisissez la référence ou l’identifiant affiché sur votre reçu Mobile Money après le transfert.
                              </p>

                              <input
                                id="reference-transaction"
                                type="text"
                                value={referenceTransaction}
                                onChange={(event) => {
                                  setReferenceTransaction(event.target.value)
                                  setErreurReference('')
                                }}
                                placeholder="Ex. 123456789012"
                                maxLength={100}
                                disabled={envoiPreuve || preuveEnvoyee}
                                className="mt-3 min-h-12 w-full rounded-2xl border border-blue-200 bg-white px-4 text-sm font-bold text-[#081A33] outline-none transition placeholder:text-slate-400 focus:border-[#0052CC] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                              />

                              {erreurReference && (
                                <p className="mt-2 text-[11px] font-bold text-red-600">
                                  {erreurReference}
                                </p>
                              )}

                              {commande.paiement?.reference_transaction && (
                                <p className="mt-2 text-[10px] font-bold text-emerald-600">
                                  ✓ Référence de transaction enregistrée
                                </p>
                              )}
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0052CC]/10 text-[#0052CC]">
                                  <ClipboardCheck size={18} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-black text-[#081A33]">
                                    Envoyer la preuve de paiement
                                  </p>
                                  <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">
                                    Ajoutez une capture ou une photo du reçu pour permettre à notre équipe de vérifier rapidement votre paiement.
                                  </p>
                                </div>
                              </div>

                              <label className="mt-4 block cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center transition hover:border-[#0052CC]/30 hover:bg-blue-50/30">
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="sr-only"
                                  disabled={envoiPreuve || preuveEnvoyee}
                                  onChange={(event) => {
                                    const fichier = event.target.files?.[0] || null
                                    setErreurPreuve('')
                                    setPreuveEnvoyee(false)

                                    if (!fichier) {
                                      setFichierPreuve(null)
                                      return
                                    }

                                    if (fichier.size > 5 * 1024 * 1024) {
                                      setFichierPreuve(null)
                                      setErreurPreuve(
                                        'La preuve doit faire au maximum 5 Mo.',
                                      )
                                      event.target.value = ''
                                      return
                                    }

                                    const formatsAcceptes = [
                                      'image/jpeg',
                                      'image/png',
                                      'image/webp',
                                    ]

                                    if (!formatsAcceptes.includes(fichier.type)) {
                                      setFichierPreuve(null)
                                      setErreurPreuve(
                                        'Format accepté : JPG, PNG ou WebP.',
                                      )
                                      event.target.value = ''
                                      return
                                    }

                                    setFichierPreuve(fichier)
                                  }}
                                />

                                <p className="text-xs font-black text-[#081A33]">
                                  {fichierPreuve
                                    ? fichierPreuve.name
                                    : 'Choisir une capture ou une photo'}
                                </p>

                                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                                  JPG, PNG ou WebP • 5 Mo maximum
                                </p>
                              </label>

                              {fichierPreuve && !preuveEnvoyee && (
                                <button
                                  type="button"
                                  disabled={envoiPreuve}
                                  onClick={gererEnvoiPreuve}
                                  className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0052CC] px-4 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-[#003D99] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <ClipboardCheck size={17} />
                                  {envoiPreuve
                                    ? 'Envoi de la preuve…'
                                    : 'Envoyer la preuve'}
                                </button>
                              )}

                              {preuveEnvoyee && (
                                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2
                                      size={17}
                                      className="shrink-0 text-emerald-600"
                                    />
                                    <p className="text-xs font-black text-emerald-800">
                                      Preuve envoyée avec succès
                                    </p>
                                  </div>
                                  <p className="mt-1 text-[10px] font-semibold leading-5 text-emerald-700">
                                    Notre équipe va vérifier votre paiement. Le statut restera en attente jusqu’à validation.
                                  </p>
                                </div>
                              )}

                              {erreurPreuve && (
                                <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3">
                                  <p className="text-[11px] font-bold leading-5 text-red-700">
                                    {erreurPreuve}
                                  </p>
                                </div>
                              )}

                              <button
                                type="button"
                                disabled={verificationPaiement}
                                onClick={verifierPaiementCommande}
                                className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#0052CC]/20 bg-[#F0F6FF] px-4 text-sm font-black text-[#0052CC] transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <ClipboardCheck size={17} />
                                {verificationPaiement
                                  ? 'Vérification en cours…'
                                  : 'Vérifier ma commande'}
                              </button>

                              {erreurVerificationPaiement && (
                                <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3">
                                  <p className="text-[11px] font-bold leading-5 text-red-700">
                                    {erreurVerificationPaiement}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-4">
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                              <p className="text-sm font-black text-amber-900">
                                Paiement Mobile Money indisponible
                              </p>
                              <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">
                                Aucun numéro marchand actif n’est actuellement configuré pour ce moyen de paiement. Votre commande reste enregistrée.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-white/80 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                            <CreditCard size={17} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-black text-[#081A33]">
                              Paiement de l’acompte
                            </p>
                            <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">
                              Votre commande est bien enregistrée et l’acompte
                              requis est de{' '}
                              <strong>{formatPrix(acompteRequis)}</strong>.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}                  </>
                )}
              </section>
            )}

            {/* PROCHAINES ÉTAPES */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0052CC]/10 text-[#0052CC]">
                  <CheckCircle2 size={19} />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Maintenant
                  </p>
                  <h2 className="text-lg font-black text-[#081A33]">
                    Que se passe-t-il ensuite ?
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-[#F7F9FC] p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0052CC] text-[10px] font-black text-white">
                    1
                  </span>

                  <p className="text-xs font-semibold text-slate-600">
                    Votre commande est enregistrée dans notre système.
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-[#F7F9FC] p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF7A1A] text-[10px] font-black text-white">
                    2
                  </span>

                  <p className="text-xs font-semibold text-slate-600">
                    Nous préparons vos articles selon leur disponibilité.
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-[#F7F9FC] p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#081A33] text-[10px] font-black text-white">
                    3
                  </span>

                  <p className="text-xs font-semibold text-slate-600">
                    Vous pourrez suivre l’évolution de votre commande.
                  </p>
                </div>
              </div>
            </section>

            {/* ACTIONS */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    commande.commandeId
                      ? `/assistance?commandeId=${encodeURIComponent(commande.commandeId)}`
                      : '/assistance'
                  )
                }
                className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-5 text-sm font-black text-orange-700 transition hover:bg-orange-100 active:scale-[0.99]"
              >
                <MessageCircle size={18} />
                Contacter l'assistance
                <ChevronRight size={17} />
              </button>

              <button
                type="button"
                disabled={paiementMobile && !acompteRegle}
                onClick={() => {
                  if (paiementMobile && !acompteRegle) return

                  const codeSuivi =
                    commande.codeSuivi || commande.codeRetrait || ''

                  navigate(
                    codeSuivi
                      ? `/suivi?code=${encodeURIComponent(codeSuivi)}`
                      : '/suivi'
                  )
                }}
                className={`flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black shadow-lg transition active:scale-[0.99] ${
                  paiementMobile && !acompteRegle
                    ? 'cursor-not-allowed bg-slate-200 text-slate-400 shadow-none'
                    : 'bg-[#0052CC] text-white shadow-blue-100 hover:bg-[#003D99]'
                }`}
              >
                <Truck size={18} />
                {paiementMobile && !acompteRegle
                  ? 'Suivi disponible après validation du paiement'
                  : 'Suivre ma commande'}
                <ChevronRight size={17} />
              </button>

              <button
                type="button"
                onClick={() => navigate('/catalogue')}
                className="mt-3 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-[#081A33] transition hover:bg-slate-50 active:scale-[0.99]"
              >
                <ShoppingBag size={18} />
                Continuer mes achats
              </button>

              <p className="mt-5 text-center text-[10px] font-medium leading-5 text-slate-400">
                Besoin d'aide ? Conservez votre numéro de commande et votre
                code pour toute demande.
              </p>
            </section>
          </div>

          {/* RÉSUMÉ */}
          <aside className="h-fit space-y-4 lg:sticky lg:top-5">
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="bg-[#081A33] px-5 py-5 text-white">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Récapitulatif
                </p>

                <p className="mt-1 text-xl font-black">
                  Votre commande
                </p>
              </div>

              <div className="p-4">
                {/* TOTAL */}
                <div className="rounded-[22px] bg-[#F0F6FF] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0052CC]">
                    Total
                  </p>

                  <p className="mt-1 text-2xl font-black tracking-tight text-[#081A33]">
                    {formatPrix(Number(commande.total || 0))}
                  </p>
                </div>

                {/* RECEPTION */}
                <div className="mt-3 rounded-[22px] bg-[#F7F9FC] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Réception
                  </p>

                  <div className="mt-2 flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        estRetrait
                          ? 'bg-orange-100 text-[#FF7A1A]'
                          : 'bg-blue-100 text-[#0052CC]'
                      }`}
                    >
                      {estRetrait ? (
                        <Package size={17} />
                      ) : (
                        <Truck size={17} />
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-black text-[#081A33]">
                        {estRetrait ? 'Retrait' : 'Livraison'}
                      </p>

                      <p className="text-[10px] font-semibold text-slate-400">
                        {estRetrait
                          ? 'Retrait en point prévu'
                          : 'Livraison à domicile'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* PAIEMENT */}
                <div className="mt-3 rounded-[22px] bg-[#F7F9FC] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Paiement
                  </p>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-[#0052CC]">
                      <CreditCard size={17} />
                    </div>

                    <p className="text-sm font-black text-[#081A33]">
                      {paiementMobile ? 'Mobile Money' : 'Espèces'}
                    </p>
                  </div>
                </div>

                {/* STATUT */}
                <div className="mt-3 flex items-center justify-between gap-3 rounded-[22px] bg-[#F7F9FC] p-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Statut
                    </p>

                    <p className="mt-1 text-sm font-black text-[#081A33]">
                      {commande.statut === 'acompte_requis'
                        ? 'Acompte requis'
                        : 'Commande reçue'}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[8px] font-black uppercase tracking-wide ${
                      commande.statut === 'acompte_requis'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {commande.statut === 'acompte_requis'
                      ? 'En attente'
                      : 'Confirmée'}
                  </span>
                </div>
              </div>
            </section>

            {/* CONFIANCE */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={19} />
                </div>

                <div>
                  <p className="text-sm font-black text-[#081A33]">
                    Commande sécurisée
                  </p>

                  <p className="mt-1 text-[10px] font-medium leading-5 text-slate-400">
                    Vos informations et les détails de votre commande sont
                    enregistrés de manière sécurisée.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* FOOTER */}
        <p className="px-3 py-6 text-center text-[9px] font-bold uppercase tracking-[0.15em] text-slate-300">
          ChinaShop-Bénin · Merci pour votre confiance
        </p>
      </div>
    </main>
  )
}
