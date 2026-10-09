import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase=createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY);
function json(body:Record<string,unknown>,status=200){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}})}
function extensionFor(contentType:string){if(contentType==="image/jpeg")return"jpg";if(contentType==="image/png")return"png";if(contentType==="image/webp")return"webp";return null}
function normalizePhone(value:string){return value.replace(/[^0-9]/g,"")}
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return json({success:false,error:"Méthode non autorisée."},405);
 try{
  const form=await req.formData();
  const numeroCommande=String(form.get("numero_commande")??"").trim();
  const codeSuivi=String(form.get("code_suivi")??"").trim();
  const telephone=String(form.get("telephone")??"").trim();
  const paiementAccesToken=String(form.get("paiement_acces_token")??"").trim();
  const paiementId=String(form.get("paiement_id")??"").trim();
  const file=form.get("file");
  if((!numeroCommande&&!codeSuivi)||!paiementId||!(file instanceof File))return json({success:false,error:"Commande, paiement et fichier sont obligatoires."},400);
  if(file.size<=0||file.size>5*1024*1024)return json({success:false,error:"La preuve doit faire au maximum 5 Mo."},400);
  const extension=extensionFor(file.type);if(!extension)return json({success:false,error:"Format accepté : JPG, PNG ou WebP."},400);
  const authorization=req.headers.get("Authorization")??"";
  const bearer=authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()??"";
  let clientUserId:string|null=null;
  if(bearer){const {data:userData,error:userError}=await supabase.auth.getUser(bearer);if(userError||!userData.user)return json({success:false,error:"Session utilisateur invalide."},401);clientUserId=userData.user.id}
  let commandeQuery=supabase.from("cs_commandes").select("id,numero,code_suivi,telephone,paiement_acces_token,client_user_id,type_parcours,statut").limit(1);
  commandeQuery=codeSuivi?commandeQuery.eq("code_suivi",codeSuivi.toUpperCase()):commandeQuery.eq("numero",numeroCommande);
  const {data:commande,error:commandeError}=await commandeQuery.maybeSingle();
  if(commandeError)throw commandeError;if(!commande)return json({success:false,error:"Commande introuvable."},404);
  const accesInviteValide=Boolean(paiementAccesToken)&&commande.paiement_acces_token===paiementAccesToken;
  const accesConnecteValide=Boolean(clientUserId)&&commande.client_user_id===clientUserId;
  const accesSuiviValide=Boolean(codeSuivi&&telephone)&&normalizePhone(commande.telephone??"")===normalizePhone(telephone);
  const accesSuiviSoldeV2=Boolean(codeSuivi&&!telephone&&commande.code_suivi?.toUpperCase()===codeSuivi.toUpperCase()&&commande.type_parcours==="sur_commande"&&commande.statut==="solde_requis");
  const accesSuiviInviteV2=Boolean(codeSuivi&&!telephone&&!clientUserId&&!paiementAccesToken)&&commande.code_suivi?.toUpperCase()===codeSuivi.toUpperCase();
  if(!accesInviteValide&&!accesConnecteValide&&!accesSuiviValide&&!accesSuiviSoldeV2&&!accesSuiviInviteV2)return json({success:false,error:"Accès non autorisé pour cette commande."},403);
  if(accesSuiviValide&&((commande.type_parcours??"")!=="sur_commande"||(commande.statut??"")!=="solde_requis"))return json({success:false,error:"La preuve du solde ne peut pas être envoyée pour cette commande."},409);
  const {data:paiement,error:paiementError}=await supabase.from("cs_paiements").select("id,commande_id,type,statut,preuve_path,reference_paiement,reference_transaction").eq("id",paiementId).eq("commande_id",commande.id).in("type",["acompte","solde"]).maybeSingle();
  if(paiementError)throw paiementError;if(!paiement)return json({success:false,error:"Paiement introuvable."},404);
  if(!["en_attente","initie"].includes(paiement.statut))return json({success:false,error:"Ce paiement ne peut plus recevoir de preuve."},409);
  if((accesSuiviValide||accesSuiviSoldeV2)&&paiement.type!=="solde")return json({success:false,error:"Ce paiement n'est pas un paiement de solde."},409);
  if((accesSuiviSoldeV2||accesSuiviInviteV2)&&!String(paiement.reference_transaction??"").trim())return json({success:false,error:"La référence de transaction doit être enregistrée avant l’envoi de la preuve."},409);
  const path=`commandes/${commande.id}/paiements/${paiement.id}/${crypto.randomUUID()}.${extension}`;
  const bytes=new Uint8Array(await file.arrayBuffer());
  const {error:uploadError}=await supabase.storage.from("payment-proofs").upload(path,bytes,{contentType:file.type,cacheControl:"3600",upsert:false});if(uploadError)throw uploadError;
  if(paiement.preuve_path)await supabase.storage.from("payment-proofs").remove([paiement.preuve_path]);
  const now=new Date().toISOString();
  const {data:updated,error:updateError}=await supabase.from("cs_paiements").update({preuve_path:path,preuve_uploaded_at:now,updated_at:now}).eq("id",paiement.id).select("id,statut,reference_paiement,reference_transaction,preuve_path,preuve_uploaded_at").single();
  if(updateError)throw updateError;
  return json({success:true,paiement_id:updated.id,statut:updated.statut,reference_paiement:updated.reference_paiement,reference_transaction:updated.reference_transaction,preuve_path:updated.preuve_path,preuve_uploaded_at:updated.preuve_uploaded_at});
 }catch(error){console.error("upload-payment-proof error",error);return json({success:false,error:error instanceof Error?error.message:"Impossible d’envoyer la preuve de paiement."},500)}
});