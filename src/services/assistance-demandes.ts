import { supabase } from '../lib/supabase'

export type AssistanceDemande = {
  id: string
  user_id: string | null
  nom: string
  email: string
  sujet: string
  message: string
  reponse: string | null
  repondu_par: string | null
  repondu_le: string | null
  statut: 'nouveau' | 'repondu' | 'ferme'
  lu: boolean
  created_at: string
  updated_at: string
}

export const SUJETS_ASSISTANCE = [
  'Commande',
  'Livraison',
  'Paiement',
  'Retour ou échange',
  'Produit',
  'Compte client',
  'Autre',
] as const

export async function creerDemandeAssistance(params: {
  nom: string
  email: string
  sujet: string
  message: string
}): Promise<{ success: boolean; data: AssistanceDemande | null; error: string }> {
  if (!supabase) {
    return { success: false, data: null, error: 'Supabase non configuré' }
  }

  try {
    const { data, error } = await supabase.rpc('cs_creer_demande_assistance', {
      p_nom: params.nom,
      p_email: params.email,
      p_sujet: params.sujet,
      p_message: params.message,
    })

    if (error) throw error

    return { success: true, data: data as AssistanceDemande, error: '' }
  } catch (err) {
    console.error('Erreur création demande:', err)
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}

export async function repondreDemandeAssistance(
  id: string,
  reponse: string,
): Promise<{ success: boolean; data: AssistanceDemande | null; error: string }> {
  if (!supabase) {
    return { success: false, data: null, error: 'Supabase non configuré' }
  }

  try {
    const { data, error } = await supabase.rpc('cs_repondre_demande_assistance', {
      p_id: id,
      p_reponse: reponse,
    })

    if (error) throw error

    return { success: true, data: data as AssistanceDemande, error: '' }
  } catch (err) {
    console.error('Erreur réponse demande:', err)
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}

export async function marquerDemandeLue(
  id: string,
): Promise<{ success: boolean; error: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase non configuré' }
  }

  try {
    const { error } = await supabase.rpc('cs_marquer_demande_lue', { p_id: id })
    if (error) throw error
    return { success: true, error: '' }
  } catch (err) {
    console.error('Erreur marquage lu:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}

export async function listerDemandesAssistance(): Promise<{
  success: boolean
  data: AssistanceDemande[]
  error: string
}> {
  if (!supabase) {
    return { success: false, data: [], error: 'Supabase non configuré' }
  }

  try {
    const { data, error } = await supabase.rpc('cs_lister_demandes_assistance')
    if (error) throw error
    return { success: true, data: (data || []) as AssistanceDemande[], error: '' }
  } catch (err) {
    console.error('Erreur liste demandes:', err)
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}

export async function listerMesDemandesAssistance(): Promise<{
  success: boolean
  data: AssistanceDemande[]
  error: string
}> {
  if (!supabase) {
    return { success: false, data: [], error: 'Supabase non configuré' }
  }

  try {
    const { data, error } = await supabase.rpc('cs_lister_mes_demandes_assistance')
    if (error) throw error
    return { success: true, data: (data || []) as AssistanceDemande[], error: '' }
  } catch (err) {
    console.error('Erreur mes demandes:', err)
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}

export async function envoyerEmailNouvelleDemande(demandeId: string): Promise<void> {
  if (!supabase) return

  try {
    await supabase.functions.invoke('notifier-demande-assistance', {
      body: {
        type: 'nouvelle_demande',
        demande_id: demandeId,
      },
    })
  } catch (err) {
    console.error('Erreur email nouvelle demande:', err)
  }
}

export async function envoyerEmailReponseDemande(demandeId: string): Promise<void> {
  if (!supabase) return

  try {
    await supabase.functions.invoke('notifier-demande-assistance', {
      body: {
        type: 'reponse_demande',
        demande_id: demandeId,
      },
    })
  } catch (err) {
    console.error('Erreur email réponse:', err)
  }
}
