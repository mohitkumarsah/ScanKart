import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { StoreProvider } from '@/lib/store'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'ScanKart - Smart Scan & Go Shopping',
  description: 'Scan, pay, and go! Skip the billing lines with our smart shopping experience.',
  generator: 'ScanKart',
  keywords: ['shopping', 'scan', 'grocery', 'smart cart', 'contactless payment'],
  authors: [{ name: 'ScanKart' }],

}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9fc' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <StoreProvider>
          {/* Background gradient orbs for glassmorphism effect */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse-slow" />
            <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl animate-float" />
          </div>
          {children}
          <Toaster 
            position="top-center" 
            richColors 
            toastOptions={{
              className: 'glass',
            }}
          />
        </StoreProvider>
        <Analytics />
      </body>
    </html>
  )
}
