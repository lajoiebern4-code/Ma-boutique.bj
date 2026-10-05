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
  Phone,
  CheckCircle2,
} from 'lucide-react'
import { recupererMesCommandes } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

type Etape = {
  id?: string
  titre?: string
  statut?: string
  position?: number
  description?: string
  date_etape?: string
  created_at?: string
}

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
  livraison_statut?: string
  livreur_nom?: string
  livreur_telephone?: string
  etapes?: Etape[]
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
    return 'bg-[#FAF9F6] text-orange-700 dark:bg-[#0F1B3D]/20 dark:text-orange-300'
  }

  return 'bg-[#FAF9F6] text-[#6B7280] dark:bg-[#211C29] dark:text-[#B0A9BA]'
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

function formatTelephone(value?: string) {
  const telephone = String(value || '').replace(/\D/g, '').slice(0, 10)

  if (telephone.length !== 10) {
    return telephone
  }

  return telephone.replace(
    /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/,
    '$1 $2 $3 $4 $5',
  )
}

function libelleEtape(statut?: string, titre?: string) {
  if (titre) return titre

  const labels: Record<string, string> = {
    acompte_requis: 'Acompte requis',
    acompte_paye: 'Acompte reçu',
    commande_recue: 'Commande reçue',
    attente: 'En attente',
    en_attente: 'En attente',
    en_attente_paiement: 'Paiement en attente',
    confirmee: 'Commande confirmée',
    preparation: 'Préparation',
    pret: 'Commande prête',
    expedition: 'Expédition',
    transit: 'En transit',
    en_cours_livraison: 'En cours de livraison',
    livree: 'Commande livrée',
    annulee: 'Commande annulée',
  }

  return labels[String(statut || '').toLowerCase()] || statut || 'Mise à jour'
}

function formatDateEtape(date?: string) {
  if (!date) return ''

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  } catch {
    return ''
  }
}

export default function MesCommandes() {
  const { user, chargement: authChargement } = useAuth()
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
    if (authChargement || !user?.id) {
      return
    }

    void chargerCommandes()
  }, [authChargement, user?.id])

  return (
    <main className="min-h-screen bg-[#FFFFFF] dark:bg-[#17131D]">
      <section className="relative overflow-hidden bg-[#1A1A2E]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,82,204,0.28),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(255,122,26,0.18),transparent_40%)]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10">
          <button
            type="button"
            onClick={() => navigate('/compte')}
            className="inline-flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.08] px-4 py-2.5 text-xs font-black text-white/80 transition hover:bg-white/[0.14] hover:text-white"
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

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#B0A9BA] sm:text-base">
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
                className="animate-pulse rounded-[14px] border border-[#FAF9F6] bg-white p-5 shadow-sm dark:border-[#3A3344] dark:bg-[#211C29] sm:p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="h-5 w-32 rounded bg-[#FAF9F6] dark:bg-[#3A3344]" />
                    <div className="mt-3 h-3 w-44 rounded bg-[#FAF9F6] dark:bg-[#3A3344]" />
                  </div>
                  <div className="h-7 w-24 rounded-full bg-[#FAF9F6] dark:bg-[#3A3344]" />
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="h-16 rounded-[10px] bg-[#FAF9F6] dark:bg-[#211C29]" />
                  <div className="h-16 rounded-[10px] bg-[#FAF9F6] dark:bg-[#211C29]" />
                  <div className="h-16 rounded-[10px] bg-[#FAF9F6] dark:bg-[#211C29]" />
                </div>
              </div>
            ))}
          </div>
        ) : erreur ? (
          <div className="rounded-[14px] border border-red-100 bg-white p-8 text-center shadow-sm dark:border-red-900/40 dark:bg-[#211C29]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[10px] bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
              <RefreshCw size={24} />
            </div>

            <h2 className="mt-5 text-lg font-black text-[#1A1A2E] dark:text-white">
              Impossible de charger vos commandes
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B7280] dark:text-[#9A93A5]">
              Une erreur temporaire est survenue. Vous pouvez réessayer sans
              perdre vos commandes.
            </p>

            <button
              type="button"
              onClick={() => void chargerCommandes()}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#0F1B3D] !text-white px-5 text-xs font-black text-white shadow-[0_2px_10px_rgba(24,21,31,0.05)] transition hover:bg-[#C9A24B] hover:text-[#0F1B3D]"
            >
              <RefreshCw size={15} />
              Réessayer
            </button>
          </div>
        ) : commandes.length === 0 ? (
          <div className="rounded-[14px] border border-[#FAF9F6] bg-white p-10 text-center shadow-sm dark:border-[#3A3344] dark:bg-[#211C29]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[10px] bg-[#FAF9F6] text-[#0F1B3D] dark:bg-[#0F1B3D]/20 dark:text-[#E8E4DC]">
              <Package size={28} />
            </div>

            <h2 className="mt-5 text-xl font-black text-[#1A1A2E] dark:text-white">
              Aucune commande
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B7280] dark:text-[#9A93A5]">
              Votre historique de commandes apparaîtra automatiquement ici
              après votre première commande.
            </p>

            <Link
              to="/catalogue"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#0F1B3D] !text-white px-5 text-xs font-black text-white shadow-[0_2px_10px_rgba(24,21,31,0.05)] transition hover:bg-[#C9A24B] hover:text-[#0F1B3D]"
            >
              Découvrir les produits
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                  Historique
                </p>
                <h2 className="mt-1 text-xl font-black text-[#1A1A2E] dark:text-white sm:text-2xl">
                  {commandes.length} commande
                  {commandes.length > 1 ? 's' : ''}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => void chargerCommandes()}
                className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#FAF9F6] bg-white px-3 text-xs font-black text-[#6B7280] transition hover:border-[#D9D2E2] dark:border-[#3A3344] dark:bg-[#211C29] dark:text-[#B0A9BA]"
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
                  className="overflow-hidden rounded-[14px] border border-[#FAF9F6] bg-white shadow-sm transition  hover:shadow-sm dark:border-[#3A3344] dark:bg-[#211C29]"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                          Commande
                        </p>

                        <h3 className="mt-1 text-xl font-black tracking-tight text-[#1A1A2E] dark:text-white">
                          {commande.numero || 'Commande'}
                        </h3>

                        <p className="mt-2 flex items-center gap-1.5 text-xs text-[#9A93A5]">
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
                      <div className="rounded-[10px] bg-[#FFFFFF] p-4 dark:bg-[#211C29]/70">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A93A5]">
                          Montant
                        </p>
                        <p className="mt-2 text-sm font-black text-[#1A1A2E] dark:text-white">
                          {formatMoney(total)}
                        </p>
                      </div>

                      <div className="rounded-[10px] bg-[#FFFFFF] p-4 dark:bg-[#211C29]/70">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A93A5]">
                          Réception
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-black text-[#1A1A2E] dark:text-white">
                          <ReceptionIcon
                            size={16}
                            className={
                              commande.mode_reception === 'livraison'
                                ? 'text-[#0F1B3D]'
                                : 'text-[#FF7A1A]'
                            }
                          />
                          {commande.mode_reception === 'livraison'
                            ? 'Livraison'
                            : 'Retrait'}
                        </p>
                      </div>

                      <div className="rounded-[10px] bg-[#FFFFFF] p-4 dark:bg-[#211C29]/70">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A93A5]">
                          Paiement
                        </p>

                        {resteAcompte > 0 ? (
                          <p className="mt-2 text-sm font-black text-[#0F1B3D]">
                            Reste {formatMoney(resteAcompte)}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm font-black text-emerald-600">
                            Paiement à jour
                          </p>
                        )}
                      </div>
                    </div>

                    {commande.mode_reception === 'livraison' &&
                      ['en_route', 'livree'].includes(
                        String(commande.livraison_statut || '').toLowerCase(),
                      ) &&
                      commande.livreur_telephone && (
                        <div className="mt-5 rounded-[10px] border border-[#FAF9F6] bg-[#FFFFFF] p-4 dark:border-[#3A3344] dark:bg-[#211C29]/60">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#1A1A2E] shadow-sm ring-1 ring-slate-200 dark:bg-[#17131D] dark:ring-slate-700">
                                <Truck size={18} />
                              </div>

                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9A93A5]">
                                  Votre livreur
                                </p>

                                <p className="mt-1 text-sm font-black text-[#1A1A2E] dark:text-white">
                                  {commande.livreur_nom || 'Livreur'}
                                </p>

                                <p className="mt-1 text-xs font-semibold text-[#6B7280] dark:text-[#9A93A5]">
                                  {formatTelephone(commande.livreur_telephone)}
                                </p>
                              </div>
                            </div>

                            <a
                              href={`tel:+229${String(commande.livreur_telephone).replace(/\D/g, '')}`}
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#1A1A2E] px-5 text-xs font-black text-white shadow-sm transition hover:bg-[#C9A24B] hover:text-[#0F1B3D] active:scale-[0.99]"
                            >
                              <Phone size={15} />
                              Appeler le livreur
                            </a>
                          </div>
                        </div>
                      )}

                    {/* HISTORIQUE DE LA COMMANDE */}
                    <div className="mt-5 rounded-[10px] border border-[#FAF9F6] bg-white p-5 shadow-sm dark:border-[#3A3344] dark:bg-[#17131D]/70">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0F1B3D]">
                            Progression
                          </p>
                          <h3 className="mt-1 text-xl font-black text-[#1A1A2E] dark:text-white">
                            Historique de la commande
                          </h3>
                        </div>

                        <span className="rounded-full bg-[#FAF9F6] px-3 py-1 text-[10px] font-black text-[#6B7280] dark:bg-[#211C29] dark:text-[#9A93A5]">
                          {(commande.etapes || []).length} étape{(commande.etapes || []).length > 1 ? 's' : ''}
                        </span>
                      </div>

                      {(commande.etapes || []).length === 0 ? (
                        <div className="mt-5 rounded-[10px] border border-dashed border-[#FAF9F6] bg-[#FFFFFF] p-7 text-center dark:border-[#3A3344] dark:bg-[#211C29]/50">
                          <Package size={28} className="mx-auto text-[#B0A9BA]" />
                          <p className="mt-3 text-sm font-bold text-[#6B7280] dark:text-[#9A93A5]">
                            Aucun événement de suivi n’est encore disponible.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-6">
                          {[...(commande.etapes || [])]
                            .sort(
                              (a, b) =>
                                Number(a.position || 0) -
                                Number(b.position || 0),
                            )
                            .map((etape, index, liste) => {
                              const statutEtape = String(
                                etape.statut || '',
                              ).toLowerCase()

                              const estLivree =
                                String(commande.statut || '').toLowerCase() ===
                                  'livree' ||
                                statutEtape === 'livree'

                              const actuelle =
                                index === liste.length - 1 && !estLivree

                              return (
                                <div
                                  key={
                                    etape.id ||
                                    `${etape.position}-${etape.statut}-${index}`
                                  }
                                  className="flex gap-4"
                                >
                                  <div className="flex flex-col items-center">
                                    <div
                                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] ${
                                        actuelle
                                          ? 'bg-[#0F1B3D] !text-white shadow-[0_2px_10px_rgba(24,21,31,0.05)] ring-4 ring-[#0F1B3D]/10'
                                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                                      }`}
                                    >
                                      {actuelle ? (
                                        <Package size={19} />
                                      ) : (
                                        <CheckCircle2 size={19} />
                                      )}
                                    </div>

                                    {index < liste.length - 1 && (
                                      <div className="my-1 h-16 w-px bg-[#FAF9F6] dark:bg-[#3A3344]" />
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1 pb-7">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                      <p
                                        className={`text-sm font-black ${
                                          actuelle
                                            ? 'text-[#1A1A2E] dark:text-white'
                                            : 'text-[#1A1A2E] dark:text-[#B0A9BA]'
                                        }`}
                                      >
                                        {libelleEtape(
                                          etape.statut,
                                          etape.titre,
                                        )}
                                      </p>

                                      {(etape.date_etape ||
                                        etape.created_at) && (
                                        <span className="text-[10px] font-bold text-[#9A93A5]">
                                          {formatDateEtape(
                                            etape.date_etape ||
                                              etape.created_at,
                                          )}
                                        </span>
                                      )}
                                    </div>

                                    {etape.description && (
                                      <p className="mt-1 max-w-xl text-xs leading-5 text-[#6B7280] dark:text-[#9A93A5]">
                                        {etape.description}
                                      </p>
                                    )}

                                    {actuelle && (
                                      <span className="mt-2 inline-flex rounded-full bg-[#FF7A1A]/10 px-2.5 py-1 text-[10px] font-black text-[#FF7A1A]">
                                        Étape actuelle
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-[#FAF9F6] pt-5 dark:border-[#3A3344] sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        {commande.code_suivi ? (
                          <>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9A93A5]">
                              Code de suivi
                            </p>
                            <p className="mt-1 text-xs font-black tracking-[0.12em] text-[#1A1A2E] dark:text-white">
                              {commande.code_suivi}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-[#9A93A5]">
                            Aucun code de suivi disponible.
                          </p>
                        )}
                      </div>

                      {commande.code_suivi && (
                        <Link
                          to={`/suivi?code=${encodeURIComponent(commande.code_suivi)}`}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0F1B3D] !text-white px-5 text-xs font-black text-white shadow-[0_2px_10px_rgba(24,21,31,0.05)] transition hover:bg-[#C9A24B] hover:text-[#0F1B3D]"
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
