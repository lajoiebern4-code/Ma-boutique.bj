import { useState } from 'react'
import { supabase } from '../lib/supabase'

const WORKER_URL =
  'https://chinashop-ai-brain-test.lajoiebern4.workers.dev'

export default function TestV6Identity() {
  const [resultat, setResultat] = useState('En attente...')

  async function testerIdentite() {
    setResultat('Vérification de la session...')

    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setResultat(`Erreur session : ${error.message}`)
        return
      }

      const session = data.session

      if (!session?.access_token) {
        setResultat(
          'Aucune session authentifiée. Connectez-vous d’abord à ChinaShop.'
        )
        return
      }

      setResultat('Session trouvée. Test du Worker V6...')

      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: 'Test sécurisé de mon identité.',
          user_id: 'FAUSSE_IDENTITE_VOLONTAIRE',
          conversation_id: 'test-v6-identity',
        }),
      })

      const result = await response.json()

      setResultat(JSON.stringify(result, null, 2))
    } catch (error) {
      setResultat(
        `Erreur réseau : ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Test V6 — Identité Supabase</h1>

      <p>
        Ce test vérifie que l’identité provient du JWT Supabase et non du
        user_id envoyé dans le body.
      </p>

      <button type="button" onClick={testerIdentite}>
        Tester mon identité
      </button>

      <pre
        style={{
          marginTop: 20,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {resultat}
      </pre>
    </main>
  )
}
