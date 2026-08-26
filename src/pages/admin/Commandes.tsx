import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  CalendarDays,
  ChevronDown,
  Eye,
  Package,
  RefreshCw,
  Search,
  User,
  X,
} from 'lucide-react'
import {
  recupererCommandesAdminV2,
  recupererCommandesAdminDetaillees,
  mettreAJourStatutCommandeV2,
  programmerTrajetLivraison,
  demarrerTrajetLivraison,
  enregistrerArriveeLivraison,
  terminerTrajetLivraison,
} from '../../services/supabase'

type LigneCommande = {
  id?: string
  produit_id?: string
  nom_produit?: string
  prix_unitaire?: number
  quantite?: number
  origine?: string
  total_ligne?: number
  image_url?: string
  categorie?: string
  description?: string
}

type Commande = {
  id?: string
  lignes?: LigneCommande[]
  numero?: string
  nom_client?: string
  telephone?: string
  email?: string
  statut?: string
  mode_reception?: string
  mode_paiement?: string
  adresse_livraison?: string
  code_suivi?: string
  code_retrait?: string
  sous_total?: number
  reduction?: number
  frais_livraison?: number
  prix_total?: number
  total?: number
  acompte_requis?: number
  acompte_paye?: number
  type_commande?: string
  livraison_statut?: string
  point_depart?: string
  point_destination?: string
  depart_prevu_at?: string
  arrivee_prevue_at?: string
  depart_reel_at?: string
  arrivee_reelle_at?: string
  livraison_confirmee_at?: string
  livreur_nom?: string
  created_at?: string
}

const STATUTS = [
  'attente',
  'confirmee',
  'preparation',
  'pret',
  'expedition',
  'transit',
  'livree',
  'annulee',
]

const STATUTS_COMMANDES = [
  'attente',
  'confirmee',
  'preparation',
  'pret',
  'retire',
]

const LABELS: Record<string, string> = {
  attente: 'Commande reçue',
  recue: 'Commande reçue',
  commande_recue: 'Commande reçue',
  confirmee: 'Confirmée',
  preparation: 'Préparation',
  pret: 'Prête',
  retire: 'Retrait',
  expedition: 'Expédition',
  transit: 'En transit',
  livree: 'Livrée',
  annulee: 'Annulée',
}

function labelStatut(statut?: string) {
  const value = String(statut || '').toLowerCase()
  return LABELS[value] || statut || '—'
}

function styleStatut(statut?: string) {
  const value = String(statut || '').toLowerCase()

  if (value === 'livree') return 'bg-emerald-50 text-emerald-700'
  if (value === 'annulee') return 'bg-red-50 text-red-700'
  if (value === 'transit' || value === 'expedition') {
    return 'bg-blue-50 text-blue-700'
  }
  if (value === 'pret') return 'bg-violet-50 text-violet-700'
  if (value === 'confirmee') return 'bg-sky-50 text-sky-700'

  return 'bg-orange-50 text-[#0B1E3D]'
}

function prix(value?: number) {
  return `${Math.round(Number(value || 0)).toLocaleString('fr-FR')} FCFA`
}

function dateCommande(value?: string) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function Commandes() {
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('toutes')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [commandeSelectionnee, setCommandeSelectionnee] =
    useState<Commande | null>(null)
  const [statutEnCours, setStatutEnCours] = useState('')

  const [livraisonEnCours, setLivraisonEnCours] = useState(false)
  const [confirmationDemarrage, setConfirmationDemarrage] = useState<{
    commande: Commande
    heureArrivee: string
  } | null>(null)
  const [confirmationRetrait, setConfirmationRetrait] = useState(false)
  const [codeRetraitSaisi, setCodeRetraitSaisi] = useState('')

    async function executerProchaineAction(commande: Commande) {
      if (!commande.numero) {
        alert('Numéro de commande introuvable.')
        return
      }

      const statut = String(
        commande.statut || 'attente',
      ).toLowerCase()

      const trajet = String(
        commande.livraison_statut || 'non_planifiee',
      ).toLowerCase()

      try {
        setStatutEnCours(commande.numero)

        // Commande reçue → Confirmée
        if (
          ['attente', 'recue', 'commande_recue'].includes(
            statut,
          )
        ) {
          await changerStatut(commande, 'confirmee')
          return
        }

        // Confirmée → Préparation
        if (statut === 'confirmee') {
          await changerStatut(commande, 'preparation')
          return
        }

        // Préparation → Prête
        if (statut === 'preparation') {
          await changerStatut(commande, 'pret')
          return
        }

        // Prête → prochaine étape selon le mode de réception
        if (statut === 'pret') {
          if (commande.mode_reception === 'retrait') {
            setConfirmationRetrait(true)
            setCodeRetraitSaisi('')
            return
          }

          if (commande.mode_reception === 'livraison') {
            await executerActionLivraison(
              commande,
              'programmer',
            )
            return
          }
        }

        // Livraison programmée → demander confirmation de l'heure d'arrivée
    if (trajet === 'planifiee') {
      const arriveeExistante = commande.arrivee_prevue_at
        ? new Date(commande.arrivee_prevue_at)
        : new Date(Date.now() + 30 * 60 * 1000)

      const heureArrivee = Number.isNaN(arriveeExistante.getTime())
        ? new Date(Date.now() + 30 * 60 * 1000)
        : arriveeExistante

      const deuxChiffres = (value: number) =>
        String(value).padStart(2, '0')

      const valeurDateHeure =
        [
          heureArrivee.getFullYear(),
          deuxChiffres(heureArrivee.getMonth() + 1),
          deuxChiffres(heureArrivee.getDate()),
        ].join('-') +
        'T' +
        [
          deuxChiffres(heureArrivee.getHours()),
          deuxChiffres(heureArrivee.getMinutes()),
        ].join(':')

      setConfirmationDemarrage({
        commande,
        heureArrivee: valeurDateHeure,
      })

      return
    }

        // Livraison en route → Confirmer l'arrivée
        if (trajet === 'en_route') {
          await executerActionLivraison(
            commande,
            'arrivee',
          )
          return
        }

        // Livreur arrivé → Livrée
        if (trajet === 'arrivee') {
          await executerActionLivraison(
            commande,
            'terminer',
          )
          return
        }

        alert(
          'Aucune prochaine action disponible pour cette commande.',
        )
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : 'Impossible d’effectuer la prochaine action.',
        )
      } finally {
        setStatutEnCours('')
      }
    }

  async function executerActionLivraison(
    commande: Commande,
    action: 'programmer' | 'demarrer' | 'arrivee' | 'terminer',
  ) {
    if (!commande.numero) {
      alert('Numéro de commande introuvable.')
      return
    }

    try {
      setLivraisonEnCours(true)

      let resultat

      if (action === 'programmer') {

        const pointA = String(

          commande.point_depart || 'ChinaShop-Benin',

        ).trim()


        const pointB = String(

          commande.point_destination ||

            commande.adresse_livraison ||

            '',

        ).trim()


        if (!pointB) {

          throw new Error(

            'Destination de livraison introuvable.',

          )

        }


        const depart = new Date()

        const arrivee = new Date(

          depart.getTime() + 60 * 60 * 1000,

        )


        resultat = await programmerTrajetLivraison(

          commande.numero,

          pointA,

          pointB,

          depart.toISOString(),

          arrivee.toISOString(),

        )

      } else if (action === 'arrivee') {
        resultat = await enregistrerArriveeLivraison(
          commande.numero,
        )
      } else {
        resultat = await terminerTrajetLivraison(
          commande.numero,
        )
      }

      if (!resultat?.success) {
        throw new Error(
          resultat?.error ||
            'Impossible de mettre à jour la livraison.',
        )
      }

      const actualisee = await recupererCommandesAdminDetaillees()

      if (actualisee.success) {
        const commandesDetaillees = (actualisee.data || []).map((item) => ({
          ...(item.commande || {}),
          lignes: Array.isArray(item.lignes) ? item.lignes : [],
        }))

        setCommandes(commandesDetaillees)

        const nouvelleCommande = commandesDetaillees.find(
          (item) =>
            item.numero === commande.numero,
        )

        if (nouvelleCommande) {
          setCommandeSelectionnee(nouvelleCommande)
        }
      }
    } catch (err) {
      console.error('Erreur action livraison:', err)

      alert(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue.',
      )
    } finally {
      setLivraisonEnCours(false)
    }
  }


  const confirmerDemarrage = async () => {
    if (!confirmationDemarrage?.commande.numero) return

    const numeroCommande = String(
      confirmationDemarrage.commande.numero,
    ).trim()

    setStatutEnCours(numeroCommande)
    setLivraisonEnCours(true)
    setErreur('')

    try {
      const resultat = await demarrerTrajetLivraison(
        numeroCommande,
        confirmationDemarrage.heureArrivee,
      )

      if (!resultat?.success) {
        throw new Error(
          resultat?.error ||
            'Impossible de démarrer la livraison.',
        )
      }

      setConfirmationDemarrage(null)

      const actualisee = await recupererCommandesAdminDetaillees()

      if (actualisee.success) {
        const commandesDetaillees = (actualisee.data || []).map(
          (item) => ({
            ...(item.commande || {}),
            lignes: Array.isArray(item.lignes)
              ? item.lignes
              : [],
          }),
        )

        setCommandes(commandesDetaillees)

        const nouvelleCommande = commandesDetaillees.find(
          (item) => item.numero === numeroCommande,
        )

        if (nouvelleCommande) {
          setCommandeSelectionnee(nouvelleCommande)
        }
      }
    } catch (error) {
      console.error(
        'Erreur confirmation démarrage livraison:',
        error,
      )

      setErreur(
        error instanceof Error
          ? error.message
          : 'Impossible de démarrer la livraison.',
      )
    } finally {
      setStatutEnCours('')
      setLivraisonEnCours(false)
    }
  }

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')

    const resultat = await recupererCommandesAdminDetaillees()

    if (!resultat.success) {
      setErreur(resultat.error || 'Impossible de récupérer les commandes.')
      setCommandes([])
    } else {
      const commandesDetaillees = (resultat.data || []).map((item) => ({
        ...(item.commande || {}),
        lignes: Array.isArray(item.lignes) ? item.lignes : [],
      }))

      setCommandes(commandesDetaillees)
    }

    setChargement(false)
  }, [])

  useEffect(() => {
    charger()

    const channel = supabase
      .channel('admin-commandes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cs_commandes',
        },
        () => {
          charger()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [charger])

  const changerStatut = async (
    commande: Commande,
    statut: string,
    codeRetrait?: string,
  ): Promise<boolean> => {
    if (!commande.numero || !statut) return false

    setStatutEnCours(commande.numero)
    setErreur('')

    try {
      await mettreAJourStatutCommandeV2(
        commande.numero,
        statut,
        codeRetrait || null,
      )

      setCommandes((actuelles) =>
        actuelles.map((item) =>
          item.numero === commande.numero
            ? { ...item, statut }
            : item,
        ),
      )

      setCommandeSelectionnee((actuelle) =>
        actuelle?.numero === commande.numero
          ? { ...actuelle, statut }
          : actuelle,
      )

      return true
    } catch (error) {
      setErreur(
        error instanceof Error
          ? error.message
          : 'Impossible de modifier le statut.',
      )
      return false
    } finally {
      setStatutEnCours('')
    }
  }

  const filtrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase()

    return commandes.filter((commande) => {
      const statut = String(commande.statut || '').toLowerCase()

      const okStatut =
        filtreStatut === 'toutes' || statut === filtreStatut

      const okRecherche =
        !terme ||
        String(commande.nom_client || '').toLowerCase().includes(terme) ||
        String(commande.telephone || '').toLowerCase().includes(terme) ||
        String(commande.numero || '').toLowerCase().includes(terme)

      return okStatut && okRecherche
    })
  }, [commandes, recherche, filtreStatut])

  const statistiques = useMemo(() => {
    return {
      total: commandes.length,
      commande_recue: commandes.filter((c) => {
        const statut = String(c.statut || '').toLowerCase()
        return statut === 'attente' || statut === 'recue' || statut === 'commande_recue'
      }).length,
      preparation: commandes.filter(
        (c) => String(c.statut || '').toLowerCase() === 'preparation',
      ).length,
      livrees: commandes.filter(
        (c) => String(c.statut || '').toLowerCase() === 'livree',
      ).length,
    }
  }, [commandes])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#163B70]">
            Opérations
          </p>
          <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-[#0B1E3D]">
            Commandes
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Gérez les commandes enregistrées dans le nouveau système.
          </p>
        </div>

        <button
          type="button"
          onClick={charger}
          disabled={chargement}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-[#0B1E3D] shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={chargement ? 'animate-spin' : ''}
          />
          Actualiser
        </button>
      </div>

      {erreur && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {erreur}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {[
          ['Total', statistiques.total],
          ['Commandes reçues', statistiques.commande_recue],
          ['Préparation', statistiques.preparation],
          ['Livrées', statistiques.livrees],
        ].map(([label, valeur]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <p className="mt-1 text-xl font-extrabold text-[#0B1E3D]">
              {chargement ? '—' : valeur}
            </p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2.5 border-b border-slate-100 p-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher client, téléphone ou commande..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs outline-none transition focus:border-[#163B70] focus:bg-white"
            />
          </div>

          <div className="relative">
            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#163B70] sm:w-52"
            >
              <option value="toutes">Tous les statuts</option>
              {STATUTS.map((statut) => (
                <option key={statut} value={statut}>
                  {labelStatut(statut)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Commande</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Réception</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filtrees.map((commande) => (
                <tr
                  key={commande.id || commande.numero}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3">
                    <p className="font-bold text-[#0B1E3D]">
                      {commande.numero || '—'}
                    </p>
                    {commande.code_suivi && (
                      <p className="mt-1 text-xs text-slate-400">
                        {commande.code_suivi}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#0B1E3D]">
                      {commande.nom_client || 'Client'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {commande.telephone || '—'}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-slate-600">
                      {commande.mode_reception === 'livraison'
                        ? 'Livraison'
                        : 'Retrait'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-extrabold text-[#0B1E3D]">
                      {prix(
                        commande.total ??
                          commande.prix_total,
                      )}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${styleStatut(
                          commande.statut,
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                                                                    {labelStatut(commande.statut)}
                      </span>

                      
                    </div>
                  </td>

                  <td className="px-4 py-3 text-xs text-slate-500">
                    {dateCommande(commande.created_at)}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setCommandeSelectionnee(commande)
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                      title="Voir la commande"
                    >
                      <Eye size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!chargement && filtrees.length === 0 && (
          <div className="px-5 py-10 text-center">
            <Package
              size={36}
              className="mx-auto text-slate-300"
            />
            <p className="mt-3 font-semibold text-slate-500">
              Aucune commande trouvée.
            </p>
          </div>
        )}

        <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] font-semibold text-slate-400">
          {filtrees.length} commande(s) affichée(s)
        </div>
      </section>

      {commandeSelectionnee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => setCommandeSelectionnee(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#163B70]">
                  Détail commande
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-[#0B1E3D]">
                  {commandeSelectionnee.numero || 'Commande'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setCommandeSelectionnee(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <User size={16} />
                  <span className="text-xs font-bold uppercase">
                    Client
                  </span>
                </div>
                <p className="mt-2 font-bold text-[#0B1E3D]">
                  {commandeSelectionnee.nom_client || '—'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {commandeSelectionnee.telephone || '—'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <CalendarDays size={16} />
                  <span className="text-xs font-bold uppercase">
                    Créée le
                  </span>
                </div>
                <p className="mt-2 font-semibold text-[#0B1E3D]">
                  {dateCommande(commandeSelectionnee.created_at)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Réception
                </p>
                <p className="mt-2 font-bold text-[#0B1E3D]">
                  {commandeSelectionnee.mode_reception === 'livraison'
                    ? 'Livraison'
                    : 'Retrait'}
                </p>
                {commandeSelectionnee.adresse_livraison && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {commandeSelectionnee.adresse_livraison}
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Paiement
                </p>
                <p className="mt-2 font-bold text-[#0B1E3D]">
                  {commandeSelectionnee.mode_paiement || '—'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Montant
                </p>
                <p className="mt-1 text-xl font-extrabold text-[#0B1E3D]">
                  {prix(
                    commandeSelectionnee.total ??
                      commandeSelectionnee.prix_total,
                  )}
                </p>
                {Number(commandeSelectionnee.acompte_requis || 0) > 0 && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Acompte requis :{' '}
                    {prix(commandeSelectionnee.acompte_requis)}
                    {' · '}
                    payé :{' '}
                    {prix(commandeSelectionnee.acompte_paye)}
                  </p>
                )}
              </div>


          <div className="border-t border-slate-100 p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-[#163B70]">
              Articles commandés
            </p>

            <div className="mt-4 space-y-3">
              {commandeSelectionnee.lignes?.length ? (
                commandeSelectionnee.lignes.map((ligne, index) => (
                  <div
                    key={ligne.id || ligne.produit_id || index}
                    className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"
                  >
                    {ligne.image_url ? (
                      <img
                        src={ligne.image_url}
                        alt={ligne.nom_produit || 'Produit'}
                        className="h-16 w-16 shrink-0 rounded-xl object-cover bg-white"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white text-2xl">
                        📦
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#0B1E3D]">
                        {ligne.nom_produit || 'Produit'}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Qté : {Number(ligne.quantite || 0)}
                        {' · '}
                        {prix(ligne.prix_unitaire)}
                      </p>

                      {ligne.origine && (
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          Origine : {ligne.origine}
                        </p>
                      )}
                    </div>

                    <p className="shrink-0 font-extrabold text-[#0B1E3D]">
                      {prix(ligne.total_ligne)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                  Aucun article disponible.
                </p>
              )}
            </div>
          </div>

              {(commandeSelectionnee.code_suivi ||
                commandeSelectionnee.code_retrait) && (
                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 sm:col-span-2">
                  <p className="text-xs font-bold uppercase text-[#163B70]">
                    Codes
                  </p>

                  {commandeSelectionnee.code_suivi && (
                    <p className="mt-2 font-bold text-[#0B1E3D]">
                      Suivi : {commandeSelectionnee.code_suivi}
                    </p>
                  )}

                  {commandeSelectionnee.code_retrait && (
                    <p className="mt-1 font-bold text-[#0B1E3D]">
                      Retrait : {commandeSelectionnee.code_retrait}
                    </p>
                  )}
                </div>
              )}
            </div>

            {commandeSelectionnee.mode_reception === 'livraison' && (
              <div className="border-t border-slate-100 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Pilotage de la livraison
                    </p>
                    <h3 className="mt-1 text-lg font-extrabold text-[#0B1E3D]">
                      {(commandeSelectionnee.livraison_statut || 'non_planifiee') === 'non_planifiee'
                        ? 'Livraison à programmer'
                        : commandeSelectionnee.livraison_statut === 'planifiee'
                          ? 'Livraison planifiée'
                          : commandeSelectionnee.livraison_statut === 'en_route'
                            ? 'Livraison en route'
                            : commandeSelectionnee.livraison_statut === 'arrivee'
                              ? 'Livreur arrivé'
                              : commandeSelectionnee.livraison_statut === 'livree'
                                ? 'Livraison terminée'
                                : commandeSelectionnee.livraison_statut || '—'}
                    </h3>
                  </div>

                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#0B1E3D]">
                    {commandeSelectionnee.livraison_statut || 'non_planifiee'}
                  </span>
                </div>

                {(commandeSelectionnee.point_depart ||
                  commandeSelectionnee.point_destination) && (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-bold text-[#0B1E3D]">
                      {commandeSelectionnee.point_depart || '—'}
                      {' → '}
                      {commandeSelectionnee.point_destination || '—'}
                    </p>

                    {commandeSelectionnee.depart_prevu_at && (
                      <p className="mt-2 text-xs text-slate-500">
                        Départ prévu :{' '}
                        {dateCommande(commandeSelectionnee.depart_prevu_at)}
                      </p>
                    )}

                    {commandeSelectionnee.arrivee_prevue_at && (
                      <p className="mt-1 text-xs text-slate-500">
                        Arrivée prévue :{' '}
                        {dateCommande(commandeSelectionnee.arrivee_prevue_at)}
                      </p>
                    )}

                    {commandeSelectionnee.depart_reel_at && (
                      <p className="mt-1 text-xs text-slate-500">
                        Départ réel :{' '}
                        {dateCommande(commandeSelectionnee.depart_reel_at)}
                      </p>
                    )}

                    {commandeSelectionnee.arrivee_reelle_at && (
                      <p className="mt-1 text-xs text-slate-500">
                        Arrivée réelle :{' '}
                        {dateCommande(commandeSelectionnee.arrivee_reelle_at)}
                      </p>
                    )}

                    {commandeSelectionnee.livraison_confirmee_at && (
                      <p className="mt-1 text-xs font-semibold text-emerald-600">
                        Livraison confirmée :{' '}
                        {dateCommande(
                          commandeSelectionnee.livraison_confirmee_at,
                        )}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4">
                    <button
                      type="button"
                      disabled={
                        livraisonEnCours ||
                        statutEnCours === commandeSelectionnee.numero
                      }
                      onClick={() =>
                        executerProchaineAction(commandeSelectionnee)
                      }
                      className="w-full rounded-xl bg-[#0284C7] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {statutEnCours === commandeSelectionnee.numero
                        ? 'Traitement…'
                        : (() => {
                            const statut = String(
                              commandeSelectionnee.statut || 'attente',
                            ).toLowerCase()

                            const trajet = String(
                              commandeSelectionnee.livraison_statut ||
                                'non_planifiee',
                            ).toLowerCase()

                            if (
                              statut === 'livree' ||
                              statut === 'retire' ||
                              statut === 'annulee'
                            ) {
                              return statut === 'annulee'
                                ? 'Commande annulée'
                                : '✓ Terminée'
                            }

                            if (
                                ['attente', 'recue'].includes(statut)
                              ) {
                                return 'Confirmer la commande'
                              }

                              if (statut === 'confirmee') {
                                return 'Préparer la commande'
                              }

                              if (statut === 'preparation') {
                              return 'Marquer comme prête'
                            }

                            if (
                              statut === 'pret' &&
                              commandeSelectionnee.mode_reception === 'retrait'
                            ) {
                              return 'Confirmer le retrait'
                            }

                            if (
                              statut === 'pret' &&
                              commandeSelectionnee.mode_reception === 'livraison'
                            ) {
                              return trajet === 'non_planifiee'
                                ? 'Programmer la livraison'
                                : 'Prochaine action'
                            }

                            if (trajet === 'planifiee') {
                              return 'Démarrer la livraison'
                            }

                            if (trajet === 'en_route') {
                              return "Confirmer l'arrivée"
                            }

                            if (trajet === 'arrivee') {
                              return 'Marquer comme livrée'
                            }

                            return 'Prochaine action'
                          })()}
                    </button>
                  </div>

            {confirmationDemarrage && (
        <div className="border-t border-slate-100 p-6">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
              Démarrage de la livraison
            </p>

            <h3 className="mt-1 text-lg font-extrabold text-[#0B1E3D]">
              Confirmer le départ
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              La livraison va passer en route. Vérifiez l'heure prévue
              d'arrivée avant de démarrer.
            </p>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Heure d'arrivée prévue
              </label>

              <input
                type="datetime-local"
                value={confirmationDemarrage.heureArrivee}
                onChange={(e) =>
                  setConfirmationDemarrage((precedent) =>
                    precedent
                      ? {
                          ...precedent,
                          heureArrivee: e.target.value,
                        }
                      : precedent,
                  )
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0B1E3D] outline-none focus:border-blue-500"
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmationDemarrage(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={
                  !confirmationDemarrage.heureArrivee ||
                  livraisonEnCours ||
                  statutEnCours === confirmationDemarrage.commande.numero
                }
                onClick={confirmerDemarrage}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {livraisonEnCours
                  ? 'Démarrage…'
                  : 'Confirmer et démarrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmationRetrait && commandeSelectionnee && (
              <div className="border-t border-slate-100 p-6">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    Confirmation du retrait
                  </p>

                  <h3 className="mt-1 text-lg font-extrabold text-[#0B1E3D]">
                    Vérifier le code de retrait
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    Demandez au client son code de retrait avant de confirmer.
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xl font-extrabold text-[#0B1E3D]">
                      CR-
                    </span>

                    <input
                      autoFocus
                      inputMode="text"
                      maxLength={6}
                      value={codeRetraitSaisi}
                      onChange={(e) =>
                        setCodeRetraitSaisi(
                          e.target.value.toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 6),
                        )
                      }
                      placeholder="XXXXXX"
                      className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-center text-lg font-extrabold tracking-[0.3em] outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmationRetrait(false)
                        setCodeRetraitSaisi('')
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Annuler
                    </button>

                    <button
                      type="button"
                      disabled={
                        codeRetraitSaisi.length !== 6 ||
                        statutEnCours === commandeSelectionnee.numero
                      }
                      onClick={async () => {
                        await changerStatut(
                          commandeSelectionnee,
                          'retire',
                          `CR-${codeRetraitSaisi}`,
                        )
                        setConfirmationRetrait(false)
                        setCodeRetraitSaisi('')
                      }}
                      className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {statutEnCours === commandeSelectionnee.numero
                        ? 'Vérification…'
                        : 'Confirmer'}
                    </button>
                  </div>
                </div>
              </div>
            )}


              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
