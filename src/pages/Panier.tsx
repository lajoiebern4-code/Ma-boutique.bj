import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import { useCart } from '../context/CartContext'

function formatPrix(prix: number) {
  return `${prix.toLocaleString('fr-FR')} FCFA`
}

export default function Panier() {
  const navigate = useNavigate()

  const {
    items,
    nombreArticles,
    sousTotal,
    reduction,
    totalAvecReduction,
    augmenter,
    diminuer,
    supprimer,
    choisirTransport,
  } = useCart()

  const articlesSurCommandeSansTransport = items.filter((item) => {
    if (item.produit.surCommande !== true) return false
    const transportForceAvion =
      item.produit.categorie === 'telephones' ||
      item.produit.sous_categorie === 'ordinateur'
    return !transportForceAvion && !item.produit.type_transport
  })

  const transportManquant = articlesSurCommandeSansTransport.length > 0

  const transportChineSelectionne = items.reduce((total, item) => {
    if (item.produit.surCommande !== true) return total

    const transportForceAvion =
      item.produit.categorie === 'telephones' ||
      item.produit.sous_categorie === 'ordinateur'

    const transport = transportForceAvion
      ? 'avion'
      : item.produit.type_transport

    if (transport === 'avion' && Number(item.produit.poids_kg) > 0) {
      return (
        total +
        Number(item.produit.poids_kg) *
          Number(item.quantite || 1) *
          10000
      )
    }

    if (transport === 'bateau' && Number(item.produit.volume_cbm) > 0) {
      return (
        total +
        Number(item.produit.volume_cbm) *
          Number(item.quantite || 1) *
          250000
      )
    }

    return total
  }, 0)

  const totalPanierAvecTransport =
    totalAvecReduction + transportChineSelectionne

  if (items.length === 0) {
    return (
      <main className="min-h-[70vh] bg-[#FAF9FC] text-[#18151F]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
          <Link
            to="/catalogue"
            className="group inline-flex items-center gap-2 text-sm font-bold text-[#6F687A] transition hover:text-[#7654C6]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#E8E3EF] bg-white shadow-sm transition group-hover:border-[#7654C6]/30 group-hover:bg-[#F1ECFA]">
              <ArrowLeft size={16} />
            </span>
            Continuer mes achats
          </Link>

          <section className="relative mt-8 overflow-hidden rounded-[14px] border border-[#E8E3EF] bg-white shadow-[0_8px_24px_rgba(24,21,31,0.06)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-[#7654C6]" />

            <div className="relative px-6 py-14 text-center sm:px-10 sm:py-18">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[14px] bg-[#F1ECFA] shadow-inner">
                <ShoppingCart size={38} className="text-[#7654C6]" />
              </div>

              <div className="mx-auto mt-8 max-w-lg">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7654C6]">
                  Votre sélection
                </p>

                <h1 className="mt-3 text-3xl font-black tracking-tight text-[#18151F] sm:text-4xl">
                  Votre panier est vide
                </h1>

                <p className="mt-4 text-sm leading-6 text-[#6F687A] sm:text-base">
                  Parcourez notre catalogue et ajoutez les articles qui vous
                  intéressent. Votre sélection apparaîtra ici avant de passer
                  votre commande.
                </p>

                <Link
                  to="/catalogue"
                  className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-[#7654C6] px-6 text-sm font-bold text-white shadow-[0_4px_14px_rgba(118,84,198,0.16)] transition hover:bg-[#6544B3] active:scale-[0.99]"
                >
                  <ShoppingBag size={18} />
                  Découvrir le catalogue
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF9FC] text-[#18151F]">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <Link
          to="/catalogue"
          className="group inline-flex items-center gap-2 text-sm font-bold text-[#6F687A] transition hover:text-[#7654C6]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#E8E3EF] bg-white shadow-sm transition group-hover:border-[#7654C6]/30 group-hover:bg-[#F1ECFA]">
            <ArrowLeft size={16} />
          </span>
          Continuer mes achats
        </Link>

        <header className="mt-7 flex flex-col gap-5 sm:mt-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F1ECFA] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#7654C6]">
              <ShoppingCart size={13} />
              Votre sélection
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-[2.7rem]">
              Mon panier
            </h1>

            <p className="mt-2 text-sm text-[#6F687A]">
              {nombreArticles} article{nombreArticles > 1 ? 's' : ''} dans
              votre panier
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E8E3EF] bg-white px-4 py-2.5 text-xs font-black shadow-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#18151F] text-[10px] text-white">
              {nombreArticles}
            </span>
            Article{nombreArticles > 1 ? 's' : ''}
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <section className="space-y-4">
            {items.map((item) => {
              const prixLigne = item.produit.prix * item.quantite
              const cleLigne = `${item.produit.id}::${item.produit.variante_id || ''}`
              const estSurCommande = item.produit.surCommande === true
              const transportForceAvion =
                item.produit.categorie === 'telephones' ||
                item.produit.sous_categorie === 'ordinateur'

              return (
                <article
                  key={cleLigne}
                  className="group overflow-hidden rounded-[14px] border border-[#E8E3EF] bg-white shadow-[0_2px_10px_rgba(24,21,31,0.05)] transition duration-200 hover:border-[#7654C6]/20 hover:shadow-[0_8px_24px_rgba(24,21,31,0.08)]"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex gap-4 sm:gap-5">
                      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[14px] bg-[#FAF9FC] sm:h-32 sm:w-32">
                        {item.produit.image_url ? (
                          <img
                            src={item.produit.image_url}
                            alt={item.produit.nom}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ShoppingBag
                              size={27}
                              className="text-slate-300"
                            />
                          </div>
                        )}

                        <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 shadow-sm backdrop-blur">
                          <Check size={14} className="text-[#7654C6]" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="mb-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#9A93A5]">
                              Article ChinaShop
                            </p>

                            <h2 className="line-clamp-2 text-sm font-black leading-5 text-[#18151F] sm:text-base">
                              {item.produit.nom}
                            </h2>

                            {item.produit.variante_nom && (
                              <p className="mt-1 text-[11px] font-bold text-[#6F687A]">
                                Variante : {item.produit.variante_nom}
                              </p>
                            )}

                            <p className="mt-2 text-sm font-black text-[#7654C6]">
                              {formatPrix(item.produit.prix)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => supprimer(cleLigne)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E8E3EF] text-[#9A93A5] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Supprimer ${item.produit.nom}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {estSurCommande && (
                          <div className="mt-5 rounded-[14px] border border-[#E8E3EF] bg-[#F1ECFA] p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7654C6]">
                              Transport depuis la Chine
                            </p>

                            {transportForceAvion ? (
                              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white bg-white px-3.5 py-3 shadow-sm">
                                <div>
                                  <p className="text-xs font-black text-[#18151F]">
                                    Avion
                                  </p>
                                  <p className="mt-0.5 text-[10px] font-semibold text-[#6F687A]">
                                    Transport obligatoire pour cet article
                                  </p>
                                </div>

                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7654C6] text-white">
                                  <Check size={14} />
                                </span>
                              </div>
                            ) : (
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    choisirTransport(
                                      cleLigne,
                                      'avion',
                                    )
                                  }
                                  className={`rounded-xl border px-3 py-3 text-left transition ${
                                    item.produit.type_transport === 'avion'
                                      ? 'border-[#7654C6] bg-[#F1ECFA] shadow-md ring-1 ring-[#D8CCF0]'
                                      : 'border-[#E8E3EF] bg-white shadow-sm hover:border-[#7654C6]/40 hover:bg-[#F1ECFA]'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-xs font-black text-[#18151F]">
                                        Avion
                                      </p>
                                      <p className="mt-0.5 text-[10px] font-semibold text-[#6F687A]">
                                        Environ 30 jours
                                      </p>
                                    </div>
                                    {item.produit.type_transport === 'avion' && (
                                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7654C6] text-white">
                                        <Check size={11} />
                                      </span>
                                    )}
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    choisirTransport(
                                      cleLigne,
                                      'bateau',
                                    )
                                  }
                                  className={`rounded-xl border px-3 py-3 text-left transition ${
                                    item.produit.type_transport === 'bateau'
                                      ? 'border-[#7654C6] bg-[#F1ECFA] shadow-md ring-1 ring-[#D8CCF0]'
                                      : 'border-[#E8E3EF] bg-white shadow-sm hover:border-[#7654C6]/40 hover:bg-[#F1ECFA]'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-xs font-black text-[#18151F]">
                                        Bateau
                                      </p>
                                      <p className="mt-0.5 text-[10px] font-semibold text-[#6F687A]">
                                        Jusqu'à 3 mois
                                      </p>
                                    </div>
                                    {item.produit.type_transport === 'bateau' && (
                                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7654C6] text-white">
                                        <Check size={11} />
                                      </span>
                                    )}
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-5 flex items-end justify-between gap-3">
                          <div>
                            <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#9A93A5]">
                              Quantité
                            </p>

                            <div className="flex h-10 items-center overflow-hidden rounded-xl border border-[#E8E3EF] bg-[#FAF9FC]">
                              <button
                                type="button"
                                onClick={() => diminuer(cleLigne)}
                                className="flex h-10 w-10 items-center justify-center text-[#18151F] transition hover:bg-white hover:text-[#7654C6]"
                                aria-label="Diminuer"
                              >
                                <Minus size={15} />
                              </button>

                              <span className="flex h-10 min-w-10 items-center justify-center border-x border-[#E8E3EF] bg-white px-2 text-sm font-black">
                                {item.quantite}
                              </span>

                              <button
                                type="button"
                                onClick={() => augmenter(cleLigne)}
                                className="flex h-10 w-10 items-center justify-center text-[#18151F] transition hover:bg-white hover:text-[#7654C6]"
                                aria-label="Augmenter"
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#9A93A5]">
                              Total
                            </p>

                            <p className="text-base font-black text-[#18151F] sm:text-lg">
                              {formatPrix(prixLigne)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>

          <aside className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-[14px] border border-[#E8E3EF] bg-white shadow-[0_8px_24px_rgba(24,21,31,0.06)]">
              <div className="relative overflow-hidden bg-[#211C29] px-5 py-6 sm:px-6">
                <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/5" />
                <div className="absolute -bottom-16 right-16 h-32 w-32 rounded-full bg-[#7654C6]/20" />

                <div className="relative">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D8CCF0]">
                    Récapitulatif
                  </p>

                  <h2 className="mt-1 text-xl font-black text-white">
                    Résumé de la commande
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-white/70">
                    Vérifiez votre sélection avant de continuer.
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-[#6F687A]">Sous-total</span>
                    <span className="font-black text-[#18151F]">
                      {formatPrix(sousTotal)}
                    </span>
                  </div>

                  {transportChineSelectionne > 0 && (
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-[#6F687A]">
                        Transport depuis la Chine
                      </span>
                      <span className="font-black text-[#18151F]">
                        {formatPrix(transportChineSelectionne)}
                      </span>
                    </div>
                  )}

                  {reduction > 0 && (
                    <div className="rounded-[14px] border border-emerald-100 bg-emerald-50 px-4 py-3.5">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-bold text-emerald-700">
                          Réduction
                        </span>

                        <span className="font-black text-emerald-700">
                          -{formatPrix(reduction)}
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                        Remise de 1,5 % appliquée
                      </p>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9A93A5]">
                          Total
                        </p>

                        <p className="mt-1 text-xs font-bold text-[#6F687A]">
                          Hors frais de livraison
                        </p>
                      </div>

                      <span className="text-2xl font-black tracking-tight text-[#7654C6]">
                        {formatPrix(totalPanierAvecTransport)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (transportManquant) return
                    navigate('/commande')
                  }}
                  disabled={transportManquant}
                  className={`group mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-[10px] px-5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(118,84,198,0.16)] transition active:scale-[0.98] ${
                    transportManquant
                      ? 'cursor-not-allowed bg-slate-300 shadow-none'
                      : 'bg-[#7654C6] hover:bg-[#6544B3]'
                  }`}
                >
                  {transportManquant ? 'Choisissez le transport' : 'Passer la commande'}
                  {!transportManquant && (
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  )}
                </button>

                <div className="mt-5 flex gap-3 rounded-[14px] border border-[#E8E3EF] bg-[#FAF9FC] p-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Check size={14} className="text-[#7654C6]" />
                  </div>

                  <p className="text-[11px] leading-5 text-[#6F687A]">
                    Les frais de livraison seront calculés selon le mode de
                    réception choisi lors de la commande.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[14px] border border-[#E8E3EF] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFA]">
                  <ShoppingBag size={17} className="text-[#7654C6]" />
                </div>

                <div>
                  <p className="text-xs font-black text-[#18151F]">
                    Besoin d'ajouter un article ?
                  </p>

                  <Link
                    to="/catalogue"
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-black text-[#7654C6] transition hover:text-[#6544B3]"
                  >
                    Retourner au catalogue
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
