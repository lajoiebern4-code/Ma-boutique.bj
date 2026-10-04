import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
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
  recupererVariantesProduit,
  calculerCommandeV2,
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
  const [numeroCopie, setNumeroCopie] = useState<string | null>(null)
  const [preuvePaiement, setPreuvePaiement] = useState<File | null>(null)

  const [departement, setDepartement] = useState('')
  const [commune, setCommune] = useState('')
  const [quartier, setQuartier] = useState('')
  const [rue, setRue] = useState('')
  const [repere, setRepere] = useState('')

  const [chargement, setChargement] = useState(false)

  const [calculServeur, setCalculServeur] = useState<{
    total: number
    montantSurCommande: number
    fraisTransportChine: number
    acompteRequis: number
  } | null>(null)


  useEffect(() => {
    if (etape !== 3 || modePaiement !== 'mobile_money') return

    let actif = true
    setChargementPaiement(true)

    calculerCommandeV2(
      items.map((item) => ({
        produit_id: item.produit.id,
        quantite: item.quantite,
        variante_id: item.produit.variante_id ?? null,
        variante_nom: item.produit.variante_nom ?? null,
        type_transport: item.produit.type_transport ?? null,
      })),
      modeReception,
      'RETRAIT',
    )
      .then((calcul) => {
        if (!actif) return

        setCalculServeur({
          total: calcul.total,
          montantSurCommande: calcul.montantSurCommande,
          fraisTransportChine: calcul.fraisTransportChine,
          acompteRequis: calcul.acompteRequis,
        })
      })
      .catch((error) => {
        if (!actif) return
        console.error(
          'Impossible de calculer le montant serveur de la commande:',
          error,
        )
      })

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
          setMoyenPaiementSelectionne(resultat[0]!.code)
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

  const transportSurCommande = items.some(
    (item) =>
      item.produit.surCommande === true &&
      (item.produit.categorie === 'telephones' ||
        item.produit.sous_categorie === 'ordinateur' ||
        item.produit.type_transport === 'avion'),
  )
    ? 'avion'
    : items.some(
          (item) =>
            item.produit.surCommande === true &&
            item.produit.type_transport === 'bateau',
        )
      ? 'bateau'
      : null

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
      <main className="min-h-screen bg-[#FAF9FC] px-4 py-10">
        <div className="mx-auto max-w-xl rounded-[14px] bg-white p-8 text-center shadow-[0_2px_10px_rgba(24,21,31,0.05)]">
          <ShoppingBag
            className="mx-auto text-[#9A93A5]"
            size={50}
          />

          <h1 className="mt-5 text-2xl font-black text-[#18151F]">
            Votre panier est vide
          </h1>

          <p className="mt-2 text-sm text-[#6F687A]">
            Ajoutez des articles avant de continuer votre commande.
          </p>

          <button
            type="button"
            onClick={() => navigate('/catalogue')}
            className="mt-6 rounded-[10px] bg-[#7654C6] px-6 py-3 text-sm font-bold text-white"
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
        `La variante de « ${article!.produit.nom} » n’est plus sélectionnée. Retournez au produit pour choisir une variante.`,
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
        type_transport: item.produit.type_transport || null,
      })),
    }

      setChargement(true)

      try {
        const calcul = await calculerCommandeV2(
          commande.articles.map((article) => ({
            produit_id: article.id,
            quantite: article.qte,
            variante_id: article.variante_id,
            variante_nom: article.variante_nom,
            type_transport: article.type_transport,
          })),
          commande.modeReception,
          'RETRAIT',
        )

        setCalculServeur({
          total: calcul.total,
          montantSurCommande: calcul.montantSurCommande,
          fraisTransportChine: calcul.fraisTransportChine,
          acompteRequis: calcul.acompteRequis,
        })

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
    <main className="min-h-screen bg-[#FAF9FC] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">

        <button
          type="button"
          onClick={() => navigate('/panier')}
          className="group mb-7 inline-flex items-center gap-2 rounded-full border border-[#E8E3EF] bg-white px-4 py-2 text-xs font-black text-[#6F687A] shadow-sm transition hover:border-[#DCD5E8] hover:text-[#18151F]"
        >
          <ArrowLeft
            size={15}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          Retour au panier
        </button>

        {/* HEADER PREMIUM */}
        <div className="relative mb-6 overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1E1B2E] via-[#2A2344] to-[#3B2D5F] px-6 py-8 text-white shadow-[0_20px_60px_rgba(30,27,46,0.25)] sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#7654C6]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-[#8B6DD1]/25 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_50%)]" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-white/10 ring-1 ring-white/20 backdrop-blur">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB47A]">
                ChinaShop-Bénin
              </p>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Finaliser ma commande
              </h1>
              <p className="mt-1.5 text-sm text-white/70">
                Quelques étapes pour confirmer votre commande.
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[270px_1fr] lg:gap-8">

          {/* PROGRESSION */}
          <div className="overflow-hidden rounded-[20px] border border-[#E8E3EF] bg-white shadow-[0_2px_10px_rgba(24,21,31,0.05)] lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#F0F0F2] px-5 py-3.5 sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F1ECFA] text-[#7654C6]">
                  <Check size={14} strokeWidth={3} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9A93A5]">
                    Progression
                  </p>
                  <p className="text-sm font-black text-[#18151F]">
                    Étape {etape} sur 4
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#F1ECFA] px-3 py-1.5 text-[11px] font-black text-[#7654C6]">
                {Math.round((etape / 4) * 100)}%
              </span>
            </div>

            <div className="flex items-start px-3 py-5 sm:px-6">
              {etapes.map((item, index) => {
                const Icon = item.icon
                const actif = etape === item.numero
                const termine = etape > item.numero
                const dernier = index === etapes.length - 1

                return (
                  <div key={item.numero} className="flex min-w-0 flex-1 items-start">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.numero < etape) {
                          setEtape(item.numero as Etape)
                        }
                      }}
                      className="group flex min-w-0 flex-col items-center text-center"
                    >
                      <div
                        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-black ring-1 transition-all duration-300 sm:h-11 sm:w-11 ${
                          termine
                            ? 'bg-emerald-500 text-white ring-emerald-500 shadow-md shadow-emerald-100'
                            : actif
                              ? 'scale-105 bg-[#7654C6] text-white shadow-lg shadow-[#7654C6]/25 ring-[#7654C6]'
                              : 'bg-[#F1ECFA] text-[#9A93A5] ring-[#E8E3EF]'
                        }`}
                      >
                        {termine ? (
                          <Check size={16} strokeWidth={3.5} />
                        ) : (
                          <Icon size={16} />
                        )}
                      </div>
                      <p
                        className={`mt-2 max-w-[78px] text-[10px] font-black leading-4 transition-colors sm:max-w-[90px] sm:text-[11px] ${
                          termine || actif ? 'text-[#18151F]' : 'text-[#9A93A5]'
                        }`}
                      >
                        {item.numero}. {item.titre}
                      </p>
                    </button>

                    {!dernier && (
                      <div className="mt-[20px] h-1 min-w-2 flex-1 overflow-hidden rounded-full bg-[#F1ECFA] sm:mt-[22px]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            etape > item.numero ? 'w-full bg-emerald-500' : 'w-0'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          {/* FORMULAIRE */}
          <section>

            {/* ÉTAPE 1 */}
            {etape === 1 && (
              <div className="overflow-hidden rounded-[24px] border border-[#E8E3EF] bg-white shadow-[0_2px_10px_rgba(24,21,31,0.05)]">
                <div className="border-b border-[#F0F0F2] bg-gradient-to-br from-[#FAF9FC] to-white px-6 py-7 sm:px-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#7654C6] to-[#8B6DD1] text-white shadow-lg shadow-[#7654C6]/25">
                      <User size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7654C6]">
                        Étape 01
                      </span>
                      <h2 className="mt-1.5 text-2xl font-black tracking-tight text-[#18151F] sm:text-[26px]">
                        Vos informations
                      </h2>
                      <p className="mt-1.5 max-w-xl text-sm leading-6 text-[#6F687A]">
                        Indiquez vos coordonnées pour que nous puissions vous contacter concernant votre commande.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-7 sm:px-8">
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2.5 block text-xs font-black text-[#18151F]">
                        Nom complet
                        <span className="ml-1 text-[#7654C6]">*</span>
                      </label>
                      <div className="group relative">
                        <User
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A93A5] transition group-focus-within:text-[#7654C6]"
                          size={18}
                        />
                        <input
                          value={nom}
                          onChange={(e) => setNom(e.target.value)}
                          placeholder="Ex. Jean Dupont"
                          className="h-12 w-full rounded-[12px] border border-[#E8E3EF] bg-[#FAF9FC] pl-12 pr-4 text-sm font-semibold text-[#18151F] outline-none transition placeholder:text-[#9A93A5] hover:border-[#DCD5E8] focus:border-[#7654C6] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2.5 block text-xs font-black text-[#18151F]">
                        Numéro de téléphone
                        <span className="ml-1 text-[#7654C6]">*</span>
                      </label>
                      <div className="group relative">
                        <Phone
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A93A5] transition group-focus-within:text-[#7654C6]"
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
                          className="h-12 w-full rounded-[12px] border border-[#E8E3EF] bg-[#FAF9FC] pl-12 pr-4 text-sm font-semibold text-[#18151F] outline-none transition placeholder:text-[#9A93A5] hover:border-[#DCD5E8] focus:border-[#7654C6] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
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
                        <p className="mt-2 text-[11px] leading-5 text-[#9A93A5]">
                          Format obligatoire : 01XXXXXXXX
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2.5 block text-xs font-black text-[#18151F]">
                        E-mail
                        <span className="ml-1 font-medium text-[#9A93A5]">
                          (facultatif)
                        </span>
                      </label>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        type="email"
                        className="h-12 w-full rounded-[12px] border border-[#E8E3EF] bg-[#FAF9FC] px-4 text-sm font-semibold text-[#18151F] outline-none transition placeholder:text-[#9A93A5] hover:border-[#DCD5E8] focus:border-[#7654C6] focus:bg-white focus:ring-4 focus:ring-[#F1ECFA]"
                      />
                      <p className="mt-2 text-[11px] leading-5 text-[#9A93A5]">
                        Pour recevoir les informations importantes liées à votre commande.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-[#F0F0F2] pt-6">
                    <button
                      type="button"
                      onClick={suivant}
                      className="group flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#7654C6] to-[#8B6DD1] text-sm font-black text-white shadow-lg shadow-[#7654C6]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.99]"
                    >
                      Continuer
                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </button>

                    <p className="mt-3 text-center text-[11px] font-semibold text-[#9A93A5]">
                      Étape 1 sur 4
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* ÉTAPE 2 */}
            {etape === 2 && (
              <div className="overflow-hidden rounded-[14px] border border-[#E8E3EF] bg-white shadow-[0_2px_10px_rgba(24,21,31,0.05)]">

                <div className="border-b border-[#E8E3EF] px-5 py-5 sm:px-7 sm:py-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFA] text-[#7654C6]">
                      {modeReception === 'livraison' ? (
                        <MapPin size={20} />
                      ) : (
                        <Package size={20} />
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7654C6]">
                        Étape 02
                      </span>

                      <h2 className="mt-1.5 text-xl font-black tracking-tight text-[#18151F] sm:text-[23px]">
                        Mode de réception
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-[#6F687A]">
                        Choisissez comment vous souhaitez recevoir votre commande.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-7 sm:px-8 sm:py-8">

                  <div className="grid gap-2.5 sm:grid-cols-2">

                    <button
                      type="button"
                      onClick={() => {
                        setModeReception('retrait')
                        setModePaiement('especes')
                      }}
                      className={`group relative overflow-hidden rounded-[14px] border p-3.5 text-left transition-all sm:p-4 ${
                        modeReception === 'retrait'
                          ? 'border-[#7654C6] bg-[#F1ECFA]/80 shadow-sm shadow-[0_8px_24px_rgba(118,84,198,0.12)]'
                          : 'border-[#E8E3EF] bg-white hover:border-[#DCD5E8] hover:shadow-sm'
                      }`}
                    >
                      {modeReception === 'retrait' && (
                        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#7654C6] text-white">
                          <Check size={15} strokeWidth={3} />
                        </div>
                      )}

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                        <Package size={23} />
                      </div>

                      <h3 className="mt-2.5 text-sm font-black text-[#18151F]">
                        Retrait
                      </h3>

                      <p className="mt-0.5 max-w-xs text-[11px] leading-4 text-[#6F687A]">
                        Récupérez vous-même votre commande au point de retrait.
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
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
                      className={`group relative overflow-hidden rounded-[14px] border p-3.5 text-left transition-all sm:p-4 ${
                        modeReception === 'livraison'
                          ? 'border-[#7654C6] bg-[#F1ECFA]/80 shadow-sm shadow-[0_8px_24px_rgba(118,84,198,0.12)]'
                          : 'border-[#E8E3EF] bg-white hover:border-[#DCD5E8] hover:shadow-sm'
                      }`}
                    >
                      {modeReception === 'livraison' && (
                        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#7654C6] text-white">
                          <Check size={15} strokeWidth={3} />
                        </div>
                      )}

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1ECFA] text-[#7654C6]">
                        <MapPin size={23} />
                      </div>

                      <h3 className="mt-2.5 text-sm font-black text-[#18151F]">
                        Livraison à domicile
                      </h3>

                      <p className="mt-0.5 max-w-xs text-[11px] leading-4 text-[#6F687A]">
                        Recevez votre commande directement à l'adresse indiquée.
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-full bg-[#E8DFF7] px-2.5 py-1 text-[10px] font-black text-[#7654C6]">
                          Livraison à domicile · frais non inclus
                        </span>
                      </div>
                    </button>

                  </div>

                  {modeReception === 'livraison' && (
                    <div className="mt-3 rounded-[14px] border border-[#E8E3EF] bg-[#F1ECFA]/60 p-3.5 sm:p-4">
                      <div className="mb-3">
                        <p className="text-sm font-black text-[#18151F]">
                          Informations de livraison
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[#6F687A]">
                          Indiquez précisément où vous souhaitez recevoir votre commande.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="mb-1.5 block text-[11px] font-black text-[#18151F]">
                            Département
                            <span className="ml-1 text-[#7654C6]">*</span>
                          </label>
                          <select
                            value={departement}
                            onChange={(e) => {
                              setDepartement(e.target.value)
                              setCommune("")
                            }}
                            className="h-11 w-full rounded-xl border border-[#E8E3EF] bg-white px-4 text-sm font-semibold text-[#18151F] outline-none transition hover:border-[#DCD5E8] focus:border-[#7654C6] focus:ring-4 focus:ring-[#F1ECFA]"
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
                          <label className="mb-1.5 block text-[11px] font-black text-[#18151F]">
                            Commune
                            <span className="ml-1 text-[#7654C6]">*</span>
                          </label>
                          <select
                            value={commune}
                            onChange={(e) => setCommune(e.target.value)}
                            disabled={!departement}
                            className="h-11 w-full rounded-xl border border-[#E8E3EF] bg-white px-4 text-sm font-semibold text-[#18151F] outline-none transition hover:border-[#DCD5E8] focus:border-[#7654C6] focus:ring-4 focus:ring-[#F1ECFA] disabled:cursor-not-allowed disabled:bg-[#F1ECFA] disabled:text-[#9A93A5]"
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
                          <label className="mb-1.5 block text-[11px] font-black text-[#18151F]">
                            Quartier
                            <span className="ml-1 text-[#7654C6]">*</span>
                          </label>
                          <input
                            type="text"
                            value={quartier}
                            onChange={(e) => setQuartier(e.target.value)}
                            placeholder="Ex. Zongo, Agla, Cadjèhoun..."
                            className="h-11 w-full rounded-xl border border-[#E8E3EF] bg-white px-4 text-sm font-semibold text-[#18151F] outline-none transition placeholder:text-[#9A93A5] hover:border-[#DCD5E8] focus:border-[#7654C6] focus:ring-4 focus:ring-[#F1ECFA]"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-[11px] font-black text-[#18151F]">
                            Rue / adresse précise
                            <span className="ml-1 text-[#7654C6]">*</span>
                          </label>
                          <input
                            type="text"
                            value={rue}
                            onChange={(e) => setRue(e.target.value)}
                            placeholder="Nom de rue, maison, numéro..."
                            className="h-11 w-full rounded-xl border border-[#E8E3EF] bg-white px-4 text-sm font-semibold text-[#18151F] outline-none transition placeholder:text-[#9A93A5] hover:border-[#DCD5E8] focus:border-[#7654C6] focus:ring-4 focus:ring-[#F1ECFA]"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-[11px] font-black text-[#18151F]">
                            Repère
                            <span className="ml-1 text-[11px] font-medium text-[#9A93A5]">(facultatif)</span>
                          </label>
                          <input
                            type="text"
                            value={repere}
                            onChange={(e) => setRepere(e.target.value)}
                            placeholder="Ex. près de..., en face de..."
                            className="h-11 w-full rounded-xl border border-[#E8E3EF] bg-white px-4 text-sm font-semibold text-[#18151F] outline-none transition placeholder:text-[#9A93A5] hover:border-[#DCD5E8] focus:border-[#7654C6] focus:ring-4 focus:ring-[#F1ECFA]"
                          />
                        </div>

                        <div className="rounded-[14px] border border-[#E8E3EF] bg-white p-4">
                          <p className="text-xs font-bold leading-5 text-[#6F687A]">
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
                      <div className="mt-4 flex flex-col gap-2.5 border-t border-[#E8E3EF] pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={precedent}
                          className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E8E3EF] bg-white px-5 text-xs font-black text-[#18151F] transition hover:border-[#DCD5E8] hover:bg-[#FAF9FC]"
                        >
                          Retour
                        </button>

                        <button
                          type="button"
                          onClick={suivant}
                          className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#7654C6] px-7 text-xs font-bold text-white shadow-[0_4px_14px_rgba(118,84,198,0.12)] transition hover:bg-[#6544B3] active:scale-[0.99]"
                        >
                          Continuer
                        </button>
                      </div>

                </div>

              )}

            {/* ÉTAPE 3 */}
            {etape === 3 && (
              <div className="overflow-hidden rounded-[14px] bg-white shadow-[0_2px_10px_rgba(24,21,31,0.05)] ring-1 ring-[#E8E3EF]">

                <div className="border-b border-[#E8E3EF] bg-gradient-to-br from-[#FAF9FC] via-white to-[#F1ECFA]/50 px-5 py-5 sm:px-7 sm:py-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#18151F] text-white shadow-[0_4px_14px_rgba(24,21,31,0.06)]">
                      <CreditCard size={22} />
                    </div>

                    <div>
                      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7654C6]">
                        Étape 03 · Paiement
                      </span>

                      <h2 className="mt-2 text-xl font-black tracking-tight text-[#18151F] sm:text-2xl">
                        Comment souhaitez-vous payer ?
                      </h2>

                      <p className="mt-1 max-w-xl text-xs leading-5 text-[#6F687A]">
                        Choisissez le moyen de paiement qui correspond à votre mode de réception.
                      </p>
                    </div>
                  </div>

                  {modeReception === 'livraison' && (
                    <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                        <MapPin size={16} />
                      </div>

                      <div>
                        <p className="text-xs font-black text-amber-900">
                          Paiement Mobile Money obligatoire
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          Pour une livraison à domicile, le paiement doit être effectué en ligne.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-5 py-5 sm:px-7 sm:py-6">

                  <div className="grid gap-2.5 sm:grid-cols-2">

                    <button
                      type="button"
                      disabled={modeReception === 'livraison' || totalSurCommande > 0}
                      onClick={() => setModePaiement('especes')}
                      className={`group relative overflow-hidden rounded-[14px] border p-3.5 text-left sm:p-4 transition-all duration-200 ${
                        modePaiement === 'especes'
                          ? 'border-[#7654C6] bg-[#F1ECFA] shadow-[0_8px_24px_rgba(118,84,198,0.08)]'
                          : 'border-[#E8E3EF] bg-white hover:border-[#7654C6]/20 hover:shadow-[0_8px_24px_rgba(24,21,31,0.08)]'
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {modePaiement === 'especes' && (
                        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#7654C6] text-white">
                          <Check size={15} strokeWidth={3} />
                        </div>
                      )}

                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        modePaiement === 'especes'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-orange-50 text-orange-500'
                      }`}>
                        <Package size={25} />
                      </div>

                      <div className="mt-3">
                        <h3 className="text-base font-black text-[#18151F]">
                          Paiement en espèces
                        </h3>

                        <p className="mt-1 text-[11px] leading-4 text-[#6F687A]">
                          Payez lors du retrait de votre commande.
                        </p>

                        <div className="mt-3 inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-orange-600 ring-1 ring-orange-100">
                          Disponible au retrait
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModePaiement('mobile_money')}
                      className={`group relative overflow-hidden rounded-[14px] border p-3.5 text-left sm:p-4 transition-all duration-200 ${
                        modePaiement === 'mobile_money'
                          ? 'border-[#7654C6] bg-[#F1ECFA] shadow-[0_8px_24px_rgba(118,84,198,0.08)]'
                          : 'border-[#E8E3EF] bg-white hover:border-[#7654C6]/20 hover:shadow-[0_8px_24px_rgba(24,21,31,0.08)]'
                      }`}
                    >
                      {modePaiement === 'mobile_money' && (
                        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#7654C6] text-white">
                          <Check size={15} strokeWidth={3} />
                        </div>
                      )}

                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        modePaiement === 'mobile_money'
                          ? 'bg-[#E8DFF7] text-[#7654C6]'
                          : 'bg-[#F1ECFA] text-[#7654C6]'
                      }`}>
                        <span className="flex h-8 w-9 items-center justify-center rounded-[45%] border-2 border-black bg-[#FFCC00] shadow-sm">

                          <span className="font-black text-[7px] leading-none tracking-[-0.09em] text-black">

                            MTN

                          </span>

                        </span>
                      </div>

                      <div className="mt-3">
                        <h3 className="text-base font-black text-[#18151F]">
                          Mobile Money
                        </h3>

                        <p className="mt-1 text-[11px] leading-4 text-[#6F687A]">
                          Paiement en ligne rapide et sécurisé.
                        </p>

                        <div className="mt-3 inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-[#7654C6] ring-1 ring-[#E8E3EF]">
                          Paiement en ligne
                        </div>
                      </div>
                    </button>

                  </div>

                  {modePaiement === 'mobile_money' && (
                    <div className="mt-4 rounded-[14px] border border-[#E8E3EF] bg-gradient-to-br from-[#F1ECFA] to-white p-4 sm:p-5">

                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#7654C6] shadow-sm ring-1 ring-[#E8E3EF]">
                          <Phone size={18} />
                        </div>

                        <div>
                          <p className="text-xs font-black text-[#18151F]">
                            Effectuez votre paiement Mobile Money
                          </p>

                          <p className="mt-1 text-xs leading-5 text-[#6F687A]">
                            Vous pouvez payer depuis n’importe quel numéro Mobile Money. Utilisez l’un des numéros marchands affichés ci-dessous.
                          </p>
                        </div>
                      </div>

                      {moyensPaiement.length > 0 && (
                        <div className="mt-3 space-y-3">
                          {moyensPaiement.map((moyen) => (
                            <div
                              key={moyen.id}
                              className="rounded-xl border border-[#E8E3EF] bg-white px-3 py-2.5"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-8 w-9 items-center justify-center rounded-[45%] border-2 border-black bg-[#FFCC00] shadow-sm">

                                    <span className="font-black text-[7px] leading-none tracking-[-0.09em] text-black">

                                      MTN

                                    </span>

                                  </span>
                                  <span className="text-xs font-black text-[#18151F]">
                                    {moyen.nom || moyen.code}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black tracking-wide text-[#18151F]">
                                    {moyen.numero}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(moyen.numero)
                                      setNumeroCopie(moyen.numero)
                                      window.setTimeout(() => {
                                        setNumeroCopie((actuel) =>
                                          actuel === moyen.numero ? null : actuel
                                        )
                                      }, 1800)
                                    }}
                                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[#E8E3EF] bg-white px-2.5 text-[10px] font-black text-[#7654C6] shadow-sm transition hover:border-[#D8CCF0] hover:bg-[#F1ECFA] active:scale-[0.98]"
                                  >
                                    {numeroCopie === moyen.numero ? (
                                      <>
                                        <Check size={13} strokeWidth={3} />
                                        Copié
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={13} strokeWidth={2.5} />
                                        Copier
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {moyen.instructions && (
                                <p className="mt-1 text-xs leading-5 text-[#6F687A]">
                                  {moyen.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 rounded-[14px] border border-[#E8E3EF] bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#9A93A5]">
                              Montant à payer
                            </p>
                            <p className="mt-1 text-lg font-black text-[#18151F]">
                              {formatPrix(
                                totalSurCommande > 0
                                  ? calculServeur?.acompteRequis ?? Math.ceil(totalSurCommande * 0.5)
                                  : total,
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-[#F1ECFA] px-3 py-2 text-[11px] font-black text-[#7654C6]">
                            {totalSurCommande > 0 ? 'Acompte 50 %' : 'Paiement total'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border border-[#E8E3EF] bg-white p-3.5">
                        <label className="block text-xs font-black text-[#18151F]">
                          Référence de transaction
                        </label>

                        <p className="mt-1 text-xs leading-5 text-[#6F687A]">
                          Saisissez les 12 chiffres de la référence indiquée sur votre reçu Mobile Money.
                        </p>

                        <input
                          type="text"
                          value={referenceTransaction}
                          onChange={(event) =>
                            setReferenceTransaction(event.target.value)
                          }
                          placeholder="Ex. 123456789012"
                          maxLength={100}
                          className="mt-3 h-11 w-full rounded-xl border border-[#E8E3EF] bg-[#FAF9FC] px-4 text-sm font-semibold text-[#18151F] outline-none transition focus:border-[#7654C6] focus:bg-white"
                        />
                      </div>

                      <div className="mt-3 rounded-xl border border-[#E8E3EF] bg-white p-3.5">
                        <label className="block text-xs font-black text-[#18151F]">
                          Preuve de paiement
                        </label>

                        <p className="mt-1 text-xs leading-5 text-[#6F687A]">
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
                          className="mt-3 block w-full text-xs font-semibold text-[#6F687A] file:mr-3 file:rounded-xl file:border-0 file:bg-[#F1ECFA] file:px-4 file:py-2.5 file:font-black file:text-[#7654C6] hover:file:bg-[#E8DFF7]"
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

                      <div className="mt-4 rounded-[14px] border border-amber-100 bg-amber-50 p-4">
                        <p className="text-xs font-bold leading-5 text-amber-800">
                          Votre paiement restera en attente de confirmation jusqu’à
                          la vérification de la référence et de la preuve par ChinaShop.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex gap-2.5 border-t border-[#E8E3EF] pt-4">

                    <button
                      type="button"
                      onClick={precedent}
                      className="h-11 rounded-xl border border-[#E8E3EF] bg-white px-5 text-xs font-black text-[#6F687A] transition hover:border-[#DCD5E8] hover:bg-[#FAF9FC]"
                    >
                      Retour
                    </button>

                    <button
                      type="button"
                      onClick={suivant}
                      className="group flex h-11 flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#7654C6] text-xs font-bold text-white shadow-[0_4px_14px_rgba(118,84,198,0.12)] transition hover:bg-[#6544B3] active:scale-[0.99]"
                    >
                      Vérifier ma commande

                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </button>

                  </div>

                  <p className="mt-3 text-center text-[11px] font-medium text-[#9A93A5]">
                    Étape 3 sur 4
                  </p>

                </div>
              </div>
            )}

            {/* ÉTAPE 4 */}
            {etape === 4 && (
              <div className="space-y-4">
                {/* EN-TÊTE FINAL */}
                <div className="overflow-hidden rounded-[14px] border border-[#E8E3EF] bg-white shadow-[0_2px_10px_rgba(24,21,31,0.05)]">
                  <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#18151F] text-white shadow-sm">
                        <Check size={18} strokeWidth={3} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#F1ECFA] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#7654C6]">
                            Étape finale
                          </span>
                        </div>

                        <h2 className="mt-1 text-xl font-black tracking-tight text-[#18151F] sm:text-2xl">
                          Vérifiez votre commande
                        </h2>

                        <p className="mt-1 text-xs leading-5 text-[#6F687A]">
                          Vérifiez attentivement vos informations avant de confirmer.
                        </p>
                      </div>
                    </div>

                    <div className="hidden shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700 sm:block">
                      Prêt à confirmer
                    </div>
                  </div>
                </div>

                {/* INFORMATIONS PRINCIPALES */}
                <div className="grid gap-4 lg:grid-cols-2">
                  {/* CLIENT */}
                  <div className="rounded-[14px] border border-[#E8E3EF] bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFA] text-[#7654C6]">
                        <User size={17} />
                      </div>

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9A93A5]">
                          Client
                        </p>
                        <p className="mt-0.5 text-sm font-black text-[#18151F]">
                          Vos coordonnées
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                      <div className="rounded-xl bg-[#FAF9FC] px-3 py-2.5">
                        <p className="text-[9px] font-black uppercase tracking-wider text-[#9A93A5]">
                          Nom
                        </p>
                        <p className="mt-1 truncate text-xs font-black text-[#18151F]">
                          {nom}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#FAF9FC] px-3 py-2.5">
                        <p className="text-[9px] font-black uppercase tracking-wider text-[#9A93A5]">
                          Téléphone
                        </p>
                        <p className="mt-1 truncate text-xs font-black text-[#18151F]">
                          {telephone}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#FAF9FC] px-3 py-2.5">
                        <p className="text-[9px] font-black uppercase tracking-wider text-[#9A93A5]">
                          Email
                        </p>
                        <p className="mt-1 truncate text-xs font-black text-[#18151F]">
                          {email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* RÉCEPTION */}
                  <div className="rounded-[14px] border border-[#E8E3EF] bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <MapPin size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9A93A5]">
                          Réception
                        </p>
                        <p className="mt-0.5 text-sm font-black text-[#18151F]">
                          {modeReception === 'retrait' ? 'Retrait' : 'Livraison'}
                        </p>
                      </div>

                      {modeReception === 'retrait' ? (
                        <span className="ml-auto shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                          Gratuit
                        </span>
                      ) : (
                        <span className="ml-auto shrink-0 rounded-full bg-[#F1ECFA] px-2.5 py-1 text-[10px] font-black text-[#7654C6]">
                          À domicile
                        </span>
                      )}
                    </div>

                    <div className="mt-4 rounded-xl bg-[#FAF9FC] px-3.5 py-3">
                      {modeReception === 'retrait' ? (
                        <p className="text-xs font-semibold leading-5 text-[#6F687A]">
                          Vous récupérerez votre commande vous-même.
                        </p>
                      ) : (
                        <>
                          <p className="text-xs font-black text-[#18151F]">
                            {commune || 'Zone sélectionnée'}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-[#6F687A]">
                            {departement}, {commune}, {quartier}, {rue}
                          </p>

                          {repere && (
                            <p className="mt-1 text-[11px] leading-5 text-[#9A93A5]">
                              Repère : {repere}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* PAIEMENT */}
                <div className="rounded-[14px] border border-[#E8E3EF] bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <CreditCard size={17} />
                    </div>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9A93A5]">
                        Paiement
                      </p>
                      <p className="mt-0.5 text-sm font-black text-[#18151F]">
                        {modePaiement === 'mobile_money'
                          ? 'Mobile Money'
                          : 'Espèces'}
                      </p>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                      {modePaiement === 'mobile_money' && (
                        <span className="flex h-8 w-9 items-center justify-center rounded-[45%] border-2 border-black bg-[#FFCC00] shadow-sm">

                          <span className="font-black text-[7px] leading-none tracking-[-0.09em] text-black">

                            MTN

                          </span>

                        </span>
                      )}

                      <span className="rounded-full bg-[#FAF9FC] px-2.5 py-1.5 text-[10px] font-black text-[#6F687A]">
                        {modePaiement === 'mobile_money'
                          ? 'Paiement en ligne'
                          : 'Paiement au retrait'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RÉSUMÉ COMMANDE */}
                <div className="rounded-[14px] border border-[#E8E3EF] bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFA] text-[#18151F]">
                        <ShoppingBag size={17} />
                      </div>

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9A93A5]">
                          Commande
                        </p>
                        <p className="mt-0.5 text-sm font-black text-[#18151F]">
                          Résumé de votre commande
                        </p>
                      </div>
                    </div>

                    <span className="hidden rounded-full bg-[#F1ECFA] px-3 py-1.5 text-[10px] font-black text-[#6F687A] sm:block">
                      Vérification finale
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {articlesStock.length > 0 && (
                      <div className="rounded-[14px] border border-emerald-100 bg-emerald-50/70 p-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-black text-emerald-900">
                              Articles en stock
                            </p>
                            <p className="mt-1 text-[11px] leading-5 text-emerald-700">
                              Disponibles actuellement.
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-black text-emerald-700 shadow-sm">
                            {formatPrix(totalStock)}
                          </span>
                        </div>
                      </div>
                    )}

                    {articlesSurCommande.length > 0 && (
                      <div className="rounded-[14px] border border-amber-100 bg-amber-50/70 p-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-black text-amber-900">
                              Articles sur commande
                            </p>
                            <p className="mt-1 text-[11px] leading-5 text-amber-700">
                              {transportSurCommande === 'avion'
                                ? 'Transport aérien · Livraison estimée sous 30 jours.'
                                : transportSurCommande === 'bateau'
                                  ? 'Transport maritime · Livraison estimée jusqu’à 3 mois.'
                                  : 'Transport sélectionné · Délai selon le mode choisi.'}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full bg-white px-2.5 py-1.5 text-[11px] font-black text-amber-700 shadow-sm">
                            {formatPrix(totalSurCommande)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACOMPTE */}
                  {panierMixte && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-[14px] border border-[#E8E3EF] bg-[#F1ECFA]/70 px-4 py-3">
                      <div>
                        <p className="text-xs font-black text-[#18151F]">
                          Acompte requis
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#6F687A]">
                          50 % des articles sur commande.
                        </p>
                      </div>

                      <span className="shrink-0 text-sm font-black text-[#18151F]">
                        {formatPrix(calculServeur?.acompteRequis ?? Math.ceil(totalSurCommande * 0.5))}
                      </span>
                    </div>
                  )}

                  {!panierMixte && articlesSurCommande.length > 0 && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-[14px] border border-amber-100 bg-amber-50/70 px-4 py-3">
                      <div>
                        <p className="text-xs font-black text-amber-900">
                          Acompte nécessaire avant traitement
                        </p>
                        <p className="mt-0.5 text-[11px] text-amber-700">
                          50 % requis avant le lancement du traitement.
                        </p>
                      </div>

                      <span className="shrink-0 text-sm font-black text-amber-900">
                        {formatPrix(calculServeur?.acompteRequis ?? Math.ceil(totalSurCommande * 0.5))}
                      </span>
                    </div>
                  )}
                </div>

                {/* TOTAL */}
                <div className="overflow-hidden rounded-[14px] border border-[#E8E3EF] bg-white shadow-[0_2px_10px_rgba(24,21,31,0.05)]">
                  <div className="p-5 sm:p-6">
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#9A93A5]">Sous-total</span>
                        <span className="font-bold text-[#18151F]">
                          {formatPrix(sousTotal)}
                        </span>
                      </div>

                      {reduction > 0 && (
                        <div className="flex items-center justify-between gap-4 text-emerald-700">
                          <span>Réduction</span>
                          <span className="font-bold">
                            -{formatPrix(reduction)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 border-t border-[#E8E3EF] pt-4">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9A93A5]">
                            Total
                          </p>
                          <p className="mt-1 text-sm font-black text-[#18151F]">
                            Montant de la commande
                          </p>
                        </div>

                        <span className="text-2xl font-black tracking-tight text-[#D92D20] sm:text-3xl">
                          {formatPrix(calculServeur?.total ?? total)}
                        </span>
                      </div>
                    </div>

                    {articlesSurCommande.length > 0 && (
                      <div className="mt-4 flex items-center justify-between gap-4 rounded-[14px] bg-[#FAF9FC] px-4 py-3">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#9A93A5]">
                            Acompte à prévoir
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#6F687A]">
                            50 % des articles sur commande
                          </p>
                        </div>

                        <span className="text-lg font-black text-[#18151F]">
                          {formatPrix(calculServeur?.acompteRequis ?? Math.ceil(totalSurCommande * 0.5))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* RÈGLE LIVRAISON */}
                {modeReception === 'livraison' && (
                  <div className="flex items-start gap-3 rounded-[14px] border border-[#E8E3EF] bg-[#F1ECFA]/70 px-4 py-3.5">
                    <MapPin
                      className="mt-0.5 shrink-0 text-[#7654C6]"
                      size={17}
                    />

                    <div>
                      <p className="text-xs font-black text-[#18151F]">
                        Livraison à domicile
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-[#6F687A]">
                        Le paiement Mobile Money est obligatoire pour la livraison.
                        La livraison sera organisée selon la disponibilité de votre commande.
                      </p>
                    </div>
                  </div>
                )}

                {/* ERREUR */}
                {erreurCommande && (
                  <div
                    role="alert"
                    className="rounded-[14px] border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0">⚠️</span>
                      <p>{erreurCommande}</p>
                    </div>
                  </div>
                )}

                {/* ACTIONS */}
                <div className="rounded-[14px] border border-[#E8E3EF] bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-3 flex items-center gap-2 text-[11px] font-medium text-[#6F687A]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Check size={11} strokeWidth={3} />
                    </span>
                    Vos informations sont prêtes à être confirmées.
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={precedent}
                      disabled={chargement}
                      className="h-12 rounded-xl border border-[#E8E3EF] bg-white px-5 text-xs font-black text-[#6F687A] transition hover:border-[#DCD5E8] hover:bg-[#FAF9FC] disabled:opacity-50"
                    >
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={confirmerCommande}
                      disabled={chargement}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#D92D20] px-5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(198,40,40,0.12)] transition hover:bg-[#B42318] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {chargement ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Création de la commande...
                        </>
                      ) : (
                        <>
                          <Check size={17} strokeWidth={3} />
                          Confirmer ma commande
                        </>
                      )}
                    </button>
                  </div>

                  <p className="mt-3 text-center text-[10px] font-medium text-[#9A93A5]">
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
                      ? 'w-8 bg-[#7654C6]'
                      : etape > item.numero
                        ? 'w-5 bg-[#7654C6]'
                        : 'w-5 bg-[#E8E3EF]'
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
