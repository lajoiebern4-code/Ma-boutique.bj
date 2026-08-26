import { useEffect, useState } from 'react'
import { useNavigationType, useSearchParams } from 'react-router-dom'
import {
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Search,
  Truck,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type Article = {
  id?: string
  produit_id?: string
  nom_produit?: string
  prix_unitaire?: number
  quantite?: number
  origine?: string
  total_ligne?: number
}

type Etape = {
  id?: string
  titre?: string
  statut?: string
  position?: number
  description?: string
  date_etape?: string
  created_at?: string
}

type Commande = {
  id?: string
  numero?: string
  statut?: string
  code_suivi?: string
  code_retrait?: string
  mode_reception?: string
  mode_paiement?: string
  adresse_livraison?: string
  created_at?: string
  total?: number
  acompte_requis?: number
  acompte_paye?: number
  livraison_statut?: string
  point_depart?: string
  point_destination?: string
  depart_prevu_at?: string
  arrivee_prevue_at?: string
  depart_reel_at?: string
  arrivee_reelle_at?: string
  livraison_confirmee_at?: string
  livreur_nom?: string
}

function formatPrix(value?: number) {
  return `${Math.round(Number(value || 0)).toLocaleString('fr-FR')} FCFA`
}

function formatDate(value?: string) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function libelleStatut(statut?: string) {
  const labels: Record<string, string> = {
    acompte_requis: 'Acompte requis',
    acompte_paye: 'Acompte reçu',
    commande_recue: 'Commande reçue',
    attente: 'En attente',
    en_attente: 'En attente',
    en_attente_paiement: 'Paiement en attente',
    confirmee: 'Commande confirmée',
    preparation: 'Préparation',
    pret: 'Commande prête',
    expedition: 'Expédition',
    transit: 'En transit',
    livree: 'Commande livrée',
    annulee: 'Commande annulée',
  }

  return labels[String(statut || '').toLowerCase()] || statut || 'Mise à jour'
}

function iconeEtape(statut?: string) {
  const value = String(statut || '').toLowerCase()

  if (
    value.includes('livr') ||
    value.includes('confirm') ||
    value.includes('paye')
  ) {
    return CheckCircle2
  }

  if (
    value.includes('exped') ||
    value.includes('transit') ||
    value.includes('livraison')
  ) {
    return Truck
  }

  return Package
}

function texteReception(mode?: string) {
  if (mode === 'livraison') {
    return {
      titre: 'Livraison à domicile',
      description:
        'Votre commande sera acheminée jusqu’à l’adresse indiquée lors de la commande.',
    }
  }

  return {
    titre: 'Retrait',
    description:
      'Votre commande sera disponible au point de retrait prévu par ChinaShop-Bénin.',
  }
}

export default function Suivi() {
  const [searchParams] = useSearchParams()
  const navigationType = useNavigationType()
  const [code, setCode] = useState('')
  const [commande, setCommande] = useState<Commande | null>(null)
  const CLE_SESSION_SUIVI = 'chinashop_suivi_commande'
  const [etapes, setEtapes] = useState<Etape[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  async function rechercher(
    event?: React.FormEvent,
    codeRecherche?: string,
  ) {
    event?.preventDefault()

    const valeur = (codeRecherche ?? code).trim().toUpperCase()

    if (valeur.length < 3) {
      setErreur('Veuillez saisir un code de suivi valide.')
      setCommande(null)
      setEtapes([])
      return
    }

    setChargement(true)
    setErreur('')
    setCommande(null)
    setEtapes([])
    setArticles([])

    const { data, error } = await supabase.rpc('suivre_commande', {
      p_code_suivi: valeur,
    })

    setChargement(false)

    if (error) {
      console.error('Erreur suivi commande:', error)
      setErreur('Impossible de récupérer cette commande pour le moment.')
      return
    }

    const resultat = Array.isArray(data) ? data[0] : data

    if (!resultat) {
      setErreur('Aucune commande ne correspond à ce code de suivi.')
      return
    }

    const commandeResultat = resultat.commande || resultat

    const etapesResultat = Array.isArray(resultat.etapes)
      ? [...resultat.etapes].sort(
          (a, b) =>
            Number(a.position || 0) - Number(b.position || 0),
        )
      : []

    const articlesResultat = Array.isArray(resultat.articles)
      ? resultat.articles
      : []

    setCommande(commandeResultat)
    setEtapes(etapesResultat)
    setArticles(articlesResultat)

    try {
      sessionStorage.setItem(
        CLE_SESSION_SUIVI,
        JSON.stringify({
          code: valeur,
          commande: commandeResultat,
          articles: articlesResultat,
          etapes: etapesResultat,
        }),
      )
    } catch (err) {
      console.warn('Impossible de mémoriser temporairement le suivi.', err)
    }
  }

  
  const actualiserSuiviSilencieusement = async (codeSuivi: string) => {
    const valeur = codeSuivi.trim().toUpperCase()

    if (valeur.length < 3) return

    try {
      const { data, error } = await supabase.rpc('suivre_commande', {
        p_code_suivi: valeur,
      })

      if (error) {
        console.warn('Actualisation automatique du suivi impossible:', error)
        return
      }

      const resultat = Array.isArray(data) ? data[0] : data

      if (!resultat) return

      const commandeResultat = resultat.commande || resultat

      const etapesResultat = Array.isArray(resultat.etapes)
        ? [...resultat.etapes].sort(
            (a, b) =>
              Number(a.position || 0) - Number(b.position || 0),
          )
        : []

      const articlesResultat = Array.isArray(resultat.articles)
        ? resultat.articles
        : []

      setCommande(commandeResultat)
      setEtapes(etapesResultat)
      setArticles(articlesResultat)

      try {
        sessionStorage.setItem(
          CLE_SESSION_SUIVI,
          JSON.stringify({
            code: valeur,
            commande: commandeResultat,
            articles: articlesResultat,
            etapes: etapesResultat,
          }),
        )
      } catch (err) {
        console.warn(
          'Impossible de mémoriser la mise à jour automatique du suivi.',
          err,
        )
      }
    } catch (err) {
      console.warn('Erreur pendant l’actualisation automatique:', err)
    }
  }

  useEffect(() => {
    const codeUrl = searchParams.get('code')?.trim()
    if (codeUrl) return

    // PUSH = arrivée depuis une autre page de l'application.
    // Dans ce cas, le client doit obligatoirement saisir son code.
    if (navigationType === 'PUSH') {
      sessionStorage.removeItem(CLE_SESSION_SUIVI)
      setCode('')
      setCommande(null)
      setArticles([])
      setEtapes([])
      return
    }

    // POP correspond notamment à l'ouverture/rechargement de la page.
    // On restaure donc le dernier suivi disponible.
    try {
      const sauvegarde = sessionStorage.getItem(CLE_SESSION_SUIVI)
      if (!sauvegarde) return

      const contenu = JSON.parse(sauvegarde)

      if (contenu?.code && contenu?.commande) {
        setCode(String(contenu.code).toUpperCase())
        setCommande(contenu.commande)
        setArticles(
          Array.isArray(contenu.articles)
            ? contenu.articles
            : [],
        )
        setEtapes(
          Array.isArray(contenu.etapes)
            ? contenu.etapes
            : [],
        )
      }
    } catch (err) {
      console.warn(
        'Impossible de restaurer le suivi temporaire.',
        err,
      )
      sessionStorage.removeItem(CLE_SESSION_SUIVI)
    }
  }, [searchParams, navigationType])

  useEffect(() => {
    const codeUrl = searchParams.get('code')?.trim()

    if (!codeUrl) return

    const codeNormalise = codeUrl.toUpperCase()
    setCode(codeNormalise)
    rechercher(undefined, codeNormalise)

    // Le code sert uniquement à l'arrivée initiale.
    // Après la recherche, on le retire de l'URL afin qu'un retour
    // sur la page exige à nouveau la saisie du code.
    window.history.replaceState({}, '', window.location.pathname)
  }, [searchParams])

  useEffect(() => {
    if (!commande?.id || !code) return

    let actif = true

    const actualiser = async () => {
      if (!actif) return
      await actualiserSuiviSilencieusement(code)
    }

    const intervalle = window.setInterval(actualiser, 5000)

    return () => {
      actif = false
      window.clearInterval(intervalle)
    }
  }, [commande?.id, code])

  const [progressionLivraison, setProgressionLivraison] = useState(0)

  useEffect(() => {
    const livraisonStatut = String(
      commande?.livraison_statut || 'non_planifiee',
    ).toLowerCase()

    if (livraisonStatut === 'arrivee' || livraisonStatut === 'livree') {
      setProgressionLivraison(1)
      return
    }

    if (livraisonStatut !== 'en_route') {
      setProgressionLivraison(0)
      return
    }

    setProgressionLivraison((ancienne) => {
      if (ancienne < 0.05) return 0.05
      return ancienne
    })

    const intervalle = window.setInterval(() => {
      setProgressionLivraison((ancienne) => {
        if (ancienne >= 0.92) return 0.08
        return ancienne + 0.01
      })
    }, 900)

    return () => {
      window.clearInterval(intervalle)
    }
  }, [commande?.livraison_statut])

  const statut = String(commande?.statut || '').toLowerCase()
  const derniereEtape =
    etapes.length > 0 ? etapes[etapes.length - 1] : null

  const reception = texteReception(commande?.mode_reception)

  const acompteRequis = Number(commande?.acompte_requis || 0)
  const acomptePaye = Number(commande?.acompte_paye || 0)

  return (
    <main className="min-h-[70vh] bg-[#F7F5F1]">
      <section className="bg-[#0284C7]">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
            ChinaShop-Bénin
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Suivez votre commande
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Entrez votre code de suivi pour connaître l’avancement de votre
            commande, de sa préparation jusqu’à sa réception.
          </p>

          <form
            onSubmit={rechercher}
            className="mx-auto mt-8 max-w-2xl rounded-2xl bg-white p-2 shadow-xl"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="code-suivi"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.toUpperCase())
                  }
                  placeholder="Ex. CS-46A48C"
                  autoComplete="off"
                  className="h-12 w-full rounded-xl bg-slate-50 pl-11 pr-4 text-sm font-bold text-[#0B1E3D] outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <button
                type="submit"
                disabled={chargement}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-7 text-sm font-bold text-white transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Search size={17} />
                {chargement ? 'Recherche…' : 'Voir ma commande'}
              </button>
            </div>

            {erreur && (
              <p className="mt-2 rounded-xl bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700">
                {erreur}
              </p>
            )}
          </form>
        </div>
      </section>

      {commande && (
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-100 p-5 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Commande
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-[#0B1E3D]">
                    {commande.numero || 'Commande'}
                  </h2>

                  {commande.code_suivi && (
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Code de suivi :{' '}
                      <span className="text-[#0B1E3D]">
                        {commande.code_suivi}
                      </span>
                    </p>
                  )}

                  {commande.mode_reception === 'retrait' &&
                    statut === 'pret' &&
                    commande.code_retrait && (
                      <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
                          Code de retrait
                        </p>
                        <p className="mt-1 text-2xl font-black tracking-widest text-[#0B1E3D]">
                          {commande.code_retrait}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Présentez ce code au point de retrait pour récupérer votre commande.
                        </p>
                      </div>
                    )}
                </div>

                <span
                  className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-bold ${
                    statut === 'livree'
                      ? 'bg-emerald-50 text-emerald-700'
                      : statut === 'annulee'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-orange-50 text-orange-700'
                  }`}
                >
                  {libelleStatut(statut)}
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="rounded-2xl bg-slate-50 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-600 ring-1 ring-slate-200">
                    <Package size={21} />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Dernière mise à jour
                    </p>

                    <h3 className="mt-1 text-lg font-black text-[#0B1E3D]">
                      {derniereEtape?.titre ||
                        libelleStatut(statut)}
                    </h3>

                    {derniereEtape?.description && (
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {derniereEtape.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {articles.length > 0 && (
  <div className="mb-8">
    <div className="mb-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Votre commande
      </p>
      <h3 className="mt-1 text-lg font-black text-[#0B1E3D]">
        Articles commandés
      </h3>
    </div>

    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
      {articles.map((article, index) => (
        <div
          key={article.id || `${article.produit_id}-${index}`}
          className="flex items-center justify-between gap-4 p-4"
        >
          <div className="min-w-0">
            <p className="font-bold text-[#0B1E3D]">
              {article.nom_produit || 'Article'}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Quantité : {article.quantite || 0}
              {article.origine ? ` · ${article.origine}` : ''}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {formatPrix(article.prix_unitaire)} / unité
            </p>
          </div>

          <p className="shrink-0 text-sm font-black text-[#0B1E3D]">
            {formatPrix(article.total_ligne)}
          </p>
        </div>
      ))}
    </div>
  </div>
)}

<div className="mt-8">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Avancement
                    </p>

                    <h3 className="mt-1 text-lg font-black text-[#0B1E3D]">
                      Historique de votre commande
                    </h3>
                  </div>

                  <span className="text-xs font-bold text-slate-400">
                    {etapes.length} étape
                    {etapes.length > 1 ? 's' : ''}
                  </span>
                </div>

                {etapes.length === 0 ? (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-7 text-center">
                    <Package
                      size={28}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      Aucun événement de suivi n’est encore disponible.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6">
                    {etapes.map((etape, index) => {
                      const Icon = iconeEtape(etape.statut)
                      const estLivree =
                        String(commande?.statut || '').toLowerCase() === 'livree' ||
                        String(etape.statut || '').toLowerCase() === 'livree'

                      const actuelle =
                        index === etapes.length - 1 && !estLivree

                      return (
                        <div
                          key={
                            etape.id ||
                            `${etape.position}-${etape.statut}-${index}`
                          }
                          className="flex gap-4"
                        >
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                                actuelle
                                  ? 'bg-orange-600 text-white ring-4 ring-orange-100'
                                  : 'bg-emerald-50 text-emerald-600'
                              }`}
                            >
                              <Icon size={19} />
                            </div>

                            {index < etapes.length - 1 && (
                              <div className="h-16 w-px bg-slate-200" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 pb-7">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <p
                                className={`text-sm font-extrabold ${
                                  actuelle
                                    ? 'text-[#0B1E3D]'
                                    : 'text-slate-700'
                                }`}
                              >
                                {etape.titre ||
                                  libelleStatut(etape.statut)}
                              </p>

                              {(etape.date_etape ||
                                etape.created_at) && (
                                <span className="text-[11px] font-semibold text-slate-400">
                                  {formatDate(
                                    etape.date_etape ||
                                      etape.created_at,
                                  )}
                                </span>
                              )}
                            </div>

                            {etape.description && (
                              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                                {etape.description}
                              </p>
                            )}

                            {actuelle && (
                              <span className="mt-2 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700">
                                Étape actuelle
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 ring-1 ring-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Réception
                  </p>

                  <p className="mt-2 flex items-center gap-2 text-sm font-black text-[#0B1E3D]">
                    {commande.mode_reception === 'livraison' ? (
                      <Truck size={17} className="text-orange-600" />
                    ) : (
                      <MapPin size={17} className="text-orange-600" />
                    )}

                    {reception.titre}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {reception.description}
                  </p>

                  {commande.mode_reception === 'livraison' &&
                    commande.adresse_livraison && (
                      <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                        {commande.adresse_livraison}
                      </p>
                    )}
                </div>

                {commande.total !== undefined && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 ring-1 ring-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Montant de la commande
                    </p>

                    <p className="mt-2 text-xl font-black text-[#0B1E3D]">
                      {formatPrix(commande.total)}
                    </p>

                    {acompteRequis > 0 && (
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Acompte :{' '}
                        <strong className="text-slate-700">
                          {formatPrix(acomptePaye)}
                        </strong>{' '}
                        sur {formatPrix(acompteRequis)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {commande.mode_reception === 'livraison' && (() => {
          const livraisonStatut = String(
            commande.livraison_statut || 'non_planifiee',
          ).toLowerCase()

          const depart = commande.point_depart || 'ChinaShop-Bénin'
          const destination =
            commande.point_destination ||
            'Destination'

          const enRoute = livraisonStatut === 'en_route'
          const arrivee = livraisonStatut === 'arrivee'
          const livree = livraisonStatut === 'livree'

          return (
            <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-5 ring-1 ring-slate-100">
              <div className="flex items-center gap-2">
                <Truck size={17} className="text-orange-600" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Livraison
                </p>
              </div>

              <p className="mt-2 text-sm font-black text-[#0B1E3D]">
                {livree
                  ? 'Colis livré.'
                  : arrivee
                    ? 'Le livreur est arrivé dans votre zone.'
                    : enRoute
                      ? 'Votre commande est en cours de livraison.'
                      : 'Votre livraison est en préparation.'}
              </p>

              <div className="mt-6 overflow-hidden rounded-2xl bg-slate-50 px-3 py-5 sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="w-28 shrink-0 text-center sm:w-36">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-orange-600 shadow-sm ring-1 ring-slate-200">
                      <span className="text-xl">🏪</span>
                    </div>

                    <p className="mt-2 truncate text-[11px] font-extrabold text-slate-600">
                      {depart}
                    </p>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Départ
                    </p>
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <div className="relative h-2 rounded-full bg-slate-200">
                      <div
                                                                 className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-1000 ease-linear ${
                                                      livree || arrivee
                                                        ? 'bg-emerald-500'
                                                        : 'bg-orange-500'
                                                    }`}
                                                                 style={{
                                                                   width: `${Math.min(100, Math.max(0, progressionLivraison * 100))}%`,
                                                                 }}
                                                               />

                      <div
                        className="absolute top-1/2 flex h-10 w-10 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-[#0284C7] text-lg shadow-lg transition-[left] duration-1000 ease-linear"
                        style={{
                          left: `${Math.min(100, Math.max(0, progressionLivraison * 100))}%`,
                        }}
                      >
                        {livree || arrivee ? '📍' : '🛵'}
                      </div>
                    </div>
                  </div>

                  <div className="w-28 shrink-0 text-center sm:w-36">
                    <div
                      className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full shadow-sm ring-1 ${
                        livree || arrivee
                          ? 'bg-emerald-50 text-emerald-600 ring-emerald-100'
                          : 'bg-white text-slate-400 ring-slate-200'
                      }`}
                    >
                      {livree ? (
                        <CheckCircle2 size={22} />
                      ) : (
                        <MapPin size={21} />
                      )}
                    </div>

                    <p className="mt-2 truncate text-[11px] font-extrabold text-slate-600">
                      {destination}
                    </p>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Destination
                    </p>
                  </div>
                </div>

                <div className="mt-5 text-center">
                  <p className="text-xs font-bold text-slate-500">
                    {livree
                      ? '✅ Votre colis a été livré.'
                      : arrivee
                        ? '📍 Le livreur est arrivé dans votre zone.'
                        : enRoute
                          ? '🛵 Le livreur est en route vers vous.'
                          : '🏪 Le trajet sera lancé dès la prise en charge.'}
                  </p>
                </div>
              </div>


            </div>
          )
        })()}

        {statut === 'annulee' && (
                <div className="mt-5 rounded-2xl bg-red-50 p-5 text-center">
                  <p className="font-bold text-red-700">
                    Cette commande a été annulée.
                  </p>
                </div>
              )}

              {commande.created_at && (
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Clock3 size={14} />
                  Commande enregistrée le{' '}
                  {formatDate(commande.created_at)}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
