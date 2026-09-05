import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ORIGIN = "https://chinashop-espress.vercel.app";
const AI_BRAIN_URL = "https://chinashop-ai-brain-test.lajoiebern4.workers.dev/";
const AI_BRAIN_INTERNAL_SECRET = Deno.env.get("AI_BRAIN_INTERNAL_SECRET") || "";
const url = Deno.env.get("SUPABASE_URL")!;
const secretMap = Deno.env.get("SUPABASE_SECRET_KEYS");
const key = secretMap ? JSON.parse(secretMap).default : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(url, key);


async function callV6(message:string, safeContext:{intent:Intent|null;answer_context:string|null;conversation_summary:string|null}){
  if(!AI_BRAIN_INTERNAL_SECRET)return null;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  try{
    const response=await fetch(AI_BRAIN_URL,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-ai-brain-secret":AI_BRAIN_INTERNAL_SECRET
      },
      body:JSON.stringify({message,context:safeContext}),
      signal:controller.signal
    });
    if(!response.ok)return null;
    const data=await response.json();
    return data?.ok===true&&typeof data?.answer==="string"&&data.answer.trim()?data.answer.trim():null;
  }catch(e){
    console.error("V2_TO_V6_ERROR",e);
    return null;
  }finally{
    clearTimeout(timeout);
  }
}

type Intent = "GREETING"|"PRODUCT_SEARCH"|"PRODUCT_PRICE"|"PRODUCT_AVAILABILITY"|"PROMO"|"NEW"|"DELIVERY"|"PICKUP"|"PAYMENT"|"DISCOUNT"|"ORDER_STATUS"|"ORDER_PROCESS"|"TRACKING_HELP"|"ON_ORDER"|"DEPOSIT"|"SITE"|"ACCOUNT"|"LEVEL"|"REFERRAL"|"NOTIFICATIONS"|"PRIVACY"|"CUSTOM_SOURCING"|"HUMAN"|"UNKNOWN";
type Identity={userId:string|null;visitorId:string|null;visitorToken:string|null};
type ProductRow={
  id:string;
  nom:string;
  prix:number;
  stock:number;
  disponibilite:string;
  promo:number|null;
  promo_fin:string|null;
  nouveau?:boolean;
  categorie?:string|null;
  sous_categorie?:string|null;
  genre?:string|null;
};
type Context={intent:Intent|null;productTerm:string|null;budget:number|null;availability:"stock"|"sur_commande"|null};

function headers(r:Request){const o=r.headers.get("origin")||"";let a=ORIGIN;try{const u=new URL(o);if(o===ORIGIN||(u.protocol==="http:"&&(u.hostname==="localhost"||u.hostname==="127.0.0.1")))a=o}catch{}return{"Access-Control-Allow-Origin":a,"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-visitor-id, x-visitor-token","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin","Content-Type":"application/json; charset=utf-8"}}
function out(r:Request,b:unknown,s=200){return new Response(JSON.stringify(b),{status:s,headers:headers(r)})}
function norm(v:string){return v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[’']/g," ").replace(/[^a-z0-9\s#%-]/g," ").replace(/\s+/g," ").trim()}
function has(t:string,arr:string[]){return arr.some(x=>t.includes(x))}
function money(n:number){return `${Math.round(n).toLocaleString("fr-FR")} FCFA`}
function parseMoney(v:string){
  const raw=norm(v);
  const t=raw.replace(/\s+/g,"");
  let m=t.match(/(\d+(?:[.,]\d+)?)k\b/);
  if(m)return Math.round(Number(m[1].replace(",","."))*1000);
  m=raw.match(/(\d[\d\s.]*)\s*(?:fcfa|f|francs?)\b/);
  if(m)return Number(m[1].replace(/[\s.]/g,""));
  m=raw.match(/(?:moins de|maximum de|au plus|jusqu(?:'|’)à)\s*(\d[\d\s.]*)/);
  if(m)return Number(m[1].replace(/[\s.]/g,""));
  return null
}
function ref(v:string){const t=v.toUpperCase().replace(/[–—]/g,"-");let m=t.match(/\bCS\s*-\s*(\d{6})\b/);if(m)return{field:"code_suivi" as const,value:`CS-${m[1]}`};m=t.match(/\bCR\s*-\s*(\d{6})\b/);if(m)return{field:"code_retrait" as const,value:`CR-${m[1]}`};m=t.match(/\b[A-Z]{2,10}\s*-\s*\d{6,}\b/);return m?{field:"numero" as const,value:m[0].replace(/\s+/g,"")}:null}

const ALIASES:Record<string,string[]>={
  tv:["tv","tele","television","televiseur","televiseurs","smart tv"],
  telephone:["telephone","telephones","smartphone","smartphones","portable","portables","mobile","mobiles","iphone","iphones","samsung","galaxy"],
  ordinateur:["ordinateur","ordinateurs","pc","laptop","laptops","notebook","notebooks","macbook"],
  robot:["robot","robots","robot menager","robot menagers","robot menager","robots menagers"],
  aspirateur:["aspirateur","aspirateurs","aspirateur robot","aspirateurs robots"],
  mixeur:["mixeur","mixeurs","blender","blenders","mixer","mixers"],
  friteuse:["friteuse","friteuses","air fryer","air fryers","fryer","fryers"],
  chaussure:["chaussure","chaussures","basket","baskets","sneaker","sneakers","sandale","sandales"],
  sac:["sac","sacs","sac a main","sacs a main","sac a main","sacs a main"],
  vetement:["vetement","vetements","habit","habits","vetement homme","vetements homme","vetement femme","vetements femme"],
  robe:["robe","robes"],
  pantalon:["pantalon","pantalons"],
  meuble:["meuble","meubles","canape","canapes","table","tables","chaise","chaises"],
  cuisine:["cuisine","cuisines","cuisiniere","cuisinieres","four","fours","micro onde","micro ondes","refrigerateur","refrigerateurs","frigo","frigos","ventilateur","ventilateurs","climatiseur","climatiseurs"],
  montre:["montre","montres","smartwatch","smartwatches"],
  ecouteur:["ecouteur","ecouteurs","earbud","earbuds","casque","casques"],
  valise:["valise","valises","bagage","bagages"],
  perruque:["perruque","perruques","cheveux"],
  voiture:["voiture","voitures","auto","automobile","automobiles","vehicule","vehicules"],
  moto:["moto","motos","scooter","scooters"]
};

const CATEGORY_MAP:Record<string,string[]>={
  telephone:["telephones"],
  tv:["electronique"],
  ordinateur:["ordinateur"],
  ecouteur:["audio"],
  robot:["electromenager"],
  aspirateur:["electromenager"],
  mixeur:["electromenager"],
  friteuse:["electromenager"],
  cuisine:["cuisine"],
  vetement:["vetements"],
  robe:["vetements"],
  pantalon:["vetements"],
  chaussure:["chaussures"],
  sac:["sacs"],
  montre:["electronique"],
  meuble:["meubles"],
  valise:["bagagerie"],
  perruque:["beaute"]
};

const STOP=new Set(["je","j","veux","voudrais","cherche","recherche","il","me","faut","un","une","des","le","la","les","du","de","pour","avec","sur","dans","chez","vous","avez","avez vous","proposez","vendez","acheter","achat","commander","commande","article","articles","produit","produits","quel","quelle","quels","quelles","que","quoi","est","sont","comme","comment","combien","prix","cout","coute","disponible","disponibilite","stock","actuellement","maintenant","moi","mon","ma","mes","ce","cet","cette","ces","qui","va","etre","ajouter","ajoute","site","peux","peut","pouvez","pas","plus","moins","cher","chere","et","ou","a","au","aux","en","k","fcfa","franc","francs"]);

function singularToken(v:string){
  const t=norm(v);
  if(t==="moins")return t;
  if(t.length<=3)return t;
  if(t.endsWith("aux")&&t.length>4)return t.slice(0,-3)+"al";
  if(t.endsWith("s")&&!t.endsWith("ss"))return t.slice(0,-1);
  return t;
}

function tokenList(v:string){
  return norm(v).split(/\s+/).filter(Boolean).map(singularToken);
}

function phraseTokensMatch(text:string,phrase:string){
  const a=tokenList(text);
  const b=tokenList(phrase);
  if(!b.length)return false;
  if(b.length===1)return a.includes(b[0]);
  for(let i=0;i<=a.length-b.length;i++){
    let ok=true;
    for(let j=0;j<b.length;j++)if(a[i+j]!==b[j]){ok=false;break}
    if(ok)return true;
  }
  return false;
}

function aliasMatches(t:string,w:string){
  return phraseTokensMatch(t,w);
}

function matchedAlias(t:string){
  const n=norm(t);
  const candidates:{key:string;score:number}[]=[];
  for(const [key,words] of Object.entries(ALIASES)){
    for(const w of words){
      if(aliasMatches(n,w)){
        const nw=tokenList(w).length;
        const score=nw*100+(w.length);
        candidates.push({key,score});
      }
    }
  }
  candidates.sort((a,b)=>b.score-a.score);
  return candidates[0]?.key||null;
}

function extractCandidate(m:string){
  const t=norm(m);

  // Superlatifs : "quel est le téléphone le moins cher",
  // "quel est le téléphone le plus cher", etc.
  const superMatch=t.match(/\b(?:quel|quelle)\s+(?:est\s+)?(?:le|la)\s+(.+?)\s+(le|la)\s+(moins|plus)\s+cher(?:e)?\s*$/);
  if(superMatch){
    const meaningful=superMatch[1]
      .split(/\s+/)
      .map(singularToken)
      .filter(x=>x&&!STOP.has(x)&&x!=="moin"&&x!=="moins"&&x!=="plus"&&x!=="plu"&&x!=="cher"&&x!=="chere");
    if(meaningful.length)return meaningful.join(" ");
    return null;
  }

  // Variante générique : "le moins cher" / "le plus cher".
  if(/\b(?:le|la)\s+(?:moins|plus)\s+cher(?:e)?\s*$/.test(t)){
    const candidate=t
      .replace(/\b(?:le|la)\s+(?:moins|plus)\s+cher(?:e)?\s*$/,"")
      .trim();

    const meaningful=candidate
      .split(/\s+/)
      .map(singularToken)
      .filter(x=>x&&!STOP.has(x)&&x!=="moin"&&x!=="moins"&&x!=="plus"&&x!=="plu"&&x!=="cher"&&x!=="chere");

    if(meaningful.length)return meaningful.join(" ");
    return null;
  }

  const patterns=[
    /\b(?:je veux|je cherche|je voudrais|il me faut|montrez moi|donnez moi|je prends)\s+(?:un|une|des)?\s*([^?!.;,]+)/,
    /\b(?:un|une|des)\s+([^?!.;,]+)/
  ];

  for(const p of patterns){
    const x=t.match(p);
    if(x){
      let v=x[1].trim();

      // Retirer les contraintes de budget du candidat produit.
      v=v
        .replace(/\b(?:a|avec|pour|dans|sur)\s+(?:moins|plus)\s+de\s+\d[\d\s.,]*\s*(?:fcfa|f|francs?)?\b.*$/," ")
        .replace(/\b(?:moins|plus)\s+de\s+\d[\d\s.,]*\s*(?:fcfa|f|francs?)?\b.*$/," ")
        .replace(/\b\d[\d\s.,]*\s*(?:fcfa|f|francs?)\b.*$/," ")
        .replace(/\b(?:a|avec|pour|dans|sur|mais|et)\s+\d+[a-z]?\b.*$/," ")
        .trim();

      const meaningful=v
        .split(/\s+/)
        .map(singularToken)
        .filter(x=>x&&!STOP.has(x)&&x!=="moin"&&x!=="moins"&&x!=="plus"&&x!=="plu"&&x!=="cher"&&x!=="chere");

      if(meaningful.length>1)return meaningful.join(" ");
      if(meaningful.length===1)return meaningful[0];
    }
  }

  let questionCandidate=t;
  questionCandidate=questionCandidate
    .replace(/^quel(?:le)?\s+est\s+/,"")
    .replace(/^quels?\s+/,"")
    .replace(/^quelles?\s+/,"")
    .replace(/^avez[- ]vou(?:s)?\s+/,"")
    .replace(/^vou(?:s)?\s+avez\s+/,"")
    .replace(/^que\s+proposez[- ]vou(?:s)?\s+/,"")
    .replace(/^que\s+vendez[- ]vou(?:s)?\s+/,"")
    .replace(/\s+avez[- ]vou(?:s)?\s*$/,"")
    .replace(/\s+vou(?:s)?\s+avez\s*$/,"")
    .replace(/\s+proposez[- ]vou(?:s)?\s*$/,"")
    .replace(/\s+vendez[- ]vou(?:s)?\s*$/,"")
    .replace(/\s+(?:le|la)\s+(?:moins|plus)\s+cher(?:e)?\s*$/,"")
    .replace(/\s+(?:moins|plus)\s+cher(?:e)?\s*$/,"")
    .replace(/\b(?:moins|plus)\s+de\s+\d[\d\s.,]*\s*(?:fcfa|f|francs?)?\b.*$/,"")
    .replace(/\b\d[\d\s.,]*\s*(?:fcfa|f|francs?)\b.*$/,"")
    .trim();

  const questionTokens=tokenList(questionCandidate)
    .filter(x=>x&&!STOP.has(x)&&x!=="moin"&&x!=="moins"&&x!=="plus"&&x!=="plu"&&x!=="cher"&&x!=="chere");

  if(questionTokens.length>1)return questionTokens.join(" ");
  if(questionTokens.length===1)return questionTokens[0];

  const alias=matchedAlias(t);
  if(alias)return alias;

  return null;
}
function canonicalTerms(term:string){
  const t=norm(term);
  const out=new Set<string>();
  if(!t)return [];

  for(const x of tokenList(t)){
    if(x.length>1&&!STOP.has(x))out.add(x);
  }

  const alias=matchedAlias(t);

  if(alias){
    const genericQueries:Record<string,string[]>={
      telephone:["telephone","telephones","smartphone","smartphones","portable","portables","mobile","mobiles"],
      tv:["tv","tele","television","televiseur","televiseurs","smart tv"],
      ordinateur:["ordinateur","ordinateurs","pc","laptop","laptops","notebook","notebooks"],
      chaussure:["chaussure","chaussures","basket","baskets","sneaker","sneakers","sandale","sandales"],
      sac:["sac","sacs","sac a main","sacs a main"],
      vetement:["vetement","vetements","habit","habits"],
      robe:["robe","robes"],
      pantalon:["pantalon","pantalons"],
      meuble:["meuble","meubles","canape","canapes","table","tables","chaise","chaises"],
      cuisine:["cuisine","cuisines","cuisiniere","cuisinieres","four","fours","micro onde","micro ondes","refrigerateur","refrigerateurs","frigo","frigos"],
      montre:["montre","montres","smartwatch","smartwatches"],
      ecouteur:["ecouteur","ecouteurs","earbud","earbuds","casque","casques"],
      valise:["valise","valises","bagage","bagages"],
      perruque:["perruque","perruques","cheveux"],
      voiture:["voiture","voitures","auto","automobile","automobiles","vehicule","vehicules"],
      moto:["moto","motos","scooter","scooters"],
      robot:["robot","robots","robot menager","robot menagers"],
      aspirateur:["aspirateur","aspirateurs","aspirateur robot","aspirateurs robots"],
      mixeur:["mixeur","mixeurs","blender","blenders","mixer","mixers"],
      friteuse:["friteuse","friteuses","air fryer","air fryers","fryer","fryers"]
    };

    const generic=genericQueries[alias]||[];
    const isGeneric=generic.some(x=>norm(x)===t);
    const aliasFound=generic.some(x=>aliasMatches(t,x));

    if(isGeneric||aliasFound){
      out.add(alias);
      for(const c of CATEGORY_MAP[alias]||[])out.add(norm(c));
    }
  }

  return [...out];
}
function availabilityOf(p:ProductRow){return p.disponibilite==="stock"?(Number(p.stock)>0?"stock":"epuise"):"sur_commande"}
function currentPrice(p:ProductRow){const promo=Number(p.promo||0)>0&&(!p.promo_fin||new Date(p.promo_fin)>=new Date());return promo?Math.round(Number(p.prix)*(1-Number(p.promo)/100)):Number(p.prix)}

async function identity(r:Request):Promise<Identity>{const vid=r.headers.get("x-visitor-id"),vt=r.headers.get("x-visitor-token"),a=r.headers.get("authorization");if(a?.startsWith("Bearer ")){const {data}=await db.auth.getUser(a.slice(7));if(data.user)return{userId:data.user.id,visitorId:vid,visitorToken:vt}}return{userId:null,visitorId:vid,visitorToken:vt}}
async function conversation(id:string){const {data}=await db.from("cs_assistance_conversations").select("id,commande_id,visitor_id,client_user_id,mode_assistance,statut").eq("id",id).maybeSingle();return data}
async function sha256Hex(v:string){
  const bytes=new TextEncoder().encode(v);
  const hash=await crypto.subtle.digest("SHA-256",bytes);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
async function allowed(id:string,i:Identity){
  if(i.userId){
    const {data,error}=await db.from("cs_assistance_conversations").select("id").eq("id",id).eq("client_user_id",i.userId).maybeSingle();
    return !error&&!!data;
  }
  if(i.visitorId&&i.visitorToken){
    const {data:visitor,error:visitorError}=await db.from("cs_assistance_visitors").select("access_token_hash").eq("id",i.visitorId).maybeSingle();
    if(visitorError||!visitor?.access_token_hash)return false;
    const hash=await sha256Hex(i.visitorToken);
    if(hash!==visitor.access_token_hash)return false;
    const {data:conversation,error:conversationError}=await db.from("cs_assistance_conversations").select("id").eq("id",id).eq("visitor_id",i.visitorId).maybeSingle();
    return !conversationError&&!!conversation;
  }
  return false;
}
async function addRobot(id:string,text:string){const {data,error}=await db.from("cs_assistance_messages").insert({conversation_id:id,sender_type:"robot",contenu:text,has_attachment:false}).select("id").single();if(error){console.error("robot message",error);return null}return data.id}

function detectIntent(t:string):Intent{
  if(has(t,["bonjour","bonsoir","salut","hello","coucou"]))return "GREETING";
  if(has(t,["conseiller","conseillere","humain","agent","administrateur","admin","service client","personne"] )&&has(t,["parler","contact","aide","veux","avec","demande"]))return "HUMAN";
  if(has(t,["remboursement","rembourser","retour produit","garantie","echange","retour"] ))return "SITE";
  if(has(t,["quel produit va","quelle produit va","quel article va","quelle article va","sera ajoute","va etre ajoute","va être ajouté","prochain produit","futur produit","nouveau produit qui sera ajoute"]))return "UNKNOWN";
  if(has(t,["acheter pour moi","commander pour moi","faire venir","importer pour moi","rechercher pour moi","chercher pour moi","trouver cet article","hors catalogue","pas dans le catalogue","absent du catalogue","vous pouvez me l acheter","vous pouvez l acheter","pouvez vous me l acheter","pouvez vous le commander"]))return "CUSTOM_SOURCING";
  if(has(t,["comment suivre","etapes pour suivre","étapes pour suivre","procedure pour suivre","procédure pour suivre","suivre une commande","suivi d une commande","suivre mon colis"]))return "TRACKING_HELP";
  if(ref(t)||has(t,["ou est ma commande","où est ma commande","ou est mon colis","où est mon colis","statut de ma commande","etat de ma commande","état de ma commande","commande en est ou","commande en est où"]))return "ORDER_STATUS";
  if(has(t,["comment commander","comment passer commande","passer une commande","etapes de commande","étapes de commande","processus de commande","procedure de commande","procédure de commande"]))return "ORDER_PROCESS";
  if(has(t,["acompte","avance","depot","dépôt","50 pourcent","50 %"]))return "DEPOSIT";
  if(has(t,["promotion","promotions","promo","produits en promotion","articles en promotion","soldes"]))return "PROMO";
  if(has(t,["nouveaute","nouveautés","nouveau produit","nouveaux produits","nouvel article","nouveaux articles"]))return "NEW";
  if(has(t,["reduction","réduction","remise","rabais","1 5","1.5","trois articles","3 articles"]))return "DISCOUNT";
  if(has(t,["livraison","livrer","livrez","domicile","frais de livraison","tarif livraison","zone de livraison","livraison coute","livraison coûte"]))return "DELIVERY";
  if(has(t,["retrait","recuperer","récupérer","recuperation","récupération","point de retrait","retirer"]))return "PICKUP";
  if(has(t,["paiement","payer","payement","especes","espèces","en ligne","cash","mobile money"]))return "PAYMENT";
  if(has(t,["niveau bronze","niveau argent","niveau or","niveau platine","mon niveau","prochain niveau"]))return "LEVEL";
  if(has(t,["parrain","parrainage","filleul","code parrainage"]))return "REFERRAL";
  if(has(t,["notification","notifications","alerte commande","alerte livraison"]))return "NOTIFICATIONS";
  if(has(t,["confidentialite","confidentialité","vie privee","vie privée","donnees personnelles","données personnelles"]))return "PRIVACY";
  if(has(t,["mon compte","compte client","connexion","inscription","mot de passe","favori","favoris","mes commandes"]))return "ACCOUNT";
  if(has(t,["sur commande","a commander","à commander","disponible sur commande","articles sur commande","produits sur commande"]))return "ON_ORDER";
  if(has(t,["en stock","dans le stock","articles disponibles","produits disponibles","disponible actuellement","disponibilite","disponibilité","stock actuellement"]))return "PRODUCT_AVAILABILITY";
  if(has(t,["moins cher","moins chère","moins chere","moins coûteux","moins couteux","prix le plus bas","le moins cher","la moins chere","le moins chère","plus cher","plus chère","plus chere","plus coûteux","plus couteux","prix le plus haut","le plus cher","la plus chere","le plus chère"]))return "PRODUCT_PRICE";
  if(has(t,["prix","combien coute","combien coûte","combien ca coute","combien ça coûte","tarif"]))return "PRODUCT_PRICE";
  if(extractCandidate(t)||matchedAlias(t)||has(t,["acheter","cherche","recherche","je veux","je voudrais","quel article","quelle article","quel produit","quelle produit","que vendez vous","que vendez-vous","vous avez quoi","vous proposez quoi","je peux acheter quoi","quels articles","quelles articles","quels produits","quelles produits","quels telephones","quelles telephones","quels smartphones","quels televiseurs","quelles chaussures","quels sacs"]))return "PRODUCT_SEARCH";
  if(has(t,["site","chinashop","information du site","informations du site","conditions","fonctionnement","comment ca marche","comment ça marche","delai","délai"]))return "SITE";
  return "UNKNOWN";
}

async function context(id:string):Promise<Context>{const {data}=await db.from("cs_assistance_messages").select("sender_type,contenu,created_at").eq("conversation_id",id).order("created_at",{ascending:false}).limit(30);const rows=(data||[]).reverse() as any[];let c:Context={intent:null,productTerm:null,budget:null,availability:null};for(const r of rows){if(r.sender_type!=="client")continue;const m=String(r.contenu||""),t=norm(m),p=parseMoney(m),candidate=extractCandidate(m),intent=detectIntent(t);if(p!==null)c.budget=p;if(candidate&&!/\b(?:le|la)\s+(?:moins|plus)\s+cher(?:e)?\b/.test(t)&&!/\bprix\s+le\s+plus\s+(?:bas|haut)\b/.test(t))c.productTerm=candidate;if(intent!=="UNKNOWN")c.intent=intent;if(has(t,["en stock","dans le stock","stock actuellement"]))c.availability="stock";if(has(t,["sur commande","a commander","à commander"]))c.availability="sur_commande"}return c}

function mergedIntent(message:string,h:Context){const t=norm(message),now=detectIntent(t);if(now!=="UNKNOWN")return now;if(has(t,["tu ne sais pas","vous ne savez pas","donc","et alors","d accord","daccord","ok","oui","non","plus d infos","plus dinfos","c est tout"]))return h.intent||"UNKNOWN";return h.intent||"UNKNOWN"}
function productNeed(t:string){return has(t,["en stock","stock","actuellement en stock","disponible maintenant","disponibles maintenant"]) ? "stock" : has(t,["sur commande","a commander","à commander","commander"])?"sur_commande":null}
function budgetOr(t:string,h:Context){return parseMoney(t)??h.budget}
function productMatchScore(p:ProductRow,terms:string[]){
  const fields=[
    {value:norm(p.nom),weight:1},
    {value:norm(p.categorie||""),weight:2},
    {value:norm(p.sous_categorie||""),weight:1.5},
    {value:norm(p.genre||""),weight:2}
  ];

  let score=0;

  const normalizedTerms=terms
    .map(x=>norm(x))
    .filter(Boolean);

  const genericTerms=new Set([
    "telephone","tv","ordinateur","chaussure","sac","vetement",
    "robe","pantalon","meuble","cuisine","montre","ecouteur",
    "valise","perruque","voiture","moto","robot","aspirateur",
    "mixeur","friteuse"
  ]);

  const specificTerms=normalizedTerms.filter(term=>{
    return !genericTerms.has(term);
  });

  for(const term of normalizedTerms){
    const termTokens=tokenList(term).filter(Boolean);
    if(!termTokens.length)continue;

    for(const field of fields){
      const value=field.value;
      if(!value)continue;

      const valueTokens=tokenList(value);

      if(termTokens.length===1){
        const token=termTokens[0];

        if(valueTokens.includes(token)){
          score+=100*field.weight;
          continue;
        }

        if(value.includes(token)){
          score+=35*field.weight;
        }
        continue;
      }

      const matched=termTokens.filter(token=>valueTokens.includes(token));

      if(matched.length===termTokens.length){
        score+=100*field.weight;
      }else if(matched.length>0){
        score+=25*field.weight*matched.length;
      }
    }
  }

  if(specificTerms.length>0){
    for(const term of specificTerms){
      const tokens=tokenList(term).filter(Boolean);
      if(!tokens.length)continue;

      const matchedSpecific=tokens.some(token=>
        fields.some(field=>tokenList(field.value).includes(token))
      );

      if(!matchedSpecific)return 0;
    }
  }

  return score;
}

async function loadProducts(){
  const {data:products,error:productsError}=await db
    .from("cs_produits")
    .select("id,nom,prix,stock,disponibilite,promo,promo_fin,actif");

  if(productsError){
    console.error("loadProducts produits",productsError);
    return null;
  }

  const rows=(products||[]) as ProductRow[];
  if(!rows.length)return rows;

  const ids=rows.map(p=>p.id);

  const {data:details,error:detailsError}=await db
    .from("cs_produit_details")
    .select("produit_id,categorie,sous_categorie,genre,nouveau")
    .in("produit_id",ids);

  if(detailsError){
    console.error("loadProducts details",detailsError);
    return null;
  }

  console.log("V2_RUNTIME_PRODUCTS",JSON.stringify({
    products_count: rows.length,
    details_count: (details||[]).length,
    phones: rows
      .map(p=>{
        const d=(details||[]).find((x:any)=>String(x.produit_id)===String(p.id));
        return {
          nom:p.nom,
          categorie:d?.categorie??null,
          sous_categorie:d?.sous_categorie??null,
          genre:d?.genre??null
        };
      })
      .filter(x=>String(x.categorie||"").toLowerCase().includes("telephone"))
      .slice(0,10)
  }));

  const byProduct=new Map<string,any>();
  for(const d of (details||[]) as any[]){
    byProduct.set(String(d.produit_id),d);
  }

  return rows.map(p=>{
    const d=byProduct.get(String(p.id));
    if(!d)return p;

    return {
      ...p,
      categorie:d.categorie??null,
      sous_categorie:d.sous_categorie??null,
      genre:d.genre??null,
      nouveau:d.nouveau===true,
    };
  });
}

async function productSearch(message:string,h:Context,mode:Intent){
  const rows=await loadProducts();
  if(!rows)return null;

  const t=norm(message);
  const budget=budgetOr(message,h);
  const extractedTerm=extractCandidate(message);
  const tSuperlative=/\b(?:le|la)\s+(?:moins|plus)\s+cher(?:e)?\b/.test(t)||/\bprix\s+le\s+plus\s+(?:bas|haut)\b/.test(t);
  const term=extractedTerm||(tSuperlative?h.productTerm:null)||h.productTerm;
  let filtered=rows.slice();

  const availability=productNeed(t)||((extractedTerm||tSuperlative)?null:h.availability);
  const cheapest=/\ble\s+moins\s+cher(?:e)?\b/.test(t)||/\bprix\s+le\s+plus\s+bas\b/.test(t);
  const mostExpensive=/\ble\s+plus\s+cher(?:e)?\b/.test(t)||/\bprix\s+le\s+plus\s+haut\b/.test(t);

  if(availability==="stock")
    filtered=filtered.filter(p=>availabilityOf(p)==="stock");

  if(availability==="sur_commande")
    filtered=filtered.filter(p=>availabilityOf(p)==="sur_commande");

  if(budget!==null)
    filtered=filtered.filter(p=>currentPrice(p)<=budget);

  const terms=canonicalTerms(term||"");

    if(/telephone|telephones|smartphone|smartphones/i.test(t)){
      const debugRows=filtered
        .filter((p:any)=>/samsung|iphone/i.test(String(p.nom||"")))
        .slice(0,10)
        .map((p:any)=>({
          nom:p.nom,
          categorie:p.categorie??null,
          terms,
          score:productMatchScore(p,terms)
        }));

      console.log("V2_RUNTIME_MATCH",JSON.stringify({
        message,
        extractedTerm,
        term,
        terms,
        rows_before_filter:rows.length,
        debugRows
      }));
    }
  if(term){
    filtered=filtered
      .map(p=>({...p,_score:productMatchScore(p,terms)}))
      .filter((p:any)=>p._score>0)
      .sort((a:any,b:any)=>b._score-a._score) as any[];
  }

  if(mode==="PRODUCT_PRICE")
    filtered.sort((a,b)=>currentPrice(a)-currentPrice(b));

  if(mode==="PRODUCT_AVAILABILITY")
    filtered=filtered
      .filter(p=>availabilityOf(p)==="stock")
      .sort((a,b)=>currentPrice(a)-currentPrice(b));

  if(mode==="PRODUCT_SEARCH"&&!term&&!budget&&!availability)
    filtered.sort((a,b)=>currentPrice(a)-currentPrice(b));

  if(cheapest){
    filtered=filtered
      .filter(p=>availabilityOf(p)!=="epuise")
      .sort((a,b)=>currentPrice(a)-currentPrice(b));
  }

  if(mostExpensive){
    filtered=filtered
      .filter(p=>availabilityOf(p)!=="epuise")
      .sort((a,b)=>currentPrice(b)-currentPrice(a));
  }

  return {
    rows:filtered.slice(0,(cheapest||mostExpensive)?1:8),
    all:rows,
    term,
    budget,
    availability,
    cheapest,
    mostExpensive
  };
}
function describeProduct(p:ProductRow){const av=availabilityOf(p);const status=av==="stock"?`En stock (${Number(p.stock)} disponible${Number(p.stock)>1?"s":""}).`:av==="sur_commande"?"Disponible sur commande.":"Stock épuisé actuellement.";const promo=Number(p.promo||0)>0&&(!p.promo_fin||new Date(p.promo_fin)>=new Date());return`• **${p.nom}** — **${money(currentPrice(p))}**${promo?" 🏷️ promotion":""} — ${status}`}
function productResponse(r:any,mode:Intent){
  if(mode==="ON_ORDER"){
    if(!r.rows.length){
      if(r.term)return`Je ne trouve actuellement aucun article **sur commande** correspondant à **« ${r.term} »** dans le catalogue ChinaShop.`;
      return"Je ne trouve actuellement aucun article marqué **sur commande** dans le catalogue.";
    }
    return`Voici les articles actuellement disponibles **sur commande**${r.term?` correspondant à **« ${r.term} »`:""} :\n\n${r.rows.map(describeProduct).join("\n")}`;
  }
  if(mode==="PRODUCT_AVAILABILITY"){if(!r.rows.length)return"Je ne trouve actuellement aucun article en stock. Les autres articles peuvent être disponibles sur commande.";return`Voici les articles que je peux confirmer **en stock actuellement** :\n\n${r.rows.map(describeProduct).join("\n")}`}if(!r.rows.length){if(r.term)return`Je ne trouve actuellement pas **« ${r.term} »** dans le catalogue ChinaShop. Si vous cherchez un article qui n’est pas dans le catalogue, je ne peux pas confirmer automatiquement que nous pouvons le rechercher : un conseiller doit vérifier.`;if(r.budget!==null)return`Je ne trouve actuellement aucun article correspondant à votre demande dans un budget de **${money(r.budget)}**. Donnez-moi un autre budget ou précisez ce que vous recherchez.`;return"Je peux vous aider à choisir. Donnez-moi simplement le type d’article recherché, votre budget ou vos préférences."}
  if(r.cheapest&&r.rows.length===1)return`L’article le moins cher correspondant à votre demande est :\n\n${describeProduct(r.rows[0])}`;
  if(r.mostExpensive&&r.rows.length===1)return`L’article le plus cher correspondant à votre demande est :\n\n${describeProduct(r.rows[0])}`;
  if(r.term&&r.rows.length===1)return`J’ai trouvé ceci :\n\n${describeProduct(r.rows[0])}`;
  if(r.term&&r.rows.length>1)return`Voici les articles qui correspondent à **« ${r.term} »**${r.budget!==null?` avec un budget jusqu’à **${money(r.budget)}**`:""} :\n\n${r.rows.map(describeProduct).join("\n")}`;
  if(r.budget!==null)return`Avec un budget d’environ **${money(r.budget)}**, je peux vous proposer :\n\n${r.rows.map(describeProduct).join("\n")}`;
  return`Voici quelques articles actuellement proposés sur ChinaShop :\n\n${r.rows.map(describeProduct).join("\n")}`}

async function promotions(kind:"promo"|"new"){const rows=await loadProducts();if(!rows)return null;const now=new Date();let r=kind==="promo"?rows.filter(p=>Number(p.promo||0)>0&&(!p.promo_fin||new Date(p.promo_fin)>=now)):rows.filter(p=>p.nouveau===true);r.sort((a,b)=>currentPrice(a)-currentPrice(b));if(!r.length)return kind==="promo"?"Je ne trouve actuellement aucun produit marqué en promotion dans le catalogue.":"Je ne trouve actuellement aucun produit marqué comme nouveauté dans le catalogue.";return kind==="promo"?`Voici les produits actuellement en promotion :\n\n${r.slice(0,10).map(describeProduct).join("\n")}`:`Voici les nouveautés actuellement marquées sur le site :\n\n${r.slice(0,10).map(describeProduct).join("\n")}`}

async function delivery(message:string){const {data}=await db.from("cs_tarifs_livraison").select("code,nom,montant").eq("actif",true).neq("code","RETRAIT").order("montant").order("nom");if(!data?.length)return"Les frais de livraison dépendent de la zone. Quelle est votre zone de livraison ?";const t=norm(message);const f=(data as any[]).find(x=>t.includes(norm(x.nom))||t.includes(norm(x.code).replace(/_/g," ")));if(f)return`Pour **${f.nom}**, la livraison à domicile est de **${money(Number(f.montant))}**.\nLe paiement en ligne est requis pour une livraison à domicile.`;const groups=new Map<number,string[]>();for(const x of data as any[]){const a=groups.get(Number(x.montant))||[];a.push(x.nom);groups.set(Number(x.montant),a)}return`Les frais de livraison dépendent de votre zone :\n\n${[...groups].map(([p,n])=>`• **${money(p)}** : ${n.join(", ")}`).join("\n")}\n\nDonnez-moi votre zone et je vous indique le tarif exact.`}

async function orderStatus(id:string,i:Identity,message:string){const c:any=await conversation(id),r=ref(message),fields="id,numero,statut,mode_reception,mode_paiement,livraison_statut,code_suivi,code_retrait,client_user_id,total,acompte_requis,acompte_paye,created_at";let o:any=null;if(i.userId){if(!await allowed(id,i))return"Conversation inaccessible.";if(r){const {data}=await db.from("cs_commandes").select(fields).eq(r.field,r.value).maybeSingle();o=data;if(!o)return"Je n’ai trouvé aucune commande correspondant à cette référence. Vérifiez la référence et réessayez.";if(o.client_user_id!==i.userId)return"Je ne peux pas afficher cette commande avec votre compte actuel. Cette commande n’est pas associée à votre compte."}else if(c?.commande_id){const {data}=await db.from("cs_commandes").select(fields).eq("id",c.commande_id).maybeSingle();o=data;if(!o)return"Je ne retrouve pas la commande associée à cette conversation.";if(o.client_user_id!==i.userId)return"Je ne peux pas accéder à cette commande avec votre compte actuel."}else return"Envoyez-moi votre référence de commande, par exemple **CS-XXXXXX** ou votre numéro de commande."}else{if(!i.visitorId||!i.visitorToken||!await allowed(id,i))return"Je ne peux pas vérifier une commande privée sans votre identité visiteur valide.";if(!c?.visitor_id||c.visitor_id!==i.visitorId||!c?.commande_id)return"Vous n’avez aucune commande associée à cette conversation visiteur.";if(r){const {data}=await db.from("cs_commandes").select(fields).eq(r.field,r.value).maybeSingle();o=data;if(!o)return"Je n’ai trouvé aucune commande correspondant à cette référence.";if(o.id!==c.commande_id)return"Cette référence ne correspond pas à la commande associée à votre conversation. Pour protéger les données des clients, je ne peux pas afficher cette commande."}else{const {data}=await db.from("cs_commandes").select(fields).eq("id",c.commande_id).maybeSingle();o=data;if(!o)return"Je ne retrouve pas votre commande associée à cette conversation."}}
  let a=`Commande **${o.numero}**\nStatut : **${o.statut}**\nMode : **${o.mode_reception}**`;if(o.mode_reception==="livraison"&&o.livraison_statut)a+=`\nLivraison : **${o.livraison_statut}**`;if(o.mode_reception==="livraison"&&o.code_suivi)a+=`\nCode de suivi : **${o.code_suivi}**`;if(o.acompte_requis>0)a+=`\nAcompte : **${money(Number(o.acompte_paye||0))} / ${money(Number(o.acompte_requis))}`;return a}

async function privateInfo(i:Identity,k:Intent){if(!i.userId)return"Cette information concerne votre compte personnel. Connectez-vous à votre compte pour que je puisse vous répondre sans exposer de données privées.";if(k==="LEVEL"){const {data:p,error:pe}=await db.from("cs_profils_compte").select("montant_achats_cumules,niveau_code").eq("user_id",i.userId).maybeSingle();if(pe||!p)return"Je ne peux pas récupérer votre niveau actuellement. Vous pouvez aussi le consulter dans votre compte.";const total=Number((p as any).montant_achats_cumules||0),code=String((p as any).niveau_code||"bronze");const {data:niveau}=await db.from("cs_niveaux_compte").select("nom,seuil_achats_cumules").eq("code",code).eq("actif",true).maybeSingle();const {data:next}=await db.from("cs_niveaux_compte").select("code,nom,seuil_achats_cumules").eq("actif",true).gt("seuil_achats_cumules",total).order("seuil_achats_cumules",{ascending:true}).limit(1).maybeSingle();const nom=String((niveau as any)?.nom||code);const restant=next?Math.max(Number((next as any).seuil_achats_cumules)-total,0):0;return`Votre niveau actuel est **${nom}**.\nAchats cumulés : **${money(total)}**${next?`\nProchain niveau : **${(next as any).nom}\nMontant restant : **${money(restant)}`:""}`}if(k==="REFERRAL"){const {data}=await db.from("cs_profils_compte").select("code_parrainage,credit_parrainage").eq("user_id",i.userId).maybeSingle();if(!data)return"Je ne trouve pas encore votre profil de compte.";return`Votre code de parrainage est **${data.code_parrainage}**. Crédit de parrainage affiché : **${money(Number(data.credit_parrainage||0))}.`}if(k==="NOTIFICATIONS")return"Vous pouvez gérer les notifications de commandes, de livraison et de promotions dans **Compte → Paramètres → Notifications**.";return"Votre compte permet notamment de consulter vos commandes, vos favoris, votre niveau, votre parrainage, vos notifications et vos paramètres."}

function knowledge(i:Intent,message:string){const t=norm(message);if(i==="PICKUP")return"Le retrait est gratuit. Pour un retrait avec paiement en espèces, un code de retrait est communiqué selon le processus de commande.";if(i==="PAYMENT")return"Pour une livraison à domicile, le paiement en ligne (Mobile Money) est obligatoire. Pour un retrait, le paiement en espèces peut être utilisé.";if(i==="DISCOUNT")return"ChinaShop applique une réduction de **1,5 % à partir de 3 articles**. Cette réduction est distincte d’une promotion produit.";if(i==="ORDER_PROCESS")return"Le parcours est : **1. choisir les produits → 2. vérifier le panier → 3. renseigner vos coordonnées et choisir livraison ou retrait → 4. choisir le paiement → 5. confirmer → 6. recevoir le numéro de commande et le code correspondant**.";if(i==="TRACKING_HELP")return"Pour suivre une commande, utilisez votre **code de suivi CS-XXXXXX** dans la page de suivi. Le site affiche ensuite le statut de la commande et l’évolution de la livraison. Si vous avez déjà un code CS, envoyez-le-moi et je vérifierai votre commande selon vos droits d’accès.";if(i==="DEPOSIT")return"Certains articles sur commande peuvent nécessiter un acompte. Pour un panier uniquement composé d’articles sur commande, le parcours prévoit un acompte de **50 % de la valeur des articles sur commande** ; le montant exact affiché lors de la commande fait foi.";if(i==="ON_ORDER")return"Un article marqué **sur commande** n’est pas actuellement disponible en stock. Vous pouvez néanmoins le commander selon le parcours proposé par le site. Pour les articles sur commande, le site indique un délai indicatif pouvant aller jusqu’à environ **30 jours par avion** ou **3 mois par bateau**. Certains articles peuvent aussi nécessiter un acompte affiché pendant la commande.";if(i==="SITE"){if(has(t,["remboursement","retour","garantie"]))return null;if(has(t,["delai","délai","temps","recevoir"]))return"Les délais dépendent de la disponibilité et du traitement de la commande. Pour les articles sur commande, le site indique un délai indicatif pouvant aller jusqu’à environ 30 jours par avion ou jusqu’à 3 mois par bateau.";return"ChinaShop-Benin est une boutique en ligne qui propose des articles disponibles en stock et des articles disponibles sur commande. Le site permet de découvrir les produits, commander, choisir livraison ou retrait, payer selon le mode choisi et suivre l’évolution d’une commande."}if(i==="ACCOUNT")return"Le compte permet notamment de retrouver vos commandes, vos favoris, votre niveau, votre parrainage, vos notifications et vos paramètres. Vous pouvez aussi commander selon le parcours proposé par le site.";if(i==="PRIVACY")return"Les informations de compte et de commande sont protégées par l’authentification et les contrôles d’accès du site. Je ne communique jamais les données privées d’un autre client.";return null}

const SOURCING="Je vois que certains articles sont proposés sur commande, mais je ne peux pas en déduire que ChinaShop peut acheter n’importe quel produit qui n’est pas présent dans le catalogue. Pour vérifier si votre article peut être recherché et commandé, je transmets votre demande à un conseiller.";
const UNKNOWN="Je n’ai pas d’information confirmée pour répondre à cette demande. Je vais donc la transmettre à un conseiller afin de ne pas vous donner une réponse incorrecte.";

async function handoff(id:string,text:string){const mid=await addRobot(id,text);await db.from("cs_assistance_conversations").update({mode_assistance:"human_requested",needs_human_reply:true,updated_at:new Date().toISOString()}).eq("id",id);return mid}

Deno.serve(async r=>{if(r.method==="OPTIONS")return new Response("ok",{headers:headers(r)});if(r.method!=="POST")return out(r,{error:"Méthode non autorisée."},405);try{const b=await r.json(),message=String(b?.message||"").trim(),id=String(b?.conversation_id||"").trim();if(!message||!id)return out(r,{error:"message et conversation_id sont requis."},400);const ident=await identity(r);if(!await allowed(id,ident))return out(r,{error:"Conversation inaccessible."},403);const c:any=await conversation(id);if(!c||c.statut!=="open")return out(r,{status:"closed",answer:"Cette conversation est fermée. Vous pouvez la rouvrir depuis l’assistance."});if(c.mode_assistance!=="robot_active")return out(r,{status:"human",answer:"Un conseiller est déjà en charge de cette conversation."});const h=await context(id),intent=mergedIntent(message,h),t=norm(message),budget=budgetOr(message,h);
  if(intent==="HUMAN"){const mid=await handoff(id,"Je transmets votre demande à un conseiller afin qu’il puisse vous accompagner directement.");return out(r,{status:"human_requested",answer:"Je transmets votre demande à un conseiller.",message_id:mid,intent,confidence:.99})}
  if(intent==="CUSTOM_SOURCING"){const mid=await handoff(id,SOURCING);return out(r,{status:"human_requested",answer:SOURCING,message_id:mid,intent,confidence:.99})}
  if(intent==="UNKNOWN"&&has(t,["information du site","informations du site","quelle sont les informations","quelles sont les informations"])){
    const mid=await addRobot(id,"Je peux vous renseigner sur les produits, les prix, le stock, les articles sur commande, les promotions, la livraison, le retrait, le paiement, les commandes, le suivi, le compte et les règles du site. Si une information précise n’est pas confirmée par le site, je vous mets en relation avec un conseiller.");return out(r,{status:"robot",answer:"Je peux vous renseigner sur les produits, les prix, le stock, les articles sur commande, les promotions, la livraison, le retrait, le paiement, les commandes, le suivi, le compte et les règles du site.",message_id:mid,intent:"SITE",confidence:.95})}
  if(intent==="GREETING"){
    const fallback="Bonjour 👋 Je suis l’assistance ChinaShop. Je peux vous aider avec les produits, les prix, les promotions, la disponibilité, les commandes, la livraison, le retrait, le paiement, le compte et les informations du site.";
    const a=await callV6(message,{
      intent,
      answer_context:fallback,
      conversation_summary:"Le client vient de saluer l’assistance ChinaShop."
    })||fallback;
    const mid=await addRobot(id,a);
    return out(r,{status:"robot",answer:a,message_id:mid,intent,confidence:.99})
  }
  if(intent==="PRODUCT_SEARCH"||intent==="PRODUCT_PRICE"||intent==="PRODUCT_AVAILABILITY"||intent==="ON_ORDER"){const result=await productSearch(message,h,intent);if(!result)return out(r,{error:"Catalogue indisponible."},500);if(intent==="PRODUCT_SEARCH"&&result.term===null&&budget===null&&result.availability===null&&has(t,["je veux acheter","je veux un article","je veux une article","je cherche quelque chose","je veux quelque chose","je veux acheter une article"])) {const a="Bien sûr 😊 Dites-moi simplement ce que vous recherchez ou votre budget, et je vérifierai les articles réellement disponibles sur ChinaShop.";const mid=await addRobot(id,a);return out(r,{status:"robot",answer:a,message_id:mid,intent,confidence:.9})}const a=productResponse(result,intent);const mid=await addRobot(id,a);return out(r,{status:"robot",answer:a,message_id:mid,intent,confidence:.94})}
  if(intent==="PROMO"){const a=await promotions("promo")||UNKNOWN;const mid=await addRobot(id,a);return out(r,{status:"robot",answer:a,message_id:mid,intent,confidence:.97})}
  if(intent==="NEW"){const a=await promotions("new")||UNKNOWN;const mid=await addRobot(id,a);return out(r,{status:"robot",answer:a,message_id:mid,intent,confidence:.95})}
  if(intent==="DELIVERY"){const a=await delivery(message);const mid=await addRobot(id,a);return out(r,{status:"robot",answer:a,message_id:mid,intent,confidence:.96})}
  if(["PICKUP","PAYMENT","DISCOUNT","ORDER_PROCESS","TRACKING_HELP","DEPOSIT","SITE","ACCOUNT","PRIVACY"].includes(intent)){let a=knowledge(intent,message);if(intent==="SITE"&&!a){const mid=await handoff(id,UNKNOWN);return out(r,{status:"human_requested",answer:UNKNOWN,message_id:mid,intent,confidence:.6})}a=a||UNKNOWN;const mid=await addRobot(id,a);return out(r,{status:"robot",answer:a,message_id:mid,intent,confidence:.94})}
  if(["LEVEL","REFERRAL","NOTIFICATIONS"].includes(intent)){const a=await privateInfo(ident,intent);const mid=await addRobot(id,a);return out(r,{status:"robot",answer:a,message_id:mid,intent,confidence:.94})}
  if(intent==="ORDER_STATUS"){const a=await orderStatus(id,ident,message);const mid=await addRobot(id,a);return out(r,{status:"robot",answer:a,message_id:mid,intent,confidence:.98})}
  const v6=await callV6(message,{intent:intent==="UNKNOWN"?null:intent,answer_context:"Répondre uniquement avec des informations générales et sûres sur ChinaShop. Ne pas inventer de prix, de stock, de statut de commande, de données personnelles ou de règles commerciales non confirmées. Si la demande nécessite une vérification dans les données ChinaShop, indiquer qu’un conseiller doit vérifier.",conversation_summary:`Contexte de conversation ChinaShop. Intention détectée : ${intent}.`});if(v6){const mid=await addRobot(id,v6);return out(r,{status:"robot",answer:v6,message_id:mid,intent,confidence:.75})}const mid=await handoff(id,UNKNOWN);return out(r,{status:"human_requested",answer:UNKNOWN,message_id:mid,intent,confidence:.35});
}catch(e){console.error("ASSISTANCE_ROBOT_V2_ERROR",e);return out(r,{error:"Une erreur technique est survenue. Veuillez réessayer ou demander l’aide d’un conseiller."},500)}});
