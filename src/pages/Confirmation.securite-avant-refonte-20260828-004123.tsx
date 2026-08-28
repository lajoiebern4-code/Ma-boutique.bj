import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Copy,
  CreditCard,
  Package,
  ShoppingBag,
  Truck,
} from 'lucide-react'

type ResultatCommande = {
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
}

function formatPrix(prix: number) {
  return `${prix.toLocaleString('fr-FR')} FCFA`
}

export default function Confirmation() {
  const navigate = useNavigate()

  const [commande, setCommande] = useState<ResultatCommande | null>(null)
  const [copie, setCopie] = useState(false)
  const [paiementEnCours, setPaiementEnCours] = useState(false)
  const [erreurPaiement, setErreurPaiement] = useState('')

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

  if (!commande) return null

  const estRetrait = commande.modeReception === 'retrait'

  const code =
    (estRetrait ? commande.codeRetrait : commande.codeSuivi) ||
    commande.codeSuivi ||
    commande.codeRetrait ||
    ''

  const acompteRequis = Number(commande.acompteRequis || 0)
  const acomptePaye = Number(commande.acomptePaye || 0)
  const acompteRegle = acomptePaye >= acompteRequis

  const paiementMobile =
    commande.modePaiement === 'en_ligne' ||
    commande.modePaiement === 'mobile_money'

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

  function demanderPaiementAcompte() {
    setPaiementEnCours(true)
    setErreurPaiement('')

    setTimeout(() => {
      setPaiementEnCours(false)
      setErreurPaiement(
        "Le paiement de l'acompte sera disponible prochainement.",
      )
    }, 350)
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

                    <button
                      type="button"
                      onClick={demanderPaiementAcompte}
                      disabled={paiementEnCours}
                      className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0052CC] px-5 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-[#003D99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CreditCard size={18} />

                      {paiementEnCours
                        ? 'Préparation du paiement...'
                        : `Payer l’acompte — ${formatPrix(acompteRequis)}`}
                    </button>

                    {erreurPaiement && (
                      <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold leading-5 text-red-700">
                        {erreurPaiement}
                      </p>
                    )}
                  </>
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
                onClick={() => navigate('/suivi')}
                className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#0052CC] px-5 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-[#003D99] active:scale-[0.99]"
              >
                <Truck size={18} />
                Suivre ma commande
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
