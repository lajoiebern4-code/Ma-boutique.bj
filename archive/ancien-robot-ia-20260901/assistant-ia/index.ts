import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, messages = [] } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message invalide." }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY non configurée." }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({
          error: "Configuration Supabase de l'assistant incomplète.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Récupération du catalogue actif depuis Supabase.
    const debutSupabase = Date.now();
    const produitsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/cs_produits?select=id,nom,prix,stock,disponibilite,actif,cs_produit_details(description,prix_original,categorie,sous_categorie,genre,promo,nouveau,promo_fin)&actif=eq.true&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    );

    if (!produitsResponse.ok) {
      const erreurSupabase = await produitsResponse.text();
      console.error("Erreur catalogue Supabase:", erreurSupabase);

      return new Response(
        JSON.stringify({
          error: "Impossible de récupérer le catalogue.",
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const produits = await produitsResponse.json();

    console.log("Assistant IA - Supabase :", {
      millisecondes: Date.now() - debutSupabase,
      produits: Array.isArray(produits) ? produits.length : 0,
    });

    const catalogue = (produits ?? []).map((produit: any) => {
      const details = Array.isArray(produit.cs_produit_details)
        ? produit.cs_produit_details[0]
        : produit.cs_produit_details;

      return {
        nom: produit.nom,
        prix: Number(produit.prix) || 0,
        prixOriginal:
          details?.prix_original != null
            ? Number(details.prix_original)
            : null,
        stock: Number(produit.stock) || 0,
        disponibilite: produit.disponibilite || "",
        categorie: details?.categorie || "",
        sousCategorie: details?.sous_categorie || "",
        genre: details?.genre || "",
        promo: Number(details?.promo) || 0,
        nouveau: Boolean(details?.nouveau),
        description: details?.description || "",
        promoFin: details?.promo_fin || null,
      };
    });

    const contexteCatalogue = JSON.stringify(catalogue);

    const systemInstruction = `
Tu es l'assistant officiel de ChinaShop-Bénin.

Tu réponds en français, de manière claire, courte, professionnelle et naturelle.

RÈGLES ABSOLUES :
- Utilise uniquement les informations présentes dans le catalogue fourni.
- Ne jamais inventer un produit.
- Ne jamais inventer un prix.
- Ne jamais inventer une disponibilité ou un stock.
- Si le produit demandé n'existe pas dans le catalogue, dis-le clairement.
- Si tu ne trouves pas suffisamment d'informations, indique que tu ne peux pas confirmer.
- Les prix sont en FCFA.
- Pour le stock, considère stock > 0 comme disponible en stock.
- Si disponibilite indique "sur_commande", précise que le produit est sur commande.
- Ne révèle jamais les identifiants internes.
- Ne parle jamais de clés API, Supabase, Gemini ou de détails techniques internes.
- Ne prétends pas avoir effectué une commande ou un paiement.
- Pour une demande générale, présente seulement les produits réellement présents dans le catalogue.

CATALOGUE ACTUEL :
${contexteCatalogue}
`;

        const historiqueValide = Array.isArray(messages)
          ? messages
              .slice(-20)
              .filter(
                (item: any) =>
                  (item?.role === "user" || item?.role === "assistant") &&
                  typeof item?.content === "string" &&
                  item.content.trim(),
              )
          : [];

        const dernierMessage = historiqueValide[historiqueValide.length - 1];
        const historiqueAvecMessage =
          dernierMessage?.role === "user" &&
          dernierMessage?.content?.trim() === message.trim()
            ? historiqueValide
            : [
                ...historiqueValide,
                { role: "user", content: message.trim() },
              ];

        const contents = historiqueAvecMessage.map((item: any) => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: item.content.trim() }],
      }));

      async function appelerGemini(modele: string): Promise<string> {
        const debutGemini = Date.now();
        let derniereErreur: unknown = null;

        for (let tentative = 1; tentative <= 2; tentative++) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);

            const geminiResponse = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-goog-api-key": GEMINI_API_KEY,
                },
                body: JSON.stringify({
                  systemInstruction: {
                    parts: [{ text: systemInstruction }],
                  },
                  contents,
                }),
                signal: controller.signal,
              },
            );

            clearTimeout(timeout);

            const geminiData = await geminiResponse.json();

            if (geminiResponse.ok) {
              const texte =
                geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

              if (texte) {
                console.log("Assistant IA - Gemini :", {
                  millisecondes: Date.now() - debutGemini,
                  modele,
                });
                return texte;
              }

              derniereErreur = new Error("Réponse Gemini vide.");
            } else {
              console.error(`Gemini ${modele} erreur:`, {
                status: geminiResponse.status,
                data: geminiData,
              });

              derniereErreur = geminiData;

              if (![429, 500, 502, 503, 504].includes(geminiResponse.status)) {
                break;
              }
            }
          } catch (error) {
            console.error(`Gemini ${modele} exception:`, error);
            derniereErreur = error;
          }

          if (tentative < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        throw derniereErreur ?? new Error("Gemini indisponible.");
      }

      let answer: string;

      try {
        answer = await appelerGemini("gemini-3.6-flash");
      } catch (erreur) {
        console.error("Assistant IA : Gemini indisponible.", erreur);

        return new Response(
          JSON.stringify({
            error: "Le service IA est temporairement indisponible.",
          }),
          {
            status: 503,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }

        return new Response(
          JSON.stringify({ answer }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
  } catch (error) {
    console.error("assistant-ia error:", error);

    return new Response(
      JSON.stringify({
        error: "Une erreur est survenue.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
