CREATE OR REPLACE FUNCTION public.cs_recuperer_recu_client(p_code_suivi text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_commande public.cs_commandes%ROWTYPE;
BEGIN
  IF p_code_suivi IS NULL OR trim(p_code_suivi) = '' THEN
    RAISE EXCEPTION 'Code de suivi requis';
  END IF;

  SELECT *
  INTO v_commande
  FROM public.cs_commandes
  WHERE code_suivi = upper(trim(p_code_suivi))
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Commande introuvable';
  END IF;

  IF NOT (
    (
      v_commande.statut = 'livree'
      AND v_commande.livraison_statut = 'livree'
    )
    OR v_commande.statut = 'retire'
  ) THEN
    RAISE EXCEPTION 'Le reçu sera disponible après réception de la commande';
  END IF;

  RETURN jsonb_build_object(
    'commande', jsonb_build_object(
      'numero', v_commande.numero,
      'nom_client', v_commande.nom_client,
      'telephone', v_commande.telephone,
      'mode_reception', v_commande.mode_reception,
      'mode_paiement', v_commande.mode_paiement,
      'adresse_livraison', v_commande.adresse_livraison,
      'sous_total', v_commande.sous_total,
      'reduction', v_commande.reduction,
      'frais_livraison', v_commande.frais_livraison,
      'total', v_commande.total,
      'acompte_requis', v_commande.acompte_requis,
      'acompte_paye', v_commande.acompte_paye,
      'statut', v_commande.statut,
      'code_suivi', v_commande.code_suivi,
      'code_retrait', CASE
        WHEN v_commande.statut = 'retire'
        THEN v_commande.code_retrait
        ELSE NULL
      END,
      'created_at', v_commande.created_at,
      'livraison_confirmee_at', v_commande.livraison_confirmee_at
    ),
    'lignes', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'nom_produit', l.nom_produit,
          'prix_unitaire', l.prix_unitaire,
          'quantite', l.quantite,
          'total_ligne', l.total_ligne,
          'origine', l.origine,
          'nom_variante', l.nom_variante
        )
        ORDER BY l.created_at, l.id
      )
      FROM public.cs_commande_lignes l
      WHERE l.commande_id = v_commande.id
    ), '[]'::jsonb)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.cs_recuperer_recu_client(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cs_recuperer_recu_client(text) TO anon, authenticated;
