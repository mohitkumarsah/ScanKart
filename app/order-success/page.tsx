'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  CheckCircle, 
  QrCode, 
  Download, 
  Share2, 
  Home, 
  ArrowRight,
  Clock,
  Package,
  Receipt,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard, GlassCardContent, GlassCardTitle, GlassCardDescription } from '@/components/glass-card'
import { useStore } from '@/lib/store'
import { generateInvoiceQRCodes } from '@/lib/invoice-generator'

function OrderSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const { isAuthenticated, orders } = useStore()
  const [showQR, setShowQR] = useState(false)
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({})
  const [selectedItemQR, setSelectedItemQR] = useState<string | null>(null)
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null)

  const order = orders.find(o => o.id === orderId)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    // Show QR code after animation
    const timer = setTimeout(() => setShowQR(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Generate QR codes for products
    if (order) {
      const generateQRs = async () => {
        try {
          const baseUrl =
            typeof window !== 'undefined'
              ? window.location.origin
              : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

          const codes: Record<string, string> = {}
          
          for (const item of order.items) {
            const itemId = item.id || item.name
            const qrUrl = `${baseUrl}/product-info?orderId=${order.id}&productId=${encodeURIComponent(itemId)}`
            
            // Dynamically import QRCode
            const QRCode = (await import('qrcode')).default
            const qrCode = await QRCode.toDataURL(qrUrl, {
              width: 300,
              margin: 2,
              color: {
                dark: '#4f46e5',
                light: '#ffffff',
              },
            })
            codes[itemId] = qrCode
          }
          
          setQrCodes(codes)
        } catch (error) {
          console.error('Error generating QR codes:', error)
        }
      }

      generateQRs()
    }
  }, [order])

  if (!isAuthenticated || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="max-w-md text-center">
          <GlassCardContent className="py-12">
            <p className="text-muted-foreground mb-4">Order not found</p>
            <Link href="/dashboard">
              <Button className="rounded-xl gradient-bg">Go to Dashboard</Button>
            </Link>
          </GlassCardContent>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Success Animation */}
      <div className="animate-in fade-in zoom-in duration-500 text-center mb-8">
        <div className="w-24 h-24 rounded-full gradient-bg flex items-center justify-center mx-auto mb-6 animate-pulse-slow">
          <CheckCircle className="h-12 w-12 text-primary-foreground" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground">Your order has been placed successfully</p>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        {/* Order Details Card */}
        <GlassCard>
          <GlassCardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <GlassCardTitle>Order Confirmed</GlassCardTitle>
                <GlassCardDescription>Order ID: {order.id}</GlassCardDescription>
              </div>
              <div className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium">
                Paid
              </div>
            </div>

            {/* Order Info */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <Package className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{order.items.length}</p>
                <p className="text-xs text-muted-foreground">Items</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <Receipt className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold gradient-text">₹{order.total.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">Now</p>
                <p className="text-xs text-muted-foreground">Ready</p>
              </div>
            </div>

            {/* Items List with QR */}
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium mb-3">Items Purchased (Tap for QR Code)</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {order.items.map((item, index) => {
                  const itemId = item.id || item.name
                  const hasQR = qrCodes[itemId]
                  
                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between text-sm py-3 px-3 rounded-lg transition-all cursor-pointer ${
                        hasQR
                          ? 'hover:bg-secondary/50 bg-secondary/25'
                          : 'bg-secondary/25'
                      }`}
                      onClick={() => {
                        if (hasQR) {
                          setSelectedItemQR(qrCodes[itemId])
                          setSelectedItemName(item.name)
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-muted-foreground">{item.quantity}x</span>
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                        {hasQR && <QrCode className="h-4 w-4 text-primary" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* QR Code Card */}
        <GlassCard className={`transition-all duration-500 ${showQR ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <GlassCardContent className="p-6 text-center">
            <div className="flex items-center gap-3 justify-center mb-6">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                <QrCode className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="text-left">
                <GlassCardTitle>Product QR Codes</GlassCardTitle>
                <GlassCardDescription>Tap a product above to view its QR code</GlassCardDescription>
              </div>
            </div>

            {/* QR Code Display Area */}
            {selectedItemQR ? (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Product: {selectedItemName}</p>
                </div>
                <div className="w-64 h-64 mx-auto bg-white rounded-2xl p-4 flex items-center justify-center">
                  <img src={selectedItemQR} alt="Product QR Code" className="w-full h-full object-contain" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Scan this code to view full product details and verify your purchase
                </p>
                <Button 
                  variant="outline" 
                  className="w-full rounded-xl"
                  onClick={() => {
                    setSelectedItemQR(null)
                    setSelectedItemName(null)
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">Select a product above to display its QR code</p>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Info Card */}
        <GlassCard>
          <GlassCardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              How to Use QR Codes
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Each product has a unique QR code embedded in your invoice</li>
              <li>✓ Scan any QR code to get detailed product information</li>
              <li>✓ Verify your purchase details with our verification system</li>
              <li>✓ Share QR codes for product details with others</li>
            </ul>
          </GlassCardContent>
        </GlassCard>

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full h-12 rounded-xl">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link href="/orders" className="flex-1">
            <Button className="w-full h-12 rounded-xl gradient-bg">
              View Orders
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
