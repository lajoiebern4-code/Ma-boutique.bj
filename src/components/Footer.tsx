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
    <footer className="border-t border-[#E8E3EF] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">

          <div>
            <Link
              to="/"
              aria-label="ChinaShop Bénin - Accueil"
              className="inline-flex items-baseline"
            >
              <span className="text-xl font-black tracking-[-0.04em] text-[#18151F]">
                ChinaShop
              </span>
              <span className="text-xl font-black tracking-[-0.04em] text-[#7654C6]">
                -Benin
              </span>
            </Link>

            <p className="mt-3 max-w-sm text-sm leading-6 text-[#6F687A]">
              Des produits soigneusement sélectionnés en Chine et proposés aux clients au
              Bénin, avec un parcours de commande simple et un suivi transparent.
            </p>
          </div>

          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.16em] text-[#18151F]">
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
                  className="text-sm text-[#6F687A] transition-colors hover:text-[#7654C6]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.16em] text-[#18151F]">
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
                  className="text-sm text-[#6F687A] transition-colors hover:text-[#7654C6]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.16em] text-[#18151F]">
              Une question ?
            </h2>

            <p className="mt-4 max-w-xs text-sm leading-6 text-[#6F687A]">
              Besoin d'une information sur un produit ou votre commande ?
            </p>

            <Link
              to="/infos"
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#7654C6] px-4 text-xs font-black text-white transition hover:bg-[#6544B3]"
            >
              <MessageCircle size={16} />
              Nous contacter
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-2 border-t border-[#E8E3EF] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] leading-5 text-[#9A93A5]">
            © {new Date().getFullYear()} ChinaShop Bénin. Tous droits réservés.
          </p>

          <p className="text-[11px] leading-5 text-[#9A93A5]">
            Importation · Suivi · Livraison au Bénin
          </p>
        </div>

      </div>
    </footer>
  )
}
