import { useEffect, useState } from 'react'
import {
  Bell,
  Check,
  Edit3,
  Megaphone,
  Plus,
  Power,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import {
  activerAnnonceAdmin,
  type Annonce,
  creerAnnonceAdmin,
  modifierAnnonceAdmin,
  recupererAnnoncesAdmin,
  supprimerAnnonceAdmin,
} from '../../services/supabase'

type Formulaire = {
  titre: string
  message: string
  type: string
  actif: boolean
  ordre: string
  dateDebut: string
  dateFin: string
}

const formulaireInitial: Formulaire = {
  titre: '',
  message: '',
  type: 'information',
  actif: true,
  ordre: '0',
  dateDebut: '',
  dateFin: '',
}

function convertirDateInput(valeur: string | null | undefined) {
  if (!valeur) return ''

  const date = new Date(valeur)

  if (Number.isNaN(date.getTime())) return ''

  const annee = date.getFullYear()
  const mois = String(date.getMonth() + 1).padStart(2, '0')
  const jour = String(date.getDate()).padStart(2, '0')
  const heures = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${annee}-${mois}-${jour}T${heures}:${minutes}`
}

function formatDate(valeur: string | null | undefined) {
  if (!valeur) return 'Aucune'

  const date = new Date(valeur)

  if (Number.isNaN(date.getTime())) return 'Date invalide'

  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function couleurType(type: string) {
  switch (type) {
    case 'promotion':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'important':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'nouveaute':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

export default function Annonces() {
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')

  const [modalOuverte, setModalOuverte] = useState(false)
  const [annonceModifiee, setAnnonceModifiee] =
    useState<Annonce | null>(null)

  const [formulaire, setFormulaire] =
    useState<Formulaire>(formulaireInitial)

  const [enregistrement, setEnregistrement] = useState(false)

  const [annonceASupprimer, setAnnonceASupprimer] =
    useState<Annonce | null>(null)

  async function chargerAnnonces() {
    setChargement(true)
    setErreur('')

    const resultat = await recupererAnnoncesAdmin()

    if (!resultat.success) {
      setErreur(resultat.error || 'Impossible de charger les annonces.')
      setAnnonces([])
    } else {
      setAnnonces(resultat.data || [])
    }

    setChargement(false)
  }

  useEffect(() => {
    chargerAnnonces()
  }, [])

  function ouvrirCreation() {
    setAnnonceModifiee(null)
    setFormulaire(formulaireInitial)
    setMessage('')
    setErreur('')
    setModalOuverte(true)
  }

  function ouvrirModification(annonce: Annonce) {
    setAnnonceModifiee(annonce)

    setFormulaire({
      titre: annonce.titre || '',
      message: annonce.message || '',
      type: annonce.type || 'information',
      actif: annonce.actif,
      ordre: String(annonce.ordre ?? 0),
      dateDebut: convertirDateInput(annonce.date_debut),
      dateFin: convertirDateInput(annonce.date_fin),
    })

    setMessage('')
    setErreur('')
    setModalOuverte(true)
  }

  function fermerModal() {
    if (enregistrement) return

    setModalOuverte(false)
    setAnnonceModifiee(null)
    setFormulaire(formulaireInitial)
  }

  function modifierChamp(
    champ: keyof Formulaire,
    valeur: string | boolean,
  ) {
    setFormulaire((ancien) => ({
      ...ancien,
      [champ]: valeur,
    }))
  }

  async function enregistrer() {
    const texte = formulaire.message.trim()

    if (!texte) {
      setErreur('Le message de l’annonce est obligatoire.')
      return
    }

    if (
      formulaire.dateDebut &&
      formulaire.dateFin &&
      formulaire.dateFin < formulaire.dateDebut
    ) {
      setErreur(
        'La date de fin ne peut pas être avant la date de début.',
      )
      return
    }

    setEnregistrement(true)
    setErreur('')
    setMessage('')

    const donnees = {
      titre: formulaire.titre.trim(),
      message: texte,
      type: formulaire.type,
      actif: formulaire.actif,
      ordre: Number(formulaire.ordre) || 0,
      dateDebut: formulaire.dateDebut
        ? new Date(formulaire.dateDebut).toISOString()
        : null,
      dateFin: formulaire.dateFin
        ? new Date(formulaire.dateFin).toISOString()
        : null,
    }

    const resultat = annonceModifiee
      ? await modifierAnnonceAdmin(annonceModifiee.id, donnees)
      : await creerAnnonceAdmin(donnees)

    if (!resultat.success) {
      setErreur(
        resultat.error ||
          'Impossible d’enregistrer l’annonce.',
      )
      setEnregistrement(false)
      return
    }

    setMessage(
      annonceModifiee
        ? 'Annonce modifiée avec succès.'
        : 'Annonce créée avec succès.',
    )

    await chargerAnnonces()

    setEnregistrement(false)
    setModalOuverte(false)
    setAnnonceModifiee(null)
    setFormulaire(formulaireInitial)
  }

  async function changerActivation(annonce: Annonce) {
    const resultat = await activerAnnonceAdmin(
      annonce.id,
      !annonce.actif,
    )

    if (!resultat.success) {
      setErreur(
        resultat.error ||
          'Impossible de modifier le statut.',
      )
      return
    }

    setAnnonces((ancien) =>
      ancien.map((item) =>
        item.id === annonce.id
          ? { ...item, actif: !annonce.actif }
          : item,
      ),
    )
  }

  function demanderSuppression(annonce: Annonce) {
    setErreur('')
    setAnnonceASupprimer(annonce)
  }

  async function supprimer() {
    if (!annonceASupprimer) return

    const annonce = annonceASupprimer
    setErreur('')

    const resultat = await supprimerAnnonceAdmin(annonce.id)

    if (!resultat.success) {
      setErreur(
        resultat.error ||
          'Impossible de supprimer l’annonce.',
      )
      return
    }

    setAnnonces((ancien) =>
      ancien.filter((item) => item.id !== annonce.id),
    )

    setAnnonceASupprimer(null)
    setMessage('Annonce supprimée.')
  }

  return (
    <div className="min-h-full bg-[#F7F8FA] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-sky-50 to-transparent lg:block" />

          <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#0284C7] ring-1 ring-sky-100">
                <Megaphone size={22} strokeWidth={2.3} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-[#0B1E3D]">
                    Annonces
                  </h1>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Communication
                  </span>
                </div>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Gérez les messages visibles dans la bande d’information de votre boutique.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={chargerAnnonces}
                disabled={chargement}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-[#0B1E3D] shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={chargement ? 'animate-spin' : ''}
                />
                Actualiser
              </button>

              <button
                type="button"
                onClick={ouvrirCreation}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0369A1] hover:shadow-md"
              >
                <Plus size={17} />
                Nouvelle annonce
              </button>
            </div>
          </div>
        </section>

        {/* ALERTES */}
        {erreur && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 shadow-sm">
            <X size={18} className="mt-0.5 shrink-0" />
            <span>{erreur}</span>
          </div>
        )}

        {message && !modalOuverte && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 shadow-sm">
            <Check size={18} className="mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* KPI */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Total
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-[#0B1E3D]">
                  {annonces.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                <Megaphone size={19} />
              </div>
            </div>

            <p className="mt-3 text-xs font-semibold text-slate-400">
              Annonces enregistrées
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">
                  Actives
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-emerald-600">
                  {annonces.filter((annonce) => annonce.actif).length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Check size={19} />
              </div>
            </div>

            <p className="mt-3 text-xs font-semibold text-slate-400">
              Potentiellement visibles
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Inactives
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-400">
                  {annonces.filter((annonce) => !annonce.actif).length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <Power size={19} />
              </div>
            </div>

            <p className="mt-3 text-xs font-semibold text-slate-400">
              Actuellement masquées
            </p>
          </div>
        </section>

        {/* LISTE */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-sm font-black text-[#0B1E3D]">
                Vos annonces
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-400">
                Les messages sont affichés selon leur ordre de priorité.
              </p>
            </div>

            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
              {annonces.length} {annonces.length > 1 ? 'annonces' : 'annonce'}
            </span>
          </div>

          {chargement ? (
            <div className="divide-y divide-slate-100">
              {[1, 2, 3].map((item) => (
                <div key={item} className="animate-pulse p-5 sm:p-6">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />
                    <div className="min-w-0 flex-1">
                      <div className="h-4 w-32 rounded bg-slate-200" />
                      <div className="mt-3 h-3 w-3/4 rounded bg-slate-100" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : annonces.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                <Bell size={30} />
              </div>

              <h2 className="mt-5 text-lg font-black text-[#0B1E3D]">
                Aucune annonce
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Créez votre première annonce pour communiquer une information,
                une promotion ou une nouveauté à vos clients.
              </p>

              <button
                type="button"
                onClick={ouvrirCreation}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0284C7] px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0369A1]"
              >
                <Plus size={16} />
                Créer une annonce
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {annonces.map((annonce) => (
                <article
                  key={annonce.id}
                  className="group p-5 transition hover:bg-slate-50/60 sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${couleurType(annonce.type)}`}
                      >
                        <Megaphone size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${couleurType(annonce.type)}`}
                          >
                            {annonce.type}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                              annonce.actif
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {annonce.actif ? 'Active' : 'Inactive'}
                          </span>

                          <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                            Priorité {annonce.ordre}
                          </span>
                        </div>

                        <h3 className="mt-3 text-base font-black text-[#0B1E3D]">
                          {annonce.titre || 'Annonce sans titre'}
                        </h3>

                        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                          {annonce.message}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-400">
                          <span>
                            Début : {formatDate(annonce.date_debut)}
                          </span>

                          <span>
                            Fin : {formatDate(annonce.date_fin)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 lg:pt-0.5">
                      <button
                        type="button"
                        onClick={() => changerActivation(annonce)}
                        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3.5 text-xs font-extrabold transition ${
                          annonce.actif
                            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <Power size={14} />
                        {annonce.actif ? 'Désactiver' : 'Activer'}
                      </button>

                      <button
                        type="button"
                        onClick={() => ouvrirModification(annonce)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-extrabold text-[#0B1E3D] transition hover:border-sky-200 hover:bg-sky-50 hover:text-[#0284C7]"
                      >
                        <Edit3 size={14} />
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() => demanderSuppression(annonce)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-3.5 text-xs font-extrabold text-red-600 transition hover:border-red-200 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MODALE */}
      {modalOuverte && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B1E3D]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/70 bg-white shadow-2xl sm:rounded-3xl">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0284C7]">
                    <Megaphone size={18} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black text-[#0B1E3D]">
                      {annonceModifiee
                        ? 'Modifier l’annonce'
                        : 'Nouvelle annonce'}
                    </h2>

                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      Préparez le message qui sera présenté à vos clients.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fermerModal}
                  disabled={enregistrement}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {erreur && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700">
                  {erreur}
                </div>
              )}

              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Titre
                </span>

                <input
                  type="text"
                  value={formulaire.titre}
                  onChange={(event) =>
                    modifierChamp('titre', event.target.value)
                  }
                  placeholder="Ex. Offre spéciale"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0B1E3D] outline-none transition placeholder:text-slate-300 focus:border-[#0284C7] focus:ring-4 focus:ring-sky-500/10"
                />
              </label>

              <label className="block">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Message *
                  </span>

                  <span className="text-[10px] font-semibold text-slate-400">
                    Visible par vos clients
                  </span>
                </div>

                <textarea
                  value={formulaire.message}
                  onChange={(event) =>
                    modifierChamp('message', event.target.value)
                  }
                  rows={5}
                  placeholder="Ex. Livraison à domicile disponible partout à Cotonou."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#0B1E3D] outline-none transition placeholder:text-slate-300 focus:border-[#0284C7] focus:ring-4 focus:ring-sky-500/10"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Type
                  </span>

                  <div className="grid grid-cols-2 gap-2.5">
  {[
    { value: 'information', label: 'Information', icon: 'ⓘ', description: 'Message général' },
    { value: 'promotion', label: 'Promotion', icon: '↗', description: 'Offre commerciale' },
    { value: 'nouveaute', label: 'Nouveauté', icon: '✦', description: 'Nouveau produit' },
    { value: 'important', label: 'Important', icon: '!', description: 'Message prioritaire' },
  ].map((option) => {
    const actif = formulaire.type === option.value

    return (
      <button
        key={option.value}
        type="button"
        onClick={() => modifierChamp('type', option.value)}
        className={`group relative rounded-2xl border p-3 text-left transition-all duration-200 ${
          actif
            ? 'border-[#0284C7] bg-sky-50 shadow-md shadow-sky-500/10 ring-2 ring-[#0284C7]/10'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
            actif
              ? 'bg-[#0284C7] text-white'
              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
          }`}>
            {option.icon}
          </div>

          <div className="min-w-0">
            <p className={`text-xs font-black ${
              actif ? 'text-[#0284C7]' : 'text-[#0B1E3D]'
            }`}>
              {option.label}
            </p>

            <p className="mt-0.5 text-[10px] font-medium leading-4 text-slate-400">
              {option.description}
            </p>
          </div>
        </div>

        {actif && (
          <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#0284C7] text-[10px] font-black text-white">
            ✓
          </div>
        )}
      </button>
    )
  })}
</div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Ordre d’affichage
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={formulaire.ordre}
                    onChange={(event) =>
                      modifierChamp('ordre', event.target.value)
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0B1E3D] outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-sky-500/10"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Date de début
                  </span>

                  <input
                    type="datetime-local"
                    value={formulaire.dateDebut}
                    onChange={(event) =>
                      modifierChamp('dateDebut', event.target.value)
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0B1E3D] outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-sky-500/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Date de fin
                  </span>

                  <input
                    type="datetime-local"
                    value={formulaire.dateFin}
                    onChange={(event) =>
                      modifierChamp('dateFin', event.target.value)
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0B1E3D] outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-sky-500/10"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() =>
                  modifierChamp('actif', !formulaire.actif)
                }
                className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                  formulaire.actif
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div>
                  <p className="text-sm font-black text-[#0B1E3D]">
                    Annonce active
                  </p>

                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                    {formulaire.actif
                      ? 'Elle pourra être affichée sur le site.'
                      : 'Elle restera masquée du site.'}
                  </p>
                </div>

                <div
                  className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
                    formulaire.actif
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
                      formulaire.actif
                        ? 'translate-x-5'
                        : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>

              {/* APERCU */}
              <div className="rounded-2xl border border-slate-200 bg-[#F7F8FA] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                    Aperçu client
                  </p>

                  <span className="text-[10px] font-semibold text-slate-400">
                    Bande d’information
                  </span>
                </div>

                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex min-h-14 items-center gap-3 px-4">
                    <Megaphone
                      size={16}
                      className="shrink-0 text-[#0284C7]"
                    />

                    <div className="min-w-0 text-sm leading-6">
                      {formulaire.titre && (
                        <span className="mr-2 font-black text-[#0B1E3D]">
                          {formulaire.titre}
                        </span>
                      )}

                      <span className="font-semibold text-slate-600">
                        {formulaire.message ||
                          'Votre message apparaîtra ici.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={fermerModal}
                  disabled={enregistrement}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-[#0B1E3D] transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={enregistrer}
                  disabled={enregistrement}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enregistrement ? (
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Check size={16} />
                  )}

                  {enregistrement
                    ? 'Enregistrement...'
                    : annonceModifiee
                      ? 'Enregistrer les modifications'
                      : 'Créer l’annonce'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {annonceASupprimer && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1E3D]/60 p-4 backdrop-blur-sm"
          onClick={() => setAnnonceASupprimer(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <Trash2 size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-red-500">
                  Confirmation
                </p>

                <h2 className="mt-1 text-lg font-black text-[#0B1E3D]">
                  Supprimer cette annonce ?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Cette action est définitive.
                </p>

                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-black text-[#0B1E3D]">
                    {annonceASupprimer.titre || 'Annonce sans titre'}
                  </p>

                  <p className="mt-1 line-clamp-3 text-xs font-medium leading-5 text-slate-500">
                    {annonceASupprimer.message}
                  </p>
                </div>

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setAnnonceASupprimer(null)}
                    className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-[#0B1E3D] transition hover:bg-slate-50"
                  >
                    Annuler
                  </button>

                  <button
                    type="button"
                    onClick={supprimer}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-extrabold text-white transition hover:bg-red-700"
                  >
                    <Trash2 size={15} />
                    Supprimer définitivement
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
