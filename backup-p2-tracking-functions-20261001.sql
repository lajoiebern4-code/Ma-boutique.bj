-- Sauvegarde de public.suivre_commande(text)
-- État avant P2 : réduction des données exposées

CREATE OR REPLACE FUNCTION public.suivre_commande(p_code_suivi text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_expire_at timestamptz;
  v_client_user_id uuid;
  v_acompte_requis numeric;
  v_acompte_paye numeric;
  v_total numeric;
  v_result jsonb;
BEGIN
  IF NOT public.cs_rate_limit_check('suivre_commande', 30) THEN
    RAISE EXCEPTION 'Trop de tentatives. Veuillez réessayer dans une minute.';
  END IF;

  SELECT c.id, c.code_expire_at, c.client_user_id,
         COALESCE(c.acompte_requis, 0),
         COALESCE(c.acompte_paye, 0),
         COALESCE(c.total, 0)
  INTO v_id, v_expire_at, v_client_user_id,
       v_acompte_requis, v_acompte_paye, v_total
  FROM public.cs_commandes c
  WHERE c.code_suivi = upper(trim(p_code_suivi))
  LIMIT 1;

  IF v_id IS NULL THEN
    RETURN jsonb_build_object('commande', null, 'articles', '[]'::jsonb, 'etapes', '[]'::jsonb);
  END IF;

  IF v_client_user_id IS NULL AND v_expire_at IS NOT NULL AND v_expire_at <= now() THEN
    UPDATE public.cs_commandes
    SET code_suivi = NULL, code_retrait = NULL, code_expire_at = NULL, updated_at = now()
    WHERE id = v_id;
    RETURN jsonb_build_object('commande', null, 'articles', '[]'::jsonb, 'etapes', '[]'::jsonb);
  END IF;

  SELECT jsonb_build_object(
    'commande', jsonb_build_object(
      'numero', c.numero,
      'statut', c.statut,
      'mode_reception', c.mode_reception,
      'code_suivi', c.code_suivi,
      'code_retrait', CASE WHEN c.mode_reception = 'retrait' AND c.statut IN ('pret', 'retire') THEN c.code_retrait ELSE NULL END,
      'livraison_statut', c.livraison_statut,
      'point_depart', c.point_depart,
      'point_destination', c.point_destination,
      'depart_prevu_at', c.depart_prevu_at,
      'arrivee_prevue_at', c.arrivee_prevue_at,
      'depart_reel_at', c.depart_reel_at,
      'arrivee_reelle_at', c.arrivee_reelle_at,
      'livraison_confirmee_at', c.livraison_confirmee_at,
      'livreur_nom', c.livreur_nom,
      'livreur_telephone', c.livreur_telephone,
      'created_at', c.created_at,
      'total', v_total,
      'acompte_requis', v_acompte_requis,
      'acompte_paye', v_acompte_paye,
      'solde_restant', GREATEST(v_total - v_acompte_paye, 0),
      'paiement', (
        SELECT jsonb_build_object(
          'id', p.id,
          'type', p.type,
          'provider', p.provider,
          'montant', p.montant,
          'statut', p.statut,
          'reference_paiement', p.reference_paiement,
          'reference_transaction', p.reference_transaction,
          'preuve_path', p.preuve_path,
          'preuve_uploaded_at', p.preuve_uploaded_at
        )
        FROM public.cs_paiements p
        WHERE p.commande_id = c.id
          AND p.type IN ('acompte', 'solde')
        ORDER BY p.created_at DESC
        LIMIT 1
      )
    ),
    'articles', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'nom_produit', l.nom_produit,
        'prix_unitaire', l.prix_unitaire,
        'quantite', l.quantite,
        'total_ligne', l.total_ligne,
        'origine', l.origine,
        'variante_id', l.variante_id,
        'nom_variante', l.nom_variante
      ) ORDER BY l.created_at, l.id)
      FROM public.cs_commande_lignes l
      WHERE l.commande_id = c.id
    ), '[]'::jsonb),
    'etapes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'titre', e.titre,
        'statut', e.statut,
        'position', e.position,
        'description', e.description,
        'date_etape', e.date_etape
      ) ORDER BY e.position, e.date_etape)
      FROM public.cs_commande_etapes e
      WHERE e.commande_id = c.id
    ), '[]'::jsonb),
    'transports', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', t.id,
        'numero', t.numero,
        'type_transport', t.type_transport,
        'origine', t.origine,
        'destination', t.destination,
        'statut', t.statut,
        'depart_prevu_at', t.depart_prevu_at,
        'depart_reel_at', t.depart_reel_at,
        'arrivee_prevue_at', t.arrivee_prevue_at,
        'arrivee_reelle_at', t.arrivee_reelle_at
      ) ORDER BY t.created_at, t.id)
      FROM public.cs_commande_transports t
      WHERE t.commande_id = c.id
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM public.cs_commandes c
  WHERE c.id = v_id;

  RETURN COALESCE(v_result, jsonb_build_object('commande', null, 'articles', '[]'::jsonb, 'etapes', '[]'::jsonb));
END;
$function$;
