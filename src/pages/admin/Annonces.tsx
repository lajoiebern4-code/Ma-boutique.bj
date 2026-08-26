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

  return `${annee}-${mois}-${jour}`
}

function formatDate(valeur: string | null | undefined) {
  if (!valeur) return 'Aucune'

  const date = new Date(valeur)

  if (Number.isNaN(date.getTime())) return 'Date invalide'

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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
        ? `${formulaire.dateDebut}T00:00:00`
        : null,
      dateFin: formulaire.dateFin
        ? `${formulaire.dateFin}T23:59:59`
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

  async function supprimer(annonce: Annonce) {
    const confirme = window.confirm(
      `Supprimer définitivement l’annonce "${annonce.titre || annonce.message}" ?`,
    )

    if (!confirme) return

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

    setMessage('Annonce supprimée.')
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <Megaphone size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#0B1E3D]">
                  Annonces
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Gérez les messages affichés dans la bande d’information
                  de l’accueil.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={chargerAnnonces}
              disabled={chargement}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0B1E3D] transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
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
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0369A1]"
            >
              <Plus size={17} />
              Nouvelle annonce
            </button>
          </div>
        </div>

        {erreur && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <X size={18} className="mt-0.5 shrink-0" />
            <span>{erreur}</span>
          </div>
        )}

        {message && !modalOuverte && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            <Check size={18} className="mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total
            </p>
            <p className="mt-2 text-3xl font-black text-[#0B1E3D]">
              {annonces.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Actives
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-600">
              {annonces.filter((annonce) => annonce.actif).length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Inactives
            </p>
            <p className="mt-2 text-3xl font-black text-slate-400">
              {annonces.filter((annonce) => !annonce.actif).length}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {chargement ? (
            <div className="divide-y divide-slate-100">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse p-5"
                >
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-3/4 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : annonces.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Bell
                size={38}
                className="mx-auto text-slate-300"
              />

              <h2 className="mt-4 text-base font-black text-[#0B1E3D]">
                Aucune annonce
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Créez votre première annonce. Elle pourra ensuite
                apparaître automatiquement dans la bande d’information
                de l’accueil.
              </p>

              <button
                type="button"
                onClick={ouvrirCreation}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-extrabold text-white"
              >
                <Plus size={16} />
                Créer une annonce
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {annonces.map((annonce) => (
                <div
                  key={annonce.id}
                  className="p-5 transition hover:bg-slate-50/70"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${couleurType(annonce.type)}`}
                        >
                          {annonce.type}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            annonce.actif
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {annonce.actif ? 'Active' : 'Inactive'}
                        </span>

                        <span className="text-[10px] font-bold text-slate-400">
                          Ordre {annonce.ordre}
                        </span>
                      </div>

                      <h2 className="mt-3 text-base font-black text-[#0B1E3D]">
                        {annonce.titre || 'Annonce sans titre'}
                      </h2>

                      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                        {annonce.message}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-semibold text-slate-400">
                        <span>
                          Début : {formatDate(annonce.date_debut)}
                        </span>

                        <span>
                          Fin : {formatDate(annonce.date_fin)}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          changerActivation(annonce)
                        }
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold transition ${
                          annonce.actif
                            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <Power size={14} />
                        {annonce.actif
                          ? 'Désactiver'
                          : 'Activer'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          ouvrirModification(annonce)
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-[#0B1E3D] transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Edit3 size={14} />
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() => supprimer(annonce)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOuverte && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B1E3D]/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-black text-[#0B1E3D]">
                  {annonceModifiee
                    ? 'Modifier l’annonce'
                    : 'Nouvelle annonce'}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Cette annonce pourra apparaître dans la bande
                  d’information de l’accueil.
                </p>
              </div>

              <button
                type="button"
                onClick={fermerModal}
                disabled={enregistrement}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {erreur && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  {erreur}
                </div>
              )}

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Titre
                </span>

                <input
                  type="text"
                  value={formulaire.titre}
                  onChange={(event) =>
                    modifierChamp(
                      'titre',
                      event.target.value,
                    )
                  }
                  placeholder="Ex. Offre spéciale"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0B1E3D] outline-none transition focus:border-[#0284C7] focus:ring-4 focus:ring-blue-500/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Message *
                </span>

                <textarea
                  value={formulaire.message}
                  onChange={(event) =>
                    modifierChamp(
                      'message',
                      event.target.value,
                    )
                  }
                  rows={4}
                  placeholder="Ex. Livraison à domicile disponible partout à Cotonou."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#0B1E3D] outline-none transition focus:border-[#0284C7] focus:ring-4 focus:ring-blue-500/10"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Type
                  </span>

                  <select
                    value={formulaire.type}
                    onChange={(event) =>
                      modifierChamp(
                        'type',
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0B1E3D] outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="information">
                      Information
                    </option>
                    <option value="promotion">
                      Promotion
                    </option>
                    <option value="nouveaute">
                      Nouveauté
                    </option>
                    <option value="important">
                      Important
                    </option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Ordre d’affichage
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={formulaire.ordre}
                    onChange={(event) =>
                      modifierChamp(
                        'ordre',
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0B1E3D] outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Date de début
                  </span>

                  <input
                    type="date"
                    value={formulaire.dateDebut}
                    onChange={(event) =>
                      modifierChamp(
                        'dateDebut',
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0B1E3D] outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Date de fin
                  </span>

                  <input
                    type="date"
                    value={formulaire.dateFin}
                    onChange={(event) =>
                      modifierChamp(
                        'dateFin',
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0B1E3D] outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() =>
                  modifierChamp(
                    'actif',
                    !formulaire.actif,
                  )
                }
                className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                  formulaire.actif
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div>
                  <p className="text-sm font-black text-[#0B1E3D]">
                    Annonce active
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {formulaire.actif
                      ? 'Elle pourra être affichée sur le site.'
                      : 'Elle restera masquée du site.'}
                  </p>
                </div>

                <div
                  className={`flex h-7 w-12 items-center rounded-full p-1 transition ${
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

              <div className="rounded-2xl border border-slate-200 bg-[#F7F5F1] p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Aperçu
                </p>

                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="flex min-h-12 items-center gap-3 px-4">
                    <Megaphone
                      size={16}
                      className="shrink-0 text-orange-500"
                    />

                    <div className="min-w-0">
                      {formulaire.titre && (
                        <span className="mr-2 text-xs font-black text-[#0B1E3D]">
                          {formulaire.titre}
                        </span>
                      )}

                      <span className="text-xs font-semibold text-slate-600">
                        {formulaire.message ||
                          'Votre message apparaîtra ici.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={fermerModal}
                  disabled={enregistrement}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-[#0B1E3D] hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={enregistrer}
                  disabled={enregistrement}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-5 text-sm font-extrabold text-white shadow-sm hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-60"
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
    </div>
  )
}
