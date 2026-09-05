import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ||
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
  "";

const AI_URL = Deno.env.get("PRODUCT_DESCRIPTION_AI_URL") || "";
const AI_SECRET = Deno.env.get("PRODUCT_DESCRIPTION_AI_SECRET") || "";

function response(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return response(
      {
        success: false,
        error: "Méthode non autorisée.",
      },
      405,
    );
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("CONFIG_SUPABASE_MANQUANTE");

      return response(
        {
          success: false,
          error: "Configuration Supabase serveur absente.",
        },
        500,
      );
    }

    if (!AI_URL || !AI_SECRET) {
      console.error("CONFIG_AI_DESCRIPTION_MANQUANTE");

      return response(
        {
          success: false,
          error: "Service de génération de description non configuré.",
        },
        503,
      );
    }

    const token = getBearerToken(req);

    if (!token) {
      return response(
        {
          success: false,
          error: "Authentification requise.",
        },
        401,
      );
    }

    /*
     * Client Supabase lié à la session de l'utilisateur.
     * Cela permet à auth.uid() de fonctionner dans cs_est_admin().
     */
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      console.error("AUTH_DESCRIPTION_ERROR", userError);

      return response(
        {
          success: false,
          error: "Session utilisateur invalide.",
        },
        401,
      );
    }

    /*
     * Autorisation serveur :
     * on utilise exactement le RPC existant.
     * Aucune confiance dans user_metadata.
     */
    const { data: estAdmin, error: adminError } =
      await supabase.rpc("cs_est_admin");

    if (adminError) {
      console.error("ADMIN_CHECK_DESCRIPTION_ERROR", adminError);

      return response(
        {
          success: false,
          error: "Impossible de vérifier les droits administrateur.",
        },
        500,
      );
    }

    if (estAdmin !== true) {
      return response(
        {
          success: false,
          error: "Accès administrateur requis.",
        },
        403,
      );
    }

    const body = await req.json();

    const produit = body?.produit;

    if (!produit || typeof produit !== "object") {
      return response(
        {
          success: false,
          error: "Informations produit manquantes.",
        },
        400,
      );
    }

    const nom = cleanString(produit.nom, 200);
    const categorie = cleanString(produit.categorie, 120);
    const sousCategorie = cleanString(produit.sousCategorie, 120);
    const genre = cleanString(produit.genre, 80);
    const prix = cleanString(produit.prix, 50);
    const disponibilite = cleanString(produit.disponibilite, 50);
    const stock = cleanString(produit.stock, 50);
    const caracteristiques = cleanString(produit.caracteristiques, 3000);
    const descriptionActuelle = cleanString(
      produit.description,
      5000,
    );

    if (!nom) {
      return response(
        {
          success: false,
          error: "Le nom du produit est obligatoire.",
        },
        400,
      );
    }

    /*
     * L'image doit être envoyée sous forme de data URL.
     * Le frontend pourra compresser l'image avant l'envoi.
     */
    const image = cleanString(body?.image, 8_000_000);

    if (image && !/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(image)) {
      return response(
        {
          success: false,
          error: "Format d’image non pris en charge.",
        },
        400,
      );
    }

    const aiPayload = {
      product: {
        nom,
        categorie,
        sousCategorie,
        genre,
        prix,
        disponibilite,
        stock,
        caracteristiques,
        descriptionActuelle,
      },
      image: image || null,
      instructions: {
        language: "français",
        audience: "clients de ChinaShop-Benin",
        goal: "Créer une description commerciale claire, naturelle et attractive.",
        rules: [
          "Utiliser uniquement les informations fournies.",
          "Utiliser uniquement ce qui est clairement observable sur la photo.",
          "Ne jamais inventer une marque, un modèle ou une référence.",
          "Ne jamais inventer une matière.",
          "Ne jamais inventer des dimensions ou un poids.",
          "Ne jamais inventer une capacité ou des performances.",
          "Ne jamais inventer une compatibilité.",
          "Ne jamais inventer une garantie ou une certification.",
          "Ne jamais inventer des accessoires ou éléments inclus.",
          "Si une information ne peut pas être confirmée, l’omettre.",
          "Produire directement la description destinée au client.",
          "Ne pas ajouter de commentaire sur le fonctionnement de l’IA.",
        ],
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const aiResponse = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-product-description-secret": AI_SECRET,
        },
        body: JSON.stringify(aiPayload),
        signal: controller.signal,
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text().catch(() => "");

        console.error(
          "PRODUCT_DESCRIPTION_AI_ERROR",
          aiResponse.status,
          errorText.slice(0, 1000),
        );

        return response(
          {
            success: false,
            error: "La génération de la description a échoué.",
          },
          502,
        );
      }

      const data = await aiResponse.json();

      const description =
        typeof data?.description === "string"
          ? data.description.trim()
          : "";

      if (!description) {
        console.error("PRODUCT_DESCRIPTION_EMPTY");

        return response(
          {
            success: false,
            error: "L’IA n’a pas retourné de description.",
          },
          502,
        );
      }

      return response({
        success: true,
        description,
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("GENERER_DESCRIPTION_PRODUIT_ERROR", error);

    if (error instanceof SyntaxError) {
      return response(
        {
          success: false,
          error: "Requête JSON invalide.",
        },
        400,
      );
    }

    return response(
      {
        success: false,
        error: "Erreur lors de la génération de la description.",
      },
      500,
    );
  }
});
