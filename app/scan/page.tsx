'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Scan, 
  Camera, 
  X, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Flashlight,
  SwitchCamera,
  CheckCircle,
  Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlassCard, GlassCardContent, GlassCardTitle, GlassCardDescription } from '@/components/glass-card'
import { Navigation } from '@/components/navigation'
import { useStore, type Product } from '@/lib/store'
import { toast } from 'sonner'
import { getApprovedProducts, getProductStock } from '@/lib/firestore-db'

export default function ScanPage() {
  const router = useRouter()
  const { isAuthenticated, addToCart, products: mockProducts, getProductByBarcode: getMockProductByBarcode, cart, cartTotal, budgetRemaining } = useStore()
  const [firestoreProducts, setFirestoreProducts] = useState<any[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null)
  const [scannedProductStock, setScannedProductStock] = useState(0)
  const [recentScans, setRecentScans] = useState<Product[]>([])
  const [flashOn, setFlashOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    loadApprovedProducts()
  }, [])

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const loadApprovedProducts = async () => {
    setIsLoadingProducts(true)
    try {
      const data = await getApprovedProducts()
      setFirestoreProducts(data || [])
    } catch (error) {
      console.error('Error loading approved products:', error)
      toast.error('Failed to load products')
      // Fallback to mock products
      setFirestoreProducts(mockProducts)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  // Get product by barcode from Firestore products, fallback to mock
  const getProductByBarcode = (barcode: string) => {
    const product = firestoreProducts.find(p => p.barcode === barcode)
    if (product) {
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        barcode: product.barcode,
        image: product.image,
        category: product.category,
      } as Product
    }
    // Fallback to mock products if not found in Firestore
    return getMockProductByBarcode(barcode)
  }

  const startCamera = async () => {
    setCameraError(null)
    
    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera not supported in this browser. Please use the manual barcode entry below.')
      setIsScanning(true)
      return
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraError(null)
      setIsScanning(true)
    } catch (error: unknown) {
      const err = error as Error
      let errorMessage = 'Could not access camera.'
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings, or use the manual barcode entry below.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device. Please use the manual barcode entry below.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is in use by another application. Please close other apps using the camera.'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not meet requirements. Trying alternative camera...'
        // Try again without facingMode constraint
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
          setCameraError(null)
          setIsScanning(true)
          return
        } catch {
          errorMessage = 'Could not access any camera. Please use the manual barcode entry below.'
        }
      }
      
      setCameraError(errorMessage)
      setIsScanning(true) // Still show scanning UI with error message
      toast.error(errorMessage)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const simulateScan = () => {
    // Simulate scanning a random product from Firestore, or mock if empty
    const availableProducts = firestoreProducts.length > 0 ? firestoreProducts : mockProducts
    const randomData = availableProducts[Math.floor(Math.random() * availableProducts.length)]
    const randomProduct: Product = {
      id: randomData.id,
      name: randomData.name,
      price: randomData.price,
      barcode: randomData.barcode,
      image: randomData.image,
      category: randomData.category,
    }
    handleProductFound(randomProduct)
  }

  const handleProductFound = (product: Product) => {
    setScannedProduct(product)
    // Fetch stock from Firestore
    checkProductStock(product.id)
    setRecentScans(prev => {
      const filtered = prev.filter(p => p.id !== product.id)
      return [product, ...filtered].slice(0, 5)
    })
    toast.success(`Found: ${product.name}`)
  }

  const handleManualSearch = () => {
    if (!manualBarcode.trim()) {
      toast.error('Please enter a barcode')
      return
    }
    
    const product = getProductByBarcode(manualBarcode.trim())
    if (product) {
      handleProductFound(product)
      setManualBarcode('')
    } else {
      toast.error('Product not found. Try one of these demo barcodes: 1234567890123')
    }
  }

  const checkProductStock = async (productId: string) => {
    try {
      const stock = await getProductStock(productId)
      setScannedProductStock(stock)
    } catch (error) {
      console.error('Error checking stock:', error)
      setScannedProductStock(0)
    }
  }

  const addScannedToCart = () => {
    if (scannedProduct) {
      // Check if product has stock
      if (scannedProductStock <= 0) {
        toast.error(`${scannedProduct.name} is out of stock!`)
        return
      }
      addToCart(scannedProduct)
      toast.success(`${scannedProduct.name} added to cart!`)
      setScannedProduct(null)
      setScannedProductStock(0)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-20">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Scan Products</h1>
            <p className="text-muted-foreground">Point your camera at a barcode</p>
          </div>
          <div className="flex items-center gap-2">
            <GlassCard className="px-4 py-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span className="font-semibold">₹{cartTotal.toFixed(2)}</span>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Budget Warning */}
        {budgetRemaining < 500 && budgetRemaining > 0 && (
          <div className="mb-6 p-4 rounded-xl glass border-accent/30">
            <p className="text-accent text-sm font-medium">
              Budget Alert: Only ₹{budgetRemaining.toFixed(2)} remaining
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Scanner Section */}
          <div className="lg:col-span-3">
            <GlassCard className="overflow-hidden">
              <div className="relative aspect-[4/3] bg-black/90 rounded-t-xl overflow-hidden">
                {isScanning ? (
                  <>
                    {cameraError ? (
                      /* Camera Error State */
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 p-6">
                        <div className="w-20 h-20 rounded-2xl bg-destructive/20 flex items-center justify-center mb-4">
                          <Camera className="h-10 w-10 text-destructive" />
                        </div>
                        <p className="text-lg font-medium mb-2 text-center">Camera Unavailable</p>
                        <p className="text-sm text-white/60 mb-4 text-center max-w-xs">{cameraError}</p>
                        <div className="flex flex-col gap-2 w-full max-w-xs">
                          <Button 
                            onClick={() => {
                              stopCamera()
                              startCamera()
                            }} 
                            variant="outline"
                            className="rounded-xl"
                          >
                            Try Again
                          </Button>
                          <Button 
                            onClick={simulateScan} 
                            className="rounded-xl gradient-bg"
                          >
                            <Scan className="h-4 w-4 mr-2" />
                            Demo Scan Instead
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Scanning overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-64 h-48 border-2 border-primary rounded-2xl relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                            {/* Scanning line animation */}
                            <div className="absolute inset-x-4 h-0.5 bg-primary animate-pulse top-1/2" />
                          </div>
                        </div>
                        {/* Camera controls */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-full glass"
                            onClick={() => setFlashOn(!flashOn)}
                          >
                            <Flashlight className={`h-5 w-5 ${flashOn ? 'text-yellow-400' : ''}`} />
                          </Button>
                          <Button
                            size="lg"
                            className="rounded-full gradient-bg px-8"
                            onClick={simulateScan}
                          >
                            <Scan className="h-5 w-5 mr-2" />
                            Capture
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-full glass"
                          >
                            <SwitchCamera className="h-5 w-5" />
                          </Button>
                        </div>
                      </>
                    )}
                    {/* Close button */}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-4 right-4 rounded-full glass"
                      onClick={stopCamera}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80">
                    <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center mb-4">
                      <Camera className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <p className="text-lg font-medium mb-2">Camera Preview</p>
                    <p className="text-sm text-white/60 mb-4">Tap to start scanning</p>
                    <Button onClick={startCamera} className="rounded-xl gradient-bg">
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                )}
              </div>

              {/* Manual Entry */}
              <GlassCardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-3">Or enter barcode manually:</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter barcode number..."
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                    className="h-12 rounded-xl glass border-0"
                  />
                  <Button onClick={handleManualSearch} className="h-12 px-6 rounded-xl gradient-bg">
                    <Scan className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Demo barcodes: 1234567890123, 2345678901234, 3456789012345
                </p>
              </GlassCardContent>
            </GlassCard>

            {/* Quick Scan Demo */}
            {isLoadingProducts ? (
              <div className="mt-4 p-4 rounded-xl glass border border-accent/30 text-center">
                <p className="text-sm text-muted-foreground">Loading products...</p>
              </div>
            ) : (firestoreProducts.length > 0 ? (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">Quick Access Products:</p>
                <div className="flex flex-wrap gap-2">
                  {firestoreProducts.slice(0, 6).map((product: any) => {
                    const productObj: Product = {
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      barcode: product.barcode,
                      image: product.image,
                      category: product.category,
                    }
                    return (
                      <Button
                        key={product.id}
                        variant="outline"
                        size="sm"
                        className="rounded-xl glass border-0"
                        onClick={() => handleProductFound(productObj)}
                      >
                        {product.name}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-xl glass border border-accent/30 text-center">
                <p className="text-sm text-muted-foreground">No approved products available</p>
              </div>
            ))}
          </div>

          {/* Scanned Product & Recent Scans */}
          <div className="lg:col-span-2 space-y-4">
            {/* Scanned Product Card */}
            {scannedProduct && (
              <GlassCard className="border-2 border-primary/30 animate-in fade-in slide-in-from-top-4 duration-300">
                <GlassCardContent className="p-4">
                  <div className="flex items-center gap-2 text-primary mb-3">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Product Found!</span>
                  </div>
                  
                  <div className="flex gap-4 mb-4">
                    <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center">
                      <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{scannedProduct.name}</h3>
                      <p className="text-sm text-muted-foreground">{scannedProduct.category}</p>
                      <p className="text-2xl font-bold gradient-text mt-1">
                        ₹{scannedProduct.price.toFixed(2)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-sm font-semibold px-2 py-1 rounded ${
                          scannedProductStock > 0 
                            ? 'bg-accent/20 text-accent' 
                            : 'bg-destructive/20 text-destructive'
                        }`}>
                          {scannedProductStock > 0 ? `${scannedProductStock} in stock` : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-xl"
                      onClick={() => setScannedProduct(null)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      disabled={scannedProductStock <= 0}
                      className={`flex-1 h-12 rounded-xl ${
                        scannedProductStock <= 0 
                          ? 'bg-destructive/20 text-destructive cursor-not-allowed' 
                          : 'gradient-bg'
                      }`}
                      onClick={addScannedToCart}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </GlassCardContent>
              </GlassCard>
            )}

            {/* Recent Scans */}
            <GlassCard>
              <GlassCardContent className="p-4">
                <GlassCardTitle className="text-base mb-3">Recent Scans</GlassCardTitle>
                {recentScans.length > 0 ? (
                  <div className="space-y-2">
                    {recentScans.map((product) => {
                      const inCart = cart.find(item => item.id === product.id)
                      return (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">₹{product.price.toFixed(2)}</p>
                            </div>
                          </div>
                          {inCart ? (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              In cart ({inCart.quantity})
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-lg"
                              onClick={() => {
                                addToCart(product)
                                toast.success(`${product.name} added to cart!`)
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Scan className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No products scanned yet</p>
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <GlassCard className="gradient-bg">
                <GlassCardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-primary-foreground">
                      <ShoppingCart className="h-5 w-5" />
                      <span className="font-medium">Cart Summary</span>
                    </div>
                    <span className="text-primary-foreground/80">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-primary-foreground mb-3">
                    ₹{cartTotal.toFixed(2)}
                  </p>
                  <Button
                    variant="secondary"
                    className="w-full h-12 rounded-xl bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
                    onClick={() => router.push('/cart')}
                  >
                    View Cart
                  </Button>
                </GlassCardContent>
              </GlassCard>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
