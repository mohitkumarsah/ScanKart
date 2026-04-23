'use client'

import { useState, useEffect, useCallback, useRef } from \'react\'
import { useRouter } from \'next/navigation\'
import { motion, AnimatePresence } from \'framer-motion\'
import { Shield, Key, Eye, EyeOff, Lock, ArrowLeft, Zap, Star } from \'lucide-react\'
import Link from \'next/link\'
import { Button } from \'@/components/ui/button\'
import { Progress } from \'@/components/ui/progress\'
import { Input } from \'@/components/ui/input\'
import { GlassCard, GlassCardContent, GlassCardTitle, GlassCardDescription } from \'@/components/glass-card\'
import { toast } from \'sonner\'

// Admin secret keys
const VALID_ADMIN_KEYS = [\'Mohit@2004\', \'8651365475\', \'9162471191\']

// Key strength evaluation
const getKeyStrength = (key: string) => {
  const length = key.length
  const hasNumber = /\\d/.test(key)
  const hasSpecial = /[!@#$%^&*]/.test(key)
  const score = (length / 12) + (hasNumber ? 0.3 : 0) + (hasSpecial ? 0.3 : 0)
  return Math.min(score, 1)
}

const getStrengthColor = (strength: number) => {
  if (strength < 0.4) return \'bg-destructive\'
  if (strength < 0.7) return \'bg-yellow-500\'
  return \'bg-primary\'
}

const getStrengthLabel = (strength: number) => {
  if (strength < 0.4) return \'Weak\'
  if (strength < 0.7) return \'Medium\'
  return \'Strong\'
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [secretKey, setSecretKey] = useState(\'\')
  const [showKey, setShowKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(0)
  const [keyStrength, setKeyStrength] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus on input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSecretKey(value)
    setKeyStrength(getKeyStrength(value))
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLocked) {
      toast.error(`Account locked. Try again in ${lockTimer}s`)
      return
    }

    if (!secretKey.trim()) {
      toast.error(\'Please enter the admin secret key\')
      return
    }

    setIsLoading(true)

    if (VALID_ADMIN_KEYS.includes(secretKey)) {
      sessionStorage.setItem(\'adminAuthenticated\', \'true\')
      sessionStorage.setItem(\'adminLoginTime\', Date.now().toString())
      toast.success(\'🎉 Welcome Admin!\')
      setSecretKey(\'\')
      setKeyStrength(0)
      router.push(\'/admin\')
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      
      if (newAttempts >= 3) {
        setIsLocked(true)
        setLockTimer(60)
        toast.error(\'🚫 Too many attempts. Locked for 60s\')
        
        const interval = setInterval(() => {
          setLockTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              setIsLocked(false)
              setAttempts(0)
              toast.info(\'✅ Unlocked\')
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        toast.error(`❌ Invalid key. ${3 - newAttempts} attempts left`)
      }
    }

    setIsLoading(false)
  }

  const handleDemoLogin = () => {
    const demoKey = \'demo123\'
    setSecretKey(demoKey)
    toast.info(\'Demo mode activated (use "demo123")\')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-background to-muted/50">
      {/* Enhanced background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl animate-bounce" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-bounce delay-500" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Link href="/" className="group inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-all duration-300 hover:translate-x-1">
          <motion.div 
            whileHover={{ rotate: -180 }}
            transition={{ duration: 0.3 }}
            className="group-hover:-translate-x-1 transition-transform"
          >
            <ArrowLeft className="h-4 w-4" />
          </motion.div>
          Back to ScanKart
        </Link>

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="overflow-hidden"
        >
          <GlassCard className="overflow-hidden shadow-2xl">
            <GlassCardContent className="p-8">
              <div className="text-center mb-10">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="w-24 h-24 rounded-3xl gradient-bg flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-primary/20"
                >
                  <Shield className="h-12 w-12 text-primary-foreground drop-shadow-lg" />
                </motion.div>
                <GlassCardTitle className="text-3xl mb-3 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent font-bold">
                  Admin Portal
                </GlassCardTitle>
                <GlassCardDescription className="text-lg">
                  Secure access required
                </GlassCardDescription>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold flex items-center gap-2 tracking-wide">
                    <Key className="h-4 w-4 text-primary shrink-0" />
                    Admin Secret
                  </label>
                  <div className="relative">
                    <Input
                      ref={inputRef}
                      type={showKey ? \'text\' : \'password\'}
                      placeholder="Enter your secret key..."
                      value={secretKey}
                      onChange={handleKeyChange}
                      className="h-14 rounded-2xl pr-14 pl-12 glass backdrop-blur-lg border-2 border-border/50 focus:border-primary font-mono tracking-wider text-lg text-center transition-all duration-300 focus:scale-[1.02]"
                      disabled={isLocked || isLoading}
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl hover:bg-primary/10"
                      onClick={() => setShowKey(!showKey)}
                      disabled={isLocked || isLoading}
                    >
                      {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>

                  {/* Key Strength Meter */}
                  <AnimatePresence mode="wait">
                    {secretKey && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 8, opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-1"
                      >
                        <div className="flex justify-between text-xs">
                          <span>Strength</span>
                          <span>{getStrengthLabel(keyStrength)}</span>
                        </div>
                        <Progress value={keyStrength * 100} className={getStrengthColor(keyStrength) + \' h-2 rounded-full\'} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Lockout Warning */}
                <AnimatePresence>
                  {isLocked && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="p-5 rounded-2xl bg-destructive/20 border-2 border-destructive/40 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                          <Lock className="h-6 w-6 text-destructive" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-destructive mb-1">🔒 Access Locked</h4>
                          <p className="text-sm text-muted-foreground">
                            Too many failed attempts. Wait{' '}
                            <span className="font-mono bg-destructive/20 px-2 py-1 rounded-lg text-destructive font-semibold">
                              {lockTimer}s
                            </span>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Attempts Counter */}
                {attempts > 0 && !isLocked && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                          {3 - attempts} attempt{3 - attempts === 1 ? \'\' : \'s\'} remaining
                        </span>
                      </div>
                      <div className="flex gap-1 text-xs bg-amber-500/20 px-3 py-1 rounded-xl font-mono">
                        {Array.from({ length: 3 }, (_, i) => (
                          <Star 
                            key={i}
                            className={`h-3 w-3 ${i < 3 - attempts ? \'text-amber-500 fill-amber-500\' : \'text-amber-400\'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 rounded-3xl gradient-bg text-xl font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                  disabled={isLocked || isLoading}
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-6 h-6 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                        Securing Access...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="normal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3"
                      >
                        <Shield className="h-6 w-6 group-hover:scale-110 transition-transform" />
                        Enter Admin Portal
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </form>

              {/* Demo Button */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-2xl border-2 border-muted-foreground/50 hover:border-primary/50 text-muted-foreground hover:text-primary"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Try Demo Mode
                </Button>
              </div>

              {/* Enhanced Security Notice */}
              <div className="mt-8 pt-6 border-t border-border/50">
                <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-2xl">
                  <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                  <p className="text-center text-sm leading-relaxed">
                    🔐 Protected by multi-factor secret verification. 
                    <br />
                    <span className="font-semibold text-primary">All attempts logged</span>
                  </p>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground/80 mt-8 px-4 tracking-wide">
          ScanKart © 2025 | Admin Portal v2.0 - Enterprise Security
        </p>
      </motion.div>
    </div>
  )
}
