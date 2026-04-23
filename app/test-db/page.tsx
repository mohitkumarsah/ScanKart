'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlassCard, GlassCardContent, GlassCardTitle } from '@/components/glass-card'
import { toast } from 'sonner'
import { 
  addDocument, 
  getAllDocuments, 
  findByField,
} from '@/lib/firestore-db'

export default function TestDBPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('checking...')

  // Check Firebase connection on mount
  useEffect(() => {
    checkConnection()
    loadUsers()
  }, [])

  const checkConnection = async () => {
    try {
      const testData = await getAllDocuments('users')
      setConnectionStatus('✅ Connected to Firebase')
      console.log('Firebase connected successfully')
    } catch (error) {
      setConnectionStatus('❌ Firebase connection failed')
      console.error('Firebase error:', error)
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      const userData = await getAllDocuments('users')
      setUsers(userData || [])
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email) {
      toast.error('Name and email are required')
      return
    }

    try {
      setLoading(true)
      const userId = await addDocument('users', {
        name,
        email,
        phone,
        createdAt: new Date().toISOString(),
      })
      
      toast.success(`User added successfully! ID: ${userId}`)
      setName('')
      setEmail('')
      setPhone('')
      loadUsers()
    } catch (error) {
      console.error('Error adding user:', error)
      toast.error('Failed to add user')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTestUsers = async () => {
    try {
      setLoading(true)
      const testUsers = [
        { name: 'John Doe', email: 'john@example.com', phone: '9876543210' },
        { name: 'Jane Smith', email: 'jane@example.com', phone: '9876543211' },
        { name: 'Mike Wilson', email: 'mike@example.com', phone: '9876543212' },
        { name: 'Sarah Johnson', email: 'sarah@example.com', phone: '9876543213' },
        { name: 'Alex Brown', email: 'alex@example.com', phone: '9876543214' },
      ]

      for (const user of testUsers) {
        await addDocument('users', {
          ...user,
          createdAt: new Date().toISOString(),
        })
      }

      toast.success('5 test users added successfully!')
      loadUsers()
    } catch (error) {
      console.error('Error adding test users:', error)
      toast.error('Failed to add test users')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Firebase Database Test</h1>
          <p className="text-muted-foreground">Add and view users in your Firestore database</p>
        </div>

        {/* Connection Status */}
        <GlassCard>
          <GlassCardContent className="p-6">
            <p className="text-lg">
              Database Status: <span className="font-bold">{connectionStatus}</span>
            </p>
          </GlassCardContent>
        </GlassCard>

        {/* Add User Form */}
        <GlassCard>
          <GlassCardTitle className="p-6 pb-0">Add New User</GlassCardTitle>
          <GlassCardContent className="p-6">
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name *</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email *</label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone (optional)</label>
                <Input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1 h-11 rounded-xl gradient-bg"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add User'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                  onClick={handleAddTestUsers}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add 5 Test Users'}
                </Button>
              </div>
            </form>
          </GlassCardContent>
        </GlassCard>

        {/* Users List */}
        <GlassCard>
          <GlassCardTitle className="p-6 pb-0">
            Users in Database ({users.length})
          </GlassCardTitle>
          <GlassCardContent className="p-6">
            {users.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No users found. Add some users above to get started!
              </p>
            ) : (
              <div className="space-y-3">
                {users.map((user, index) => (
                  <div
                    key={user.id}
                    className="p-4 rounded-xl bg-secondary/50 border border-border"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-lg">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.phone && (
                          <p className="text-sm text-muted-foreground">📱 {user.phone}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>ID: {user.id.slice(0, 8)}...</p>
                        {user.createdAt && (
                          <p>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full mt-4 h-11 rounded-xl"
              onClick={loadUsers}
              disabled={loading}
            >
              Refresh Users
            </Button>
          </GlassCardContent>
        </GlassCard>

        {/* Help Section */}
        <GlassCard>
          <GlassCardTitle className="p-6 pb-0">Troubleshooting</GlassCardTitle>
          <GlassCardContent className="p-6 space-y-2 text-sm text-muted-foreground">
            <p>✅ If connection is successful, Firebase is working</p>
            <p>✅ Click "Add 5 Test Users" to populate your database quickly</p>
            <p>✅ Users will appear in your Firestore console under "users" collection</p>
            <p>✅ Click "Refresh Users" to reload the list</p>
            <p>🔗 <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Open Firebase Console
            </a></p>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  )
}
