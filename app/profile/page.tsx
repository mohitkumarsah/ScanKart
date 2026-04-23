'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  User, 
  Mail, 
  Phone, 
  Wallet, 
  LogOut, 
  ChevronRight,
  TrendingUp,
  ShoppingCart,
  Receipt,
  Edit,
  Save,
  Moon,
  Sun,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { GlassCard, GlassCardContent, GlassCardTitle, GlassCardDescription } from '@/components/glass-card'
import { Navigation } from '@/components/navigation'
import { useStore } from '@/lib/store'
import { updateUserProfile } from '@/lib/firebase-auth'
import { toast } from 'sonner'

export default function ProfilePage() {
  const router = useRouter()
  const { 
    isAuthenticated, 
    user, 
    setUser, 
    budget, 
    setBudget, 
    orders, 
    isDarkMode, 
    toggleDarkMode 
  } = useStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editBudget, setEditBudget] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (user) {
      setEditName(user.name || '')
      setEditPhone(user.phone || '')
      setEditBudget(budget.toString())
    }
  }, [user, budget])

  if (!isAuthenticated || !user) {
    return null
  }

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

  const handleSave = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      const updatedBudget = parseFloat(editBudget) || 100
      
      // Update user profile in Firestore
      const updatedUser = await updateUserProfile(user.id, {
        name: editName,
        phone: editPhone,
        budget: updatedBudget,
      })

      // Update local state
      setUser({
        ...user,
        name: updatedUser.name,
        phone: updatedUser.phone,
        budget: updatedUser.budget,
      })
      
      setBudget(updatedBudget)
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      console.error('Failed to save profile:', error)
      toast.error(error.message || 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    router.push('/')
    toast.success('Logged out successfully')
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-20">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <GlassCard className="mb-6">
          <GlassCardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center text-3xl font-bold text-primary-foreground">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  {isEditing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-10 rounded-lg mb-2 font-semibold text-xl"
                      placeholder="Your name"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
                  )}
                  <p className="text-muted-foreground">{user.email}</p>
                  {user.phone && (
                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : isEditing ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <Edit className="h-4 w-4" />
                )}
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <GlassCard>
            <GlassCardContent className="p-4 text-center">
              <Receipt className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{totalOrders}</p>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </GlassCardContent>
          </GlassCard>
          <GlassCard>
            <GlassCardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold gradient-text">₹{totalSpent.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </GlassCardContent>
          </GlassCard>
          <GlassCard>
            <GlassCardContent className="p-4 text-center">
              <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">₹{avgOrderValue.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Avg Order</p>
            </GlassCardContent>
          </GlassCard>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Account Settings */}
          <GlassCard>
            <GlassCardContent className="p-6">
              <GlassCardTitle className="mb-4">Account Settings</GlassCardTitle>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    {isEditing ? (
                      <Input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="h-8 rounded-lg mt-1"
                        placeholder="Add phone number"
                      />
                    ) : (
                      <p className="font-medium">{user.phone || 'Not added'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Shopping Budget</p>
                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          value={editBudget}
                          onChange={(e) => setEditBudget(e.target.value)}
                          className="h-8 rounded-lg w-24"
                        />
                      </div>
                    ) : (
                      <p className="font-medium">₹{budget.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 rounded-xl gradient-bg"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Preferences */}
          <div className="space-y-4">
            <GlassCard>
              <GlassCardContent className="p-6">
                <GlassCardTitle className="mb-4">Preferences</GlassCardTitle>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                    <div className="flex items-center gap-3">
                      {isDarkMode ? (
                        <Moon className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Sun className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-muted-foreground">Toggle theme</p>
                      </div>
                    </div>
                    <Switch
                      checked={isDarkMode}
                      onCheckedChange={toggleDarkMode}
                    />
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Admin Access */}
            <Link href="/admin">
              <GlassCard hover className="border-primary/20">
                <GlassCardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Admin Panel</p>
                        <p className="text-sm text-muted-foreground">Manage store</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </GlassCardContent>
              </GlassCard>
            </Link>

            {/* Logout */}
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
