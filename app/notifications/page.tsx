'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Bell,
  Filter,
  Search,
  Trash2,
  CheckCircle,
  Eye,
  MessageSquare,
  CreditCard,
  Package,
  AlertCircle,
} from 'lucide-react'
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
import { Navigation } from '@/components/navigation'
import { useStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  db,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/lib/firestore-db'

const NOTIFICATION_TYPES = [
  { value: 'support_reply', label: 'Support Reply', icon: MessageSquare, color: 'bg-blue-100 dark:bg-blue-900/30' },
  { value: 'payment', label: 'Payment', icon: CreditCard, color: 'bg-green-100 dark:bg-green-900/30' },
  { value: 'order', label: 'Order', icon: Package, color: 'bg-purple-100 dark:bg-purple-900/30' },
  { value: 'system', label: 'System', icon: AlertCircle, color: 'bg-yellow-100 dark:bg-yellow-900/30' },
]

export default function NotificationsPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useStore()
  const [notifications, setNotifications] = useState<any[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  useEffect(() => {
    filterNotifications()
  }, [notifications, searchQuery, filterType, filterStatus])

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      if (user?.id) {
        const data = await getUserNotifications(user.id)
        setNotifications(data || [])
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const filterNotifications = () => {
    let filtered = [...notifications]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(n =>
        n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType)
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'unread') {
        filtered = filtered.filter(n => !n.read)
      } else if (filterStatus === 'read') {
        filtered = filtered.filter(n => n.read)
      }
    }

    setFilteredNotifications(filtered)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ))
      toast.success('Marked as read')
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      if (user?.id) {
        await markAllNotificationsAsRead(user.id)
        setNotifications(notifications.map(n => ({ ...n, read: true })))
        toast.success('All notifications marked as read')
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
      setNotifications(notifications.filter(n => n.id !== notificationId))
      setShowDetails(false)
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const getNotificationIcon = (type: string) => {
    const notifType = NOTIFICATION_TYPES.find(t => t.value === type)
    const Icon = notifType?.icon || AlertCircle
    return <Icon className="h-5 w-5" />
  }

  const getNotificationColor = (type: string) => {
    const notifType = NOTIFICATION_TYPES.find(t => t.value === type)
    return notifType?.color || 'bg-gray-100 dark:bg-gray-900/30'
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

  const formatTime = (date: any) => {
    if (!date) return 'N/A'
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
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
              <h1 className="text-2xl md:text-3xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">Stay updated with your activities</p>
            </div>
          </div>
          {stats.unread > 0 && (
            <Button 
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <GlassCard>
            <GlassCardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Notifications</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Unread</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.unread}</p>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="mb-6">
          <GlassCardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="support_reply">Support Reply</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={loadNotifications}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Notifications List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <GlassCard>
            <GlassCardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No notifications found</p>
            </GlassCardContent>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <GlassCard
                key={notification.id}
                className={`hover:border-primary/50 transition-all ${!notification.read ? 'border-primary/50' : ''}`}
              >
                <GlassCardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-medium ${!notification.read ? 'font-bold' : ''}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(notification.createdAt)} • {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button
                          onClick={() => handleMarkAsRead(notification.id)}
                          variant="ghost"
                          size="icon"
                          title="Mark as read"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          setSelectedNotification(notification)
                          setShowDetails(true)
                        }}
                        variant="ghost"
                        size="icon"
                        title="View details"
                      >
                        <MessageSquare className="h-4 w-4" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
            <DialogDescription>
              {formatDate(selectedNotification?.createdAt)} • {formatTime(selectedNotification?.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p className="font-semibold">
                  {NOTIFICATION_TYPES.find(t => t.value === selectedNotification.type)?.label}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Message</label>
                <p className="font-semibold whitespace-pre-wrap text-sm">
                  {selectedNotification.message}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="font-semibold">
                  {selectedNotification.read ? 'Read' : 'Unread'}
                </p>
              </div>

              {selectedNotification.relatedId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Related ID</label>
                  <p className="font-mono text-sm">{selectedNotification.relatedId}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {!selectedNotification.read && (
                  <Button
                    onClick={() => {
                      handleMarkAsRead(selectedNotification.id)
                      setShowDetails(false)
                    }}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Read
                  </Button>
                )}
                <Button
                  onClick={() => {
                    handleDelete(selectedNotification.id)
                  }}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
