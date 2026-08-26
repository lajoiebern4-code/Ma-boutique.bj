import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  Eye,
  EyeOff,
  MessageSquare,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

type Avis = {
  id: string
  commande_id: string
  produit_id?: string | null
  nom_client: string
  telephone?: string | null
  note: number
  commentaire?: string | null
  statut: string
  created_at: string
  updated_at: string
}

const labelStatut = (statut: string) =>
  ({
    en_attente: 'En attente',
    publie: 'Publié',
    masque: 'Masqué',
  })[statut] || statut

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function Etoiles({ note }: { note: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((nombre) => (
        <Star
          key={nombre}
          size={15}
          className={
            nombre <= note
              ? 'fill-[#163B70] text-[#163B70]'
              : 'text-slate-200'
          }
        />
      ))}
    </div>
  )
}

export default function Avis() {
  const [avis, setAvis] = useState<Avis[]>([])
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState('tous')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [selection, setSelection] = useState<Avis | null>(null)

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')

    const { data, error } = await supabase.rpc('cs_lire_avis_admin')

    if (error) {
      console.error('Erreur chargement avis:', error)
      setErreur(error.message)
      setAvis([])
    } else {
      setAvis((data || []) as Avis[])
    }

    setChargement(false)
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  const modifierStatut = async (
    id: string,
    statut: 'publie' | 'masque',
  ) => {
    setErreur('')

    const { error } = await supabase
      .from('cs_avis_clients')
      .update({ statut })
      .eq('id', id)

    if (error) {
      setErreur(error.message)
      return
    }

    setSelection(null)
    await charger()
  }

  const supprimer = async (id: string) => {
    if (!window.confirm('Supprimer définitivement cet avis ?')) {
      return
    }

    setErreur('')

    const { error } = await supabase
      .from('cs_avis_clients')
      .delete()
      .eq('id', id)

    if (error) {
      setErreur(error.message)
      return
    }

    setSelection(null)
    await charger()
  }

  const avisFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase()

    return avis.filter((item) => {
      const correspondStatut =
        filtre === 'tous' || item.statut === filtre

      const correspondRecherche =
        !terme ||
        [
          item.nom_client,
          item.telephone,
          item.commentaire,
          item.commande_id,
        ].some((valeur) =>
          String(valeur || '')
            .toLowerCase()
            .includes(terme),
        )

      return correspondStatut && correspondRecherche
    })
  }, [avis, filtre, recherche])

  const statistiques = useMemo(() => {
    const moyenne =
      avis.length > 0
        ? avis.reduce((total, item) => total + Number(item.note || 0), 0) /
          avis.length
        : 0

    return {
      total: avis.length,
      attente: avis.filter((item) => item.statut === 'en_attente').length,
      publies: avis.filter((item) => item.statut === 'publie').length,
      moyenne: moyenne.toFixed(1),
    }
  }, [avis])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#163B70]">
            Relation client
          </p>

          <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1E3D]">
            Avis clients
          </h1>

          <p className="mt-0.5 text-xs text-slate-500">
            Modération et suivi des retours clients.
          </p>
        </div>

        <button
          type="button"
          onClick={charger}
          disabled={chargement}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-[#0B1E3D] shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={chargement ? 'animate-spin' : ''}
          />
          Actualiser
        </button>
      </div>

      {erreur && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          {erreur}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
            Avis
          </p>
          <p className="mt-1 text-xl font-extrabold text-[#0B1E3D]">
            {chargement ? '—' : statistiques.total}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
            En attente
          </p>
          <p className="mt-1 text-xl font-extrabold text-[#0B1E3D]">
            {chargement ? '—' : statistiques.attente}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
            Publiés
          </p>
          <p className="mt-1 text-xl font-extrabold text-[#0B1E3D]">
            {chargement ? '—' : statistiques.publies}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
            Note moyenne
          </p>
          <p className="mt-1 text-xl font-extrabold text-[#0B1E3D]">
            {chargement ? '—' : `${statistiques.moyenne}/5`}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2.5 border-b border-slate-100 p-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Rechercher client, téléphone, commentaire..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-[#163B70] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              ['tous', 'Tous'],
              ['en_attente', 'En attente'],
              ['publie', 'Publiés'],
              ['masque', 'Masqués'],
            ].map(([valeur, label]) => (
              <button
                key={valeur}
                type="button"
                onClick={() => setFiltre(valeur)}
                className={`rounded-lg px-3 py-2 text-[11px] font-bold ${
                  filtre === valeur
                    ? 'bg-[#0284C7] text-white'
                    : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {!chargement && avisFiltres.length === 0 ? (
            <div className="py-14 text-center text-sm text-slate-400">
              <MessageSquare className="mx-auto mb-2 text-slate-300" />
              Aucun avis trouvé.
            </div>
          ) : (
            avisFiltres.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-[#0B1E3D]">
                      {item.nom_client}
                    </p>

                    <Etoiles note={item.note} />

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.statut === 'publie'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.statut === 'masque'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-orange-50 text-[#0B1E3D]'
                      }`}
                    >
                      {labelStatut(item.statut)}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                    {item.commentaire || 'Aucun commentaire.'}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    {formatDate(item.created_at)} · Commande{' '}
                    {item.commande_id.slice(0, 8)}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    title="Voir"
                    onClick={() => setSelection(item)}
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-white"
                  >
                    <Eye size={15} />
                  </button>

                  {item.statut !== 'publie' && (
                    <button
                      type="button"
                      title="Publier"
                      onClick={() =>
                        modifierStatut(item.id, 'publie')
                      }
                      className="rounded-lg border border-emerald-200 p-2 text-emerald-600 hover:bg-emerald-50"
                    >
                      <Check size={15} />
                    </button>
                  )}

                  {item.statut !== 'masque' && (
                    <button
                      type="button"
                      title="Masquer"
                      onClick={() =>
                        modifierStatut(item.id, 'masque')
                      }
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
                    >
                      <EyeOff size={15} />
                    </button>
                  )}

                  <button
                    type="button"
                    title="Supprimer"
                    onClick={() => supprimer(item.id)}
                    className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {!chargement && (
          <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] font-semibold text-slate-400">
            {avisFiltres.length} avis affiché
            {avisFiltres.length > 1 ? 's' : ''}
          </div>
        )}
      </section>

      {selection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => setSelection(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#163B70]">
                  Détail de l'avis
                </p>

                <h2 className="text-lg font-extrabold text-[#0B1E3D]">
                  {selection.nom_client}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelection(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <Etoiles note={selection.note} />

              <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {selection.commentaire || 'Aucun commentaire.'}
              </p>

              <div className="text-xs leading-6 text-slate-500">
                Téléphone :{' '}
                <b className="text-[#0B1E3D]">
                  {selection.telephone || '—'}
                </b>
                <br />
                Commande :{' '}
                <b className="text-[#0B1E3D]">
                  {selection.commande_id}
                </b>
                <br />
                Date :{' '}
                <b className="text-[#0B1E3D]">
                  {formatDate(selection.created_at)}
                </b>
              </div>

              <div className="flex gap-2">
                {selection.statut !== 'publie' && (
                  <button
                    type="button"
                    onClick={() =>
                      modifierStatut(selection.id, 'publie')
                    }
                    className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Publier
                  </button>
                )}

                {selection.statut !== 'masque' && (
                  <button
                    type="button"
                    onClick={() =>
                      modifierStatut(selection.id, 'masque')
                    }
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Masquer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
