import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  Auth,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  signInAnonymously,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { Twilio } from 'twilio';
import { auth } from './firebase'
import { setDocument, getDocument, addDocument, updateDocument, queryDocuments } from './firestore-db'
import { where, orderBy, limit } from 'firebase/firestore'

export interface AuthUser {
  id: string
  name: string
  email: string
  phone?: string
  photoURL?: string
  createdAt?: Date
  emailVerified?: boolean
}

// Helper function to check if Firebase is initialized
const checkFirebaseInitialized = () => {
  if (!auth) {
    throw new Error('Firebase not initialized. Check your environment variables.')
  }
}

// Sign up with email and password
export const signUp = async (
  email: string,
  password: string,
  name: string,
  phone?: string
): Promise<AuthUser> => {
  checkFirebaseInitialized()
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Send email verification link for new account
    await sendEmailVerification(firebaseUser)

    // Create user document in Firestore (excluding undefined fields)
    const newUser: AuthUser = {
      id: firebaseUser.uid,
      name,
      email,
      ...(phone && { phone }),
      ...(firebaseUser.photoURL && { photoURL: firebaseUser.photoURL }),
      createdAt: new Date(),
      emailVerified: firebaseUser.emailVerified,
    }

    await setDocument('users', firebaseUser.uid, newUser)

    return newUser
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email already registered. Please login instead.')
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password must be at least 6 characters.')
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.')
    }
    throw new Error(error.message || 'Failed to create account')
  }
}

// Login with email and password
export const login = async (email: string, password: string): Promise<AuthUser> => {
  checkFirebaseInitialized()
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    if (!firebaseUser.emailVerified) {
      await sendEmailVerification(firebaseUser)
      throw new Error('Email not verified. A verification link has been sent to your email.')
    }

    // Try to get user data from Firestore
    const userData = await getDocument('users', firebaseUser.uid)

    if (userData) {
      return userData as AuthUser
    }

    // Fallback if Firestore is offline or user doesn't exist
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || email.split('@')[0],
      email: firebaseUser.email || email,
      emailVerified: firebaseUser.emailVerified,
    }
  } catch (error: any) {
    if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password.')
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('User not found. Please sign up.')
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many login attempts. Account temporarily locked. Use "Forgot Password?" to reset and regain access.')
    }
    throw new Error(error.message || 'Failed to login')
  }
}

// Sign in with Google account
export const googleSignIn = async (): Promise<AuthUser> => {
  checkFirebaseInitialized()
  try {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    const result = await signInWithPopup(auth, provider)
    const firebaseUser = result.user

    if (!firebaseUser.emailVerified) {
      await sendEmailVerification(firebaseUser)
      throw new Error('Please verify your Google email address before logging in. Check email for verification link.')
    }

    const existingUser = await getDocument('users', firebaseUser.uid)
    const newUser: AuthUser = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'Google User',
      email: firebaseUser.email || '',
      photoURL: firebaseUser.photoURL || undefined,
      emailVerified: firebaseUser.emailVerified,
      createdAt: new Date(),
    }

    await setDocument('users', firebaseUser.uid, newUser, true)

    return existingUser ? ({ ...existingUser, ...newUser } as AuthUser) : newUser
  } catch (error: any) {
    throw new Error(error.message || 'Google sign in failed')
  }
}

// Logout
export const logout = async (): Promise<void> => {
  checkFirebaseInitialized()
  try {
    await signOut(auth)
  } catch (error: any) {
    throw new Error(error.message || 'Failed to logout')
  }
}

// Send password reset email
export const sendPasswordReset = async (email: string): Promise<void> => {
  checkFirebaseInitialized()
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address.')
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.')
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many password reset requests. Please try again later.')
    }
    throw new Error(error.message || 'Failed to send password reset email')
  }
}

// Listen to auth state changes
export const useAuthListener = (callback: (user: AuthUser | null) => void) => {
  checkFirebaseInitialized()
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        const userData = await getDocument('users', firebaseUser.uid)
        
        // If Firestore data exists, use it; otherwise use Firebase Auth data
        if (userData) {
          callback(userData as AuthUser)
        } else {
          callback({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
          })
        }
      } catch (error: any) {
        console.warn('Failed to fetch user data:', error.message)
        // Still authenticate with basic Firebase Auth info
        callback({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
        })
      }
    } else {
      callback(null)
    }
  })
}

// Get current user
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  checkFirebaseInitialized()
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe()
      if (firebaseUser) {
        try {
          const userData = await getDocument('users', firebaseUser.uid)
          
          if (userData) {
            resolve(userData as AuthUser)
          } else {
            // Return basic user info if Firestore is offline/unavailable
            resolve({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
            })
          }
        } catch (error: any) {
          console.warn('Failed to fetch user data:', error.message)
          // Return basic user info on error
          resolve({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
          })
        }
      } else {
        resolve(null)
      }
    })
  })
}

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: {
    name?: string
    phone?: string
    budget?: number
  }
): Promise<AuthUser> => {
  checkFirebaseInitialized()
  try {
    // Try to get current user data, but don't fail if it doesn't exist
    let currentUser: any = null
    try {
      currentUser = await getDocument('users', userId)
    } catch (error) {
      console.warn('Could not fetch existing user data:', error)
    }

    // Prepare update data with existing data + new updates
    const updateData = {
      id: userId,
      ...(currentUser || {}),
      ...updates,
    }

    // Use setDocument with merge=true to create or update the document
    await setDocument('users', userId, updateData, true)

    return updateData as AuthUser
  } catch (error: any) {
    console.error('Failed to update user profile:', error)
    throw new Error(error.message || 'Failed to update profile')
  }
}

// ========================
// PHONE NUMBER AUTHENTICATION (OTP-BASED)
// ========================

/**
 * Generate a random 6-digit OTP
 */
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send OTP to phone number
 * For production: integrate with Twilio or Firebase Phone Authentication
 */
export const sendPhoneOtp = async (phoneNumber: string, name?: string): Promise<{ otpId: string; expiresAt: Date; otp?: string }> => {
  checkFirebaseInitialized()
  try {
    // Validate phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      throw new Error('Please enter a valid phone number')
    }

    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP in Firestore
    const otpRecord = {
      phone: cleanPhone,
      name: name || '',
      otp,
      expiresAt,
      attempts: 0,
      isVerified: false,
      createdAt: new Date(),
    }

    const otpId = await addDocument('phone_otps', otpRecord)

    // Log to console for development
    console.log(`[DEMO] OTP for ${cleanPhone}: ${otp}`)
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(`📱 Test OTP: ${otp} (Expires in 10 minutes)`)
    }

    // Send real SMS via Twilio
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
    
    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      try {
        const client = twilio(twilioAccountSid, twilioAuthToken) as Twilio;
        await client.messages.create({
          body: `Your ScanKart OTP is ${otp}. Valid for 10 minutes.`,
          from: twilioPhoneNumber,
          to: `+91${cleanPhone}`
        });
        console.log(`✅ SMS sent to +91${cleanPhone}`);
      } catch (smsError) {
        console.error('SMS send failed:', smsError);
        // Non-fatal: OTP still works via console/test in dev
      }
    }

    return { 
      otpId, 
      expiresAt, 
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send OTP')
  }
}

/**
 * Verify OTP and login/register user
 */
export const verifyPhoneOtp = async (otpId: string, enteredOtp: string, userName?: string): Promise<AuthUser> => {
  checkFirebaseInitialized()
  try {
    // Fetch OTP record
    const otpRecord = await getDocument('phone_otps', otpId) as any

    if (!otpRecord) {
      throw new Error('OTP expired or not found. Please request a new one.')
    }

    // Check if OTP is expired
    const expiresAt = otpRecord.expiresAt?.toDate?.() || new Date(otpRecord.expiresAt)
    if (new Date() > expiresAt) {
      throw new Error('OTP has expired. Please request a new one.')
    }

    // Check OTP attempts (max 5)
    if ((otpRecord.attempts || 0) >= 5) {
      throw new Error('Too many failed attempts. Please request a new OTP.')
    }

    // Verify OTP
    if (otpRecord.otp !== enteredOtp.trim()) {
      // Increment attempts
      await updateDocument('phone_otps', otpId, {
        attempts: (otpRecord.attempts || 0) + 1,
      })
      throw new Error('Invalid OTP. Please try again.')
    }

    // Mark OTP as verified
    await updateDocument('phone_otps', otpId, {
      isVerified: true,
      verifiedAt: new Date(),
    })

    const phone = otpRecord.phone
    const name = userName || otpRecord.name || 'Mobile User'

    // Check if user already exists with this phone
    const existingUser = await queryDocuments('users', [where('phone', '==', phone)]) as any[]

    if (existingUser && existingUser.length > 0) {
      // User exists, return existing user (instant login)
      return existingUser[0] as AuthUser
    }

    // Create new user (signup path - instant)
    // Generate anonymous Firebase user for phone login
    const anonUserCred = await signInAnonymously(auth)
    const firebaseUser = anonUserCred.user

    // Create user document
    const newUser: AuthUser = {
      id: firebaseUser.uid,
      name,
      phone,
      email: `phone_${phone}@scankart.local`, // Internal email format
      createdAt: new Date(),
    }

    await setDocument('users', firebaseUser.uid, newUser)

    // Link phone OTP to user
    await updateDocument('phone_otps', otpId, {
      userId: firebaseUser.uid,
      linkedAt: new Date(),
    })

    return newUser
  } catch (error: any) {
    throw new Error(error.message || 'OTP verification failed')
  }
}

/**
 * Resend OTP to phone number
 */
export const resendPhoneOtp = async (phoneNumber: string, name?: string): Promise<{ otpId: string; expiresAt: Date; otp?: string }> => {
  checkFirebaseInitialized()
  try {
    // Cancel previous OTPs for this phone
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const previousOtps = await queryDocuments('phone_otps', [
      where('phone', '==', cleanPhone),
      orderBy('createdAt', 'desc'),
      limit(1),
    ]) as any[]

    if (previousOtps && previousOtps.length > 0) {
      const lastOtp = previousOtps[0]
      const lastAttempt = lastOtp.createdAt?.toDate?.() || new Date(lastOtp.createdAt)
      const timePassed = Date.now() - lastAttempt.getTime()

      // Rate limit: wait 30 seconds between resends
      if (timePassed < 30000) {
        throw new Error(`Please wait ${Math.ceil((30000 - timePassed) / 1000)} seconds before requesting a new OTP`)
      }
    }

    // Send new OTP
    return await sendPhoneOtp(phoneNumber, name)
  } catch (error: any) {
    throw new Error(error.message || 'Failed to resend OTP')
  }
}

/**
 * Combined phone login flow
 */
export const phoneLogin = async (
  phoneNumber: string,
  name?: string
): Promise<{ otpId: string; expiresAt: Date; message: string }> => {
  const result = await sendPhoneOtp(phoneNumber, name)
  
  return {
    ...result,
    message: `OTP sent to ${phoneNumber}. Valid for 10 minutes.`,
  }
}
