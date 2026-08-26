import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronRight,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react'
import { recupererCommandesAdminDetaillees } from '../../services/supabase'

type LigneCommande = {
  id?: string
  produit_id?: string
  nom_produit?: string
  quantite?: number
  prix_unitaire?: number
  total_ligne?: number
}

type Commande = {
  id?: string
  numero?: string
  nom_client?: string
  telephone?: string
  email?: string
  statut?: string
  mode_reception?: string
  mode_paiement?: string
  prix_total?: number
  total?: number
  created_at?: string
  lignes?: LigneCommande[]
}

type Client = {
  key: string
  nom: string
  telephone: string
  email: string
  commandes: Commande[]
  total: number
  derniereCommande?: string
}

function montant(value?: number) {
  return `${Math.round(Number(value || 0)).toLocaleString('fr-FR')} FCFA`
}

function dateCourte(value?: string) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  const maintenant = new Date()
  const hier = new Date()
  hier.setDate(maintenant.getDate() - 1)

  if (date.toDateString() === maintenant.toDateString()) {
    return `Aujourd'hui · ${new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)}`
  }

  if (date.toDateString() === hier.toDateString()) {
    return 'Hier'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function statutLabel(statut?: string) {
  const value = String(statut || '').toLowerCase()

  const labels: Record<string, string> = {
    attente: 'Reçue',
    recue: 'Reçue',
    commande_recue: 'Reçue',
    confirmee: 'Confirmée',
    preparation: 'Préparation',
    pret: 'Prête',
    retire: 'Retirée',
    expedition: 'Expédition',
    transit: 'En transit',
    livree: 'Livrée',
    annulee: 'Annulée',
  }

  return labels[value] || statut || '—'
}

function statutStyle(statut?: string) {
  const value = String(statut || '').toLowerCase()

  if (value === 'livree' || value === 'retire') {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (value === 'annulee') {
    return 'bg-red-50 text-red-700'
  }

  if (value === 'transit' || value === 'expedition') {
    return 'bg-blue-50 text-blue-700'
  }

  if (value === 'confirmee') {
    return 'bg-sky-50 text-sky-700'
  }

  if (value === 'pret') {
    return 'bg-violet-50 text-violet-700'
  }

  return 'bg-orange-50 text-[#0B1E3D]'
}

export default function Clients() {
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [clientSelectionne, setClientSelectionne] = useState<Client | null>(null)

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')

    try {
      const resultat = await recupererCommandesAdminDetaillees()

      if (!resultat.success) {
        setErreur(
          resultat.error || 'Impossible de récupérer les données clients.',
        )
        setCommandes([])
        return
      }

      const donnees = (resultat.data || []).map((item: any) => ({
        ...(item.commande || {}),
        lignes: Array.isArray(item.lignes) ? item.lignes : [],
      }))

      setCommandes(donnees)
    } catch (error) {
      console.error('Erreur chargement clients:', error)
      setErreur(
        error instanceof Error
          ? error.message
          : 'Impossible de récupérer les clients.',
      )
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  const clients = useMemo<Client[]>(() => {
    const groupes = new Map<string, Client>()

    for (const commande of commandes) {
      const telephone = String(commande.telephone || '').trim()
      const email = String(commande.email || '').trim().toLowerCase()
      const nom = String(commande.nom_client || '').trim()

      const key =
        telephone ||
        email ||
        nom.toLowerCase() ||
        `commande-${commande.numero || commande.id}`

      const existant = groupes.get(key)

      const totalCommande = Number(
        commande.total ?? commande.prix_total ?? 0,
      )

      if (!existant) {
        groupes.set(key, {
          key,
          nom: nom || 'Client',
          telephone,
          email,
          commandes: [commande],
          total: totalCommande,
          derniereCommande: commande.created_at,
        })
        continue
      }

      existant.commandes.push(commande)
      existant.total += totalCommande

      if (
        commande.created_at &&
        (!existant.derniereCommande ||
          new Date(commande.created_at).getTime() >
            new Date(existant.derniereCommande).getTime())
      ) {
        existant.derniereCommande = commande.created_at
      }

      if (!existant.nom && nom) existant.nom = nom
      if (!existant.telephone && telephone) existant.telephone = telephone
      if (!existant.email && email) existant.email = email
    }

    return Array.from(groupes.values()).sort((a, b) => {
      const dateA = a.derniereCommande
        ? new Date(a.derniereCommande).getTime()
        : 0
      const dateB = b.derniereCommande
        ? new Date(b.derniereCommande).getTime()
        : 0

      return dateB - dateA
    })
  }, [commandes])

  const clientsFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase()

    if (!terme) return clients

    return clients.filter((client) =>
      [
        client.nom,
        client.telephone,
        client.email,
      ].some((value) => String(value || '').toLowerCase().includes(terme)),
    )
  }, [clients, recherche])

  const statistiques = useMemo(() => {
    const chiffreAffaires = clients.reduce(
      (total, client) => total + client.total,
      0,
    )

    return {
      clients: clients.length,
      commandes: commandes.length,
      chiffreAffaires,
    }
  }, [clients, commandes])

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#163B70]">
            Relation client
          </p>

          <div className="mt-0.5 flex items-baseline gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1E3D]">
              Clients
            </h1>

            <span className="text-xs font-semibold text-slate-400">
              {statistiques.clients} client
              {statistiques.clients > 1 ? 's' : ''}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-slate-500">
            Vue consolidée des clients à partir de leurs commandes.
          </p>
        </div>

        <button
          type="button"
          onClick={charger}
          disabled={chargement}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-[#0B1E3D] shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={chargement ? 'animate-spin' : ''}
          />
          Actualiser
        </button>
      </div>

      {/* Erreur */}
      {erreur && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {erreur}
        </div>
      )}

      {/* Statistiques compactes */}
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Clients
          </p>
          <p className="mt-1 text-xl font-extrabold text-[#0B1E3D]">
            {chargement ? '—' : statistiques.clients}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Commandes
          </p>
          <p className="mt-1 text-xl font-extrabold text-[#0B1E3D]">
            {chargement ? '—' : statistiques.commandes}
          </p>
        </div>

        <div className="col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm xl:col-span-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Chiffre d'affaires
          </p>
          <p className="mt-1 text-xl font-extrabold text-[#0B1E3D]">
            {chargement ? '—' : montant(statistiques.chiffreAffaires)}
          </p>
        </div>
      </div>

      {/* Tableau */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2.5 border-b border-slate-100 p-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Rechercher un client, téléphone ou email..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs outline-none transition focus:border-[#163B70] focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-center">Commandes</th>
                <th className="px-4 py-3">Total dépensé</th>
                <th className="px-4 py-3">Dernière commande</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {clientsFiltres.map((client) => (
                <tr
                  key={client.key}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#0B1E3D]">
                        <User size={16} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#0B1E3D]">
                          {client.nom}
                        </p>

                        {client.email && (
                          <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-slate-400">
                            {client.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {client.telephone ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <Phone size={13} className="text-slate-400" />
                        {client.telephone}
                      </div>
                    ) : client.email ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail size={13} className="text-slate-400" />
                        Email
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-extrabold text-slate-700">
                      {client.commandes.length}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-extrabold text-[#0B1E3D]">
                      {montant(client.total)}
                    </p>
                  </td>

                  <td className="px-4 py-3 text-xs text-slate-500">
                    {dateCourte(client.derniereCommande)}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setClientSelectionne(client)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100 hover:text-[#0B1E3D]"
                    >
                      Voir
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!chargement && clientsFiltres.length === 0 && (
          <div className="px-5 py-12 text-center">
            <User
              size={34}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-semibold text-slate-500">
              Aucun client trouvé.
            </p>

            {recherche && (
              <button
                type="button"
                onClick={() => setRecherche('')}
                className="mt-2 text-xs font-bold text-[#163B70] hover:underline"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        )}

        <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] font-semibold text-slate-400">
          {clientsFiltres.length} client
          {clientsFiltres.length > 1 ? 's' : ''} affiché
          {clientsFiltres.length > 1 ? 's' : ''}
        </div>
      </section>

      {/* Fiche client */}
      {clientSelectionne && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => setClientSelectionne(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#0B1E3D]">
                  <User size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#163B70]">
                    Fiche client
                  </p>

                  <h2 className="truncate text-lg font-extrabold text-[#0B1E3D]">
                    {clientSelectionne.nom}
                  </h2>

                  <p className="text-xs text-slate-500">
                    {clientSelectionne.telephone || 'Téléphone non renseigné'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setClientSelectionne(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <X size={17} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-73px)] overflow-y-auto">
              {/* Résumé */}
              <div className="grid grid-cols-3 gap-2.5 border-b border-slate-100 p-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                    Commandes
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-[#0B1E3D]">
                    {clientSelectionne.commandes.length}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                    Total dépensé
                  </p>
                  <p className="mt-1 truncate text-lg font-extrabold text-[#0B1E3D]">
                    {montant(clientSelectionne.total)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                    Dernière commande
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#0B1E3D]">
                    {dateCourte(clientSelectionne.derniereCommande)}
                  </p>
                </div>
              </div>

              {/* Coordonnées */}
              <div className="grid gap-2.5 border-b border-slate-100 p-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone size={14} />
                    <span className="text-[10px] font-extrabold uppercase tracking-wide">
                      Téléphone
                    </span>
                  </div>

                  <p className="mt-1.5 text-sm font-bold text-[#0B1E3D]">
                    {clientSelectionne.telephone || 'Non renseigné'}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail size={14} />
                    <span className="text-[10px] font-extrabold uppercase tracking-wide">
                      Email
                    </span>
                  </div>

                  <p className="mt-1.5 truncate text-sm font-bold text-[#0B1E3D]">
                    {clientSelectionne.email || 'Non renseigné'}
                  </p>
                </div>
              </div>

              {/* Historique */}
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-[#163B70]" />

                  <h3 className="text-sm font-extrabold text-[#0B1E3D]">
                    Historique des commandes
                  </h3>
                </div>

                <div className="mt-3 overflow-hidden rounded-xl border border-slate-100">
                  <div className="divide-y divide-slate-100">
                    {[...clientSelectionne.commandes]
                      .sort((a, b) => {
                        const dateA = a.created_at
                          ? new Date(a.created_at).getTime()
                          : 0
                        const dateB = b.created_at
                          ? new Date(b.created_at).getTime()
                          : 0

                        return dateB - dateA
                      })
                      .map((commande, index) => (
                        <div
                          key={commande.id || commande.numero || index}
                          className="flex items-center gap-3 px-3 py-3 transition hover:bg-slate-50"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            <ShoppingBag
                              size={14}
                              className="text-slate-500"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#0B1E3D]">
                              {commande.numero || 'Commande'}
                            </p>

                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
                              <span>
                                {dateCourte(commande.created_at)}
                              </span>

                              <span>·</span>

                              <span>
                                {commande.mode_reception === 'livraison'
                                  ? 'Livraison'
                                  : 'Retrait'}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="font-extrabold text-[#0B1E3D]">
                              {montant(
                                commande.total ?? commande.prix_total,
                              )}
                            </p>

                            <span
                              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statutStyle(
                                commande.statut,
                              )}`}
                            >
                              {statutLabel(commande.statut)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
