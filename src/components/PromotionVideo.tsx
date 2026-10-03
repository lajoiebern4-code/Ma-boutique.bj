import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Clock3, Sparkles, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { obtenirProduits, type Produit } from '../services/produits'

const DUREE_PUBLICITE = 7000

function promotionActive(produit: Produit, maintenant: number) {
  if (produit.promo <= 0 || !produit.promo_fin) return false

  const debut = produit.promo_debut
    ? new Date(produit.promo_debut).getTime()
    : null
  const fin = new Date(produit.promo_fin).getTime()

  if (!Number.isFinite(fin) || fin <= maintenant) return false
  if (debut !== null && Number.isFinite(debut) && debut > maintenant) {
    return false
  }

  return produit.stock > 0 || produit.disponibilite === 'sur_commande'
}

function tempsRestant(ms: number) {
  const secondes = Math.max(0, Math.floor(ms / 1000))
  const jours = Math.floor(secondes / 86400)
  const heures = Math.floor((secondes % 86400) / 3600)
  const minutes = Math.floor((secondes % 3600) / 60)
  const sec = secondes % 60

  return `${String(jours).padStart(2, '0')}J ${String(heures).padStart(2, '0')}H ${String(minutes).padStart(2, '0')}M ${String(sec).padStart(2, '0')}S`
}

function prix(prix: number) {
  return new Intl.NumberFormat('fr-FR').format(prix)
}

export default function PromotionVideo() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [maintenant, setMaintenant] = useState(Date.now())
  const [index, setIndex] = useState(0)
  const [sortie, setSortie] = useState(false)

  useEffect(() => {
    let actif = true

    obtenirProduits()
      .then((data) => {
        if (actif) setProduits(data)
      })
      .catch((err) => {
        console.error('Erreur promotions publicité:', err)
      })

    return () => {
      actif = false
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMaintenant(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  const promotions = useMemo(
    () =>
      produits.filter((produit) =>
        promotionActive(produit, maintenant),
      ),
    [produits, maintenant],
  )

  useEffect(() => {
    if (promotions.length === 0) {
      setIndex(0)
      return
    }

    if (index >= promotions.length) {
      setIndex(0)
    }
  }, [promotions.length, index])

  useEffect(() => {
    if (promotions.length <= 1) return

    const sortieTimer = window.setTimeout(() => {
      setSortie(true)

      window.setTimeout(() => {
        setIndex((ancien) => (ancien + 1) % promotions.length)
        setSortie(false)
      }, 450)
    }, DUREE_PUBLICITE)

    return () => window.clearTimeout(sortieTimer)
  }, [index, promotions.length])

  const produit = promotions[index]

  if (!produit) {
    return (
      <section className="bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[300px] max-w-7xl items-center justify-center rounded-[26px] border border-[#E8E3EF] bg-[#FAF9FC] px-6 text-center shadow-[0_8px_30px_rgba(24,21,31,0.06)]">
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#7654C6] shadow-sm">
              <Tag size={22} />
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#7654C6]">
              ChinaShop-Bénin
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#18151F] sm:text-3xl">
              Aucune promotion active
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6F687A]">
              Revenez bientôt découvrir nos prochaines offres promotionnelles.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const fin = new Date(produit.promo_fin as string).getTime()
  const reste = Math.max(0, fin - maintenant)
  const ancienPrix = produit.prixOriginal ?? produit.prix
  const reduction = Math.max(0, Math.round(Number(produit.promo)))

  return (
    <section className="bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div
          className={`relative min-h-[520px] overflow-hidden rounded-[28px] border border-[#E8E3EF] bg-[#FAF9FC] shadow-[0_12px_40px_rgba(24,21,31,0.08)] transition-all duration-[450ms] ease-out sm:min-h-[400px] ${
            sortie
              ? '-translate-x-[8%] scale-[0.98] opacity-0'
              : 'translate-x-0 scale-100 opacity-100'
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(118,84,198,0.14),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(255,138,61,0.12),transparent_30%)]" />

          <div className="relative grid min-h-[360px] items-center gap-5 px-5 py-6 sm:min-h-[400px] sm:px-7 lg:grid-cols-[1fr_1fr] lg:px-10">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E3EF] bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#7654C6] shadow-sm">
                <Sparkles size={14} />
                Offre du moment
              </div>

              <p className="mt-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#FF6B35]">
                Promotion limitée
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#18151F] sm:text-4xl">
                {produit.nom}
              </h2>

              {produit.description?.trim() && (
                <p className="mt-2 line-clamp-2 max-w-xl text-xs leading-5 text-[#6F687A] sm:text-sm">
                  {produit.description.trim()}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-end gap-2">
                <span className="text-sm font-bold text-[#8A8393] line-through">
                  {prix(ancienPrix)} FCFA
                </span>

                <span className="text-2xl font-black text-[#D92D20] sm:text-3xl">
                  {prix(produit.prix)} FCFA
                </span>

                <span className="rounded-full bg-[#D92D20] px-3 py-1 text-xs font-black text-white">
                  -{reduction}%
                </span>
              </div>

              <div className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-[#E8E3EF] bg-white px-4 py-3 shadow-sm">
                <Clock3 size={19} className="text-[#7654C6]" />

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8A8393]">
                    Fin de l'offre dans
                  </p>

                  <p className="mt-0.5 font-mono text-lg font-black text-[#18151F]">
                    {tempsRestant(reste)}
                  </p>
                </div>
              </div>

              <Link
                to={`/produit/${produit.id}`}
                className="mt-4 inline-flex items-center gap-2 rounded-[14px] bg-[#D92D20] px-6 py-3.5 text-sm font-black text-white shadow-[0_6px_18px_rgba(217,45,32,0.18)] transition hover:-translate-y-0.5 hover:bg-[#B9231A]"
              >
                Découvrir l'offre
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="order-1 flex justify-center lg:order-2">
              <div className="relative w-full max-w-[380px] rounded-[24px] bg-white p-3 shadow-[0_18px_50px_rgba(24,21,31,0.12)]">
                <div className="absolute left-5 top-5 z-10 flex items-center gap-1.5 rounded-full bg-[#D92D20] px-3 py-1.5 text-xs font-black text-white shadow-lg">
                  <Tag size={13} />
                  PROMO
                </div>

                <div className="aspect-[5/4] overflow-hidden rounded-[18px] bg-[#F2EFF6]">
                  {produit.image_url ? (
                    <img
                      src={produit.image_url}
                      alt={produit.nom}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-semibold text-[#8A8393]">
                      Image indisponible
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {promotions.length > 1 && (
            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/85 px-3 py-2 shadow-sm backdrop-blur">
              {promotions.map((item, i) => (
                <span
                  key={item.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index
                      ? 'w-6 bg-[#7654C6]'
                      : 'w-1.5 bg-[#D8D2E0]'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
