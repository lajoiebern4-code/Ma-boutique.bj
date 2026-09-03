import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  MapPin,
  Package,
  RefreshCw,
  Truck,
} from 'lucide-react'
import { recupererMesCommandes } from '../services/supabase'

type Commande = {
  id?: string
  numero?: string
  created_at?: string
  statut?: string
  total?: number
  mode_reception?: string
  code_suivi?: string
  acompte_requis?: number
  acompte_paye?: number
}

const statutLabels: Record<string, string> = {
  acompte_requis: 'Acompte requis',
  acompte_paye: 'Acompte reçu',
  commande_recue: 'Commande reçue',
  en_attente: 'En attente',
  en_attente_paiement: 'Paiement en attente',
  confirmee: 'Confirmée',
  preparation: 'En préparation',
  pret: 'Prête',
  expedition: 'En expédition',
  transit: 'En transit',
  en_cours_livraison: 'En cours de livraison',
  livree: 'Livrée',
  annulee: 'Annulée',
}

function getStatutLabel(statut?: string) {
  const value = String(statut || 'en_attente').toLowerCase()
  return statutLabels[value] || statut || 'En attente'
}

function getStatutClass(statut?: string) {
  const value = String(statut || '').toLowerCase()

  if (value === 'livree') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
  }

  if (value === 'annulee') {
    return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
  }

  if (
    value === 'en_cours_livraison' ||
    value === 'expedition' ||
    value === 'transit'
  ) {
    return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
  }

  if (
    value === 'confirmee' ||
    value === 'commande_recue' ||
    value === 'preparation' ||
    value === 'pret'
  ) {
    return 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
  }

  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
}

function formatDate(date?: string) {
  if (!date) return 'Date indisponible'

  const value = new Date(date)

  if (Number.isNaN(value.getTime())) {
    return 'Date indisponible'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}

function formatMoney(value?: number) {
  return `${Math.round(Number(value) || 0).toLocaleString('fr-FR')} FCFA`
}

function getModeReception(mode?: string) {
  if (mode === 'livraison') {
    return {
      label: 'Livraison à domicile',
      icon: Truck,
    }
  }

  return {
    label: 'Retrait',
    icon: MapPin,
  }
}

export default function MesCommandes() {
  const navigate = useNavigate()
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  async function chargerCommandes() {
    setChargement(true)
    setErreur('')

    try {
      const resultat = await recupererMesCommandes()

      if (!resultat.success) {
        throw new Error(
          resultat.error || 'Impossible de charger vos commandes',
        )
      }

      setCommandes(resultat.data as Commande[])
    } catch (err) {
      console.error('Erreur chargement historique commandes:', err)
      setErreur('Impossible de charger vos commandes pour le moment.')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    void chargerCommandes()
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0B1120]">
      <section className="relative overflow-hidden bg-[#0B1E3D]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,82,204,0.28),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(255,122,26,0.18),transparent_40%)]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10">
          <button
            type="button"
            onClick={() => navigate('/compte')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-4 py-2.5 text-xs font-black text-white/80 transition hover:bg-white/[0.14] hover:text-white"
          >
            <ArrowLeft size={15} />
            Retour au compte
          </button>

          <div className="mt-8 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
              <Package size={14} className="text-[#FF7A1A]" />
              ChinaShop-Bénin
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-[-0.03em] text-white sm:text-5xl">
              Mes commandes
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Retrouvez ici l’ensemble de vos commandes et leur état
              d’avancement.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
        {chargement ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827] sm:p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-3 h-3 w-44 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="h-7 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                  <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                  <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : erreur ? (
          <div className="rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-sm dark:border-red-900/40 dark:bg-[#111827]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
              <RefreshCw size={24} />
            </div>

            <h2 className="mt-5 text-lg font-black text-slate-900 dark:text-white">
              Impossible de charger vos commandes
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Une erreur temporaire est survenue. Vous pouvez réessayer sans
              perdre vos commandes.
            </p>

            <button
              type="button"
              onClick={() => void chargerCommandes()}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#0052CC] px-5 text-xs font-black text-white shadow-lg shadow-[#0052CC]/20 transition hover:bg-[#003D99]"
            >
              <RefreshCw size={15} />
              Réessayer
            </button>
          </div>
        ) : commandes.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-[#111827]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <Package size={28} />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900 dark:text-white">
              Aucune commande
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Votre historique de commandes apparaîtra automatiquement ici
              après votre première commande.
            </p>

            <Link
              to="/catalogue"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#0052CC] px-5 text-xs font-black text-white shadow-lg shadow-[#0052CC]/20 transition hover:bg-[#003D99]"
            >
              Découvrir les produits
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Historique
                </p>
                <h2 className="mt-1 text-xl font-black text-[#0B1E3D] dark:text-white sm:text-2xl">
                  {commandes.length} commande
                  {commandes.length > 1 ? 's' : ''}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => void chargerCommandes()}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-slate-300 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-300"
                title="Actualiser"
              >
                <RefreshCw size={14} />
                <span className="hidden sm:inline">Actualiser</span>
              </button>
            </div>

            {commandes.map((commande) => {
              const reception = getModeReception(commande.mode_reception)
              const ReceptionIcon = reception.icon

              const total = Number(commande.total || 0)
              const acompteRequis = Number(commande.acompte_requis || 0)
              const acomptePaye = Number(commande.acompte_paye || 0)
              const resteAcompte = Math.max(
                0,
                acompteRequis - acomptePaye,
              )

              return (
                <article
                  key={commande.id || commande.numero}
                  className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-[#111827]"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Commande
                        </p>

                        <h3 className="mt-1 text-xl font-black tracking-tight text-[#0B1E3D] dark:text-white">
                          {commande.numero || 'Commande'}
                        </h3>

                        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock3 size={13} />
                          {formatDate(commande.created_at)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1.5 text-[10px] font-black ${getStatutClass(commande.statut)}`}
                      >
                        {getStatutLabel(commande.statut)}
                      </span>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                          Montant
                        </p>
                        <p className="mt-2 text-sm font-black text-[#0B1E3D] dark:text-white">
                          {formatMoney(total)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                          Réception
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-black text-[#0B1E3D] dark:text-white">
                          <ReceptionIcon
                            size={16}
                            className={
                              commande.mode_reception === 'livraison'
                                ? 'text-[#0052CC]'
                                : 'text-[#FF7A1A]'
                            }
                          />
                          {commande.mode_reception === 'livraison'
                            ? 'Livraison'
                            : 'Retrait'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                          Paiement
                        </p>

                        {resteAcompte > 0 ? (
                          <p className="mt-2 text-sm font-black text-orange-600">
                            Reste {formatMoney(resteAcompte)}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm font-black text-emerald-600">
                            Paiement à jour
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        {commande.code_suivi ? (
                          <>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                              Code de suivi
                            </p>
                            <p className="mt-1 text-xs font-black tracking-[0.12em] text-[#0B1E3D] dark:text-white">
                              {commande.code_suivi}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-slate-400">
                            Aucun code de suivi disponible.
                          </p>
                        )}
                      </div>

                      {commande.code_suivi && (
                        <Link
                          to={`/suivi?code=${encodeURIComponent(commande.code_suivi)}`}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0052CC] px-5 text-xs font-black text-white shadow-lg shadow-[#0052CC]/20 transition hover:bg-[#003D99]"
                        >
                          Suivre la commande
                          <ArrowRight size={15} />
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
