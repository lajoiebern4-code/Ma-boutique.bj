import { supabase } from "../lib/supabase"
export { supabase } from "../lib/supabase"
export function isSupabaseConfigured() {
  return !!supabase;
}

type ProduitAdminInput = {
  nom?: string
  description?: string
  prix?: string | number
  prixOriginal?: string | number | null
  categorie?: string | null
  sousCategorie?: string | null
  genre?: string | null
  stock?: string | number
  disponibilite?: 'stock' | 'sur_commande' | string
  poidsKg?: string | number | null
  volumeCbm?: string | number | null
  promo?: string | number
  nouveau?: boolean
  dateAjout?: string | null
  promoFin?: string | null
  produitSourceId?: string | null
  image?: string | null
}


export async function listerPaiementsAdmin() {
  if (!supabase) {
    throw new Error('Supabase non configuré')
  }

  const { data, error } = await supabase.rpc('cs_lister_paiements_admin')

  if (error) throw error

  return data || []
}

export async function obtenirPaiementAdmin(paiementId: string) {
  if (!supabase) {
    throw new Error('Supabase non configuré')
  }

  const { data, error } = await supabase.rpc('cs_obtenir_paiement_admin', {
    p_paiement_id: paiementId,
  })

  if (error) throw error

  return data
}

export async function validerPaiementAdmin(paiementId: string) {
  if (!supabase) {
    throw new Error('Supabase non configuré')
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession()

  if (sessionError) throw sessionError

  const adminId = sessionData.session?.user?.id

  if (!adminId) {
    throw new Error('Session administrateur introuvable')
  }

  const { data, error } = await supabase.rpc('cs_valider_paiement', {
    p_paiement_id: paiementId,
    p_admin_id: adminId,
  })

  if (error) {
    console.error('cs_valider_paiement erreur brute:', error)

    const details = [
      error.message,
      error.code ? `code=${error.code}` : '',
      error.details ? `details=${error.details}` : '',
      error.hint ? `hint=${error.hint}` : '',
    ].filter(Boolean).join(' | ')

    throw new Error(
      details || 'Erreur Supabase lors de la validation du paiement.',
    )
  }

  return data
}

export async function refuserPaiementAdmin(
  paiementId: string,
  motif: string,
) {
  if (!supabase) {
    throw new Error('Supabase non configuré')
  }

  const motifNettoye = motif.trim()

  if (motifNettoye.length < 3) {
    throw new Error('Le motif du refus est obligatoire.')
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession()

  if (sessionError) throw sessionError

  const adminId = sessionData.session?.user?.id

  if (!adminId) {
    throw new Error('Session administrateur introuvable')
  }

  const { data, error } = await supabase.rpc('cs_refuser_paiement', {
    p_paiement_id: paiementId,
    p_admin_id: adminId,
    p_motif: motifNettoye,
  })

  if (error) throw error

  return data
}

export async function recupererMoyensPaiementAdmin() {
  if (!supabase) {
    throw new Error('Supabase non configuré')
  }

  const { data, error } = await supabase
    .from('cs_moyens_paiement')
    .select(
      'id, code, nom, numero, actif, instructions, position, updated_at',
    )
    .order('position', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

export async function modifierMoyenPaiementAdmin(
  code: string,
  numero: string | null,
  actif: boolean,
  instructions: string | null,
  position: number,
) {
  if (!supabase) {
    throw new Error('Supabase non configuré')
  }

  const { data, error } = await supabase.rpc(
    'cs_modifier_moyen_paiement_admin',
    {
      p_code: code.trim().toLowerCase(),
      p_numero: numero?.trim() || null,
      p_actif: actif,
      p_instructions: instructions?.trim() || null,
      p_position: position,
    },
  )

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error(
      'Aucune réponse reçue lors de la mise à jour du moyen de paiement.',
    )
  }

  return data
}

export async function recupererMoyensPaiementActifs() {
  const { data, error } = await supabase
    .from('cs_moyens_paiement')
    .select('id, code, nom, numero, instructions, position')
    .eq('actif', true)
    .not('numero', 'is', null)
    .order('position', { ascending: true })

  if (error) {
    throw error
  }

  return (data || []).filter(
    (moyen) => typeof moyen.numero === 'string' && /^01\d{8}$/.test(moyen.numero),
  )
}


export async function initierPaiementAcompteInvite(
  numeroCommande: string,
  paiementAccesToken: string,
  provider: string,
) {
  const { data, error } = await supabase.rpc(
    'cs_initier_paiement_acompte_invite',
    {
      p_numero_commande: numeroCommande.trim(),
      p_paiement_acces_token: paiementAccesToken.trim(),
      p_provider: provider.trim(),
    },
  )

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error(
      'Aucune réponse reçue lors de l’initialisation du paiement.',
    )
  }

  return data
}


export async function initierPaiementSoldeInvite(
  numeroCommande: string,
  paiementAccesToken: string,
  provider: string,
) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_initier_paiement_solde_invite',
      {
        p_numero_commande: numeroCommande,
        p_paiement_acces_token: paiementAccesToken,
        p_provider: provider,
      },
    )

    if (error) throw error

    return data
  } catch (err) {
    console.error('Erreur initialisation paiement solde invité:', err)

    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Impossible d’initialiser le paiement du solde.',
    }
  }
}

export async function initierPaiementSolde(
  numeroCommande: string,
  telephone: string,
  provider: string,
) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_initier_paiement_solde',
      {
        p_numero_commande: numeroCommande,
        p_telephone: telephone,
        p_provider: provider,
      },
    )

    if (error) throw error

    return data
  } catch (err) {
    console.error('Erreur initialisation paiement solde:', err)

    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Impossible d’initialiser le paiement du solde.',
    }
  }
}

export async function envoyerPreuvePaiementConnecte(
  numeroCommande: string,
  paiementId: string,
  fichier: File,
) {
  if (!supabase) {
    throw new Error('Supabase non configuré')
  }

  if (!(fichier instanceof File)) {
    throw new Error('Fichier de preuve invalide.')
  }

  if (fichier.size <= 0 || fichier.size > 5 * 1024 * 1024) {
    throw new Error('La preuve doit faire au maximum 5 Mo.')
  }

  const formatsAcceptes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ]

  if (!formatsAcceptes.includes(fichier.type)) {
    throw new Error('Format accepté : JPG, PNG ou WebP.')
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) {
    throw new Error('Votre session client est requise pour envoyer la preuve.')
  }

  const formData = new FormData()
  formData.append('numero_commande', numeroCommande.trim())
  formData.append('paiement_id', paiementId.trim())
  formData.append('file', fichier)

  const { data, error } = await supabase.functions.invoke(
    'upload-payment-proof',
    {
      body: formData,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (error) {
    throw error
  }

  if (!data?.success) {
    throw new Error(
      data?.error || 'Impossible d’envoyer la preuve de paiement.',
    )
  }

  return data
}

export async function sauvegarderCommandeV2(
  commande: {
    articles: Array<{
      id: string
      qte?: number
      variante_id?: string | null
      variante_nom?: string | null
    }>
    nomClient?: string
    telephone?: string
    email?: string | null
    telephonePaiement?: string
    modeReception?: string
    modePaiement?: string
    zoneLivraisonId?: string | null
    zoneLivraisonCode?: string | null
    departementLivraison?: string | null
    communeLivraison?: string | null
    quartierLivraison?: string | null
    rueLivraison?: string | null
    repereLivraison?: string | null
    adresseLivraison?: string | null
    acomptePaye?: number
  },
) {
  if (!supabase) {
    console.warn('Supabase non configuré')
    return {
      success: false,
      error: 'Supabase non configuré',
    }
  }

  try {
    if (
      !commande ||
      !Array.isArray(commande.articles) ||
      commande.articles.length === 0
    ) {
      throw new Error('La commande ne contient aucun article.')
    }

    if (!commande.nomClient?.trim()) {
      throw new Error('Le nom du client est obligatoire.')
    }

    if (!commande.telephone?.trim()) {
      throw new Error('Le numéro de téléphone est obligatoire.')
    }

    if (!commande.modeReception) {
      throw new Error('Le mode de réception est obligatoire.')
    }

    if (!commande.modePaiement) {
      throw new Error('Le mode de paiement est obligatoire.')
    }

    if (commande.modeReception === 'livraison') {
      if (!commande.departementLivraison?.trim()) {
        throw new Error('Le département de livraison est obligatoire.')
      }
      if (!commande.communeLivraison?.trim()) {
        throw new Error('La commune de livraison est obligatoire.')
      }
      if (!commande.quartierLivraison?.trim()) {
        throw new Error('Le quartier de livraison est obligatoire.')
      }
      if (!commande.rueLivraison?.trim()) {
        throw new Error('La rue ou l’adresse précise est obligatoire.')
      }
    }

    const lignesRpc = commande.articles.map(
      (article: {
        id: string
        qte?: number
        variante_id?: string | null
        variante_nom?: string | null
      }) => ({
        produit_id: article.id,
        quantite: Number(article.qte || 1),
        variante_id: article.variante_id || null,
        variante_nom: article.variante_nom || null,
      }),
    )

    const paiementRpc = commande.modePaiement

    const zoneCode = null

    const adresseLivraisonRpc =
      commande.modeReception === 'livraison'
        ? [
            commande.departementLivraison?.trim(),
            commande.communeLivraison?.trim(),
            commande.quartierLivraison?.trim(),
            commande.rueLivraison?.trim(),
            commande.repereLivraison?.trim(),
          ]
            .filter(Boolean)
            .join(', ') || null
        : null

    const { data, error } = await supabase.rpc('cs_creer_commande_avec_acces_paiement', {
      p_nom_client: commande.nomClient.trim(),
      p_telephone: commande.telephone.trim(),
      p_email_client: commande.email?.trim() || null,
      p_mode_reception: commande.modeReception,
      p_mode_paiement: paiementRpc,
      p_adresse_livraison: adresseLivraisonRpc,
      p_zone_code: zoneCode,
      p_lignes: lignesRpc,
      p_acompte_paye: commande.acomptePaye || 0,
      p_departement_livraison:
        commande.modeReception === 'livraison'
          ? commande.departementLivraison?.trim() || null
          : null,
      p_commune_livraison:
        commande.modeReception === 'livraison'
          ? commande.communeLivraison?.trim() || null
          : null,
      p_quartier_livraison:
        commande.modeReception === 'livraison'
          ? commande.quartierLivraison?.trim() || null
          : null,
      p_rue_livraison:
        commande.modeReception === 'livraison'
          ? commande.rueLivraison?.trim() || null
          : null,
      p_repere_livraison:
        commande.modeReception === 'livraison'
          ? commande.repereLivraison?.trim() || null
          : null,
    })

    if (error) throw error

    if (!data) {
      throw new Error('Supabase n’a retourné aucune commande.')
    }

    const calcul = data.calcul || {}
    console.log('DEBUG CALCUL COMMANDE:', calcul)
    console.log('DEBUG ACCOMPTE REQUIS:', calcul.acompte_requis)

    return {
      success: true,
      data,
      commandeId: data.commande_id || '',
      numeroCommande: data.numero || '',
      codeSuivi: data.code_suivi || '',
      codeRetrait: commande.modeReception === 'retrait' ? (data.code_suivi || '') : '',
      paiementAccesToken: data.paiement_acces_token || '',
      sousTotal: Number(calcul.sous_total) || 0,
      reduction: Number(calcul.reduction) || 0,
      fraisLivraison: Number(calcul.frais_livraison) || 0,
      total: Number(calcul.total) || 0,
      totalStock: Number(calcul.total_stock) || 0,
      totalSurCommande: Number(calcul.total_sur_commande) || 0,
      acompteRequis: Number(calcul.acompte_requis) || 0,
      acomptePaye: Number(commande.acomptePaye || 0),
      typeCommande: calcul.type_commande || '',
      statut: data.statut || '',
    }
  } catch (err) {
    const erreur = err as {
      message?: string
      details?: string
      hint?: string
      code?: string
    }

    console.error('Erreur création commande V2:', err)
    console.error('Détail erreur création commande V2:', {
      message: erreur?.message,
      details: erreur?.details,
      hint: erreur?.hint,
      code: erreur?.code,
    })

    return {
      success: false,
      error:
        erreur?.message ||
        erreur?.details ||
        erreur?.hint ||
        'Impossible de créer la commande.',
    }
  }
}

export async function lierCommandesAuCompte() {
  if (!supabase) {
    return {
      success: false,
      count: 0,
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_lier_commandes_au_compte',
    )

    if (error) throw error

    return {
      success: true,
      count: typeof data === 'number' ? data : 0,
    }
  } catch (err) {
    console.error('Erreur liaison commandes au compte:', err)

    return {
      success: false,
      count: 0,
      error:
        err instanceof Error
          ? err.message
          : 'Erreur lors de la récupération de vos commandes',
    }
  }
}

export async function recupererMesCommandes() {
  if (!supabase) {
    return {
      success: false,
      data: [],
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_recuperer_mes_commandes',
    )

    if (error) throw error

    console.log('DEBUG cs_recuperer_mes_commandes:', data)
    console.log('DEBUG Array.isArray(data):', Array.isArray(data))
    console.log('DEBUG type data:', typeof data)

    return {
      success: true,
      data: Array.isArray(data) ? data : [],
    }
  } catch (err) {
    console.error('Erreur récupération commandes client:', err)

    return {
      success: false,
      data: [],
      error:
        err instanceof Error
          ? err.message
          : 'Erreur récupération de vos commandes',
    }
  }
}

// ===============================
// COMMANDES ADMIN V2
// ===============================

export async function recupererCommandesAdminV2() {
  if (!supabase) {
    return {
      success: false,
      data: [],
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_recuperer_commandes_admin'
    )

    if (error) throw error

    return {
      success: true,
      data: data || [],
    }
  } catch (err) {
    console.error('Erreur récupération commandes Admin V2:', err)

    return {
      success: false,
      data: [],
      error:
          err instanceof Error
            ? err.message
            : 'Erreur récupération commandes', 
    }
  }
}


export async function recupererCommandesAdminDetaillees() {
  if (!supabase) {
    return {
      success: false,
      data: [],
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_recuperer_commandes_admin_detaillees',
    )

    if (error) throw error

    return {
      success: true,
      data: data || [],
    }
  } catch (err) {
    console.error('Erreur récupération commandes détaillées:', err)

    return {
      success: false,
      data: [],
      error:
          err instanceof Error
            ? err.message
            : 'Erreur récupération commandes détaillées',
    }
  }
}

export async function recupererTransportsChineAdmin() {
  if (!supabase) {
    return {
      success: false,
      data: [],
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_recuperer_transports_chine_admin',
    )

    if (error) throw error

    return {
      success: true,
      data: data || [],
    }
  } catch (err) {
    console.error('Erreur récupération transports Chine Admin:', err)

    return {
      success: false,
      data: [],
      error:
        err instanceof Error
          ? err.message
          : 'Erreur récupération transports Chine',
    }
  }
}

export async function recupererTrajetsLivraisonAdmin() {
  if (!supabase) {
    return {
      success: false,
      data: [],
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase
      .from('cs_livraison_trajets')
      .select('*')

    if (error) throw error

    return {
      success: true,
      data: data || [],
    }
  } catch (err) {
    console.error('Erreur récupération trajets livraison Admin:', err)

    return {
      success: false,
      data: [],
      error:
          err instanceof Error
            ? err.message
            : 'Erreur récupération trajets',
    }
  }
}

// ===============================
// STATUT COMMANDES ADMIN V2
// ===============================

export async function mettreAJourStatutCommandeV2(
  numeroCommande: string,
  statut: string,
  codeRetrait: string | null = null,
) {
  if (!supabase) {
    throw new Error('Supabase non configuré')
  }

  const { data, error } = await supabase.rpc(
    'cs_mettre_a_jour_statut_commande_v2',
    {
      p_numero_commande: numeroCommande,
      p_statut: statut,
      p_code_retrait: codeRetrait,
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  if (!data?.success) {
    throw new Error(
      data?.error || 'Le statut de la commande n’a pas été mis à jour.',
    )
  }

  return data
}

// ===============================
// CRUD PRODUITS
// ===============================

export type ProduitVariante = {
  id: string
  produit_id: string
  nom: string
  stock: number
  position: number
  created_at: string
  updated_at: string
}

export async function recupererVariantesProduit(produitId: string) {
  if (!supabase) {
    return { success: false, data: [], error: 'Supabase non configuré' }
  }

  const { data, error } = await supabase
    .from('cs_produit_variantes')
    .select('id, produit_id, nom, stock, position, created_at, updated_at')
    .eq('produit_id', produitId)
    .order('position', { ascending: true })

  if (error) {
    console.error('Erreur récupération variantes:', error)
    return { success: false, data: [], error: error.message }
  }

  return {
    success: true,
    data: (data || []) as ProduitVariante[],
    error: '',
  }
}

export async function ajouterVarianteProduit(
  produitId: string,
  nom: string,
  stock: number = 0,
  position?: number,
) {
  if (!supabase) {
    return { success: false, data: null, error: 'Supabase non configuré' }
  }

  const { data, error } = await supabase.rpc(
    'cs_ajouter_variante_produit_admin',
    {
      p_produit_id: produitId,
      p_nom: nom,
      p_stock: stock,
      p_position: position ?? null,
    },
  )

  if (error) {
    console.error('Erreur ajout variante:', error)
    return { success: false, data: null, error: error.message }
  }

  return { success: true, data, error: '' }
}

export async function modifierVarianteProduit(
  varianteId: string,
  nom: string,
  stock: number,
  position: number,
) {
  if (!supabase) {
    return { success: false, data: null, error: 'Supabase non configuré' }
  }

  const { data, error } = await supabase.rpc(
    'cs_modifier_variante_produit_admin',
    {
      p_variante_id: varianteId,
      p_nom: nom,
      p_stock: stock,
      p_position: position,
    },
  )

  if (error) {
    console.error('Erreur modification variante:', error)
    return { success: false, data: null, error: error.message }
  }

  return { success: true, data, error: '' }
}

export async function supprimerVarianteProduit(varianteId: string) {
  if (!supabase) {
    return { success: false, data: null, error: 'Supabase non configuré' }
  }

  const { data, error } = await supabase.rpc(
    'cs_supprimer_variante_produit_admin',
    {
      p_variante_id: varianteId,
    },
  )

  if (error) {
    console.error('Erreur suppression variante:', error)
    return { success: false, data: null, error: error.message }
  }

  return { success: true, data, error: '' }
}

export async function reordonnerVariantesProduit(
  produitId: string,
  varianteIds: string[],
) {
  if (!supabase) {
    return { success: false, data: null, error: 'Supabase non configuré' }
  }

  const { data, error } = await supabase.rpc(
    'cs_reordonner_variantes_produit_admin',
    {
      p_produit_id: produitId,
      p_variante_ids: varianteIds,
    },
  )

  if (error) {
    console.error('Erreur réordonnancement variantes:', error)
    return { success: false, data: null, error: error.message }
  }

  return { success: true, data, error: '' }
}

export async function recupererProduits() {
  if (!supabase) {
    console.warn("Supabase non configuré");
    return { success: false, data: [], error: "Supabase non configuré" };
  }

  try {
    const { data, error } = await supabase
      .from("cs_produits")
      .select(`
        id,
        produit_source_id,
        nom,
        prix,
        stock,
        disponibilite,
        poids_kg,
        volume_cbm,
        actif,
        created_at,
        updated_at,
        cs_produit_details (
          description,
          image_url,
          prix_original,
          categorie,
          sous_categorie,
          genre,
          promo,
          nouveau,
          date_ajout,
          promo_fin
        )
      `)
      .eq("actif", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const produits = (data || []).map((p) => {
      const d = Array.isArray(p.cs_produit_details)
        ? p.cs_produit_details[0]
        : p.cs_produit_details;

      return {
        id: p.id,
        nom: p.nom,
        description: d?.description || "",
        prix: Number(p.prix) || 0,
        prixOriginal:
          d?.prix_original != null
            ? Number(d.prix_original)
            : undefined,
        categorie: d?.categorie || "",
        sousCategorie: d?.sous_categorie || null,
        genre: d?.genre || null,
        image: d?.image_url || "",
        stock: Number(p.stock) || 0,
        disponibilite: p.disponibilite || "stock",
        promo: Number(d?.promo) || 0,
        promoFin: d?.promo_fin || "",
        nouveau: Boolean(d?.nouveau),
        dateAjout: d?.date_ajout || p.created_at,
      };
    });

    return { success: true, data: produits };
  } catch (err) {
    console.error("Erreur récupération produits Supabase:", err);
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function ajouterProduit(produit: ProduitAdminInput) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré',
    }
  }

  try {
    const disponibilite =
      produit.disponibilite === 'sur_commande'
        ? 'sur_commande'
        : 'stock'

    const stock =
      disponibilite === 'sur_commande'
        ? 0
        : Math.max(0, Math.floor(Number(produit.stock) || 0))

    const poidsKg =
      produit.poidsKg === '' || produit.poidsKg == null
        ? null
        : Math.max(0, Number(produit.poidsKg) || 0)

    const volumeCbm =
      produit.volumeCbm === '' || produit.volumeCbm == null
        ? null
        : Math.max(0, Number(produit.volumeCbm) || 0)

    const prix = Math.max(0, Number(produit.prix) || 0)

    const prixOriginal =
      produit.prixOriginal === '' || produit.prixOriginal == null
        ? null
        : Math.max(0, Number(produit.prixOriginal) || 0)

    const promo = Math.min(
      100,
      Math.max(0, Number(produit.promo) || 0),
    )

    const resultat = await supabase.rpc(
      'cs_creer_produit_admin',
      {
        p_nom: String(produit.nom || '').trim(),
        p_description: String(produit.description || '').trim(),
        p_prix: prix,
        p_prix_original: prixOriginal,
        p_categorie: produit.categorie || null,
        p_sous_categorie: produit.sousCategorie || null,
        p_genre: produit.genre || null,
        p_image_url: produit.image || null,
        p_stock: stock,
        p_disponibilite: disponibilite,
        p_poids_kg: poidsKg,
        p_volume_cbm: volumeCbm,
        p_promo: promo,
        p_nouveau: Boolean(produit.nouveau),
        p_date_ajout: produit.dateAjout || null,
        p_promo_fin: produit.promoFin || null,
        p_produit_source_id: produit.produitSourceId || null,
      },
    )

    if (resultat.error) throw resultat.error

    if (!resultat.data) {
      throw new Error(
        'Aucune donnée retournée après la création du produit.',
      )
    }

    return {
      success: true,
      data: resultat.data,
    }
  } catch (err) {
    console.error('Erreur création produit Admin:', err)

    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null
            ? (err as any).message ||
              (err as any).error ||
              (err as any).details ||
              (err as any).hint ||
              JSON.stringify(err)
            : String(err),
    }
  }
}

export async function modifierProduit(
  id: string,
  produit: ProduitAdminInput,
) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré',
    }
  }

  try {
    const disponibilite =
      produit.disponibilite === 'sur_commande'
        ? 'sur_commande'
        : 'stock'

    const stock =
      disponibilite === 'sur_commande'
        ? 0
        : Math.max(
            0,
            Math.floor(Number(produit.stock) || 0),
          )

    const poidsKg =
      produit.poidsKg === '' ||
      produit.poidsKg == null
        ? null
        : Math.max(0, Number(produit.poidsKg) || 0)

    const volumeCbm =
      produit.volumeCbm === '' ||
      produit.volumeCbm == null
        ? null
        : Math.max(0, Number(produit.volumeCbm) || 0)

    const { data, error } = await supabase.rpc(
      'cs_modifier_produit_admin',
      {
        p_produit_id: id,
        p_stock: stock,
        p_disponibilite: disponibilite,
        p_poids_kg: poidsKg,
        p_volume_cbm: volumeCbm,
        p_promo: Math.max(0, Number(produit.promo) || 0),
        p_promo_fin: produit.promoFin || null,
        p_prix_original:
          produit.prixOriginal == null || produit.prixOriginal === ''
            ? null
            : Number(produit.prixOriginal),
        p_description:
          produit.description == null
            ? null
            : String(produit.description).trim(),
      },
    )

    if (error) throw error

    if (!data) {
      throw new Error(
        'Aucune donnée retournée par Supabase.',
      )
    }

    return {
      success: true,
      data,
    }
  } catch (err) {
    console.error(
      'Erreur modification produit Admin:',
      err,
    )

    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null
            ? (err as any).message ||
              (err as any).error ||
              (err as any).details ||
              (err as any).hint ||
              JSON.stringify(err)
            : String(err),
    }
  }
}
export async function supprimerProduit(id: string) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré'
    };
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_supprimer_produit_admin',
      {
        p_produit_id: id
      }
    );

    if (error) throw error;

    if (!data || data.success !== true) {
      return {
        success: false,
        error: 'La suppression du produit a échoué.'
      };
    }

    return {
      success: true,
      action: data.action,
      deleted: data.deleted === true,
      deactivated: data.deactivated === true,
      commande_lignes: Number(data.commande_lignes || 0),
      nom: data.nom
    };
  } catch (err) {
    console.error('Erreur suppression produit Supabase:', err);

    let message = 'Impossible de supprimer le produit.';

    if (err instanceof Error && err.message) {
      message = err.message;
    } else if (typeof err === 'string' && err) {
      message = err;
    } else if (err && typeof err === 'object') {
      const obj = err as Record<string, unknown>;

      if (typeof obj.message === 'string' && obj.message) {
        message = obj.message;
      } else if (typeof obj.error === 'string' && obj.error) {
        message = obj.error;
      } else {
        try {
          const json = JSON.stringify(err);
          if (json && json !== '{}') message = json;
        } catch {
          // Conserver le message générique.
        }
      }
    }

    return {
      success: false,
      error: message
    };
  }
}

export async function televerserPhotoProduit(file: File) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré'
    };
  }

  if (!file) {
    return {
      success: false,
      error: 'Aucune photo sélectionnée'
    };
  }

  const typesAutorises = ['image/jpeg', 'image/png', 'image/webp'];

  if (!typesAutorises.includes(file.type)) {
    return {
      success: false,
      error: 'Format non accepté. Utilisez JPG, PNG ou WEBP.'
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      success: false,
      error: 'La photo doit faire moins de 5 Mo.'
    };
  }

  try {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const nomUnique = `${crypto.randomUUID()}.${extension}`;
    const chemin = `produits/${nomUnique}`;

    const { error: uploadError } = await supabase.storage
      .from('produits')
      .upload(chemin, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('produits')
      .getPublicUrl(chemin);

    return {
      success: true,
      url: data.publicUrl,
      chemin
    };
  } catch (err) {
    console.error('Erreur upload photo:', err);

    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

export async function modifierPhotoProduitAdmin(
  produitId: string,
  imageUrl: string,
) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré',
    }
  }

  if (!produitId) {
    return {
      success: false,
      error: 'Produit invalide',
    }
  }

  if (!imageUrl || !imageUrl.trim()) {
    return {
      success: false,
      error: 'URL de photo invalide',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_modifier_photo_admin',
      {
        p_produit_id: produitId,
        p_image_url: imageUrl.trim(),
      },
    )

    if (error) throw error

    return {
      success: true,
      data,
    }
  } catch (err) {
    console.error('Erreur modification photo Admin:', err)

    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null
            ? (err as any).message ||
              (err as any).error ||
              (err as any).details ||
              (err as any).hint ||
              JSON.stringify(err)
            : String(err),
    }
  }
}

export async function supprimerPhotoProduit(chemin: string) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré'
    };
  }

  if (!chemin || typeof chemin !== 'string') {
    return {
      success: false,
      error: 'Chemin de photo invalide'
    };
  }

  // Sécurité : ne supprimer que dans le dossier produits/
  if (!chemin.startsWith('produits/')) {
    return {
      success: false,
      error: 'Suppression refusée : chemin non autorisé'
    };
  }

  try {
    const { error } = await supabase.storage
      .from('produits')
      .remove([chemin]);

    if (error) throw error;

    return {
      success: true
    };
  } catch (err) {
    console.error('Erreur suppression photo:', err);

    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}


export async function recupererTarifsLivraison() {
  if (!supabase) {
    return {
      success: false,
      data: [],
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase
      .from('cs_tarifs_livraison')
      .select('id, code, nom, montant, actif')
      .eq('actif', true)
      .neq('code', 'RETRAIT')
      .order('montant', { ascending: true })

    if (error) throw error

    return {
      success: true,
      data: (data || []).map((tarif) => ({
        id: tarif.id,
        code: tarif.code,
        nomZone: tarif.nom,
        tarif: Number(tarif.montant) || 0,
        actif: Boolean(tarif.actif),
      })),
    }
  } catch (err) {
    console.error('Erreur récupération tarifs livraison V2:', err)

    return {
      success: false,
      data: [],
      error:
        err instanceof Error
          ? err.message
          : 'Impossible de récupérer les tarifs de livraison',
    }
  }
}

export async function recupererProduitsAdmin() {
  if (!supabase) {
    return {
      success: false,
      data: [],
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase
      .from('cs_produits')
      .select(`
        id,
        produit_source_id,
        nom,
        prix,
        stock,
        disponibilite,
        poids_kg,
        volume_cbm,
        actif,
        created_at,
        updated_at,
        cs_produit_details (
          description,
          image_url,
          prix_original,
          categorie,
          sous_categorie,
          genre,
          promo,
          nouveau,
          date_ajout,
          promo_fin
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const produits = (data || []).map((p) => {
      const d = Array.isArray(p.cs_produit_details)
        ? p.cs_produit_details[0]
        : p.cs_produit_details

      return {
        ...p,
        description: d?.description || '',
        prix_original:
          d?.prix_original != null
            ? Number(d.prix_original)
            : null,
        categorie: d?.categorie || null,
        sous_categorie: d?.sous_categorie || null,
        genre: d?.genre || null,
        image_url: d?.image_url || null,
        promo: Number(d?.promo) || 0,
        nouveau: Boolean(d?.nouveau),
        date_ajout: d?.date_ajout || p.created_at,
        promo_fin: d?.promo_fin || null,
      }
    })

    return {
      success: true,
      data: produits,
    }
  } catch (err) {
    console.error('Erreur récupération produits Admin:', err)

    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function notifierMiseAJourSuivi(
  codeSuivi: string,
) {
  if (!supabase) return

  const code = String(codeSuivi || '').trim().toUpperCase()

  if (!code) return

  try {
    const channel = supabase.channel(`suivi-commande:${code}`)

    await channel.send({
      type: 'broadcast',
      event: 'commande_update',
      payload: {
        code_suivi: code,
      },
    })

    await supabase.removeChannel(channel)
  } catch (error) {
    console.warn(
      'Notification temps réel du suivi indisponible :',
      error,
    )
  }
}

export async function programmerTrajetLivraison(
  numeroCommande: string,
  pointA: string,
  pointB: string,
  departPrevu: string,
  arriveePrevue: string,
) {
  if (!supabase) throw new Error('Supabase non configuré')

  const { data, error } = await supabase.rpc(
    'cs_programmer_trajet_livraison',
    {
      p_numero_commande: numeroCommande,
      p_point_a: pointA,
      p_point_b: pointB,
      p_depart_prevu: departPrevu,
      p_arrivee_prevue: arriveePrevue,
    },
  )

  if (error) throw new Error(error.message)
  return data
}

export async function demarrerTrajetLivraison(
  numeroCommande: string,
  arriveePrevue: string,
) {
  if (!supabase) throw new Error('Supabase non configuré')

  console.log('=== DEMARRAGE TRAJET ===')
  console.log('Commande:', numeroCommande)
  console.log('Arrivée:', arriveePrevue)

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession()

  console.log('Session error:', sessionError)
  console.log('Session UID:', sessionData?.session?.user?.id || 'AUCUN')

  if (!sessionData?.session?.user) {
    throw new Error('Aucune session administrateur active.')
  }

  console.log('Appel RPC cs_demarrer_trajet_livraison...')

  const resultat = await supabase.rpc(
    'cs_demarrer_trajet_livraison',
    {
      p_numero_commande: String(numeroCommande).trim(),
      p_arrivee_prevue: arriveePrevue,
    },
  )

  console.log('RPC TERMINE')
  console.log('RPC data:', resultat.data)
  console.log('RPC error:', resultat.error)
  console.log('RPC status:', resultat.status)
  console.log('RPC statusText:', resultat.statusText)

  if (resultat.error) {
    throw new Error(
      `RPC démarrage: ${resultat.error.message}`,
    )
  }

  if (!resultat.data) {
    throw new Error(
      'La RPC a répondu sans aucune donnée.',
    )
  }

  if (resultat.data.success !== true) {
    throw new Error(
      resultat.data.error ||
        'La RPC a refusé le démarrage du trajet.',
    )
  }

  console.log('=== TRAJET DÉMARRÉ ===')

  return resultat.data
}

export async function enregistrerArriveeLivraison(numeroCommande: string) {
  if (!supabase) throw new Error('Supabase non configuré')

  const { data, error } = await supabase.rpc(
    'cs_arrivee_trajet_livraison',
    {
      p_numero_commande: numeroCommande,
    },
  )

  if (error) throw new Error(error.message)
  return data
}

export async function terminerTrajetLivraison(numeroCommande: string) {
  if (!supabase) throw new Error('Supabase non configuré')

  const { data, error } = await supabase.rpc(
    'cs_terminer_trajet_livraison',
    {
      p_numero_commande: numeroCommande,
    },
  )

  if (error) throw new Error(error.message)
  return data
}

export async function attribuerLivreur(
  numeroCommande: string,
  livreurNom: string,
  livreurTelephone: string,
) {
  if (!supabase) throw new Error('Supabase non configuré')

  const numero = String(numeroCommande || '').trim()
  const nom = String(livreurNom || '').trim()
  const telephone = String(livreurTelephone || '')
    .replace(/\D/g, '')
    .slice(0, 10)

  if (!numero) {
    throw new Error('Numéro de commande manquant.')
  }

  if (!nom || nom.length > 120) {
    throw new Error('Nom du livreur invalide.')
  }

  if (!/^01\d{8}$/.test(telephone)) {
    throw new Error(
      'Le numéro du livreur doit contenir exactement 10 chiffres et commencer par 01.',
    )
  }

  const { data, error } = await supabase.rpc(
    'cs_attribuer_livreur',
    {
      p_numero_commande: numero,
      p_livreur_nom: nom,
      p_livreur_telephone: telephone,
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  if (!data?.success) {
    throw new Error(
      data?.error ||
        'Impossible d’enregistrer le livreur.',
    )
  }

  return data
}

export async function modifierPromotionAdmin(
  id: string,
  promotion: {
    promo: number
    prixOriginal: number | null
    promoDebut: string | null
    promoFin: string | null
  },
) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré',
    }
  }

  try {
    const promo = Math.min(
      100,
      Math.max(0, Number(promotion.promo) || 0),
    )

    const prixOriginal =
      promo > 0 &&
      promotion.prixOriginal != null &&
      Number(promotion.prixOriginal) > 0
        ? Number(promotion.prixOriginal)
        : null

    const promoDebut =
      promo > 0 && promotion.promoDebut
        ? promotion.promoDebut
        : null

    const promoFin =
      promo > 0 && promotion.promoFin
        ? promotion.promoFin
        : null

    const { data, error } = await supabase.rpc(
      'cs_modifier_promotion_admin',
      {
        p_produit_id: id,
        p_promo: promo,
        p_prix_original: prixOriginal,
        p_promo_debut: promoDebut,
        p_promo_fin: promoFin,
      },
    )

    if (error) throw error

    if (!data) {
      throw new Error(
        'Aucune donnée retournée par Supabase.',
      )
    }

    return {
      success: true,
      data,
    }
  } catch (err) {
    console.error(
      'Erreur modification promotion:',
      err,
    )

    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : String(err),
    }
  }
}

export async function recupererRecuClient(codeSuivi: string) {
  const { data, error } = await supabase.rpc('cs_recuperer_recu_client', {
    p_code_suivi: codeSuivi,
  })

  if (error) throw error
  return data
}

export async function recupererFactureAdmin(commandeId: string) {
  if (!supabase) {
    return {
      success: false,
      data: null,
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_recuperer_facture_admin',
      {
        p_commande_id: commandeId,
      },
    )

    if (error) throw error

    return {
      success: true,
      data,
    }
  } catch (err) {
    console.error('Erreur récupération facture admin:', err)

    return {
      success: false,
      data: null,
      error:
        err instanceof Error
          ? err.message
          : 'Impossible de récupérer la facture.',
    }
  }
}

export async function recupererParametresCommerciaux() {
  if (!supabase) throw new Error('Supabase non configuré')

  const { data, error } = await supabase.rpc(
    'cs_recuperer_parametres_commerciaux',
  )

  if (error) throw error
  return data
}

export async function modifierParametresCommerciaux(parametres: {
  nomBoutique: string
  sousTitre: string
  remisePourcentage: number
  seuilRemiseArticles: number
  fraisLivraison: number
  retraitGratuit: boolean
  livraisonPaiementEnLigneRequis: boolean
}) {
  if (!supabase) throw new Error('Supabase non configuré')

  const { data, error } = await supabase.rpc(
    'cs_modifier_parametres_commerciaux',
    {
      p_nom_boutique: parametres.nomBoutique,
      p_sous_titre: parametres.sousTitre,
      p_remise_pourcentage: parametres.remisePourcentage,
      p_seuil_remise_articles: parametres.seuilRemiseArticles,
      p_frais_livraison: parametres.fraisLivraison,
      p_retrait_gratuit: parametres.retraitGratuit,
      p_livraison_paiement_en_ligne_requis:
        parametres.livraisonPaiementEnLigneRequis,
    },
  )

  if (error) throw error
  return data
}

/* ===============================
   PRÉFÉRENCES NOTIFICATIONS CLIENT
   =============================== */

export type PreferencesNotificationsClient = {
  notifications_commandes: boolean
  notifications_livraison: boolean
  notifications_promotions: boolean
}

export async function recupererPreferencesNotificationsClient() {
  if (!supabase) {
    return {
      success: false,
      data: null,
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data: authData, error: authError } =
      await supabase.auth.getUser()

    if (authError || !authData?.user) {
      return {
        success: false,
        data: null,
        error: 'Utilisateur non connecté',
      }
    }

    const { data, error } = await supabase
      .from('cs_preferences_clients')
      .select(
        'notifications_commandes, notifications_livraison, notifications_promotions',
      )
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (error) throw error

    return {
      success: true,
      data: data || {
        notifications_commandes: true,
        notifications_livraison: true,
        notifications_promotions: true,
      },
    }
  } catch (err: any) {
    console.error(
      'Erreur récupération préférences notifications:',
      err,
    )

    return {
      success: false,
      data: null,
      error:
        err?.message ||
        'Impossible de récupérer vos préférences.',
    }
  }
}

export async function sauvegarderPreferencesNotificationsClient(
  preferences: PreferencesNotificationsClient,
) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data: authData, error: authError } =
      await supabase.auth.getUser()

    if (authError || !authData?.user) {
      return {
        success: false,
        error: 'Utilisateur non connecté',
      }
    }

    const { error } = await supabase
      .from('cs_preferences_clients')
      .upsert(
        {
          user_id: authData.user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        },
      )

    if (error) throw error

    return {
      success: true,
    }
  } catch (err: any) {
    console.error(
      'Erreur sauvegarde préférences notifications:',
      err,
    )

    return {
      success: false,
      error:
        err?.message ||
        'Impossible d’enregistrer vos préférences.',
    }
  }
}

/* ============================================================
 * ANNONCES — ADMIN + ACCUEIL
 * ============================================================ */

export type Annonce = {
  id: string
  titre: string | null
  message: string
  type: string
  actif: boolean
  ordre: number
  date_debut: string | null
  date_fin: string | null
  created_at?: string
  updated_at?: string
}

export async function recupererAnnoncesActives(): Promise<{
  success: boolean
  data: Annonce[]
  error?: string
}> {
  if (!supabase) {
    return {
      success: false,
      data: [],
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_lire_annonces_actives',
    )

    if (error) throw error

    return {
      success: true,
      data: Array.isArray(data) ? data : [],
    }
  } catch (err: any) {
    console.error('Erreur récupération annonces:', err)

    return {
      success: false,
      data: [],
      error:
        err?.message ||
        'Impossible de récupérer les annonces.',
    }
  }
}

export async function recupererAnnoncesAdmin(): Promise<{
  success: boolean
  data: Annonce[]
  error?: string
}> {
  if (!supabase) {
    return {
      success: false,
      data: [],
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_lister_annonces_admin',
    )

    if (error) throw error

    return {
      success: true,
      data: Array.isArray(data) ? data : [],
    }
  } catch (err: any) {
    console.error('Erreur récupération annonces admin:', err)

    return {
      success: false,
      data: [],
      error:
        err?.message ||
        'Impossible de récupérer les annonces.',
    }
  }
}

export async function creerAnnonceAdmin(annonce: {
  titre?: string
  message: string
  type?: string
  actif?: boolean
  ordre?: number
  dateDebut?: string | null
  dateFin?: string | null
}) {
  if (!supabase) {
    return {
      success: false,
      data: null,
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_creer_annonce',
      {
        p_titre: annonce.titre || null,
        p_message: annonce.message,
        p_type: annonce.type || 'information',
        p_actif: annonce.actif ?? true,
        p_ordre: annonce.ordre ?? 0,
        p_date_debut: annonce.dateDebut || null,
        p_date_fin: annonce.dateFin || null,
      },
    )

    if (error) throw error

    return {
      success: true,
      data,
    }
  } catch (err: any) {
    console.error('Erreur création annonce:', err)

    return {
      success: false,
      data: null,
      error:
        err?.message ||
        'Impossible de créer l’annonce.',
    }
  }
}

export async function modifierAnnonceAdmin(
  id: string,
  annonce: {
    titre?: string
    message: string
    type?: string
    actif?: boolean
    ordre?: number
    dateDebut?: string | null
    dateFin?: string | null
  },
) {
  if (!supabase) {
    return {
      success: false,
      data: null,
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_modifier_annonce',
      {
        p_id: id,
        p_titre: annonce.titre || null,
        p_message: annonce.message,
        p_type: annonce.type || 'information',
        p_actif: annonce.actif ?? true,
        p_ordre: annonce.ordre ?? 0,
        p_date_debut: annonce.dateDebut || null,
        p_date_fin: annonce.dateFin || null,
      },
    )

    if (error) throw error

    return {
      success: true,
      data,
    }
  } catch (err: any) {
    console.error('Erreur modification annonce:', err)

    return {
      success: false,
      data: null,
      error:
        err?.message ||
        'Impossible de modifier l’annonce.',
    }
  }
}

export async function activerAnnonceAdmin(
  id: string,
  actif: boolean,
) {
  if (!supabase) {
    return {
      success: false,
      data: null,
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_activer_annonce',
      {
        p_id: id,
        p_actif: actif,
      },
    )

    if (error) throw error

    return {
      success: true,
      data,
    }
  } catch (err: any) {
    console.error('Erreur activation annonce:', err)

    return {
      success: false,
      data: null,
      error:
        err?.message ||
        'Impossible de modifier le statut.',
    }
  }
}

export async function supprimerAnnonceAdmin(id: string) {
  if (!supabase) {
    return {
      success: false,
      data: null,
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_supprimer_annonce',
      {
        p_id: id,
      },
    )

    if (error) throw error

    return {
      success: true,
      data,
    }
  } catch (err: any) {
    console.error('Erreur suppression annonce:', err)

    return {
      success: false,
      data: null,
      error:
        err?.message ||
        'Impossible de supprimer l’annonce.',
    }
  }
}

export type ProduitPhotoAdmin = {
  id: string
  produit_id: string
  url: string
  chemin_storage?: string | null
  position: number
  principale: boolean
  created_at?: string
}

export async function recupererPhotosProduit(produitId: string) {
  if (!supabase) {
    return {
      success: false,
      data: [] as ProduitPhotoAdmin[],
      error: 'Supabase non configuré',
    }
  }

  if (!produitId) {
    return {
      success: false,
      data: [] as ProduitPhotoAdmin[],
      error: 'Produit invalide',
    }
  }

  try {
    const { data, error } = await supabase
      .from('cs_produit_photos')
      .select('id, produit_id, url, chemin_storage, position, principale, created_at')
      .eq('produit_id', produitId)
      .order('position', { ascending: true })

    if (error) throw error

    return {
      success: true,
      data: (data || []) as ProduitPhotoAdmin[],
    }
  } catch (err) {
    console.error('Erreur récupération photos produit:', err)

    return {
      success: false,
      data: [] as ProduitPhotoAdmin[],
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function ajouterPhotoProduitAdmin(
  produitId: string,
  imageUrl: string,
  position = 0,
  principale = false,
  cheminStorage?: string,
) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré',
    }
  }

  if (!produitId) {
    return {
      success: false,
      error: 'Produit invalide',
    }
  }

  if (!imageUrl || !imageUrl.trim()) {
    return {
      success: false,
      error: 'URL de photo invalide',
    }
  }

  const positionValide = Math.max(0, Math.floor(Number(position) || 0))

  try {
    const { data, error } = await supabase.rpc(
      'cs_ajouter_photo_produit_admin',
      {
        p_produit_id: produitId,
        p_url: imageUrl.trim(),
        p_position: positionValide,
        p_principale: Boolean(principale),
        p_chemin_storage: cheminStorage?.trim() || null,
      },
    )

    if (error) throw error

    return {
      success: true,
      data: data as ProduitPhotoAdmin,
    }
  } catch (err) {
    console.error('Erreur ajout photo produit:', err)

    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function definirPhotoPrincipaleAdmin(
  produitId: string,
  photoId: string,
) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré',
    }
  }

  if (!produitId || !photoId) {
    return {
      success: false,
      error: 'Produit ou photo invalide',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_definir_photo_principale_admin',
      {
        p_produit_id: produitId,
        p_photo_id: photoId,
      },
    )

    if (error) throw error

    return {
      success: true,
      data: data as ProduitPhotoAdmin,
    }
  } catch (err) {
    console.error('Erreur définition photo principale:', err)

    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function reordonnerPhotosProduitAdmin(
  produitId: string,
  photoIds: string[],
) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré',
    }
  }

  if (!produitId || !Array.isArray(photoIds)) {
    return {
      success: false,
      error: 'Données de réorganisation invalides',
    }
  }

  try {
    const { error } = await supabase.rpc(
      'cs_reordonner_photos_produit_admin',
      {
        p_produit_id: produitId,
        p_photo_ids: photoIds,
      },
    )

    if (error) throw error

    return {
      success: true,
    }
  } catch (err) {
    console.error('Erreur réorganisation photos produit:', err)

    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function supprimerPhotoProduitAdmin(
  produitId: string,
  photoId: string,
) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré',
    }
  }

  if (!produitId || !photoId) {
    return {
      success: false,
      error: 'Produit ou photo invalide',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_supprimer_photo_produit_admin',
      {
        p_produit_id: produitId,
        p_photo_id: photoId,
      },
    )

    if (error) throw error

    return {
      success: true,
      data: data as ProduitPhotoAdmin,
    }
  } catch (err) {
    console.error('Erreur suppression photo produit:', err)

    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function envoyerPreuvePaiement(
  numeroCommande: string,
  paiementAccesToken: string,
  paiementId: string,
  fichier: File,
) {
  if (!supabase) {
    throw new Error('Supabase non configuré')
  }

  if (!(fichier instanceof File)) {
    throw new Error('Fichier de preuve invalide.')
  }

  if (fichier.size <= 0 || fichier.size > 5 * 1024 * 1024) {
    throw new Error('La preuve doit faire au maximum 5 Mo.')
  }

  const formatsAcceptes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ]

  if (!formatsAcceptes.includes(fichier.type)) {
    throw new Error('Format accepté : JPG, PNG ou WebP.')
  }

  const formData = new FormData()
  formData.append('numero_commande', numeroCommande.trim())
  formData.append('paiement_acces_token', paiementAccesToken.trim())
  formData.append('paiement_id', paiementId.trim())
  formData.append('file', fichier)

  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  const headers: Record<string, string> = {}

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const { data, error } = await supabase.functions.invoke(
    'upload-payment-proof',
    {
      body: formData,
      headers,
    },
  )

  if (error) {
    throw error
  }

  if (!data?.success) {
    throw new Error(
      data?.error ||
        'Impossible d’envoyer la preuve de paiement.',
    )
  }

  return data
}

export async function enregistrerReferenceTransaction(
  numeroCommande: string,
  paiementAccesToken: string,
  paiementId: string,
  referenceTransaction: string,
) {
  if (!supabase) {
    throw new Error('Supabase non configuré')
  }

  const numero = numeroCommande.trim()
  const token = paiementAccesToken.trim()
  const paiement = paiementId.trim()
  const reference = referenceTransaction.trim()

  if (!numero) {
    throw new Error('Numéro de commande requis.')
  }

  if (!token) {
    throw new Error('Jeton de paiement requis.')
  }

  if (!paiement) {
    throw new Error('Paiement invalide.')
  }

  if (!reference) {
    throw new Error('Référence de transaction requise.')
  }

  if (reference.length > 100) {
    throw new Error('La référence de transaction est trop longue.')
  }

  const { data, error } = await supabase.rpc(
    'cs_enregistrer_reference_transaction_invite',
    {
      p_numero_commande: numero,
      p_paiement_acces_token: token,
      p_paiement_id: paiement,
      p_reference_transaction: reference,
    },
  )

  if (error) {
    throw error
  }

  if (!data?.success) {
    throw new Error(
      data?.error ||
        'Impossible d’enregistrer la référence de transaction.',
    )
  }

  return data
}

export async function verifierCommandePaiementInvite(
  numeroCommande: string,
  paiementAccesToken: string,
) {
  if (!supabase) {
    throw new Error('Supabase non configuré')
  }

  const numero = numeroCommande.trim()
  const token = paiementAccesToken.trim()

  if (!numero) {
    throw new Error('Numéro de commande requis.')
  }

  if (!token) {
    throw new Error('Jeton de paiement requis.')
  }

  const { data, error } = await supabase.rpc(
    'cs_verifier_commande_paiement_invite',
    {
      p_numero_commande: numero,
      p_paiement_acces_token: token,
    },
  )

  if (error) {
    console.error('Erreur vérification paiement commande:', error)
    throw error
  }

  if (!data?.success) {
    throw new Error(
      data?.error ||
        'Impossible de vérifier le paiement de la commande.',
    )
  }

  return data
}

