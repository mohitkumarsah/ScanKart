'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Key, Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlassCard, GlassCardContent, GlassCardTitle, GlassCardDescription } from '@/components/glass-card'
import { toast } from 'sonner'

// Admin secret keys - In production, these should be stored securely in environment variables
const VALID_ADMIN_KEYS = ['Mohit@2004', '8651365475', '9162471191']

export default function AdminLoginPage() {
  const router = useRouter()
  const [secretKey, setSecretKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(0)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLocked) {
      toast.error(`Account locked. Try again in ${lockTimer} seconds.`)
      return
    }

    if (!secretKey.trim()) {
      toast.error('Please enter the admin secret key')
      return
    }

    setIsLoading(true)

    if (VALID_ADMIN_KEYS.includes(secretKey)) {
      // Store admin session
      sessionStorage.setItem('adminAuthenticated', 'true')
      sessionStorage.setItem('adminLoginTime', Date.now().toString())
      
      toast.success('Admin access granted!')
      setSecretKey('')
      router.push('/admin')
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      
      if (newAttempts >= 3) {
        setIsLocked(true)
        setLockTimer(60) // 1 minute lockout instead of 5 minutes
        toast.error('Too many failed attempts. Account locked for 1 minute.')
        
        // Countdown timer
        const interval = setInterval(() => {
          setLockTimer(prev => {
            if (prev <= 1) {
              clearInterval(interval)
              setIsLocked(false)
              setAttempts(0)
              toast.success('Account unlocked. You can try again.')
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        toast.error(`Invalid secret key. ${3 - newAttempts} attempts remaining.`)
      }
    }

    setIsLoading(false)
    setSecretKey('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <GlassCard className="overflow-hidden">
          <GlassCardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="h-10 w-10 text-primary-foreground" />
              </div>
              <GlassCardTitle className="text-2xl mb-2">Admin Access</GlassCardTitle>
              <GlassCardDescription>
                Enter the secret key to access the admin panel
              </GlassCardDescription>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  Secret Key
                </label>
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    placeholder="Enter admin secret key"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="h-12 rounded-xl pr-12 glass border-0 text-center tracking-widest font-mono"
                    disabled={isLocked || isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg"
                    onClick={() => setShowKey(!showKey)}
                    disabled={isLocked}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Locked Warning */}
              {isLocked && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">Access Temporarily Locked</p>
                      <p className="text-sm text-muted-foreground">
                        Try again in {lockTimer} second{lockTimer !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Attempts Warning */}
              {attempts > 0 && !isLocked && (
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
                    {3 - attempts} attempt{3 - attempts !== 1 ? 's' : ''} remaining before lockout
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl gradient-bg text-lg font-semibold"
                disabled={isLocked || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Access Admin Panel
                  </div>
                )}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  This is a protected area. Unauthorized access attempts are logged and may result in legal action.
                </p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          ScanKart Admin Portal - Authorized Personnel Only
        </p>
      </div>
    </div>
  )
}
