import { Link } from 'react-router-dom'
import { ArrowUpRight, MessageCircle } from 'lucide-react'

const boutiqueLinks = [
  { label: 'Accueil', to: '/' },
  { label: 'Catalogue', to: '/catalogue' },
  { label: 'Nouveautés', to: '/nouveautes' },
  { label: 'Promotions', to: '/promotions' },
]

const infoLinks = [
  { label: 'Infos pratiques', to: '/infos' },
  { label: 'Livraison', to: '/infos' },
  { label: 'Paiement', to: '/infos' },
  { label: 'Suivi de commande', to: '/suivi' },
]

export default function Footer() {
  return (
    <footer className="border-t border-[#FAF9F6] bg-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-12">

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">

          <div>
            <Link
              to="/"
              aria-label="AndyShop Bénin - Accueil"
              className="inline-flex items-baseline"
            >
              <span className="text-xl font-black tracking-[-0.04em] text-[#1A1A2E]">
                AndyShop
              </span>
              <span className="text-xl font-black tracking-[-0.04em] text-[#0F1B3D]">
                -Benin
              </span>
            </Link>

            <p className="mt-3 max-w-sm text-sm leading-6 text-[#6B7280]">
              Des produits soigneusement sélectionnés en Chine et proposés aux clients au
              Bénin, avec un parcours de commande simple et un suivi transparent.
            </p>
          </div>

          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1A1A2E]">
              Boutique
            </h2>

            <nav
              className="mt-4 flex flex-col gap-2.5"
              aria-label="Boutique"
            >
              {boutiqueLinks.map((link) => (
                <Link
                  key={link.to + link.label}
                  to={link.to}
                  className="text-sm text-[#6B7280] transition-colors hover:text-[#0F1B3D]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1A1A2E]">
              Informations
            </h2>

            <nav
              className="mt-4 flex flex-col gap-2.5"
              aria-label="Informations"
            >
              {infoLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-sm text-[#6B7280] transition-colors hover:text-[#0F1B3D]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1A1A2E]">
              Une question ?
            </h2>

            <p className="mt-4 max-w-xs text-sm leading-6 text-[#6B7280]">
              Besoin d'une information sur un produit ou votre commande ?
            </p>

            <Link
              to="/infos"
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#0F1B3D] !text-white px-4 text-xs font-black text-white transition hover:bg-[#C9A24B] hover:text-[#0F1B3D]"
            >
              <MessageCircle size={16} />
              Nous contacter
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-2 border-t border-[#FAF9F6] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] leading-5 text-[#9A93A5]">
            © {new Date().getFullYear()} AndyShop Bénin. Tous droits réservés.
          </p>

          <p className="text-[11px] leading-5 text-[#9A93A5]">
            Importation · Suivi · Livraison au Bénin
          </p>
        </div>

      </div>
    </footer>
  )
}
