import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
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
  } = useCart()

  if (items.length === 0) {
    return (
      <main className="min-h-[70vh] bg-[#F7F9FC]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#0052CC]"
          >
            <ArrowLeft size={17} />
            Continuer mes achats
          </Link>

          <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(11,30,61,0.07)]">
            <div className="px-6 py-14 text-center sm:px-10 sm:py-20">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#EBF5FF]">
                <ShoppingCart size={34} className="text-[#0052CC]" />
              </div>

              <div className="mx-auto mt-7 max-w-md">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0052CC]">
                  Votre sélection
                </p>

                <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl">
                  Votre panier est vide
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                  Découvrez nos produits et ajoutez vos articles préférés à
                  votre panier pour commencer votre commande.
                </p>

                <Link
                  to="/catalogue"
                  className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0052CC] px-7 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-[#003D99] hover:shadow-xl active:scale-[0.98]"
                >
                  <ShoppingBag size={18} />
                  Découvrir le catalogue
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
        <Link
          to="/catalogue"
          className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#0052CC]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white transition group-hover:border-blue-200 group-hover:bg-[#EBF5FF]">
            <ArrowLeft size={16} />
          </span>
          Continuer mes achats
        </Link>

        <header className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0052CC]">
              Ma sélection
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl">
              Mon panier
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {nombreArticles} article{nombreArticles > 1 ? 's' : ''} dans
              votre panier
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-[#0B1E3D] shadow-sm">
            <ShoppingCart size={15} className="text-[#0052CC]" />
            {nombreArticles} article{nombreArticles > 1 ? 's' : ''}
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <section className="space-y-4">
            {items.map((item) => {
              const prixLigne = item.produit.prix * item.quantite

              return (
                <article
                  key={item.produit.id}
                  className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(11,30,61,0.05)] transition hover:border-blue-100 hover:shadow-[0_16px_45px_rgba(11,30,61,0.08)]"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex gap-4 sm:gap-5">
                      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-32 sm:w-32">
                        {item.produit.image_url ? (
                          <img
                            src={item.produit.image_url}
                            alt={item.produit.nom}
                            className="h-full w-full object-cover transition duration-500 hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ShoppingBag
                              size={25}
                              className="text-slate-300"
                            />
                          </div>
                        )}

                        <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 shadow-sm">
                          <Check size={14} className="text-[#0052CC]" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="line-clamp-2 text-sm font-black leading-5 text-[#0B1E3D] sm:text-base">
                              {item.produit.nom}
                            </h2>

                            <p className="mt-2 text-sm font-black text-[#0052CC]">
                              {formatPrix(item.produit.prix)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => supprimer(item.produit.id)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-red-100 hover:bg-red-50 hover:text-red-500"
                            aria-label={`Supprimer ${item.produit.nom}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-3">
                          <div>
                            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                              Quantité
                            </p>

                            <div className="flex h-10 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                              <button
                                type="button"
                                onClick={() => diminuer(item.produit.id)}
                                className="flex h-10 w-10 items-center justify-center text-[#0B1E3D] transition hover:bg-white hover:text-[#0052CC]"
                                aria-label="Diminuer"
                              >
                                <Minus size={15} />
                              </button>

                              <span className="flex h-10 min-w-10 items-center justify-center border-x border-slate-200 bg-white px-2 text-sm font-black text-[#0B1E3D]">
                                {item.quantite}
                              </span>

                              <button
                                type="button"
                                onClick={() => augmenter(item.produit.id)}
                                className="flex h-10 w-10 items-center justify-center text-[#0B1E3D] transition hover:bg-white hover:text-[#0052CC]"
                                aria-label="Augmenter"
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                              Total
                            </p>

                            <p className="text-base font-black text-[#0B1E3D] sm:text-lg">
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
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(11,30,61,0.08)]">
              <div className="bg-[#0B1E3D] px-5 py-5 sm:px-6">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">
                  Récapitulatif
                </p>

                <h2 className="mt-1 text-xl font-black text-white">
                  Résumé de la commande
                </h2>
              </div>

              <div className="p-5 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-500">Sous-total</span>

                    <span className="font-black text-[#0B1E3D]">
                      {formatPrix(sousTotal)}
                    </span>
                  </div>

                  {reduction > 0 && (
                    <div className="rounded-2xl bg-emerald-50 px-4 py-3">
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
                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                          Total
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                          Hors frais de livraison
                        </p>
                      </div>

                      <span className="text-2xl font-black tracking-tight text-[#0052CC]">
                        {formatPrix(totalAvecReduction)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/commande')}
                  className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0052CC] px-5 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-[#003D99] hover:shadow-xl active:scale-[0.98]"
                >
                  Passer la commande
                  <ArrowLeft size={17} className="rotate-180" />
                </button>

                <div className="mt-5 flex gap-3 rounded-2xl bg-[#F7F9FC] p-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white">
                    <Check size={14} className="text-[#0052CC]" />
                  </div>

                  <p className="text-xs leading-5 text-slate-500">
                    Les frais de livraison seront calculés selon le mode de
                    réception choisi lors de la commande.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
