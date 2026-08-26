import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type CartProduct = {
  id: string
  nom: string
  prix: number
  image_url?: string | null
  stock?: number
  surCommande?: boolean
}

export type CartItem = {
  produit: CartProduct
  quantite: number
}

type CartContextType = {
  items: CartItem[]
  nombreArticles: number
  sousTotal: number
  reduction: number
  totalAvecReduction: number
  ajouter: (produit: CartProduct) => void
  augmenter: (id: string) => void
  diminuer: (id: string) => void
  supprimer: (id: string) => void
  vider: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const STORAGE_KEY = 'chinashop-panier'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const ajouter = (produit: CartProduct) => {
    setItems((actuels) => {
      const existe = actuels.find((item) => item.produit.id === produit.id)

      if (existe) {
        if (!produit.surCommande) {
          const stock = Number(produit.stock || 0)
          if (existe.quantite >= stock) return actuels
        }

        return actuels.map((item) =>
          item.produit.id === produit.id
            ? { ...item, quantite: item.quantite + 1 }
            : item,
        )
      }

      if (!produit.surCommande && Number(produit.stock || 0) <= 0) {
        return actuels
      }

      return [...actuels, { produit, quantite: 1 }]
    })
  }

  const augmenter = (id: string) => {
    setItems((actuels) =>
      actuels.map((item) => {
        if (item.produit.id !== id) return item

        if (!item.produit.surCommande) {
          const stock = Number(item.produit.stock || 0)
          if (item.quantite >= stock) return item
        }

        return { ...item, quantite: item.quantite + 1 }
      }),
    )
  }

  const diminuer = (id: string) => {
    setItems((actuels) =>
      actuels
        .map((item) =>
          item.produit.id === id
            ? { ...item, quantite: item.quantite - 1 }
            : item,
        )
        .filter((item) => item.quantite > 0),
    )
  }

  const supprimer = (id: string) => {
    setItems((actuels) =>
      actuels.filter((item) => item.produit.id !== id),
    )
  }

  const vider = () => setItems([])

  const nombreArticles = useMemo(
    () => items.reduce((total, item) => total + item.quantite, 0),
    [items],
  )

  const sousTotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.produit.prix * item.quantite,
        0,
      ),
    [items],
  )

  const reduction = useMemo(
    () => (nombreArticles >= 3 ? Math.round(sousTotal * 0.015) : 0),
    [nombreArticles, sousTotal],
  )

  const totalAvecReduction = sousTotal - reduction

  return (
    <CartContext.Provider
      value={{
        items,
        nombreArticles,
        sousTotal,
        reduction,
        totalAvecReduction,
        ajouter,
        augmenter,
        diminuer,
        supprimer,
        vider,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart doit être utilisé dans CartProvider')
  }

  return context
}
