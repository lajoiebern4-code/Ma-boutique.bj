import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  RefreshCw,
  Search,
  ShoppingCart,
  CreditCard,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { recupererCommandesAdminV2 } from '../../services/supabase'

type Commande = Record<string, any>

type NotificationItem = {
  id: string
  type: 'commande' | 'paiement' | 'preparation' | 'livraison' | 'success' | 'alerte'
  titre: string
  message: string
  date: string
  commande?: Commande
}

function formatDate(value: unknown) {
  if (!value) return 'Date inconnue'

  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return 'Date inconnue'

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function normaliser(value: unknown) {
  return String(value || '').toLowerCase().trim()
}

function creerNotification(commande: Commande): NotificationItem {
  const statut = normaliser(commande.statut)
  const livraison = normaliser(commande.livraison_statut)
  const numero = commande.numero || 'Commande inconnue'
  const client = commande.nom_client || 'Client'

  if (statut === 'annulee') {
    return {
      id: `${numero}-annulee`,
      type: 'alerte',
      titre: 'Commande annulée',
      message: `${numero} — ${client}`,
      date: commande.updated_at || commande.created_at,
      commande,
    }
  }

  if (livraison === 'en_route') {
    return {
      id: `${numero}-en-route`,
      type: 'livraison',
      titre: 'Livraison en cours',
      message: `${numero} est actuellement en route vers le client.`,
      date:
        commande.livraison_depart_at ||
        commande.updated_at ||
        commande.created_at,
      commande,
    }
  }

  if (livraison === 'arrivee') {
    return {
      id: `${numero}-arrivee`,
      type: 'livraison',
      titre: 'Livraison arrivée',
      message: `${numero} est arrivé au point de livraison.`,
      date:
        commande.livraison_arrivee_at ||
        commande.updated_at ||
        commande.created_at,
      commande,
    }
  }

  if (statut === 'livree') {
    return {
      id: `${numero}-livree`,
      type: 'success',
      titre: 'Commande livrée',
      message: `${numero} — livraison terminée avec succès.`,
      date: commande.updated_at || commande.created_at,
      commande,
    }
  }

  if (statut === 'retire') {
    return {
      id: `${numero}-retire`,
      type: 'success',
      titre: 'Commande retirée',
      message: `${numero} — commande récupérée par le client.`,
      date: commande.updated_at || commande.created_at,
      commande,
    }
  }

  if (statut === 'preparation') {
    return {
      id: `${numero}-preparation`,
      type: 'preparation',
      titre: 'Commande en préparation',
      message: `${numero} — préparation en cours.`,
      date: commande.updated_at || commande.created_at,
      commande,
    }
  }

  if (statut === 'confirmee') {
    return {
      id: `${numero}-confirmee`,
      type: 'commande',
      titre: 'Commande confirmée',
      message: `${numero} — commande de ${client}.`,
      date: commande.updated_at || commande.created_at,
      commande,
    }
  }

  if (statut === 'attente' || statut === 'recue' || statut === 'commande_recue') {
    return {
      id: `${numero}-attente`,
      type: 'commande',
      titre: 'Nouvelle commande',
      message: `${numero} — nouvelle commande reçue de ${client}.`,
      date: commande.created_at || commande.updated_at,
      commande,
    }
  }

  return {
    id: `${numero}-${statut || 'inconnu'}`,
    type: 'commande',
    titre: 'Mise à jour de commande',
    message: `${numero} — statut : ${statut || 'inconnu'}.`,
    date: commande.updated_at || commande.created_at,
    commande,
  }
}

function iconFor(type: NotificationItem['type']) {
  switch (type) {
    case 'paiement':
      return CreditCard
    case 'preparation':
      return Package
    case 'livraison':
      return Truck
    case 'success':
      return CheckCircle2
    case 'alerte':
      return AlertTriangle
    default:
      return ShoppingCart
  }
}

function badgeClass(type: NotificationItem['type']) {
  switch (type) {
    case 'paiement':
      return 'bg-violet-100 text-violet-700'
    case 'preparation':
      return 'bg-amber-100 text-amber-700'
    case 'livraison':
      return 'bg-blue-100 text-blue-700'
    case 'success':
      return 'bg-emerald-100 text-emerald-700'
    case 'alerte':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export default function Notifications() {
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState('toutes')

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')

    try {
      const resultat = await recupererCommandesAdminV2()

      if (!resultat.success) {
        throw new Error(
          resultat.error || 'Impossible de récupérer les commandes.',
        )
      }

      setCommandes(Array.isArray(resultat.data) ? resultat.data : [])
    } catch (error) {
      setErreur(
        error instanceof Error
          ? error.message
          : 'Impossible de charger les notifications.',
      )
      setCommandes([])
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  const notifications = useMemo(() => {
    return commandes
      .map(creerNotification)
      .sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime()
        const dateB = new Date(b.date || 0).getTime()
        return dateB - dateA
      })
  }, [commandes])

  const notificationsFiltrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase()

    return notifications.filter((notification) => {
      const okFiltre =
        filtre === 'toutes' || notification.type === filtre

      const texte = [
        notification.titre,
        notification.message,
        notification.commande?.numero,
        notification.commande?.nom_client,
        notification.commande?.telephone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return okFiltre && (!terme || texte.includes(terme))
    })
  }, [notifications, recherche, filtre])

  const compteurs = useMemo(
    () => ({
      total: notifications.length,
      commandes: notifications.filter((n) => n.type === 'commande').length,
      preparation: notifications.filter((n) => n.type === 'preparation').length,
      livraison: notifications.filter((n) => n.type === 'livraison').length,
      alertes: notifications.filter((n) => n.type === 'alerte').length,
    }),
    [notifications],
  )

  return (
    <div className="min-h-screen bg-[#F7F5F1] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0284C7] text-white shadow-sm">
                <Bell size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#0B1E3D]">
                  Notifications
                </h1>
                <p className="text-sm text-slate-500">
                  Activité récente de votre administration
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={charger}
            disabled={chargement}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0284C7] px-4 text-xs font-black text-white transition hover:bg-[#0369A1] disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={chargement ? 'animate-spin' : ''}
            />
            Actualiser
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Total
            </p>
            <p className="mt-2 text-2xl font-black text-[#0B1E3D]">
              {compteurs.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Commandes
            </p>
            <p className="mt-2 text-2xl font-black text-slate-700">
              {compteurs.commandes}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Préparation
            </p>
            <p className="mt-2 text-2xl font-black text-amber-600">
              {compteurs.preparation}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Livraison
            </p>
            <p className="mt-2 text-2xl font-black text-blue-600">
              {compteurs.livraison}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Alertes
            </p>
            <p className="mt-2 text-2xl font-black text-red-600">
              {compteurs.alertes}
            </p>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une commande, un client..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0B1E3D] focus:bg-white"
            />
          </div>

          <select
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none"
          >
            <option value="toutes">Toutes les notifications</option>
            <option value="commande">Commandes</option>
            <option value="preparation">Préparation</option>
            <option value="livraison">Livraison</option>
            <option value="success">Terminées</option>
            <option value="alerte">Alertes</option>
          </select>
        </div>

        {erreur && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {erreur}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <Clock size={17} className="text-slate-400" />
              <h2 className="text-sm font-black text-[#0B1E3D]">
                Activité récente
              </h2>
            </div>
          </div>

          {chargement ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <RefreshCw size={25} className="animate-spin text-[#0B1E3D]" />
            </div>
          ) : notificationsFiltrees.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Bell size={25} />
              </div>

              <p className="mt-4 text-sm font-black text-[#0B1E3D]">
                Aucune notification
              </p>

              <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                Les événements liés aux commandes apparaîtront ici
                automatiquement.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notificationsFiltrees.map((notification) => {
                const Icon = iconFor(notification.type)

                return (
                  <div
                    key={notification.id}
                    className="flex gap-4 px-5 py-5 transition hover:bg-slate-50"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${badgeClass(
                        notification.type,
                      )}`}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-black text-[#0B1E3D]">
                          {notification.titre}
                        </p>

                        <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                          {formatDate(notification.date)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-600">
                        {notification.message}
                      </p>

                      {notification.commande?.mode_reception && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">
                            {notification.commande.mode_reception}
                          </span>

                          {notification.commande.mode_paiement && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">
                              {notification.commande.mode_paiement}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
