'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  Scan,
  Package,
  Tag,
  Percent
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlassCard, GlassCardContent, GlassCardTitle, GlassCardDescription } from '@/components/glass-card'
import { Navigation } from '@/components/navigation'
import { useStore } from '@/lib/store'
import { toast } from 'sonner'

export default function CartPage() {
  const router = useRouter()
  const { 
    isAuthenticated, 
    cart, 
    cartTotal, 
    cartCount, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    budget,
    budgetRemaining 
  } = useStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const tax = cartTotal * 0.08
  const finalTotal = cartTotal + tax

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      toast.success('Item removed from cart')
    } else {
      updateQuantity(productId, newQuantity)
    }
  }

  const handleRemoveItem = (productId: string, productName: string) => {
    removeFromCart(productId)
    toast.success(`${productName} removed from cart`)
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen pb-24 md:pb-8 md:pt-20">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Your Cart</h1>
          
          <GlassCard>
            <GlassCardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Start scanning products to add them to your cart</p>
              <Link href="/scan">
                <Button className="rounded-xl gradient-bg">
                  <Scan className="h-4 w-4 mr-2" />
                  Start Scanning
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

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Your Cart</h1>
            <p className="text-muted-foreground">{cartCount} items</p>
          </div>
          <Button 
            variant="outline" 
            className="rounded-xl text-destructive hover:bg-destructive/10"
            onClick={() => {
              clearCart()
              toast.success('Cart cleared')
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cart
          </Button>
        </div>

        {/* Budget Warning */}
        {budgetRemaining < 0 && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
            <p className="text-destructive font-medium">
              You are ₹{Math.abs(budgetRemaining).toFixed(2)} over your budget of ₹{budget.toFixed(2)}
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <GlassCard key={item.id}>
                <GlassCardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                          <p className="text-sm text-muted-foreground">
                            Barcode: {item.barcode}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-lg text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => handleRemoveItem(item.id, item.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-lg"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                            className="w-16 h-9 text-center rounded-lg"
                            min={0}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-lg"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            ₹{item.price.toFixed(2)} each
                          </p>
                          <p className="text-lg font-bold gradient-text">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            ))}

            {/* Continue Shopping */}
            <Link href="/scan" className="block">
              <GlassCard hover className="border-dashed border-2">
                <GlassCardContent className="p-4">
                  <div className="flex items-center justify-center gap-3 py-4 text-muted-foreground">
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Continue Shopping</span>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </Link>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <GlassCard>
              <GlassCardContent className="p-6">
                <GlassCardTitle className="mb-4">Order Summary</GlassCardTitle>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({cartCount} items)</span>
                    <span className="font-medium">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span className="font-medium">₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-medium text-accent">FREE</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold gradient-text">₹{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Promo Code */}
                <div className="mb-6">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Promo code"
                        className="pl-10 h-11 rounded-xl glass border-0"
                      />
                    </div>
                    <Button variant="outline" className="h-11 rounded-xl">
                      Apply
                    </Button>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link href="/payment">
                  <Button className="w-full h-12 rounded-xl gradient-bg text-primary-foreground font-semibold">
                    Proceed to Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                {/* Budget Info */}
                <div className="mt-4 p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Budget Remaining</span>
                    <span className={`font-semibold ${budgetRemaining < 0 ? 'text-destructive' : 'text-accent'}`}>
                      ₹{budgetRemaining.toFixed(2)}
                    </span>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Savings Card */}
            <GlassCard className="bg-accent/10 border-accent/20">
              <GlassCardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Percent className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-accent">You are saving time!</p>
                    <p className="text-sm text-muted-foreground">No queue, instant checkout</p>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  )
}
