import { supabase } from "../lib/supabase"
export { supabase } from "../lib/supabase"
export function isSupabaseConfigured() {
  return !!supabase;
}

export async function sauvegarderCommandeV2(commande) {
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

    if (
      commande.modeReception === 'livraison' &&
      !commande.zoneLivraisonId
    ) {
      throw new Error('La zone de livraison est obligatoire.')
    }

    const lignesRpc = commande.articles.map((article) => ({
      produit_id: article.id,
      quantite: Number(article.qte || 1),
    }))

    const paiementRpc = commande.modePaiement

    const zoneCode =
      commande.modeReception === 'livraison'
        ? commande.zoneLivraisonCode || null
        : null

    const { data, error } = await supabase.rpc('cs_creer_commande_v2', {
      p_nom_client: commande.nomClient.trim(),
      p_telephone: commande.telephone.trim(),
      p_mode_reception: commande.modeReception,
      p_mode_paiement: paiementRpc,
      p_adresse_livraison:
        commande.modeReception === 'livraison'
          ? commande.adresseLivraison?.trim() || null
          : null,
      p_zone_code: zoneCode,
      p_lignes: lignesRpc,
    })

    if (error) throw error

    if (!data) {
      throw new Error('Supabase n’a retourné aucune commande.')
    }

    const calcul = data.calcul || {}

    return {
      success: true,
      data,
      commandeId: data.commande_id || '',
      numeroCommande: data.numero || '',
      codeSuivi: data.code_suivi || '',
      codeRetrait: commande.modeReception === 'retrait' ? (data.code_suivi || '') : '',
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
    console.error('Erreur création commande V2:', err)

    return {
      success: false,
      error: err?.message || 'Impossible de créer la commande.',
    }
  }
}


export async function payerAcompteCommande(
  numeroCommande: string,
  montant: number,
) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré',
    }
  }

  try {
    const { data, error } = await supabase.rpc(
      'cs_payer_acompte_commande',
      {
        p_numero_commande: numeroCommande,
        p_montant: montant,
      },
    )

    if (error) throw error

    if (!data?.success) {
      throw new Error(
        data?.error || 'Impossible d’enregistrer l’acompte.',
      )
    }

    return data
  } catch (err) {
    console.error('Erreur paiement acompte:', err)

    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Impossible d’enregistrer l’acompte.',
    }
  }
}

// ===============================
// COMMANDES CLIENT
// ===============================

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
      error: err?.message || 'Erreur récupération commandes',
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
      error: err?.message || 'Erreur récupération commandes détaillées',
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
      error: err?.message || 'Erreur récupération trajets',
    }
  }
}

// ===============================
// STATUT COMMANDES ADMIN V2
// ===============================

export async function mettreAJourStatutCommandeV2(
  numeroCommande,
  statut,
  codeRetrait = null,
) {
  if (!supabase) {
    throw new Error('Supabase non configuré')
  }

  const { data, error } = await supabase.rpc(
    'cs_mettre_a_jour_statut_commande',
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

export async function ajouterProduit(produit) {
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
        p_prix_original:
          produit.prixOriginal == null || produit.prixOriginal === ''
            ? null
            : Number(produit.prixOriginal),
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

export async function modifierProduit(id, produit) {
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
export async function supprimerProduit(id) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase non configuré'
    };
  }

  try {
    const { error } = await supabase
      .from('cs_produits')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return {
      success: true
    };
  } catch (err) {
    console.error('Erreur suppression produit Supabase:', err);

    return {
      success: false,
      error: err.message
    };
  }
}

export async function televerserPhotoProduit(file) {
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
      error: err.message
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

export async function supprimerPhotoProduit(chemin) {
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
      error: err.message
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

export async function programmerTrajetLivraison(
  numeroCommande,
  pointA,
  pointB,
  departPrevu,
  arriveePrevue,
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
  numeroCommande,
  arriveePrevue,
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

export async function enregistrerArriveeLivraison(numeroCommande) {
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

export async function terminerTrajetLivraison(numeroCommande) {
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

export async function modifierPromotionAdmin(
  id: string,
  promotion: {
    promo: number
    prixOriginal: number | null
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
