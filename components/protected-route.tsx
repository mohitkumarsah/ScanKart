'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Protected Route Wrapper
 * Ensures only authenticated users can access the page
 * Redirects unauthorized users to login
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { user } = useStore()

  useEffect(() => {
    // Check if user is authenticated
    if (!user || !user.id) {
      // Redirect to login if not authenticated
      router.push('/')
      return
    }
  }, [user, router])

  // Show nothing while checking authentication
  if (!user || !user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  // Show protected content if authenticated
  return children
}
