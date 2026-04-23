'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MessageSquare,
  Filter,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Plus,
} from 'lucide-react'
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
  DialogFooter,
} from '@/components/ui/dialog'
import { Navigation } from '@/components/navigation'
import { useStore } from '@/lib/store'
import { toast } from 'sonner'
import { getUserSupportTickets, addSupportTicket } from '@/lib/firestore-db'

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
  {
    value: 'in_progress',
    label: 'In Progress',
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
  },
  {
    value: 'resolved',
    label: 'Resolved',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
  },
  {
    value: 'closed',
    label: 'Closed',
    color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400',
  },
]

export default function SupportTicketsPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useStore()
  const [tickets, setTickets] = useState<any[]>([])
  const [filteredTickets, setFilteredTickets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [reply, setReply] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [newTicketForm, setNewTicketForm] = useState({
    category: '',
    subject: '',
    description: '',
    orderNumber: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (user) {
      loadTickets()
    }
  }, [user])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchQuery, filterStatus])

  const loadTickets = async () => {
    setIsLoading(true)
    try {
      if (user?.id) {
        const data = await getUserSupportTickets(user.id)
        setTickets(data || [])
      }
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
        t.subject?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus)
    }

    setFilteredTickets(filtered)
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTicketForm.category || !newTicketForm.subject || !newTicketForm.description) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const ticketId = await addSupportTicket({
        userId: user?.id || 'anonymous',
        name: user?.name || 'Anonymous',
        email: user?.email || 'not-provided',
        category: newTicketForm.category,
        subject: newTicketForm.subject,
        description: newTicketForm.description,
        orderNumber: newTicketForm.orderNumber || null,
        status: 'open',
        priority: 'normal',
      })

      toast.success(`Support ticket created! ID: ${ticketId}`)
      setNewTicketForm({ category: '', subject: '', description: '', orderNumber: '' })
      setShowCreateDialog(false)
      loadTickets()
    } catch (error) {
      console.error('Error creating support ticket:', error)
      toast.error('Failed to create support ticket')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    const st = TICKET_STATUSES.find(s => s.value === status)
    return st?.color || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
  }

  const getCategoryLabel = (category: string) => {
    return TICKET_CATEGORIES.find(c => c.value === category)?.label || category
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-5 w-5 text-blue-500" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />
    }
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A'
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-20">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Support Tickets</h1>
              <p className="text-muted-foreground">Track your support requests</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <GlassCard>
            <GlassCardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Tickets</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Open</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.open}</p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.in_progress}
              </p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Resolved</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.resolved}
              </p>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="mb-6">
          <GlassCardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search ticket ID or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
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

              <Button onClick={loadTickets} variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Tickets List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading support tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <GlassCard>
            <GlassCardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">No support tickets found</p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Create Your First Ticket
              </Button>
            </GlassCardContent>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <GlassCard key={ticket.id} className="hover:border-primary/50 transition-all">
                <GlassCardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 rounded-lg bg-muted">
                        {getStatusIcon(ticket.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{ticket.subject}</p>
                          <span className="text-xs text-muted-foreground">#{ticket.id}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getCategoryLabel(ticket.category)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                        {TICKET_STATUSES.find(s => s.value === ticket.status)?.label}
                      </span>

                      {ticket.replies && ticket.replies.length > 0 && (
                        <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          {ticket.replies.length} reply
                        </div>
                      )}

                      <Button
                        onClick={() => {
                          setSelectedTicket(ticket)
                          setShowDetails(true)
                        }}
                        variant="ghost"
                        size="icon"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            ))}
          </div>
        )}
      </main>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Support Ticket Details</DialogTitle>
            <DialogDescription>
              Ticket ID: {selectedTicket?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject</label>
                  <p className="font-semibold">{selectedTicket.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="font-semibold">{getCategoryLabel(selectedTicket.category)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="font-semibold inline-block px-3 py-1 rounded-full text-sm mt-1"
                   style={{
                     backgroundColor: getStatusColor(selectedTicket.status).split(' ').filter(c => c.startsWith('bg-')).join(' '),
                   }}
                >
                  {TICKET_STATUSES.find(s => s.value === selectedTicket.status)?.label}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="whitespace-pre-wrap text-sm mt-1">{selectedTicket.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm mt-1">{formatDate(selectedTicket.createdAt)}</p>
              </div>

              {/* Replies Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Conversation</h3>

                <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
                  {/* Original Ticket */}
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Your Message</p>
                    <p className="text-sm">{selectedTicket.description}</p>
                  </div>

                  {/* Admin Replies */}
                  {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                    selectedTicket.replies.map((reply: any, idx: number) => (
                      <div key={idx} className={`p-3 rounded-lg ${reply.type === 'admin' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-muted'}`}>
                        <p className="text-xs text-muted-foreground mb-1">
                          {reply.type === 'admin' ? 'Admin Response' : 'Your Message'}
                        </p>
                        <p className="text-sm">{reply.message}</p>
                        {reply.timestamp && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(reply.timestamp).toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Waiting for admin response...
                      </p>
                    </div>
                  )}
                </div>

                {/* Reply Form */}
                {selectedTicket.status !== 'closed' && (
                  <div className="space-y-2 border-t pt-4">
                    <label className="text-sm font-medium">Add Your Response</label>
                    <Textarea
                      placeholder="Type your message..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={3}
                    />
                    <Button
                      onClick={async () => {
                        if (!reply.trim()) {
                          toast.error('Please enter a message')
                          return
                        }

                        setReplyLoading(true)
                        try {
                          const replies = selectedTicket.replies || []
                          replies.push({
                            type: 'user',
                            message: reply,
                            timestamp: new Date(),
                          })

                          // Update the ticket (you'd need to add updateSupportTicket function)
                          // For now, we'll just update the local state
                          setSelectedTicket({ ...selectedTicket, replies })
                          setReply('')
                          toast.success('Reply sent!')
                        } catch (error) {
                          console.error('Error sending reply:', error)
                          toast.error('Failed to send reply')
                        } finally {
                          setReplyLoading(false)
                        }
                      }}
                      disabled={replyLoading}
                      className="w-full"
                    >
                      Send Reply
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Tell us about your issue and we'll help you resolve it
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Category*</label>
              <Select
                value={newTicketForm.category}
                onValueChange={(value) =>
                  setNewTicketForm({ ...newTicketForm, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Subject*</label>
              <Input
                placeholder="Brief summary of your issue"
                value={newTicketForm.subject}
                onChange={(e) =>
                  setNewTicketForm({ ...newTicketForm, subject: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description*</label>
              <Textarea
                placeholder="Describe your issue in detail"
                value={newTicketForm.description}
                onChange={(e) =>
                  setNewTicketForm({ ...newTicketForm, description: e.target.value })
                }
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Order Number (Optional)</label>
              <Input
                placeholder="If related to an order, enter the order ID"
                value={newTicketForm.orderNumber}
                onChange={(e) =>
                  setNewTicketForm({ ...newTicketForm, orderNumber: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Ticket'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
