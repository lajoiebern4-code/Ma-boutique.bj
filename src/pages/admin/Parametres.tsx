import { useEffect, useState } from 'react'
import { recupererParametresCommerciaux, modifierParametresCommerciaux } from '../../services/supabase'
import {
  Settings,
  Store,
  ShoppingCart,
  Truck,
  ShieldCheck,
  Save,
  RotateCcw,
} from 'lucide-react'

export default function Parametres() {
  const [nom, setNom] = useState('ChinaShop-Benin')
  const [sousTitre, setSousTitre] = useState(
    'Sourcer en Chine. Vous livrer au Bénin.',
  )
  const [remise, setRemise] = useState('1.5')
  const [seuilRemise, setSeuilRemise] = useState('3')
  const [fraisLivraison, setFraisLivraison] = useState('1500')
  const [message, setMessage] = useState('')
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)

  useEffect(() => {
    let actif = true

    recupererParametresCommerciaux()
      .then((data) => {
        if (!actif || !data) return
        setNom(data.nom_boutique ?? 'ChinaShop-Benin')
        setSousTitre(data.sous_titre ?? 'Sourcer en Chine. Vous livrer au Bénin.')
        setRemise(String(data.remise_pourcentage ?? 1.5))
        setSeuilRemise(String(data.seuil_remise_articles ?? 3))
        setFraisLivraison(String(data.frais_livraison ?? 1500))
      })
      .catch((err) => {
        console.error('Erreur chargement paramètres:', err)
        if (actif) setMessage('Impossible de charger les paramètres.')
      })
      .finally(() => {
        if (actif) setChargement(false)
      })

    return () => {
      actif = false
    }
  }, [])

  const enregistrer = async () => {
    if (enregistrement) return

    setEnregistrement(true)
    setMessage('')

    try {
      await modifierParametresCommerciaux({
        nomBoutique: nom.trim(),
        sousTitre: sousTitre.trim(),
        remisePourcentage: Number(remise),
        seuilRemiseArticles: Number(seuilRemise),
        fraisLivraison: Number(fraisLivraison),
        retraitGratuit: true,
        livraisonPaiementEnLigneRequis: true,
      })

      setMessage('Paramètres enregistrés avec succès.')
      window.setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Erreur enregistrement paramètres:', err)
      setMessage(
        err instanceof Error
          ? err.message
          : 'Impossible d’enregistrer les paramètres.',
      )
    } finally {
      setEnregistrement(false)
    }
  }

  const reinitialiser = () => {
    setNom('ChinaShop-Benin')
    setSousTitre('Sourcer en Chine. Vous livrer au Bénin.')
    setRemise('1.5')
    setSeuilRemise('3')
    setFraisLivraison('1500')
    setMessage('')
  }

  return (
    <div className="min-h-full bg-[#F7F5F1] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0284C7] text-white shadow-sm">
                <Settings size={21} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#0B1E3D]">
                  Paramètres
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Configuration de ChinaShop-Benin
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={reinitialiser}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw size={15} />
              Réinitialiser
            </button>

            <button
              type="button"
              onClick={enregistrer}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0284C7] px-4 text-xs font-black text-white shadow-sm hover:bg-[#0369A1]"
            >
              <Save size={15} />
              Enregistrer
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#163B70]">
                <Store size={19} />
              </div>
              <div>
                <h2 className="font-black text-[#0B1E3D]">
                  Identité de la boutique
                </h2>
                <p className="text-xs text-slate-500">
                  Informations affichées dans l'administration.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black text-slate-600">
                  Nom de la boutique
                </span>
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#0B1E3D]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black text-slate-600">
                  Sous-titre
                </span>
                <input
                  value={sousTitre}
                  onChange={(e) => setSousTitre(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#0B1E3D]"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <ShoppingCart size={19} />
              </div>
              <div>
                <h2 className="font-black text-[#0B1E3D]">
                  Règles commerciales
                </h2>
                <p className="text-xs text-slate-500">
                  Paramètres utilisés pour les commandes.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black text-slate-600">
                  Remise (%)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={remise}
                  onChange={(e) => setRemise(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-[#0B1E3D]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black text-slate-600">
                  À partir de (articles)
                </span>
                <input
                  type="number"
                  min="1"
                  value={seuilRemise}
                  onChange={(e) => setSeuilRemise(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-[#0B1E3D]"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Truck size={19} />
              </div>
              <div>
                <h2 className="font-black text-[#0B1E3D]">
                  Livraison & retrait
                </h2>
                <p className="text-xs text-slate-500">
                  Règles de réception des commandes.
                </p>
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-black text-slate-600">
                Frais de livraison à domicile (FCFA)
              </span>
              <input
                type="number"
                min="0"
                value={fraisLivraison}
                onChange={(e) => setFraisLivraison(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-[#0B1E3D]"
              />
            </label>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Livraison
                </p>
                <p className="mt-1 text-sm font-black text-[#0B1E3D]">
                  Paiement en ligne requis
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Retrait
                </p>
                <p className="mt-1 text-sm font-black text-[#0B1E3D]">
                  Gratuit
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                <ShieldCheck size={19} />
              </div>
              <div>
                <h2 className="font-black text-[#0B1E3D]">
                  Sécurité
                </h2>
                <p className="text-xs text-slate-500">
                  Informations relatives à l'accès administrateur.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Session administrateur
                </p>
                <p className="mt-1 text-sm font-bold text-[#0B1E3D]">
                  Déconnexion automatique après 30 minutes d'inactivité
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Accès aux données
                </p>
                <p className="mt-1 text-sm font-bold text-[#0B1E3D]">
                  Contrôlé par l'authentification et les permissions Supabase
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-black text-amber-800">
            Important
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-700">
            Ces paramètres constituent l'interface de configuration. La
            prochaine étape sera de les enregistrer côté serveur afin que les
            règles commerciales ne puissent pas être modifiées uniquement
            depuis le navigateur.
          </p>
        </div>
      </div>
    </div>
  )
}
