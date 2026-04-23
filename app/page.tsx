'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Scan, ShoppingCart, Zap, Shield, Smartphone, ArrowRight, Mail, Lock, User, Phone, Eye, EyeOff, LayoutDashboard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlassCard, GlassCardContent, GlassCardTitle, GlassCardDescription } from '@/components/glass-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStore } from '@/lib/store'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { login, signUp, sendPhoneOtp, verifyPhoneOtp, resendPhoneOtp, googleSignIn, sendPasswordReset } from '@/lib/firebase-auth'

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { setUser } = useStore()
  const router = useRouter()

  // Email login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup form state
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  // Admin login form state
  const [adminSecretKey, setAdminSecretKey] = useState('')
  const [showAdminKey, setShowAdminKey] = useState(false)
  const [adminAttempts, setAdminAttempts] = useState(0)
  const [adminLocked, setAdminLocked] = useState(false)
  const [adminLockTimer, setAdminLockTimer] = useState(0)

  // Phone login form state
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneOtpId, setPhoneOtpId] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [testOtp, setTestOtp] = useState('') // For development: displays test OTP
  const [showPhoneForm, setShowPhoneForm] = useState(true) // true = send OTP, false = verify OTP
  const [phoneName, setPhoneName] = useState('')
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(0)
  const [phoneResendDisabled, setPhoneResendDisabled] = useState(false)

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false)

  const VALID_ADMIN_KEYS = ['Mohit@2004', '8651365475', '9162471191']

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const user = await login(loginEmail, loginPassword)
      setUser(user)
      toast.success(`Welcome back, ${user.name}!`)
      setLoginEmail('')
      setLoginPassword('')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const user = await signUp(signupEmail, signupPassword, signupName, signupPhone)
      if (!user.emailVerified) {
        toast.success('Account created. Check your email for the verification link before logging in.')
        setSignupName('')
        setSignupEmail('')
        setSignupPhone('')
        setSignupPassword('')
        setIsLoading(false)
        return
      }
      setUser(user)
      toast.success('Account created successfully!')
      setSignupName('')
      setSignupEmail('')
      setSignupPhone('')
      setSignupPassword('')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Signup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const user = await googleSignIn()
      setUser(user)
      toast.success(`Welcome back, ${user.name}!`)
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Google sign in failed. Please verify your account.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!forgotPasswordEmail.trim()) {
      toast.error('Please enter your email address')
      return
    }

    setIsLoading(true)
    try {
      await sendPasswordReset(forgotPasswordEmail)
      setForgotPasswordSent(true)
      toast.success('Password reset email sent! Check your inbox.')
      setForgotPasswordEmail('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send password reset email.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (adminLocked) {
      toast.error(`Account locked. Try again in ${adminLockTimer} seconds.`)
      return
    }

    if (!adminSecretKey.trim()) {
      toast.error('Please enter the admin secret key')
      return
    }

    setIsLoading(true)

    if (VALID_ADMIN_KEYS.includes(adminSecretKey)) {
      // Store admin session
      sessionStorage.setItem('adminAuthenticated', 'true')
      sessionStorage.setItem('adminLoginTime', Date.now().toString())

      toast.success('Admin access granted!')
      setAdminSecretKey('')
      setAdminAttempts(0)
      router.push('/admin')
    } else {
      const newAttempts = adminAttempts + 1
      setAdminAttempts(newAttempts)

      if (newAttempts >= 3) {
        setAdminLocked(true)
        setAdminLockTimer(60)
        toast.error('Too many failed attempts. Account locked for 1 minute.')

        // Countdown timer
        const interval = setInterval(() => {
          setAdminLockTimer(prev => {
            if (prev <= 1) {
              clearInterval(interval)
              setAdminLocked(false)
              setAdminAttempts(0)
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
    setAdminSecretKey('')
  }

  // Phone login: Send OTP
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number')
      return
    }

    setIsLoading(true)
    try {
      const result = await sendPhoneOtp(phoneNumber, phoneName || 'Mobile User')
      setPhoneOtpId(result.otpId)
      setTestOtp(result.otp || '') // Display test OTP for development
      setShowPhoneForm(false) // Switch to OTP verification
      toast.success('OTP sent successfully! Check console or use test OTP below.')
      
      // Start OTP timer (10 minutes)
      setPhoneOtpTimer(600)
      const interval = setInterval(() => {
        setPhoneOtpTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            setShowPhoneForm(true)
            toast.error('OTP expired. Please request a new one.')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  // Phone login: Verify OTP
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phoneOtp.trim()) {
      toast.error('Please enter the OTP')
      return
    }

    setIsLoading(true)
    try {
      const user = await verifyPhoneOtp(phoneOtpId, phoneOtp, phoneName)
      setUser(user)
      toast.success(`Welcome, ${user.name}!`)
      
      // Reset phone login state
      setPhoneNumber('')
      setPhoneOtp('')
      setPhoneName('')
      setTestOtp('')
      setShowPhoneForm(true)
      setPhoneOtpId('')
      
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'OTP verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Phone login: Resend OTP
  const handleResendPhoneOtp = async () => {
    setPhoneResendDisabled(true)
    try {
      const result = await resendPhoneOtp(phoneNumber, phoneName)
      setPhoneOtpId(result.otpId)
      setTestOtp(result.otp || '') // Update test OTP for development
      setPhoneOtp('') // Clear previous OTP input
      toast.success('New OTP sent!')
      
      // Reset timer
      setPhoneOtpTimer(600)
      const interval = setInterval(() => {
        setPhoneOtpTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP')
    } finally {
      setPhoneResendDisabled(false)
    }
  }

  const features = [
    {
      icon: Scan,
      title: 'Instant Scanning',
      description: 'Scan product barcodes with your phone camera in milliseconds',
    },
    {
      icon: ShoppingCart,
      title: 'Smart Cart',
      description: 'Real-time cart updates with budget tracking and suggestions',
    },
    {
      icon: Zap,
      title: 'Quick Checkout',
      description: 'Pay instantly with UPI, cards, or digital wallets',
    },
    {
      icon: Shield,
      title: 'Secure & Safe',
      description: 'Bank-grade security for all your transactions',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-4 py-12 md:py-24">
        {/* Left Content */}
        <div className="flex-1 max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Smartphone className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Smart Shopping Experience</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span className="text-balance">Scan, Pay & Go with</span>{' '}
            <span className="gradient-text">ScanKart</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-8 text-pretty">
      
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
            {['No Queues', 'Budget Tracking', 'Instant Payment', 'QR Exit'].map((feature) => (
              <span
                key={feature}
                className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: '2.5k', label: 'Active Users' },
              { value: '50l', label: 'Products Scanned' },
              { value: '100%', label: 'Satisfaction' },
            ].map((stat) => (
              <div key={stat.label} className="text-center lg:text-left">
                <div className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content - Auth Forms */}
        <div className="w-full max-w-md">
          <GlassCard className="p-8">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        disabled={isLoading}
                        className="pl-10 h-12 rounded-xl glass border-0 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        disabled={isLoading}
                        className="pl-10 pr-10 h-12 rounded-xl glass border-0 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(!showForgotPassword)
                          setForgotPasswordSent(false)
                          setForgotPasswordEmail('')
                        }}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  {showForgotPassword && (
                    <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3">
                      {!forgotPasswordSent ? (
                        <>
                          <p className="text-sm text-muted-foreground">Enter your email to receive a password reset link.</p>
                          <Input
                            type="email"
                            placeholder="Email address"
                            value={forgotPasswordEmail}
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                            disabled={isLoading}
                            className="h-10 rounded-lg glass border-0 text-sm disabled:opacity-50"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={handleForgotPassword}
                              disabled={isLoading}
                              className="flex-1 h-10 rounded-lg text-sm"
                            >
                              {isLoading ? 'Sending...' : 'Send Reset Link'}
                            </Button>
                            <Button
                              type="button"
                              onClick={() => setShowForgotPassword(false)}
                              variant="outline"
                              className="flex-1 h-10 rounded-lg text-sm"
                              disabled={isLoading}
                            >
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-green-600 dark:text-green-400">✓ Reset link sent to your email!</p>
                          <p className="text-xs text-muted-foreground">Check your inbox and follow the link to reset your password.</p>
                          <Button
                            type="button"
                            onClick={() => {
                              setShowForgotPassword(false)
                              setForgotPasswordSent(false)
                            }}
                            variant="outline"
                            className="w-full h-10 rounded-lg text-sm"
                          >
                            Got it
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl gradient-bg text-primary-foreground font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Full name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      disabled={isLoading}
                      className="pl-10 h-12 rounded-xl glass border-0 disabled:opacity-50"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={isLoading}
                      className="pl-10 h-12 rounded-xl glass border-0 disabled:opacity-50"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Phone number (optional)"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      disabled={isLoading}
                      className="pl-10 h-12 rounded-xl glass border-0 disabled:opacity-50"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      disabled={isLoading}
                      className="pl-10 pr-10 h-12 rounded-xl glass border-0 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl gradient-bg text-primary-foreground font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="mobile">
                {showPhoneForm ? (
                  // Phone Number Entry Form
                  <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name (Optional)</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Your name"
                          value={phoneName}
                          onChange={(e) => setPhoneName(e.target.value)}
                          disabled={isLoading}
                          className="pl-10 h-12 rounded-xl glass border-0 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="+91 XXXXXXXXXX"
                          value={phoneNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            if (value.length <= 15) {
                              setPhoneNumber(e.target.value)
                            }
                          }}
                          disabled={isLoading}
                          className="pl-10 h-12 rounded-xl glass border-0 disabled:opacity-50"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">We'll send a one-time password to this number</p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl gradient-bg text-primary-foreground font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          Send OTP
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  // OTP Verification Form
                  <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <div className="p-3 rounded-xl bg-secondary/20 text-center font-mono text-lg">
                        {phoneNumber}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Enter OTP</label>
                      <Input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={phoneOtp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          if (value.length <= 6) {
                            setPhoneOtp(value)
                          }
                        }}
                        disabled={isLoading}
                        className="h-14 rounded-xl glass border-0 text-center text-2xl font-bold tracking-widest disabled:opacity-50"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        OTP expires in {Math.floor(phoneOtpTimer / 60)}:{String(phoneOtpTimer % 60).padStart(2, '0')}
                      </p>

                      {testOtp && (
                        <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">🧪 Test OTP (Development)</p>
                          <p className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400 text-center">{testOtp}</p>
                          <p className="text-xs text-muted-foreground text-center mt-1">Auto-generated for testing. Use this OTP above.</p>
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl gradient-bg text-primary-foreground font-semibold"
                      disabled={isLoading || phoneOtp.length !== 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify OTP
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <p className="text-xs text-muted-foreground text-center">Didn't receive the OTP?</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-xl"
                        onClick={handleResendPhoneOtp}
                        disabled={phoneResendDisabled || isLoading}
                      >
                        Resend OTP
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full rounded-xl text-xs"
                        onClick={() => {
                          setShowPhoneForm(true)
                          setPhoneNumber('')
                          setPhoneOtp('')
                          setPhoneOtpId('')
                        }}
                        disabled={isLoading}
                      >
                        Change Phone Number
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      Admin Secret Key
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showAdminKey ? 'text' : 'password'}
                        placeholder="Enter admin secret key"
                        value={adminSecretKey}
                        onChange={(e) => setAdminSecretKey(e.target.value)}
                        className="pl-10 pr-10 h-12 rounded-xl glass border-0 text-center tracking-widest font-mono"
                        disabled={adminLocked || isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminKey(!showAdminKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        disabled={adminLocked}
                      >
                        {showAdminKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Admin Locked Warning */}
                  {adminLocked && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30">
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-destructive" />
                        <div>
                          <p className="text-sm font-medium text-destructive">Account Locked</p>
                          <p className="text-xs text-muted-foreground">
                            Try again in {adminLockTimer}s
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Attempts Warning */}
                  {adminAttempts > 0 && !adminLocked && (
                    <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
                        {3 - adminAttempts} attempt{3 - adminAttempts !== 1 ? 's' : ''} remaining
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl gradient-bg text-primary-foreground font-semibold"
                    disabled={adminLocked || isLoading}
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

                  <p className="text-xs text-muted-foreground text-center pt-2">
                    🔐 This is a protected area for administrators only
                  </p>
                </form>
              </TabsContent>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl glass border-0 font-medium"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </Tabs>
          </GlassCard>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="gradient-text">ScanKart</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
        
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <GlassCard key={index} hover className="text-center">
                <GlassCardContent>
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-bg mb-4">
                    <feature.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <GlassCardTitle className="text-lg mb-2">{feature.title}</GlassCardTitle>
                  <GlassCardDescription>{feature.description}</GlassCardDescription>
                </GlassCardContent>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 glass-strong mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center">
              <Scan className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold gradient-text">ScanKart</span>
          </div>
          <p className="text-sm text-muted-foreground">
          Made with ❤️ by the Mohit Kumar
          </p>
        </div>
      </footer>
    </div>
  )
}
