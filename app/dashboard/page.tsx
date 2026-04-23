'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Scan, 
  ShoppingCart, 
  Receipt, 
  TrendingUp, 
  Wallet, 
  Clock, 
  ArrowRight,
  Sparkles,
  ChevronRight,
  Package,
  History,
  MessageSquare,
  Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { GlassCard, GlassCardContent, GlassCardTitle, GlassCardDescription, GlassCardHeader } from '@/components/glass-card'
import { Navigation } from '@/components/navigation'
import { useStore } from '@/lib/store'
import ProtectedRoute from '@/components/protected-route'

export default function DashboardPage() {
  const router = useRouter()
  const { user, cartTotal, cartCount, budget, budgetRemaining, orders } = useStore()

  const budgetUsedPercent = ((budget - budgetRemaining) / budget) * 100
  const recentOrders = orders.slice(0, 3)
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)

  // Smart suggestions based on cart
  const suggestions = [
    { name: 'Fresh Vegetables', reason: 'Complements your cart items' },
    { name: 'Whole Grain Cereal', reason: 'Healthy breakfast option' },
    { name: 'Olive Oil', reason: 'Essential cooking ingredient' },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-24 md:pb-8 md:pt-20">
        <Navigation />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{user?.name || 'Shopper'}</span>
          </h1>
          <p className="text-muted-foreground">Ready to shop? Start scanning products!</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Link href="/scan" className="block">
            <GlassCard hover className="h-full">
              <GlassCardContent className="flex flex-col items-center justify-center text-center py-6">
                <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mb-4">
                  <Scan className="h-7 w-7 text-primary-foreground" />
                </div>
                <GlassCardTitle className="text-base">Start Scanning</GlassCardTitle>
                <GlassCardDescription>Scan products</GlassCardDescription>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/cart" className="block">
            <GlassCard hover className="h-full">
              <GlassCardContent className="flex flex-col items-center justify-center text-center py-6">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4 relative">
                  <ShoppingCart className="h-7 w-7 text-accent-foreground" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <GlassCardTitle className="text-base">View Cart</GlassCardTitle>
                <GlassCardDescription>₹{cartTotal.toFixed(2)}</GlassCardDescription>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/orders" className="block">
            <GlassCard hover className="h-full">
              <GlassCardContent className="flex flex-col items-center justify-center text-center py-6">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <Receipt className="h-7 w-7 text-secondary-foreground" />
                </div>
                <GlassCardTitle className="text-base">My Orders</GlassCardTitle>
                <GlassCardDescription>{orders.length} orders</GlassCardDescription>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/transactions" className="block">
            <GlassCard hover className="h-full">
              <GlassCardContent className="flex flex-col items-center justify-center text-center py-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <History className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <GlassCardTitle className="text-base">Transactions</GlassCardTitle>
                <GlassCardDescription>View history</GlassCardDescription>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/support-tickets" className="block">
            <GlassCard hover className="h-full">
              <GlassCardContent className="flex flex-col items-center justify-center text-center py-6">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <MessageSquare className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <GlassCardTitle className="text-base">Support</GlassCardTitle>
                <GlassCardDescription>Tickets & Help</GlassCardDescription>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/profile" className="block">
            <GlassCard hover className="h-full">
              <GlassCardContent className="flex flex-col items-center justify-center text-center py-6">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <TrendingUp className="h-7 w-7 text-muted-foreground" />
                </div>
                <GlassCardTitle className="text-base">Analytics</GlassCardTitle>
                <GlassCardDescription>View spending</GlassCardDescription>
              </GlassCardContent>
            </GlassCard>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Notifications Widget */}
          <GlassCard>
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <GlassCardTitle>Notifications</GlassCardTitle>
                    <GlassCardDescription>Recent updates</GlassCardDescription>
                  </div>
                </div>
                <Link href="/notifications">
                  <Button variant="ghost" size="sm" className="rounded-xl">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center py-4">
                  Stay updated with your support tickets, orders, and payments
                </p>
                <Link href="/notifications" className="block">
                  <Button className="w-full" variant="outline">
                    <Bell className="h-4 w-4 mr-2" />
                    Check Notifications
                  </Button>
                </Link>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Budget Tracker */}
          <div className="lg:col-span-2">
            <GlassCard>
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <GlassCardTitle>Budget Tracker</GlassCardTitle>
                      <GlassCardDescription>Track your spending in real-time</GlassCardDescription>
                    </div>
                  </div>
                  <Link href="/profile">
                    <Button variant="ghost" size="sm" className="rounded-xl">
                      Edit <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining Budget</p>
                      <p className={`text-3xl font-bold ${budgetRemaining < 0 ? 'text-destructive' : 'gradient-text'}`}>
                        ₹{budgetRemaining.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Budget</p>
                      <p className="text-xl font-semibold">₹{budget.toFixed(2)}</p>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(budgetUsedPercent, 100)} 
                    className="h-3 rounded-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Spent: ₹{(budget - budgetRemaining).toFixed(2)}</span>
                    <span>{budgetUsedPercent.toFixed(0)}% used</span>
                  </div>

                  {budgetRemaining < budget * 0.2 && budgetRemaining > 0 && (
                    <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                      <p className="text-sm text-accent-foreground">
                        <Sparkles className="h-4 w-4 inline mr-2" />
                        You are approaching your budget limit. Consider reviewing your cart.
                      </p>
                    </div>
                  )}
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Stats Card */}
          <GlassCard>
            <GlassCardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <GlassCardTitle>Quick Stats</GlassCardTitle>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">Total Orders</span>
                  </div>
                  <span className="font-semibold">{orders.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">Total Spent</span>
                  </div>
                  <span className="font-semibold">₹{totalSpent.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">Avg. Order</span>
                  </div>
                  <span className="font-semibold">
                    ₹{orders.length > 0 ? (totalSpent / orders.length).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Smart Suggestions */}
        <div className="mt-6">
          <GlassCard>
            <GlassCardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <GlassCardTitle>Smart Suggestions</GlassCardTitle>
                  <GlassCardDescription>AI-powered recommendations based on your cart</GlassCardDescription>
                </div>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {suggestions.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{item.name}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground">{item.reason}</p>
                  </div>
                ))}
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div className="mt-6">
            <GlassCard>
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <GlassCardTitle>Recent Orders</GlassCardTitle>
                  </div>
                  <Link href="/orders">
                    <Button variant="ghost" size="sm" className="rounded-xl">
                      View All <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
                    >
                      <div>
                        <p className="font-medium">Order #{order.id.slice(-6)}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.items.length} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{order.total.toFixed(2)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.paymentStatus === 'completed' 
                            ? 'bg-accent/20 text-accent' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        )}

        {/* Start Shopping CTA */}
        <div className="mt-8">
          <Link href="/scan">
            <GlassCard className="gradient-bg text-center cursor-pointer hover:opacity-90 transition-opacity">
              <GlassCardContent className="py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-4">
                  <Scan className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-primary-foreground mb-2">Start Shopping</h3>
                <p className="text-primary-foreground/80 mb-4">Scan products to add them to your cart instantly</p>
                <Button className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0 rounded-xl">
                  Open Scanner <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </GlassCardContent>
            </GlassCard>
          </Link>
        </div>
      </main>
      </div>
    </ProtectedRoute>
  )
}
