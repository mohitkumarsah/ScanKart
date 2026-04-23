'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Eye,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { GlassCard, GlassCardContent, GlassCardTitle } from '@/components/glass-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  getAllProductsAdmin,
  addProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  approveProduct,
  getUnapprovedProducts,
} from '@/lib/firestore-db'

const CATEGORIES = [
  { value: 'Dairy', label: 'Dairy' },
  { value: 'Bakery', label: 'Bakery' },
  { value: 'Fruits', label: 'Fruits' },
  { value: 'Beverages', label: 'Beverages' },
  { value: 'Pantry', label: 'Pantry' },
  { value: 'Snacks', label: 'Snacks' },
  { value: 'Frozen', label: 'Frozen' },
  { value: 'Organic', label: 'Organic' },
]

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showUnapprovedDialog, setShowUnapprovedDialog] = useState(false)
  const [unapprovedProducts, setUnapprovedProducts] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    barcode: '',
    image: '',
    category: '',
    description: '',
    stock: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadProducts()
    loadUnapprovedProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchQuery, filterStatus])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const data = await getAllProductsAdmin()
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUnapprovedProducts = async () => {
    try {
      const data = await getUnapprovedProducts()
      setUnapprovedProducts(data || [])
    } catch (error) {
      console.error('Error loading unapproved products:', error)
    }
  }

  const filterProducts = () => {
    let filtered = [...products]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.includes(searchQuery) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (filterStatus === 'approved') {
      filtered = filtered.filter(p => p.approved === true)
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(p => p.approved === false)
    }

    setFilteredProducts(filtered)
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.price || !formData.barcode || !formData.category) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await addProductAdmin({
        name: formData.name,
        price: parseFloat(formData.price),
        barcode: formData.barcode,
        image: formData.image,
        category: formData.category,
        description: formData.description,
        stock: formData.stock ? parseInt(formData.stock) : 0,
        approved: true, // Admin-added products are auto-approved
      })

      toast.success('Product added successfully!')
      setFormData({ name: '', price: '', barcode: '', image: '', category: '', description: '', stock: '' })
      setShowEditDialog(false)
      loadProducts()
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error('Failed to add product')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProduct || !formData.name || !formData.price || !formData.barcode) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await updateProductAdmin(selectedProduct.id, {
        name: formData.name,
        price: parseFloat(formData.price),
        barcode: formData.barcode,
        image: formData.image,
        category: formData.category,
        description: formData.description,
        stock: formData.stock ? parseInt(formData.stock) : selectedProduct.stock,
      })

      toast.success('Product updated successfully!')
      setShowEditDialog(false)
      setSelectedProduct(null)
      loadProducts()
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Failed to update product')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      await deleteProductAdmin(productId)
      toast.success('Product deleted successfully!')
      loadProducts()
      loadUnapprovedProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  const handleApproveProduct = async (productId: string) => {
    try {
      await approveProduct(productId)
      toast.success('Product approved!')
      loadProducts()
      loadUnapprovedProducts()
    } catch (error) {
      console.error('Error approving product:', error)
      toast.error('Failed to approve product')
    }
  }

  const openEditDialog = (product: any) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      barcode: product.barcode,
      image: product.image,
      category: product.category || '',
      description: product.description || '',
      stock: product.stock?.toString() || '',
    })
    setShowEditDialog(true)
  }

  const openAddDialog = () => {
    setSelectedProduct(null)
    setFormData({ name: '', price: '', barcode: '', image: '', category: '', description: '', stock: '' })
    setShowEditDialog(true)
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A'
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const stats = {
    total: products.length,
    approved: products.filter(p => p.approved).length,
    pending: products.filter(p => !p.approved).length,
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Link>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold">Product Management</h1>
                <p className="text-muted-foreground">Add, edit, and manage your product catalog</p>
              </div>
            </div>
            <div className="flex gap-2">
              {unapprovedProducts.length > 0 && (
                <Button
                  onClick={() => setShowUnapprovedDialog(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  {unapprovedProducts.length} Pending
                </Button>
              )}
              <Button
                onClick={openAddDialog}
                className="flex items-center gap-2 gradient-bg rounded-xl"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <GlassCard>
            <GlassCardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Products</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Approved</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="mb-6">
          <GlassCardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, barcode, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={loadProducts}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Products List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <GlassCard>
            <GlassCardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No products found</p>
            </GlassCardContent>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <GlassCard key={product.id} className="hover:border-primary/50 transition-all">
                <GlassCardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Product Info */}
                    <div className="flex items-start gap-4 flex-1">
                      {product.image && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{product.name}</h3>
                          {product.approved ? (
                            <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-medium flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Approved
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs font-medium flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Price</p>
                            <p className="font-semibold">₹{product.price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Barcode</p>
                            <p className="font-semibold text-xs">{product.barcode}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Category</p>
                            <p className="font-semibold">{product.category || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Stock</p>
                            <p className="font-semibold">{product.stock || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!product.approved && (
                        <Button
                          onClick={() => handleApproveProduct(product.id)}
                          variant="outline"
                          size="icon"
                          title="Approve product"
                          className="rounded-lg"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        onClick={() => openEditDialog(product)}
                        variant="outline"
                        size="icon"
                        title="Edit product"
                        className="rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteProduct(product.id)}
                        variant="outline"
                        size="icon"
                        title="Delete product"
                        className="rounded-lg"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {product.description && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>
                  )}
                </GlassCardContent>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct
                ? 'Update product details below'
                : 'Fill in the product information. Products added by admin are auto-approved.'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={selectedProduct ? handleUpdateProduct : handleAddProduct}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Product Name*</label>
                <Input
                  placeholder="e.g., Organic Milk"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Price (₹)*</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 65"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Barcode*</label>
                <Input
                  placeholder="e.g., 1234567890123"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={formData.category} onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Image URL</label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Stock</label>
                <Input
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                placeholder="Product description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : selectedProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Unapproved Products Dialog */}
      <Dialog open={showUnapprovedDialog} onOpenChange={setShowUnapprovedDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pending Product Approvals</DialogTitle>
            <DialogDescription>
              Review and approve products waiting for admin approval
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {unapprovedProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No pending products</p>
            ) : (
              unapprovedProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{product.name}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground mb-2">
                        <span>₹{product.price.toFixed(2)}</span>
                        <span>{product.category}</span>
                        <span>Barcode: {product.barcode}</span>
                      </div>
                      {product.description && (
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveProduct(product.id)}
                        size="sm"
                        className="gradient-bg rounded-lg"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleDeleteProduct(product.id)}
                        size="sm"
                        variant="destructive"
                        className="rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
