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
  supabase,
  recupererCommandesAdminV2,
  mettreAJourStatutCommandeV2,
  programmerTrajetLivraison,
  demarrerTrajetLivraison,
  enregistrerArriveeLivraison,
  terminerTrajetLivraison,
  attribuerLivreur,
  notifierMiseAJourSuivi,
  recupererTransportsChineAdmin,
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
  livreur_telephone?: string
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
    console.warn('Numéro WhatsApp invalide.')
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

type TransportChine = {
  transport_id: string
  commande_id: string
  numero_commande?: string
  type_transport: 'avion' | 'bateau'
  origine: string
  destination: string
  statut: string
  depart_prevu_at?: string | null
  depart_reel_at?: string | null
  arrivee_prevue_at?: string | null
  arrivee_reelle_at?: string | null
  created_at?: string
  updated_at?: string
  lignes?: Array<{
    id: string
    produit_id?: string
    nom_produit?: string
    nom_variante?: string | null
    quantite: number
    prix_unitaire?: number
    total_ligne?: number
    origine?: string
  }>
}

function formaterTempsLivraison(ms: number) {
  const secondesTotales = Math.max(0, Math.floor(ms / 1000))
  const heures = Math.floor(secondesTotales / 3600)
  const minutes = Math.floor((secondesTotales % 3600) / 60)
  const secondes = secondesTotales % 60

  if (heures > 0) {
    return `${heures}h ${minutes}min ${secondes}s`
  }

  return `${minutes}min ${secondes}s`
}

export default function Livraison() {
  const [maintenant, setMaintenant] = useState(Date.now())

  useEffect(() => {
    const intervalle = window.setInterval(() => {
      setMaintenant(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalle)
  }, [])

  const [commandes, setCommandes] = useState<Commande[]>([])
  const [transportsChine, setTransportsChine] = useState<TransportChine[]>([])
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [statutEnCours, setStatutEnCours] = useState('')
  const [transportReportId, setTransportReportId] = useState('')
  const [nouvelleArriveePrevueAt, setNouvelleArriveePrevueAt] = useState('')
  const [trajetEnCours, setTrajetEnCours] = useState('')
  const [confirmationDemarrage, setConfirmationDemarrage] = useState<{
    commande: Commande
    heureArrivee: string
  } | null>(null)

  const [confirmationRetrait, setConfirmationRetrait] =
    useState<Commande | null>(null)

  const [confirmationLivreur, setConfirmationLivreur] =
    useState<Commande | null>(null)

  const [codeRetraitSaisi, setCodeRetraitSaisi] =
    useState('')

  const [livreurEnCours, setLivreurEnCours] = useState('')
  const [livreurNom, setLivreurNom] = useState('')
  const [livreurTelephone, setLivreurTelephone] = useState('')
  const [erreurLivreur, setErreurLivreur] = useState('')

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')

    console.log('[CHINE DEBUG] Début chargement RPC')

    const [resultatCommandes, resultatTransportsChine] = await Promise.all([
      recupererCommandesAdminV2(),
      recupererTransportsChineAdmin(),
    ])

    console.log('[CHINE DEBUG] RPC commandes terminé:', resultatCommandes)
    console.log('[CHINE DEBUG] RPC transports terminé:', resultatTransportsChine)

    if (!resultatTransportsChine.success) {
      setTransportsChine([])
    } else {
      setTransportsChine(resultatTransportsChine.data || [])
    }

    if (!resultatCommandes.success) {
      setErreur(
        resultatCommandes.error ||
          'Impossible de récupérer les commandes.',
      )
      setCommandes([])
    } else {
      setCommandes(resultatCommandes.data || [])
    }

    console.log('[CHINE DEBUG] Fin charger()')
    setChargement(false)
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  const changerStatutTransportChine = async (
    transportId: string,
    nouveauStatut: string,
  ) => {
    if (!transportId || !nouveauStatut) return

    setStatutEnCours(`transport:${transportId}`)
    setErreur('')

    try {
      if (!supabase) {
        throw new Error('Supabase non configuré')
      }

      const { error } = await supabase.rpc(
        'cs_mettre_a_jour_transport_chine',
        {
          p_transport_id: transportId,
          p_nouveau_statut: nouveauStatut,
        },
      )

      if (error) throw error

      await charger()
    } catch (error) {
      console.error('Erreur transition transport Chine:', error)

      setErreur(
        error instanceof Error
          ? error.message
          : 'Impossible de mettre à jour le transport Chine → Cotonou.',
      )
    } finally {
      setStatutEnCours('')
    }
  }

  const reporterArriveeTransportChine = async (
    transportId: string,
    nouvelleArriveePrevueAt: string,
  ) => {
    if (!transportId || !nouvelleArriveePrevueAt) return false

    setStatutEnCours(`transport-report:${transportId}`)
    setErreur('')

    try {
      if (!supabase) {
        throw new Error('Supabase non configuré')
      }

      const { error } = await supabase.rpc(
        'cs_reporter_arrivee_transport_chine',
        {
          p_transport_id: transportId,
          p_nouvelle_arrivee_prevue_at: nouvelleArriveePrevueAt,
        },
      )

      if (error) throw error

      await charger()
      return true
    } catch (error) {
      console.error('Erreur report arrivée transport Chine:', error)

      setErreur(
        error instanceof Error
          ? error.message
          : 'Impossible de reporter l’arrivée du transport Chine → Cotonou.',
      )

      return false
    } finally {
      setStatutEnCours('')
    }
  }

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
        const distanceKm = estimerDistance(commande.adresse_livraison)
        const dureeMinutes = estimerDuree(distanceKm, 'moto')

        // Le trajet démarre maintenant.
        // L'arrivée prévue est recalculée selon la durée du trajet.
        const departMaintenant = new Date()
        const heureArrivee = new Date(
          departMaintenant.getTime() +
            Math.max(5, dureeMinutes || 30) * 60 * 1000,
        )

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

      if (commande.code_suivi) {
        await notifierMiseAJourSuivi(commande.code_suivi)
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

  const enregistrerLivreur = async (commande: Commande) => {
    const numeroCommande = String(commande.numero || '').trim()
    const nom = livreurNom.trim()
    const telephone = livreurTelephone.replace(/\D/g, '').slice(0, 10)

    setErreurLivreur('')

    if (!numeroCommande) {
      setErreurLivreur('Numéro de commande manquant.')
      return
    }

    if (!nom || nom.length > 120) {
      setErreurLivreur('Veuillez saisir un nom de livreur valide.')
      return
    }

    if (!/^01\d{8}$/.test(telephone)) {
      setErreurLivreur(
        'Le numéro doit contenir exactement 10 chiffres et commencer par 01.',
      )
      return
    }

    setLivreurEnCours(numeroCommande)

    try {
      await attribuerLivreur(
        numeroCommande,
        nom,
        telephone,
      )

      if (commande.code_suivi) {
        await notifierMiseAJourSuivi(commande.code_suivi)
      }

      setLivreurNom('')
      setLivreurTelephone('')
      setErreurLivreur('')
      setConfirmationLivreur(null)
      await charger()
    } catch (error) {
      setErreurLivreur(
        error instanceof Error
          ? error.message
          : 'Impossible d’enregistrer le livreur.',
      )
    } finally {
      setLivreurEnCours('')
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

    const typeParcours = String(
      commande.type_parcours || '',
    ).toLowerCase()

    const modeReception = String(
      commande.mode_reception || '',
    ).toLowerCase()

    try {
      /*
       * SUR COMMANDE
       * Le moteur suit strictement les transitions actives
       * définies dans public.cs_transitions_autorisees.
       */
      if (typeParcours === 'sur_commande') {
        const prochainesEtapes: Record<string, string> = {
          acompte_requis: 'acompte_confirme',
          acompte_confirme: 'achat_fournisseur',
          achat_fournisseur: 'preparation_chine',
          preparation_chine: 'chargee',
          chargee: 'partie_chine',
          partie_chine: 'en_transit',
          en_transit: 'arrivee_cotonou',
          arrivee_cotonou: 'solde_requis',
          solde_confirme: 'pret',
        }

        const prochaineEtape = prochainesEtapes[statut]

        if (prochaineEtape) {
          await changerStatut(numeroCommande, prochaineEtape)
          return
        }

        /*
         * À partir de "pret", les deux parcours se séparent.
         */
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
          await changerStatut(numeroCommande, 'livraison_en_cours')
          return
        }

        /*
         * La livraison sur commande rejoint ensuite le trajet
         * normal de livraison.
         */
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
          'Aucune prochaine action disponible pour cet article sur commande.',
        )
        return
      }

      /*
       * WORKFLOW NORMAL
       * Conservé séparément du parcours sur commande.
       */
      if (statut === 'paiement_recu') {
        await changerStatut(numeroCommande, 'en_acheminement')
        return
      }

      if (statut === 'en_acheminement') {
        await changerStatut(numeroCommande, 'arrivee_cotonou')
        return
      }

      if (statut === 'arrivee_cotonou') {
        await changerStatut(numeroCommande, 'preparation')
        return
      }

      if (statut === 'acompte_paye') {
        await changerStatut(numeroCommande, 'attente')
        return
      }

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

      /*
       * Le workflow de trajet est STRICTEMENT réservé aux livraisons.
       */
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

  const executerProchaineActionSurCommande = async (
    commande: Commande,
    transport?: TransportChine | null,
  ) => {
    const statutCommande = String(commande.statut || '').toLowerCase()
    const statutTransport = String(transport?.statut || '').toLowerCase()

    const prochainsStatutsTransport: Record<string, string> = {
      a_charger: 'charge',
      charge: 'parti_chine',
      parti_chine: 'en_transit',
      en_transit: 'arrivee_cotonou',
    }

    if (
      transport &&
      ['preparation_chine', 'chargee', 'partie_chine', 'en_transit'].includes(
        statutCommande,
      ) &&
      prochainsStatutsTransport[statutTransport]
    ) {
      if (statutTransport === 'en_transit') {
        await changerStatutTransportChine(
          transport.transport_id,
          'arrivee_cotonou',
        )
        return
      }

      await changerStatutTransportChine(
        transport.transport_id,
        prochainsStatutsTransport[statutTransport],
      )
      return
    }

    await executerProchaineAction(commande)
  }

  const livraisons = useMemo(() => {
    return commandes.filter((commande) => {
      const mode = String(
        commande.mode_reception || '',
      ).toLowerCase()
      const typeParcours = String(
        commande.type_parcours || '',
      ).toLowerCase()

      return mode === 'livraison' && typeParcours !== 'sur_commande'
    })
  }, [commandes])

  const retraits = useMemo(() => {
    return commandes.filter((commande) => {
      const mode = String(
        commande.mode_reception || '',
      ).toLowerCase()
      const typeParcours = String(
        commande.type_parcours || '',
      ).toLowerCase()

      return mode === 'retrait' && typeParcours !== 'sur_commande'
    })
  }, [commandes])

  const articlesSurCommande = useMemo(() => {
    return commandes.filter(
      (commande) =>
        String(commande.type_parcours || '').toLowerCase() ===
        'sur_commande',
    )
  }, [commandes])

  const surCommandeLivraisons = useMemo(() => {
    return articlesSurCommande.filter(
      (commande) =>
        String(commande.mode_reception || '').toLowerCase() ===
        'livraison',
    )
  }, [articlesSurCommande])

  const surCommandeRetraits = useMemo(() => {
    return articlesSurCommande.filter(
      (commande) =>
        String(commande.mode_reception || '').toLowerCase() ===
        'retrait',
    )
  }, [articlesSurCommande])

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
    () =>
      filtrer(
        livraisons.filter(
          (commande) =>
            !['livree', 'annulee'].includes(
              String(commande.statut || '').toLowerCase(),
            ),
        ),
      ),
    [livraisons, recherche],
  )

  const filtreesRetraits = useMemo(
    () => filtrer(retraits),
    [retraits, recherche],
  )

  const filtreesSurCommandeLivraisons = useMemo(
    () => filtrer(surCommandeLivraisons),
    [surCommandeLivraisons, recherche],
  )

  const filtreesSurCommandeRetraits = useMemo(
    () => filtrer(surCommandeRetraits),
    [surCommandeRetraits, recherche],
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

      if (confirmationDemarrage.commande.code_suivi) {
        await notifierMiseAJourSuivi(
          confirmationDemarrage.commande.code_suivi,
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
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/30">
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

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/30">
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

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/30">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Livraisons en cours
          </p>
          <p className="mt-2 text-2xl font-black text-blue-600">
            {chargement ? '—' : enCours}
          </p>
          <p className="mt-1 text-xs text-slate-400">Non terminées</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/30">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Livrées
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {chargement ? '—' : livrees}
          </p>
          <p className="mt-1 text-xs text-slate-400">Terminées</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/30">
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
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/30">
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
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
        <div className="border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <Bike size={20} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-black tracking-tight text-[#0B1E3D] sm:text-lg">
                    Livraisons à domicile
                  </h2>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">
                    {filtreesLivraisons.length}
                  </span>
                </div>

                <p className="mt-0.5 text-xs font-medium text-slate-400">
                  Gestion des commandes en livraison
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-6 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 xl:flex">
              <span>Commande</span>
              <span>Client</span>
              <span>Destination</span>
              <span>Statut</span>
              <span>Livraison</span>
              <span>Action</span>
            </div>
          </div>
        </div>

        {/* TABLEAU DESKTOP — VERSION PREMIUM V2 */}
        <div className="hidden xl:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1220px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="w-[19%] px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Commande
                  </th>
                  <th className="w-[16%] px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Client
                  </th>
                  <th className="w-[21%] px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Destination
                  </th>
                  <th className="w-[20%] px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Suivi
                  </th>
                  <th className="w-[13%] px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Livreur
                  </th>
                  <th className="w-[11%] px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtreesLivraisons.map((commande) => {
                  const statut = String(
                    commande.statut || '',
                  ).toLowerCase()

                  const trajet = String(
                    commande.livraison_statut || 'non_planifiee',
                  ).toLowerCase()

                  const numero = String(commande.numero || '')

                  const enCours =
                    statutEnCours === numero ||
                    trajetEnCours.startsWith(`${numero}:`)

                  let libelle = 'Prochaine action'
                  let icone = <Clock3 size={14} />
                  let couleur =
                    'bg-[#0B1E3D] hover:bg-[#163665]'

                  if (
                    ['attente', 'recue', 'commande_recue'].includes(
                      statut,
                    )
                  ) {
                    libelle = 'Confirmer'
                  } else if (statut === 'confirmee') {
                    libelle = 'Préparer'
                  } else if (statut === 'preparation') {
                    libelle = 'Marquer prête'
                  } else if (
                    statut === 'pret' &&
                    trajet === 'non_planifiee'
                  ) {
                    libelle = 'Programmer'
                    icone = <Clock3 size={14} />
                  } else if (trajet === 'planifiee') {
                    libelle = 'Démarrer'
                    icone = <Bike size={14} />
                    couleur =
                      'bg-blue-600 hover:bg-blue-700'
                  } else if (trajet === 'en_route') {
                    libelle = "Confirmer l'arrivée"
                    icone = <MapPin size={14} />
                    couleur =
                      'bg-violet-600 hover:bg-violet-700'
                  } else if (trajet === 'arrivee') {
                    libelle = 'Marquer livrée'
                    icone = <Package size={14} />
                    couleur =
                      'bg-emerald-600 hover:bg-emerald-700'
                  }

                  const progression =
                    trajet === 'livree' || statut === 'livree'
                      ? 100
                      : trajet === 'arrivee'
                        ? 85
                        : trajet === 'en_route'
                          ? 65
                          : trajet === 'planifiee'
                            ? 45
                            : statut === 'pret'
                              ? 35
                              : statut === 'preparation'
                                ? 25
                                : statut === 'confirmee'
                                  ? 15
                                  : 5

                  const etape =
                    trajet === 'livree' || statut === 'livree'
                      ? 'Livrée'
                      : trajet === 'arrivee'
                        ? 'Arrivée'
                        : trajet === 'en_route'
                          ? 'En transit'
                          : trajet === 'planifiee'
                            ? 'Planifiée'
                            : statut === 'pret'
                              ? 'Prête'
                              : statut === 'preparation'
                                ? 'Préparation'
                                : statut === 'confirmee'
                                  ? 'Confirmée'
                                  : 'Reçue'

                  return (
                    <tr
                      key={commande.id || commande.numero}
                      className={`group bg-white transition-colors duration-150 hover:bg-slate-50/70 ${
                        trajet === 'en_route'
                          ? 'bg-blue-50/20'
                          : ''
                      }`}
                    >
                      {/* COMMANDE */}
                      <td className="px-6 py-5 align-middle">
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
                              trajet === 'en_route'
                                ? 'bg-blue-600'
                                : trajet === 'livree' ||
                                    statut === 'livree'
                                  ? 'bg-emerald-600'
                                  : 'bg-[#0B1E3D]'
                            }`}
                          >
                            <Package size={18} />

                            {trajet === 'en_route' && (
                              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-mono text-[12px] font-black tracking-tight text-[#0B1E3D]">
                              {numero || '—'}
                            </p>

                            {commande.code_suivi && (
                              <div className="mt-1.5 inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5">
                                <span className="font-mono text-[9px] font-bold tracking-wide text-slate-500">
                                  {commande.code_suivi}
                                </span>
                              </div>
                            )}

                            <p className="mt-2 text-[13px] font-black text-[#0B1E3D]">
                              {formaterPrix(
                                Number(commande.prix_total || 0),
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CLIENT */}
                      <td className="px-5 py-5 align-middle">
                        <div className="min-w-0">
                          <p className="max-w-[185px] truncate text-[13px] font-black text-[#0B1E3D]">
                            {commande.nom_client || 'Client'}
                          </p>

                          {commande.telephone ? (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="whitespace-nowrap text-[11px] font-semibold text-slate-500">
                                {commande.telephone}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  ouvrirWhatsApp(commande)
                                }
                                className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-[9px] font-black text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 active:scale-[0.97]"
                                title="Contacter sur WhatsApp"
                                aria-label="Contacter le client sur WhatsApp"
                              >
                                <MessageCircle size={11} />
                                WhatsApp
                              </button>
                            </div>
                          ) : (
                            <p className="mt-2 text-[10px] font-medium text-slate-400">
                              Téléphone non renseigné
                            </p>
                          )}
                        </div>
                      </td>

                      {/* DESTINATION */}
                      <td className="px-5 py-5 align-middle">
                        <div className="flex max-w-[270px] items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                            <MapPin size={15} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                              Destination
                            </p>

                            <p className="mt-1.5 line-clamp-2 text-[11px] font-bold leading-5 text-slate-700">
                              {commande.adresse_livraison ||
                                'Adresse non renseignée'}
                            </p>

                            {commande.point_destination && (
                              <p className="mt-1 truncate text-[10px] font-semibold text-slate-400">
                                {commande.point_destination}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SUIVI */}
                      <td className="px-5 py-5 align-middle">
                        <div className="min-w-[190px]">
                          <div className="flex items-center justify-between gap-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black ${statutStyle(
                                statut,
                              )}`}
                            >
                              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                              {statutLabel(statut)}
                            </span>

                            <span className="text-[10px] font-black text-slate-400">
                              {progression}%
                            </span>
                          </div>

                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                trajet === 'livree' ||
                                statut === 'livree'
                                  ? 'bg-emerald-500'
                                  : trajet === 'en_route'
                                    ? 'bg-blue-600'
                                    : trajet === 'arrivee'
                                      ? 'bg-violet-600'
                                      : 'bg-[#0B1E3D]'
                              }`}
                              style={{
                                width: `${progression}%`,
                              }}
                            />
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                trajet === 'en_route'
                                  ? 'animate-pulse bg-blue-600'
                                  : trajet === 'livree' ||
                                      statut === 'livree'
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-300'
                              }`}
                            />

                            <span className="text-[10px] font-bold text-slate-500">
                              {etape}
                            </span>

                            {trajet !== 'non_planifiee' && (
                              <>
                                <span className="text-slate-300">
                                  ·
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400">
                                  {statutTrajetLabel(trajet)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* LIVREUR */}
                      <td className="px-5 py-5 align-middle">
                        {commande.livreur_nom ? (
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${
                                trajet === 'en_route'
                                  ? 'bg-blue-50 text-blue-600 ring-blue-100'
                                  : 'bg-slate-50 text-slate-500 ring-slate-200'
                              }`}
                            >
                              <Bike size={15} />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[105px] truncate text-[11px] font-black text-[#0B1E3D]">
                                {commande.livreur_nom}
                              </p>

                              {commande.livreur_telephone ? (
                                <a
                                  href={`tel:+229${commande.livreur_telephone}`}
                                  className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 transition hover:text-blue-800"
                                >
                                  <Phone size={9} />
                                  {commande.livreur_telephone}
                                </a>
                              ) : (
                                <p className="mt-1 text-[9px] font-medium text-slate-400">
                                  Téléphone non renseigné
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-2.5 py-2">
                            <Bike size={13} className="text-slate-300" />
                            <span className="text-[9px] font-bold text-slate-400">
                              Non attribué
                            </span>
                          </div>
                        )}
                      </td>

                      {/* ACTION */}
                      <td className="px-6 py-5 align-middle">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (trajet === 'planifiee') {
                                if (!commande.livreur_nom) {
                                  setLivreurNom('')
                                  setLivreurTelephone('')
                                  setErreurLivreur('')
                                  setConfirmationLivreur(commande)
                                  return
                                }

                                const arriveeExistante =
                                  commande.arrivee_prevue_at
                                    ? new Date(
                                        commande.arrivee_prevue_at,
                                      )
                                    : new Date(
                                        Date.now() +
                                          30 * 60 * 1000,
                                      )

                                const heureArrivee =
                                  Number.isNaN(
                                    arriveeExistante.getTime(),
                                  )
                                    ? new Date(
                                        Date.now() +
                                          30 * 60 * 1000,
                                      )
                                    : arriveeExistante

                                const deuxChiffres = (
                                  value: number,
                                ) =>
                                  String(value).padStart(2, '0')

                                const valeurDateHeure =
                                  [
                                    heureArrivee.getFullYear(),
                                    deuxChiffres(
                                      heureArrivee.getMonth() + 1,
                                    ),
                                    deuxChiffres(
                                      heureArrivee.getDate(),
                                    ),
                                  ].join('-') +
                                  'T' +
                                  [
                                    deuxChiffres(
                                      heureArrivee.getHours(),
                                    ),
                                    deuxChiffres(
                                      heureArrivee.getMinutes(),
                                    ),
                                  ].join(':')

                                setConfirmationDemarrage({
                                  commande,
                                  heureArrivee:
                                    valeurDateHeure,
                                })

                                return
                              }

                              executerProchaineAction(commande)
                            }}
                            disabled={
                              enCours ||
                              trajet === 'livree' ||
                              statut === 'livree'
                            }
                            className={`inline-flex h-10 min-w-[126px] items-center justify-center gap-2 rounded-xl px-3 text-[9px] font-black text-white shadow-sm transition duration-150 hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${couleur}`}
                          >
                            {enCours ? (
                              <>
                                <RefreshCw
                                  size={13}
                                  className="animate-spin"
                                />
                                Traitement…
                              </>
                            ) : statut === 'livree' ||
                              trajet === 'livree' ? (
                              <>
                                <Package size={13} />
                                Terminée
                              </>
                            ) : (
                              <>
                                {icone}
                                {libelle}
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {!chargement && filtreesLivraisons.length === 0 && (
          <div className="border-t border-slate-100 px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
              <Bike size={28} />
            </div>
            <p className="mt-4 text-sm font-black text-slate-500">
              Aucune livraison trouvée
            </p>
            <p className="mt-1 text-xs font-medium text-slate-400">
              Les commandes de livraison à domicile apparaîtront ici.
            </p>
          </div>
        )}

        {chargement && (
          <div className="border-t border-slate-100 px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
              <RefreshCw size={24} className="animate-spin" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Chargement des livraisons…
            </p>
          </div>
        )}

        {/* CARTES TABLETTE / MOBILE */}
        <div className="divide-y divide-slate-100 xl:hidden">
          {filtreesLivraisons.map((commande) => {
            const statut = String(commande.statut || '').toLowerCase()
            const trajet = String(
              commande.livraison_statut || 'non_planifiee',
            ).toLowerCase()
            const numero = String(commande.numero || '')
            const enCours =
              statutEnCours === numero ||
              trajetEnCours.startsWith(`${numero}:`)
              const departPrevu = commande.depart_prevu_at
                ? new Date(commande.depart_prevu_at).getTime()
                : null
              const arriveePrevue = commande.arrivee_prevue_at
                ? new Date(commande.arrivee_prevue_at).getTime()
                : null
              const departReel = commande.depart_reel_at
                ? new Date(commande.depart_reel_at).getTime()
                : null
              const arriveeReelle = commande.arrivee_reelle_at
                ? new Date(commande.arrivee_reelle_at).getTime()
                : null

              const livraisonEnRoute = trajet === 'en_route'
              const delaiLivraison = arriveePrevue
                ? arriveePrevue - maintenant
                : null

              let progressionLivraison = 0

              if (
                statut === 'livree' ||
                trajet === 'livree' ||
                Boolean(arriveeReelle)
              ) {
                progressionLivraison = 1
              } else if (trajet === 'arrivee') {
                progressionLivraison = 0.98
              } else if (trajet === 'en_route') {
                const debut = departReel || departPrevu

                if (
                  debut &&
                  arriveePrevue &&
                  arriveePrevue > debut
                ) {
                  const dureeTotale = arriveePrevue - debut
                  const tempsEcoule = maintenant - debut

                  progressionLivraison = Math.max(
                    0.02,
                    Math.min(
                      0.97,
                      tempsEcoule / dureeTotale,
                    ),
                  )
                } else {
                  progressionLivraison = 0.02
                }
              } else if (trajet === 'planifiee') {
                progressionLivraison = 0
              }


            let libelle = 'Prochaine action'
            let icone = <Clock3 size={15} />
            let couleur = 'bg-[#0284C7] hover:bg-[#0369A1]'

            if (['attente', 'recue', 'commande_recue'].includes(statut)) {
              libelle = 'Confirmer'
            } else if (statut === 'confirmee') {
              libelle = 'Préparer'
            } else if (statut === 'preparation') {
              libelle = 'Marquer prête'
            } else if (statut === 'pret' && trajet === 'non_planifiee') {
              libelle = 'Programmer'
            } else if (trajet === 'planifiee') {
              libelle = 'Démarrer'
              icone = <Bike size={15} />
              couleur = 'bg-blue-600 hover:bg-blue-700'
            } else if (trajet === 'en_route') {
              libelle = "Confirmer l'arrivée"
              icone = <MapPin size={15} />
              couleur = 'bg-violet-600 hover:bg-violet-700'
            } else if (trajet === 'arrivee') {
              libelle = 'Marquer livrée'
              icone = <Package size={15} />
              couleur = 'bg-emerald-600 hover:bg-emerald-700'
            }

            return (
              <article
                key={commande.id || commande.numero}
                className="bg-white px-4 py-4 transition-colors hover:bg-slate-50/50 sm:px-5 sm:py-5"
              >
                {/* EN-TÊTE COMMANDE */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-lg bg-[#0B1E3D] px-2.5 py-1.5 font-mono text-[11px] font-black tracking-tight text-white">
                        {numero || 'Commande'}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] font-black ${statutStyle(statut)}`}
                      >
                        {statutLabel(statut)}
                      </span>

                      {trajet !== 'non_planifiee' && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] font-black ${statutTrajetStyle(trajet)}`}
                        >
                          {statutTrajetLabel(trajet)}
                        </span>
                      )}
                    </div>

                    {commande.code_suivi && (
                      <p className="mt-2 font-mono text-[10px] font-bold tracking-wide text-slate-400">
                        Suivi · {commande.code_suivi}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Total
                    </p>
                    <p className="mt-0.5 text-sm font-black tracking-tight text-[#0B1E3D]">
                      {formaterPrix(Number(commande.prix_total || 0))}
                    </p>
                  </div>
                </div>

                {/* CLIENT */}
                <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                        Client
                      </p>
                      <p className="mt-1 truncate text-sm font-black text-[#0B1E3D]">
                        {commande.nom_client || 'Client'}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">
                        {commande.telephone || 'Téléphone non renseigné'}
                      </p>
                    </div>

                    {commande.telephone && (
                      <button
                        type="button"
                        onClick={() => ouvrirWhatsApp(commande)}
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 text-[10px] font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50 active:scale-[0.98]"
                      >
                        <MessageCircle size={13} />
                        WhatsApp
                      </button>
                    )}
                  </div>
                </div>

                {/* DESTINATION */}
                <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-200/30">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <MapPin size={15} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                        Destination
                      </p>
                      <p className="mt-1 text-xs font-bold leading-5 text-slate-700">
                        {commande.adresse_livraison || 'Adresse non renseignée'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* PARCOURS */}
                <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-200/30">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                        Parcours
                      </p>
                      <p className="mt-1 text-xs font-black text-[#0B1E3D]">
                        {statutLabel(statut)}
                      </p>
                    </div>

                    <span className="text-[10px] font-black text-slate-400">
                      {trajet === 'livree' || statut === 'livree'
                        ? '100%'
                        : trajet === 'arrivee'
                          ? '85%'
                          : trajet === 'en_route'
                            ? `${Math.round(progressionLivraison * 100)}%`
                            : trajet === 'planifiee'
                              ? '45%'
                              : statut === 'pret'
                                ? '35%'
                                : statut === 'preparation'
                                  ? '25%'
                                  : statut === 'confirmee'
                                    ? '15%'
                                    : '5%'}
                    </span>
                    {livraisonEnRoute && delaiLivraison !== null && (
                      <div className={`mt-3 rounded-xl px-3 py-2 text-[10px] font-black ${
                        delaiLivraison > 0
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {delaiLivraison > 0
                          ? `Arrivée prévue dans ${formaterTempsLivraison(delaiLivraison)}`
                          : 'Heure d’arrivée atteinte — livraison à confirmer'}
                      </div>
                    )}

                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        trajet === 'livree' || statut === 'livree'
                          ? 'bg-emerald-500'
                          : trajet === 'en_route'
                            ? 'bg-blue-600'
                            : trajet === 'arrivee'
                              ? 'bg-violet-600'
                              : 'bg-[#0B1E3D]'
                      }`}
                      style={{
                        width: `${
                          trajet === 'en_route'
                            ? Math.round(progressionLivraison * 100)
                            : trajet === 'livree' || statut === 'livree'
                              ? 100
                              : trajet === 'arrivee'
                                ? 85
                                : trajet === 'planifiee'
                                  ? 45
                                  : statut === 'pret'
                                    ? 35
                                    : statut === 'preparation'
                                      ? 25
                                      : statut === 'confirmee'
                                        ? 15
                                        : 5
                        }%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Trajet de livraison
                    </p>

                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold text-slate-600">
                        {trajet === 'non_planifiee'
                          ? 'Trajet non programmé'
                          : trajet === 'planifiee'
                            ? 'Trajet planifié'
                            : trajet === 'en_route'
                              ? 'En route'
                              : trajet === 'arrivee'
                                ? 'Arrivée'
                                : trajet === 'livree'
                                  ? 'Trajet terminé'
                                  : statutTrajetLabel(trajet)}
                      </span>

                      <span className="text-[10px] font-black text-[#0B1E3D]">
                        {libelle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* LIVREUR */}
                {commande.livreur_nom && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/50">
                    <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                          <Bike size={16} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-500">
                            Livreur
                          </p>
                          <p className="mt-0.5 truncate text-xs font-black text-[#0B1E3D]">
                            {commande.livreur_nom}
                          </p>
                        </div>
                      </div>

                      {commande.livreur_telephone && (
                        <a
                          href={`tel:+229${commande.livreur_telephone}`}
                          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#0B1E3D] px-3 text-[10px] font-black text-white shadow-sm transition hover:bg-[#102b55] active:scale-[0.98]"
                        >
                          <Phone size={12} />
                          Appeler
                        </a>
                      )}
                    </div>

                    {commande.livreur_telephone && (
                      <div className="border-t border-blue-100/80 bg-white/70 px-3.5 py-2">
                        <span className="font-mono text-[10px] font-bold tracking-wide text-slate-500">
                          {commande.livreur_telephone}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ACTION */}
                <button
                  type="button"
                  onClick={() => {
                    if (trajet === 'planifiee') {
                      if (!commande.livreur_nom) {
                        setLivreurNom('')
                        setLivreurTelephone('')
                        setErreurLivreur('')
                        setConfirmationLivreur(commande)
                        return
                      }

                      const arriveeExistante = commande.arrivee_prevue_at
                        ? new Date(commande.arrivee_prevue_at)
                        : new Date(Date.now() + 30 * 60 * 1000)

                      const heureArrivee = Number.isNaN(
                        arriveeExistante.getTime(),
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
                  disabled={
                    enCours ||
                    trajet === 'livree' ||
                    statut === 'livree'
                  }
                  className={`mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black text-white shadow-sm transition hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${couleur}`}
                >
                  {enCours ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      Traitement…
                    </>
                  ) : statut === 'livree' || trajet === 'livree' ? (
                    <>
                      <Package size={15} />
                      Livraison terminée
                    </>
                  ) : (
                    <>
                      {icone}
                      {libelle}
                    </>
                  )}
                </button>
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
              <RefreshCw className="mx-auto animate-spin text-slate-300" size={30} />
              <p className="mt-3 text-sm font-semibold text-slate-500">
                Chargement des livraisons…
              </p>
            </div>
          )}
        </div>

      </section>

      {/* RETRAITS */}
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
        <div className="border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                <Package size={20} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-black tracking-tight text-[#0B1E3D] sm:text-lg">
                    Retraits sur place
                  </h2>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">
                    {filtreesRetraits.length}
                  </span>
                </div>

                <p className="mt-0.5 text-xs font-medium text-slate-400">
                  Préparation → code → retrait
                </p>
              </div>
            </div>
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
                className="px-4 py-4 transition-colors hover:bg-slate-50/60 sm:px-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[12px] font-black text-[#0B1E3D]">
                        {numero || 'Commande'}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statutStyle(statut)}`}
                      >
                        {statutLabel(statut)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-sm font-black text-[#0B1E3D]">
                        {commande.nom_client || 'Client'}
                      </span>

                      <span className="text-xs font-semibold text-slate-400">
                        {commande.telephone || 'Téléphone non renseigné'}
                      </span>

                      <span className="text-xs font-black text-[#0B1E3D]">
                        {formaterPrix(Number(commande.prix_total || 0))}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {commande.telephone && (
                      <button
                        type="button"
                        onClick={() => ouvrirWhatsApp(commande)}
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 text-[11px] font-black text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <MessageCircle size={13} />
                        WhatsApp
                      </button>
                    )}

                    {!['retire', 'annulee', 'livree'].includes(statut) ? (
                      <button
                        type="button"
                        onClick={() => executerProchaineAction(commande)}
                        disabled={enCours}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-[11px] font-black text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {enCours ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            Traitement…
                          </>
                        ) : (
                          <>
                            <Package size={13} />
                            {statut === 'attente' || statut === 'recue'
                              ? 'Confirmer'
                              : statut === 'confirmee'
                                ? 'Préparer'
                                : statut === 'preparation'
                                  ? 'Marquer prête'
                                  : statut === 'pret'
                                    ? 'Confirmer le retrait'
                                    : 'Prochaine étape'}
                          </>
                        )}
                      </button>
                    ) : statut === 'retire' ? (
                      <span className="inline-flex h-10 items-center rounded-xl bg-emerald-50 px-4 text-[11px] font-black text-emerald-700">
                        <Package size={13} className="mr-2" />
                        Retrait terminé
                      </span>
                    ) : null}
                  </div>
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

      {/* COMMANDES SUR COMMANDE — VUE UNIFIÉE */}
      <section className="overflow-hidden rounded-[28px] border border-amber-200/70 bg-white shadow-sm shadow-slate-200/40">
        <div className="border-b border-amber-100 bg-amber-50/40 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                <Package size={20} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-black tracking-tight text-[#0B1E3D] sm:text-lg">
                    Commandes sur commande
                  </h2>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-700">
                    {articlesSurCommande.length}
                  </span>
                </div>

                <p className="mt-0.5 text-xs font-medium text-slate-400">
                  Acompte → fournisseur → transport → arrivée → finalisation
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {articlesSurCommande.map((commande) => {
            const statut = String(commande.statut || '').toLowerCase()
            const numero = String(commande.numero || '')
            const enCours = statutEnCours === numero

            const transport = transportsChine.find(
              (item) => String(item.numero_commande || '') === numero,
            )

            const estAvion = transport?.type_transport === 'avion'

            const libellesStatut: Record<string, string> = {
              a_charger: 'À charger',
              charge: 'Chargé',
              parti_chine: 'Parti de Chine',
              en_transit: 'En transit',
              arrivee_cotonou: 'Arrivé à Cotonou',
              annule: 'Annulé',
            }

            const statutTransport = transport
              ? libellesStatut[transport.statut] || transport.statut
              : null

            const dateAffichage = (date?: string) =>
              date
                ? new Date(date).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'

            return (
              <article
                key={commande.id || commande.numero}
                className="p-4 sm:p-5"
              >
                <div className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
                  <div className="border-b border-slate-200 bg-white px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[12px] font-black text-[#0B1E3D]">
                            {numero || 'Commande'}
                          </span>

                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statutStyle(statut)}`}>
                            {statutLabel(statut)}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                              String(commande.mode_reception || '').toLowerCase() === 'retrait'
                                ? 'bg-violet-50 text-violet-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {String(commande.mode_reception || '').toLowerCase() === 'retrait'
                              ? 'Retrait'
                              : 'Livraison'}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="text-sm font-black text-[#0B1E3D]">
                            {commande.nom_client || 'Client'}
                          </span>

                          <span className="text-xs font-semibold text-slate-400">
                            {commande.telephone || 'Téléphone non renseigné'}
                          </span>

                          <span className="text-xs font-black text-[#0B1E3D]">
                            {formaterPrix(Number(commande.prix_total || 0))}
                          </span>
                        </div>
                      </div>

                      {transport && (
                        <div
                          className={`flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 ${
                            estAvion
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-sky-50 text-sky-700'
                          }`}
                        >
                          <span className="text-lg">
                            {estAvion ? '✈️' : '🚢'}
                          </span>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider opacity-70">
                              Transport
                            </p>
                            <p className="text-xs font-black">
                              {estAvion ? 'Avion' : 'Bateau'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 p-5 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Prochaine étape
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-700">
                        {statut === 'acompte_requis'
                          ? 'Confirmer l’acompte'
                          : statut === 'acompte_confirme'
                            ? 'Achat fournisseur'
                            : statut === 'achat_fournisseur'
                              ? 'Préparer en Chine'
                              : statut === 'preparation_chine'
                                ? 'Charger le transport'
                                : statut === 'chargee'
                                  ? 'Faire partir de Chine'
                                  : statut === 'partie_chine'
                                    ? 'Mettre en transit'
                                    : statut === 'en_transit'
                                      ? 'Confirmer l’arrivée à Cotonou'
                                      : statut === 'arrivee_cotonou'
                                        ? 'Confirmer le solde'
                                        : statut === 'solde_requis'
                                          ? 'Confirmer le paiement du solde'
                                          : statut === 'solde_confirme'
                                            ? 'Préparer la remise'
                                            : statut === 'pret'
                                              ? String(commande.mode_reception || '').toLowerCase() === 'retrait'
                                                ? 'Confirmer le retrait'
                                                : 'Lancer la livraison'
                                              : '—'}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Itinéraire
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-700">
                        {transport
                          ? `${transport.origine || 'Chine'} → ${transport.destination || 'Cotonou'}`
                          : 'Transport non encore créé'}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Départ réel
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-700">
                        {transport ? dateAffichage(transport.depart_reel_at) : '—'}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Arrivée prévue
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-700">
                        {transport ? dateAffichage(transport.arrivee_prevue_at) : '—'}
                      </p>
                    </div>
                  </div>

                  {transport && (
                    <>
                      <div className="border-t border-slate-200 px-5 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                              Progression transport
                            </p>
                            <p className="mt-1 text-sm font-black text-[#0B1E3D]">
                              {statutTransport}
                            </p>
                          </div>

                          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                            {estAvion ? '✈️ Avion' : '🚢 Bateau'}
                          </span>
                        </div>
                      </div>

                      {transport.statut === 'en_transit' && (
                        <div className="border-t border-slate-200 bg-amber-50 px-5 py-4">
                          {transportReportId === transport.transport_id ? (
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-black text-amber-900">
                                  Reporter l’arrivée
                                </p>
                                <p className="mt-1 text-xs font-bold text-amber-700">
                                  Définissez la nouvelle date prévue d’arrivée à Cotonou.
                                </p>
                              </div>

                              <input
                                type="datetime-local"
                                value={nouvelleArriveePrevueAt}
                                onChange={(event) =>
                                  setNouvelleArriveePrevueAt(event.target.value)
                                }
                                min={new Date().toISOString().slice(0, 16)}
                                className="h-12 w-full rounded-xl border border-amber-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                              />

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={
                                    statutEnCours ===
                                    `transport-report:${transport.transport_id}`
                                  }
                                  onClick={() => {
                                    setTransportReportId('')
                                    setNouvelleArriveePrevueAt('')
                                  }}
                                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 disabled:opacity-50"
                                >
                                  Annuler
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    !nouvelleArriveePrevueAt ||
                                    statutEnCours ===
                                      `transport-report:${transport.transport_id}`
                                  }
                                  onClick={() => {
                                    if (!nouvelleArriveePrevueAt) return

                                    reporterArriveeTransportChine(
                                      transport.transport_id,
                                      new Date(
                                        nouvelleArriveePrevueAt,
                                      ).toISOString(),
                                    ).then((succes) => {
                                      if (!succes) return

                                      setTransportReportId('')
                                      setNouvelleArriveePrevueAt('')
                                    })
                                  }}
                                  className="flex-1 rounded-xl bg-amber-600 px-4 py-3 text-sm font-black text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {statutEnCours ===
                                  `transport-report:${transport.transport_id}`
                                    ? 'Enregistrement…'
                                    : 'Confirmer le report'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setTransportReportId(transport.transport_id)
                                setNouvelleArriveePrevueAt('')
                              }}
                              disabled={
                                statutEnCours ===
                                `transport:${transport.transport_id}`
                              }
                              className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Reporter l’arrivée
                            </button>
                          )}
                        </div>
                      )}

                      <div className="border-t border-slate-200 px-5 py-4">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Marchandises transportées
                        </p>

                        <div className="mt-3 space-y-2">
                          {(transport.lignes || []).map((ligne) => (
                            <div
                              key={ligne.id || `${transport.transport_id}-${ligne.nom_produit}`}
                              className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-slate-700">
                                  {ligne.nom_produit || 'Produit'}
                                </p>
                                {ligne.nom_variante && (
                                  <p className="mt-0.5 text-xs font-bold text-slate-400">
                                    {ligne.nom_variante}
                                  </p>
                                )}
                              </div>

                              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                                × {ligne.quantite || 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </>
                  )}

                  <div className="border-t border-slate-200 bg-white px-5 py-4">
                    <button
                      type="button"
                      onClick={() => executerProchaineActionSurCommande(commande, transport)}
                      disabled={enCours}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#0B1E3D] px-4 text-[11px] font-black text-white shadow-sm transition hover:bg-[#163665] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {enCours ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          Traitement…
                        </>
                      ) : (
                        <>
                          <Clock3 size={13} />
                          Prochaine étape
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}

          {!chargement && articlesSurCommande.length === 0 && (
            <div className="px-5 py-12 text-center">
              <Package className="mx-auto text-slate-300" size={36} />
              <p className="mt-2 text-sm font-black text-slate-500">
                Aucune commande sur commande
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

      {/* MODALE ATTRIBUTION LIVREUR */}
      {confirmationLivreur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Bike size={22} />
            </div>

            <h2 className="mt-4 text-xl font-black text-[#0B1E3D]">
              Attribuer le livreur
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Commande {confirmationLivreur.numero}
            </p>

            <label className="mt-5 block">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Nom du livreur
              </span>

              <input
                type="text"
                value={livreurNom}
                onChange={(event) => setLivreurNom(event.target.value)}
                placeholder="Nom complet"
                maxLength={120}
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Téléphone
              </span>

              <input
                type="tel"
                inputMode="numeric"
                value={livreurTelephone}
                onChange={(event) =>
                  setLivreurTelephone(
                    event.target.value.replace(/\D/g, '').slice(0, 10),
                  )
                }
                placeholder="01XXXXXXXX"
                maxLength={10}
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
              />
            </label>

            {erreurLivreur && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                {erreurLivreur}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmationLivreur(null)
                  setErreurLivreur('')
                }}
                disabled={livreurEnCours === confirmationLivreur.numero}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => void enregistrerLivreur(confirmationLivreur)}
                disabled={livreurEnCours === confirmationLivreur.numero}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {livreurEnCours === confirmationLivreur.numero
                  ? 'Attribution…'
                  : 'Attribuer'}
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
