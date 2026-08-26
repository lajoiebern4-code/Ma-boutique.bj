import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FileText,
  Printer,
  Search,
  RefreshCw,
  X,
  ChevronRight,
  CreditCard,
  Package,
  Truck,
  MapPin,
} from 'lucide-react'
import { recupererCommandesAdminV2, recupererFactureAdmin } from '../../services/supabase'

type Commande = Record<string, any>

type Ligne = {
  id: string
  commande_id: string
  produit_id: string
  nom_produit: string
  prix_unitaire: number
  quantite: number
  origine?: string
  total_ligne: number
}

type Paiement = {
  id: string
  commande_id: string
  type: string
  provider: string
  reference_transaction?: string | null
  montant: number
  statut: string
  telephone?: string | null
  created_at: string
}

function formatPrix(value: unknown) {
  return `${new Intl.NumberFormat('fr-FR').format(Number(value || 0))} FCFA`
}

function formatDate(value: unknown) {
  if (!value) return '—'

  const date = new Date(String(value))

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatDateHeure(value: unknown) {
  if (!value) return '—'

  const date = new Date(String(value))

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function statutPaiement(statut: string) {
  const value = String(statut || '').toLowerCase()

  if (['paye', 'paid', 'success', 'successful', 'confirme', 'confirmed'].includes(value)) {
    return {
      label: 'PAYÉ',
      className: 'bg-emerald-100 text-emerald-700',
    }
  }

  if (['en_attente', 'pending', 'attente'].includes(value)) {
    return {
      label: 'EN ATTENTE',
      className: 'bg-amber-100 text-amber-700',
    }
  }

  if (['echoue', 'failed', 'refuse', 'rejected'].includes(value)) {
    return {
      label: 'ÉCHEC',
      className: 'bg-red-100 text-red-700',
    }
  }

  return {
    label: String(statut || 'NON RENSEIGNÉ').toUpperCase(),
    className: 'bg-slate-100 text-slate-600',
  }
}

function statutCommande(statut: string) {
  const value = String(statut || '').toLowerCase()

  const labels: Record<string, string> = {
    attente: 'En attente',
    recue: 'Reçue',
    commande_recue: 'Commande reçue',
    confirmee: 'Confirmée',
    preparation: 'En préparation',
    pret: 'Prête',
    retire: 'Retirée',
    livree: 'Livrée',
    annulee: 'Annulée',
  }

  return labels[value] || statut || '—'
}

export default function Factures() {
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [facture, setFacture] = useState<Commande | null>(null)
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [chargementDetail, setChargementDetail] = useState(false)

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')

    try {
      const resultat = await recupererCommandesAdminV2()

      if (!resultat.success) {
        throw new Error(resultat.error || 'Impossible de récupérer les commandes.')
      }

      setCommandes(Array.isArray(resultat.data) ? resultat.data : [])
    } catch (error) {
      setErreur(
        error instanceof Error
          ? error.message
          : 'Impossible de charger les factures.',
      )
      setCommandes([])
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  const commandesFiltrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase()

    if (!terme) return commandes

    return commandes.filter((commande) =>
      [
        commande.numero,
        commande.nom_client,
        commande.telephone,
        commande.statut,
        commande.mode_paiement,
        commande.mode_reception,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(terme),
    )
  }, [commandes, recherche])

  const ouvrirFacture = async (commande: Commande) => {
    setFacture(commande)
    setLignes([])
    setPaiements([])
    setChargementDetail(true)
    setErreur('')

    try {
      const resultat = await recupererFactureAdmin(String(commande.id))

      if (!resultat.success) {
        throw new Error(
          resultat.error ||
            'Impossible de récupérer les détails de la facture.',
        )
      }

      const details = resultat.data || {}

      setLignes(
        Array.isArray(details.lignes)
          ? (details.lignes as Ligne[])
          : [],
      )

      setPaiements(
        Array.isArray(details.paiements)
          ? (details.paiements as Paiement[])
          : [],
      )
    } catch (error) {
      setErreur(
        error instanceof Error
          ? error.message
          : 'Impossible de récupérer les détails de la facture.',
      )
    } finally {
      setChargementDetail(false)
    }
  }

  const fermerFacture = () => {
    setFacture(null)
    setLignes([])
    setPaiements([])
  }

  const imprimer = () => {
    window.print()
  }

  const totalPaiementsConfirmes = paiements.reduce((total, paiement) => {
    const statut = String(paiement.statut || '').toLowerCase()

    const confirme = [
      'paye',
      'paid',
      'success',
      'successful',
      'confirme',
      'confirmed',
    ].includes(statut)

    return confirme ? total + Number(paiement.montant || 0) : total
  }, 0)

  const acomptePaye = Number(
    facture?.acompte_paye ??
      facture?.acomptePaye ??
      totalPaiementsConfirmes ??
      0,
  )

  const totalFacture = Number(
    facture?.total ??
      facture?.prix_total ??
      facture?.prixTotal ??
      0,
  )

  const resteAPayer = Math.max(0, totalFacture - acomptePaye)

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <style>{`
        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          #facture-print,
          #facture-print * {
            visibility: visible !important;
          }

          #facture-print {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>

      <div className="mx-auto max-w-7xl no-print">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0284C7] text-white">
                <FileText size={22} />
              </div>

              <div>
                <h1 className="text-xl font-black text-[#0B1E3D]">
                  Factures
                </h1>
                <p className="text-xs font-medium text-slate-500">
                  Gestion et impression des factures clients
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={charger}
            disabled={chargement}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={chargement ? 'animate-spin' : ''}
            />
            Actualiser
          </button>
        </div>

        {erreur && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {erreur}
          </div>
        )}

        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
          <Search size={18} className="text-slate-400" />

          <input
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Rechercher une commande, un client, un téléphone…"
            className="h-12 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.1fr_1.4fr_1fr_1fr_45px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span>Commande</span>
            <span>Client</span>
            <span>Date</span>
            <span>Total</span>
            <span />
          </div>

          {chargement ? (
            <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm font-bold text-slate-400">
              <RefreshCw size={18} className="animate-spin" />
              Chargement…
            </div>
          ) : commandesFiltrees.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <FileText
                size={38}
                className="mx-auto text-slate-300"
              />
              <p className="mt-3 text-sm font-bold text-slate-500">
                Aucune facture trouvée.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {commandesFiltrees.map((commande) => (
                <button
                  key={commande.id || commande.numero}
                  type="button"
                  onClick={() => ouvrirFacture(commande)}
                  className="grid w-full grid-cols-[1.1fr_1.4fr_1fr_1fr_45px] items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-black text-[#0B1E3D]">
                      {commande.numero || '—'}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">
                      {statutCommande(commande.statut)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      {commande.nom_client || 'Client'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {commande.telephone || '—'}
                    </p>
                  </div>

                  <p className="text-xs font-semibold text-slate-500">
                    {formatDate(commande.created_at)}
                  </p>

                  <p className="text-sm font-black text-[#0B1E3D]">
                    {formatPrix(
                      commande.total ??
                        commande.prix_total ??
                        0,
                    )}
                  </p>

                  <ChevronRight
                    size={18}
                    className="text-slate-300"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {facture && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 p-3 sm:p-6 no-print">
          <div className="mx-auto max-w-4xl">
            <div className="mb-3 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-lg">
              <div>
                <p className="text-sm font-black text-[#0B1E3D]">
                  Facture {facture.numero}
                </p>
                <p className="text-[11px] text-slate-400">
                  Aperçu avant impression
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={imprimer}
                  disabled={chargementDetail}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0284C7] px-4 text-xs font-black text-white hover:bg-[#0369A1] disabled:opacity-50"
                >
                  <Printer size={15} />
                  Imprimer / PDF
                </button>

                <button
                  type="button"
                  onClick={fermerFacture}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div
              id="facture-print"
              className="mx-auto min-h-[297mm] w-full bg-white px-8 py-8 shadow-2xl sm:px-12 sm:py-10"
            >
              <div className="flex items-start justify-between border-b-2 border-[#0B1E3D] pb-6">
                <div>
                  <p className="text-2xl font-black tracking-tight text-[#0B1E3D]">
                    ChinaShop-Benin
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Sourcer en Chine. Vous livrer au Bénin.
                  </p>
                  <p className="mt-4 text-[11px] leading-5 text-slate-500">
                    Facture commerciale
                    <br />
                    Document généré depuis l'administration ChinaShop-Bénin
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-black text-[#0B1E3D]">
                    FACTURE
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-700">
                    N° {facture.numero || '—'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Émise le {formatDate(facture.created_at)}
                  </p>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Facturé à
                  </p>

                  <p className="mt-3 text-base font-black text-[#0B1E3D]">
                    {facture.nom_client || 'Client'}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {facture.telephone || 'Téléphone non renseigné'}
                  </p>

                  {facture.mode_reception === 'livraison' &&
                    facture.adresse_livraison && (
                      <div className="mt-3 flex gap-2 text-xs text-slate-500">
                        <MapPin
                          size={14}
                          className="mt-0.5 shrink-0"
                        />
                        <span>{facture.adresse_livraison}</span>
                      </div>
                    )}
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Informations commande
                  </p>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">
                        Réception
                      </span>
                      <strong className="text-slate-700">
                        {facture.mode_reception === 'livraison'
                          ? 'Livraison à domicile'
                          : 'Retrait'}
                      </strong>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">
                        Paiement
                      </span>
                      <strong className="text-slate-700">
                        {facture.mode_paiement || '—'}
                      </strong>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">
                        Statut commande
                      </span>
                      <strong className="text-slate-700">
                        {statutCommande(facture.statut)}
                      </strong>
                    </div>

                    {facture.code_suivi && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">
                          Code suivi
                        </span>
                        <strong className="text-slate-700">
                          {facture.code_suivi}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-3 flex items-center gap-2">
                  <Package
                    size={16}
                    className="text-[#0B1E3D]"
                  />
                  <h2 className="text-sm font-black uppercase tracking-wider text-[#0B1E3D]">
                    Détail de la commande
                  </h2>
                </div>

                {chargementDetail ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-12 text-sm font-bold text-slate-400">
                    <RefreshCw
                      size={18}
                      className="animate-spin"
                    />
                    Chargement des détails…
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#0284C7] text-left text-[10px] font-black uppercase tracking-wider text-white">
                          <th className="px-4 py-3">
                            Désignation
                          </th>
                          <th className="px-3 py-3 text-center">
                            Qté
                          </th>
                          <th className="px-3 py-3 text-right">
                            Prix unitaire
                          </th>
                          <th className="px-4 py-3 text-right">
                            Total
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {lignes.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-10 text-center text-xs font-semibold text-slate-400"
                            >
                              Aucun article détaillé trouvé.
                            </td>
                          </tr>
                        ) : (
                          lignes.map((ligne) => (
                            <tr key={ligne.id}>
                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-700">
                                  {ligne.nom_produit}
                                </p>

                                {ligne.origine && (
                                  <p className="mt-1 text-[10px] text-slate-400">
                                    Origine : {ligne.origine}
                                  </p>
                                )}
                              </td>

                              <td className="px-3 py-3 text-center font-bold text-slate-600">
                                {ligne.quantite}
                              </td>

                              <td className="px-3 py-3 text-right font-semibold text-slate-600">
                                {formatPrix(ligne.prix_unitaire)}
                              </td>

                              <td className="px-4 py-3 text-right font-black text-[#0B1E3D]">
                                {formatPrix(ligne.total_ligne)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-7 flex justify-end">
                <div className="w-full max-w-sm">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-5">
                      <span className="text-slate-500">
                        Sous-total
                      </span>
                      <strong className="text-slate-700">
                        {formatPrix(facture.sous_total)}
                      </strong>
                    </div>

                    <div className="flex justify-between gap-5">
                      <span className="text-slate-500">
                        Réduction
                      </span>
                      <strong className="text-emerald-600">
                        - {formatPrix(facture.reduction)}
                      </strong>
                    </div>

                    <div className="flex justify-between gap-5">
                      <span className="text-slate-500">
                        Frais de livraison
                      </span>
                      <strong className="text-slate-700">
                        {formatPrix(facture.frais_livraison)}
                      </strong>
                    </div>

                    <div className="my-3 border-t border-slate-200" />

                    <div className="flex justify-between gap-5">
                      <span className="text-base font-black text-[#0B1E3D]">
                        TOTAL
                      </span>
                      <strong className="text-xl font-black text-[#0B1E3D]">
                        {formatPrix(totalFacture)}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <div className="flex justify-between gap-5 text-sm">
                      <span className="font-semibold text-slate-500">
                        Acompte payé
                      </span>
                      <strong className="font-black text-emerald-700">
                        {formatPrix(acomptePaye)}
                      </strong>
                    </div>

                    <div className="mt-2 flex justify-between gap-5 text-sm">
                      <span className="font-semibold text-slate-500">
                        Reste à payer
                      </span>
                      <strong className="font-black text-[#0B1E3D]">
                        {formatPrix(resteAPayer)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <CreditCard
                    size={16}
                    className="text-[#0B1E3D]"
                  />
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#0B1E3D]">
                    Paiements
                  </h2>
                </div>

                {paiements.length === 0 ? (
                  <p className="mt-3 text-xs font-semibold text-slate-400">
                    Aucun paiement enregistré.
                  </p>
                ) : (
                  <div className="mt-4 overflow-hidden rounded-lg border border-slate-100">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-400">
                          <th className="px-3 py-2 text-left">
                            Date
                          </th>
                          <th className="px-3 py-2 text-left">
                            Type
                          </th>
                          <th className="px-3 py-2 text-left">
                            Fournisseur
                          </th>
                          <th className="px-3 py-2 text-right">
                            Montant
                          </th>
                          <th className="px-3 py-2 text-right">
                            Statut
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {paiements.map((paiement) => {
                          const statut = statutPaiement(
                            paiement.statut,
                          )

                          return (
                            <tr key={paiement.id}>
                              <td className="px-3 py-2 text-slate-500">
                                {formatDateHeure(
                                  paiement.created_at,
                                )}
                              </td>

                              <td className="px-3 py-2 font-semibold text-slate-600">
                                {paiement.type || '—'}
                              </td>

                              <td className="px-3 py-2 text-slate-500">
                                {paiement.provider || '—'}
                              </td>

                              <td className="px-3 py-2 text-right font-black text-slate-700">
                                {formatPrix(paiement.montant)}
                              </td>

                              <td className="px-3 py-2 text-right">
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-[9px] font-black ${statut.className}`}
                                >
                                  {statut.label}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {facture.mode_reception === 'livraison' && (
                <div className="mt-6 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <Truck
                      size={16}
                      className="text-[#0B1E3D]"
                    />
                    <p className="text-xs font-black uppercase tracking-wider text-[#0B1E3D]">
                      Livraison
                    </p>
                  </div>

                  <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                    <div>
                      <p className="text-slate-400">
                        Adresse
                      </p>
                      <p className="mt-1 font-bold text-slate-600">
                        {facture.adresse_livraison || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">
                        Statut
                      </p>
                      <p className="mt-1 font-bold text-slate-600">
                        {facture.livraison_statut || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-10 border-t border-slate-200 pt-5 text-center">
                <p className="text-xs font-black text-[#0B1E3D]">
                  Merci pour votre confiance.
                </p>

                <p className="mt-1 text-[10px] leading-5 text-slate-400">
                  Cette facture est générée électroniquement par
                  ChinaShop-Bénin.
                </p>

                <p className="mt-3 text-[9px] font-semibold uppercase tracking-widest text-slate-300">
                  ChinaShop-Bénin • Facture {facture.numero}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
