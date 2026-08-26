import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Car,
  Clock3,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Bike,
  Phone,
  MessageCircle,
} from 'lucide-react'
import {
  recupererCommandesAdminV2,
  mettreAJourStatutCommandeV2,
  programmerTrajetLivraison,
  demarrerTrajetLivraison,
  enregistrerArriveeLivraison,
  terminerTrajetLivraison,
} from '../../services/supabase'

import {
  type TypeVehicule,
} from '../../types/livraison'

type Commande = {
  id?: string
  numero?: string
  nom_client?: string
  telephone?: string
  prix_total?: number
  statut?: string
  mode_reception?: string
  mode_paiement?: string
  adresse_livraison?: string
  code_suivi?: string
  created_at?: string
  point_depart?: string
  point_destination?: string
  depart_prevu_at?: string
  arrivee_prevue_at?: string
  depart_reel_at?: string
  arrivee_reelle_at?: string
  livraison_statut?: string
  livreur_nom?: string
}

const STATUTS_LIVRAISON = [
  'attente',
  'confirmee',
  'preparation',
  'pret',
  'expedition',
  'transit',
  'livree',
  'annulee',
]

function statutLabel(statut?: string) {
  const labels: Record<string, string> = {
    attente: 'Commande reçue',
    recue: 'Commande reçue',
    commande_recue: 'Commande reçue',
    confirmee: 'Confirmée',
    preparation: 'Préparation',
    pret: 'Prête',
    expedition: 'Expédition',
    transit: 'En transit',
    livree: 'Livrée',
    annulee: 'Annulée',
  }

  return labels[String(statut || '').toLowerCase()] || statut || '—'
}

function statutStyle(statut?: string) {
  const value = String(statut || '').toLowerCase()

  if (value === 'livree') {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (value === 'annulee') {
    return 'bg-red-50 text-red-700'
  }

  if (value === 'transit' || value === 'expedition') {
    return 'bg-blue-50 text-blue-700'
  }

  if (value === 'pret') {
    return 'bg-violet-50 text-violet-700'
  }

  return 'bg-orange-50 text-[#0B1E3D]'
}

function formaterPrix(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`
}

function ouvrirWhatsApp(commande: Commande) {
  const brut = String(commande.telephone || '').trim()
  const chiffres = brut.replace(/\D/g, '')

  let telephone = chiffres

  if (telephone.startsWith('0') && telephone.length === 10) {
    telephone = '229' + telephone.slice(1)
  } else if (telephone.length === 8) {
    telephone = '229' + telephone
  } else if (!(telephone.startsWith('229') && telephone.length === 11)) {
    alert('Numéro WhatsApp invalide.')
    return
  }

  const message = [
    `Bonjour ${commande.nom_client || 'cher client'},`,
    '',
    `Votre commande ${commande.numero || ''} est actuellement : ${statutLabel(commande.statut)}.`,
    commande.code_suivi ? `Code de suivi : ${commande.code_suivi}.` : '',
    '',
    'Merci pour votre confiance.',
    'ChinaShop-Bénin',
  ]
    .filter(Boolean)
    .join('\n')

  window.open(
    `https://wa.me/${telephone}?text=${encodeURIComponent(message)}`,
    '_blank',
    'noopener,noreferrer',
  )
}

function estimerDistance(adresse?: string) {
  if (!adresse?.trim()) return 0

  // Estimation provisoire locale.
  // Une vraie distance GPS sera branchée à l'étape cartographique.
  const longueur = adresse.trim().length
  return Math.max(2, Math.min(30, Math.round(longueur / 3)))
}

function estimerDuree(distanceKm: number, typeVehicule: TypeVehicule) {
  if (distanceKm <= 0) return 0

  const vitesseMoyenne = typeVehicule === 'moto' ? 25 : 20
  return Math.max(5, Math.round((distanceKm / vitesseMoyenne) * 60))
}

export default function Livraison() {
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [statutEnCours, setStatutEnCours] = useState('')
  const [trajetEnCours, setTrajetEnCours] = useState('')
  const [confirmationDemarrage, setConfirmationDemarrage] = useState<{
    commande: Commande
    heureArrivee: string
  } | null>(null)

  const [confirmationRetrait, setConfirmationRetrait] =
    useState<Commande | null>(null)

  const [codeRetraitSaisi, setCodeRetraitSaisi] =
    useState('')

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')

    const resultatCommandes = await recupererCommandesAdminV2()

    if (!resultatCommandes.success) {
      setErreur(
        resultatCommandes.error ||
          'Impossible de récupérer les commandes.',
      )
      setCommandes([])
    } else {
      setCommandes(resultatCommandes.data || [])
    }

    setChargement(false)
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  const changerStatut = async (
    numeroCommande: string,
    statut: string,
    codeRetrait: string | null = null,
  ) => {
    if (!numeroCommande || !statut) return

    setStatutEnCours(numeroCommande)
    setErreur('')

    try {
      await mettreAJourStatutCommandeV2(
        numeroCommande,
        statut,
        codeRetrait,
      )
      await charger()
    } catch (error) {
      setErreur(
        error instanceof Error
          ? error.message
          : 'Impossible de modifier le statut.',
      )
    } finally {
      setStatutEnCours('')
    }
  }

  const confirmerRetrait = async () => {
    if (!confirmationRetrait?.numero) {
      setErreur('Commande de retrait introuvable.')
      return
    }

    const code = codeRetraitSaisi.trim().toUpperCase()

    if (!/^[A-F0-9]{6}$/.test(code)) {
      setErreur('Le code de retrait doit contenir exactement 6 caractères.')
      return
    }

    const numeroCommande = String(
      confirmationRetrait.numero,
    ).trim()

    try {
      setStatutEnCours(numeroCommande)
      setErreur('')

      await mettreAJourStatutCommandeV2(
        numeroCommande,
        'retire',
        `CR-${code}`,
      )

      setConfirmationRetrait(null)
      setCodeRetraitSaisi('')
      await charger()
    } catch (error) {
      setErreur(
        error instanceof Error
          ? error.message
          : 'Impossible de confirmer le retrait.',
      )
    } finally {
      setStatutEnCours('')
    }
  }

  const gererTrajet = async (
    commande: Commande,
    action: 'programmer' | 'demarrer' | 'arrivee' | 'terminer',
  ) => {
    const numeroCommande = String(commande.numero || '').trim()

    if (!numeroCommande) {
      setErreur('Numéro de commande manquant.')
      return
    }

    const cle = `${numeroCommande}:${action}`
    setTrajetEnCours(cle)
    setErreur('')

    try {
      if (action === 'programmer') {
        const distanceKm = estimerDistance(commande.adresse_livraison)
        const dureeMinutes = estimerDuree(distanceKm, 'moto')
        const depart = new Date(Date.now() + 10 * 60 * 1000)
        const arrivee = new Date(
          depart.getTime() + dureeMinutes * 60 * 1000,
        )

        await programmerTrajetLivraison(
          numeroCommande,
          'ChinaShop-Bénin',
          commande.adresse_livraison || 'Adresse client',
          depart.toISOString(),
          arrivee.toISOString(),
        )
      }

      if (action === 'demarrer') {
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

      if (action === 'arrivee') {
        await enregistrerArriveeLivraison(numeroCommande)
      }

      if (action === 'terminer') {
        await terminerTrajetLivraison(numeroCommande)
      }

      await charger()
    } catch (error) {
      setErreur(
        error instanceof Error
          ? error.message
          : 'Impossible de mettre à jour le trajet.',
      )
    } finally {
      setTrajetEnCours('')
    }
  }

  const executerProchaineAction = async (commande: Commande) => {
    console.log('=== CLIC PROCHAINE ACTION ===')
    console.log('Commande:', commande)
    console.log('Numero:', commande?.numero)
    console.log('Statut:', commande?.statut)
    console.log('Livraison statut:', commande?.livraison_statut)

    const numeroCommande = String(commande.numero || '').trim()

    if (!numeroCommande) {
      setErreur('Numéro de commande manquant.')
      return
    }

    const statut = String(commande.statut || 'attente').toLowerCase()
    const trajet = String(
      commande.livraison_statut || 'non_planifiee',
    ).toLowerCase()

    try {
      if (['attente', 'recue', 'commande_recue'].includes(statut)) {
        await changerStatut(numeroCommande, 'confirmee')
        return
      }

      if (statut === 'confirmee') {
        await changerStatut(numeroCommande, 'preparation')
        return
      }

      if (statut === 'preparation') {
        await changerStatut(numeroCommande, 'pret')
        return
      }

      const modeReception = String(
        commande.mode_reception || '',
      ).toLowerCase()

      if (statut === 'pret' && modeReception === 'retrait') {
        setCodeRetraitSaisi('')
        setConfirmationRetrait(commande)
        return
      }

      if (
        statut === 'pret' &&
        modeReception === 'livraison' &&
        trajet === 'non_planifiee'
      ) {
        await gererTrajet(commande, 'programmer')
        return
      }

      // Le workflow de trajet est STRICTEMENT réservé aux livraisons.
      // Un retrait ne doit jamais pouvoir démarrer, suivre ou terminer un trajet.
      if (modeReception === 'livraison') {
        if (trajet === 'planifiee') {
          await gererTrajet(commande, 'demarrer')
          return
        }

        if (trajet === 'en_route') {
          await gererTrajet(commande, 'arrivee')
          return
        }

        if (trajet === 'arrivee') {
          await gererTrajet(commande, 'terminer')
          return
        }
      }

      setErreur(
        'Aucune prochaine action disponible pour cette commande.',
      )
    } catch (error) {
      setErreur(
        error instanceof Error
          ? error.message
          : 'Impossible d’effectuer la prochaine action.',
      )
    }
  }

  const livraisons = useMemo(() => {
    return commandes.filter((commande) => {
      const mode = String(
        commande.mode_reception || '',
      ).toLowerCase()

      return mode === 'livraison'
    })
  }, [commandes])

  const retraits = useMemo(() => {
    return commandes.filter(
      (commande) =>
        String(commande.mode_reception || '').toLowerCase() === 'retrait',
    )
  }, [commandes])

  const filtrer = (liste: Commande[]) => {
    const terme = recherche.trim().toLowerCase()

    if (!terme) return liste

    return liste.filter((commande) =>
      [
        commande.nom_client,
        commande.telephone,
        commande.numero,
        commande.adresse_livraison,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(terme),
    )
  }

  const filtreesLivraisons = useMemo(
    () => filtrer(livraisons),
    [livraisons, recherche],
  )

  const filtreesRetraits = useMemo(
    () => filtrer(retraits),
    [retraits, recherche],
  )

  const enCours = livraisons.filter(
    (commande) =>
      !['livree', 'annulee'].includes(
        String(commande.statut || '').toLowerCase(),
      ),
  ).length

  const livrees = livraisons.filter(
    (commande) =>
      String(commande.statut || '').toLowerCase() === 'livree',
  ).length

  const chiffreLivraisons = livraisons.reduce(
    (total, commande) => total + Number(commande.prix_total || 0),
    0,
  )

  function statutTrajetLabel(statut?: string) {
    const labels: Record<string, string> = {
      programme: 'Trajet programmé',
      en_route: 'En route',
      arrivee: 'Arrivé',
      termine: 'Trajet terminé',
    }

    return (
      labels[String(statut || '').toLowerCase()] ||
      'Trajet non programmé'
    )
  }

  const confirmerDemarrage = async () => {
    if (!confirmationDemarrage?.commande.numero) {
      setErreur('Commande introuvable pour le démarrage.')
      return
    }

    const numeroCommande = String(
      confirmationDemarrage.commande.numero,
    ).trim()

    if (!confirmationDemarrage.heureArrivee) {
      setErreur('L’heure d’arrivée prévue est obligatoire.')
      return
    }

    console.log('=== CONFIRMATION DEMARRAGE ===')
    console.log('Commande:', numeroCommande)
    console.log('Arrivée:', confirmationDemarrage.heureArrivee)

    setTrajetEnCours(`${numeroCommande}:demarrer`)
    setErreur('')

    try {
      const resultat = await demarrerTrajetLivraison(
        numeroCommande,
        confirmationDemarrage.heureArrivee,
      )

      console.log('=== RESULTAT DEMARRAGE ===')
      console.log(resultat)

      if (!resultat?.success) {
        throw new Error(
          resultat?.error ||
            'Le serveur n’a pas confirmé le démarrage.',
        )
      }

      setConfirmationDemarrage(null)
      setErreur('')
      await charger()
    } catch (error) {
      console.error('=== ERREUR DEMARRAGE ===', error)

      setErreur(
        error instanceof Error
          ? error.message
          : 'Impossible de démarrer la livraison.',
      )
    } finally {
      setTrajetEnCours('')
    }
  }

  function statutTrajetStyle(statut?: string) {
    const value = String(statut || '').toLowerCase()

    if (value === 'termine') {
      return 'bg-emerald-50 text-emerald-700'
    }

    if (value === 'arrivee') {
      return 'bg-violet-50 text-violet-700'
    }

    if (value === 'en_route') {
      return 'bg-blue-50 text-blue-700'
    }

    return 'bg-orange-50 text-[#0B1E3D]'
  }

  return (
    <div className="space-y-6">

      {/* EN-TÊTE */}
      <div className="rounded-3xl bg-[#0284C7] p-5 text-white shadow-lg sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#6B7FA3]">
              <Bike size={15} />
              Centre logistique
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Livraison & Retrait
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Pilotez les commandes, préparez les retraits et suivez les livraisons
              jusqu'à leur arrivée.
            </p>
          </div>

          <button
            type="button"
            onClick={charger}
            disabled={chargement}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-extrabold text-[#0B1E3D] shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={chargement ? 'animate-spin' : ''}
            />
            Actualiser
          </button>
        </div>
      </div>

      {erreur && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
          <span className="mt-0.5">⚠️</span>
          <span>{erreur}</span>
        </div>
      )}

      {/* INDICATEURS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            À traiter
          </p>
          <p className="mt-2 text-2xl font-black text-[#0B1E3D]">
            {chargement ? '—' : livraisons.filter((c) =>
              ['attente', 'recue', 'commande_recue', 'confirmee'].includes(
                String(c.statut || '').toLowerCase()
              )
            ).length}
          </p>
          <p className="mt-1 text-xs text-slate-400">Livraisons</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Préparation
          </p>
          <p className="mt-2 text-2xl font-black text-[#163B70]">
            {chargement ? '—' : livraisons.filter((c) =>
              String(c.statut || '').toLowerCase() === 'preparation'
            ).length}
          </p>
          <p className="mt-1 text-xs text-slate-400">À préparer</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            En livraison
          </p>
          <p className="mt-2 text-2xl font-black text-blue-600">
            {chargement ? '—' : livraisons.filter((c) =>
              String(c.livraison_statut || '').toLowerCase() === 'en_route'
            ).length}
          </p>
          <p className="mt-1 text-xs text-slate-400">Sur le trajet</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Livrées
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {chargement ? '—' : livrees}
          </p>
          <p className="mt-1 text-xs text-slate-400">Terminées</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Retraits
          </p>
          <p className="mt-2 text-2xl font-black text-violet-600">
            {chargement ? '—' : retraits.filter((c) =>
              !['retire', 'annulee'].includes(
                String(c.statut || '').toLowerCase()
              )
            ).length}
          </p>
          <p className="mt-1 text-xs text-slate-400">En attente</p>
        </div>
      </div>

      {/* RECHERCHE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Rechercher une commande, un client, un téléphone ou une adresse..."
            aria-label="Rechercher une commande, un client, un téléphone ou une adresse"
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-[#0B1E3D] outline-none transition focus:border-[#163B70] focus:bg-white focus:ring-4 focus:ring-[#0B1E3D]/10"
          />
        </div>

        {recherche.trim() && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">
              Résultats pour « {recherche.trim()} »
            </p>
            <button
              type="button"
              onClick={() => setRecherche('')}
              className="text-xs font-black text-[#163B70]"
            >
              Effacer
            </button>
          </div>
        )}
      </div>

      {/* LIVRAISONS */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Bike size={19} />
                </div>
                <div>
                  <h2 className="font-black text-[#0B1E3D]">
                    Livraisons à domicile
                  </h2>
                  <p className="text-xs text-slate-400">
                    Préparation → trajet → arrivée
                  </p>
                </div>
              </div>
            </div>

            <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
              {filtreesLivraisons.length} commande
              {filtreesLivraisons.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtreesLivraisons.map((commande) => {
            const statut = String(commande.statut || '').toLowerCase()
            const trajet = String(
              commande.livraison_statut || 'non_planifiee'
            ).toLowerCase()
            const numero = String(commande.numero || '')
            const enCours =
              statutEnCours === numero ||
              trajetEnCours.startsWith(`${numero}:`)

            let libelle = 'Prochaine action'
            let icone = <Clock3 size={14} />
            let couleur = 'bg-[#0284C7] hover:bg-[#0369A1]'

            if (['attente', 'recue', 'commande_recue'].includes(statut)) {
              libelle = 'Confirmer la commande'
            } else if (statut === 'confirmee') {
              libelle = 'Préparer la commande'
            } else if (statut === 'preparation') {
              libelle = 'Marquer comme prête'
            } else if (statut === 'pret' && trajet === 'non_planifiee') {
              libelle = 'Programmer la livraison'
              couleur = 'bg-[#0284C7] hover:bg-[#0369A1]'
            } else if (trajet === 'planifiee') {
              libelle = 'Démarrer la livraison'
              icone = <Bike size={14} />
              couleur = 'bg-blue-600 hover:bg-blue-700'
            } else if (trajet === 'en_route') {
              libelle = "Confirmer l'arrivée"
              icone = <MapPin size={14} />
              couleur = 'bg-violet-600 hover:bg-violet-700'
            } else if (trajet === 'arrivee') {
              libelle = 'Marquer comme livrée'
              icone = <Package size={14} />
              couleur = 'bg-emerald-600 hover:bg-emerald-700'
            }

            return (
              <article
                key={commande.id || commande.numero}
                className="p-5 transition hover:bg-slate-50/60"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-[#0B1E3D]">
                        {numero || 'Commande'}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-black ${statutStyle(statut)}`}
                      >
                        {statutLabel(statut)}
                      </span>

                      {trajet !== 'non_planifiee' && (
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-black ${statutTrajetStyle(trajet)}`}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 size={12} />
                            {statutTrajetLabel(trajet)}
                          </span>
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 text-lg font-black text-[#0B1E3D]">
                      {commande.nom_client || 'Client'}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {commande.telephone && (
                        <>
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                            <Phone size={13} />
                            {commande.telephone}
                          </span>

                          <button
                            type="button"
                            onClick={() => ouvrirWhatsApp(commande)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                          >
                            <MessageCircle size={13} />
                            WhatsApp
                          </button>
                        </>
                      )}

                      <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        <MapPin size={13} />
                        <span className="truncate">
                          {commande.adresse_livraison || 'Adresse non renseignée'}
                        </span>
                      </span>
                    </div>

                    {(commande.point_depart || commande.point_destination) && (
                      <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-3 text-xs font-bold text-blue-800">
                        <MapPin size={15} />
                        <span>
                          {commande.point_depart || 'ChinaShop-Bénin'}
                          {' → '}
                          {commande.point_destination || commande.adresse_livraison || 'Client'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:w-[410px]">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Commande
                      </p>
                      <p className="mt-2 text-sm font-black text-[#0B1E3D]">
                        {formaterPrix(Number(commande.prix_total || 0))}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Livraison
                      </p>
                      <p className="mt-2 text-sm font-black text-[#0B1E3D]">
                        1 500 FCFA
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Véhicule
                      </p>
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-black text-[#0B1E3D]">
                        <Bike size={14} />
                        Moto
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (trajet === 'planifiee') {
                          const arriveeExistante = commande.arrivee_prevue_at
                            ? new Date(commande.arrivee_prevue_at)
                            : new Date(Date.now() + 30 * 60 * 1000)

                          const heureArrivee = Number.isNaN(
                            arriveeExistante.getTime()
                          )
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

                        executerProchaineAction(commande)
                      }}
                      disabled={enCours || trajet === 'livree' || statut === 'livree'}
                      className={`col-span-2 sm:col-span-3 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${couleur}`}
                    >
                      {enCours ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Traitement…
                        </>
                      ) : statut === 'livree' || trajet === 'livree' ? (
                        <>
                          <Package size={14} />
                          Livraison terminée
                        </>
                      ) : (
                        <>
                          {icone}
                          {libelle}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}

          {!chargement && filtreesLivraisons.length === 0 && (
            <div className="px-5 py-14 text-center">
              <Bike className="mx-auto text-slate-300" size={38} />
              <p className="mt-3 text-sm font-black text-slate-500">
                Aucune livraison trouvée
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Les commandes de livraison à domicile apparaîtront ici.
              </p>
            </div>
          )}

          {chargement && (
            <div className="px-5 py-14 text-center">
              <RefreshCw
                className="mx-auto animate-spin text-slate-300"
                size={30}
              />
              <p className="mt-3 text-sm font-semibold text-slate-500">
                Chargement des livraisons…
              </p>
            </div>
          )}
        </div>
      </section>

      {/* RETRAITS */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Package size={19} />
              </div>
              <div>
                <h2 className="font-black text-[#0B1E3D]">
                  Retraits sur place
                </h2>
                <p className="text-xs text-slate-400">
                  Préparation → code → retrait
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">
              {filtreesRetraits.length} commande
              {filtreesRetraits.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtreesRetraits.map((commande) => {
            const statut = String(commande.statut || '').toLowerCase()
            const numero = String(commande.numero || '')
            const enCours = statutEnCours === numero

            return (
              <article
                key={commande.id || commande.numero}
                className="p-5 transition hover:bg-slate-50/60"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-[#0B1E3D]">
                        {numero || 'Commande'}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-black ${statutStyle(statut)}`}
                      >
                        {statutLabel(statut)}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-black text-[#0B1E3D]">
                      {commande.nom_client || 'Client'}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        <Phone size={13} />
                        {commande.telephone || 'Téléphone non renseigné'}
                      </span>

                      {commande.telephone && (
                        <button
                          type="button"
                          onClick={() => ouvrirWhatsApp(commande)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                        >
                          <MessageCircle size={13} />
                          WhatsApp
                        </button>
                      )}
                    </div>
                  </div>

                  {!['retire', 'annulee'].includes(statut) ? (
                    <button
                      type="button"
                      onClick={() => executerProchaineAction(commande)}
                      disabled={enCours}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {enCours ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Traitement…
                        </>
                      ) : (
                        <>
                          <Package size={14} />
                          {statut === 'attente' || statut === 'recue'
                            ? 'Confirmer la commande'
                            : statut === 'confirmee'
                              ? 'Commencer la préparation'
                              : statut === 'preparation'
                                ? 'Commande prête'
                                : statut === 'pret'
                                  ? 'Confirmer le retrait'
                                  : 'Prochaine étape'}
                        </>
                      )}
                    </button>
                  ) : statut === 'retire' ? (
                    <span className="inline-flex h-11 items-center rounded-xl bg-emerald-50 px-5 text-xs font-black text-emerald-700">
                      <Package size={14} className="mr-2" />
                      Retrait terminé
                    </span>
                  ) : null}
                </div>
              </article>
            )
          })}

          {!chargement && filtreesRetraits.length === 0 && (
            <div className="px-5 py-12 text-center">
              <Package className="mx-auto text-slate-300" size={36} />
              <p className="mt-3 text-sm font-black text-slate-500">
                Aucun retrait trouvé
              </p>
            </div>
          )}
        </div>
      </section>

      {/* MODALE RETRAIT */}
      {confirmationRetrait && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Package size={22} />
            </div>

            <h2 className="mt-4 text-xl font-black text-[#0B1E3D]">
              Confirmer le retrait
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Commande {confirmationRetrait.numero}
            </p>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Saisissez le code de retrait communiqué au client.
            </p>

            <input
              type="text"
              value={codeRetraitSaisi}
              onChange={(event) =>
                setCodeRetraitSaisi(
                  event.target.value.toUpperCase().replace(/^CR-/, '')
                )
              }
              placeholder="A1B2C3"
              maxLength={6}
              autoFocus
              className="mt-4 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center text-xl font-black tracking-[0.3em] text-[#0B1E3D] outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmationRetrait(null)
                  setCodeRetraitSaisi('')
                }}
                disabled={statutEnCours === confirmationRetrait.numero}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={confirmerRetrait}
                disabled={
                  codeRetraitSaisi.trim().length !== 6 ||
                  statutEnCours === confirmationRetrait.numero
                }
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {statutEnCours === confirmationRetrait.numero
                  ? 'Confirmation…'
                  : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DÉMARRAGE */}
      {confirmationDemarrage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Bike size={22} />
            </div>

            <h2 className="mt-4 text-xl font-black text-[#0B1E3D]">
              Démarrer la livraison
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Commande {confirmationDemarrage.commande.numero}
            </p>

            <label className="mt-5 block">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Heure d'arrivée prévue
              </span>

              <input
                type="datetime-local"
                value={confirmationDemarrage.heureArrivee}
                onChange={(event) =>
                  setConfirmationDemarrage((actuel) =>
                    actuel
                      ? {
                          ...actuel,
                          heureArrivee: event.target.value,
                        }
                      : null
                  )
                }
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
              />
            </label>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmationDemarrage(null)}
                disabled={trajetEnCours.endsWith(':demarrer')}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={confirmerDemarrage}
                disabled={
                  !confirmationDemarrage.heureArrivee ||
                  trajetEnCours.endsWith(':demarrer')
                }
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {trajetEnCours.endsWith(':demarrer')
                  ? 'Démarrage…'
                  : 'Confirmer et démarrer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
