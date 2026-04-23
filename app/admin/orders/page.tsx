'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Eye,
  Receipt,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlassCard, GlassCardContent, GlassCardTitle } from '@/components/glass-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getAllOrders } from '@/lib/firestore-db'
import { toast } from 'sonner'

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchQuery, filterStatus])

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const data = await getAllOrders()
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = [...orders]
    
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.userId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.paymentStatus === filterStatus)
    }

    setFilteredOrders(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
      case 'failed': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': 
        return <CheckCircle className="w-4 h-4" />
      case 'pending': 
        return <Clock className="w-4 h-4" />
      case 'failed': 
        return <XCircle className="w-4 h-4" />
      default: 
        return null
    }
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A'
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString('en-IN')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/admin" className="inline-flex items-center text-primary mb-2 hover:underline">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold">All Orders ({filteredOrders.length})</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadOrders} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      <GlassCard className="mb-6">
        <GlassCardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-primary/10 to-accent/10">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Order ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Customer</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Items</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Total</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Date</th>
                  <th className="text-right py-4 px-6 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-sm">#{order.id.slice(-8)}</td>
                    <td className="py-4 px-6">
                      <div className="font-mono text-xs text-muted-foreground mb-1">{order.userId?.slice(-8)}</div>
                      <div>{order.customerName || 'N/A'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium">{order.items?.length || 0} items</div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">
                        {order.items?.[0]?.name || 'No items'}
                        {order.items?.length! > 1 && ` +${order.items.length - 1} more`}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-lg font-bold gradient-text">₹{(order.total || 0).toFixed(2)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.paymentStatus || 'pending')}`}>
                        {getStatusIcon(order.paymentStatus || 'pending')}
                        {order.paymentStatus?.charAt(0).toUpperCase() + (order.paymentStatus || 'pending').slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="rounded-lg flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No orders match your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
