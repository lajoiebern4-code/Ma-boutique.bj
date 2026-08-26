import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  ShoppingCart,
} from 'lucide-react'
import {
  ajouterFavori,
  estFavori,
  obtenirProduits,
  supprimerFavori,
  type Produit,
} from '../services/produits'
import { useCart, type CartProduct } from '../context/CartContext'
import { supabase } from '../lib/supabase'

function formatPrix(prix: number) {
  return `${prix.toLocaleString('fr-FR')} FCFA`
}

function calculerTempsRestant(dateFin: string | null | undefined) {
  if (!dateFin) return 0

  const fin = new Date(`${dateFin}T23:59:59`).getTime()
  const maintenant = Date.now()

  return Math.max(0, fin - maintenant)
}

function formaterDecompte(ms: number) {
  const totalSecondes = Math.floor(ms / 1000)

  const jours = Math.floor(totalSecondes / 86400)
  const heures = Math.floor((totalSecondes % 86400) / 3600)
  const minutes = Math.floor((totalSecondes % 3600) / 60)
  const secondes = totalSecondes % 60

  return {
    jours,
    heures,
    minutes,
    secondes,
  }
}

export default function Produit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { ajouter } = useCart()

  const [produit, setProduit] = useState<Produit | null>(null)
  const [chargement, setChargement] = useState(true)
  const [quantite, setQuantite] = useState(1)
  const [utilisateur, setUtilisateur] = useState(null)
  const [favori, setFavori] = useState(false)
  const [chargementFavori, setChargementFavori] = useState(false)
  const [tempsPromo, setTempsPromo] = useState(0)

  useEffect(() => {
    let actif = true

    async function chargerProduit() {
      const resultat = await obtenirProduits()

      if (!actif) return

      const trouve = resultat.find(
        (item) => String(item.id) === String(id),
      )

      setProduit(trouve ?? null)
      setChargement(false)
    }

    chargerProduit()

    return () => {
      actif = false
    }
  }, [id])

  useEffect(() => {
    let actif = true

    async function chargerFavori() {
      if (!id) return

      const { data, error } = await supabase.auth.getUser()

      if (!actif) return

      if (error || !data?.user) {
        setUtilisateur(null)
        setFavori(false)
        return
      }

      const user = data.user
      setUtilisateur(user)

      try {
        const resultat = await estFavori(id, user.id)

        if (actif) {
          setFavori(resultat)
        }
      } catch (err) {
        console.error('Erreur chargement favori:', err)
      }
    }

    chargerFavori()

    return () => {
      actif = false
    }
  }, [id])

  async function basculerFavori() {
    if (!id) return

    if (!utilisateur) {
      navigate('/connexion', {
        state: { retour: `/produit/${id}` },
      })
      return
    }

    setChargementFavori(true)

    try {
      if (favori) {
        await supprimerFavori(id, utilisateur.id)
        setFavori(false)
      } else {
        await ajouterFavori(id, utilisateur.id)
        setFavori(true)
      }
    } catch (err) {
      console.error('Erreur modification favori:', err)
    } finally {
      setChargementFavori(false)
    }
  }

  if (chargement) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid animate-pulse gap-8 lg:grid-cols-2">
          <div className="aspect-square rounded-3xl bg-slate-200" />

          <div className="space-y-5 py-4">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-10 w-3/4 rounded bg-slate-200" />
            <div className="h-8 w-40 rounded bg-slate-200" />
            <div className="h-24 rounded bg-slate-200" />
            <div className="h-12 rounded bg-slate-200" />
          </div>
        </div>
      </main>
    )
  }

  if (!produit) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
          Produit introuvable
        </p>

        <h1 className="mt-2 text-2xl font-black text-[#0B1E3D]">
          Ce produit n'existe plus
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Le produit demandé n'est pas disponible actuellement.
        </p>

        <Link
          to="/catalogue"
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#0284C7] px-5 text-sm font-bold text-white"
        >
          Retour au catalogue
        </Link>
      </main>
    )
  }

  const enStock = produit.stock > 0
  const surCommande =
    produit.stock <= 0 && produit.disponibilite === 'sur_commande'
  const rupture =
    produit.stock <= 0 && produit.disponibilite !== 'sur_commande'

  const produitPanier: CartProduct = {
    id: produit.id,
    nom: produit.nom,
    prix: produit.prix,
    image_url: produit.image_url || null,
    stock: produit.stock,
    surCommande,
  }

  function ajouterAuPanier() {
    for (let i = 0; i < quantite; i += 1) {
      ajouter(produitPanier)
    }
  }

  function acheterMaintenant() {
    ajouterAuPanier()
    navigate('/panier')
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        to="/catalogue"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#0B1E3D]"
      >
        <ArrowLeft size={17} />
        Retour au catalogue
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
          <div className="aspect-square bg-slate-100">
            {produit.image_url ? (
              <img
                src={produit.image_url}
                alt={produit.nom}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Image indisponible
              </div>
            )}
          </div>

          {produit.nouveau && (
            <span className="absolute left-4 top-4 rounded-full bg-[#0284C7] px-3 py-1.5 text-xs font-bold text-white">
              Nouveau
            </span>
          )}

          {produit.promo > 0 && (
            <span className="absolute right-4 top-4 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-bold text-white">
              -{produit.promo}%
            </span>
          )}
        </div>

        <section className="flex flex-col">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
            {produit.categorie || 'Produit'}
            {produit.sous_categorie
              ? ` · ${produit.sous_categorie}`
              : ''}
          </p>

          <div className="mt-2 flex items-start gap-3">
            <h1 className="min-w-0 flex-1 text-2xl font-black tracking-tight text-[#0B1E3D] sm:text-4xl">
              {produit.nom}
            </h1>

            <button
              type="button"
              onClick={basculerFavori}
              disabled={chargementFavori}
              aria-label={
                favori
                  ? 'Retirer des favoris'
                  : 'Ajouter aux favoris'
              }
              aria-pressed={favori}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition active:scale-95 ${
                favori
                  ? 'border-orange-200 bg-orange-50 text-orange-600'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-orange-200 hover:text-orange-600'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Heart
                size={21}
                fill={favori ? 'currentColor' : 'none'}
              />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <span className="text-2xl font-black text-[#0B1E3D]">
              {formatPrix(produit.prix)}
            </span>

            {produit.prixOriginal &&
              produit.prixOriginal > produit.prix && (
                <span className="pb-1 text-sm text-slate-400 line-through">
                  {formatPrix(produit.prixOriginal)}
                </span>
              )}

          {produit.promo > 0 && tempsPromo > 0 && (
            <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-orange-600">
                🔥 Promotion en cours
              </p>

              {(() => {
                const { jours, heures, minutes, secondes } =
                  formaterDecompte(tempsPromo)

                return (
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-xl bg-white p-2">
                      <strong className="block text-lg font-black text-[#0B1E3D]">
                        {jours}
                      </strong>
                      <span className="text-[9px] font-bold uppercase text-slate-400">
                        Jours
                      </span>
                    </div>

                    <div className="rounded-xl bg-white p-2">
                      <strong className="block text-lg font-black text-[#0B1E3D]">
                        {String(heures).padStart(2, '0')}
                      </strong>
                      <span className="text-[9px] font-bold uppercase text-slate-400">
                        Heures
                      </span>
                    </div>

                    <div className="rounded-xl bg-white p-2">
                      <strong className="block text-lg font-black text-[#0B1E3D]">
                        {String(minutes).padStart(2, '0')}
                      </strong>
                      <span className="text-[9px] font-bold uppercase text-slate-400">
                        Minutes
                      </span>
                    </div>

                    <div className="rounded-xl bg-white p-2">
                      <strong className="block text-lg font-black text-[#0B1E3D]">
                        {String(secondes).padStart(2, '0')}
                      </strong>
                      <span className="text-[9px] font-bold uppercase text-slate-400">
                        Secondes
                      </span>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
          </div>

          {produit.description && (
            <div className="mt-7">
              <h2 className="text-sm font-black text-[#0B1E3D]">
                Description
              </h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                {produit.description}
              </p>
            </div>
          )}

          {!rupture && (
            <div className="mt-8">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                Quantité
              </p>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() =>
                    setQuantite((valeur) => Math.max(1, valeur - 1))
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-l-xl border border-slate-200 bg-white"
                  aria-label="Diminuer la quantité"
                >
                  <Minus size={16} />
                </button>

                <span className="flex h-11 w-14 items-center justify-center border-y border-slate-200 bg-white text-sm font-bold">
                  {quantite}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantite((valeur) =>
                      surCommande
                        ? valeur + 1
                        : Math.min(produit.stock, valeur + 1),
                    )
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-r-xl border border-slate-200 bg-white"
                  aria-label="Augmenter la quantité"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={rupture}
              onClick={ajouterAuPanier}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#0B1E3D] px-5 text-sm font-bold text-[#0B1E3D] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            >
              <ShoppingCart size={18} />
              Ajouter au panier
            </button>

            <button
              type="button"
              disabled={rupture}
              onClick={acheterMaintenant}
              className="min-h-12 rounded-xl bg-[#0284C7] px-5 text-sm font-bold text-white transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              Commander maintenant
            </button>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="font-bold text-[#0B1E3D]">Paiement sécurisé</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Commande enregistrée de façon sécurisée.
                </p>
              </div>

              <div>
                <p className="font-bold text-[#0B1E3D]">Livraison au Bénin</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Livraison ou retrait selon votre choix.
                </p>
              </div>

              <div>
                <p className="font-bold text-[#0B1E3D]">Suivi commande</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Un code de suivi est fourni après commande.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
