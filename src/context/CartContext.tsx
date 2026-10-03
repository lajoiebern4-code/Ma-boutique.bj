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
  poids_kg?: number | null
  volume_cbm?: number | null
  surCommande?: boolean
  categorie?: string | null
  sous_categorie?: string | null
  type_transport?: 'avion' | 'bateau'
  variante_id?: string | null
  variante_nom?: string | null
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
  choisirTransport: (
    id: string,
    typeTransport: 'avion' | 'bateau',
  ) => void
  vider: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const STORAGE_KEY = 'chinashop-panier'

function obtenirCleLigne(produit: CartProduct) {
  return `${produit.id}::${produit.variante_id || ''}`
}

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
      const cleProduit = obtenirCleLigne(produit)
      const existe = actuels.find(
        (item) => obtenirCleLigne(item.produit) === cleProduit,
      )

      if (existe) {
        if (!produit.surCommande) {
          const stock = Number(produit.stock || 0)
          if (existe.quantite >= stock) return actuels
        }

        return actuels.map((item) =>
          obtenirCleLigne(item.produit) === cleProduit
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
        const correspond =
          item.produit.id === id ||
          obtenirCleLigne(item.produit) === id

        if (!correspond) return item

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
        .map((item) => {
          const correspond =
            item.produit.id === id ||
            obtenirCleLigne(item.produit) === id

          return correspond
            ? { ...item, quantite: item.quantite - 1 }
            : item
        })
        .filter((item) => item.quantite > 0),
    )
  }

  const supprimer = (id: string) => {
    setItems((actuels) =>
      actuels.filter(
        (item) =>
          item.produit.id !== id &&
          obtenirCleLigne(item.produit) !== id,
      ),
    )
  }

  const choisirTransport = (
    id: string,
    typeTransport: 'avion' | 'bateau',
  ) => {
    setItems((actuels) =>
      actuels.map((item) => {
        const correspond =
          item.produit.id === id ||
          obtenirCleLigne(item.produit) === id

        if (!correspond) return item

        return {
          ...item,
          produit: {
            ...item.produit,
            type_transport: typeTransport,
          },
        }
      }),
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
        choisirTransport,
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
