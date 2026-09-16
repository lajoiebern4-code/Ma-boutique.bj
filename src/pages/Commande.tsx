import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  User,
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import {
  initierPaiementAcompteInvite,
  initierPaiementSoldeInvite,
  enregistrerReferenceTransaction,
  envoyerPreuvePaiement,
  recupererMoyensPaiementActifs,
  recupererTarifsLivraison,
  recupererVariantesProduit,
  sauvegarderCommandeV2,
} from '../services/supabase'

function formatPrix(prix: number) {
  return `${prix.toLocaleString('fr-FR')} FCFA`
}

type Etape = 1 | 2 | 3 | 4

export default function Commande() {
  const navigate = useNavigate()

  const {
    items,
    sousTotal,
    reduction,
    totalAvecReduction,
    vider,
  } = useCart()

  const [etape, setEtape] = useState<Etape>(1)

  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [erreurTelephone, setErreurTelephone] = useState('')
  const [erreurCommande, setErreurCommande] = useState('')
  const [email, setEmail] = useState('')

  const [modeReception, setModeReception] =
    useState<'livraison' | 'retrait'>('retrait')

  const [modePaiement, setModePaiement] =
    useState<'especes' | 'mobile_money'>('especes')

  const [adresse, setAdresse] = useState('')

  const [moyensPaiement, setMoyensPaiement] = useState<any[]>([])
  const [chargementPaiement, setChargementPaiement] = useState(false)
  const [moyenPaiementSelectionne, setMoyenPaiementSelectionne] = useState('')
  const [referenceTransaction, setReferenceTransaction] = useState('')
  const [preuvePaiement, setPreuvePaiement] = useState<File | null>(null)

  const [departement, setDepartement] = useState('')
  const [commune, setCommune] = useState('')
  const [quartier, setQuartier] = useState('')
  const [rue, setRue] = useState('')
  const [repere, setRepere] = useState('')

  const [chargement, setChargement] = useState(false)


  useEffect(() => {
    if (etape !== 3 || modePaiement !== 'mobile_money') return

    let actif = true
    setChargementPaiement(true)

    recupererMoyensPaiementActifs()
      .then((resultat) => {
        if (!actif) return

        setMoyensPaiement(resultat)

        if (
          resultat.length > 0 &&
          !resultat.some(
            (moyen) => moyen.code === moyenPaiementSelectionne,
          )
        ) {
          setMoyenPaiementSelectionne(resultat[0].code)
        }
      })
      .catch((error) => {
        if (!actif) return

        console.error(
          'Impossible de charger les moyens de paiement Mobile Money:',
          error,
        )
        setMoyensPaiement([])
      })
      .finally(() => {
        if (actif) setChargementPaiement(false)
      })

    return () => {
      actif = false
    }
  }, [etape, modePaiement])

  const total = totalAvecReduction

  const articlesStock = useMemo(
    () =>
      items.filter(
        (item) => !item.produit.surCommande,
      ),
    [items],
  )

  const articlesSurCommande = useMemo(
    () =>
      items.filter(
        (item) => item.produit.surCommande === true,
      ),
    [items],
  )

  const totalStock = useMemo(
    () =>
      articlesStock.reduce(
        (total, item) =>
          total +
          Number(item.produit.prix || 0) *
            Number(item.quantite || 0),
        0,
      ),
    [articlesStock],
  )

  const totalSurCommande = useMemo(
    () =>
      articlesSurCommande.reduce(
        (total, item) =>
          total +
          Number(item.produit.prix || 0) *
            Number(item.quantite || 0),
        0,
      ),
    [articlesSurCommande],
  )

  const panierMixte =
    articlesStock.length > 0 && articlesSurCommande.length > 0

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#F7F9FC] px-4 py-10">
        <div className="mx-auto max-w-xl rounded-[28px] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <ShoppingBag
            className="mx-auto text-slate-300"
            size={50}
          />

          <h1 className="mt-5 text-2xl font-black text-[#0B1E3D]">
            Votre panier est vide
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Ajoutez des articles avant de continuer votre commande.
          </p>

          <button
            type="button"
            onClick={() => navigate('/catalogue')}
            className="mt-6 rounded-2xl bg-[#0284C7] px-7 py-3 text-sm font-black text-white"
          >
            Voir le catalogue
          </button>
        </div>
      </main>
    )
  }

  function validerEtape1() {
    if (!nom.trim()) {
      setErreurCommande('Veuillez renseigner votre nom complet.')
      return false
    }

    if (!telephone.trim()) {
      setErreurTelephone('Veuillez renseigner votre numéro de téléphone.')
      return false
    }

    if (!/^01\d{8}$/.test(telephone.trim())) {
      setErreurTelephone('Le numéro doit contenir exactement 10 chiffres et commencer par 01.')
      return false
    }

    if (!telephone.trim()) {
      return false
    }

    return true
  }

  function validerEtape2() {
    if (modeReception === 'livraison') {
      if (!departement.trim()) {
        setErreurCommande('Veuillez sélectionner votre département de livraison.')
        return false
      }

      if (!commune.trim()) {
        setErreurCommande('Veuillez sélectionner votre commune de livraison.')
        return false
      }

      if (!quartier.trim()) {
        setErreurCommande('Veuillez renseigner votre quartier.')
        return false
      }

      if (!rue.trim()) {
        setErreurCommande('Veuillez renseigner votre rue ou adresse précise.')
        return false
      }
    }

    return true
  }

  function validerEtape3() {
    if (
      modeReception === 'livraison' &&
      modePaiement !== 'mobile_money'
    ) {
      setErreurCommande('La livraison nécessite un paiement Mobile Money.')
      return false
    }

    if (modePaiement === 'mobile_money') {

      if (!moyenPaiementSelectionne) {
        setErreurCommande(
          'Veuillez sélectionner votre moyen de paiement Mobile Money.',
        )
        return false
      }

      if (
        !moyensPaiement.some(
          (moyen) => moyen.code === moyenPaiementSelectionne,
        )
      ) {
        setErreurCommande(
          'Le moyen de paiement sélectionné n’est plus disponible. Veuillez en choisir un autre.',
        )
        return false
      }

      if (!referenceTransaction.trim()) {
        setErreurCommande(
          'Veuillez renseigner la référence de votre transaction Mobile Money.',
        )
        return false
      }

      if (!preuvePaiement) {
        setErreurCommande(
          'Veuillez joindre la preuve de votre paiement Mobile Money.',
        )
        return false
      }

      if (preuvePaiement.size > 5 * 1024 * 1024) {
        setErreurCommande(
          'La preuve de paiement ne doit pas dépasser 5 Mo.',
        )
        return false
      }

      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(
          preuvePaiement.type,
        )
      ) {
        setErreurCommande(
          'La preuve doit être une image JPG, PNG ou WebP.',
        )
        return false
      }
    }

    return true
  }

  function suivant() {
    if (etape === 1 && !validerEtape1()) return
    if (etape === 2 && !validerEtape2()) return
    if (etape === 3 && !validerEtape3()) return

    setEtape((ancienne) =>
      Math.min(4, ancienne + 1) as Etape,
    )
  }

  function precedent() {
    setEtape((ancienne) =>
      Math.max(1, ancienne - 1) as Etape,
    )
  }

  async function confirmerCommande() {
    if (!validerEtape1()) {
      setEtape(1)
      return
    }

    if (!validerEtape2()) {
      setEtape(2)
      return
    }

    if (!validerEtape3()) {
      setEtape(3)
      return
    }

    const lignesAvecVarianteManquante = items.filter(
      (item) =>
        !item.produit.variante_id &&
        Object.prototype.hasOwnProperty.call(item.produit, 'variante_nom'),
    )

    if (lignesAvecVarianteManquante.length > 0) {
      const article = lignesAvecVarianteManquante[0]

      setErreurCommande(
        `La variante de « ${article.produit.nom} » n’est plus sélectionnée. Retournez au produit pour choisir une variante.`,
      )
      return
    }

    const commande = {
      nomClient: nom,
      telephone,
      email,
      modeReception,
      modePaiement,
      departementLivraison: departement || null,
      communeLivraison: commune || null,
      quartierLivraison: quartier || null,
      rueLivraison: rue || null,
      repereLivraison: repere || null,
      articles: items.map((item) => ({
        id: item.produit.id,
        qte: item.quantite,
        variante_id: item.produit.variante_id || null,
        variante_nom: item.produit.variante_nom || null,
      })),
    }

      setChargement(true)

      try {
        const resultat = await sauvegarderCommandeV2(commande)

        if (!resultat.success) {
          setErreurCommande(
            resultat.error ||
              'Impossible de créer la commande.',
          )
          return
        }

        let paiementInitialise = null

        if (modePaiement === 'mobile_money') {
          if (!resultat.paiementAccesToken) {
            throw new Error(
              'La commande a été créée mais son accès de paiement est indisponible.',
            )
          }

          if (Number(resultat.acompteRequis || 0) > 0) {
            paiementInitialise = await initierPaiementAcompteInvite(
              resultat.numeroCommande,
              resultat.paiementAccesToken,
              moyenPaiementSelectionne,
            )
          } else {
            paiementInitialise = await initierPaiementSoldeInvite(
              resultat.numeroCommande,
              resultat.paiementAccesToken,
              moyenPaiementSelectionne,
            )
          }

          if (!paiementInitialise?.success) {
            throw new Error(
              paiementInitialise?.error ||
                'Impossible d’initialiser le paiement Mobile Money.',
            )
          }

          const paiementId = String(
            paiementInitialise?.paiement_id || '',
          ).trim()

          if (!paiementId) {
            throw new Error(
              'Le paiement a été initialisé mais son identifiant est indisponible.',
            )
          }

          await enregistrerReferenceTransaction(
            resultat.numeroCommande,
            resultat.paiementAccesToken,
            paiementId,
            referenceTransaction.trim(),
          )

          await envoyerPreuvePaiement(
            resultat.numeroCommande,
            resultat.paiementAccesToken,
            paiementId,
            preuvePaiement as File,
          )
        }

        vider()

        sessionStorage.setItem(
          'chinashop_commande_resultat',
          JSON.stringify({
            commandeId: resultat.commandeId,
            numeroCommande: resultat.numeroCommande,
            codeSuivi: resultat.codeSuivi,
            codeRetrait: resultat.codeRetrait,
            total: resultat.total,
            acompteRequis: resultat.acompteRequis,
            acomptePaye: resultat.acomptePaye,
            statut: resultat.statut,
            modeReception: commande.modeReception,
            modePaiement: commande.modePaiement,
            telephone: commande.telephone,
            moyenPaiement: moyenPaiementSelectionne,
            paiementAccesToken: resultat.paiementAccesToken,
            paiement: paiementInitialise,
          }),
        )

        navigate('/confirmation')
      } catch (error) {
        console.error(
          'Erreur inattendue lors de la confirmation de commande:',
          error,
        )

        setErreurCommande(
          error instanceof Error
            ? error.message
            : 'Une erreur inattendue est survenue lors de la création de la commande.',
        )
      } finally {
        setChargement(false)
      }
    }

  const etapes = [
    {
      numero: 1,
      titre: 'Vos informations',
      description: 'Identité et contact',
      icon: User,
    },
    {
      numero: 2,
      titre: 'Mode de réception',
      description: 'Retrait ou livraison',
      icon: modeReception === 'livraison' ? MapPin : Package,
    },
    {
      numero: 3,
      titre: 'Paiement',
      description: 'Choisissez votre moyen de paiement',
      icon: CreditCard,
    },
    {
      numero: 4,
      titre: 'Vérification',
      description: 'Vérifiez votre commande',
      icon: Check,
    },
  ]

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">

        <button
          type="button"
          onClick={() => navigate('/panier')}
          className="group mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-[#0B1E3D]"
        >
          <ArrowLeft
            size={15}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          Retour au panier
        </button>

        {/* HEADER */}
        <div className="relative mb-8 overflow-hidden rounded-[32px] bg-[#0B1E3D] px-6 py-7 text-white shadow-xl shadow-slate-200 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#0284C7]/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
              <ShoppingBag size={25} />
            </div>

            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-300">
                ChinaShop-Bénin
              </p>

              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Finaliser ma commande
              </h1>

              <p className="mt-1.5 text-sm text-slate-300">
                Quelques étapes pour confirmer votre commande.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[270px_1fr] lg:gap-8">

          {/* ÉCHELLE */}
          <aside className="h-fit rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Progression
              </p>

              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-black text-[#0284C7]">
                {etape}/4
              </span>
            </div>

            <div className="relative">
              <div className="absolute left-[20px] top-5 bottom-5 w-px bg-slate-100" />

              <div
                className="absolute left-[20px] top-5 w-px bg-[#0284C7] transition-all duration-500"
                style={{
                  height:
                    etape === 1
                      ? '0%'
                      : etape === 2
                        ? '33%'
                        : etape === 3
                          ? '66%'
                          : '100%',
                }}
              />

              <div className="relative space-y-7">
                {etapes.map((item) => {
                  const Icon = item.icon
                  const actif = etape === item.numero
                  const termine = etape > item.numero

                  return (
                    <button
                      key={item.numero}
                      type="button"
                      onClick={() => {
                        if (item.numero < etape) {
                          setEtape(item.numero as Etape)
                        }
                      }}
                      className="group relative flex w-full items-center gap-3 text-left"
                    >
                      <div
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white text-sm font-black transition ${
                          termine
                            ? 'bg-[#0284C7] text-white shadow-sm'
                            : actif
                              ? 'bg-[#0B1E3D] text-white shadow-lg shadow-slate-200'
                              : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                        }`}
                      >
                        {termine ? (
                          <Check size={16} strokeWidth={3} />
                        ) : (
                          <Icon size={16} />
                        )}
                      </div>

                      <div>
                        <p
                          className={`text-sm font-black ${
                            actif || termine
                              ? 'text-[#0B1E3D]'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.numero}. {item.titre}
                        </p>

                        <p className="mt-0.5 text-[11px] leading-4 text-slate-400">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          {/* FORMULAIRE */}
          <section>

            {/* ÉTAPE 1 */}
            {etape === 1 && (
              <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-7 sm:px-8 sm:py-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#0284C7]">
                      <User size={20} />
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0284C7]">
                        Étape 01
                      </span>

                      <h2 className="mt-1.5 text-2xl font-black tracking-tight text-[#0B1E3D] sm:text-[27px]">
                        Vos informations
                      </h2>

                      <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
                        Indiquez vos coordonnées pour que nous puissions vous contacter concernant votre commande.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-7 sm:px-8 sm:py-8">
                  <div className="space-y-5">

                    <div>
                      <label className="mb-2.5 block text-xs font-black text-[#0B1E3D]">
                        Nom complet
                        <span className="ml-1 text-[#0284C7]">*</span>
                      </label>

                      <div className="group relative">
                        <User
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#0284C7]"
                          size={18}
                        />

                        <input
                          value={nom}
                          onChange={(e) => setNom(e.target.value)}
                          placeholder="Ex. Jean Dupont"
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-12 pr-4 text-sm font-semibold text-[#0B1E3D] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0284C7] focus:bg-white focus:ring-4 focus:ring-sky-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2.5 block text-xs font-black text-[#0B1E3D]">
                        Numéro de téléphone
                        <span className="ml-1 text-[#0284C7]">*</span>
                      </label>

                      <div className="group relative">
                        <Phone
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#0284C7]"
                          size={18}
                        />

                        <input
                          value={telephone}
                          onChange={(e) => {
                            const chiffres = e.target.value.replace(/\D/g, '').slice(0, 10)
                            setTelephone(chiffres)
                            setErreurTelephone('')
                          }}
                          maxLength={10}
                          inputMode="numeric"
                          pattern="01[0-9]{8}"
                          placeholder="01XXXXXXXX"
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-12 pr-4 text-sm font-semibold text-[#0B1E3D] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0284C7] focus:bg-white focus:ring-4 focus:ring-sky-50"
                        />
                      </div>

                      {erreurTelephone ? (
                          <p className="mt-2 text-[11px] font-bold leading-5 text-red-600">
                            {erreurTelephone}
                          </p>
                        ) : telephone.length > 0 && !/^01\d{8}$/.test(telephone) ? (
                          <p className="mt-2 text-[11px] font-bold leading-5 text-red-600">
                            Le numéro doit contenir 10 chiffres et commencer par 01.
                          </p>
                        ) : (
                          <p className="mt-2 text-[11px] leading-5 text-slate-400">
                            Format obligatoire : 01XXXXXXXX
                          </p>
                        )}
                    </div>

                    <div>
                      <label className="mb-2.5 block text-xs font-black text-[#0B1E3D]">
                        E-mail
                        <span className="ml-1 font-medium text-slate-400">
                          (facultatif)
                        </span>
                      </label>

                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        type="email"
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-semibold text-[#0B1E3D] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0284C7] focus:bg-white focus:ring-4 focus:ring-sky-50"
                      />

                      <p className="mt-2 text-[11px] leading-5 text-slate-400">
                        Pour recevoir les informations importantes liées à votre commande.
                      </p>
                    </div>

                  </div>

                  <div className="mt-8 border-t border-slate-100 pt-6">
                    <button
                      type="button"
                      onClick={suivant}
                      className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0284C7] text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:bg-[#0369A1] active:scale-[0.99]"
                    >
                      Continuer
                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </button>

                    <p className="mt-3 text-center text-[11px] text-slate-400">
                      Étape 1 sur 4
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* ÉTAPE 2 */}
            {etape === 2 && (
              <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-sm">

                <div className="border-b border-slate-100 px-6 py-7 sm:px-8 sm:py-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#0284C7]">
                      {modeReception === 'livraison' ? (
                        <MapPin size={20} />
                      ) : (
                        <Package size={20} />
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0284C7]">
                        Étape 02
                      </span>

                      <h2 className="mt-1.5 text-2xl font-black tracking-tight text-[#0B1E3D] sm:text-[27px]">
                        Mode de réception
                      </h2>

                      <p className="mt-1.5 text-sm leading-6 text-slate-500">
                        Choisissez comment vous souhaitez recevoir votre commande.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-7 sm:px-8 sm:py-8">

                  <div className="grid gap-4 sm:grid-cols-2">

                    <button
                      type="button"
                      onClick={() => {
                        setModeReception('retrait')
                        setModePaiement('especes')
                      }}
                      className={`group relative overflow-hidden rounded-[26px] border-2 p-5 text-left transition-all sm:p-6 ${
                        modeReception === 'retrait'
                          ? 'border-[#0284C7] bg-sky-50 shadow-lg shadow-sky-100/70'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      {modeReception === 'retrait' && (
                        <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#0284C7] text-white">
                          <Check size={15} strokeWidth={3} />
                        </div>
                      )}

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                        <Package size={23} />
                      </div>

                      <h3 className="mt-5 text-lg font-black text-[#0B1E3D]">
                        Retrait
                      </h3>

                      <p className="mt-1.5 max-w-xs text-sm leading-5 text-slate-500">
                        Récupérez vous-même votre commande au point de retrait.
                      </p>

                      <div className="mt-5 flex items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                          Gratuit
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModeReception('livraison')
                        setModePaiement('mobile_money')
                      }}
                      className={`group relative overflow-hidden rounded-[26px] border-2 p-5 text-left transition-all sm:p-6 ${
                        modeReception === 'livraison'
                          ? 'border-[#0284C7] bg-sky-50 shadow-lg shadow-sky-100/70'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      {modeReception === 'livraison' && (
                        <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#0284C7] text-white">
                          <Check size={15} strokeWidth={3} />
                        </div>
                      )}

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#0284C7]">
                        <MapPin size={23} />
                      </div>

                      <h3 className="mt-5 text-lg font-black text-[#0B1E3D]">
                        Livraison à domicile
                      </h3>

                      <p className="mt-1.5 max-w-xs text-sm leading-5 text-slate-500">
                        Recevez votre commande directement à l'adresse indiquée.
                      </p>

                      <div className="mt-5 flex items-center gap-2">
                        <span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-black text-[#0284C7]">
                          Livraison à domicile · frais non inclus
                        </span>
                      </div>
                    </button>

                  </div>

                  {modeReception === 'livraison' && (
                    <div className="mt-6 rounded-[26px] border border-sky-100 bg-sky-50/60 p-5 sm:p-6">
                      <div className="mb-5">
                        <p className="text-sm font-black text-[#0B1E3D]">
                          Informations de livraison
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Indiquez précisément où vous souhaitez recevoir votre commande.
                        </p>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <label className="mb-2.5 block text-xs font-black text-[#0B1E3D]">
                            Département
                            <span className="ml-1 text-[#0284C7]">*</span>
                          </label>
                          <select
                            value={departement}
                            onChange={(e) => {
                              setDepartement(e.target.value)
                              setCommune("")
                            }}
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0B1E3D] outline-none transition hover:border-slate-300 focus:border-[#0284C7] focus:ring-4 focus:ring-sky-50"
                          >
                            <option value="">Sélectionner un département</option>
                            <option value="Alibori">Alibori</option>
                            <option value="Atacora">Atacora</option>
                            <option value="Atlantique">Atlantique</option>
                            <option value="Borgou">Borgou</option>
                            <option value="Collines">Collines</option>
                            <option value="Couffo">Couffo</option>
                            <option value="Donga">Donga</option>
                            <option value="Littoral">Littoral</option>
                            <option value="Mono">Mono</option>
                            <option value="Ouémé">Ouémé</option>
                            <option value="Plateau">Plateau</option>
                            <option value="Zou">Zou</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2.5 block text-xs font-black text-[#0B1E3D]">
                            Commune
                            <span className="ml-1 text-[#0284C7]">*</span>
                          </label>
                          <select
                            value={commune}
                            onChange={(e) => setCommune(e.target.value)}
                            disabled={!departement}
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0B1E3D] outline-none transition hover:border-slate-300 focus:border-[#0284C7] focus:ring-4 focus:ring-sky-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            <option value="">
                              {departement ? "Sélectionner une commune" : "Choisissez d’abord un département"}
                            </option>
                            {departement === "Littoral" && <option value="Cotonou">Cotonou</option>}
                            {departement === "Atlantique" && (
                              <>
                                <option value="Abomey-Calavi">Abomey-Calavi</option>
                                <option value="Allada">Allada</option>
                                <option value="Kpomassè">Kpomassè</option>
                                <option value="Ouidah">Ouidah</option>
                                <option value="Sô-Ava">Sô-Ava</option>
                                <option value="Toffo">Toffo</option>
                                <option value="Tori-Bossito">Tori-Bossito</option>
                                <option value="Zè">Zè</option>
                              </>
                            )}
                            {departement === "Ouémé" && (
                              <>
                                <option value="Adjarra">Adjarra</option>
                                <option value="Adjohoun">Adjohoun</option>
                                <option value="Aguégués">Aguégués</option>
                                <option value="Akpro-Missérété">Akpro-Missérété</option>
                                <option value="Avrankou">Avrankou</option>
                                <option value="Bonou">Bonou</option>
                                <option value="Dangbo">Dangbo</option>
                                <option value="Porto-Novo">Porto-Novo</option>
                              </>
                            )}
                            {departement === "Alibori" && (
                              <>
                                <option value="Banikoara">Banikoara</option>
                                <option value="Gogounou">Gogounou</option>
                                <option value="Kandi">Kandi</option>
                                <option value="Karimama">Karimama</option>
                                <option value="Malanville">Malanville</option>
                                <option value="Ségbana">Ségbana</option>
                              </>
                            )}
                            {departement === "Atacora" && (
                              <>
                                <option value="Boukoumbé">Boukoumbé</option>
                                <option value="Cobly">Cobly</option>
                                <option value="Kérou">Kérou</option>
                                <option value="Kouandé">Kouandé</option>
                                <option value="Matéri">Matéri</option>
                                <option value="Natitingou">Natitingou</option>
                                <option value="Péhunco">Péhunco</option>
                                <option value="Tanguiéta">Tanguiéta</option>
                                <option value="Toucountouna">Toucountouna</option>
                              </>
                            )}
                            {departement === "Borgou" && (
                              <>
                                <option value="Bembèrèkè">Bembèrèkè</option>
                                <option value="Kalalé">Kalalé</option>
                                <option value="N’Dali">N’Dali</option>
                                <option value="Nikki">Nikki</option>
                                <option value="Parakou">Parakou</option>
                                <option value="Pèrèrè">Pèrèrè</option>
                                <option value="Sinendé">Sinendé</option>
                                <option value="Tchaourou">Tchaourou</option>
                              </>
                            )}
                            {departement === "Collines" && (
                              <>
                                <option value="Bantè">Bantè</option>
                                <option value="Dassa-Zoumè">Dassa-Zoumè</option>
                                <option value="Glazoué">Glazoué</option>
                                <option value="Ouèssè">Ouèssè</option>
                                <option value="Savalou">Savalou</option>
                                <option value="Savè">Savè</option>
                              </>
                            )}
                            {departement === "Couffo" && (
                              <>
                                <option value="Aplahoué">Aplahoué</option>
                                <option value="Djakotomey">Djakotomey</option>
                                <option value="Dogbo">Dogbo</option>
                                <option value="Klouékanmè">Klouékanmè</option>
                                <option value="Lalo">Lalo</option>
                                <option value="Toviklin">Toviklin</option>
                              </>
                            )}
                            {departement === "Donga" && (
                              <>
                                <option value="Bassila">Bassila</option>
                                <option value="Copargo">Copargo</option>
                                <option value="Djougou">Djougou</option>
                                <option value="Ouaké">Ouaké</option>
                              </>
                            )}
                            {departement === "Mono" && (
                              <>
                                <option value="Athiémé">Athiémé</option>
                                <option value="Bopa">Bopa</option>
                                <option value="Comè">Comè</option>
                                <option value="Grand-Popo">Grand-Popo</option>
                                <option value="Houéyogbé">Houéyogbé</option>
                              </>
                            )}
                            {departement === "Plateau" && (
                              <>
                                <option value="Adja-Ouèrè">Adja-Ouèrè</option>
                                <option value="Ifangni">Ifangni</option>
                                <option value="Kétou">Kétou</option>
                                <option value="Pobè">Pobè</option>
                                <option value="Sakété">Sakété</option>
                              </>
                            )}
                            {departement === "Zou" && (
                              <>
                                <option value="Abomey">Abomey</option>
                                <option value="Agbangnizoun">Agbangnizoun</option>
                                <option value="Bohicon">Bohicon</option>
                                <option value="Covè">Covè</option>
                                <option value="Djidja">Djidja</option>
                                <option value="Ouinhi">Ouinhi</option>
                                <option value="Zagnanado">Zagnanado</option>
                                <option value="Za-Kpota">Za-Kpota</option>
                                <option value="Zogbodomey">Zogbodomey</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2.5 block text-xs font-black text-[#0B1E3D]">
                            Quartier
                            <span className="ml-1 text-[#0284C7]">*</span>
                          </label>
                          <input
                            type="text"
                            value={quartier}
                            onChange={(e) => setQuartier(e.target.value)}
                            placeholder="Ex. Zongo, Agla, Cadjèhoun..."
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0B1E3D] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0284C7] focus:ring-4 focus:ring-sky-50"
                          />
                        </div>

                        <div>
                          <label className="mb-2.5 block text-xs font-black text-[#0B1E3D]">
                            Rue / adresse précise
                            <span className="ml-1 text-[#0284C7]">*</span>
                          </label>
                          <input
                            type="text"
                            value={rue}
                            onChange={(e) => setRue(e.target.value)}
                            placeholder="Nom de rue, maison, numéro..."
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0B1E3D] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0284C7] focus:ring-4 focus:ring-sky-50"
                          />
                        </div>

                        <div>
                          <label className="mb-2.5 block text-xs font-black text-[#0B1E3D]">
                            Repère
                            <span className="ml-1 text-[11px] font-medium text-slate-400">(facultatif)</span>
                          </label>
                          <input
                            type="text"
                            value={repere}
                            onChange={(e) => setRepere(e.target.value)}
                            placeholder="Ex. près de..., en face de..."
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0B1E3D] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0284C7] focus:ring-4 focus:ring-sky-50"
                          />
                        </div>

                        <div className="rounded-2xl border border-sky-100 bg-white p-4">
                          <p className="text-xs font-bold leading-5 text-slate-500">
                            Les frais de livraison ne sont pas inclus dans votre commande. Ils seront convenus directement avec le livreur selon votre zone de livraison.
                          </p>
                        </div>

                        {erreurCommande && (
                          <p className="text-xs font-bold text-red-600">
                            {erreurCommande}
                          </p>
                        )}

                      </div>
                    </div>

                    )}
                  </div>
                      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={precedent}
                          className="inline-flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-[#0B1E3D] transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Retour
                        </button>

                        <button
                          type="button"
                          onClick={suivant}
                          className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#0284C7] px-8 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:bg-[#0369A1] active:scale-[0.99]"
                        >
                          Continuer
                        </button>
                      </div>

                </div>

              )}

            {/* ÉTAPE 3 */}
            {etape === 3 && (
              <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_18px_60px_-35px_rgba(11,30,61,0.35)] ring-1 ring-slate-200">

                <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-sky-50/60 p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B1E3D] text-white shadow-lg shadow-slate-200">
                      <CreditCard size={22} />
                    </div>

                    <div>
                      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0284C7]">
                        Étape 03 · Paiement
                      </span>

                      <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0B1E3D] sm:text-3xl">
                        Comment souhaitez-vous payer ?
                      </h2>

                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        Choisissez le moyen de paiement qui correspond à votre mode de réception.
                      </p>
                    </div>
                  </div>

                  {modeReception === 'livraison' && (
                    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <MapPin size={16} />
                      </div>

                      <div>
                        <p className="text-sm font-black text-amber-900">
                          Paiement Mobile Money obligatoire
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          Pour une livraison à domicile, le paiement doit être effectué en ligne.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 sm:p-8">

                  <div className="grid gap-4 sm:grid-cols-2">

                    <button
                      type="button"
                      disabled={modeReception === 'livraison' || totalSurCommande > 0}
                      onClick={() => setModePaiement('especes')}
                      className={`group relative overflow-hidden rounded-[26px] border-2 p-6 text-left transition-all duration-200 ${
                        modePaiement === 'especes'
                          ? 'border-[#0284C7] bg-sky-50 shadow-[0_14px_35px_-22px_rgba(2,132,199,0.8)]'
                          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg'
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {modePaiement === 'especes' && (
                        <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#0284C7] text-white">
                          <Check size={15} strokeWidth={3} />
                        </div>
                      )}

                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                        modePaiement === 'especes'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-orange-50 text-orange-500'
                      }`}>
                        <Package size={25} />
                      </div>

                      <div className="mt-5">
                        <h3 className="text-base font-black text-[#0B1E3D]">
                          Paiement en espèces
                        </h3>

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Payez lors du retrait de votre commande.
                        </p>

                        <div className="mt-5 inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-orange-600 ring-1 ring-orange-100">
                          Disponible au retrait
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModePaiement('mobile_money')}
                      className={`group relative overflow-hidden rounded-[26px] border-2 p-6 text-left transition-all duration-200 ${
                        modePaiement === 'mobile_money'
                          ? 'border-[#0284C7] bg-sky-50 shadow-[0_14px_35px_-22px_rgba(2,132,199,0.8)]'
                          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg'
                      }`}
                    >
                      {modePaiement === 'mobile_money' && (
                        <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#0284C7] text-white">
                          <Check size={15} strokeWidth={3} />
                        </div>
                      )}

                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                        modePaiement === 'mobile_money'
                          ? 'bg-sky-100 text-[#0284C7]'
                          : 'bg-sky-50 text-[#0284C7]'
                      }`}>
                        <CreditCard size={25} />
                      </div>

                      <div className="mt-5">
                        <h3 className="text-base font-black text-[#0B1E3D]">
                          Mobile Money
                        </h3>

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Paiement en ligne rapide et sécurisé.
                        </p>

                        <div className="mt-5 inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-[#0284C7] ring-1 ring-sky-100">
                          Paiement en ligne
                        </div>
                      </div>
                    </button>

                  </div>

                  {modePaiement === 'mobile_money' && (
                    <div className="mt-6 rounded-[26px] border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 sm:p-6">

                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0284C7] shadow-sm ring-1 ring-sky-100">
                          <Phone size={18} />
                        </div>

                        <div>
                          <p className="text-sm font-black text-[#0B1E3D]">
                            Effectuez votre paiement Mobile Money
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Vous pouvez payer depuis n’importe quel numéro Mobile Money. Utilisez l’un des numéros marchands affichés ci-dessous.
                          </p>
                        </div>
                      </div>

                      {moyensPaiement.length > 0 && (
                        <div className="mt-5 space-y-3">
                          {moyensPaiement.map((moyen) => (
                            <div
                              key={moyen.id}
                              className="rounded-2xl border border-sky-100 bg-white px-4 py-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-bold text-slate-500">
                                  {moyen.nom || moyen.code}
                                </span>
                                <span className="text-base font-black tracking-wide text-[#0B1E3D]">
                                  {moyen.numero}
                                </span>
                              </div>

                              {moyen.instructions && (
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  {moyen.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-5 rounded-2xl border border-sky-100 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                              Montant à payer
                            </p>
                            <p className="mt-1 text-xl font-black text-[#0B1E3D]">
                              {formatPrix(
                                totalSurCommande > 0
                                  ? Math.ceil(totalSurCommande * 0.5)
                                  : total,
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-sky-50 px-3 py-2 text-[11px] font-black text-[#0284C7]">
                            {totalSurCommande > 0 ? 'Acompte 50 %' : 'Paiement total'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                        <label className="block text-sm font-black text-[#0B1E3D]">
                          Référence de transaction
                        </label>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Saisissez la référence indiquée sur votre reçu Mobile Money.
                        </p>

                        <input
                          type="text"
                          value={referenceTransaction}
                          onChange={(event) =>
                            setReferenceTransaction(event.target.value)
                          }
                          placeholder="Ex. TXN123456789"
                          maxLength={100}
                          className="mt-3 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-[#0B1E3D] outline-none transition focus:border-[#0284C7] focus:bg-white"
                        />
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                        <label className="block text-sm font-black text-[#0B1E3D]">
                          Preuve de paiement
                        </label>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Après votre transfert, joignez une capture ou photo du reçu.
                          Formats acceptés : JPG, PNG ou WebP, 5 Mo maximum.
                        </p>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) => {
                            const fichier = event.target.files?.[0] || null
                            setPreuvePaiement(fichier)
                            setErreurCommande('')
                          }}
                          className="mt-3 block w-full text-xs font-semibold text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-sky-50 file:px-4 file:py-2.5 file:font-black file:text-[#0284C7] hover:file:bg-sky-100"
                        />

                        {preuvePaiement && (
                          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2.5">
                            <span className="min-w-0 truncate text-xs font-bold text-emerald-700">
                              {preuvePaiement.name}
                            </span>

                            <button
                              type="button"
                              onClick={() => setPreuvePaiement(null)}
                              className="shrink-0 text-xs font-black text-red-600"
                            >
                              Retirer
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                        <p className="text-xs font-bold leading-5 text-amber-800">
                          Votre paiement restera en attente de confirmation jusqu’à
                          la vérification de la référence et de la preuve par ChinaShop.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex gap-3 border-t border-slate-100 pt-6">

                    <button
                      type="button"
                      onClick={precedent}
                      className="h-14 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Retour
                    </button>

                    <button
                      type="button"
                      onClick={suivant}
                      className="group flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0284C7] text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:bg-[#0369A1] active:scale-[0.99]"
                    >
                      Vérifier ma commande

                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </button>

                  </div>

                  <p className="mt-3 text-center text-[11px] font-medium text-slate-400">
                    Étape 3 sur 4
                  </p>

                </div>
              </div>
            )}

            {/* ÉTAPE 4 */}
            {etape === 4 && (
              <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_18px_60px_-35px_rgba(11,30,61,0.35)] ring-1 ring-slate-200">
                <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-sky-50/60 p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B1E3D] text-white shadow-lg shadow-slate-200">
                      <Check size={22} strokeWidth={3} />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0284C7]">
                        Étape 04 · Vérification
                      </span>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0B1E3D] sm:text-3xl">
                        Vérifiez votre commande
                      </h2>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        Vérifiez attentivement vos informations avant de confirmer votre commande.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-6 sm:p-8">

                  {/* CLIENT */}
                  <div className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0284C7] shadow-sm ring-1 ring-slate-200">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                          Client
                        </p>
                        <p className="mt-0.5 text-sm font-black text-[#0B1E3D]">
                          Vos coordonnées
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                      <p className="font-black text-[#0B1E3D]">{nom}</p>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        {telephone}
                      </p>
                      {email && (
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* RÉCEPTION */}
                  <div className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0284C7] shadow-sm ring-1 ring-slate-200">
                        {modeReception === 'retrait' ? (
                          <Package size={18} />
                        ) : (
                          <MapPin size={18} />
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                          Réception
                        </p>
                        <p className="mt-0.5 text-sm font-black text-[#0B1E3D]">
                          {modeReception === 'retrait' ? 'Retrait' : 'Livraison'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                      {modeReception === 'retrait' ? (
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-600">
                            Vous récupérerez votre commande vous-même.
                          </p>
                          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700">
                            Gratuit
                          </span>
                        </div>
                      ) : (
                        <>
                          <p className="font-black text-[#0B1E3D]">
                            {commune || 'Zone sélectionnée'}
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {departement}, {commune}, {quartier}, {rue}
                          </p>

                          {repere && (
                            <p className="mt-2 text-xs leading-5 text-slate-400">
                              Repère : {repere}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-sky-50 px-3 py-1.5 text-[11px] font-black text-[#0284C7]">
                              Livraison à domicile
                            </span>
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700">
                              Frais de livraison non inclus
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* PAIEMENT */}
                  <div className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0284C7] shadow-sm ring-1 ring-slate-200">
                        <CreditCard size={18} />
                      </div>

                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                          Paiement
                        </p>

                        <p className="mt-0.5 text-sm font-black text-[#0B1E3D]">
                          {modePaiement === 'mobile_money'
                            ? 'Mobile Money'
                            : 'Espèces'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                      <div>
                        <p className="text-sm font-black text-[#0B1E3D]">
                          {modePaiement === 'mobile_money'
                            ? 'Paiement en ligne'
                            : 'Paiement au retrait'}
                        </p>

                        {modePaiement === 'mobile_money' && (
                          <p className="mt-1 text-xs font-medium text-slate-500">
                          </p>
                        )}
                      </div>

                      <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1.5 text-[11px] font-black text-[#0284C7]">
                        {modePaiement === 'mobile_money'
                          ? 'Mobile Money'
                          : 'Espèces'}
                      </span>
                    </div>
                  </div>

                  {/* DISPONIBILITÉ */}
                  <div className="rounded-[26px] border border-slate-200 bg-white p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-[#0B1E3D] ring-1 ring-slate-200">
                        <ShoppingBag size={18} />
                      </div>

                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                          Disponibilité des articles
                        </p>

                        <p className="mt-0.5 text-sm font-black text-[#0B1E3D]">
                          Résumé de votre commande
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">

                      {articlesStock.length > 0 && (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-emerald-900">
                                Articles en stock
                              </p>

                              <p className="mt-1 text-xs leading-5 text-emerald-700">
                                Ces articles sont actuellement disponibles.
                              </p>
                            </div>

                            <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-black text-emerald-700">
                              {formatPrix(totalStock)}
                            </span>
                          </div>
                        </div>
                      )}

                      {articlesSurCommande.length > 0 && (
                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-amber-900">
                                Articles sur commande
                              </p>

                              <p className="mt-1 text-xs leading-5 text-amber-700">
                                Délai indicatif : environ 30 jours par avion ou jusqu'à 3 mois par bateau.
                              </p>
                            </div>

                            <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-black text-amber-700">
                              {formatPrix(totalSurCommande)}
                            </span>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* RÈGLE PANIER MIXTE */}
                  {panierMixte && (
                    <div className="rounded-[26px] border-2 border-sky-100 bg-sky-50 p-5 sm:p-6">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0284C7] shadow-sm">
                          <Package size={18} />
                        </div>

                        <div>
                          <p className="text-sm font-black text-[#0B1E3D]">
                            Commande regroupée
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            Votre commande contient des articles en stock et sur commande.
                            Les articles en stock sont réservés et la réception intervient
                            lorsque les articles sur commande sont disponibles.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                          Acompte requis
                        </p>

                        <p className="mt-1 text-xl font-black text-[#0B1E3D]">
                          {formatPrix(Math.ceil(totalSurCommande * 0.5))}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          50 % de la valeur des articles sur commande.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* RÈGLE SUR COMMANDE SEULE */}
                  {!panierMixte && articlesSurCommande.length > 0 && (
                    <div className="rounded-[26px] border-2 border-amber-100 bg-amber-50 p-5 sm:p-6">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                          <Package size={18} />
                        </div>

                        <div>
                          <p className="text-sm font-black text-amber-900">
                            Acompte nécessaire avant traitement
                          </p>

                          <p className="mt-1 text-xs leading-5 text-amber-800">
                            Votre commande contient uniquement des articles sur commande.
                            Un acompte de 50 % est requis avant le lancement du traitement.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                          Acompte requis
                        </p>

                        <p className="mt-1 text-xl font-black text-[#0B1E3D]">
                          {formatPrix(Math.ceil(totalSurCommande * 0.5))}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TOTAL */}
                  <div className="overflow-hidden rounded-[28px] bg-[#0B1E3D] p-6 text-white shadow-xl shadow-slate-200 sm:p-7">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">
                        Sous-total
                      </span>

                      <span className="font-bold">
                        {formatPrix(sousTotal)}
                      </span>
                    </div>

                    {reduction > 0 && (
                      <div className="mt-3 flex justify-between text-sm text-emerald-300">
                        <span>Réduction</span>

                        <span className="font-bold">
                          -{formatPrix(reduction)}
                        </span>
                      </div>
                    )}


                    <div className="mt-6 border-t border-white/10 pt-5">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                            Total
                          </p>

                          <p className="mt-1 text-sm font-black text-white">
                            Montant de la commande
                          </p>
                        </div>

                        <span className="text-2xl font-black text-orange-400 sm:text-3xl">
                          {formatPrix(total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RÈGLE LIVRAISON */}
                  {modeReception === 'livraison' && (
                    <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4">
                      <MapPin
                        className="mt-0.5 shrink-0 text-[#0284C7]"
                        size={18}
                      />

                      <div>
                        <p className="text-sm font-black text-sky-900">
                          Livraison à domicile
                        </p>

                        <p className="mt-1 text-xs leading-5 text-sky-700">
                          Le paiement Mobile Money est obligatoire pour la livraison.
                          La livraison sera organisée selon la disponibilité de votre commande.
                        </p>
                      </div>
                    </div>
                  )}

                    {erreurCommande && (
                      <div
                        role="alert"
                        className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 shrink-0 text-base">⚠️</span>
                          <p>{erreurCommande}</p>
                        </div>
                      </div>
                    )}

                  {/* ACTIONS */}
                  <div className="flex gap-3 border-t border-slate-100 pt-6">
                    <button
                      type="button"
                      onClick={precedent}
                      disabled={chargement}
                      className="h-14 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={confirmerCommande}
                      disabled={chargement}
                      className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0284C7] text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:bg-[#0369A1] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {chargement ? (
                        <>
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Création de la commande...
                        </>
                      ) : (
                        <>
                          <Check size={19} strokeWidth={3} />
                          Confirmer ma commande
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-center text-[11px] font-medium text-slate-400">
                    Étape 4 sur 4 · Vérification finale
                  </p>

                </div>
              </div>
            )}
            {/* INDICATEUR MOBILE */}
            <div className="mt-5 flex items-center justify-center gap-2 lg:hidden">
              {etapes.map((item) => (
                <div
                  key={item.numero}
                  className={`h-2 rounded-full transition-all ${
                    etape === item.numero
                      ? 'w-8 bg-[#0284C7]'
                      : etape > item.numero
                        ? 'w-5 bg-[#0284C7]'
                        : 'w-5 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
