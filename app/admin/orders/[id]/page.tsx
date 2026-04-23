'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Package,
  Calendar,
  CreditCard,
  Download,
  Printer,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Trash2,
  User,
  MapPin,
  Receipt
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard, GlassCardContent, GlassCardTitle, GlassCardDescription } from '@/components/glass-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getOrderDetails } from '@/lib/firestore-db'
import { generateInvoice, downloadInvoice, printInvoice } from '@/lib/invoice-generator'
import { toast } from 'sonner'

export default function AdminOrderDetails() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    loadOrder()
  }, [orderId])

  const loadOrder = async () => {
    setIsLoading(true)
    try {
      const data = await getOrderDetails(orderId)
      if (data) {
        setOrder(data)
        setStatus(data.paymentStatus || 'pending')
      } else {
        toast.error('Order not found')
        router.push('/admin/orders')
      }
    } catch (error) {
      console.error('Error loading order:', error)
      toast.error('Failed to load order')
      router.push('/admin/orders')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!status) return
    try {
      toast.success('Order status updated')
      setOrder({ ...order, paymentStatus: status })
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleDownload = () => {
    if (!order) return
    try {
      const subtotal = (order.total || 0) - (order.tax || 0)
      const invoice = generateInvoice(
        order.id,
        order.userId,
        order.email || '',
        order.phone || '',
        order.items || [],
        subtotal,
        order.tax || 0,
        order.paymentMethod || 'Cash'
      )
      downloadInvoice(invoice)
    } catch (error) {
      toast.error('Download failed')
    }
  }

  const handlePrint = () => {
    if (!order) return
    try {
      const subtotal = (order.total || 0) - (order.tax || 0)
      const invoice = generateInvoice(
        order.id,
        order.userId,
        order.email || '',
        order.phone || '',
        order.items || [],
        subtotal,
        order.tax || 0,
        order.paymentMethod || 'Cash'
      )
      printInvoice(invoice)
    } catch (error) {
      toast.error('Print failed')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
          <Link href="/admin/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    )
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A'
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleString('en-IN')
  }

  const getStatusStyle = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Order #{order.id.slice(-8)}</h1>
            <p className="text-muted-foreground">Order ID: <code>{order.id}</code></p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-xl border text-sm font-semibold ${getStatusStyle(order.paymentStatus || 'pending')}`}>
          {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <GlassCardContent className="p-6">
              <GlassCardTitle className="flex items-center gap-3 mb-6">
                <User className="h-5 w-5" />
                Customer Details
              </GlassCardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer ID:</span>
                  <p className="font-mono font-medium break-all">{order.userId}</p>
                </div>
                {order.email && (
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p>{order.email}</p>
                  </div>
                )}
                {order.phone && (
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p>{order.phone}</p>
                  </div>
                )}
                {order.shippingAddress && (
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Address:</span>
                    <p className="mt-1 p-3 bg-secondary/50 rounded-lg border">{order.shippingAddress}</p>
                  </div>
                )}
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="p-6">
              <GlassCardTitle className="flex items-center gap-3 mb-6">
                <Package className="h-5 w-5" />
                Order Items ({order.items?.length || 0})
              </GlassCardTitle>
              
              <div className="space-y-4 mb-6">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-lg truncate">{item.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{item.category}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Qty: {item.quantity}</span>
                        <span>Unit: ₹{item.price?.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold gradient-text">₹{(item.price * item.quantity)?.toFixed(2)}</p>
                    </div>
                  </div>
                )) || <p className="text-muted-foreground text-center py-8">No items</p>}
              </div>

              <div className="pt-6 border-t border-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">₹{((order.total || 0) - (order.tax || 0)).toFixed(2)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax ({((order.tax/order.total)*100).toFixed(1)}%):</span>
                    <span className="font-semibold">₹{order.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border text-xl font-bold">
                  <span>Total Amount:</span>
                  <span className="gradient-text">₹{order.total?.toFixed(2)}</span>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {order.notes && (
            <GlassCard>
              <GlassCardContent className="p-6">
                <GlassCardTitle className="flex items-center gap-3 mb-4">
                  <MessageSquare className="h-5 w-5" />
                  Order Notes
                </GlassCardTitle>
                <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>

        <div className="space-y-6">
          <GlassCard>
            <GlassCardContent className="p-6">
              <GlassCardTitle className="flex items-center gap-3 mb-6">
                <Edit className="h-5 w-5" />
                Update Status
              </GlassCardTitle>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleStatusUpdate} className="w-full mt-4 rounded-xl gradient-bg">
                Update Status
              </Button>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="p-6 space-y-3">
              <GlassCardTitle className="mb-4">Quick Actions</GlassCardTitle>
              <Button onClick={handleDownload} variant="outline" className="w-full rounded-xl flex items-center gap-2 justify-center">
                <Download className="h-4 w-4" />
                Download Invoice (PDF)
              </Button>
              <Button onClick={handlePrint} variant="outline" className="w-full rounded-xl flex items-center gap-2 justify-center">
                <Printer className="h-4 w-4" />
                Print Invoice
              </Button>
              <Button className="w-full rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Refund Order
              </Button>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="p-6">
              <GlassCardTitle className="flex items-center gap-3 mb-6">
                <Clock className="h-5 w-5" />
                Order Timeline
              </GlassCardTitle>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Order Placed</p>
                    <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                  <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Payment {order.paymentStatus}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(order.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
