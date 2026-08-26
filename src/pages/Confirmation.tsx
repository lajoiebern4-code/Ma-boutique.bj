import { useEffect, useState } from 'react'
import { CheckCircle2, Copy, Package, ShoppingBag, Truck } from 'lucide-react'
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

  async function copierCode() {
    if (!code) return

    try {
      await navigator.clipboard.writeText(code)
      setCopie(true)
      setTimeout(() => setCopie(false), 1800)
    } catch {
      // Le code reste visible même si le presse-papiers n'est pas disponible.
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F5F1] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="text-emerald-600" size={38} />
          </div>

          <p className="mt-5 text-sm font-bold uppercase tracking-wider text-emerald-600">
            Commande confirmée
          </p>

          <h1 className="mt-2 text-3xl font-black text-[#0B1E3D]">
            Merci pour votre commande
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Votre commande a bien été enregistrée. Conservez votre numéro et
            votre code pour le suivi ou le retrait.
          </p>

          <div className="mt-7 rounded-2xl bg-slate-50 p-5 text-left">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Numéro de commande
            </p>
            <p className="mt-1 text-xl font-black text-[#0B1E3D]">
              {commande.numeroCommande || '—'}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border-2 border-orange-100 bg-orange-50 p-5">
            <div className="flex items-center justify-center gap-2">
              {commande.modeReception === 'retrait' ? (
                <Package className="text-orange-600" size={20} />
              ) : (
                <Truck className="text-orange-600" size={20} />
              )}

              <p className="text-xs font-black uppercase tracking-wide text-orange-700">
                {commande.modeReception === 'retrait'
                  ? 'Code de retrait'
                  : 'Code de suivi'}
              </p>
            </div>

            <p className="mt-3 text-3xl font-black tracking-wider text-[#0B1E3D]">
              {code || '—'}
            </p>

            {code && (
              <button
                type="button"
                onClick={copierCode}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#0B1E3D] ring-1 ring-orange-200"
              >
                <Copy size={16} />
                {copie ? 'Code copié' : 'Copier le code'}
              </button>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4 text-left">
              <p className="text-xs font-bold text-slate-400">Total</p>
              <p className="mt-1 text-lg font-black text-[#0B1E3D]">
                {formatPrix(Number(commande.total || 0))}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-left">
              <p className="text-xs font-bold text-slate-400">Statut</p>
              <p className="mt-1 text-lg font-black text-[#0B1E3D]">
                {commande.statut === 'acompte_requis'
                  ? 'Acompte requis'
                  : 'Commande reçue'}
              </p>
            </div>
          </div>

          {Number(commande.acompteRequis || 0) > 0 && (
            <div
              className={`mt-5 rounded-2xl border p-4 text-left ${
                Number(commande.acomptePaye || 0) >=
                Number(commande.acompteRequis || 0)
                  ? 'border-emerald-100 bg-emerald-50'
                  : 'border-amber-100 bg-amber-50'
              }`}
            >
              <p
                className={`text-sm font-black ${
                  Number(commande.acomptePaye || 0) >=
                  Number(commande.acompteRequis || 0)
                    ? 'text-emerald-900'
                    : 'text-amber-900'
                }`}
              >
                {Number(commande.acomptePaye || 0) >=
                Number(commande.acompteRequis || 0)
                  ? 'Acompte reçu'
                  : 'Acompte à régler'}
              </p>

              <p
                className={`mt-1 text-xs leading-5 ${
                  Number(commande.acomptePaye || 0) >=
                  Number(commande.acompteRequis || 0)
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }`}
              >
                Montant de l'acompte :{' '}
                <strong>
                  {formatPrix(Number(commande.acompteRequis || 0))}
                </strong>
              </p>

              {Number(commande.acomptePaye || 0) <
                Number(commande.acompteRequis || 0) && (
                <>
                  <p className="mt-2 text-xs leading-5 text-amber-700">
                    Votre commande est enregistrée. L’acompte requis doit être
                    réglé avant le traitement de votre commande.
                  </p>

                  <button
                    type="button"
                    onClick={() => setErreurPaiement('Le paiement de l’acompte sera disponible prochainement.')}
                    disabled={paiementEnCours}
                    className="mt-4 w-full rounded-xl bg-[#0284C7] px-5 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {paiementEnCours
                      ? 'Enregistrement du paiement...'
                      : `Payer l’acompte — ${formatPrix(
                          Number(commande.acompteRequis || 0),
                        )}`}
                  </button>

                  {erreurPaiement && (
                    <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
                      {erreurPaiement}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate('/suivi')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-5 py-3 font-bold text-white"
            >
              <Truck size={18} />
              Suivre ma commande
            </button>

            <button
              type="button"
              onClick={() => navigate('/catalogue')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-[#0B1E3D]"
            >
              <ShoppingBag size={18} />
              Continuer mes achats
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
