import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
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
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-slate-200 sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <ShoppingCart size={28} className="text-[#0B1E3D]" />
          </div>

          <h1 className="mt-5 text-2xl font-black text-[#0B1E3D]">
            Votre panier est vide
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Ajoutez des produits pour commencer votre commande.
          </p>

          <Link
            to="/catalogue"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0284C7] px-6 text-sm font-extrabold text-white transition hover:bg-[#0369A1]"
          >
            Voir le catalogue
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        to="/catalogue"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#0B1E3D]"
      >
        <ArrowLeft size={17} />
        Continuer mes achats
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-black tracking-tight text-[#0B1E3D]">
          Mon panier
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {nombreArticles} article{nombreArticles > 1 ? 's' : ''}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          {items.map((item) => (
            <article
              key={item.produit.id}
              className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-5"
            >
              <div className="flex gap-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-28">
                  {item.produit.image_url ? (
                    <img
                      src={item.produit.image_url}
                      alt={item.produit.nom}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      Image
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 text-sm font-extrabold text-[#0B1E3D]">
                    {item.produit.nom}
                  </h2>

                  <p className="mt-2 text-sm font-black text-[#0B1E3D]">
                    {formatPrix(item.produit.prix)}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => diminuer(item.produit.id)}
                        className="flex h-9 w-9 items-center justify-center text-[#0B1E3D] hover:bg-slate-50"
                        aria-label="Diminuer"
                      >
                        <Minus size={15} />
                      </button>

                      <span className="flex h-9 w-10 items-center justify-center border-x border-slate-200 text-sm font-bold">
                        {item.quantite}
                      </span>

                      <button
                        type="button"
                        onClick={() => augmenter(item.produit.id)}
                        className="flex h-9 w-9 items-center justify-center text-[#0B1E3D] hover:bg-slate-50"
                        aria-label="Augmenter"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => supprimer(item.produit.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 text-right">
                <span className="text-sm font-black text-[#0B1E3D]">
                  {formatPrix(item.produit.prix * item.quantite)}
                </span>
              </div>
            </article>
          ))}
        </section>

        <aside className="h-fit rounded-2xl bg-white p-5 ring-1 ring-slate-200 lg:sticky lg:top-24">
          <h2 className="text-lg font-black text-[#0B1E3D]">
            Résumé
          </h2>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Sous-total</span>
              <span className="font-bold text-[#0B1E3D]">
                {formatPrix(sousTotal)}
              </span>
            </div>

            {reduction > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-green-600">Réduction (1,5 %)</span>
                <span className="font-bold text-green-600">
                  -{formatPrix(reduction)}
                </span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-4">
              <div className="flex justify-between gap-4">
                <span className="font-black text-[#0B1E3D]">Total</span>
                <span className="text-xl font-black text-[#0B1E3D]">
                  {formatPrix(totalAvecReduction)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/commande')}
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0284C7] px-5 text-sm font-extrabold text-white transition hover:bg-[#0369A1] active:scale-[0.98]"
          >
            Passer la commande
          </button>

          <p className="mt-3 text-center text-xs leading-5 text-slate-400">
            Les frais de livraison seront calculés selon le mode de réception.
          </p>
        </aside>
      </div>
    </main>
  )
}
