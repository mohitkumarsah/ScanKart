'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuthListener } from './firebase-auth'

// Types
export interface Product {
  id: string
  name: string
  price: number
  barcode: string
  image: string
  category?: string
  stock?: number
  approved?: boolean
}

export interface CartItem extends Product {
  quantity: number
}

export interface Order {
  id: string
  userId: string
  items: CartItem[]
  total: number
  paymentStatus: 'pending' | 'completed' | 'failed'
  createdAt: Date
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  photoURL?: string
  budget?: number
}

interface StoreContextType {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  logout: () => Promise<void>
  
  cart: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartTotal: number
  cartCount: number
  
  budget: number
  setBudget: (amount: number) => void
  budgetRemaining: number
  deductBudget: (amount: number) => void
  
  orders: Order[]
  addOrder: (order: Order) => void
  
  products: Product[]
  getProductByBarcode: (barcode: string) => Product | undefined
  
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

// Mock products (removed mall-specific)
const mockProducts: Product[] = [
  { id: '1', name: 'Organic Milk', price: 65, barcode: '1234567890123', image: '/products/milk.jpg', category: 'Dairy', stock: 50, approved: true },
  { id: '2', name: 'Whole Wheat Bread', price: 45, barcode: '2345678901234', image: '/products/bread.jpg', category: 'Bakery', stock: 30, approved: true },
  { id: '3', name: 'Fresh Apples (1kg)', price: 120, barcode: '3456789012345', image: '/products/apples.jpg', category: 'Fresh Produce', stock: 25, approved: true },
  { id: '4', name: 'Orange Juice', price: 85, barcode: '4567890123456', image: '/products/juice.jpg', category: 'Beverages', stock: 40, approved: true },
  { id: '5', name: 'Greek Yogurt', price: 55, barcode: '5678901234567', image: '/products/yogurt.jpg', category: 'Dairy', stock: 35, approved: true },
  { id: '6', name: 'Premium Coffee Beans', price: 350, barcode: '6789012345678', image: '/products/coffee.jpg', category: 'Beverages', stock: 15, approved: true },
  { id: '7', name: 'Organic Eggs (12pc)', price: 95, barcode: '7890123456789', image: '/products/eggs.jpg', category: 'Dairy', stock: 45, approved: true },
  { id: '8', name: 'Avocados (3pc)', price: 180, barcode: '8901234567890', image: '/products/avocado.jpg', category: 'Fresh Produce', stock: 20, approved: true },
  { id: '9', name: 'Pasta Sauce', price: 75, barcode: '9012345678901', image: '/products/sauce.jpg', category: 'Pantry', stock: 60, approved: true },
  { id: '10', name: 'Brown Rice', price: 110, barcode: '0123456789012', image: '/products/rice.jpg', category: 'Pantry', stock: 55, approved: true },
  { id: '11', name: 'V-Neck T-Shirt', price: 299, barcode: '1111111111111', image: '/products/tshirt.jpg', category: 'Fashion', stock: 100, approved: true },
  { id: '12', name: 'Denim Jeans', price: 1299, barcode: '2222222222222', image: '/products/jeans.jpg', category: 'Fashion', stock: 45, approved: true },
  { id: '13', name: 'Sports Shoes', price: 2499, barcode: '3333333333333', image: '/products/shoes.jpg', category: 'Footwear', stock: 30, approved: true },
  { id: '14', name: 'Smartphone Case', price: 399, barcode: '4444444444444', image: '/products/case.jpg', category: 'Accessories', stock: 200, approved: true },
]

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [budget, setBudgetState] = useState(2000)
  const [orders, setOrders] = useState<Order[]>([])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [products] = useState<Product[]>(mockProducts)

  // Load dark mode and budget from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode !== null) {
      setIsDarkMode(JSON.parse(savedDarkMode))
    } else {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }

    const savedBudget = localStorage.getItem('budget')
    if (savedBudget !== null) {
      setBudgetState(parseFloat(savedBudget))
    }
  }, [])

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  // Save budget
  useEffect(() => {
    localStorage.setItem('budget', budget.toString())
  }, [budget])

  // Load cart
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [])

  // Firebase auth
  useEffect(() => {
    const unsubscribe = useAuthListener((authUser) => {
      if (authUser) {
        setUser(authUser)
        if (authUser.budget !== undefined) {
          setBudgetState(authUser.budget)
        } else {
          const savedBudget = localStorage.getItem('budget')
          if (savedBudget) {
            setBudgetState(parseFloat(savedBudget))
          }
        }
      } else {
        setUser(null)
      }
    })
    return () => unsubscribe()
  }, [])

  // Save cart
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const budgetRemaining = budget - cartTotal

  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev])
    clearCart()
  }

  const setBudget = (amount: number) => {
    setBudgetState(Math.max(0, amount))
  }

  const deductBudget = (amount: number) => {
    setBudgetState(prev => Math.max(0, prev - amount))
  }

  const getProductByBarcode = (barcode: string) => {
    return products.find(p => p.barcode === barcode)
  }

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev)
  }

  const logout = async () => {
    try {
      const { logout: firebaseLogout } = await import('./firebase-auth')
      await firebaseLogout()
      setUser(null)
      setCart([])
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    }
  }

  return (
    <StoreContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: !!user,
        logout,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        budget,
        setBudget,
        budgetRemaining,
        deductBudget,
        orders,
        addOrder,
        products,
        getProductByBarcode,
        isDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
