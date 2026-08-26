import { useEffect, useState } from 'react'
import { ArrowLeft, Trophy, Crown, Medal, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../services/supabase'

type NiveauData = {
  montant_achats_cumules: number
  niveau_code: string
  niveau_nom: string
  seuil_actuel: number
  prochain_niveau_code: string | null
  prochain_niveau_nom: string | null
  prochain_seuil: number | null
  montant_restant: number
}

const niveaux = [
  { code: 'bronze', nom: 'Bronze', seuil: 0, icon: Medal },
  { code: 'argent', nom: 'Argent', seuil: 100000, icon: Trophy },
  { code: 'or', nom: 'Or', seuil: 300000, icon: Crown },
  { code: 'platine', nom: 'Platine', seuil: 700000, icon: Sparkles },
]

export default function Niveau() {
  const [niveau, setNiveau] = useState<NiveauData | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    async function chargerNiveau() {
      setChargement(true)
      setErreur('')

      const { data, error } = await supabase.rpc('cs_mon_niveau_client')

      if (error) {
        console.error('Erreur niveau:', error)
        setErreur('Impossible de charger votre niveau.')
      } else {
        setNiveau(data as NiveauData)
      }

      setChargement(false)
    }

    chargerNiveau()
  }, [])

  const formatFcfa = (montant: number) =>
    Math.round(Number(montant || 0)).toLocaleString('fr-FR') + ' FCFA'

  if (chargement) {
    return (
      <section className="min-h-[calc(100vh-180px)] bg-[#F7F5F1] px-4 py-10">
        <div className="mx-auto max-w-3xl animate-pulse">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="mt-6 h-64 rounded-3xl bg-white" />
        </div>
      </section>
    )
  }

  if (erreur || !niveau) {
    return (
      <section className="min-h-[calc(100vh-180px)] bg-[#F7F5F1] px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/compte/parametres"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"
          >
            <ArrowLeft size={17} />
            Paramètres
          </Link>

          <div className="mt-6 rounded-3xl border border-red-100 bg-white p-6 text-red-600">
            {erreur || 'Niveau indisponible.'}
          </div>
        </div>
      </section>
    )
  }

  const indexActuel = niveaux.findIndex((item) => item.code === niveau.niveau_code)
  const prochain = niveau.prochain_seuil
  const seuilActuel = Number(niveau.seuil_actuel || 0)
  const total = Number(niveau.montant_achats_cumules || 0)

  const progression = prochain
    ? Math.min(
        100,
        Math.max(
          0,
          ((total - seuilActuel) / (Number(prochain) - seuilActuel)) * 100,
        ),
      )
    : 100

  const IconActuel =
    niveaux.find((item) => item.code === niveau.niveau_code)?.icon || Trophy

  return (
    <section className="min-h-[calc(100vh-180px)] bg-[#F7F5F1] px-4 py-10 sm:px-6 lg:py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/compte/parametres"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-orange-600"
        >
          <ArrowLeft size={17} />
          Paramètres
        </Link>

        <div className="mt-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
            Fidélité ChinaShop
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl">
            Mon niveau
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Votre niveau évolue automatiquement selon le montant de vos achats terminés.
          </p>
        </div>

        <div className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-[#0B1E3D] p-7 text-white sm:p-9">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                <IconActuel size={31} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                  Niveau actuel
                </p>
                <h2 className="mt-1 text-3xl font-black">
                  {niveau.niveau_nom}
                </h2>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-white/60">Achats cumulés</p>
                  <p className="mt-1 text-2xl font-black">
                    {formatFcfa(total)}
                  </p>
                </div>

                {niveau.prochain_niveau_nom && (
                  <div className="text-right">
                    <p className="text-xs text-white/60">Prochain niveau</p>
                    <p className="mt-1 font-black">
                      {niveau.prochain_niveau_nom}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all"
                  style={{ width: `${progression}%` }}
                />
              </div>

              {niveau.prochain_niveau_nom ? (
                <p className="mt-3 text-xs text-white/60">
                  Encore{' '}
                  <span className="font-black text-white">
                    {formatFcfa(Number(niveau.montant_restant))}
                  </span>{' '}
                  pour atteindre {niveau.prochain_niveau_nom}.
                </p>
              ) : (
                <p className="mt-3 text-xs font-bold text-white/70">
                  Vous avez atteint le niveau maximum actuel.
                </p>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <h3 className="font-black text-[#0B1E3D]">
              Progression des niveaux
            </h3>

            <div className="mt-6 space-y-3">
              {niveaux.map((item, index) => {
                const Icon = item.icon
                const actif = item.code === niveau.niveau_code
                const atteint = index <= indexActuel

                return (
                  <div
                    key={item.code}
                    className={`flex items-center gap-4 rounded-2xl border p-4 ${
                      actif
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        atteint
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-white text-slate-300'
                      }`}
                    >
                      <Icon size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-black text-[#0B1E3D]">
                        {item.nom}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        À partir de {formatFcfa(item.seuil)}
                      </p>
                    </div>

                    {actif && (
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase text-orange-700">
                        Actuel
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
