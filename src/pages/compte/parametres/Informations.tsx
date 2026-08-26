import { useEffect, useState } from 'react'
import { ArrowLeft, Save, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

export default function Informations() {
  const navigate = useNavigate()

  const [chargement, setChargement] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [utilisateur, setUtilisateur] = useState<any>(null)
  const [profilExiste, setProfilExiste] = useState(false)

  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')

  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true

    async function chargerInformations() {
      setChargement(true)
      setErreur('')

      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (!actif) return

      if (authError || !authData?.user) {
        navigate('/connexion', { replace: true })
        return
      }

      const user = authData.user
      setUtilisateur(user)

      const { data: client, error } = await supabase
        .from('cs_clients')
        .select('user_id, nom, telephone')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!actif) return

      if (error) {
        console.error('Erreur chargement informations:', error)
        setErreur('Impossible de charger vos informations.')
        setChargement(false)
        return
      }

      setProfilExiste(!!client)
      setNom(client?.nom || user.user_metadata?.nom || '')
      setTelephone(client?.telephone || '')

      setChargement(false)
    }

    chargerInformations()

    return () => {
      actif = false
    }
  }, [navigate])

  async function sauvegarder() {
    if (!utilisateur) return

    const nomPropre = nom.trim()
    const telephonePropre = telephone.trim()

    if (!nomPropre) {
      setErreur('Veuillez renseigner votre nom.')
      setMessage('')
      return
    }

    setSauvegarde(true)
    setErreur('')
    setMessage('')

    try {
      if (profilExiste) {
        const { data, error } = await supabase
          .from('cs_clients')
          .update({
            nom: nomPropre,
            telephone: telephonePropre || null,
          })
          .eq('user_id', utilisateur.id)
          .select('user_id, nom, telephone')
          .single()

        if (error) throw error

        setNom(data.nom || '')
        setTelephone(data.telephone || '')
      } else {
        const { data, error } = await supabase
          .from('cs_clients')
          .insert({
            user_id: utilisateur.id,
            nom: nomPropre,
            telephone: telephonePropre || null,
          })
          .select('user_id, nom, telephone')
          .single()

        if (error) throw error

        setProfilExiste(true)
        setNom(data.nom || '')
        setTelephone(data.telephone || '')
      }

      setMessage('Vos informations ont été enregistrées.')
    } catch (err: any) {
      console.error('Erreur sauvegarde informations:', err)
      setErreur(
        err?.message || 'Impossible d’enregistrer vos informations.',
      )
    } finally {
      setSauvegarde(false)
    }
  }

  if (chargement) {
    return (
      <section className="flex min-h-[calc(100vh-180px)] items-center justify-center bg-[#F7F5F1] px-4">
        <div className="rounded-2xl bg-white px-6 py-5 text-sm font-semibold text-slate-500 shadow-sm">
          Chargement de vos informations…
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-[calc(100vh-180px)] bg-[#F7F5F1] px-4 py-10 sm:px-6 lg:py-14">
      <div className="mx-auto max-w-2xl">

        <Link
          to="/compte/parametres"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-orange-600"
        >
          <ArrowLeft size={17} />
          Retour aux paramètres
        </Link>

        <div className="mt-6 mb-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
            Paramètres du compte
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0B1E3D]">
            Mes informations
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Gérez vos coordonnées pour faciliter vos prochaines commandes.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <UserRound size={23} />
            </div>

            <div>
              <h2 className="font-black text-[#0B1E3D]">
                Informations personnelles
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Nom et coordonnées
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">

            <div>
              <label
                htmlFor="nom"
                className="mb-1.5 block text-sm font-bold text-slate-700"
              >
                Nom
              </label>

              <input
                id="nom"
                value={nom}
                onChange={(event) => setNom(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                placeholder="Votre nom"
                autoComplete="name"
              />
            </div>

            <div>
              <label
                htmlFor="telephone"
                className="mb-1.5 block text-sm font-bold text-slate-700"
              >
                Téléphone
              </label>

              <input
                id="telephone"
                type="tel"
                value={telephone}
                onChange={(event) => setTelephone(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                placeholder="Votre numéro"
                autoComplete="tel"
              />
            </div>

            {erreur && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {erreur}
              </div>
            )}

            {message && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={sauvegarder}
              disabled={sauvegarde}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-5 text-sm font-black text-white transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />
              {sauvegarde ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          Ces informations servent notamment à faciliter vos commandes et
          votre suivi.
        </p>
      </div>
    </section>
  )
}
