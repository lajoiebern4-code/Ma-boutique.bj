import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  enregistrerReferenceTransaction,
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
          : commande.paiement ?? null,
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
          navigate(`/suivi?code=${encodeURIComponent(codeSuivi)}&paiement_acces_token=${encodeURIComponent(commandeMiseAJour.paiementAccesToken || "")}`)
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
    <main className="min-h-screen bg-[#FAF9FC] px-3 py-4 sm:px-5 sm:py-7">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <header className="mb-4 flex items-center justify-between px-1 sm:mb-6">
          <button
            type="button"
            onClick={() => navigate('/catalogue')}
            className="group flex items-center gap-2"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#18151F] text-white shadow-sm">
              <ShoppingBag size={19} />
            </span>

            <span className="hidden text-left sm:block">
              <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-[#9A93A5]">
                ChinaShop
              </span>
              <span className="block text-sm font-black text-[#18151F]">
                Bénin
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2 rounded-full border border-[#E8E3EF] bg-white px-3 py-2 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#6F687A]">
              Commande sécurisée
            </span>
          </div>
        </header>

        {/* SUCCESS HERO */}
        <section className="relative overflow-hidden rounded-[14px] bg-[#18151F] px-5 py-8 text-white shadow-[0_20px_60px_rgba(24,21,31,0.12)] sm:rounded-[14px] sm:px-10 sm:py-11">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#7654C6]/30 blur-3xl" />
          <div className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#7654C6]/15 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left">
              <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[14px] bg-emerald-400/10 ring-1 ring-emerald-300/20">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400">
                  <Check
                    size={31}
                    strokeWidth={3}
                    className="text-[#18151F]"
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

                <p className="mt-2 max-w-2xl text-xs leading-5 text-[#9A93A5] sm:text-sm">
                  Votre commande a bien été enregistrée. Gardez précieusement
                  votre numéro et votre code.
                </p>
              </div>
            </div>

            {/* ORDER NUMBER */}
            <div className="mt-7 rounded-[14px] border border-white/10 bg-white/[0.06] p-4 sm:p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9A93A5]">
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
            <section className="overflow-hidden rounded-[14px] border border-[#E8E3EF] bg-white shadow-sm">
              <div className="border-b border-[#E8E3EF] px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#7654C6]">
                      Votre identifiant
                    </p>

                    <h2 className="mt-1 text-lg font-black text-[#18151F]">
                      {estRetrait ? 'Code de retrait' : 'Code de suivi'}
                    </h2>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#F1ECFA] text-[#7654C6]">
                    {estRetrait ? (
                      <Package size={20} />
                    ) : (
                      <Truck size={20} />
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className="rounded-[14px] bg-[#FAF9FC] px-4 py-6 text-center ring-1 ring-[#E8E3EF] sm:px-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9A93A5]">
                    Code à conserver
                  </p>

                  <p className="mt-3 break-all text-3xl font-black tracking-[0.12em] text-[#7654C6] sm:text-4xl">
                    {code || '—'}
                  </p>

                  {code && (
                    <button
                      type="button"
                      onClick={copierCode}
                      className="mx-auto mt-5 flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-white px-5 text-xs font-black text-[#18151F] shadow-sm ring-1 ring-[#E8E3EF] transition hover:bg-[#F1ECFA] active:scale-[0.98]"
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

                <div className="mt-4 flex items-start gap-3 rounded-[10px] bg-[#F1ECFA] p-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#7654C6]/10">
                    <ClipboardCheck
                      size={16}
                      className="text-[#7654C6]"
                    />
                  </div>

                  <p className="text-xs font-semibold leading-5 text-[#6F687A]">
                    {estRetrait
                      ? 'Présentez ce code lors du retrait de votre commande.'
                      : 'Conservez ce code pour suivre l’avancement de votre livraison.'}
                  </p>
                </div>
              </div>
            </section>

            {/* RÉSUMÉ DE LA COMMANDE */}
            <section className="overflow-hidden rounded-[14px] border border-[#E8E3EF] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#7654C6]/10 text-[#7654C6]">
                  <CheckCircle2 size={19} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                    Détails de la commande
                  </p>
                  <h2 className="text-lg font-black text-[#18151F]">
                    Votre commande est prête à être suivie
                  </h2>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium leading-6 text-[#6F687A]">
                Retrouvez ici les informations essentielles de votre commande.
                Utilisez votre code pour suivre son évolution.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[10px] bg-[#FAF9FC] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9A93A5]">
                    Montant total
                  </p>
                  <p className="mt-1 text-lg font-black text-[#18151F]">
                    {formatPrix(Number(commande.total || 0))}
                  </p>
                </div>

                <div className="rounded-[10px] bg-[#FAF9FC] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9A93A5]">
                    Réception
                  </p>
                  <p className="mt-1 text-sm font-black text-[#18151F]">
                    {commande.modeReception === 'livraison'
                      ? 'Livraison à domicile'
                      : 'Retrait'}
                  </p>
                </div>

                <div className="rounded-[10px] bg-[#FAF9FC] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9A93A5]">
                    Paiement
                  </p>
                  <p className="mt-1 text-sm font-black text-[#18151F]">
                    {commande.modePaiement === 'mobile_money'
                      ? 'Mobile Money'
                      : commande.modePaiement || 'À confirmer'}
                  </p>
                </div>
              </div>
            </section>

            {/* PROCHAINES ÉTAPES */}
            <section className="rounded-[14px] border border-[#E8E3EF] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#7654C6]/10 text-[#7654C6]">
                  <CheckCircle2 size={19} />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                    Maintenant
                  </p>
                  <h2 className="text-lg font-black text-[#18151F]">
                    Que se passe-t-il ensuite ?
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 rounded-[10px] bg-[#FAF9FC] p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7654C6] text-[10px] font-black text-white">
                    1
                  </span>

                  <p className="text-xs font-semibold text-[#6F687A]">
                    Votre commande est enregistrée dans notre système.
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-[10px] bg-[#FAF9FC] p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7654C6] text-[10px] font-black text-white">
                    2
                  </span>

                  <p className="text-xs font-semibold text-[#6F687A]">
                    Nous préparons vos articles selon leur disponibilité.
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-[10px] bg-[#FAF9FC] p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#18151F] text-[10px] font-black text-white">
                    3
                  </span>

                  <p className="text-xs font-semibold text-[#6F687A]">
                    Vous pourrez suivre l’évolution de votre commande.
                  </p>
                </div>
              </div>
            </section>

            {/* ACTIONS */}
            <section className="rounded-[14px] border border-[#E8E3EF] bg-white p-5 shadow-sm sm:p-6">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    commande.commandeId
                      ? `/assistance?commandeId=${encodeURIComponent(commande.commandeId)}`
                      : '/assistance'
                  )
                }
                className="flex min-h-13 w-full items-center justify-center gap-2 rounded-[10px] border border-[#E8E3EF] bg-white px-5 text-sm font-black text-[#18151F] transition hover:bg-[#F1ECFA] active:scale-[0.99]"
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
                      ? `/suivi?code=${encodeURIComponent(codeSuivi)}&paiement_acces_token=${encodeURIComponent(commande?.paiementAccesToken || "")}`
                      : '/suivi'
                  )
                }}
                className={`flex min-h-13 w-full items-center justify-center gap-2 rounded-[10px] px-5 text-sm font-black transition active:scale-[0.99] ${
                  paiementMobile && !acompteRegle
                    ? 'cursor-not-allowed bg-[#E8E3EF] text-[#9A93A5] shadow-none'
                    : 'bg-[#7654C6] text-white  hover:bg-[#6544B3]'
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
                className="mt-3 flex min-h-13 w-full items-center justify-center gap-2 rounded-[10px] border border-[#E8E3EF] bg-white px-5 text-sm font-black text-[#18151F] transition hover:bg-[#FAF9FC] active:scale-[0.99]"
              >
                <ShoppingBag size={18} />
                Continuer mes achats
              </button>

              <p className="mt-5 text-center text-[10px] font-medium leading-5 text-[#9A93A5]">
                Besoin d'aide ? Conservez votre numéro de commande et votre
                code pour toute demande.
              </p>
            </section>
          </div>

          {/* RÉSUMÉ */}
          <aside className="h-fit space-y-4 lg:sticky lg:top-5">
            <section className="overflow-hidden rounded-[14px] border border-[#E8E3EF] bg-white shadow-sm">
              <div className="bg-[#18151F] px-5 py-5 text-white">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9A93A5]">
                  Récapitulatif
                </p>

                <p className="mt-1 text-xl font-black">
                  Votre commande
                </p>
              </div>

              <div className="p-4">
                {/* TOTAL */}
                <div className="rounded-[14px] bg-[#F1ECFA] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#7654C6]">
                    Total
                  </p>

                  <p className="mt-1 text-2xl font-black tracking-tight text-[#18151F]">
                    {formatPrix(Number(commande.total || 0))}
                  </p>
                </div>

                {/* RECEPTION */}
                <div className="mt-3 rounded-[14px] bg-[#FAF9FC] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                    Réception
                  </p>

                  <div className="mt-2 flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${
                        estRetrait
                          ? 'bg-orange-100 text-[#7654C6]'
                          : 'bg-[#F1ECFA] text-[#7654C6]'
                      }`}
                    >
                      {estRetrait ? (
                        <Package size={17} />
                      ) : (
                        <Truck size={17} />
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-black text-[#18151F]">
                        {estRetrait ? 'Retrait' : 'Livraison'}
                      </p>

                      <p className="text-[10px] font-semibold text-[#9A93A5]">
                        {estRetrait
                          ? 'Retrait en point prévu'
                          : 'Livraison à domicile'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* PAIEMENT */}
                <div className="mt-3 rounded-[14px] bg-[#FAF9FC] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                    Paiement
                  </p>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F1ECFA] text-[#7654C6]">
                      <CreditCard size={17} />
                    </div>

                    <p className="text-sm font-black text-[#18151F]">
                      {paiementMobile ? 'Mobile Money' : 'Espèces'}
                    </p>
                  </div>
                </div>

                {/* SUIVI */}
                <div className="mt-3 rounded-[14px] border border-[#E8E3EF] bg-[#F1ECFA]/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#F1ECFA] text-[#7654C6]">
                      <Truck size={17} />
                    </div>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#7654C6]">
                        Suivi de votre commande
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#6F687A]">
                        Votre code vous permet de suivre son évolution à chaque étape.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CONFIANCE */}
            <section className="rounded-[14px] border border-[#E8E3EF] bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={19} />
                </div>

                <div>
                  <p className="text-sm font-black text-[#18151F]">
                    Commande sécurisée
                  </p>

                  <p className="mt-1 text-[10px] font-medium leading-5 text-[#9A93A5]">
                    Vos informations et les détails de votre commande sont
                    enregistrés de manière sécurisée.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* FOOTER */}
        <p className="px-3 py-6 text-center text-[9px] font-bold uppercase tracking-[0.15em] text-[#9A93A5]">
          ChinaShop-Bénin · Merci pour votre confiance
        </p>
      </div>
    </main>
  )
}
