'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard,
  Package,
  Receipt,
  TrendingUp,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowLeft,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Moon,
  Sun,
  Filter,
  Download,
  LogOut,
  Activity,
  MessageSquare,
  ExternalLink,
  AlertTriangle,
  Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlassCard, GlassCardContent, GlassCardTitle, GlassCardDescription } from '@/components/glass-card'
import { useStore, type Product } from '@/lib/store'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getAllOrders,
  getRecentOrders,
  getDashboardStats,
  getPopularProducts,
  getSalesOverview,
  getUnreadAdminNotifications,
  getOutOfStockProducts,
  replenishProductStock,
  markAdminNotificationAsRead,
} from '@/lib/firestore-db'

export default function AdminPage() {
  const router = useRouter()
  const { products, orders, isDarkMode, toggleDarkMode } = useStore()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  
  // Real Firestore data
  const [statsData, setStatsData] = useState({
    totalOrders: 0,
    totalSales: 0,
    activeUsers: 0,
    totalProducts: 0,
    averageOrderValue: 0,
  })
  const [recentOrdersData, setRecentOrdersData] = useState<any[]>([])
  const [popularProductsData, setPopularProductsData] = useState<any[]>([])
  const [allOrdersData, setAllOrdersData] = useState<any[]>([])
  const [salesOverviewData, setSalesOverviewData] = useState<any[]>([])
  const [adminNotifications, setAdminNotifications] = useState<any[]>([])
  const [outOfStockProducts, setOutOfStockProducts] = useState<any[]>([])
  const [restockingProduct, setRestockingProduct] = useState<any>(null)
  const [restockQuantity, setRestockQuantity] = useState(0)
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    price: 0,
    barcode: '',
    image: '',
    category: '',
  })

  // Fetch all dashboard data
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData()
    }
  }, [isAuthenticated])

  const loadDashboardData = async () => {
    setIsDataLoading(true)
    try {
      const [stats, recentOrders, popularProducts, allOrders, salesOverview, notifications, outOfStock] = await Promise.all([
        getDashboardStats(),
        getRecentOrders(10),
        getPopularProducts(6),
        getAllOrders(),
        getSalesOverview(),
        getUnreadAdminNotifications(),
        getOutOfStockProducts(),
      ])

      setStatsData(stats)
      setRecentOrdersData(recentOrders || [])
      setPopularProductsData(popularProducts || [])
// setAllOrdersData(allOrders || []) // Moved to dedicated orders page
      setSalesOverviewData(salesOverview || [])
      setAdminNotifications(notifications || [])
      setOutOfStockProducts(outOfStock || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsDataLoading(false)
    }
  }

  const handleRestockProduct = async () => {
    if (!restockingProduct || restockQuantity <= 0) {
      toast.error('Please enter a valid restock quantity')
      return
    }

    try {
      // Use productId from notification, fallback to id
      const productId = restockingProduct.productId || restockingProduct.id
      await replenishProductStock(productId, restockQuantity)
      toast.success(`${restockingProduct.productName || restockingProduct.name} restocked with ${restockQuantity} units!`)
      setRestockingProduct(null)
      setRestockQuantity(0)
      // Reload data
      loadDashboardData()
    } catch (error) {
      console.error('Error restocking product:', error)
      toast.error('Failed to restock product')
    }
  }

  const handleNotificationRead = async (notificationId: string) => {
    try {
      await markAdminNotificationAsRead(notificationId)
      setAdminNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }


  // Check admin authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const adminAuth = sessionStorage.getItem('adminAuthenticated')
      const loginTime = sessionStorage.getItem('adminLoginTime')
      
      if (adminAuth === 'true' && loginTime) {
        // Session expires after 2 hours
        const elapsed = Date.now() - parseInt(loginTime)
        const twoHours = 2 * 60 * 60 * 1000
        
        if (elapsed < twoHours) {
          setIsAuthenticated(true)
        } else {
          // Session expired
          sessionStorage.removeItem('adminAuthenticated')
          sessionStorage.removeItem('adminLoginTime')
          router.push('/admin/login')
        }
      } else {
        router.push('/admin/login')
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated')
    sessionStorage.removeItem('adminLoginTime')
    toast.success('Logged out successfully')
    router.push('/admin/login')
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Mock additional data for analytics
  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode.includes(searchQuery)
  )

  const handleAddProduct = () => {
    if (!productForm.name || !productForm.price || !productForm.barcode) {
      toast.error('Please fill in all required fields')
      return
    }
    // In production, this would save to Firebase
    toast.success('Product added successfully!')
    setIsAddProductOpen(false)
    setProductForm({ name: '', price: 0, barcode: '', image: '', category: '' })
  }

  const statsCards = [
    { 
      icon: DollarSign, 
      label: 'Total Sales', 
      value: `₹${statsData.totalSales.toFixed(2)}`, 
      change: '+12.5%',
      color: 'text-accent'
    },
    { 
      icon: ShoppingCart, 
      label: 'Total Orders', 
      value: statsData.totalOrders, 
      change: '+8.2%',
      color: 'text-primary'
    },
    { 
      icon: Users, 
      label: 'Active Users', 
      value: statsData.activeUsers, 
      change: '+15.3%',
      color: 'text-yellow-500'
    },
    { 
      icon: Package, 
      label: 'Products', 
      value: statsData.totalProducts, 
      change: '+2',
      color: 'text-muted-foreground'
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Admin Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="rounded-xl"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-xl text-destructive hover:text-destructive"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass p-1 rounded-xl">
            <TabsTrigger value="dashboard" className="rounded-lg">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="products" asChild className="rounded-lg">
              <Link href="/admin/products" className="flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <Package className="h-4 w-4 mr-2" />
                Products
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </TabsTrigger>
<TabsTrigger value="orders" asChild className="rounded-lg">
              <Link href="/admin/orders" className="flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <Receipt className="h-4 w-4 mr-2" />
                Orders
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </TabsTrigger>
            <TabsTrigger value="transactions" asChild className="rounded-lg">
              <Link href="/admin/transactions" className="flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <Activity className="h-4 w-4 mr-2" />
                Transactions
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </TabsTrigger>
            <TabsTrigger value="support" asChild className="rounded-lg">
              <Link href="/admin/support" className="flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <MessageSquare className="h-4 w-4 mr-2" />
                Support
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stock Alerts Section */}
            {adminNotifications.length > 0 || outOfStockProducts.length > 0 ? (
              <GlassCard className="border-destructive/50 bg-destructive/5">
                <GlassCardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-destructive mb-2">⚠️ Stock Alerts</h3>
                      <div className="space-y-2">
                        {adminNotifications.slice(0, 3).map((notif: any) => (
                          <div key={notif.id} className="flex items-center justify-between p-2 rounded bg-destructive/10">
                            <div className="text-sm">
                              <p className="font-medium text-destructive">{notif.message}</p>
                              <p className="text-xs text-muted-foreground">Stock: {notif.stockLevel} remaining</p>
                            </div>
                            <Button 
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setRestockingProduct(notif)
                                handleNotificationRead(notif.id)
                              }}
                              className="text-xs"
                            >
                              Restock
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            ) : null}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statsCards.map((stat, index) => (
                <GlassCard key={index}>
                  <GlassCardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      <span className="text-xs text-accent font-medium">{stat.change}</span>
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </GlassCardContent>
                </GlassCard>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <GlassCard>
                <GlassCardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <GlassCardTitle>Recent Orders</GlassCardTitle>
                    <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground">
                      View All
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {isDataLoading ? (
                      <p className="text-center text-muted-foreground py-8">Loading orders...</p>
                    ) : recentOrdersData.length > 0 ? recentOrdersData.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                        <div>
                          <p className="font-medium">#{order.id.slice(-8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.items?.length || 0} items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{(order.total || 0).toFixed(2)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            order.paymentStatus === 'completed'
                              ? 'bg-accent/20 text-accent'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {order.paymentStatus || 'pending'}
                          </span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-center text-muted-foreground py-8">No orders yet</p>
                    )}
                  </div>
                </GlassCardContent>
              </GlassCard>

              {/* Popular Products */}
              <GlassCard>
                <GlassCardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <GlassCardTitle>Popular Products</GlassCardTitle>
                    <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground">
                      View All
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {isDataLoading ? (
                      <p className="text-center text-muted-foreground py-8">Loading products...</p>
                    ) : popularProductsData.length > 0 ? popularProductsData.map((product: any, index: number) => (
                      <div key={product.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.soldCount} sold</p>
                          </div>
                        </div>
                        <p className="font-semibold text-accent">₹{(product.revenue || 0).toFixed(0)}</p>
                      </div>
                    )) : (
                      <p className="text-center text-muted-foreground py-8">No popular products yet</p>
                    )}
                  </div>
                </GlassCardContent>
              </GlassCard>
            </div>

            {/* Analytics Overview */}
            <GlassCard>
              <GlassCardContent className="p-6">
                <GlassCardTitle className="mb-4">Sales Overview (Last 30 Days)</GlassCardTitle>
                <div className="h-64 flex items-end justify-around gap-1">
                  {salesOverviewData.length > 0 ? salesOverviewData.map((item: any) => {
                    const maxSales = Math.max(...salesOverviewData.map((d: any) => d.total))
                    const height = (item.total / maxSales) * 100 || 5
                    return (
                      <div key={item.date} className="flex flex-col items-center gap-2 flex-1">
                        <div 
                          className="w-full gradient-bg rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                          style={{ height: `${height}%`, minHeight: '10px' }}
                          title={`₹${item.total.toFixed(2)} on ${item.date}`}
                        />
                      </div>
                    )
                  }) : (
                    <div className="w-full flex items-center justify-center h-64 text-muted-foreground">
                      <p>No sales data available</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="text-lg font-semibold text-accent">₹{statsData.totalSales.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-lg font-semibold text-primary">{statsData.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Order</p>
                    <p className="text-lg font-semibold text-yellow-500">₹{statsData.averageOrderValue.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-lg font-semibold text-blue-500">{statsData.activeUsers}</p>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 rounded-xl glass border-0"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl gradient-bg">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass">
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                      <DialogDescription>
                        Fill in the details to add a new product to the store
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Product Name *</label>
                        <Input
                          placeholder="e.g. Organic Milk"
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Price *</label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={productForm.price || ''}
                            onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Barcode *</label>
                          <Input
                            placeholder="1234567890123"
                            value={productForm.barcode}
                            onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                            className="h-11 rounded-xl"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Category</label>
                        <Input
                          placeholder="e.g. Dairy, Fruits, Beverages"
                          value={productForm.category}
                          onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Image URL</label>
                        <Input
                          placeholder="https://..."
                          value={productForm.image}
                          onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          className="flex-1 rounded-xl"
                          onClick={() => setIsAddProductOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-1 rounded-xl gradient-bg"
                          onClick={handleAddProduct}
                        >
                          Add Product
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <GlassCard key={product.id}>
                  <GlassCardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold mb-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold gradient-text">₹{product.price.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">#{product.barcode.slice(-6)}</p>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              ))}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="pl-10 h-11 rounded-xl glass border-0"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" className="rounded-xl">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Orders Table */}
            <GlassCard>
              <GlassCardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 font-medium text-muted-foreground">Order ID</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Items</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Total</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isDataLoading ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            Loading orders...
                          </td>
                        </tr>
                      ) : allOrdersData.length > 0 ? allOrdersData.map((order: any) => (
                        <tr key={order.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                          <td className="p-4">
                            <p className="font-medium">#{order.id.slice(-8)}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-muted-foreground">User</p>
                            <p className="text-xs text-muted-foreground">{order.userId?.slice(-8) || 'N/A'}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-medium">{order.items?.length || 0} items</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {order.items?.map((i: any) => i.name).join(', ') || 'No items'}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold">₹{(order.total || 0).toFixed(2)}</p>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.paymentStatus === 'completed'
                                ? 'bg-accent/20 text-accent'
                                : order.paymentStatus === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-600'
                                : 'bg-destructive/20 text-destructive'
                            }`}>
                              {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : 'Pending'}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground text-sm">
                            {order.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="sm" className="rounded-lg">
                              View
                            </Button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            No orders found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>
        </Tabs>

        {/* Restock Product Dialog */}
        <Dialog open={!!restockingProduct} onOpenChange={(open) => {
          if (!open) {
            setRestockingProduct(null)
            setRestockQuantity(0)
          }
        }}>
          <DialogContent className="rounded-2xl glass">
            <DialogHeader>
              <DialogTitle>Restock Product</DialogTitle>
              <DialogDescription>
                Add stock for {restockingProduct?.productName || 'product'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Product</label>
                <div className="p-3 rounded-xl bg-secondary/50">
                  <p className="font-medium">{restockingProduct?.productName}</p>
                  <p className="text-sm text-muted-foreground">Current Stock: {restockingProduct?.stockLevel || 0}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Quantity to Add</label>
                <Input
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Enter quantity"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    setRestockingProduct(null)
                    setRestockQuantity(0)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl gradient-bg"
                  onClick={handleRestockProduct}
                >
                  Restock Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
