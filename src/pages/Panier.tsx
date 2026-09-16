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
  } = useCart()

  if (items.length === 0) {
    return (
      <main className="min-h-[70vh] bg-[#F7F9FC] text-[#0B1E3D]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
          <Link
            to="/catalogue"
            className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#0052CC]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition group-hover:border-blue-100 group-hover:bg-blue-50">
              <ArrowLeft size={16} />
            </span>
            Continuer mes achats
          </Link>

          <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(11,30,61,0.08)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-[#0052CC]" />

            <div className="relative px-6 py-16 text-center sm:px-10 sm:py-24">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[#EBF5FF] shadow-inner">
                <ShoppingCart size={38} className="text-[#0052CC]" />
              </div>

              <div className="mx-auto mt-8 max-w-lg">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0052CC]">
                  Votre sélection
                </p>

                <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl">
                  Votre panier est vide
                </h1>

                <p className="mt-4 text-sm leading-6 text-slate-500 sm:text-base">
                  Parcourez notre catalogue et ajoutez les articles qui vous
                  intéressent. Votre sélection apparaîtra ici avant de passer
                  votre commande.
                </p>

                <Link
                  to="/catalogue"
                  className="mt-9 inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#0052CC] px-7 text-sm font-black text-white shadow-[0_12px_30px_rgba(0,82,204,0.22)] transition hover:-translate-y-0.5 hover:bg-[#003F9E] hover:shadow-[0_16px_35px_rgba(0,82,204,0.28)] active:scale-[0.98]"
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
    <main className="min-h-screen bg-[#F7F9FC] text-[#0B1E3D]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <Link
          to="/catalogue"
          className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#0052CC]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition group-hover:border-blue-100 group-hover:bg-blue-50">
            <ArrowLeft size={16} />
          </span>
          Continuer mes achats
        </Link>

        <header className="mt-8 flex flex-col gap-5 sm:mt-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EBF5FF] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#0052CC]">
              <ShoppingCart size={13} />
              Votre sélection
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-[2.7rem]">
              Mon panier
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {nombreArticles} article{nombreArticles > 1 ? 's' : ''} dans
              votre panier
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-black shadow-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0B1E3D] text-[10px] text-white">
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

              return (
                <article
                  key={item.produit.id}
                  className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(11,30,61,0.045)] transition duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_18px_50px_rgba(11,30,61,0.08)]"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex gap-4 sm:gap-5">
                      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-[#F3F6FA] sm:h-36 sm:w-36">
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
                          <Check size={14} className="text-[#0052CC]" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="mb-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                              Article ChinaShop
                            </p>

                            <h2 className="line-clamp-2 text-sm font-black leading-5 text-[#0B1E3D] sm:text-base">
                              {item.produit.nom}
                            </h2>

                            <p className="mt-2 text-sm font-black text-[#0052CC]">
                              {formatPrix(item.produit.prix)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => supprimer(cleLigne)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-red-100 hover:bg-red-50 hover:text-red-500"
                            aria-label={`Supprimer ${item.produit.nom}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-5 flex items-end justify-between gap-3">
                          <div>
                            <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                              Quantité
                            </p>

                            <div className="flex h-10 items-center overflow-hidden rounded-xl border border-slate-200 bg-[#F7F9FC]">
                              <button
                                type="button"
                                onClick={() => diminuer(cleLigne)}
                                className="flex h-10 w-10 items-center justify-center text-[#0B1E3D] transition hover:bg-white hover:text-[#0052CC]"
                                aria-label="Diminuer"
                              >
                                <Minus size={15} />
                              </button>

                              <span className="flex h-10 min-w-10 items-center justify-center border-x border-slate-200 bg-white px-2 text-sm font-black">
                                {item.quantite}
                              </span>

                              <button
                                type="button"
                                onClick={() => augmenter(cleLigne)}
                                className="flex h-10 w-10 items-center justify-center text-[#0B1E3D] transition hover:bg-white hover:text-[#0052CC]"
                                aria-label="Augmenter"
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
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
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_20px_55px_rgba(11,30,61,0.08)]">
              <div className="relative overflow-hidden bg-[#0B1E3D] px-5 py-6 sm:px-6">
                <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/5" />
                <div className="absolute -bottom-16 right-16 h-32 w-32 rounded-full bg-[#0052CC]/20" />

                <div className="relative">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">
                    Récapitulatif
                  </p>

                  <h2 className="mt-1 text-xl font-black text-white">
                    Résumé de la commande
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-blue-100/70">
                    Vérifiez votre sélection avant de continuer.
                  </p>
                </div>
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
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5">
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
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                          Total
                        </p>

                        <p className="mt-1 text-xs font-bold text-slate-500">
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
                  className="group mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0052CC] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(0,82,204,0.22)] transition hover:-translate-y-0.5 hover:bg-[#003F9E] hover:shadow-[0_16px_35px_rgba(0,82,204,0.28)] active:scale-[0.98]"
                >
                  Passer la commande
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>

                <div className="mt-5 flex gap-3 rounded-2xl bg-[#F7F9FC] p-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Check size={14} className="text-[#0052CC]" />
                  </div>

                  <p className="text-[11px] leading-5 text-slate-500">
                    Les frais de livraison seront calculés selon le mode de
                    réception choisi lors de la commande.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EBF5FF]">
                  <ShoppingBag size={17} className="text-[#0052CC]" />
                </div>

                <div>
                  <p className="text-xs font-black text-[#0B1E3D]">
                    Besoin d'ajouter un article ?
                  </p>

                  <Link
                    to="/catalogue"
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-black text-[#0052CC] transition hover:text-[#003F9E]"
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
