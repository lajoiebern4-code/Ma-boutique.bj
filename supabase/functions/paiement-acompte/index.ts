import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Configuration Supabase serveur absente.')
}

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Méthode non autorisée.',
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }

  try {
    const body = await req.json()

    const numeroCommande = String(
      body?.numero_commande || '',
    ).trim()

    const telephone = String(
      body?.telephone || '',
    ).trim()

    if (!numeroCommande || numeroCommande.length > 100) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Numéro de commande invalide.',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    if (!telephone || telephone.length < 8 || telephone.length > 30) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Numéro de téléphone invalide.',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const { data, error } = await supabaseAdmin.rpc(
      'cs_initier_paiement_acompte',
      {
        p_numero_commande: numeroCommande,
        p_telephone: telephone,
        p_provider: 'a_configurer',
      },
    )

    if (error) {
      console.error(
        'Erreur RPC cs_initier_paiement_acompte:',
        error,
      )

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Impossible d’initialiser le paiement.',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    return new Response(
      JSON.stringify(data),
      {
        status: data?.success ? 200 : 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Erreur paiement-acompte:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Requête invalide.',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})
