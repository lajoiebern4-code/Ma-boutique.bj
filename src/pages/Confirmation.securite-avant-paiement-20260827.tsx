import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Copy,
  CreditCard,
  Package,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type ResultatCommande = {
  numeroCommande?: string
  codeSuivi?: string
  codeRetrait?: string
  total?: number
  acompteRequis?: number
  acomptePaye?: number
  statut?: string
  modeReception?: 'livraison' | 'retrait'
  modePaiement?: 'especes' | 'mobile_money'
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

  if (!commande) {
    return null
  }

  const code =
    commande.modeReception === 'retrait'
      ? commande.codeRetrait
      : commande.codeSuivi

  const acompteRequis = Number(commande.acompteRequis || 0)
  const acomptePaye = Number(commande.acomptePaye || 0)
  const acompteRegle = acomptePaye >= acompteRequis

  async function copierCode() {
    if (!code) return

    try {
      await navigator.clipboard.writeText(code)
      setCopie(true)
      setTimeout(() => setCopie(false), 1800)
    } catch {
      // Le code reste visible si le presse-papiers n'est pas disponible.
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

  const estRetrait = commande.modeReception === 'retrait'

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">

        {/* HERO */}
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(11,30,61,0.08)]">
          <div className="relative overflow-hidden bg-[#0B1E3D] px-6 py-10 text-center text-white sm:px-10 sm:py-12">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#0284C7]/20 blur-2xl" />
            <div className="absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-orange-500/15 blur-2xl" />

            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/15 ring-8 ring-white/5">
              <CheckCircle2
                size={48}
                strokeWidth={2.5}
                className="text-emerald-400"
              />
            </div>

            <p className="relative mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
              Commande enregistrée
            </p>

            <h1 className="relative mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Merci pour votre commande
            </h1>

            <p className="relative mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Votre commande a bien été enregistrée. Conservez précieusement
              votre numéro et votre code.
            </p>
          </div>

          <div className="p-5 sm:p-8">

            {/* NUMÉRO */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Numéro de commande
              </p>

              <div className="mt-2 flex items-center justify-between gap-4">
                <p className="break-all text-xl font-black tracking-tight text-[#0B1E3D] sm:text-2xl">
                  {commande.numeroCommande || '—'}
                </p>

                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm sm:flex">
                  <Package size={19} />
                </div>
              </div>
            </div>

            {/* CODE */}
            <div className="mt-4 overflow-hidden rounded-[1.5rem] border-2 border-orange-100 bg-orange-50">
              <div className="p-5 text-center sm:p-7">
                <div className="flex items-center justify-center gap-2">
                  {estRetrait ? (
                    <Package size={18} className="text-orange-600" />
                  ) : (
                    <Truck size={18} className="text-orange-600" />
                  )}

                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
                    {estRetrait ? 'Code de retrait' : 'Code de suivi'}
                  </p>
                </div>

                <p className="mt-4 break-all text-3xl font-black tracking-[0.12em] text-[#0B1E3D] sm:text-4xl">
                  {code || '—'}
                </p>

                {code && (
                  <button
                    type="button"
                    onClick={copierCode}
                    className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-black text-[#0B1E3D] shadow-sm ring-1 ring-orange-200 transition hover:bg-orange-100"
                  >
                    <Copy size={16} />
                    {copie ? 'Code copié ✓' : 'Copier le code'}
                  </button>
                )}
              </div>

              <div className="border-t border-orange-100 bg-white/60 px-5 py-3 text-center">
                <p className="text-[10px] font-semibold text-orange-700">
                  {estRetrait
                    ? 'Présentez ce code lors du retrait de votre commande.'
                    : 'Conservez ce code pour suivre votre commande.'}
                </p>
              </div>
            </div>

            {/* RÉSUMÉ */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Total de la commande
                </p>
                <p className="mt-2 text-xl font-black text-[#0B1E3D]">
                  {formatPrix(Number(commande.total || 0))}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Mode de réception
                </p>

                <div className="mt-2 flex items-center gap-2">
                  {estRetrait ? (
                    <Package size={18} className="text-orange-500" />
                  ) : (
                    <Truck size={18} className="text-[#0284C7]" />
                  )}

                  <p className="text-lg font-black text-[#0B1E3D]">
                    {estRetrait ? 'Retrait' : 'Livraison'}
                  </p>
                </div>
              </div>
            </div>

            {/* STATUT */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Statut
                  </p>
                  <p className="mt-1 text-base font-black text-[#0B1E3D]">
                    {commande.statut === 'acompte_requis'
                      ? 'Acompte requis'
                      : 'Commande reçue'}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${
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

            {/* ACOMPTE */}
            {acompteRequis > 0 && (
              <div
                className={`mt-4 overflow-hidden rounded-2xl border ${
                  acompteRegle
                    ? 'border-emerald-100 bg-emerald-50'
                    : 'border-amber-100 bg-amber-50'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        acompteRegle
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      <CreditCard size={19} />
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-sm font-black ${
                          acompteRegle
                            ? 'text-emerald-900'
                            : 'text-amber-900'
                        }`}
                      >
                        {acompteRegle
                          ? 'Acompte reçu'
                          : 'Acompte à régler'}
                      </p>

                      <p
                        className={`mt-1 text-xs leading-5 ${
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
                      <div className="mt-4 rounded-xl bg-white/80 p-4">
                        <p className="text-xs leading-5 text-amber-800">
                          Votre commande est enregistrée. L’acompte doit être
                          réglé avant le traitement de votre commande.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={demanderPaiementAcompte}
                        disabled={paiementEnCours}
                        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-5 text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-60"
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
                </div>
              </div>
            )}

            {/* ACTIONS */}
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate('/suivi')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-5 text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:bg-[#0369A1]"
              >
                <Truck size={18} />
                Suivre ma commande
              </button>

              <button
                type="button"
                onClick={() => navigate('/catalogue')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-[#0B1E3D] transition hover:border-slate-300 hover:bg-slate-50"
              >
                <ShoppingBag size={18} />
                Continuer mes achats
              </button>
            </div>

            {/* NOTE */}
            <div className="mt-6 text-center">
              <p className="text-[11px] leading-5 text-slate-400">
                Besoin d'aide ? Conservez votre numéro de commande et votre
                code pour toute demande concernant votre commande.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
