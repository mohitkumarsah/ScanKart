'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeft,
  Search,
  Filter,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Eye,
  Edit2,
  Archive,
  Mail,
  Send
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { getAllSupportTickets, updateSupportTicket, db, createSupportReplyNotification } from '@/lib/firestore-db'
import { sendSupportReplyEmail } from '@/lib/email-service'

const TICKET_CATEGORIES = [
  { value: 'technical', label: 'Technical Issue' },
  { value: 'payment', label: 'Payment Problem' },
  { value: 'order', label: 'Order Issue' },
  { value: 'product', label: 'Product Question' },
  { value: 'account', label: 'Account Help' },
  { value: 'shipping', label: 'Shipping & Delivery' },
  { value: 'other', label: 'Other' },
]

const TICKET_STATUSES = [
  { value: 'open', label: 'Open', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400' },
]

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-gray-600 dark:text-gray-400' },
  { value: 'normal', label: 'Normal', color: 'text-blue-600 dark:text-blue-400' },
  { value: 'high', label: 'High', color: 'text-orange-600 dark:text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600 dark:text-red-400' },
]

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [filteredTickets, setFilteredTickets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showReplyDialog, setShowReplyDialog] = useState(false)
  const [reply, setReply] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    loadTickets()
  }, [])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchQuery, filterCategory, filterStatus])

  const loadTickets = async () => {
    setIsLoading(true)
    try {
      const data = await getAllSupportTickets()
      setTickets(data || [])
    } catch (error) {
      console.error('Error loading support tickets:', error)
      toast.error('Failed to load support tickets')
    } finally {
      setIsLoading(false)
    }
  }

  const filterTickets = () => {
    let filtered = [...tickets]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory)
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus)
    }

    setFilteredTickets(filtered)
  }

  const handleViewDetails = (ticket: any) => {
    setSelectedTicket(ticket)
    setNewStatus(ticket.status)
    setShowDetails(true)
  }

  const handleStatusUpdate = async () => {
    if (!selectedTicket) return

    try {
      await updateSupportTicket(selectedTicket.id, { status: newStatus })
      
      setTickets(tickets.map(t =>
        t.id === selectedTicket.id ? { ...t, status: newStatus } : t
      ))
      
      setSelectedTicket({ ...selectedTicket, status: newStatus })
      toast.success('Ticket status updated')
    } catch (error) {
      console.error('Error updating ticket:', error)
      toast.error('Failed to update ticket status')
    }
  }

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedTicket) {
      toast.error('Please enter a reply')
      return
    }

    setReplyLoading(true)
    try {
      const replies = selectedTicket.replies || []
      replies.push({
        type: 'admin',
        message: reply,
        senderName: 'Admin Support',
        timestamp: new Date(),
      })

      // Update ticket with reply
      await updateSupportTicket(selectedTicket.id, { 
        replies,
        lastReplyAt: new Date(),
        status: 'in_progress', // Auto-update status to in_progress
      })

      // Create notification for user using the new function
      try {
        await createSupportReplyNotification(
          selectedTicket.userId,
          selectedTicket.id,
          selectedTicket.subject,
          reply
        )
      } catch (notifError) {
        console.warn('Failed to create notification:', notifError)
        // Continue even if notification fails
      }

      // Send email to user
      try {
        await sendSupportReplyEmail(
          selectedTicket.email,
          selectedTicket.name,
          selectedTicket.id,
          selectedTicket.subject,
          reply
        )
        toast.success('Reply sent and email notification delivered!')
      } catch (emailError) {
        console.warn('Email notification failed:', emailError)
        toast.success('Reply sent (email notification could not be delivered)')
      }

      setSelectedTicket({
        ...selectedTicket,
        replies,
        status: 'in_progress',
        lastReplyAt: new Date(),
      })
      setTickets(tickets.map(t =>
        t.id === selectedTicket.id
          ? { ...t, replies, status: 'in_progress', lastReplyAt: new Date() }
          : t
      ))
      setReply('')
    } catch (error) {
      console.error('Error sending reply:', error)
      toast.error('Failed to send reply')
    } finally {
      setReplyLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const st = TICKET_STATUSES.find(s => s.value === status)
    return st?.color || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
  }

  const getCategoryLabel = (category: string) => {
    return TICKET_CATEGORIES.find(c => c.value === category)?.label || category
  }

  const stats = {
    total: filteredTickets.length,
    open: filteredTickets.filter(t => t.status === 'open').length,
    in_progress: filteredTickets.filter(t => t.status === 'in_progress').length,
    resolved: filteredTickets.filter(t => t.status === 'resolved').length,
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
                Support Tickets
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Manage customer support requests</p>
            </div>
            <Button
              onClick={loadTickets}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <GlassCard>
            <GlassCardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-20" />
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Open</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.open}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-20" />
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{stats.in_progress}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400 opacity-20" />
              </div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.resolved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 opacity-20" />
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="mb-6">
          <GlassCardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search ticket ID, subject, name, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 dark:bg-slate-800"
                  />
                </div>
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="dark:bg-slate-800">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="dark:bg-slate-800">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {TICKET_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Tickets Table */}
        <GlassCard>
          <GlassCardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Support Tickets ({filteredTickets.length})
          </GlassCardTitle>

          <GlassCardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No support tickets found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Subject</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                      >
                        <td className="py-3 px-4">
                          <code className="text-xs bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {ticket.id?.substring(0, 8)}...
                          </code>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{ticket.subject}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {ticket.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {getCategoryLabel(ticket.category)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                            {TICKET_STATUSES.find(s => s.value === ticket.status)?.label || ticket.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {ticket.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(ticket)}
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

        {/* Ticket Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Support Ticket Details</DialogTitle>
              <DialogDescription>View and manage ticket responses</DialogDescription>
            </DialogHeader>

            {selectedTicket && (
              <div className="space-y-6">
                {/* Ticket Info */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Ticket ID</p>
                      <p className="font-semibold text-gray-900 dark:text-white break-all">{selectedTicket.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="dark:bg-slate-800 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      {newStatus !== selectedTicket.status && (
                        <Button
                          size="sm"
                          onClick={handleStatusUpdate}
                          className="mt-2 w-full"
                        >
                          Update Status
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Customer Name</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedTicket.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <a href={`mailto:${selectedTicket.email}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                        {selectedTicket.email}
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <a href={`tel:${selectedTicket.phone}`} className="font-semibold text-gray-900 dark:text-white">
                        {selectedTicket.phone || '-'}
                      </a>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {getCategoryLabel(selectedTicket.category)}
                      </p>
                    </div>
                  </div>

                  {selectedTicket.orderNumber && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Order Number</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedTicket.orderNumber}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Subject</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedTicket.subject}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                    <p className="text-gray-900 dark:text-gray-300 whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700" />

                {/* Reply Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Send Reply to Customer</h3>
                  
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <Button
                    onClick={handleSendReply}
                    disabled={replyLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                  >
                    {replyLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send Reply via Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
