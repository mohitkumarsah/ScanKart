export async function generateStaticParams() {
  return [];
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Package,
  Calendar,
  MapPin,
  CreditCard,
  Download,
  Printer,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard, GlassCardContent, GlassCardTitle, GlassCardDescription } from '@/components/glass-card'
import { Navigation } from '@/components/navigation'
import { useStore } from '@/lib/store'
import { toast } from 'sonner'
import { getOrderDetails } from '@/lib/firestore-db'
import { generateInvoice, downloadInvoice, printInvoice } from '@/lib/invoice-generator'

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const { isAuthenticated } = useStore()
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    loadOrder()
  }, [orderId])

  const loadOrder = async () => {
    setIsLoading(true)
    try {
      const data = await getOrderDetails(orderId)
      if (data) {
        setOrder(data)
      } else {
        toast.error('Order not found')
        router.push('/orders')
      }
    } catch (error) {
      console.error('Error loading order:', error)
      toast.error('Failed to load order details')
      router.push('/orders')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadInvoice = async () => {
    try {
      if (!order) return
      const subtotal = (order.total || 0) - (order.tax || 0)
      const taxRate = subtotal > 0 ? (order.tax || 0) / subtotal : 0.08
      const invoice = generateInvoice(
        order.id,
        order.userId,
        order.customerEmail || '',
        order.customerPhone,
        order.items || [],
        subtotal,
        taxRate,
        order.paymentMethod || 'UPI'
      )
      downloadInvoice(invoice)
      toast.success('Invoice downloaded')
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('Failed to download invoice')
    }
  }

  const handlePrintInvoice = async () => {
    try {
      if (!order) return
      const subtotal = (order.total || 0) - (order.tax || 0)
      const taxRate = subtotal > 0 ? (order.tax || 0) / subtotal : 0.08
      const invoice = generateInvoice(
        order.id,
        order.userId,
        order.customerEmail || '',
        order.customerPhone,
        order.items || [],
        subtotal,
        taxRate,
        order.paymentMethod || 'UPI'
      )
      printInvoice(invoice)
    } catch (error) {
      console.error('Error printing invoice:', error)
      toast.error('Failed to print invoice')
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
    }
  }

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 md:pb-8 md:pt-20">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Loading order details...</p>
        </main>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen pb-24 md:pb-8 md:pt-20">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Order not found</p>
          <div className="text-center mt-4">
            <Link href="/orders">
              <Button className="rounded-xl gradient-bg">Back to Orders</Button>
            </Link>
          </div>
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
          <Link href="/orders">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">Order Details</h1>
            <p className="text-muted-foreground">Order #{order.id}</p>
          </div>
          <div className={`px-4 py-2 rounded-xl text-sm font-medium ${getStatusColor(order.paymentStatus)}`}>
            {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
          </div>
        </div>

        {/* Order Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <GlassCard>
            <GlassCardContent className="p-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order Date</p>
                  <p className="font-semibold">{formatDate(order.createdAt)}</p>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                  <p className="font-semibold capitalize">{order.paymentMethod || 'UPI'}</p>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {order.shippingAddress && (
            <GlassCard>
              <GlassCardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
                    <p className="font-semibold text-sm">{order.shippingAddress}</p>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>

        {/* Order Items */}
        <GlassCard className="mb-6">
          <GlassCardContent className="p-4">
            <GlassCardTitle className="mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Items
            </GlassCardTitle>
            
            <div className="space-y-3">
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No items in order</p>
              )}
            </div>

            {/* Order Summary */}
            <div className="border-t border-border mt-4 pt-4 space-y-2">
              <div className="flex justify-between">
                <p className="text-muted-foreground">Subtotal:</p>
                <p className="font-medium">₹{((order.total - (order.tax || 0)).toFixed(2))}</p>
              </div>
              {order.tax && (
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Tax (8%):</p>
                  <p className="font-medium">₹{order.tax.toFixed(2)}</p>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <p>Total:</p>
                <p className="gradient-text">₹{order.total.toFixed(2)}</p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Order Notes */}
        {order.notes && (
          <GlassCard className="mb-6">
            <GlassCardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Order Notes</p>
              <p className="text-sm">{order.notes}</p>
            </GlassCardContent>
          </GlassCard>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={handleDownloadInvoice}
            variant="outline"
            className="flex-1 rounded-xl flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Invoice
          </Button>
          <Button
            onClick={handlePrintInvoice}
            variant="outline"
            className="flex-1 rounded-xl flex items-center justify-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
          <Link href="/support-tickets" className="flex-1">
            <Button variant="outline" className="w-full rounded-xl flex items-center justify-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Get Help
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
