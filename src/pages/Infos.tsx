import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Box,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  FileText,
  HelpCircle,
  Info,
  MapPin,
  PackageCheck,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserCheck,
  WalletCards,
} from 'lucide-react'

const fonctionnement = [
  {
    numero: '01',
    icon: Search,
    titre: 'Je découvre',
    texte:
      'Parcourez le catalogue ChinaShop-Bénin et consultez les informations disponibles sur chaque produit : prix, disponibilité et caractéristiques.',
  },
  {
    numero: '02',
    icon: ShoppingBag,
    titre: 'Je sélectionne',
    texte:
      'Ajoutez les articles souhaités au panier. Lorsque plusieurs articles sont commandés, une réduction de 1,5 % peut s’appliquer à partir de 3 articles.',
  },
  {
    numero: '03',
    icon: FileText,
    titre: 'Je renseigne mes coordonnées',
    texte:
      'Indiquez vos coordonnées puis choisissez votre mode de réception : retrait ou livraison lorsque celle-ci est disponible.',
  },
  {
    numero: '04',
    icon: CreditCard,
    titre: 'Je choisis le paiement',
    texte:
      'Le paiement dépend du mode de réception et des conditions de la commande. La livraison nécessite un paiement en ligne.',
  },
  {
    numero: '05',
    icon: PackageCheck,
    titre: 'La commande est traitée',
    texte:
      'Après validation, votre commande reçoit un numéro unique et un code permettant d’identifier et de suivre son traitement.',
  },
  {
    numero: '06',
    icon: Truck,
    titre: 'Je reçois ou je retire',
    texte:
      'La commande suit son parcours jusqu’à la livraison ou jusqu’au retrait selon l’option choisie.',
  },
]

const services = [
  {
    icon: ShieldCheck,
    titre: 'Commande sécurisée',
    texte:
      'Les informations essentielles de votre commande sont enregistrées afin de faciliter son traitement et son suivi.',
  },
  {
    icon: MapPin,
    titre: 'Livraison selon la zone',
    texte:
      'Les frais de livraison sont déterminés selon la zone sélectionnée au moment de la commande.',
  },
  {
    icon: Box,
    titre: 'Stock ou sur commande',
    texte:
      'Un produit peut être disponible immédiatement ou nécessiter un approvisionnement avant son traitement.',
  },
  {
    icon: Clock3,
    titre: 'Suivi étape par étape',
    texte:
      'Votre commande évolue selon les étapes de traitement prévues par ChinaShop-Bénin.',
  },
]

const faq = [
  {
    q: 'Qu’est-ce que ChinaShop-Bénin ?',
    a:
      'ChinaShop-Bénin est une boutique en ligne destinée à proposer différents produits aux clients au Bénin. Certains articles sont disponibles immédiatement tandis que d’autres sont proposés sur commande.',
  },
  {
    q: 'Quelle est la différence entre un article en stock et un article sur commande ?',
    a:
      'Un article en stock peut être préparé directement selon sa disponibilité. Un article sur commande nécessite un approvisionnement avant de pouvoir être traité comme une commande disponible.',
  },
  {
    q: 'Comment fonctionne la réduction de 1,5 % ?',
    a:
      'Une réduction de 1,5 % est appliquée lorsque la commande atteint au moins 3 articles, selon les règles commerciales configurées sur ChinaShop-Bénin.',
  },
  {
    q: 'La livraison est-elle gratuite ?',
    a:
      'Non. Lorsque la livraison est choisie, des frais sont appliqués selon la zone de livraison sélectionnée. Le montant est affiché avant la validation de la commande.',
  },
  {
    q: 'Le retrait est-il payant ?',
    a:
      'Le retrait est prévu comme une option sans frais de livraison. Les éventuelles autres conditions de la commande restent applicables.',
  },
  {
    q: 'Puis-je payer en espèces pour une livraison ?',
    a:
      'Non. Dans le parcours actuel, une commande en livraison nécessite un paiement Mobile Money / en ligne.',
  },
  {
    q: 'Pourquoi un acompte peut-il être demandé ?',
    a:
      'Certains articles sur commande peuvent nécessiter un acompte. Lorsque le système indique un acompte requis, son montant est affiché dans le parcours de commande.',
  },
  {
    q: 'Comment suivre ma commande ?',
    a:
      'Après la création de la commande, un numéro de commande et un code de suivi ou de retrait sont communiqués. Utilisez ensuite la rubrique « Suivre ma commande ».',
  },
  {
    q: 'Qu’est-ce que le code CS-XXXXXX ?',
    a:
      'Le format CS-XXXXXX correspond au code de suivi utilisé pour identifier une commande en livraison.',
  },
  {
    q: 'Qu’est-ce que le code CR-XXXXXX ?',
    a:
      'Le format CR-XXXXXX correspond au code associé au retrait d’une commande.',
  },
  {
    q: 'Que dois-je faire si je me trompe dans mon adresse ?',
    a:
      'Vérifiez attentivement vos informations avant de valider. Une adresse complète et précise facilite le traitement d’une commande en livraison.',
  },
  {
    q: 'Puis-je commander plusieurs catégories de produits ?',
    a:
      'Oui, le catalogue peut proposer différentes catégories de produits. Les conditions de disponibilité peuvent toutefois varier selon chaque article.',
  },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FF7A1A]">
      {children}
    </p>
  )
}

function InfoCard({
  icon: Icon,
  titre,
  texte,
}: {
  icon: typeof ShieldCheck
  titre: string
  texte: string
}) {
  return (
    <article className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF7F0] text-[#FF7A1A] transition group-hover:scale-105">
        <Icon size={22} />
      </div>

      <h3 className="mt-5 text-base font-black text-[#081A33]">
        {titre}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {texte}
      </p>
    </article>
  )
}

export default function Infos() {
  const [faqOuverte, setFaqOuverte] = useState<number | null>(null)

  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F9FC] text-[#081A33]">

      {/* HERO DOCUMENTAIRE */}
      <section className="relative overflow-hidden bg-[#071A35]">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#0052CC]/25 blur-3xl" />
          <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#FF7A1A]/15 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />

          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">

              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/75 shadow-lg shadow-black/10 backdrop-blur">
                  <BadgeCheck size={15} className="text-[#FF7A1A]" />
                  Guide officiel ChinaShop-Bénin
                </div>

                <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
                  Tout comprendre
                  <span className="block text-[#FF7A1A]">
                    avant de commander.
                  </span>
                </h1>

                <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Retrouvez ici les informations essentielles sur les produits,
                  la commande, le paiement, la livraison, le retrait, l’acompte
                  et le suivi de votre commande.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/catalogue"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#FF7A1A] px-6 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#F06D0A] hover:shadow-xl"
                  >
                    Découvrir les produits
                    <ArrowRight size={17} />
                  </Link>

                  <Link
                    to="/suivi"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-6 text-sm font-black text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/15"
                  >
                    <Truck size={17} />
                    Suivre une commande
                  </Link>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  <span>Commande</span>
                  <span className="h-1 w-1 rounded-full bg-[#FF7A1A]" />
                  <span>Paiement</span>
                  <span className="h-1 w-1 rounded-full bg-[#0052CC]" />
                  <span>Livraison & retrait</span>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
                <div className="absolute -inset-4 rounded-[2.5rem] bg-white/[0.03] blur-xl" />

                <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.07] p-3 shadow-2xl shadow-black/30 backdrop-blur">
                  <div className="rounded-[1.5rem] bg-[#F7F9FC] p-5 sm:p-6">

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Parcours client
                        </p>
                        <p className="mt-1 text-xl font-black tracking-tight text-[#081A33]">
                          De l’achat au retrait
                        </p>
                      </div>

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFE8D6] text-[#FF7A1A]">
                        <ShoppingBag size={21} />
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {([
                        ['01', 'Produit sélectionné', Search],
                        ['02', 'Commande enregistrée', FileText],
                        ['03', 'Préparation', Box],
                        ['04', 'Acheminement', Truck],
                        ['05', 'Réception', Check],
                      ] as const).map(([n, label, Icon]) => {
                        const StepIcon = Icon as typeof Check

                        return (
                          <div
                            key={String(n)}
                            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#081A33] text-xs font-black text-white">
                              {n}
                            </span>

                            <span className="flex-1 text-sm font-bold text-[#081A33]">
                              {label}
                            </span>

                            <StepIcon
                              size={17}
                              className="text-[#FF7A1A]"
                            />
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#081A33] px-4 py-3">
                      <ShieldCheck
                        size={19}
                        className="shrink-0 text-emerald-300"
                      />
                      <p className="text-xs font-bold leading-5 text-white">
                        Les informations importantes sont affichées avant la validation.
                      </p>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

      {/* BARRE DOCUMENT */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-4 sm:grid-cols-3 sm:px-6">
          {[
            ['Commande', 'Informations claires'],
            ['Paiement', 'Conditions affichées'],
            ['Suivi', 'Code de commande'],
          ].map(([titre, texte]) => (
            <div
              key={titre}
              className="flex items-center gap-3 rounded-2xl bg-[#F7F9FC] px-4 py-3"
            >
              <Check size={18} className="text-emerald-600" />
              <div>
                <p className="text-xs font-black text-[#081A33]">{titre}</p>
                <p className="text-xs text-slate-500">{texte}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <SectionLabel>Document d’information</SectionLabel>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Une boutique pensée autour d’un parcours simple.
            </h2>
          </div>

          <div className="space-y-4 text-sm leading-7 text-slate-600">
            <p>
              ChinaShop-Bénin permet de commander différents types de produits
              depuis une interface unique. L’objectif est de rendre visibles
              les informations importantes avant la validation.
            </p>

            <p>
              Le client peut rencontrer deux situations : un produit déjà
              disponible ou un produit proposé sur commande. Ces deux cas ne
              doivent pas être confondus, car le délai de traitement peut être
              différent.
            </p>

            <div className="rounded-3xl border border-[#FF7A1A]/15 bg-[#FFF7F0] p-5 text-[#081A33]">
              <div className="flex gap-3">
                <Info className="mt-0.5 shrink-0 text-[#FF7A1A]" size={20} />
                <p className="text-sm leading-6">
                  <strong>Point important :</strong> vérifiez toujours le
                  produit, la quantité, le mode de réception, la zone de
                  livraison et le montant total avant de confirmer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <SectionLabel>Les fondamentaux</SectionLabel>

          <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
            Ce que vous devez savoir sur le service.
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((item) => (
              <InfoCard
                key={item.titre}
                icon={item.icon}
                titre={item.titre}
                texte={item.texte}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FONCTIONNEMENT */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-3xl">
          <SectionLabel>Le parcours complet</SectionLabel>

          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Comment fonctionne une commande ?
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-500">
            Voici le parcours logique d’une commande, de la sélection du
            produit jusqu’à sa réception.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fonctionnement.map((item) => {
            const Icon = item.icon

            return (
              <article
                key={item.numero}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#081A33] text-white">
                    <Icon size={21} />
                  </div>

                  <span className="text-4xl font-black text-slate-100">
                    {item.numero}
                  </span>
                </div>

                <h3 className="mt-6 text-lg font-black">
                  {item.titre}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.texte}
                </p>
              </article>
            )
          })}
        </div>
      </section>

      {/* STOCK / COMMANDE */}
      <section className="bg-[#081A33]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-2">

            <article className="rounded-[2rem] border border-white/10 bg-white/5 p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <PackageCheck size={23} />
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-widest text-emerald-300">
                Disponibilité immédiate
              </p>

              <h3 className="mt-2 text-2xl font-black text-white">
                Article en stock
              </h3>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                Lorsqu’un produit est disponible en stock, il peut être traité
                directement selon les conditions de préparation et de
                réception applicables.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  'Produit identifié comme disponible',
                  'Commande enregistrée',
                  'Préparation',
                  'Livraison ou retrait',
                ].map((x) => (
                  <div key={x} className="flex items-center gap-3 text-sm text-white">
                    <Check size={17} className="text-emerald-300" />
                    {x}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-[#FF7A1A]/20 bg-[#FF7A1A]/10 p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF7A1A]/10 text-[#FF8A3D]">
                <Clock3 size={23} />
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-widest text-[#FF8A3D]">
                Approvisionnement
              </p>

              <h3 className="mt-2 text-2xl font-black text-white">
                Article sur commande
              </h3>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                Un article sur commande nécessite un approvisionnement avant
                son traitement. Son délai peut donc être différent d’un
                produit déjà disponible.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-sm font-bold text-white">
                  Acompte possible
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Lorsqu’un acompte est requis, son montant apparaît dans le
                  parcours de commande avant ou après l’enregistrement selon
                  les règles applicables.
                </p>
              </div>
            </article>

          </div>
        </div>
      </section>

      {/* LIVRAISON / RETRAIT */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="text-center">
          <SectionLabel>Réception</SectionLabel>

          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Livraison ou retrait ?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">
            Le choix du mode de réception modifie les conditions de votre
            commande. Faites votre choix en fonction de votre situation.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">

          <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0052CC]">
                <Truck size={26} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#0052CC]">
                  Option 01
                </p>
                <h3 className="text-xl font-black">Livraison</h3>
              </div>
            </div>

            <p className="mt-6 text-sm leading-7 text-slate-500">
              Votre commande est acheminée vers l’adresse indiquée. Vous devez
              sélectionner une zone de livraison et fournir une adresse
              suffisamment précise.
            </p>

            <div className="mt-6 space-y-3">
              {[
                'Sélection d’une zone',
                'Adresse de livraison obligatoire',
                'Frais selon la zone',
                'Paiement en ligne requis',
              ].map((x) => (
                <div key={x} className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] p-3 text-sm font-bold">
                  <Check size={16} className="text-emerald-600" />
                  {x}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-[#FF7A1A]/15 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF7F0] text-[#FF7A1A]">
                <MapPin size={26} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#FF7A1A]">
                  Option 02
                </p>
                <h3 className="text-xl font-black">Retrait</h3>
              </div>
            </div>

            <p className="mt-6 text-sm leading-7 text-slate-500">
              Vous choisissez de récupérer votre commande au point de retrait
              prévu. Cette option ne nécessite pas de frais de livraison.
            </p>

            <div className="mt-6 space-y-3">
              {[
                'Retrait gratuit',
                'Pas d’adresse de livraison nécessaire',
                'Paiement en espèces possible',
                'Code de retrait à conserver',
              ].map((x) => (
                <div key={x} className="flex items-center gap-3 rounded-xl bg-[#FFF7F0] p-3 text-sm font-bold">
                  <Check size={16} className="text-[#FF7A1A]" />
                  {x}
                </div>
              ))}
            </div>
          </article>

        </div>
      </section>

      {/* PAIEMENT */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <SectionLabel>Paiement</SectionLabel>

              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Comprendre les modes de paiement.
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-500">
                Le mode de paiement disponible dépend du mode de réception
                choisi.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard
                icon={WalletCards}
                titre="Paiement Mobile Money"
                texte="Utilisé pour les commandes nécessitant un paiement en ligne, notamment la livraison."
              />

              <InfoCard
                icon={Banknote}
                titre="Paiement en espèces"
                texte="Disponible dans le parcours de retrait lorsque cette option est proposée."
              />

              <InfoCard
                icon={CreditCard}
                titre="Téléphone de paiement"
                texte="Lorsque le paiement Mobile Money est sélectionné, le numéro utilisé pour le paiement peut être demandé."
              />

              <InfoCard
                icon={ShieldCheck}
                titre="Avant de payer"
                texte="Vérifiez toujours le montant total, la quantité, la réception et les informations saisies."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ACOMPTE */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="rounded-[2rem] border border-[#FF7A1A]/30 bg-[#FFF7F0] p-7 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFE8D6] text-[#F06D0A]">
              <Banknote size={26} />
            </div>

            <div>
              <SectionLabel>Acompte</SectionLabel>

              <h2 className="mt-2 text-2xl font-black">
                Pourquoi un acompte peut apparaître ?
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#081A33]/75">
                Certains articles nécessitant un approvisionnement peuvent
                entraîner une demande d’acompte. Le montant requis est affiché
                dans le récapitulatif de la commande lorsque cette règle
                s’applique.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ['01', 'Montant affiché'],
                  ['02', 'Commande enregistrée'],
                  ['03', 'Acompte à régler'],
                ].map(([n, text]) => (
                  <div
                    key={n}
                    className="rounded-2xl bg-white/70 p-4"
                  >
                    <p className="text-xs font-black text-[#F06D0A]">{n}</p>
                    <p className="mt-1 text-sm font-black">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CODES */}
      <section className="bg-[#081A33]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="text-center">
            <SectionLabel>Identification</SectionLabel>

            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Gardez précieusement vos codes.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Ces informations permettent de retrouver plus facilement votre
              commande.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <article className="rounded-[2rem] border border-white/10 bg-white/5 p-7 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0052CC]/10 text-blue-100">
                <Truck size={25} />
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-widest text-blue-100">
                Livraison
              </p>

              <p className="mt-2 text-3xl font-black tracking-widest text-white">
                CS-XXXXXX
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Code de suivi associé à une commande en livraison.
              </p>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-white/5 p-7 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF7A1A]/10 text-[#FF8A3D]">
                <MapPin size={25} />
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-widest text-[#FF8A3D]">
                Retrait
              </p>

              <p className="mt-2 text-3xl font-black tracking-widest text-white">
                CR-XXXXXX
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Code associé au retrait de votre commande.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* BONNES PRATIQUES */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            {
              icon: UserCheck,
              titre: 'Avant de commander',
              texte:
                'Vérifiez le nom, le téléphone, les produits, les quantités et les conditions de disponibilité.',
            },
            {
              icon: FileText,
              titre: 'Avant de confirmer',
              texte:
                'Relisez le mode de réception, la zone, l’adresse et le montant total affiché.',
            },
            {
              icon: ShieldCheck,
              titre: 'Après la commande',
              texte:
                'Conservez le numéro de commande et le code communiqué. Ils sont utiles pour le suivi.',
            },
          ].map((item) => (
            <InfoCard
              key={item.titre}
              icon={item.icon}
              titre={item.titre}
              texte={item.texte}
            />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF7F0] text-[#FF7A1A]">
              <HelpCircle size={23} />
            </div>

            <SectionLabel>Questions fréquentes</SectionLabel>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Les réponses aux questions importantes.
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {faq.map((item, index) => {
              const ouvert = faqOuverte === index

              return (
                <div
                  key={item.q}
                  className={`overflow-hidden rounded-2xl border transition ${
                    ouvert
                      ? 'border-[#FF7A1A]/30 bg-[#FFF7F0]/50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setFaqOuverte(ouvert ? null : index)
                    }
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                    aria-expanded={ouvert}
                  >
                    <span className="text-sm font-black text-[#081A33]">
                      {item.q}
                    </span>

                    <ChevronDown
                      size={19}
                      className={`shrink-0 text-[#FF7A1A] transition ${
                        ouvert ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {ouvert && (
                    <div className="border-t border-[#FF7A1A]/15 px-5 pb-5 pt-4">
                      <p className="text-sm leading-7 text-slate-600">
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CONTACT / CTA */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#081A33] to-[#0052CC] px-6 py-12 text-center sm:px-10">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#FF7A1A]/20 blur-3xl" />

          <div className="relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-[#FF7A1A]">
              <ShoppingBag size={25} />
            </div>

            <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">
              Vous êtes prêt ?
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Consultez le catalogue, choisissez vos produits et suivez les
              étapes affichées jusqu’à la confirmation.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/catalogue"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#FF7A1A] px-6 text-sm font-black text-white transition hover:bg-[#FF7A1A]"
              >
                Explorer le catalogue
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/suivi"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 text-sm font-black text-white transition hover:bg-white/15"
              >
                <Truck size={17} />
                Suivre ma commande
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* NOTE FINALE */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-400">
            <Phone size={14} />
            Besoin d’informations supplémentaires ?
          </div>

          <p className="mt-2 text-xs leading-6 text-slate-400">
            Les conditions affichées dans le parcours de commande font foi
            pour les informations calculées au moment de votre achat.
          </p>
        </div>
      </section>

    </main>
  )
}
