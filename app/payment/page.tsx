'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  ArrowLeft, 
  Lock, 
  CheckCircle,
  Shield,
  Building2,
  Download,
  Printer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlassCard, GlassCardContent, GlassCardTitle, GlassCardDescription } from '@/components/glass-card'
import { Navigation } from '@/components/navigation'
import { useStore } from '@/lib/store'
import { toast } from 'sonner'
import { generateInvoice, downloadInvoice, printInvoice, generateInvoiceQRCodes } from '@/lib/invoice-generator'
import { addTransaction, addOrder as addOrderToFirestore, updateProductStock } from '@/lib/firestore-db'

type PaymentMethod = 'upi' | 'card' | 'wallet'

export default function PaymentPage() {
  const router = useRouter()
  const { isAuthenticated, cart, cartTotal, user, addOrder, clearCart, deductBudget } = useStore()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi')
  const [isProcessing, setIsProcessing] = useState(false)
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null)
  
  // Card form state
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardName, setCardName] = useState('')
  
  // UPI form state
  const [upiId, setUpiId] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (cart.length === 0 && isAuthenticated) {
      router.push('/cart')
    }
  }, [cart.length, isAuthenticated, router])

  if (!isAuthenticated || cart.length === 0) {
    return null
  }

  const tax = cartTotal * 0.08
  const finalTotal = cartTotal + tax

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handlePayment = async () => {
    setIsProcessing(true)

    // Create order ID
    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()
    
    try {
      // Update product stock for each item in cart concurrently
      await Promise.all(
        cart.map(async (item) => {
          try {
            await updateProductStock(item.id, item.quantity)
          } catch (error) {
            console.error(`Failed to update stock for product ${item.id}:`, error)
          }
        })
      )

      // Add order to store (local state)
      addOrder({
        id: orderId,
        userId: user?.id || 'anonymous',
        items: cart,
        total: finalTotal,
        paymentStatus: 'completed',
        createdAt: new Date(),
      })

      // Deduct budget based on total spent
      deductBudget(finalTotal)

      // Execute Firestore writes concurrently
      const firestoreWrites = []

      // Save order to Firestore (permanent storage)
      firestoreWrites.push(
        addOrderToFirestore({
          userId: user?.id || 'anonymous',
          items: cart,
          total: finalTotal,
          tax: cartTotal * 0.08,
          paymentStatus: 'completed',
          paymentMethod,
        }).catch(err => console.warn('Failed to save order to Firestore:', err))
      )

      // Generate invoice
      const invoice = generateInvoice(
        orderId,
        user?.name || 'Customer',
        user?.email || 'not-provided@email.com',
        user?.phone,
        cart,
        cartTotal,
        0.08,
        paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'card' ? 'Credit/Debit Card' : 'Digital Wallet'
      )

      // Generate QR codes for the invoice
      const qrCodes = await generateInvoiceQRCodes(invoice)
      invoice.qrCodes = qrCodes

      // Store invoice in Firestore
      firestoreWrites.push(
        addTransaction({
          userId: user?.id || 'anonymous',
          type: 'payment',
          amount: finalTotal,
          orderId: orderId,
          description: `Payment for order ${orderId}`,
          status: 'completed',
          metadata: {
            paymentMethod: paymentMethod,
            items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
            invoice: {
              date: invoice.date,
              subtotal: invoice.subtotal,
              tax: invoice.tax,
              total: invoice.total,
            }
          }
        }).catch(err => console.warn('Failed to record transaction in database:', err))
      )

      await Promise.all(firestoreWrites)

      setGeneratedInvoice(invoice)
      toast.success('Payment successful! Invoice generated.')
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Payment processing failed')
      setIsProcessing(false)
      return
    }

    setIsProcessing(false)
  }

  const handleDownloadInvoice = () => {
    if (generatedInvoice) {
      downloadInvoice(generatedInvoice)
      toast.success('Invoice downloaded!')
    }
  }

  const handlePrintInvoice = () => {
    if (generatedInvoice) {
      printInvoice(generatedInvoice)
    }
  }

  const handleContinue = () => {
    if (generatedInvoice) {
      router.push(`/order-success?orderId=${generatedInvoice.orderNumber}`)
    }
  }

  const paymentMethods = [
    { id: 'upi' as const, icon: Smartphone, label: 'UPI', description: 'GPay, PhonePe, Paytm' },
    { id: 'card' as const, icon: CreditCard, label: 'Card', description: 'Credit/Debit Card' },
    { id: 'wallet' as const, icon: Wallet, label: 'Wallet', description: 'Digital Wallets' },
  ]

  const walletOptions = [
    { name: 'Paytm Wallet', balance: '₹1500.00' },
    { name: 'Amazon Pay', balance: '₹755.50' },
    { name: 'PhonePe Wallet', balance: '₹2000.00' },
  ]

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-20">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Payment</h1>
            <p className="text-muted-foreground">Complete your purchase</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Payment Methods */}
          <div className="lg:col-span-3 space-y-4">
            {/* Payment Method Selection */}
            <GlassCard>
              <GlassCardContent className="p-4">
                <GlassCardTitle className="mb-4">Select Payment Method</GlassCardTitle>
                <div className="grid grid-cols-3 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === method.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 glass'
                      }`}
                    >
                      <method.icon className={`h-6 w-6 mx-auto mb-2 ${
                        paymentMethod === method.id ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <p className="font-medium text-sm">{method.label}</p>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                    </button>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* UPI Payment Form */}
            {paymentMethod === 'upi' && (
              <GlassCard>
                <GlassCardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                      <Smartphone className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <GlassCardTitle>UPI Payment</GlassCardTitle>
                      <GlassCardDescription>Enter your UPI ID to pay</GlassCardDescription>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">UPI ID</label>
                      <Input
                        placeholder="username@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="h-12 rounded-xl glass border-0"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-6">
                      {['GPay', 'PhonePe', 'Paytm'].map((app) => (
                        <button
                          key={app}
                          className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                          onClick={() => setUpiId(`${app.toLowerCase()}@upi`)}
                        >
                          <p className="font-medium text-sm">{app}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            )}

            {/* Card Payment Form */}
            {paymentMethod === 'card' && (
              <GlassCard>
                <GlassCardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <GlassCardTitle>Card Payment</GlassCardTitle>
                      <GlassCardDescription>Enter your card details</GlassCardDescription>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Card Number</label>
                      <Input
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        className="h-12 rounded-xl glass border-0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Cardholder Name</label>
                      <Input
                        placeholder="John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="h-12 rounded-xl glass border-0"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Expiry Date</label>
                        <Input
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          maxLength={5}
                          className="h-12 rounded-xl glass border-0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">CVV</label>
                        <Input
                          type="password"
                          placeholder="***"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                          maxLength={4}
                          className="h-12 rounded-xl glass border-0"
                        />
                      </div>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            )}

            {/* Wallet Payment */}
            {paymentMethod === 'wallet' && (
              <GlassCard>
                <GlassCardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <GlassCardTitle>Digital Wallets</GlassCardTitle>
                      <GlassCardDescription>Pay using your wallet balance</GlassCardDescription>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {walletOptions.map((wallet, index) => (
                      <button
                        key={index}
                        className="w-full p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{wallet.name}</span>
                        </div>
                        <span className="text-muted-foreground">Balance: {wallet.balance}</span>
                      </button>
                    ))}
                  </div>
                </GlassCardContent>
              </GlassCard>
            )}

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Secured by 256-bit SSL encryption</span>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <GlassCard className="sticky top-24">
              <GlassCardContent className="p-6">
                <GlassCardTitle className="mb-4">Order Summary</GlassCardTitle>

                {/* Items */}
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{item.quantity}x</span>
                        <span className="truncate max-w-[150px]">{item.name}</span>
                      </div>
                      <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="gradient-text">₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Pay Button or Invoice Actions */}
                {!generatedInvoice ? (
                  <Button
                    className="w-full h-14 rounded-xl gradient-bg text-primary-foreground font-semibold mt-6"
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Pay ₹{finalTotal.toFixed(2)}
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3 mt-6">
                    <div className="p-4 rounded-xl bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <p className="font-semibold text-green-900 dark:text-green-100">Payment Successful!</p>
                      </div>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Order ID: {generatedInvoice.orderNumber}
                      </p>
                    </div>

                    <Button
                      className="w-full h-12 rounded-xl"
                      onClick={handleDownloadInvoice}
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>

                    <Button
                      className="w-full h-12 rounded-xl"
                      onClick={handlePrintInvoice}
                      variant="outline"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Invoice
                    </Button>

                    <Button
                      className="w-full h-12 rounded-xl gradient-bg text-primary-foreground font-semibold"
                      onClick={handleContinue}
                    >
                      Continue Shopping
                    </Button>
                  </div>
                )}

                {/* Razorpay Badge */}
                <div className="mt-4 p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-xs text-muted-foreground">
                    Powered by <span className="font-semibold text-foreground">Razorpay</span>
                  </p>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  )
}
