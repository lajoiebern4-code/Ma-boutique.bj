import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Loader2,
  PackageCheck,
  Megaphone,
  Truck,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  recupererPreferencesNotificationsClient,
  sauvegarderPreferencesNotificationsClient,
} from '../../../services/supabase'

type Preferences = {
  notifications_commandes: boolean
  notifications_livraison: boolean
  notifications_promotions: boolean
}

const preferencesParDefaut: Preferences = {
  notifications_commandes: true,
  notifications_livraison: true,
  notifications_promotions: true,
}

export default function Notifications() {
  const navigate = useNavigate()

  const [preferences, setPreferences] = useState<Preferences>(
    preferencesParDefaut,
  )
  const [chargement, setChargement] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let actif = true

    async function charger() {
      const resultat =
        await recupererPreferencesNotificationsClient()

      if (!actif) return

      if (!resultat.success) {
        if (resultat.error === 'Utilisateur non connecté') {
          navigate('/connexion', { replace: true })
          return
        }

        setErreur(resultat.error || 'Impossible de charger vos préférences.')
        setChargement(false)
        return
      }

      if (resultat.data) {
        setPreferences(resultat.data)
      }

      setChargement(false)
    }

    charger()

    return () => {
      actif = false
    }
  }, [navigate])

  function modifier(
    champ: keyof Preferences,
  ) {
    setPreferences((ancien) => ({
      ...ancien,
      [champ]: !ancien[champ],
    }))

    setMessage('')
    setErreur('')
  }

  async function sauvegarder() {
    setSauvegarde(true)
    setMessage('')
    setErreur('')

    const resultat =
      await sauvegarderPreferencesNotificationsClient(preferences)

    if (resultat.success) {
      setMessage('Vos préférences ont été enregistrées.')
    } else {
      setErreur(
        resultat.error ||
          'Impossible d’enregistrer vos préférences.',
      )
    }

    setSauvegarde(false)
  }

  if (chargement) {
    return (
      <section className="flex min-h-[calc(100vh-180px)] items-center justify-center bg-[#F7F5F1] px-4">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-6 py-5 text-sm font-semibold text-slate-500 shadow-sm">
          <Loader2 size={18} className="animate-spin" />
          Chargement de vos préférences…
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

        <div className="mb-6 mt-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
            Paramètres du compte
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0B1E3D]">
            Notifications
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Choisissez les informations que vous souhaitez recevoir.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Bell size={23} />
            </div>

            <div>
              <h2 className="font-black text-[#0B1E3D]">
                Vos notifications
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Vos choix sont enregistrés sur votre compte.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            <NotificationOption
              icon={<PackageCheck size={21} />}
              titre="Commandes"
              description="Recevoir les informations concernant vos commandes."
              active={preferences.notifications_commandes}
              onClick={() => modifier('notifications_commandes')}
              disabled={sauvegarde}
            />

            <NotificationOption
              icon={<Truck size={21} />}
              titre="Livraisons"
              description="Recevoir les mises à jour concernant vos livraisons."
              active={preferences.notifications_livraison}
              onClick={() => modifier('notifications_livraison')}
              disabled={sauvegarde}
            />

            <NotificationOption
              icon={<Megaphone size={21} />}
              titre="Promotions"
              description="Recevoir les nouveautés, offres et promotions ChinaShop."
              active={preferences.notifications_promotions}
              onClick={() => modifier('notifications_promotions')}
              disabled={sauvegarde}
            />
          </div>

          <div className="border-t border-slate-100 p-6">
            {erreur && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              >
                {erreur}
              </div>
            )}

            {message && (
              <div
                role="status"
                className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
              >
                <CheckCircle2 size={18} />
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={sauvegarder}
              disabled={sauvegarde}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-5 text-sm font-black text-white transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sauvegarde && (
                <Loader2 size={17} className="animate-spin" />
              )}

              {sauvegarde
                ? 'Enregistrement…'
                : 'Enregistrer mes préférences'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function NotificationOption({
  icon,
  titre,
  description,
  active,
  onClick,
  disabled,
}: {
  icon: React.ReactNode
  titre: string
  description: string
  active: boolean
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-4 px-6 py-5 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-black text-[#0B1E3D]">
          {titre}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>

      <div
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          active ? 'bg-[#0284C7]' : 'bg-slate-200'
        }`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            active ? 'left-6' : 'left-1'
          }`}
        />
      </div>
    </button>
  )
}
