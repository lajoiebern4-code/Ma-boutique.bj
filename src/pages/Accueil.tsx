import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Package,
  ShoppingBag,
  Sparkles,
  Zap,
  ShieldCheck,
  Truck,
  Clock,
  Star,
  Users,
  Globe,
  Quote,
  BadgeCheck
} from 'lucide-react'
import { obtenirProduits, type Produit } from '../services/produits'
import { useCart } from '../context/CartContext'

function formatPrix(prix: number) {
  return `${Number(prix || 0).toLocaleString('fr-FR')} FCFA`
}

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
}

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#001433] via-[#003D99] to-[#0052CC] py-20 sm:py-28">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#FF7A1A] blur-3xl" />
      </div>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
          >
            <Sparkles size={16} className="text-[#FF7A1A]" />
            Chine · Bénin
            <Zap size={16} className="text-[#FF7A1A]" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl"
          >
            L'Afrique s'approvisionne
            <span className="block text-[#FF7A1A]">à la source chinoise</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-blue-100 sm:text-xl"
          >
            Des produits soigneusement sélectionnés en Chine, livrés directement au Bénin.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <Link to="/catalogue">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-xl bg-gradient-to-r from-[#FF7A1A] to-[#FF9C4D] px-8 py-3 font-bold text-white shadow-lg"
              >
                Explorer le catalogue <ArrowRight size={18} className="ml-2 inline" />
              </motion.button>
            </Link>
            <Link to="/infos">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-xl border-2 border-white px-8 py-3 font-bold text-white transition hover:bg-white hover:text-[#0052CC]"
              >
                En savoir plus
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

function Stats() {
  const stats = [
    { icon: Users, value: '500+', label: 'Clients satisfaits' },
    { icon: Package, value: '1200+', label: 'Produits livrés' },
    { icon: Star, value: '4.8/5', label: 'Note moyenne' },
    { icon: Globe, value: '12', label: 'Villes desservies' },
  ]

  return (
    <section className="bg-gradient-to-br from-[#001433] to-[#003D99] py-16">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
              className="rounded-2xl bg-white/10 p-6 text-center backdrop-blur-sm"
            >
              <stat.icon className="mx-auto h-8 w-8 text-[#FF7A1A]" />
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-3 text-3xl font-black text-white"
              >
                {stat.value}
              </motion.p>
              <p className="text-sm text-blue-200">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

function Features() {
  const features = [
    { icon: ShieldCheck, title: 'Commande sécurisée', description: 'Vos paiements et données sont protégés.' },
    { icon: Truck, title: 'Livraison au Bénin', description: 'Nous livrons dans tout le Bénin.' },
    { icon: Clock, title: 'Suivi en temps réel', description: 'Suivez votre commande étape par étape.' },
    { icon: Star, title: 'Qualité garantie', description: 'Des produits sélectionnés avec soin.' }
  ]

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-3xl font-black text-[#001433]"
        >
          Pourquoi choisir <span className="text-[#0052CC]">ChinaShop-Bénin</span> ?
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -8 }}
              className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition hover:shadow-xl"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EBF5FF] text-[#0052CC]"
              >
                <feature.icon size={28} />
              </motion.div>
              <h3 className="mt-4 text-lg font-bold text-[#001433]">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function ProductGrid() {
  const { ajouter } = useCart()
  const [produits, setProduits] = useState<Produit[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    let actif = true
    async function charger() {
      try {
        const resultat = await obtenirProduits()
        if (actif) setProduits(resultat.slice(0, 8))
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        if (actif) setChargement(false)
      }
    }
    charger()
    return () => { actif = false }
  }, [])

  return (
    <section className="bg-[#F8FAFC] py-16">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between"
        >
          <h2 className="text-3xl font-black text-[#001433]">
            Nos <span className="text-[#0052CC]">meilleurs produits</span>
          </h2>
          <Link to="/catalogue">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl border-2 border-[#0052CC] px-4 py-2 font-bold text-[#0052CC] transition hover:bg-[#0052CC] hover:text-white"
            >
              Voir tout
            </motion.button>
          </Link>
        </motion.div>
        {chargement ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-gray-200" />)}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            {produits.map((produit) => (
              <motion.div
                key={produit.id}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-xl"
              >
                <Link to={`/produit/${produit.id}`}>
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {produit.image_url ? (
                      <motion.img
                        whileHover={{ scale: 1.1 }}
                        src={produit.image_url}
                        alt={produit.nom}
                        className="h-full w-full object-cover transition"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <Package size={40} />
                      </div>
                    )}
                    {produit.nouveau && (
                      <span className="absolute left-3 top-3 rounded-full bg-[#0052CC] px-3 py-1 text-xs font-bold text-white">Nouveau</span>
                    )}
                    {produit.promo > 0 && (
                      <span className="absolute right-3 top-3 rounded-full bg-[#FF7A1A] px-3 py-1 text-xs font-bold text-white">-{produit.promo}%</span>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <p className="text-xs font-bold uppercase text-[#0052CC]">{produit.categorie || 'Sélection'}</p>
                  <h3 className="mt-1 line-clamp-2 text-sm font-bold text-[#001433]">{produit.nom}</h3>
                  <p className="mt-2 text-lg font-black text-[#001433]">{formatPrix(produit.prix)}</p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => ajouter({
                      id: produit.id,
                      nom: produit.nom,
                      prix: produit.prix,
                      image_url: produit.image_url || null,
                      stock: produit.stock,
                      surCommande: produit.stock <= 0 && produit.disponibilite === 'sur_commande'
                    })}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052CC] py-2.5 text-sm font-bold text-white transition hover:bg-[#003D99]"
                  >
                    <ShoppingBag size={16} /> Ajouter au panier
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}

function Testimonials() {
  const testimonials = [
    {
      name: 'Mamadou Diallo',
      role: 'Commerçant - Cotonou',
      text: 'ChinaShop-Bénin a changé ma façon de m\'approvisionner. Je recommande !'
    },
    {
      name: 'Fatima Traoré',
      role: 'Gérante - Porto-Novo',
      text: 'Le suivi des commandes est transparent, et le service client est réactif.'
    },
    {
      name: 'Jean-Baptiste Koffi',
      role: 'Entrepreneur - Parakou',
      text: 'Très satisfait des produits reçus. La qualité est au rendez-vous.'
    }
  ]

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-3xl font-black text-[#001433]"
        >
          Ce que disent nos <span className="text-[#FF7A1A]">clients</span>
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="mt-12 grid gap-6 md:grid-cols-3"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -5 }}
              className="rounded-2xl bg-[#F8FAFC] p-8 shadow-sm transition hover:shadow-xl"
            >
              <Quote className="h-8 w-8 text-[#FF7A1A] opacity-50" />
              <p className="mt-4 italic text-gray-600">"{testimonial.text}"</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0052CC] text-lg font-bold text-white">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-[#001433]">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#001433] to-[#003D99] py-16">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#FF7A1A] blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative mx-auto max-w-4xl px-4 text-center"
      >
        <h2 className="text-3xl font-black text-white sm:text-4xl">Prêt à passer commande ?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-200">
          Parcourez notre catalogue et trouvez les produits qu'il vous faut.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/catalogue">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl bg-gradient-to-r from-[#FF7A1A] to-[#FF9C4D] px-8 py-3 font-bold text-white shadow-lg"
            >
              Découvrir le catalogue <ArrowRight size={18} className="ml-2 inline" />
            </motion.button>
          </Link>
          <Link to="/infos">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl border-2 border-white px-8 py-3 font-bold text-white transition hover:bg-white hover:text-[#0052CC]"
            >
              Comment commander ?
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </section>
  )
}

export default function Accueil() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Stats />
      <Features />
      <ProductGrid />
      <Testimonials />
      <CTA />
    </div>
  )
}
