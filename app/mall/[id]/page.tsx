'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Star, MapPin, Tag, ArrowLeft, Filter, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard, GlassCardContent } from '@/components/glass-card'
import { Navigation } from '@/components/navigation'
import { useStore } from '@/lib/store'
import { toast } from 'sonner'

export default function MallDetailPage() {
  const router = useRouter()
  const params = useParams()
  const mallId = params.id as string

  const {
    isAuthenticated,
    malls,
    currentMallId,
    setCurrentMallId,
    getProductsByMall,
    getProductsByMallAndCategory,
    addToCart,
    cart,
  } = useStore()

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
      return
    }
    setCurrentMallId(mallId)
  }, [isAuthenticated, mallId, setCurrentMallId, router])

  const mall = malls.find(m => m.id === mallId)
  const mallProducts = selectedCategory
    ? getProductsByMallAndCategory(mallId, selectedCategory)
    : getProductsByMall(mallId)

  const filteredProducts = mallProducts.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isAuthenticated || !mall) {
    return null
  }

  const handleAddToCart = (product: any) => {
    addToCart(product)
    toast.success(`${product.name} added to cart!`)
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-20">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Back Button & Mall Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Malls
          </Button>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{mall.name}</h1>
              <p className="text-muted-foreground mb-3">{mall.description}</p>
              <div className="flex flex-wrap items-center gap-4">
                {mall.rating && (
                  <div className="flex items-center gap-1 bg-amber-100/50 dark:bg-amber-900/30 px-3 py-1 rounded-lg">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span className="text-sm font-semibold">{mall.rating}</span>
                  </div>
                )}
                {mall.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{mall.location}</span>
                  </div>
                )}
                {mall.discount && (
                  <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-lg">
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      {mall.discount}% OFF
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <GlassCard className="mb-6">
          <GlassCardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gaps-2 overflow-x-auto pb-2">
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="whitespace-nowrap"
                >
                  All Categories
                </Button>
                {mall.categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="whitespace-nowrap"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {filteredProducts.map((product) => {
              const cartItem = cart.find(item => item.id === product.id)
              return (
                <GlassCard key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Product Image */}
                  <div className="relative h-40 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
                    <div className="absolute inset-0 gradient-bg opacity-40" />
                    {product.stock && product.stock < 5 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Low Stock
                      </div>
                    )}
                  </div>

                  <GlassCardContent className="p-3">
                    {/* Product Info */}
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{product.category}</p>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-lg font-bold">₹{product.price}</p>
                        {mall.discount && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Save ₹{(product.price * mall.discount / 100).toFixed(0)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      {cartItem ? `In Cart (${cartItem.quantity})` : 'Add to Cart'}
                    </Button>
                  </GlassCardContent>
                </GlassCard>
              )
            })}
          </div>
        ) : (
          <GlassCard className="text-center py-12">
            <GlassCardContent>
              <p className="text-muted-foreground mb-4">No products found</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory(null)
                }}
              >
                Clear Filters
              </Button>
            </GlassCardContent>
          </GlassCard>
        )}

        {/* Pagination Info */}
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
        </div>
      </main>
    </div>
  )
}
