'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  Smartphone,
  ShoppingCart,
  Home,
  CheckCircle,
  AlertCircle,
  MapPin,
  Hash,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard, GlassCardContent, GlassCardTitle, GlassCardDescription } from '@/components/glass-card'
import { useStore } from '@/lib/store'

function ProductInfoContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const productId = searchParams.get('productId')
  const { orders } = useStore()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId || !productId) {
      setError('Invalid QR code data')
      setLoading(false)
      return
    }

    try {
      // Find the order and product
      const order = orders.find((o) => o.id === orderId)
      if (!order) {
        setError('Order not found')
        setLoading(false)
        return
      }

      const item = order.items.find((i) => i.id === productId || i.name === productId)
      if (!item) {
        setError('Product not found in this order')
        setLoading(false)
        return
      }

      setProduct({
        ...item,
        orderId,
        orderNumber: order.id,
        purchaseDate: new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN'),
      })
    } catch (err) {
      setError('Error loading product information')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [orderId, productId, orders])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="max-w-md">
          <GlassCardContent className="py-12 text-center">
            <div className="animate-spin">
              <Package className="h-12 w-12 mx-auto text-muted-foreground" />
            </div>
            <p className="mt-4 text-muted-foreground">Loading product information...</p>
          </GlassCardContent>
        </GlassCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="max-w-md">
          <GlassCardContent className="py-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Error</h2>
            <p className="text-muted-foreground text-center mb-6">{error}</p>
            <Link href="/">
              <Button className="w-full rounded-xl gradient-bg">Back to Home</Button>
            </Link>
          </GlassCardContent>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Success Header */}
      <div className="text-center mb-8 animate-in fade-in zoom-in">
        <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Product Information</h1>
        <p className="text-muted-foreground">Details from your purchase</p>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        {/* Product Card */}
        <GlassCard>
          <GlassCardContent className="p-8">
            {/* Product Header */}
            <div className="flex items-start justify-between mb-6 pb-6 border-b border-border">
              <div className="flex-1">
                <GlassCardTitle className="text-2xl mb-2">{product.name}</GlassCardTitle>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Hash className="h-4 w-4" />
                  <span className="text-sm">Order: {product.orderNumber}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold gradient-text mb-1">₹{product.price.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">per unit</div>
              </div>
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Quantity */}
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Quantity</span>
                </div>
                <p className="text-2xl font-bold">{product.quantity}</p>
              </div>

              {/* Total Price */}
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Total</span>
                </div>
                <p className="text-2xl font-bold gradient-text">₹{(product.price * product.quantity).toFixed(2)}</p>
              </div>

              {/* Purchase Date */}
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Purchased</span>
                </div>
                <p className="text-lg font-semibold">{product.purchaseDate}</p>
              </div>

              {/* Location Info */}
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Store</span>
                </div>
                <p className="text-lg font-semibold">ScanKart</p>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="p-4 rounded-xl bg-secondary/50 mb-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                <p className="text-sm">{product.description}</p>
              </div>
            )}

            {/* Verification Status */}
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-semibold">Verified Purchase</p>
                  <p className="text-sm text-muted-foreground">This product is part of a confirmed order</p>
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Info Card */}
        <GlassCard>
          <GlassCardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <GlassCardTitle className="text-base mb-1">QR Code Verified</GlassCardTitle>
                <GlassCardDescription>
                  This product information has been verified through the ScanKart system. Keep this reference for your records.
                </GlassCardDescription>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full rounded-xl gradient-bg" size="lg">
              View Dashboard
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full rounded-xl" size="lg">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ProductInfoPage() {
  return (
    <Suspense>
      <ProductInfoContent />
    </Suspense>
  )
}
