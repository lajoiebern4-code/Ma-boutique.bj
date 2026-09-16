import { useEffect, useState } from 'react'
import { useNavigationType, useSearchParams } from 'react-router-dom'
import {
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Search,
  Truck,
  Phone,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  recupererMesCommandes,
  recupererRecuClient,
  recupererMoyensPaiementActifs,
  initierPaiementSolde,
  initierPaiementSoldeInvite,
  verifierCommandePaiementInvite,
  envoyerPreuvePaiement,
  envoyerPreuvePaiementConnecte,
} from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import jsPDF from 'jspdf'

type Article = {
  id?: string
  produit_id?: string
  nom_produit?: string
  prix_unitaire?: number
  quantite?: number
  origine?: string
  total_ligne?: number
}

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
  statut?: string
  code_suivi?: string
  code_retrait?: string
  mode_reception?: string
  type_parcours?: string
  mode_paiement?: string
  adresse_livraison?: string
  created_at?: string
  total?: number
  acompte_requis?: number
  acompte_paye?: number
  solde_restant?: number
  paiement_type?: string
  paiement?: {
    id?: string
    provider?: string
    montant?: number
    statut?: string
    reference_paiement?: string
    reference_transaction?: string
    preuve_path?: string
    preuve_uploaded_at?: string
    created_at?: string
    updated_at?: string
  } | null
  
  livraison_statut?: string
  point_depart?: string
  point_destination?: string
  depart_prevu_at?: string
  arrivee_prevue_at?: string
  depart_reel_at?: string
  arrivee_reelle_at?: string
  livraison_confirmee_at?: string
  livreur_nom?: string
  livreur_telephone?: string
  transports?: Array<{
    transport_id?: string
    numero?: string
    type_transport?: string
    origine?: string
    destination?: string
    statut?: string
    depart_prevu_at?: string
    depart_reel_at?: string
    arrivee_prevue_at?: string
    arrivee_reelle_at?: string
  }>
}

function formatPrix(value?: number) {
  const prix = Math.round(Number(value || 0))
    .toLocaleString('fr-FR')
    .replace(/[\u00A0\u202F]/g, ' ')
  return `${prix} FCFA`
}

function formatTelephone(value?: string) {
  const telephone = String(value || '').replace(/\D/g, '').slice(0, 10)

  if (telephone.length !== 10 || !telephone.startsWith('01')) {
    return telephone
  }

  return telephone.replace(
    /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/,
    '$1 $2 $3 $4 $5',
  )
}

function formatDate(value?: string) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function libelleStatut(statut?: string) {
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
    livraison_planifiee: 'Livraison planifiée',
    livraison_en_cours: 'Livraison en cours',
    livreur_arrive: 'Livreur arrivé',
    livree: 'Commande livrée',
    annulee: 'Commande annulée',
  }

  return labels[String(statut || '').toLowerCase()] || statut || 'Mise à jour'
}

function iconeEtape(statut?: string) {
  const value = String(statut || '').toLowerCase()

  if (
    value.includes('livr') ||
    value.includes('confirm') ||
    value.includes('paye')
  ) {
    return CheckCircle2
  }

  if (
    value.includes('exped') ||
    value.includes('transit') ||
    value.includes('livraison')
  ) {
    return Truck
  }

  return Package
}

function texteReception(mode?: string) {
  if (mode === 'livraison') {
    return {
      titre: 'Livraison à domicile',
      description:
        'Votre commande sera acheminée jusqu’à l’adresse indiquée lors de la commande.',
    }
  }

  return {
    titre: 'Retrait',
    description:
      'Votre commande sera disponible au point de retrait prévu par ChinaShop-Bénin.',
  }
}

export default function Suivi() {
  const { user } = useAuth()
  const [maintenant, setMaintenant] = useState(Date.now())

  const initialiserPaiementDuSolde = async () => {
    const numeroCommande = String(commande?.numero || '').trim()
    const telephone = telephoneSolde.replace(/\D/g, '').slice(0, 10)

    setErreurPaiementSolde('')
    setMessagePaiementSolde('')

    if (!numeroCommande) {
      setErreurPaiementSolde('Numéro de commande introuvable.')
      return
    }

    if (telephone.length !== 10 || !telephone.startsWith('01')) {
      setErreurPaiementSolde(
        'Veuillez saisir un numéro béninois valide de 10 chiffres commençant par 01.',
      )
      return
    }

    setChargementPaiementSolde(true)

    try {
      const resultat = paiementAccesToken
        ? await initierPaiementSoldeInvite(
            numeroCommande,
            paiementAccesToken,
            providerSolde,
          )
        : await initierPaiementSolde(
            numeroCommande,
            telephone,
            providerSolde,
          )

      if (resultat?.success === false) {
        throw new Error(
          resultat?.error || 'Impossible d’initialiser le paiement du solde.',
        )
      }

      setMessagePaiementSolde(
        'Paiement du solde initialisé. Utilisez la référence indiquée ci-dessous.',
      )

      await actualiserSuiviSilencieusement(code)
    } catch (err: any) {
      console.error('Erreur initialisation paiement solde:', err)
      setErreurPaiementSolde(
        err?.message || 'Impossible d’initialiser le paiement du solde.',
      )
    } finally {
      setChargementPaiementSolde(false)
    }
  }

  const envoyerPreuveDuSolde = async () => {
    const numeroCommande = String(commande?.numero || '').trim()
    const paiementId = String(commande?.paiement?.id || '').trim()

    setErreurPaiementSolde('')
    setMessagePaiementSolde('')

    if (!numeroCommande) {
      setErreurPaiementSolde('Numéro de commande introuvable.')
      return
    }

    if (!paiementId) {
      setErreurPaiementSolde(
        'Le paiement du solde doit être initialisé avant l’envoi de la preuve.',
      )
      return
    }

    if (!fichierPreuveSolde) {
      setErreurPaiementSolde('Veuillez sélectionner votre preuve de paiement.')
      return
    }

    setChargementPreuveSolde(true)

    try {
      if (paiementAccesToken) {
        await envoyerPreuvePaiement(
          numeroCommande,
          paiementAccesToken,
          paiementId,
          fichierPreuveSolde,
        )
      } else {
        await envoyerPreuvePaiementConnecte(
          numeroCommande,
          paiementId,
          fichierPreuveSolde,
        )
      }

      setFichierPreuveSolde(null)
      setMessagePaiementSolde(
        'Preuve envoyée. Votre paiement est maintenant en attente de confirmation.',
      )

      await actualiserSuiviSilencieusement(code)
    } catch (err: any) {
      console.error('Erreur envoi preuve solde:', err)
      setErreurPaiementSolde(
        err?.message || 'Impossible d’envoyer la preuve de paiement.',
      )
    } finally {
      setChargementPreuveSolde(false)
    }
  }

  useEffect(() => {
    const intervalle = window.setInterval(() => {
      setMaintenant(Date.now())
    }, 1000)



  return () => window.clearInterval(intervalle)
  }, [])
  const [searchParams] = useSearchParams()
  const navigationType = useNavigationType()
  const [code, setCode] = useState('')
  const [commande, setCommande] = useState<Commande | null>(null)
  const CLE_SESSION_SUIVI = 'chinashop_suivi_commande'
  const [etapes, setEtapes] = useState<Etape[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [chargementRecu, setChargementRecu] = useState(false)
  const [erreurRecu, setErreurRecu] = useState('')
  const [providerSolde, setProviderSolde] = useState('mtn')
  const [telephoneSolde, setTelephoneSolde] = useState('')
  const [fichierPreuveSolde, setFichierPreuveSolde] = useState<File | null>(null)
  const [chargementPaiementSolde, setChargementPaiementSolde] = useState(false)
  const [chargementPreuveSolde, setChargementPreuveSolde] = useState(false)
  const [erreurPaiementSolde, setErreurPaiementSolde] = useState('')
  const [messagePaiementSolde, setMessagePaiementSolde] = useState('')
  const [paiementAccesToken, setPaiementAccesToken] = useState('')
  const [moyensPaiementSolde, setMoyensPaiementSolde] = useState<any[]>([])

  const telechargerRecu = async () => {
    const codeSuivi = String(commande?.code_suivi || '').trim().toUpperCase()

    if (!codeSuivi) {
      setErreurRecu('Code de suivi indisponible.')
      return
    }

    setChargementRecu(true)
    setErreurRecu('')

    try {
      const data = await recupererRecuClient(codeSuivi)
      const recu = data?.commande
      const lignes = Array.isArray(data?.lignes) ? data.lignes : []

      if (!recu) {
        throw new Error('Reçu introuvable.')
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 16
      const contentWidth = pageWidth - margin * 2
      let y = 18

      const rouge = '#D92D20'
      const bleu = '#071A33'
      const gris = '#64748B'
      const grisClair = '#F8FAFC'
      const bordure = '#E2E8F0'

      const texte = (value: unknown) =>
        String(value ?? '').replace(/\s+/g, ' ').trim()

      const montant = (value: unknown) => formatPrix(value)

      const dessinerPiedPage = () => {
        doc.setDrawColor(bordure)
        doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(gris)
        doc.text(
          'ChinaShop-Bénin • Merci pour votre confiance',
          margin,
          pageHeight - 10,
        )
        doc.text(
          `Page ${doc.getNumberOfPages()}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: 'right' },
        )
      }

      const nouvellePageSiNecessaire = (hauteur: number) => {
        if (y + hauteur > pageHeight - 24) {
          dessinerPiedPage()
          doc.addPage()
          y = 18
        }
      }

      const blocInfo = (
        titre: string,
        valeur: string,
        x: number,
        largeur: number,
      ) => {
        doc.setFillColor(grisClair)
        doc.roundedRect(x, y, largeur, 17, 2.5, 2.5, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(gris)
        doc.text(titre.toUpperCase(), x + 4, y + 6)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(bleu)
        doc.text(valeur || '—', x + 4, y + 12)
      }

      // ===== EN-TÊTE =====
      doc.setFillColor(bleu)
      doc.rect(0, 0, pageWidth, 39, 'F')

      doc.setFillColor(217, 45, 32)
      doc.rect(0, 0, 6, 39, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(21)
      doc.setTextColor('#FFFFFF')
      doc.text('ChinaShop-Bénin', margin, 17)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor('#CBD5E1')
      doc.text('Votre boutique • Votre commande • Votre confiance', margin, 25)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor('#FFFFFF')
      doc.text('REÇU', pageWidth - margin, 16, { align: 'right' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor('#CBD5E1')
      doc.text(
        texte(recu?.numero || codeSuivi),
        pageWidth - margin,
        23,
        { align: 'right' },
      )

      y = 49

      // ===== TITRE =====
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(17)
      doc.setTextColor(bleu)
      doc.text('Reçu de commande', margin, y)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(gris)
      doc.text(
        'Document récapitulatif de votre achat',
        margin,
        y + 6,
      )

      y += 17

      // ===== INFORMATIONS =====
      const gap = 5
      const largeurBloc = (contentWidth - gap) / 2

      blocInfo(
        'Commande',
        texte(recu?.numero),
        margin,
        largeurBloc,
      )

      blocInfo(
        'Code de suivi',
        texte(recu?.code_suivi || codeSuivi),
        margin + largeurBloc + gap,
        largeurBloc,
      )

      y += 22

      blocInfo(
        'Client',
        texte(recu?.nom_client),
        margin,
        largeurBloc,
      )

      blocInfo(
        'Téléphone',
        texte(recu?.telephone),
        margin + largeurBloc + gap,
        largeurBloc,
      )

      y += 22

      blocInfo(
        'Mode de réception',
        texte(recu?.mode_reception),
        margin,
        largeurBloc,
      )

      blocInfo(
        'Statut',
        'Commande enregistrée',
        margin + largeurBloc + gap,
        largeurBloc,
      )

      y += 27

      // ===== ARTICLES =====
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(bleu)
      doc.text('Détail de la commande', margin, y)

      y += 7

      const colProduit = margin
      const colVariante = 84
      const colQte = 126
      const colPrix = 143
      const colTotal = 172

      doc.setFillColor(bleu)
      doc.roundedRect(
        margin,
        y,
        contentWidth,
        10,
        2,
        2,
        'F',
      )

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor('#FFFFFF')
      doc.text('PRODUIT', colProduit + 4, y + 6.5)
      doc.text('VARIANTE', colVariante, y + 6.5)
      doc.text('QTÉ', colQte, y + 6.5)
      doc.text('PRIX UNIT.', colPrix, y + 6.5)
      doc.text('TOTAL', colTotal, y + 6.5)

      y += 13

      for (let index = 0; index < lignes.length; index += 1) {
        const ligne: any = lignes[index]

        nouvellePageSiNecessaire(14)

        if (index % 2 === 0) {
          doc.setFillColor('#F8FAFC')
          doc.rect(margin, y - 4, contentWidth, 11, 'F')
        }

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.8)
        doc.setTextColor(bleu)

        const nomProduit = texte(ligne?.nom_produit).slice(0, 30)
        const variante = texte(ligne?.nom_variante).slice(0, 18)

        doc.text(nomProduit || 'Produit', colProduit + 4, y + 2)
        doc.setFont('helvetica', 'normal')
        doc.text(variante || '—', colVariante, y + 2)
        doc.text(texte(ligne?.quantite || 0), colQte, y + 2)
        doc.text(montant(ligne?.prix_unitaire), colPrix, y + 2)
        doc.setFont('helvetica', 'bold')
        doc.text(montant(ligne?.total_ligne), colTotal, y + 2)

        doc.setDrawColor(bordure)
        doc.line(margin, y + 6, pageWidth - margin, y + 6)

        y += 11
      }

      if (lignes.length === 0) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(gris)
        doc.text(
          'Aucun article détaillé disponible.',
          margin + 4,
          y + 2,
        )
        y += 12
      }

      // ===== TOTAUX =====
      nouvellePageSiNecessaire(62)

      y += 8

      const totalBoxX = 112
      const totalBoxWidth = pageWidth - margin - totalBoxX

      doc.setFillColor(grisClair)
      doc.roundedRect(
        totalBoxX,
        y,
        totalBoxWidth,
        47,
        3,
        3,
        'F',
      )

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(gris)

      doc.text('Sous-total', totalBoxX + 6, y + 10)
      doc.text(
        montant(recu?.sous_total),
        pageWidth - margin - 5,
        y + 10,
        { align: 'right' },
      )

      doc.text('Réduction', totalBoxX + 6, y + 18)
      doc.text(
        montant(recu?.reduction),
        pageWidth - margin - 5,
        y + 18,
        { align: 'right' },
      )

      doc.text('Livraison', totalBoxX + 6, y + 26)
      doc.text(
        montant(recu?.frais_livraison),
        pageWidth - margin - 5,
        y + 26,
        { align: 'right' },
      )

      doc.setDrawColor(bordure)
      doc.line(
        totalBoxX + 6,
        y + 30,
        pageWidth - margin - 5,
        y + 30,
      )

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(rouge)
      doc.text('TOTAL', totalBoxX + 6, y + 40)
      doc.text(
        montant(recu?.total),
        pageWidth - margin - 5,
        y + 40,
        { align: 'right' },
      )

      y += 59

      // ===== MESSAGE FINAL =====
      nouvellePageSiNecessaire(27)

      doc.setFillColor('#FFF7F5')
      doc.roundedRect(
        margin,
        y,
        contentWidth,
        22,
        3,
        3,
        'F',
      )

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(bleu)
      doc.text(
        'Merci pour votre confiance envers ChinaShop-Bénin.',
        margin + 6,
        y + 9,
      )

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(gris)
      doc.text(
        'Conservez ce reçu pour le suivi de votre commande.',
        margin + 6,
        y + 15,
      )

      dessinerPiedPage()

      const numero = texte(recu?.numero || codeSuivi)
        .replace(/[^a-zA-Z0-9_-]/g, '_')

      doc.save(`ChinaShop-Recu-${numero}.pdf`)
    } catch (error: any) {
      console.error('Erreur téléchargement reçu:', error)
      setErreurRecu(
        error?.message || 'Impossible de générer le reçu pour le moment.',
      )
    } finally {
      setChargementRecu(false)
    }
  }

  async function rechercher(
    event?: React.FormEvent,
    codeRecherche?: string,
  ) {
    event?.preventDefault()

    const valeur = (codeRecherche ?? code).trim().toUpperCase()

    if (valeur.length < 3) {
      setErreur('Veuillez saisir un code de suivi valide.')
      setCommande(null)
      setEtapes([])
      return
    }

    setChargement(true)
    setErreur('')
    setCommande(null)
    setEtapes([])
    setArticles([])

    const { data, error } = await supabase.rpc('suivre_commande', {
      p_code_suivi: valeur,
    })

    setChargement(false)

    if (error) {
      console.error('Erreur suivi commande:', error)
      setErreur('Impossible de récupérer cette commande pour le moment.')
      return
    }

    const resultat = Array.isArray(data) ? data[0] : data

    if (!resultat) {
      setErreur('Aucune commande ne correspond à ce code de suivi.')
      return
    }

    // Vérifier si un token invité existe avant de bloquer
    let tokenInviteTemp = ''
    try {
      const brutCommande = sessionStorage.getItem('chinashop_commande_resultat')
      if (brutCommande) {
        const contenuCommande = JSON.parse(brutCommande)
        const numeroSession = String(contenuCommande?.numeroCommande || '').trim().toUpperCase()
        const numeroCommande = String(resultat.commande?.numero || '').trim().toUpperCase()
        if (numeroSession && numeroSession === numeroCommande && contenuCommande?.paiementAccesToken) {
          tokenInviteTemp = String(contenuCommande.paiementAccesToken).trim()
        }
      }
    } catch (e) { /* ignore */ }

    if (resultat.paiement_requis === true && !user?.id && !tokenInviteTemp) {
      setErreur('Le suivi détaillé sera disponible après validation du paiement.')
      return
    }

      if (!resultat.commande) {
        setErreur('Aucune commande ne correspond à ce code de suivi.')
        return
      }

      let commandeResultat = resultat.commande

      let tokenInvite = ''

      try {
        const brutCommande = sessionStorage.getItem(
          'chinashop_commande_resultat',
        )

        if (brutCommande) {
          const contenuCommande = JSON.parse(brutCommande)
          alert(
            `SESSION STORAGE\nCommande: ${contenuCommande?.numeroCommande || 'aucune'}\nToken: ${Boolean(contenuCommande?.paiementAccesToken)}`
          )

          const numeroSession = String(
            contenuCommande?.numeroCommande || '',
          ).trim().toUpperCase()

          const numeroCommande = String(
            commandeResultat?.numero || '',
          ).trim().toUpperCase()

          if (numeroSession && numeroSession === numeroCommande) {
            tokenInvite = String(
              contenuCommande?.paiementAccesToken || '',
            ).trim()

              console.log('DEBUG TOKEN INVITE', {
                numeroSession,
                numeroCommande,
                tokenPresent: Boolean(tokenInvite),
                tokenLength: tokenInvite.length,
              })
              alert(
                `DEBUG TOKEN INVITE\nPrésent: ${Boolean(tokenInvite)}\nLongueur: ${tokenInvite.length}`,
              )
          }
        }
      } catch (err) {
        console.warn(
          'Impossible de récupérer le jeton de paiement invité:',
          err,
        )
      }

      setPaiementAccesToken(tokenInvite)

      if (tokenInvite) {
        try {
          const paiementInvite =
            await verifierCommandePaiementInvite(
              String(commandeResultat?.numero || '').trim(),
              tokenInvite,
            )

          alert(
            `DEBUG RPC SOLDE\nSuccess: ${Boolean(paiementInvite?.success)}\nSolde: ${paiementInvite?.solde_restant ?? 'undefined'}\nPaiement: ${Boolean(paiementInvite?.paiement)}`,
          )

          if (paiementInvite?.success) {
            commandeResultat = {
              ...commandeResultat,
              solde_restant: paiementInvite.solde_restant,
              paiement_type: paiementInvite.paiement_type,
              paiement: paiementInvite.paiement
                ? {
                    id: paiementInvite.paiement.id,
                    provider: paiementInvite.paiement.provider,
                    montant: paiementInvite.paiement.montant,
                    statut: paiementInvite.paiement.statut,
                    reference_paiement:
                      paiementInvite.paiement.reference_paiement,
                    reference_transaction:
                      paiementInvite.paiement.reference_transaction,
                    preuve_path:
                      paiementInvite.paiement.preuve_path,
                    preuve_uploaded_at:
                      paiementInvite.paiement.preuve_uploaded_at,
                    created_at:
                      paiementInvite.paiement.created_at,
                    updated_at:
                      paiementInvite.paiement.updated_at,
                  }
                : null,
            }
          }
        } catch (err) {
          console.warn(
            'Impossible de récupérer les informations de paiement invité:',
            err,
          )
        }
      }

    // Les informations du livreur sont privées.
    // Elles sont récupérées uniquement pour le client connecté
    // et uniquement si la commande lui appartient.
    console.log('DEBUG SUIVI USER:', user?.id || 'AUCUN')
    if (user?.id) {
      try {
        const mesCommandes = await recupererMesCommandes()
        console.log('DEBUG MES COMMANDES:', mesCommandes.data)

        if (mesCommandes.success && Array.isArray(mesCommandes.data)) {
          const commandePrivee = mesCommandes.data.find(
            (item: any) =>
              String(item?.code_suivi || '').trim().toUpperCase() === valeur,
          )

          if (commandePrivee) {
            commandeResultat = {
              ...commandeResultat,
              livreur_nom: commandePrivee.livreur_nom,
              livreur_telephone: commandePrivee.livreur_telephone,
              solde_restant: commandePrivee.solde_restant,
              paiement_type: commandePrivee.paiement_type,
              paiement: commandePrivee.paiement,
            }
          }
        }
      } catch (err) {
        console.warn(
          'Impossible de récupérer les informations privées du livreur:',
          err,
        )
      }
    }

    const etapesResultat = Array.isArray(resultat.etapes)
      ? [...resultat.etapes].sort(
          (a, b) =>
            Number(a.position || 0) - Number(b.position || 0),
        )
      : []

    const articlesResultat = Array.isArray(resultat.articles)
      ? resultat.articles
      : []

    console.log('DEBUG ARTICLES RPC:', JSON.stringify(articlesResultat, null, 2))
    console.log('DEBUG PRIX PREMIER ARTICLE:', articlesResultat[0]?.prix_unitaire, articlesResultat[0]?.total_ligne)

    setCommande(commandeResultat)
    setEtapes(etapesResultat)
    setArticles(articlesResultat)

    try {
      sessionStorage.setItem(
        CLE_SESSION_SUIVI,
        JSON.stringify({
          code: valeur,
          commande: commandeResultat,
          articles: articlesResultat,
          etapes: etapesResultat,
        }),
      )
    } catch (err) {
      console.warn('Impossible de mémoriser temporairement le suivi.', err)
    }
  }

  
  const actualiserSuiviSilencieusement = async (codeSuivi: string) => {
    const valeur = codeSuivi.trim().toUpperCase()

    if (valeur.length < 3) return

    try {
      const { data, error } = await supabase.rpc('suivre_commande', {
        p_code_suivi: valeur,
      })

      if (error) {
        console.warn('Actualisation automatique du suivi impossible:', error)
        return
      }

      const resultat = Array.isArray(data) ? data[0] : data

      if (!resultat) return

      // Vérifier si un token invité existe avant de bloquer
    let tokenInviteTemp = ''
    try {
      const brutCommande = sessionStorage.getItem('chinashop_commande_resultat')
      if (brutCommande) {
        const contenuCommande = JSON.parse(brutCommande)
        const numeroSession = String(contenuCommande?.numeroCommande || '').trim().toUpperCase()
        const numeroCommande = String(resultat.commande?.numero || '').trim().toUpperCase()
        if (numeroSession && numeroSession === numeroCommande && contenuCommande?.paiementAccesToken) {
          tokenInviteTemp = String(contenuCommande.paiementAccesToken).trim()
        }
      }
    } catch (e) { /* ignore */ }

    if (resultat.paiement_requis === true && !user?.id && !tokenInviteTemp) {
      setErreur('Le suivi détaillé sera disponible après validation du paiement.')
      return
    }

      if (!resultat.commande) {
        setErreur('Aucune commande ne correspond à ce code de suivi.')
        return
      }

      let commandeResultat = resultat.commande

      let tokenInvite = ''

      try {
        const brutCommande = sessionStorage.getItem(
          'chinashop_commande_resultat',
        )

        if (brutCommande) {
          const contenuCommande = JSON.parse(brutCommande)

          const numeroSession = String(
            contenuCommande?.numeroCommande || '',
          ).trim().toUpperCase()

          const numeroCommande = String(
            commandeResultat?.numero || '',
          ).trim().toUpperCase()

          if (numeroSession && numeroSession === numeroCommande) {
            tokenInvite = String(
              contenuCommande?.paiementAccesToken || '',
            ).trim()
          }
        }
      } catch (err) {
        console.warn(
          'Impossible de récupérer le jeton de paiement invité:',
          err,
        )
      }

      setPaiementAccesToken(tokenInvite)

      if (tokenInvite) {
        try {
          const paiementInvite =
            await verifierCommandePaiementInvite(
              String(commandeResultat?.numero || '').trim(),
              tokenInvite,
            )

          if (paiementInvite?.success) {
            commandeResultat = {
              ...commandeResultat,
              solde_restant: paiementInvite.solde_restant,
              paiement_type: paiementInvite.paiement_type,
              paiement: paiementInvite.paiement
                ? {
                    id: paiementInvite.paiement.id,
                    provider: paiementInvite.paiement.provider,
                    montant: paiementInvite.paiement.montant,
                    statut: paiementInvite.paiement.statut,
                    reference_paiement:
                      paiementInvite.paiement.reference_paiement,
                    reference_transaction:
                      paiementInvite.paiement.reference_transaction,
                    preuve_path:
                      paiementInvite.paiement.preuve_path,
                    preuve_uploaded_at:
                      paiementInvite.paiement.preuve_uploaded_at,
                    created_at:
                      paiementInvite.paiement.created_at,
                    updated_at:
                      paiementInvite.paiement.updated_at,
                  }
                : null,
            }
          }
        } catch (err) {
          console.warn(
            'Impossible de récupérer les informations de paiement invité:',
            err,
          )
        }
      }

      console.log('DEBUG SUIVI USER:', user?.id || 'AUCUN')
    if (user?.id) {
        try {
          const mesCommandes = await recupererMesCommandes()
        console.log('DEBUG MES COMMANDES:', mesCommandes.data)

          if (mesCommandes.success && Array.isArray(mesCommandes.data)) {
            const commandePrivee = mesCommandes.data.find(
              (item: any) =>
                String(item?.code_suivi || '').trim().toUpperCase() === valeur,
            )

            if (commandePrivee) {
              commandeResultat = {
                ...commandeResultat,
                livreur_nom: commandePrivee.livreur_nom,
                livreur_telephone: commandePrivee.livreur_telephone,
                solde_restant: commandePrivee.solde_restant,
                paiement_type: commandePrivee.paiement_type,
                paiement: commandePrivee.paiement,
              }
            }
          }
        } catch (err) {
          console.warn(
            'Actualisation des informations privées du livreur impossible:',
            err,
          )
        }
      }

      const etapesResultat = Array.isArray(resultat.etapes)
        ? [...resultat.etapes].sort(
            (a, b) =>
              Number(a.position || 0) - Number(b.position || 0),
          )
        : []

      const articlesResultat = Array.isArray(resultat.articles)
        ? resultat.articles
        : []

      console.log('DEBUG ARTICLES REFRESH:', JSON.stringify(articlesResultat, null, 2))
      console.log('DEBUG PRIX REFRESH:', articlesResultat[0]?.prix_unitaire, articlesResultat[0]?.total_ligne)

      setCommande(commandeResultat)
      setEtapes(etapesResultat)
      setArticles(articlesResultat)

      try {
        sessionStorage.setItem(
          CLE_SESSION_SUIVI,
          JSON.stringify({
            code: valeur,
            commande: commandeResultat,
            articles: articlesResultat,
            etapes: etapesResultat,
          }),
        )
      } catch (err) {
        console.warn(
          'Impossible de mémoriser la mise à jour automatique du suivi.',
          err,
        )
      }
    } catch (err) {
      console.warn('Erreur pendant l’actualisation automatique:', err)
    }
  }

  useEffect(() => {
    if (
        (!user?.id && !paiementAccesToken) ||
        String(commande?.statut || '').toLowerCase() !== 'solde_requis'
      ) {
      setMoyensPaiementSolde([])
      return
    }

    let actif = true

    recupererMoyensPaiementActifs()
      .then((resultat) => {
        if (!actif) return

        setMoyensPaiementSolde(resultat)

        if (
          resultat.length > 0 &&
          !resultat.some((moyen: any) => moyen.code === providerSolde)
        ) {
          setProviderSolde(resultat[0].code)
        }
      })
      .catch((error) => {
        if (!actif) return
        console.error(
          'Impossible de charger les moyens de paiement du solde:',
          error,
        )
        setMoyensPaiementSolde([])
      })

    return () => {
      actif = false
    }
  }, [user?.id, commande?.statut, paiementAccesToken])

  useEffect(() => {
    const codeUrl = searchParams.get('code')?.trim()
    if (codeUrl) return

    // PUSH = arrivée depuis une autre page de l'application.
    // Sans code dans l'URL, on laisse l'écran vide et on conserve
    // le dernier suivi mémorisé pour pouvoir le restaurer au prochain retour.
    if (navigationType === 'PUSH') {
      setCode('')
      setCommande(null)
      setArticles([])
      setEtapes([])
      return
    }

    // POP correspond notamment à l'ouverture/rechargement de la page.
    // On restaure donc le dernier suivi disponible.
    try {
      const sauvegarde = sessionStorage.getItem(CLE_SESSION_SUIVI)
      if (!sauvegarde) return

      const contenu = JSON.parse(sauvegarde)

      if (contenu?.code && contenu?.commande) {
        setCode(String(contenu.code).toUpperCase())
        setCommande(contenu.commande)
        setArticles(
          Array.isArray(contenu.articles)
            ? contenu.articles
            : [],
        )
        setEtapes(
          Array.isArray(contenu.etapes)
            ? contenu.etapes
            : [],
        )

        // Le sessionStorage sert uniquement à restaurer rapidement l'écran.
        // Les données officielles doivent immédiatement être rechargées depuis Supabase.
        void rechercher(undefined, String(contenu.code).toUpperCase())
      }
    } catch (err) {
      console.warn(
        'Impossible de restaurer le suivi temporaire.',
        err,
      )
      sessionStorage.removeItem(CLE_SESSION_SUIVI)
    }
  }, [searchParams, navigationType])

  useEffect(() => {
    const codeUrl = searchParams.get('code')?.trim()

    if (!codeUrl) return

    const codeNormalise = codeUrl.toUpperCase()
    let actif = true

    const lancerRechercheAutomatique = async () => {
      try {
        if (!actif) return

        setCode(codeNormalise)
        await rechercher(undefined, codeNormalise)

        if (actif) {
          window.history.replaceState(
            {},
            '',
            window.location.pathname,
          )
        }
      } catch (err) {
        console.error(
          'Erreur lors de la recherche automatique du suivi:',
          err,
        )

        if (actif) {
          setChargement(false)
          setErreur(
            'Impossible de récupérer cette commande pour le moment.',
          )
        }
      }
    }

    lancerRechercheAutomatique()

    return () => {
      actif = false
    }
  }, [searchParams])

  useEffect(() => {
    if (!commande?.id || !code) return

    let actif = true
    const codeSuivi = code.trim().toUpperCase()
    const topic = `suivi-commande:${codeSuivi}`

    // Realtime principal : Broadcast envoyé par les actions d'administration.
    const channel = supabase
      .channel(topic)
      .on(
        'broadcast',
        { event: 'commande_update' },
        async () => {
          if (!actif) return

          // Le signal ne contient aucune donnée métier privée.
          // On recharge l'état officiel depuis le RPC.
          await actualiserSuiviSilencieusement(codeSuivi)
        },
      )
      .subscribe((status, err) => {
        console.log(
          '[SUIVI REALTIME] Canal:',
          topic,
          'Statut:',
          status,
          err || '',
        )

        if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          console.warn(
            '[SUIVI REALTIME] Connexion indisponible:',
            status,
            err || '',
          )
        }
      })

    // Filet de sécurité : si aucun Broadcast n'arrive,
    // on vérifie régulièrement l'état officiel de la commande.
    const intervalle = window.setInterval(() => {
      if (!actif) return
      void actualiserSuiviSilencieusement(codeSuivi)
    }, 10000)

    return () => {
      actif = false
      window.clearInterval(intervalle)
      void supabase.removeChannel(channel)
    }
  }, [commande?.id, code])

  const statut = String(commande?.statut || '').toLowerCase()
  const livraisonStatut = String(
    commande?.livraison_statut || 'non_planifiee',
  ).toLowerCase()

  // Le statut affiché suit l'étape réelle de livraison.
  // Le statut métier de la commande en base reste inchangé.
  const statutAffiche =
    commande?.mode_reception === 'livraison'
      ? livraisonStatut === 'livree'
        ? 'livree'
        : livraisonStatut === 'arrivee'
          ? 'livreur_arrive'
          : livraisonStatut === 'en_route'
            ? 'livraison_en_cours'
            : livraisonStatut === 'planifiee'
              ? 'livraison_planifiee'
              : statut
      : statut

  const derniereEtape =
    etapes.length > 0 ? etapes[etapes.length - 1] : null

  const reception = texteReception(commande?.mode_reception)

  const acompteRequis = Number(commande?.acompte_requis || 0)
  const acomptePaye = Number(commande?.acompte_paye || 0)
  const soldeRestant = Number(commande?.solde_restant || 0)

      const departPrevu = commande?.depart_prevu_at
        ? new Date(commande.depart_prevu_at).getTime()
        : null

      const arriveePrevue = commande?.arrivee_prevue_at
        ? new Date(commande.arrivee_prevue_at).getTime()
        : null

      const departReel = commande?.depart_reel_at
        ? new Date(commande.depart_reel_at).getTime()
        : null

      const arriveeReelle = commande?.arrivee_reelle_at
        ? new Date(commande.arrivee_reelle_at).getTime()
        : null

      let progressionLivraison = 0

      if (
        statut === 'livree' ||
        livraisonStatut === 'livree' ||
        Boolean(arriveeReelle)
      ) {
        // Livraison réellement terminée : la barre atteint 100 %.
        // Le statut global "livree" est également définitif.
        progressionLivraison = 1
      } else if (livraisonStatut === 'arrivee') {
        // Le livreur est arrivé, mais la livraison n'est pas encore
        // confirmée : on reste juste avant la fin.
        progressionLivraison = 0.98
      } else if (livraisonStatut === 'en_route') {
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
          // Livraison en cours mais sans horaires exploitables :
          // on affiche un état de départ discret plutôt qu'une fausse
          // progression basée sur une durée arbitraire.
          progressionLivraison = 0.02
        }
      } else if (livraisonStatut === 'planifiee') {
        progressionLivraison = 0
      }

  const estSurCommande =
    String(commande?.type_parcours || '').toLowerCase() === 'sur_commande'

  const transportPrincipal = estSurCommande
    ? commande?.transports?.[0]
    : null

  const transportType = String(
    transportPrincipal?.type_transport || '',
  ).toLowerCase()

  const transportDepartReel = transportPrincipal?.depart_reel_at
    ? new Date(transportPrincipal.depart_reel_at).getTime()
    : null

  const transportArriveePrevue = transportPrincipal?.arrivee_prevue_at
    ? new Date(transportPrincipal.arrivee_prevue_at).getTime()
    : null

  const transportArriveeReelle = transportPrincipal?.arrivee_reelle_at
    ? new Date(transportPrincipal.arrivee_reelle_at).getTime()
    : null

  const transportProgression =
    estSurCommande &&
    transportDepartReel &&
    transportArriveePrevue &&
    transportArriveePrevue > transportDepartReel &&
    !transportArriveeReelle
      ? Math.min(
          0.97,
          Math.max(
            0,
            (maintenant - transportDepartReel) /
              (transportArriveePrevue - transportDepartReel),
          ),
        )
      : transportArriveeReelle
        ? 1
        : 0

  const transportEnRetard =
    estSurCommande &&
    !!transportArriveePrevue &&
    !transportArriveeReelle &&
    maintenant > transportArriveePrevue

  const transportTermine =
    estSurCommande && !!transportArriveeReelle

  const estSurCommandeTimeline =
    String(commande?.type_parcours || '').toLowerCase() === 'sur_commande'

  const normaliserStatutTimeline = (valeur: string) =>
    valeur
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '')

  const ordreEtapesTimeline = [
    'acompte_requis',
    'paiement_recu',
    'acompte_confirme',
    'achat_fournisseur',
    'preparation_chine',
    'chargee',
    'partie_chine',
    'en_transit',
    'arrivee_cotonou',
    'solde_requis',
    'solde_confirme',
    'pret',
    'livraison_en_cours',
    'livree',
    'retire',
  ]

  const etapesAffichage = etapes

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-slate-900">
      {/* HERO / RECHERCHE */}
      <section className="relative overflow-hidden bg-[#071A33]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,82,204,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,122,26,0.10),transparent_32%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-9 sm:px-6 sm:pb-16 sm:pt-12">
          <div className="mx-auto max-w-4xl text-center">

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              <Package size={14} className="text-[#FF8A2A]" />
              ChinaShop-Bénin
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">
              Suivez votre commande
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Consultez l’avancement de votre commande à chaque étape,
              jusqu’à sa livraison ou son retrait.
            </p>

            <form onSubmit={rechercher} className="mx-auto mt-8 max-w-3xl">
              <div className="rounded-[22px] border border-white/10 bg-white p-2 shadow-2xl shadow-black/30">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="code-suivi"
                      value={code}
                      onChange={(event) =>
                        setCode(event.target.value.toUpperCase())
                      }
                      placeholder="Entrez votre code de suivi"
                      autoComplete="off"
                      className="h-14 w-full rounded-[16px] bg-slate-100 px-4 pl-11 text-sm font-black tracking-[0.08em] text-[#071A33] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#0052CC]/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={chargement}
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-[16px] bg-[#0052CC] px-7 text-sm font-black text-white shadow-lg shadow-[#0052CC]/20 transition hover:bg-[#003D99] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Search size={17} />
                    {chargement ? 'Recherche…' : 'Suivre ma commande'}
                  </button>
                </div>
              </div>

              {erreur && (
                <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-bold text-red-700">
                  {erreur}
                </div>
              )}
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              <span>Suivi sécurisé</span>
              <span className="h-1 w-1 rounded-full bg-[#FF8A2A]" />
              <span>Mise à jour en temps réel</span>
              <span className="h-1 w-1 rounded-full bg-[#0052CC]" />
              <span>Livraison ou retrait</span>
            </div>
          </div>
        </div>
      </section>

      {commande && (
        <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">

          {/* IDENTITÉ DE LA COMMANDE */}
          <div className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(7,26,51,0.08)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(7,26,51,0.12)]">
            <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-[#071A33] via-[#0B2444] to-[#12345B] px-5 py-6 text-white sm:px-7 sm:py-7">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/[0.06] transition-transform duration-700 group-hover:scale-125" />
              <div className="absolute -bottom-20 -left-12 h-36 w-36 rounded-full bg-[#D92D20]/10" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D92D20] animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">
                      Suivi de commande
                    </p>
                  </div>

                  <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                    {commande.numero || 'Commande'}
                  </h2>

                  <p className="mt-1 text-xs font-medium text-slate-400">
                    Parcours de votre commande
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-xs font-black text-white shadow-sm backdrop-blur-sm ${
                    statutAffiche === 'livree'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : statutAffiche === 'annulee'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : statutAffiche === 'livraison_en_cours'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-orange-200 bg-orange-50 text-orange-700'
                  }`}
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-current" />
                  </span>
                  {libelleStatut(statutAffiche)}
                </span>
              </div>

              <div className="relative mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm transition-all duration-500 group-hover:bg-white/[0.10]">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Date de commande
                  </p>
                  <p className="mt-1.5 truncate text-sm font-black tracking-wide text-white">
                    {commande.created_at ? formatDate(commande.created_at) : '—'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm transition-all duration-500 group-hover:bg-white/[0.10]">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                    N° de suivi
                  </p>
                  <p className="mt-1.5 truncate font-mono text-sm font-black tracking-wide text-white">
                    {commande.code_suivi || '—'}
                  </p>
                </div>
              </div>

            </div>

              {((commande.mode_reception === 'livraison' &&
                livraisonStatut === 'livree') ||
                (commande.mode_reception === 'retrait' &&
                  statut === 'retire')) && (
                <div className="border-t border-slate-100 px-5 py-4 sm:px-7">
                  <button
                    type="button"
                    onClick={telechargerRecu}
                    disabled={chargementRecu}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-[#D92D20] px-5 py-3 text-xs font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {chargementRecu ? 'Préparation du reçu…' : 'Télécharger le reçu'}
                  </button>

                  {erreurRecu && (
                    <p className="mt-2 text-xs font-semibold text-red-600">
                      {erreurRecu}
                    </p>
                  )}
                </div>
              )}

              {/* DERNIÈRE MISE À JOUR */}
              <div className="px-5 py-5 sm:px-7 sm:py-6">
                <div
                  className={`relative overflow-hidden rounded-[28px] border p-5 shadow-sm transition-all duration-500 sm:p-6 ${
                    statutAffiche === 'livree'
                      ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white'
                      : statutAffiche === 'annulee'
                        ? 'border-red-200 bg-gradient-to-br from-red-50 via-white to-white'
                        : 'border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white'
                  }`}
                >
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/70" />

                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] shadow-lg ${
                          statutAffiche === 'livree'
                            ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                            : statutAffiche === 'annulee'
                              ? 'bg-red-600 text-white shadow-red-600/20'
                              : 'bg-[#0052CC] text-white shadow-[#0052CC]/20'
                        }`}
                      >
                        <span className="absolute inset-0 rounded-[22px] bg-white/10 animate-pulse" />
                        {statutAffiche === 'livree' ? (
                          <CheckCircle2 className="relative" size={28} />
                        ) : (
                          <Package className="relative" size={28} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Dernière mise à jour
                          </p>
                        </div>

                        <h3 className="mt-1.5 text-xl font-black tracking-tight text-[#071A33] sm:text-2xl">
                          {derniereEtape?.titre || libelleStatut(statut)}
                        </h3>

                        {derniereEtape?.description && (
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                            {derniereEtape.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.08em] shadow-sm ${
                        statutAffiche === 'livree'
                          ? 'border-emerald-200 bg-white text-emerald-700'
                          : statutAffiche === 'annulee'
                            ? 'border-red-200 bg-white text-red-700'
                            : 'border-blue-200 bg-white text-[#0052CC]'
                      }`}
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-30" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                      </span>
                      {libelleStatut(statutAffiche)}
                    </span>
                  </div>

                  {commande.mode_reception === 'livraison' &&
                    livraisonStatut === 'en_route' && (
                      <div className="relative mt-5 flex items-center gap-3 rounded-2xl border border-blue-200/70 bg-white/70 px-4 py-3 text-xs font-black text-[#0052CC]">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                          <Truck size={16} />
                        </span>
                        <span>Votre colis est actuellement en route</span>
                      </div>
                    )}
                </div>
              </div>

              {/* CODE RETRAIT */}
              {commande.mode_reception === 'retrait' &&
                statut === 'pret' &&
                commande.code_retrait && (
                  <div className="mt-4 overflow-hidden rounded-[24px] border border-orange-200 bg-[#FFF9F4]">
                    <div className="p-5 sm:p-7">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D96B0B]">
                            Code de retrait
                          </p>

                          <p className="mt-2 text-3xl font-black tracking-[0.2em] text-[#071A33]">
                            {commande.code_retrait}
                          </p>

                          <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500">
                            Présentez ce code au point de retrait pour récupérer
                            votre commande.
                          </p>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#FF7A1A] shadow-sm">
                          <MapPin size={21} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* PARCOURS CLIENT */}
              <div className="mt-8">
                <div className="relative">

                  {/* LIGNE DE PROGRESSION */}
                  <div className="pointer-events-none absolute left-5 top-8 bottom-8 hidden w-0.5 bg-slate-200 sm:block">
                    <div
                      className="w-full rounded-full bg-[#0052CC] transition-all duration-1000"
                      style={{
                        height: `${Math.max(
                          8,
                          Math.min(100, progressionLivraison * 100),
                        )}%`,
                      }}
                    />
                  </div>

                  {/* ARTICLES COMMANDÉS */}
                  <div className="relative flex gap-4 sm:gap-6">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0052CC] text-white shadow-lg shadow-[#0052CC]/20">
                      <Package size={17} />
                    </div>

                    <div className="min-w-0 flex-1 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_12px_35px_rgba(7,26,51,0.07)]">
                      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-5 py-5 sm:px-7 sm:py-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Étape 01
                        </p>
                        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="text-xl font-black text-[#071A33]">
                            Articles commandés
                          </h3>
                          <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black text-[#0052CC]">
                            {articles.length} article{articles.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {articles.length > 0 ? (
                        <div>
                          {articles.map((article, index) => (
                            <div
                              key={article.id || `${article.produit_id}-${index}`}
                              className="flex items-center gap-4 border-b border-slate-100 p-4 last:border-0 sm:p-5"
                            >
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                <Package size={18} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-black text-[#071A33]">
                                  {article.nom_produit || 'Article'}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                  Qté {article.quantite || 0}
                                  {article.origine ? ` · ${article.origine}` : ''}
                                </p>
                              </div>

                              <div className="shrink-0 text-right">
                                <p className="text-sm font-black text-[#071A33]">
                                  {formatPrix(article.total_ligne)}
                                </p>
                                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                                  {formatPrix(article.prix_unitaire)} / unité
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-sm font-semibold text-slate-500">
                          Aucun article disponible.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CONNECTEUR */}
                  <div className="ml-5 flex h-12 items-center sm:hidden">
                    <div className="h-full w-0.5 bg-[#0052CC]" />
                  </div>

                  {/* HISTORIQUE */}
                  <div className="relative mt-5 flex gap-4 sm:mt-7 sm:gap-6">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0052CC] text-white shadow-lg shadow-[#0052CC]/20">
                      <Clock3 size={17} />
                    </div>

                    <div className="min-w-0 flex-1 rounded-[26px] border border-slate-200 bg-white shadow-sm">
                      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Étape 02
                          </p>
                          <h3 className="mt-1 text-xl font-black text-[#071A33]">
                            Historique de la commande
                          </h3>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            Parcours de votre commande étape par étape
                          </p>
                        </div>

                        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-500">
                          {etapes.length} étape{etapes.length > 1 ? 's' : ''}
                        </span>
                      </div>

                        {etapes.length === 0 ? (
                          <div className="p-8 text-center">
                            <Clock3 size={28} className="mx-auto text-slate-300" />
                            <p className="mt-3 text-sm font-bold text-slate-500">
                              Aucun événement de suivi n’est encore disponible.
                            </p>
                          </div>
                        ) : (
                          <div className="px-5 py-6 sm:px-7 sm:py-7">
                            <div className="relative">
                              <div className="absolute bottom-6 left-[17px] top-6 w-px bg-slate-200" />

                              {etapesAffichage.map((etape, index) => {
                                const Icon = iconeEtape(etape.statut)
                                const statutCommande =
                                  String(commande?.statut || '').toLowerCase()
                                const statutLivraison =
                                  String(commande?.livraison_statut || '').toLowerCase()
                                const statutEtape =
                                  String(etape.statut || '').toLowerCase()

                                const estLivree =
                                  statutCommande === 'livree' ||
                                  statutLivraison === 'livree' ||
                                  statutEtape === 'livree'

                                const normaliserStatut = (valeur: string) =>
                                  valeur
                                    .toLowerCase()
                                    .normalize('NFD')
                                    .replace(/[\u0300-\u036f]/g, '')
                                    .replace(/[^a-z0-9_]/g, '_')

                                const statutActuel = normaliserStatut(
                                  statutLivraison !== 'non_planifiee'
                                    ? statutLivraison
                                    : statutCommande,
                                )

                                const statutEtapeNormalise =
                                  normaliserStatut(statutEtape)

                                const estEtapeFinale =
                                  statutEtapeNormalise === 'livree' ||
                                  (commande?.mode_reception === 'retrait' &&
                                    statutEtapeNormalise === 'retire')

                                const estSurCommande =
                                  String(commande?.type_parcours || '').toLowerCase() ===
                                  'sur_commande'

                                const estEtapeFuture =
                                  estSurCommande &&
                                  String(etape.id || '').startsWith('avenir-')

                                const ordreEtapes = estSurCommande
                                  ? [
                                      'acompte_requis',
                                      'paiement_recu',
                                      'acompte_confirme',
                                      'achat_fournisseur',
                                      'preparation_chine',
                                      'chargee',
                                      'partie_chine',
                                      'en_transit',
                                      'arrivee_cotonou',
                                      'solde_requis',
                                      'solde_confirme',
                                      'pret',
                                      'livraison_en_cours',
                                      'livree',
                                      'retire',
                                    ]
                                  : [
                                      'commande_recue',
                                      'reçue',
                                      'recue',
                                      'confirmee',
                                      'confirmation',
                                      'preparation',
                                      'pret',
                                      'livraison_planifiee',
                                      'en_route',
                                      'livraison_en_cours',
                                      'livreur_arrive',
                                      'livree',
                                    ]

                                const indexActuel =
                                  statutActuel === 'livree' ||
                                  (commande?.mode_reception === 'retrait' &&
                                    statutActuel === 'retire')
                                    ? ordreEtapes.length - 1
                                    : Math.max(
                                        0,
                                        ordreEtapes.findIndex(
                                          (statut) => statut === statutActuel,
                                        ),
                                      )

                                const indexEtape = ordreEtapes.findIndex(
                                  (statut) => statut === statutEtapeNormalise,
                                )

                                const positionEtape =
                                  indexEtape >= 0 ? indexEtape : index

                                const actuelle =
                                  !estLivree &&
                                  !estEtapeFinale &&
                                  positionEtape === indexActuel

                                const terminee =
                                  !estEtapeFuture &&
                                  (estLivree ||
                                    estEtapeFinale ||
                                    positionEtape < indexActuel)

                                const aVenir = !actuelle && !terminee

                                  return (
                                    <div
                                      key={
                                        etape.id ||
                                        `${etape.position}-${etape.statut}-${index}`
                                      }
                                      className="relative flex gap-4 sm:gap-5"
                                    >
                                      <div className="relative z-10 flex shrink-0 flex-col items-center">
                                        <div
                                          className={`flex h-10 w-10 items-center justify-center rounded-full border-4 border-white transition-all ${
                                            actuelle
                                              ? 'bg-[#0052CC] text-white shadow-lg shadow-[#0052CC]/25 ring-4 ring-[#0052CC]/10'
                                              : terminee
                                                ? 'bg-emerald-100 text-emerald-600 shadow-sm'
                                                : 'bg-slate-100 text-slate-400'
                                          }`}
                                        >
                                          {terminee && !actuelle ? (
                                            <span className="text-sm font-black">✓</span>
                                          ) : (
                                            <Icon size={16} />
                                          )}
                                        </div>

                                        {index < etapes.length - 1 && (
                                          <div
                                            className={`mt-1 min-h-[76px] w-px flex-1 ${
                                              terminee
                                                ? 'bg-emerald-200'
                                                : 'bg-slate-200'
                                            }`}
                                          />
                                        )}
                                      </div>

                                      <div
                                        className={`min-w-0 flex-1 pb-5 ${
                                          aVenir ? 'opacity-55' : ''
                                        }`}
                                      >
                                        <div
                                          className={`rounded-[22px] border px-4 py-4 transition-all sm:px-5 ${
                                            actuelle
                                              ? 'border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white shadow-[0_12px_32px_rgba(0,82,204,0.10)]'
                                              : terminee
                                                ? 'border-slate-100 bg-white shadow-sm'
                                                : 'border-slate-100 bg-slate-50/60'
                                          }`}
                                        >
                                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0">
                                              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                                {actuelle && (
                                                  <span className="rounded-full bg-[#0052CC] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white shadow-sm">
                                                    En cours
                                                  </span>
                                                )}

                                                {terminee && !actuelle && (
                                                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-600">
                                                    ✓ Terminé
                                                  </span>
                                                )}
                                              </div>

                                              <p
                                                className={`text-sm font-black tracking-tight sm:text-[15px] ${
                                                  actuelle
                                                    ? 'text-[#071A33]'
                                                    : terminee
                                                      ? 'text-slate-700'
                                                      : 'text-slate-500'
                                                }`}
                                              >
                                                {etape.titre ||
                                                  libelleStatut(etape.statut)}
                                              </p>

                                              {etape.description && (
                                                <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-500">
                                                  {etape.description}
                                                </p>
                                              )}
                                            </div>

                                            {(etape.date_etape || etape.created_at) && (
                                              <span
                                                className={`shrink-0 text-[10px] font-bold ${
                                                  actuelle
                                                    ? 'text-[#0052CC]'
                                                    : 'text-slate-400'
                                                }`}
                                              >
                                                {formatDate(
                                                  etape.date_etape ||
                                                    etape.created_at,
                                                )}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                              })}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>


                </div>
              </div>

              {estSurCommande && transportPrincipal && (
                <>
                  {/* TRAJET CHINE → COTONOU */}
                  <div className="ml-5 flex h-12 items-center sm:hidden">
                    <div className="h-full w-0.5 bg-[#0052CC]" />
                  </div>

                  <div className="relative mt-4 flex gap-4 sm:mt-6 sm:gap-6">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0052CC] text-white shadow-lg shadow-[#0052CC]/20">
                      <span className="text-lg">
                        {transportType === 'avion' ? '✈️' : '🚢'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_12px_35px_rgba(7,26,51,0.07)]">
                      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-5 py-5 sm:px-7 sm:py-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Étape 03
                        </p>
                        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="text-xl font-black text-[#071A33]">
                            Trajet Chine → Cotonou
                          </h3>
                          <span
                            className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-black ${
                              transportTermine
                                ? 'bg-emerald-50 text-emerald-600'
                                : transportEnRetard
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-blue-50 text-[#0052CC]'
                            }`}
                          >
                            {transportTermine
                              ? 'Arrivé à Cotonou'
                              : transportEnRetard
                                ? 'Arrivée en retard'
                                : 'En transit'}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 sm:p-7">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-black text-[#071A33]">
                            🇨🇳 Chine
                          </span>

                          <span className="text-lg">
                            {transportType === 'avion' ? '✈️' : '🚢'}
                          </span>

                          <span className="text-sm font-black text-[#071A33]">
                            🇧🇯 Cotonou
                          </span>
                        </div>

                        <div className="relative mt-5 h-3 rounded-full bg-slate-100">
                          <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                            <div
                              className="h-1 rounded-full bg-[#0052CC] transition-all duration-1000"
                              style={{
                                width: `${Math.max(
                                  3,
                                  transportProgression * 100,
                                )}%`,
                              }}
                            />
                          </div>

                          <div
                            className="absolute top-1/2 flex h-9 w-9 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-[#0052CC] text-sm shadow-lg transition-all duration-1000"
                            style={{
                              left: `${Math.max(
                                3,
                                Math.min(97, transportProgression * 100),
                              )}%`,
                            }}
                          >
                            {transportType === 'avion' ? '✈️' : '🚢'}
                          </div>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                              Départ réel
                            </p>
                            <p className="mt-1 text-xs font-black text-[#071A33]">
                              {transportDepartReel
                                ? formatDate(
                                    new Date(
                                      transportDepartReel,
                                    ).toISOString(),
                                  )
                                : 'En attente du départ'}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                              {transportTermine
                                ? 'Arrivée réelle'
                                : 'Arrivée prévue'}
                            </p>
                            <p className="mt-1 text-xs font-black text-[#071A33]">
                              {transportTermine
                                ? formatDate(
                                    new Date(
                                      transportArriveeReelle!,
                                    ).toISOString(),
                                  )
                                : transportArriveePrevue
                                  ? formatDate(
                                      new Date(
                                        transportArriveePrevue,
                                      ).toISOString(),
                                    )
                                  : 'Date à confirmer'}
                            </p>
                          </div>
                        </div>

                        {transportEnRetard && (
                          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-xs font-black text-amber-800">
                              Le transport est toujours en transit.
                            </p>
                            <p className="mt-1 text-[11px] font-semibold leading-5 text-amber-700">
                              L'arrivée prévue est dépassée. L'arrivée réelle sera confirmée manuellement par notre équipe.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {commande.mode_reception === 'livraison' && (
                  <>
                  {/* CONNECTEUR */}
                  <div className="ml-5 flex h-12 items-center sm:hidden">
                    <div className="h-full w-0.5 bg-[#0052CC]" />
                  </div>

                  {/* LIVRAISON */}
                  <div className="relative mt-4 flex gap-4 sm:mt-6 sm:gap-6">
                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-lg ${
                        livraisonStatut === 'en_route' ||
                        livraisonStatut === 'livree'
                          ? 'bg-[#0052CC] shadow-[#0052CC]/20'
                          : 'bg-slate-300 shadow-slate-200'
                      }`}
                    >
                      <Truck size={17} />
                    </div>

                    <div className="min-w-0 flex-1 rounded-[26px] border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Étape 03
                        </p>
                        <h3 className="mt-1 text-xl font-black text-[#071A33]">
                          Livraison
                        </h3>
                      </div>

                      {commande.mode_reception === 'livraison' ? (
                        <div className="p-5 sm:p-6">
                          {commande.livreur_telephone ? (
                            <>
                              <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(7,26,51,0.07)]">
                                <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-5 sm:px-6">
                                  <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0052CC] text-white shadow-lg shadow-blue-900/15">
                                      <Truck size={23} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                          Votre livreur
                                        </p>
                                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#0052CC]">
                                          En acheminement
                                        </span>
                                      </div>

                                      <p className="mt-1 text-xl font-black tracking-tight text-[#071A33]">
                                        {commande.livreur_nom || 'Livreur'}
                                      </p>

                                      <p className="mt-1 text-sm font-bold tracking-wide text-slate-500">
                                        {formatTelephone(commande.livreur_telephone)}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-5 sm:p-6">
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <a
                                      href={`https://wa.me/229${String(
                                        commande.livreur_telephone,
                                      ).replace(/\D/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-xs font-black !text-white shadow-md shadow-green-900/10 transition hover:bg-[#1ebe5d] active:scale-[0.98]"
                                    >
                                      WhatsApp
                                    </a>

                                    <a
                                      href={`tel:+229${String(
                                        commande.livreur_telephone,
                                      ).replace(/\D/g, '')}`}
                                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#D92D20] px-5 text-xs font-black !text-white shadow-md shadow-red-900/10 transition hover:bg-[#B42318] active:scale-[0.98]"
                                    >
                                      <Phone size={17} className="!text-white" />
                                      Appeler le livreur
                                    </a>
                                  </div>

                                  <div className="mt-5 flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-4">
                                    <div className="mt-0.5 shrink-0 text-[#0052CC]">
                                      <Truck size={18} />
                                    </div>
                                    <p className="text-sm font-semibold leading-6 text-blue-900">
                                      Votre colis a été remis au livreur et est actuellement
                                      en cours d’acheminement.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="rounded-2xl bg-slate-50 p-5">
                              <p className="text-sm font-black text-[#071A33]">
                                Livraison en préparation
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                Les informations du livreur seront affichées lorsque
                                votre colis lui sera remis.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-5 sm:p-6">
                          <div className="rounded-2xl bg-orange-50 p-5">
                            <div className="flex items-center gap-3">
                              <MapPin size={20} className="text-[#FF7A1A]" />
                              <p className="text-sm font-black text-[#071A33]">
                                Retrait de la commande
                              </p>
                            </div>
                            <p className="mt-3 text-xs leading-5 text-slate-500">
                              Votre commande sera disponible au point de retrait
                              lorsqu’elle sera prête.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CONNECTEUR */}
                  <div className="ml-5 flex h-12 items-center sm:hidden">
                    <div className="h-full w-0.5 bg-[#0052CC]" />
                  </div>

                    {/* ACHEMINEMENT */}
                    <div className="relative mt-5 flex gap-4 sm:mt-7 sm:gap-6">
                      <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FF7A1A] text-white shadow-lg shadow-orange-500/20">
                        <MapPin size={18} strokeWidth={2.4} />
                      </div>

                      <div className="min-w-0 flex-1 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_14px_45px_rgba(7,26,51,0.08)]">
                        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-5 sm:px-7 sm:py-6">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-[#0052CC]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#0052CC]">
                                  Étape 04
                                </span>
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                  Suivi logistique
                                </span>
                              </div>

                              <h3 className="mt-3 text-[21px] font-black tracking-tight text-[#071A33] sm:text-2xl">
                                Acheminement
                              </h3>

                              <p className="mt-1 text-xs font-medium text-slate-500">
                                Progression de votre colis
                              </p>
                            </div>

                            <div className="shrink-0 rounded-2xl bg-[#071A33] px-3 py-2 text-right text-white">
                              <p className="text-[8px] font-bold uppercase tracking-wider text-white/50">
                                Statut
                              </p>
                              <p className="mt-0.5 max-w-[105px] truncate text-xs font-black">
                                {libelleStatut(statutAffiche)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 sm:p-7">
                          {commande.mode_reception === 'livraison' ? (
                            <>
                              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                                <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0052CC]/10 text-[#0052CC]">
                                      <Package size={19} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                                        Départ
                                      </p>
                                      <p className="mt-1.5 truncate text-sm font-black text-[#071A33]">
                                        {commande.point_depart || 'ChinaShop-Bénin'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="hidden items-center justify-center sm:flex">
                                  <div className="flex items-center">
                                    <div className="h-px w-5 bg-slate-200" />
                                    <div className="mx-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-[#0052CC]/15 bg-[#0052CC]/5 text-[#0052CC]">
                                      <Truck size={15} />
                                    </div>
                                    <div className="h-px w-5 bg-slate-200" />
                                  </div>
                                </div>

                                <div className="rounded-[22px] border border-orange-100 bg-[#FFF9F4] p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF7A1A]/10 text-[#FF7A1A]">
                                      <MapPin size={19} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#FF7A1A]">
                                        Destination
                                      </p>
                                      <p className="mt-1.5 line-clamp-2 text-sm font-black leading-5 text-[#071A33]">
                                        {commande.point_destination ||
                                          commande.adresse_livraison ||
                                          'Adresse de livraison'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-5 rounded-[22px] border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                                <div className="flex items-end justify-between gap-4">
                                  <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.17em] text-slate-400">
                                      Progression
                                    </p>
                                    <p className="mt-1.5 text-base font-black tracking-tight text-[#071A33]">
                                      {libelleStatut(statutAffiche)}
                                    </p>
                                  </div>

                                </div>

                                <div
                                  className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200/70"
                                  aria-label="Acheminement en temps réel"
                                >
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#0052CC] via-[#1769E0] to-[#FF7A1A] shadow-sm transition-[width] duration-1000 ease-linear"
                                    style={{
                                      width: `${Math.max(
                                        0,
                                        Math.min(100, progressionLivraison * 100),
                                      )}%`,
                                    }}
                                  />
                                </div>

                                <div className="mt-3 grid grid-cols-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
                                  <span className="flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#0052CC]" />
                                    Départ
                                  </span>
                                  <span className="text-center">En transit</span>
                                  <span className="flex items-center justify-end gap-1.5">
                                    Destination
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
                                  </span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="rounded-[22px] border border-orange-100 bg-[#FFF9F4] p-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF7A1A]/10 text-[#FF7A1A]">
                                  <MapPin size={20} />
                                </div>
                                <div>
                                  <p className="text-sm font-black text-[#071A33]">
                                    Retrait en point de retrait
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-slate-500">
                                    La commande progresse vers sa mise à disposition.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </>
                )}

              {/* RÉCEPTION + MONTANT */}
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Réception
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        commande.mode_reception === 'livraison'
                          ? 'bg-[#0052CC]/10 text-[#0052CC]'
                          : 'bg-[#FF7A1A]/10 text-[#FF7A1A]'
                      }`}
                    >
                      {commande.mode_reception === 'livraison' ? (
                        <Truck size={20} />
                      ) : (
                        <MapPin size={20} />
                      )}
                    </div>
                    <p className="text-sm font-black text-[#071A33]">
                      {reception.titre}
                    </p>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-slate-500">
                    {reception.description}
                  </p>

                  {commande.mode_reception === 'livraison' &&
                    commande.adresse_livraison && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Adresse
                        </p>
                        <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
                          {commande.adresse_livraison}
                        </p>
                      </div>
                    )}
                </div>

                {commande.total !== undefined && (
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Montant de la commande
                    </p>

                    <p className="mt-2 text-3xl font-black tracking-tight text-[#071A33]">
                      {formatPrix(commande.total)}
                    </p>

                    {acompteRequis > 0 && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-500">
                          Acompte payé
                        </p>
                        <p className="mt-1 text-sm font-black text-[#0052CC]">
                          {formatPrix(acomptePaye)}
                          <span className="font-semibold text-slate-400">
                            {' '} / {formatPrix(acompteRequis)}
                          </span>
                        </p>
                      </div>
                    )}

                    {statut === 'solde_requis' && soldeRestant > 0 && (
                      <div className="mt-4 rounded-xl border border-orange-100 bg-[#FFF9F4] p-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#FF7A1A]">
                          Solde restant à payer
                        </p>
                        <p className="mt-1 text-2xl font-black tracking-tight text-[#071A33]">
                          {formatPrix(soldeRestant)}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          Frais de livraison exclus.
                        </p>
                      </div>
                    )}

                    {(user?.id || paiementAccesToken) && statut === 'solde_requis' && soldeRestant > 0 && (
                      <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Paiement du solde
                          </p>
                          <p className="mt-1 text-sm font-black text-[#071A33]">
                            Choisissez votre moyen de paiement
                          </p>
                        </div>

                        {moyensPaiementSolde.length > 0 ? (
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {moyensPaiementSolde.map((moyen: any) => {
                              const selectionne = moyen.code === providerSolde

                              return (
                                <button
                                  key={moyen.id || moyen.code}
                                  type="button"
                                  onClick={() => {
                                    setProviderSolde(moyen.code)
                                    setErreurPaiementSolde('')
                                    setMessagePaiementSolde('')
                                  }}
                                  className={`rounded-2xl border p-4 text-left transition ${
                                    selectionne
                                      ? 'border-[#0052CC] bg-white shadow-sm ring-2 ring-[#0052CC]/10'
                                      : 'border-slate-200 bg-white hover:border-slate-300'
                                  }`}
                                >
                                  <p className="text-sm font-black text-[#071A33]">
                                    {moyen.nom || moyen.code}
                                  </p>
                                  <p className="mt-1 text-xs font-bold text-[#0052CC]">
                                    {moyen.numero}
                                  </p>
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="mt-4 rounded-xl bg-white p-3 text-xs font-semibold text-slate-500">
                            Aucun moyen de paiement Mobile Money n'est actuellement disponible.
                          </p>
                        )}

                        {moyensPaiementSolde.length > 0 && (
                          <>
                            {(() => {
                              const moyenSelectionne = moyensPaiementSolde.find(
                                (moyen: any) => moyen.code === providerSolde,
                              )

                              return (
                                <div className="mt-4 rounded-2xl border border-[#0052CC]/10 bg-white p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                        Montant à transférer
                                      </p>
                                      <p className="mt-1 text-2xl font-black text-[#071A33]">
                                        {formatPrix(soldeRestant)}
                                      </p>
                                    </div>

                                    <div className="text-right">
                                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                        Numéro
                                      </p>
                                      <p className="mt-1 text-sm font-black text-[#0052CC]">
                                        {moyenSelectionne?.numero || '—'}
                                      </p>
                                    </div>
                                  </div>

                                  {moyenSelectionne?.instructions && (
                                    <p className="mt-3 text-xs font-medium leading-5 text-slate-500">
                                      {moyenSelectionne.instructions}
                                    </p>
                                  )}
                                </div>
                              )
                            })()}

                            <div className="mt-4">
                              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Votre numéro Mobile Money
                              </label>
                              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3">
                                <Phone size={17} className="shrink-0 text-slate-400" />
                                <input
                                  type="tel"
                                  inputMode="numeric"
                                  value={telephoneSolde}
                                  onChange={(e) =>
                                    setTelephoneSolde(
                                      e.target.value.replace(/\D/g, '').slice(0, 10),
                                    )
                                  }
                                  placeholder="01XXXXXXXX"
                                  className="w-full bg-transparent py-3 text-sm font-bold text-[#071A33] outline-none"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={initialiserPaiementDuSolde}
                              disabled={chargementPaiementSolde}
                              className="mt-4 w-full rounded-2xl bg-[#D92D20] px-5 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-[#B42318] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {chargementPaiementSolde
                                ? 'Initialisation…'
                                : 'Initialiser le paiement du solde'}
                            </button>

                            {erreurPaiementSolde && (
                              <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600">
                                {erreurPaiementSolde}
                              </p>
                            )}

                            {messagePaiementSolde && (
                              <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                                {messagePaiementSolde}
                              </p>
                            )}

                            {commande.paiement_type === 'solde' &&
                              commande.paiement?.reference_paiement && (
                                <div className="mt-4 rounded-2xl border border-orange-100 bg-[#FFF9F4] p-4">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-[#FF7A1A]">
                                    Référence de paiement
                                  </p>
                                  <p className="mt-1 text-lg font-black tracking-wider text-[#071A33]">
                                    {commande.paiement.reference_paiement}
                                  </p>
                                  <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                                    Effectuez le transfert du montant exact, puis envoyez votre preuve de paiement à l'étape suivante.
                                  </p>
                                </div>
                              )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
        </section>
      )}
    </main>
  )
}
