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

const etapes = [
  {
    numero: '01',
    icon: Search,
    titre: 'Vous découvrez',
    texte:
      "Parcourez notre catalogue et découvrez tous nos articles. Chaque produit affiche son prix, sa disponibilité et ses caractéristiques.",
    couleur: '#0F1B3D',
  },
  {
    numero: '02',
    icon: ShoppingBag,
    titre: 'Vous sélectionnez',
    texte:
      "Ajoutez vos articles au panier. Dès 3 articles commandés, une réduction de 1,5 % s'applique automatiquement.",
    couleur: '#E8E4DC',
  },
  {
    numero: '03',
    icon: FileText,
    titre: 'Vous renseignez',
    texte:
      "Indiquez vos coordonnées puis choisissez votre mode de réception : livraison à domicile ou retrait en point prévu.",
    couleur: '#E85D9C',
  },
  {
    numero: '04',
    icon: CreditCard,
    titre: 'Vous payez',
    texte:
      "Le paiement dépend du mode choisi. La livraison nécessite un paiement Mobile Money, le retrait peut se faire en espèces.",
    couleur: '#FF8A3D',
  },
  {
    numero: '05',
    icon: PackageCheck,
    titre: 'On prépare',
    texte:
      "Après validation, vous recevez un numéro de commande et un code de suivi. On s'occupe du reste.",
    couleur: '#5DD4E8',
  },
  {
    numero: '06',
    icon: Truck,
    titre: 'Vous recevez',
    texte:
      "Livraison à votre adresse ou retrait en point prévu. Vous confirmez la réception en un clic.",
    couleur: '#15803D',
  },
]

const avantages = [
  {
    icon: ShieldCheck,
    titre: 'Commande sécurisée',
    texte:
      "Vos informations sont enregistrées de manière sécurisée. Aucune donnée n'est partagée.",
    couleur: '#0F1B3D',
  },
  {
    icon: MapPin,
    titre: 'Livraison adaptée',
    texte:
      "Vous indiquez votre zone, on s'occupe du reste. Les frais sont toujours annoncés avant validation.",
    couleur: '#E85D9C',
  },
  {
    icon: Box,
    titre: 'Stock ou sur commande',
    texte:
      "Certains articles sont déjà au Bénin, d'autres viennent de Chine. On vous dit toujours de quel cas il s'agit.",
    couleur: '#FF8A3D',
  },
  {
    icon: Clock3,
    titre: 'Suivi transparent',
    texte:
      "Un code unique vous permet de suivre votre commande à chaque étape, jusqu'à la réception.",
    couleur: '#5DD4E8',
  },
]

const faq = [
  {
    q: "Qu'est-ce que ChinaShop-Bénin ?",
    a: "ChinaShop-Bénin est une boutique en ligne qui propose des articles variés aux clients au Bénin. Certains articles sont déjà en stock, d'autres viennent directement de Chine sur commande.",
  },
  {
    q: "Quelle est la différence entre un article en stock et un article sur commande ?",
    a: "Un article en stock peut être préparé et livré rapidement. Un article sur commande doit d'abord être approvisionné depuis la Chine, ce qui rallonge le délai de quelques jours à quelques semaines selon le transport choisi.",
  },
  {
    q: "Comment fonctionne la réduction de 1,5 % ?",
    a: "Dès que votre commande atteint 3 articles ou plus, une réduction automatique de 1,5 % s'applique sur le total. Vous la voyez directement dans le récapitulatif avant de valider.",
  },
  {
    q: "La livraison est-elle gratuite ?",
    a: "Non. Les frais de livraison dépendent de votre zone et sont convenus directement avec le livreur. Vous les voyez toujours avant de confirmer votre commande.",
  },
  {
    q: "Le retrait est-il payant ?",
    a: "Non, le retrait est gratuit. Vous récupérez votre commande au point de retrait prévu, sans frais supplémentaires.",
  },
  {
    q: "Puis-je payer en espèces pour une livraison ?",
    a: "Non. Une commande en livraison nécessite un paiement Mobile Money (MTN, Moov ou Celtis). Le paiement en espèces est réservé au retrait sur place.",
  },
  {
    q: "Pourquoi un acompte peut-il être demandé ?",
    a: "Certains articles sur commande (importés de Chine) nécessitent un acompte de 50 % avant le lancement du traitement. Le montant exact est toujours affiché avant que vous validiez.",
  },
  {
    q: "Comment suivre ma commande ?",
    a: "Après validation, vous recevez un numéro de commande et un code de suivi. Utilisez ce code sur la page « Suivre ma commande » pour voir où en est votre colis à tout moment.",
  },
  {
    q: "Que signifient les codes CS-XXXXXX et CR-XXXXXX ?",
    a: "CS-XXXXXX est votre code de suivi pour une commande en livraison. CR-XXXXXX est votre code de retrait si vous avez choisi cette option.",
  },
  {
    q: "Que faire si je me trompe dans mon adresse ?",
    a: "Vérifiez bien toutes vos informations avant de valider. Une fois la commande confirmée, contactez-nous rapidement via WhatsApp pour corriger si possible.",
  },
]

function SectionHeader({
  label,
  titre,
  sousTitre,
}: {
  label: string
  titre: React.ReactNode
  sousTitre?: string
}) {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <span className="h-px w-10 bg-[#0F1B3D]" />
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#0F1B3D]">
          {label}
        </p>
      </div>
      <h2 className="mt-6 text-3xl font-black leading-[1.15] tracking-[-0.02em] text-[#1A1A2E] sm:text-4xl">
        {titre}
      </h2>
      {sousTitre && (
        <p className="mt-5 text-base leading-8 text-[#6B7280]">{sousTitre}</p>
      )}
    </div>
  )
}

export default function Infos() {
  const [faqOuverte, setFaqOuverte] = useState<number | null>(0)

  return (
    <main className="min-h-screen overflow-hidden bg-[#FFFFFF] text-[#1A1A2E]">

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F1B3D] via-[#E8E4DC] to-[#3B2D5F]">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white backdrop-blur-sm">
              <BadgeCheck size={14} className="text-[#FFB47A]" />
              Guide officiel
            </div>

            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
              Tout ce qu'il faut savoir
              <span className="mt-2 block text-[#FFB47A]">
                avant de commander.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/85 sm:text-lg">
              Livraison, paiement, retrait, suivi : on vous explique tout, simplement,
              pour que vous commandiez en toute confiance.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/catalogue"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-white px-6 text-sm font-black text-[#0F1B3D] shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition hover:bg-[#FAF9F6]"
              >
                Voir les produits
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/suivi"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-white/30 bg-white/10 px-6 text-sm font-black text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <Truck size={17} />
                Suivre ma commande
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AVANTAGES */}
      <section className="border-b border-[#FAF9F6] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="grid gap-px overflow-hidden rounded-[14px] border border-[#FAF9F6] bg-[#FAF9F6] sm:grid-cols-2 lg:grid-cols-4">
            {avantages.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.titre} className="bg-white p-6">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                    style={{ backgroundColor: `${item.couleur}15`, color: item.couleur }}
                  >
                    <Icon size={19} strokeWidth={2.5} />
                  </div>
                  <p className="mt-5 text-sm font-black text-[#1A1A2E]">
                    {item.titre}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-[#6B7280]">
                    {item.texte}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeader
          label="Le parcours"
          titre={<>Comment ça se passe, <span className="text-[#0F1B3D]">concrètement ?</span></>}
          sousTitre="De la découverte du produit à sa réception, voici les 6 étapes de votre commande."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {etapes.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.numero}
                className="group relative overflow-hidden rounded-[14px] border border-[#FAF9F6] bg-white p-6 transition hover:border-[#0F1B3D]/30 hover:shadow-[0_8px_24px_rgba(118,84,198,0.08)]"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-[10px]"
                    style={{ backgroundColor: `${item.couleur}15`, color: item.couleur }}
                  >
                    <Icon size={21} strokeWidth={2.5} />
                  </div>
                  <span
                    className="text-3xl font-black"
                    style={{ color: `${item.couleur}30` }}
                  >
                    {item.numero}
                  </span>
                </div>

                <h3 className="mt-6 text-base font-black text-[#1A1A2E]">
                  {item.titre}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                  {item.texte}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* STOCK / SUR COMMANDE */}
      <section className="bg-[#FAF9F6]/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeader
            label="Disponibilité"
            titre={<>Deux situations, <span className="text-[#0F1B3D]">deux délais.</span></>}
            sousTitre="Selon l'article choisi, le délai peut être plus ou moins long. Voici comment savoir."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <article className="rounded-[14px] border border-emerald-100 bg-white p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <PackageCheck size={20} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                  Déjà disponible
                </span>
              </div>

              <h3 className="mt-6 text-2xl font-black tracking-tight text-[#1A1A2E]">
                Article en stock
              </h3>

              <p className="mt-4 text-sm leading-7 text-[#6B7280]">
                L'article est déjà au Bénin, prêt à être préparé. Vous recevez votre
                commande rapidement, sans attendre un approvisionnement.
              </p>

              <div className="mt-6 space-y-3 border-t border-[#FAF9F6] pt-6">
                {[
                  'Déjà au Bénin',
                  'Préparation immédiate',
                  'Livraison ou retrait rapide',
                ].map((x) => (
                  <div key={x} className="flex items-start gap-3">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" strokeWidth={3} />
                    <span className="text-sm leading-6 text-[#1A1A2E]">{x}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[14px] border border-[#FF8A3D]/25 bg-white p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF8A3D]/10 text-[#FF8A3D]">
                  <Clock3 size={20} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FF8A3D]">
                  Import de Chine
                </span>
              </div>

              <h3 className="mt-6 text-2xl font-black tracking-tight text-[#1A1A2E]">
                Article sur commande
              </h3>

              <p className="mt-4 text-sm leading-7 text-[#6B7280]">
                L'article vient directement de Chine. Comptez un délai supplémentaire
                selon le mode d'acheminement choisi : aérien (rapide) ou maritime (économique).
              </p>

              <div className="mt-6 rounded-[10px] border border-[#FF8A3D]/20 bg-[#FF8A3D]/5 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#FF8A3D]">
                  Acompte possible : 50 %
                </p>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                  Certains articles sur commande demandent un acompte avant traitement.
                  Le montant est toujours affiché avant de valider.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* LIVRAISON / RETRAIT */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeader
          label="Réception"
          titre={<>Livraison <span className="text-[#0F1B3D]">ou retrait ?</span></>}
          sousTitre="Vous choisissez librement. Voici ce qu'il faut savoir pour trancher."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[14px] border border-[#FAF9F6] bg-white p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0F1B3D]/10 text-[#0F1B3D]">
                <Truck size={20} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0F1B3D]">
                Livraison
              </span>
            </div>

            <h3 className="mt-6 text-2xl font-black tracking-tight text-[#1A1A2E]">
              À domicile
            </h3>

            <p className="mt-4 text-sm leading-7 text-[#6B7280]">
              Votre commande est acheminée jusqu'à l'adresse indiquée. Les frais
              sont convenus directement avec le livreur selon votre zone.
            </p>

            <div className="mt-6 space-y-3 border-t border-[#FAF9F6] pt-6">
              {[
                "Vous indiquez zone et adresse",
                "Un livreur vous contacte",
                "Paiement Mobile Money requis",
                "Suivi en temps réel",
              ].map((x) => (
                <div key={x} className="flex items-start gap-3">
                  <Check size={16} className="mt-0.5 shrink-0 text-[#0F1B3D]" strokeWidth={3} />
                  <span className="text-sm leading-6 text-[#1A1A2E]">{x}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[14px] border border-[#FAF9F6] bg-white p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8E4DC]/10 text-[#E8E4DC]">
                <MapPin size={20} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#E8E4DC]">
                Retrait
              </span>
            </div>

            <h3 className="mt-6 text-2xl font-black tracking-tight text-[#1A1A2E]">
              En point prévu
            </h3>

            <p className="mt-4 text-sm leading-7 text-[#6B7280]">
              Vous venez récupérer votre commande au point de retrait. Aucun frais,
              aucun livreur à attendre.
            </p>

            <div className="mt-6 space-y-3 border-t border-[#FAF9F6] pt-6">
              {[
                "Aucun frais de livraison",
                "Pas d'adresse à fournir",
                "Paiement en espèces accepté",
                "Code de retrait fourni",
              ].map((x) => (
                <div key={x} className="flex items-start gap-3">
                  <Check size={16} className="mt-0.5 shrink-0 text-[#E8E4DC]" strokeWidth={3} />
                  <span className="text-sm leading-6 text-[#1A1A2E]">{x}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      {/* PAIEMENT */}
      <section className="border-y border-[#FAF9F6] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeader
            label="Paiement"
            titre={<>Comment régler <span className="text-[#0F1B3D]">votre commande ?</span></>}
            sousTitre="Le mode de paiement dépend du mode de réception choisi. Voici les options disponibles."
          />

          <div className="mt-14 grid gap-px overflow-hidden rounded-[14px] border border-[#FAF9F6] bg-[#FAF9F6] sm:grid-cols-2">
            <div className="bg-white p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#0F1B3D]/10 text-[#0F1B3D]">
                  <WalletCards size={22} strokeWidth={2.5} />
                </div>
                <span className="rounded-full border border-[#FAF9F6] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#9A93A5]">
                  Livraison
                </span>
              </div>

              <h3 className="mt-6 text-lg font-black text-[#1A1A2E]">
                Mobile Money
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                Paiement en ligne sécurisé avec l'un des 3 opérateurs disponibles au Bénin.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-[#FFCC00] px-2.5 py-1 text-[10px] font-black leading-none text-black">
                  MTN
                </span>
                <span className="inline-flex items-center rounded-md bg-[#0066B3] px-2.5 py-1 text-[10px] font-black leading-none text-white">
                  Moov
                </span>
                <span className="inline-flex items-center rounded-md bg-[#00A651] px-2.5 py-1 text-[10px] font-black leading-none text-white">
                  Celtis
                </span>
              </div>
            </div>

            <div className="bg-white p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#15803D]/10 text-[#15803D]">
                  <Banknote size={22} strokeWidth={2.5} />
                </div>
                <span className="rounded-full border border-[#FAF9F6] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#9A93A5]">
                  Retrait
                </span>
              </div>

              <h3 className="mt-6 text-lg font-black text-[#1A1A2E]">
                Espèces au retrait
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                Réglez directement au point de retrait, quand vous venez récupérer votre commande.
              </p>

              <div className="mt-5 inline-flex items-center rounded-md bg-[#15803D]/10 px-2.5 py-1 text-[10px] font-black leading-none text-[#15803D]">
                Disponible uniquement en retrait
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DÉLAIS */}
      <section className="bg-[#FAF9F6]/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeader
            label="Délais"
            titre={<>Combien de temps <span className="text-[#0F1B3D]">pour recevoir ?</span></>}
            sousTitre="Le délai dépend de votre ville et du type d'article commandé."
          />

          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {[
              { ville: 'Cotonou', delai: '24 h', desc: 'Livraison express', couleur: '#15803D' },
              { ville: 'Porto-Novo · Calavi', delai: '1 jour', desc: 'Livraison rapide', couleur: '#0F1B3D' },
              { ville: 'Autres villes', delai: '3 jours', desc: 'Livraison standard', couleur: '#FF8A3D' },
            ].map((item) => (
              <div key={item.ville} className="rounded-[14px] border border-[#FAF9F6] bg-white p-7 text-center">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${item.couleur}15`, color: item.couleur }}
                >
                  <Clock3 size={22} strokeWidth={2.5} />
                </div>
                <p
                  className="mt-5 text-3xl font-black tracking-tight"
                  style={{ color: item.couleur }}
                >
                  {item.delai}
                </p>
                <p className="mt-3 text-sm font-black text-[#1A1A2E]">
                  {item.ville}
                </p>
                <p className="mt-1 text-xs text-[#9A93A5]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CODES */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeader
          label="Vos codes"
          titre={<>Deux codes <span className="text-[#0F1B3D]">à garder précieusement.</span></>}
          sousTitre="Après chaque commande, vous recevez un code. Il vous permet de suivre ou de retirer votre commande."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <article className="rounded-[14px] border border-[#FAF9F6] bg-white p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0F1B3D]/10 text-[#0F1B3D]">
                <Truck size={20} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0F1B3D]">
                Commande en livraison
              </span>
            </div>

            <p className="mt-6 font-mono text-3xl font-black tracking-[0.08em] text-[#1A1A2E] sm:text-4xl">
              CS-XXXXXX
            </p>

            <p className="mt-4 text-sm leading-7 text-[#6B7280]">
              Votre code de suivi. Utilisez-le sur la page « Suivre ma commande »
              pour voir où en est votre colis.
            </p>
          </article>

          <article className="rounded-[14px] border border-[#FAF9F6] bg-white p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8E4DC]/10 text-[#E8E4DC]">
                <MapPin size={20} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#E8E4DC]">
                Commande en retrait
              </span>
            </div>

            <p className="mt-6 font-mono text-3xl font-black tracking-[0.08em] text-[#1A1A2E] sm:text-4xl">
              CR-XXXXXX
            </p>

            <p className="mt-4 text-sm leading-7 text-[#6B7280]">
              Votre code de retrait. Présentez-le au point de retrait pour récupérer
              votre commande.
            </p>
          </article>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[#FAF9F6] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeader
            label="Questions fréquentes"
            titre={<>Vous vous posez <span className="text-[#0F1B3D]">des questions ?</span></>}
            sousTitre="Voici les réponses aux questions les plus courantes. Si vous ne trouvez pas la vôtre, contactez-nous."
          />

          <div className="mt-12 space-y-2">
            {faq.map((item, index) => {
              const ouvert = faqOuverte === index

              return (
                <div
                  key={item.q}
                  className={`overflow-hidden rounded-[12px] border transition ${
                    ouvert
                      ? 'border-[#0F1B3D]/30 bg-[#FAF9F6]/40'
                      : 'border-[#FAF9F6] bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setFaqOuverte(ouvert ? null : index)}
                    className="flex w-full items-center gap-4 p-5 text-left"
                    aria-expanded={ouvert}
                  >
                    <span className="flex-1 text-sm font-black text-[#1A1A2E]">
                      {item.q}
                    </span>

                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-[#0F1B3D] transition ${
                        ouvert ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {ouvert && (
                    <div className="border-t border-[#0F1B3D]/15 px-5 pb-5 pt-4">
                      <p className="text-sm leading-7 text-[#6B7280]">
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

      {/* CTA FINALE */}
      <section className="bg-[#FFFFFF]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#0F1B3D] via-[#E8E4DC] to-[#3B2D5F] px-6 py-14 text-center sm:px-12 sm:py-16">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[14px] bg-white/15 backdrop-blur-sm">
                <ShoppingBag size={24} className="text-[#FFB47A]" strokeWidth={2.5} />
              </div>

              <h2 className="mt-6 text-3xl font-black leading-[1.1] tracking-tight text-white sm:text-4xl">
                Prêt à commander ?
              </h2>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/85">
                Des articles sélectionnés, une commande simple, un suivi transparent.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/catalogue"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-white px-7 text-sm font-black text-[#0F1B3D] shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition hover:bg-[#FAF9F6]"
                >
                  Explorer le catalogue
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to="/suivi"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-white/30 bg-white/10 px-7 text-sm font-black text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <Truck size={17} />
                  Suivre ma commande
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NOTE FINALE */}
      <section className="border-t border-[#FAF9F6] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#FAF9F6] text-[#0F1B3D]">
            <Phone size={18} strokeWidth={2.5} />
          </div>

          <p className="mt-5 text-base font-black tracking-tight text-[#1A1A2E]">
            Une autre question ?
          </p>

          <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-[#9A93A5]">
            Contactez-nous via WhatsApp au +229 51 51 78 76. Nous sommes disponibles
            du lundi au samedi, de 8h à 18h.
          </p>
        </div>
      </section>

    </main>
  )
}
