import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ChevronRight, Flame, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { obtenirProduits, type Produit } from '../services/produits'

const DUREE = 5000

function promotionActive(produit: Produit, maintenant: number) {
  if (produit.promo <= 0 || !produit.promo_fin) return false
  const debut = produit.promo_debut ? new Date(produit.promo_debut).getTime() : null
  const fin = new Date(produit.promo_fin).getTime()
  if (!Number.isFinite(fin) || fin <= maintenant) return false
  if (debut !== null && Number.isFinite(debut) && debut > maintenant) return false
  return produit.stock > 0 || produit.disponibilite === 'sur_commande'
}

function tempsRestant(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return {
    j: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  }
}

function prix(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n))
}

export default function PromotionVideo() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [maintenant, setMaintenant] = useState(Date.now())
  const [index, setIndex] = useState(0)
  const [transition, setTransition] = useState(false)

  useEffect(() => {
    let actif = true
    obtenirProduits()
      .then((data) => { if (actif) setProduits(data) })
      .catch((err) => { console.error('Erreur promotions:', err) })
    return () => { actif = false }
  }, [])

  useEffect(() => {
    const t = window.setInterval(() => setMaintenant(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const promotions = useMemo(
    () => produits.filter((p) => promotionActive(p, maintenant)),
    [produits, maintenant],
  )

  useEffect(() => {
    if (promotions.length <= 1) return
    const t = window.setTimeout(() => {
      setTransition(true)
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % promotions.length)
        setTransition(false)
      }, 400)
    }, DUREE)
    return () => window.clearTimeout(t)
  }, [index, promotions.length])

  if (promotions.length === 0) return null

  const produit = promotions[index]
  if (!produit) return null

  const fin = new Date(produit.promo_fin as string).getTime()
  const tr = tempsRestant(Math.max(0, fin - maintenant))
  const ancienPrix = produit.prixOriginal ?? produit.prix
  const reduction = Math.max(0, Math.round(Number(produit.promo)))

  return (
    <section className="bg-[#F5F5F7] px-3 py-5 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          {/* Header Vente Flash */}
          <div className="flex items-center justify-between border-b border-[#F0F0F2] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF3B4E] to-[#D92D20] text-white shadow-sm">
                <Zap size={15} fill="currentColor" />
              </span>
              <h3 className="text-[16px] font-black tracking-tight text-[#18151F]">Vente Flash</h3>
              <span className="hidden items-center gap-1 rounded-full bg-[#FFF1F2] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#D92D20] sm:inline-flex">
                <Flame size={10} fill="currentColor" />
                Limité
              </span>
            </div>
            <Link
              to="/promotions"
              className="inline-flex items-center gap-0.5 text-[12px] font-bold text-[#7654C6] transition-colors hover:text-[#6544B3]"
            >
              Tout voir
              <ChevronRight size={14} />
            </Link>
          </div>


          {/* Carte produit — défilement */}
          <div
            className={`transition-all duration-400 ease-out ${
              transition ? 'translate-x-6 opacity-0' : 'translate-x-0 opacity-100'
            }`}
          >
            <Link
              to={`/produit/${produit.id}`}
              className="group grid gap-4 p-4 sm:gap-6 sm:p-5 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-center lg:gap-8 lg:p-6"
            >
              {/* Image */}
              <div className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-2xl bg-[#FAFAFB]">
                <div className="aspect-square">
                  {produit.image_url ? (
                    <img
                      key={`img-${index}`}
                      src={produit.image_url}
                      alt={produit.nom}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[12px] font-semibold text-[#9A93A5]">
                      Image indisponible
                    </div>
                  )}
                </div>

                <div className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-[#D92D20] px-2 py-1 text-[11px] font-black text-white shadow-md">
                  <Zap size={11} fill="currentColor" />
                  -{reduction}%
                </div>

              </div>

              {/* Infos */}
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D92D20]">
                  Promotion limitée
                </p>

                <h2 className="mt-2 line-clamp-2 text-[18px] font-black leading-tight tracking-tight text-[#18151F] sm:text-[22px] lg:text-[26px]">
                  {produit.nom}
                </h2>

                {produit.description?.trim() && (
                  <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-[#6F687A] sm:text-sm">
                    {produit.description.trim()}
                  </p>
                )}

                {/* Prix */}
                <div className="mt-4 flex flex-wrap items-baseline gap-2">
                  <span className="text-[24px] font-black leading-none text-[#D92D20] sm:text-[28px] lg:text-[32px]">
                    {prix(produit.prix)}
                  </span>
                  <span className="text-[12px] font-black text-[#D92D20]">FCFA</span>
                  <span className="text-[13px] font-semibold text-[#9A93A5] line-through">
                    {prix(ancienPrix)}
                  </span>
                </div>

                {/* Compteur */}
                <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg border border-[#F0F0F2] bg-[#FFF8F8] px-3 py-2">
                  <span className="text-[11px] font-bold text-[#6F687A]">Fin dans</span>
                  <div className="flex items-center gap-1">
                    {[
                      { v: tr.j, l: 'J' },
                      { v: tr.h, l: 'H' },
                      { v: tr.m, l: 'M' },
                      { v: tr.s, l: 'S' },
                    ].map((u, i) => (
                      <span key={i} className="inline-flex items-baseline gap-0.5">
                        <span className="inline-flex min-w-[24px] items-center justify-center rounded-md bg-[#18151F] px-1.5 py-1 font-mono text-[12px] font-black tabular-nums text-white">
                          {String(u.v).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] font-black text-[#6F687A]">{u.l}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#FF8A3D] to-[#FF6B35] px-5 py-3 text-[13px] font-black text-white shadow-md shadow-[#FF8A3D]/25 transition-transform group-hover:-translate-y-0.5">
                    Profiter de l'offre
                    <ArrowRight size={15} />
                  </span>
                </div>
              </div>
            </Link>
          </div>


        </div>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  )
}
