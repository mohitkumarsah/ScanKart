'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Receipt, 
  Package, 
  Clock, 
  CheckCircle, 
  ArrowLeft,
  ShoppingCart,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard, GlassCardContent, GlassCardTitle, GlassCardDescription } from '@/components/glass-card'
import { Navigation } from '@/components/navigation'
import { useStore } from '@/lib/store'
import { toast } from 'sonner'
import { getUserOrdersHistory } from '@/lib/firestore-db'

export default function OrdersPage() {
  const router = useRouter()
  const { isAuthenticated, user, orders: storeOrders } = useStore()
  const [firestoreOrders, setFirestoreOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user])

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      if (user?.id) {
        // Try to get orders from Firestore first
        const firestoreData = await getUserOrdersHistory(user.id)
        setFirestoreOrders(firestoreData || [])
        
        // Combine Firestore orders with store orders
        const allOrders = [
          ...(firestoreData || []),
          ...storeOrders,
        ]
        
        // Remove duplicates based on order ID
        const uniqueOrdersMap = new Map(allOrders.map(order => [order.id, order]))
        const uniqueOrders = Array.from(uniqueOrdersMap.values()) as any[]
        
        const sortedOrders = uniqueOrders.sort((a: any, b: any) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
          return dateB.getTime() - dateA.getTime()
        })
        
        setOrders(sortedOrders)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load order history')
      setOrders(storeOrders)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A'
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading && orders.length === 0) {
    return (
      <div className="min-h-screen pb-24 md:pb-8 md:pt-20">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">My Orders</h1>
          <p className="text-center text-muted-foreground">Loading order history...</p>
        </main>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen pb-24 md:pb-8 md:pt-20">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">My Orders</h1>
          
          <GlassCard>
            <GlassCardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Receipt className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
              <Link href="/scan">
                <Button className="rounded-xl gradient-bg">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Start Shopping
                </Button>
              </Link>
            </GlassCardContent>
          </GlassCard>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-20">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Order History</h1>
            <p className="text-muted-foreground">{orders.length} total orders</p>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <GlassCard hover className="hover:border-primary/50 transition-all cursor-pointer">
                <GlassCardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shrink-0">
                        <Package className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.paymentStatus === 'completed'
                              ? 'bg-accent/20 text-accent'
                              : order.paymentStatus === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-600'
                              : 'bg-destructive/20 text-destructive'
                          }`}>
                            {order.paymentStatus === 'completed' && <CheckCircle className="h-3 w-3 inline mr-1" />}
                            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDate(order.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            {order.items?.length || 0} items
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <p className="text-2xl font-bold gradient-text">
                        ₹{(order.total || 0).toFixed(2)}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-lg"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>

                  {/* Items Preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex flex-wrap gap-2">
                        {order.items.slice(0, 3).map((item: any, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground">
                            +{order.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </GlassCardContent>
              </GlassCard>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
