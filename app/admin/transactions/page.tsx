'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeft,
  Search,
  Filter,
  Download,
  Eye,
  ChevronDown,
  TrendingUp,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlassCard, GlassCardContent, GlassCardTitle } from '@/components/glass-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { getAllTransactions } from '@/lib/firestore-db'

const TRANSACTION_TYPES = [
  { value: 'payment', label: 'Payment' },
  { value: 'refund', label: 'Refund' },
  { value: 'order', label: 'Order' },
  { value: 'scan', label: 'Product Scan' },
]

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
  failed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
}

const STATUS_ICONS: Record<string, any> = {
  completed: CheckCircle,
  pending: Clock,
  failed: XCircle,
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadTransactions()
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchQuery, filterType, filterStatus])

  const loadTransactions = async () => {
    setIsLoading(true)
    try {
      const data = await getAllTransactions()
      setTransactions(data || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = [...transactions]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.userId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType)
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus)
    }

    setFilteredTransactions(filtered)
  }

  const handleViewDetails = (transaction: any) => {
    setSelectedTransaction(transaction)
    setShowDetails(true)
  }

  const handleExport = () => {
    const csv = [
      ['Transaction ID', 'User ID', 'Type', 'Amount', 'Status', 'Date', 'Description'].join(','),
      ...filteredTransactions.map(t =>
        [
          t.id,
          t.userId,
          t.type,
          t.amount || '-',
          t.status,
          t.createdAt?.toDate?.()?.toLocaleDateString() || '-',
          t.description,
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Transactions exported successfully')
  }

  const getStatusIcon = (status: string) => {
    const Icon = STATUS_ICONS[status] || AlertCircle
    return <Icon className="w-5 h-5" />
  }

  const getTotalAmount = () => {
    return filteredTransactions
      .filter(t => t.type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
  }

  const stats = {
    total: filteredTransactions.length,
    completed: filteredTransactions.filter(t => t.status === 'completed').length,
    pending: filteredTransactions.filter(t => t.status === 'pending').length,
    failed: filteredTransactions.filter(t => t.status === 'failed').length,
    totalAmount: getTotalAmount(),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Link>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Transaction Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">View and manage all system transactions</p>
            </div>
            <Button
              onClick={loadTransactions}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <GlassCard>
            <GlassCardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-20" />
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 opacity-20" />
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400 opacity-20" />
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.failed}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 opacity-20" />
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                    ₹{stats.totalAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 opacity-20" />
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="mb-6">
          <GlassCardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search transaction ID, user ID, order ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 dark:bg-slate-800"
                  />
                </div>
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="dark:bg-slate-800">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {TRANSACTION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="dark:bg-slate-800">
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

            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Transactions Table */}
        <GlassCard>
          <GlassCardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Transactions ({filteredTransactions.length})
          </GlassCardTitle>

          <GlassCardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">User ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                      >
                        <td className="py-3 px-4">
                          <code className="text-xs bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {transaction.id?.substring(0, 8)}...
                          </code>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {transaction.userId?.substring(0, 10)}...
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {transaction.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                          {transaction.amount ? `₹${transaction.amount.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[transaction.status] || STATUS_COLORS.pending}`}>
                            {getStatusIcon(transaction.status)}
                            <span className="capitalize">{transaction.status}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {transaction.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(transaction)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Transaction Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>Complete transaction information</DialogDescription>
            </DialogHeader>

            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Transaction ID</p>
                    <p className="font-semibold text-gray-900 dark:text-white break-all">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">User ID</p>
                    <p className="font-semibold text-gray-900 dark:text-white break-all">{selectedTransaction.userId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">{selectedTransaction.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mt-1 ${STATUS_COLORS[selectedTransaction.status]}`}>
                      {getStatusIcon(selectedTransaction.status)}
                      <span className="capitalize">{selectedTransaction.status}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedTransaction.amount ? `₹${selectedTransaction.amount.toLocaleString('en-IN')}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedTransaction.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '-'}
                    </p>
                  </div>
                </div>

                {selectedTransaction.orderId && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Order ID</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedTransaction.orderId}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedTransaction.description}</p>
                </div>

                {selectedTransaction.metadata && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Additional Details</p>
                    <pre className="bg-gray-100 dark:bg-slate-800 p-3 rounded text-xs overflow-auto">
                      {JSON.stringify(selectedTransaction.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
