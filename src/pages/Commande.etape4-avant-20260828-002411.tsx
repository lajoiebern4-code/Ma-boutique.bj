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
  recupererTarifsLivraison,
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
  const [email, setEmail] = useState('')

  const [modeReception, setModeReception] =
    useState<'livraison' | 'retrait'>('retrait')

  const [modePaiement, setModePaiement] =
    useState<'especes' | 'mobile_money'>('especes')

  const [adresse, setAdresse] = useState('')
  const [telephonePaiement, setTelephonePaiement] = useState('')

  const [tarifsLivraison, setTarifsLivraison] = useState<any[]>([])
  const [zoneLivraisonId, setZoneLivraisonId] = useState('')

  const [chargement, setChargement] = useState(false)

  useEffect(() => {
    let actif = true

    recupererTarifsLivraison().then((resultat) => {
      if (!actif) return

      if (resultat.success) {
        setTarifsLivraison(resultat.data || [])

        if (resultat.data?.length === 1) {
          setZoneLivraisonId(resultat.data[0].id)
        }
      } else {
        console.error(
          'Impossible de charger les tarifs de livraison:',
          resultat.error,
        )
      }
    })

    return () => {
      actif = false
    }
  }, [])

  const fraisLivraison = useMemo(() => {
    if (modeReception !== 'livraison') return 0

    const tarif = tarifsLivraison.find(
      (item) => String(item.id) === String(zoneLivraisonId),
    )

    return Number(tarif?.tarif || 0)
  }, [modeReception, tarifsLivraison, zoneLivraisonId])

  const zoneSelectionnee = useMemo(() => {
    return tarifsLivraison.find(
      (item) => String(item.id) === String(zoneLivraisonId),
    )
  }, [tarifsLivraison, zoneLivraisonId])

  const total = useMemo(() => {
    return totalAvecReduction + fraisLivraison
  }, [totalAvecReduction, fraisLivraison])

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
      alert('Veuillez renseigner votre nom complet.')
      return false
    }

    if (!telephone.trim()) {
      alert('Veuillez renseigner votre numéro de téléphone.')
      return false
    }

    return true
  }

  function validerEtape2() {
    if (modeReception === 'livraison' && !zoneLivraisonId) {
      alert('Veuillez sélectionner votre zone de livraison.')
      return false
    }

    if (modeReception === 'livraison' && !adresse.trim()) {
      alert('Veuillez renseigner votre adresse de livraison.')
      return false
    }

    return true
  }

  function validerEtape3() {
    if (
      modeReception === 'livraison' &&
      modePaiement !== 'mobile_money'
    ) {
      alert('La livraison nécessite un paiement Mobile Money.')
      return false
    }

    if (
      modePaiement === 'mobile_money' &&
      !telephonePaiement.trim()
    ) {
      alert('Veuillez renseigner le numéro utilisé pour le paiement.')
      return false
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

    const commande = {
      nomClient: nom,
      telephone,
      email,
      modeReception,
      modePaiement:
        modePaiement === 'mobile_money'
          ? 'en_ligne'
          : 'especes',
      adresseLivraison: adresse,
      zoneLivraisonId: zoneLivraisonId || null,
      zoneLivraisonCode:
        tarifsLivraison.find(
          (tarif) =>
            String(tarif.id) === String(zoneLivraisonId),
        )?.code || null,
      telephonePaiement,
      articles: items.map((item) => ({
        id: item.produit.id,
        qte: item.quantite,
      })),
    }

    setChargement(true)

    const resultat = await sauvegarderCommandeV2(commande)

    setChargement(false)

    if (!resultat.success) {
      alert(
        resultat.error ||
          'Impossible de créer la commande.',
      )
      return
    }

    vider()

    sessionStorage.setItem(
      'chinashop_commande_resultat',
      JSON.stringify({
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
      }),
    )

    navigate('/confirmation')
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
                          onChange={(e) => setTelephone(e.target.value)}
                          placeholder="Ex. 97 00 00 00"
                          inputMode="tel"
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-12 pr-4 text-sm font-semibold text-[#0B1E3D] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0284C7] focus:bg-white focus:ring-4 focus:ring-sky-50"
                        />
                      </div>

                      <p className="mt-2 text-[11px] leading-5 text-slate-400">
                        Ce numéro sera utilisé pour le suivi de votre commande.
                      </p>
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
                          Tarif selon la zone
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
                          Sélectionnez votre zone puis indiquez votre adresse complète.
                        </p>
                      </div>

                      <div className="space-y-5">

                        <div>
                          <label className="mb-2.5 block text-xs font-black text-[#0B1E3D]">
                            Zone de livraison
                            <span className="ml-1 text-[#0284C7]">*</span>
                          </label>

                          <select
                            value={zoneLivraisonId}
                            onChange={(e) => setZoneLivraisonId(e.target.value)}
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0B1E3D] outline-none transition hover:border-slate-300 focus:border-[#0284C7] focus:ring-4 focus:ring-sky-50"
                          >
                            <option value="">
                              Sélectionner une zone
                            </option>

                            {tarifsLivraison.map((tarif) => (
                              <option
                                key={tarif.id}
                                value={tarif.id}
                              >
                                {tarif.nomZone} — {formatPrix(tarif.tarif)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2.5 block text-xs font-black text-[#0B1E3D]">
                            Adresse complète
                            <span className="ml-1 text-[#0284C7]">*</span>
                          </label>

                          <textarea
                            value={adresse}
                            onChange={(e) => setAdresse(e.target.value)}
                            placeholder="Quartier, rue, maison, repère..."
                            rows={4}
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-[#0B1E3D] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0284C7] focus:ring-4 focus:ring-sky-50"
                          />
                        </div>

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
                      className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0284C7] text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:bg-[#0369A1] active:scale-[0.99]"
                    >
                      Continuer
                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </button>
                  </div>

                  <p className="mt-3 text-center text-[11px] text-slate-400">
                    Étape 2 sur 4
                  </p>

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
                      disabled={modeReception === 'livraison'}
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
                            Numéro utilisé pour le paiement
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Indiquez le numéro Mobile Money qui servira à effectuer le paiement.
                          </p>
                        </div>
                      </div>

                      <div className="relative mt-5">
                        <Phone
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={18}
                        />

                        <input
                          value={telephonePaiement}
                          onChange={(e) =>
                            setTelephonePaiement(e.target.value)
                          }
                          placeholder="Ex. 97 00 00 00"
                          inputMode="tel"
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-[#0B1E3D] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0284C7] focus:ring-4 focus:ring-sky-50"
                        />
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
              <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
                <div className="mb-7">
                  <span className="text-xs font-black uppercase tracking-[0.15em] text-[#0284C7]">
                    Étape 04
                  </span>

                  <h2 className="mt-2 text-2xl font-black text-[#0B1E3D]">
                    Vérifiez votre commande
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Vérifiez attentivement les informations et les conditions avant confirmation.
                  </p>
                </div>

                {/* CLIENT */}
                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Client
                    </p>

                    <p className="mt-2 font-black text-[#0B1E3D]">
                      {nom}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {telephone}
                    </p>

                    {email && (
                      <p className="mt-1 text-sm text-slate-500">
                        {email}
                      </p>
                    )}
                  </div>

                  {/* RÉCEPTION */}
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Réception
                    </p>

                    <p className="mt-2 font-black text-[#0B1E3D]">
                      {modeReception === 'retrait'
                        ? 'Retrait'
                        : 'Livraison'}
                    </p>

                    {modeReception === 'livraison' && (
                      <>
                        <p className="mt-1 text-sm text-slate-500">
                          {zoneSelectionnee?.nomZone || 'Zone sélectionnée'}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {adresse}
                        </p>
                      </>
                    )}
                  </div>

                  {/* PAIEMENT */}
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Paiement
                    </p>

                    <p className="mt-2 font-black text-[#0B1E3D]">
                      {modePaiement === 'mobile_money'
                        ? 'Mobile Money'
                        : 'Espèces'}
                    </p>

                    {modePaiement === 'mobile_money' && (
                      <p className="mt-1 text-sm text-slate-500">
                        {telephonePaiement}
                      </p>
                    )}
                  </div>

                  {/* DISPONIBILITÉ DES ARTICLES */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Disponibilité des articles
                    </p>

                    <div className="mt-4 space-y-3">
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

                            <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">
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

                            <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700">
                              {formatPrix(totalSurCommande)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RÈGLE PANIER MIXTE */}
                  {panierMixte && (
                    <div className="rounded-2xl border-2 border-[#0284C7]/20 bg-sky-50 p-5">
                      <p className="text-sm font-black text-[#0B1E3D]">
                        Votre commande contient des articles en stock et sur commande.
                      </p>

                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        Pour éviter une double expédition, les articles en stock
                        sont réservés et votre commande est traitée comme une
                        commande regroupée. La réception intervient lorsque les
                        articles sur commande sont disponibles.
                      </p>

                      <div className="mt-4 rounded-xl bg-white p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Acompte requis
                        </p>

                        <p className="mt-1 text-lg font-black text-[#0B1E3D]">
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
                    <div className="rounded-2xl border-2 border-amber-100 bg-amber-50 p-5">
                      <p className="text-sm font-black text-amber-900">
                        Acompte nécessaire avant traitement
                      </p>

                      <p className="mt-2 text-xs leading-5 text-amber-800">
                        Votre commande contient uniquement des articles sur commande.
                        Un acompte de 50 % est requis avant le lancement du traitement.
                      </p>

                      <div className="mt-4 rounded-xl bg-white p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Acompte requis
                        </p>

                        <p className="mt-1 text-lg font-black text-[#0B1E3D]">
                          {formatPrix(Math.ceil(totalSurCommande * 0.5))}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TOTAL */}
                  <div className="rounded-3xl bg-[#0B1E3D] p-6 text-white">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">
                        Sous-total
                      </span>

                      <span className="font-bold">
                        {formatPrix(sousTotal)}
                      </span>
                    </div>

                    {reduction > 0 && (
                      <div className="mt-2 flex justify-between text-sm text-emerald-300">
                        <span>Réduction</span>

                        <span className="font-bold">
                          -{formatPrix(reduction)}
                        </span>
                      </div>
                    )}

                    {modeReception === 'livraison' && (
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-slate-300">
                          Livraison
                        </span>

                        <span className="font-bold">
                          {formatPrix(fraisLivraison)}
                        </span>
                      </div>
                    )}

                    <div className="mt-5 border-t border-white/10 pt-5">
                      <div className="flex items-end justify-between gap-4">
                        <span className="font-black">
                          Total à payer
                        </span>

                        <span className="text-2xl font-black text-orange-400">
                          {formatPrix(total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RÈGLE LIVRAISON */}
                  {modeReception === 'livraison' && (
                    <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                      <p className="text-sm font-black text-sky-900">
                        Livraison à domicile
                      </p>

                      <p className="mt-1 text-xs leading-5 text-sky-700">
                        Le paiement Mobile Money est obligatoire pour la livraison.
                        La livraison sera organisée selon la disponibilité de votre commande.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={precedent}
                    disabled={chargement}
                    className="h-14 rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-600 disabled:opacity-50"
                  >
                    Modifier
                  </button>

                  <button
                    type="button"
                    onClick={confirmerCommande}
                    disabled={chargement}
                    className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0284C7] text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-60"
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
