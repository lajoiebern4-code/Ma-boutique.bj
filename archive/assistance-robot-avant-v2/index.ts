import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const PRODUCTION_ORIGIN =
  "https://chinashop-espress.vercel.app"

function isAllowedOrigin(origin: string) {
  if (origin === PRODUCTION_ORIGIN) return true

  try {
    const url = new URL(origin)

    return (
      url.protocol === "http:" &&
      (url.hostname === "localhost" ||
        url.hostname === "127.0.0.1")
    )
  } catch {
    return false
  }
}

function getCorsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? ""
  const allowedOrigin = isAllowedOrigin(origin)
    ? origin
    : PRODUCTION_ORIGIN

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-visitor-id, x-visitor-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
  }
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");

const SUPABASE_KEY = secretKeysRaw
  ? JSON.parse(secretKeysRaw)["default"]
  : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type Intent =
  | "GREETING"
  | "PRODUCT_SEARCH"
  | "PRODUCT_PRICE"
  | "PRODUCT_AVAILABILITY"
  | "ORDER_STATUS"
  | "DELIVERY_INFO"
  | "PICKUP_INFO"
  | "PAYMENT_INFO"
  | "DISCOUNT_INFO"
  | "HUMAN_HANDOFF"
  | "UNKNOWN";

type Identity = {
  userId: string | null;
  visitorId: string | null;
  visitorToken: string | null;
};

type Product = {
  id: string;
  nom: string;
  prix: number;
  stock: number;
  disponibilite: string;
  promo: number;
  promo_fin: string | null;
};

const json = (body: unknown, status = 200, request?: Request) =>
  new Response(JSON.stringify(body), {
    status,
    headers: request ? getCorsHeaders(request) : getCorsHeaders(new Request("https://chinashop-espress.vercel.app")),
  });

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\s#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean);
}

function hasAny(text: string, values: string[]): boolean {
  return values.some((value) => text.includes(value));
}

function classify(message: string): { intent: Intent; confidence: number } {
  const text = normalize(message);

  if (
    hasAny(text, [
      "bonjour",
      "bonsoir",
      "salut",
      "hello",
      "coucou",
      "bon matin",
    ])
  ) {
    return { intent: "GREETING", confidence: 0.98 };
  }

  if (
    hasAny(text, [
      "conseiller",
      "conseillere",
      "humain",
      "agent",
      "admin",
      "personne",
      "parler a quelqu un",
      "parler a un humain",
    ])
  ) {
    return { intent: "HUMAN_HANDOFF", confidence: 0.99 };
  }

  if (
    hasAny(text, [
      "commande",
      "colis",
      "suivi",
      "ou est ma commande",
      "ou est mon colis",
      "livraison de ma commande",
    ])
  ) {
    return { intent: "ORDER_STATUS", confidence: 0.92 };
  }

  if (
    hasAny(text, [
      "reduction",
      "remise",
      "rabais",
      "3 articles",
      "trois articles",
      "promotion",
      "promo",
    ])
  ) {
    return { intent: "DISCOUNT_INFO", confidence: 0.90 };
  }

  if (
    hasAny(text, [
      "livraison",
      "livrer",
      "livrez",
      "domicile",
      "frais de livraison",
    ])
  ) {
    return { intent: "DELIVERY_INFO", confidence: 0.90 };
  }

  if (
    hasAny(text, [
      "retrait",
      "recuperer",
      "recuperation",
      "point de retrait",
      "retirer",
    ])
  ) {
    return { intent: "PICKUP_INFO", confidence: 0.90 };
  }

  if (
    hasAny(text, [
      "paiement",
      "payer",
      "payement",
      "especes",
      "en ligne",
      "acompte",
      "cash",
    ])
  ) {
    return { intent: "PAYMENT_INFO", confidence: 0.90 };
  }

  if (
    hasAny(text, [
      "combien",
      "prix",
      "coute",
      "cout",
      "tarif",
      "a combien",
    ])
  ) {
    return { intent: "PRODUCT_PRICE", confidence: 0.84 };
  }

  if (
    hasAny(text, [
      "disponible",
      "disponibilite",
      "stock",
      "avez vous",
      "en stock",
      "sur commande",
    ])
  ) {
    return { intent: "PRODUCT_AVAILABILITY", confidence: 0.82 };
  }

  if (
    hasAny(text, [
      "cherche",
      "recherche",
      "je veux",
      "je cherche",
      "avez vous",
      "montrez moi",
      "produit",
      "sac",
      "telephone",
      "iphone",
      "samsung",
      "ordinateur",
      "macbook",
      "airpods",
      "airfryer",
    ])
  ) {
    return { intent: "PRODUCT_SEARCH", confidence: 0.78 };
  }

  return { intent: "UNKNOWN", confidence: 0 };
}

function extractProductQuery(message: string): string {
  return normalize(message)
    .replace(/\b(je|j|veux|voudrais|cherche|recherche|un|une|des|du|de|pour|avez|vous|avez-vous|montrez|moi|combien|coute|cout|prix|a|combien|disponible|disponibilite|en|stock)\b/g, " ")
    .replace(/\bmoins de\s+\d+\b/g, " ")
    .replace(/\bplus de\s+\d+\b/g, " ")
    .replace(/\d+\s*(fcfa|f|francs?)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function activePromotion(product: Product): boolean {
  if (!product.promo || product.promo <= 0) return false;

  if (!product.promo_fin) return true;

  const end = new Date(`${product.promo_fin}T23:59:59`);
  return end.getTime() >= Date.now();
}

function currentPrice(product: Product): number {
  if (!activePromotion(product)) return product.prix;

  return Math.round(product.prix * (1 - product.promo / 100));
}

function formatMoney(value: number): string {
  return `${Math.round(value).toLocaleString("fr-FR")} FCFA`;
}

async function searchProducts(query: string): Promise<Product[]> {
  const cleaned = query.trim();

  if (!cleaned) {
    const { data } = await supabase
      .from("cs_produits")
      .select("id,nom,prix,stock,disponibilite,promo,promo_fin")
      .eq("actif", true)
      .order("updated_at", { ascending: false })
      .limit(6);

    return (data ?? []) as Product[];
  }

  const tokens = words(cleaned).filter((word) => word.length >= 2);

  let request = supabase
    .from("cs_produits")
    .select("id,nom,prix,stock,disponibilite,promo,promo_fin")
    .eq("actif", true);

  if (tokens.length === 1) {
    request = request.ilike("nom", `%${tokens[0]}%`);
  } else {
    request = request.or(
      tokens
        .slice(0, 5)
        .map((token) => `nom.ilike.%${token}%`)
        .join(","),
    );
  }

  const { data, error } = await request
    .order("updated_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("PRODUCT_SEARCH_ERROR", error);
    return [];
  }

  return (data ?? []) as Product[];
}

function productDescription(product: Product): string {
  const promo = activePromotion(product);
  const price = currentPrice(product);

  let result = `**${product.nom}** — ${formatMoney(price)}`;

  if (promo) {
    result += ` (-${product.promo}%)`;
  }

  if (product.disponibilite === "stock") {
    result += product.stock > 0
      ? `\nDisponible actuellement en stock.`
      : `\nRéférencé en stock, mais le stock actuel est épuisé.`;
  } else if (product.disponibilite === "sur_commande") {
    result += `\nDisponible sur commande.`;
  }

  return result;
}

async function identify(request: Request): Promise<Identity> {
  const visitorId = request.headers.get("x-visitor-id");
  const visitorToken = request.headers.get("x-visitor-token");

  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7);

    const { data } = await supabase.auth.getUser(token);

    if (data.user) {
      return {
        userId: data.user.id,
        visitorId,
        visitorToken,
      };
    }
  }

  return {
    userId: null,
    visitorId,
    visitorToken,
  };
}

async function getConversation(
  conversationId: string,
  identity: Identity,
): Promise<boolean> {
  // Client connecté : vérification stricte de la propriété de la conversation.
  if (identity.userId) {
    const { data, error } = await supabase
      .from("cs_assistance_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("client_user_id", identity.userId)
      .maybeSingle();

    return !error && !!data;
  }

  // Visiteur : on réutilise la RPC de sécurité existante.
  // Elle vérifie visitor_id + access_token + appartenance à la conversation.
  if (identity.visitorId && identity.visitorToken) {
    const { error } = await supabase.rpc(
      "cs_assistance_visiteur_lire",
      {
        p_visitor_id: identity.visitorId,
        p_access_token: identity.visitorToken,
        p_conversation_id: conversationId,
      },
    );

    return !error;
  }

  return false;
}

async function insertRobotMessage(
  conversationId: string,
  content: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("cs_assistance_messages")
    .insert({
      conversation_id: conversationId,
      sender_type: "robot",
      sender_user_id: null,
      contenu: content,
      has_attachment: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("ROBOT_MESSAGE_ERROR", error);
    return null;
  }

  return data.id;
}

async function handoff(conversationId: string): Promise<string | null> {
  const answer =
    "Je vais transmettre votre demande à notre assistance. Un conseiller pourra prendre le relais dans cette conversation.";

  const messageId = await insertRobotMessage(conversationId, answer);

  await supabase
    .from("cs_assistance_conversations")
    .update({
      mode_assistance: "human_requested",
      needs_human_reply: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  return messageId;
}

async function orderStatus(
  conversationId: string,
  identity: Identity,
): Promise<string> {
  if (!identity.userId) {
    return "Pour consulter l'état d'une commande, vous devez être connecté à votre compte ChinaShop.";
  }

  const { data: conversation } = await supabase
    .from("cs_assistance_conversations")
    .select("commande_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation?.commande_id) {
    return "Je peux vous aider avec une commande si vous me donnez sa référence ou si elle est associée à cette conversation.";
  }

  const { data: order } = await supabase
    .from("cs_commandes")
    .select(
      "numero,statut,mode_reception,mode_paiement,total,livraison_statut,code_suivi,code_retrait",
    )
    .eq("id", conversation.commande_id)
    .eq("client_user_id", identity.userId)
    .maybeSingle();

  if (!order) {
    return "Je ne peux pas accéder à cette commande avec votre identité actuelle.";
  }

  let answer = `Commande **${order.numero}**\nStatut : **${order.statut}**`;

  if (order.mode_reception === "livraison") {
    answer += `\nMode : livraison`;

    if (order.livraison_statut) {
      answer += `\nLivraison : **${order.livraison_statut}**`;
    }

    if (order.code_suivi) {
      answer += `\nCode de suivi : **${order.code_suivi}**`;
    }
  } else {
    answer += `\nMode : retrait`;

    if (order.code_retrait) {
      answer += `\nCode de retrait : **${order.code_retrait}**`;
    }
  }

  return answer;
}

function businessAnswer(intent: Intent): string | null {
  switch (intent) {
    case "GREETING":
      return "Bonjour 👋 Je suis l'assistance ChinaShop. Je peux vous aider à trouver un produit, vérifier son prix ou sa disponibilité, vous renseigner sur les commandes, la livraison, le retrait et le paiement.";

    case "DELIVERY_INFO":
      return "La livraison à domicile entraîne des frais de 1 500 FCFA. Pour une livraison à domicile, le paiement en ligne est requis.";

    case "PICKUP_INFO":
      return "Le retrait est gratuit. Pour un retrait avec paiement en espèces, un code de retrait vous est communiqué selon le processus ChinaShop.";

    case "PAYMENT_INFO":
      return "ChinaShop propose le paiement en ligne. Pour un retrait, le paiement en espèces peut être utilisé selon les conditions de la commande. La livraison à domicile nécessite un paiement en ligne.";

    case "DISCOUNT_INFO":
      return "ChinaShop applique une réduction de 1,5 % à partir de 3 articles.";

    default:
      return null;
  }
}

async function answer(
  intent: Intent,
  message: string,
  conversationId: string,
  identity: Identity,
): Promise<string> {
  const business = businessAnswer(intent);

  if (business) return business;

  if (intent === "HUMAN_HANDOFF") {
    return "Votre demande est transmise à notre assistance. Un conseiller pourra prendre le relais dans cette conversation.";
  }

  if (intent === "ORDER_STATUS") {
    return await orderStatus(conversationId, identity);
  }

  if (
    intent === "PRODUCT_SEARCH" ||
    intent === "PRODUCT_PRICE" ||
    intent === "PRODUCT_AVAILABILITY"
  ) {
    const query = extractProductQuery(message);
    const products = await searchProducts(query);

    if (!products.length) {
      return "Je n'ai trouvé aucun produit correspondant dans le catalogue actuel. Pouvez-vous préciser le produit recherché ?";
    }

    if (intent === "PRODUCT_PRICE" && products.length === 1) {
      return productDescription(products[0]);
    }

    if (intent === "PRODUCT_AVAILABILITY" && products.length === 1) {
      return productDescription(products[0]);
    }

    return products
      .slice(0, 5)
      .map(productDescription)
      .join("\n\n");
  }

  return "Je veux être sûr de bien comprendre votre demande. Pouvez-vous préciser ce que vous recherchez ? Si vous préférez, je peux aussi vous mettre en relation avec un conseiller.";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(request) });
  }

  if (request.method !== "POST") {
    return json({ error: "Méthode non autorisée." }, 405, request);
  }

  try {
    const body = await request.json();

    const message = String(body?.message ?? "").trim();
    const conversationId = String(body?.conversation_id ?? "").trim();

    if (!message || !conversationId) {
      return json(
        { error: "message et conversation_id sont requis." },
        400,
        request,
      );
    }

    const identity = await identify(request);

    const authorized = await getConversation(
      conversationId,
      identity,
    );

    if (!authorized) {
      return json({ error: "Conversation inaccessible." }, 403, request);
    }

    const { data: conversation } = await supabase
      .from("cs_assistance_conversations")
      .select("mode_assistance,statut")
      .eq("id", conversationId)
      .maybeSingle();

    if (!conversation || conversation.statut !== "open") {
      return json({
        status: "closed",
        answer: "Cette conversation est fermée. Vous pouvez la rouvrir depuis l'assistance.",
      }, 200, request);
    }

    if (conversation.mode_assistance !== "robot_active") {
      return json({
        status: "human",
        answer: "Un conseiller est déjà en charge de cette conversation.",
      }, 200, request);
    }

    const classification = classify(message);

    if (
      classification.intent === "UNKNOWN" ||
      classification.confidence < 0.65
    ) {
      const messageId = await handoff(conversationId);

      return json({
        status: "human_requested",
        answer:
          "Je ne suis pas suffisamment sûr de comprendre votre demande. Je la transmets à un conseiller afin de vous donner une réponse fiable.",
        message_id: messageId,
        intent: classification.intent,
        confidence: classification.confidence,
      }, 200, request);
    }

    if (classification.intent === "HUMAN_HANDOFF") {
      const messageId = await handoff(conversationId);

      return json({
        status: "human_requested",
        answer:
          "Je vais transmettre votre demande à notre assistance. Un conseiller pourra prendre le relais dans cette conversation.",
        message_id: messageId,
        intent: classification.intent,
        confidence: classification.confidence,
      }, 200, request);
    }

    const response = await answer(
      classification.intent,
      message,
      conversationId,
      identity,
    );

    const messageId = await insertRobotMessage(
      conversationId,
      response,
    );

    return json({
      status: "robot",
      answer: response,
      message_id: messageId,
      intent: classification.intent,
      confidence: classification.confidence,
    }, 200, request);
  } catch (error) {
    console.error("ASSISTANCE_ROBOT_ERROR", error);

    return json(
      {
        error:
          "Une erreur technique est survenue. Veuillez réessayer ou demander l'aide d'un conseiller.",
      },
      500,
      request,
    );
  }
});
