# ScanKart - Detailed Code Examples & Data Flows

## Product Lifecycle Examples

### 1. Adding a Product (Admin Workflow)

**Code Location:** [app/admin/products/page.tsx](app/admin/products/page.tsx#L85-L120)

**Process Flow:**
```
Admin Form Input
    ↓
[Validation Check]
    ↓
Call: addProductAdmin({
  name, price, barcode, image, 
  category, description, stock
})
    ↓
[Database Function]
    ↓
Firestore: products/{auto-generated-id}
    ↓
✅ Toast: "Product added successfully!"
    ↓
Reload products list
```

**Detailed Code Example:**
```typescript
const handleAddProduct = async (e: React.FormEvent) => {
  e.preventDefault()

  // Validation
  if (!formData.name || !formData.price || !formData.barcode || !formData.category) {
    toast.error('Please fill in all required fields')
    return
  }

  setIsSubmitting(true)
  try {
    // Call Firestore function
    await addProductAdmin({
      name: formData.name,
      price: parseFloat(formData.price),
      barcode: formData.barcode,
      image: formData.image,
      category: formData.category,
      description: formData.description,
      stock: formData.stock ? parseInt(formData.stock) : 0,
      approved: true,  // Auto-approved for admin-added products
    })

    toast.success('Product added successfully!')
    
    // Reset form
    setFormData({ name: '', price: '', barcode: '', image: '', 
                   category: '', description: '', stock: '' })
    setShowEditDialog(false)
    
    // Reload list
    loadProducts()
  } catch (error) {
    console.error('Error adding product:', error)
    toast.error('Failed to add product')
  } finally {
    setIsSubmitting(false)
  }
}
```

**Database Implementation:**
```typescript
// [lib/firestore-db.ts]
export const addProductAdmin = async (productData: {
  name: string
  price: number
  barcode: string
  image: string
  category?: string
  description?: string
  stock?: number
  addedBy?: string
  approved?: boolean
}) => {
  checkFirestoreInitialized()
  try {
    const cleanData = removeUndefinedValues(productData)
    const productId = await addDocument('products', {
      ...cleanData,
      approved: productData.approved !== undefined ? productData.approved : false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return productId
  } catch (error) {
    console.error('Error adding product:', error)
    throw error
  }
}
```

---

### 2. Scanning a Product (User Workflow)

**Code Location:** [app/scan/page.tsx](app/scan/page.tsx)

**Process Flow:**

```
User Opens Scan Page
    ↓
[Load Firestore Approved Products]
    getApprovedProducts()
    where('approved', '==', true)
    ↓
[Fallback to Mock Products if empty]
    ↓
┌──────────────────────────────────────┐
│  User Options:                       │
├──────────────────────────────────────┤
│ 1. Click "Start Camera"              │
│    → getUserMedia() camera stream    │
│    → Video shown in preview          │
│    → Click "Demo Scan" button        │
│                                      │
│ 2. Enter Barcode Manually            │
│    → Type in input field             │
│    → Press Enter or click button     │
│                                      │
│ 3. Click Quick Access Product        │
│    → Shows first 6 products          │
└──────────────────────────────────────┘
    ↓
Call: getProductByBarcode(barcode)
    ↓
[Check in Firestore Products]
  products.find(p => p.barcode === barcode)
    ↓
[Fallback to Mock Products if not found]
    ↓
✅ Product Found
    ↓
Call: getProductStock(productId)
    ↓
Display product with:
  - Name, Price, Category
  - Current Stock
  - Add to Cart button
    ↓
Add to Recent Scans (max 5)
    ↓
User clicks "Add to Cart"
    ↓
addToCart(product)
    ↓
Cart updated in state + localStorage
```

**Code Example - Getting Product by Barcode:**
```typescript
const getProductByBarcode = (barcode: string) => {
  // First check Firestore products
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
  // Fallback to mock products
  return getMockProductByBarcode(barcode)
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
```

---

### 3. Shopping Cart to Checkout Flow

**Code Location:** 
- Cart: [app/cart/page.tsx](app/cart/page.tsx)
- Payment: [app/payment/page.tsx](app/payment/page.tsx)

**Complete Flow:**

```
User on Cart Page
    ↓
Display cart items from useStore()
    ↓
┌──────────────────────────┐
│ User Actions:            │
├──────────────────────────┤
│ • Adjust quantity        │
│   updateQuantity(id, Q)  │
│   → Updates cart state   │
│   → Recalculates total  │
│                          │
│ • Remove item            │
│   removeFromCart(id)     │
│   → Removes from array   │
│                          │
│ • Continue Shopping      │
│   → Back to /scan        │
└──────────────────────────┘
    ↓
Calculate totals:
  let cartTotal = 0
  cart.forEach(item => {
    cartTotal += item.price * item.quantity
  })
  
  tax = cartTotal * 0.08  // 8% tax
  finalTotal = cartTotal + tax
    ↓
Display warnings:
  • Budget remaining < 0 (red)
  • Budget remaining < 500 (yellow)
    ↓
User clicks "Proceed to Payment"
    ↓
router.push('/payment')
    ↓
[Payment Page Loads]
    ├─ Check authentication
    ├─ Check cart not empty
    ├─ Display order summary
    │   • Items
    │   • Subtotal
    │   • Tax (8%)
    │   • Final total
    └─ Show payment methods:
       • UPI
       • Card
       • Wallet
    ↓
User selects method + enters details
    ↓
Clicks "Complete Payment"
    ↓
[Processing...]
    ↓
FOR EACH item in cart:
  updateProductStock(productId, quantity)
  → Decrements inventory in Firestore
    ↓
Save order to Firestore:
  addOrder({
    userId, items, total, 
    tax, paymentStatus: 'completed',
    paymentMethod
  })
    ↓
Update local store:
  addOrder(order) → Add to orders array
  deductBudget(finalTotal) → Update budget
    ↓
Generate invoice:
  generateInvoice(
    orderId, userName, email, phone,
    cart, subtotal, taxRate, paymentMethod
  )
    ↓
Create transaction record:
  addTransaction({
    userId, type: 'payment',
    amount: finalTotal, orderId,
    description, status: 'completed'
  })
    ↓
Clear cart:
  clearCart()
    ↓
router.push('/order-success?orderId=ORD-XXX')
    ↓
✅ Show success page with:
  • Order confirmation
  • Download invoice
  • Print invoice
  • Continue shopping button
```

---

## Cart State Management

### Adding to Cart Example

**Code Location:** [lib/store.tsx](lib/store.tsx#L165-L180)

```typescript
// From any page component:
import { useStore } from '@/lib/store'

export default function ScanPage() {
  const { addToCart, cart, cartTotal, cartCount } = useStore()

  const handleAddProduct = (product: Product) => {
    // Add to cart
    addToCart(product)
    
    // Toast feedback
    toast.success(`${product.name} added to cart!`)
    
    // Access updated cart
    console.log('Cart items:', cart)
    console.log('Cart count:', cartCount)
    console.log('Cart total:', cartTotal)
  }
}
```

**Internal Implementation:**
```typescript
const addToCart = (product: Product) => {
  setCart(prev => {
    // Check if product already in cart
    const existing = prev.find(item => item.id === product.id)
    
    if (existing) {
      // Increment quantity
      return prev.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    }
    
    // Add new item with quantity 1
    return [...prev, { ...product, quantity: 1 }]
  })
}

// Auto-save to localStorage
useEffect(() => {
  localStorage.setItem('cart', JSON.stringify(cart))
}, [cart])

// Calculate totals
const cartTotal = cart.reduce(
  (sum, item) => sum + item.price * item.quantity, 
  0
)
const cartCount = cart.reduce(
  (sum, item) => sum + item.quantity, 
  0
)
```

---

## Product Filtering Workflow

### Admin Product Filtering

**Code Location:** [app/admin/products/page.tsx](app/admin/products/page.tsx#L50-L80)

**Real-time Filtering:**
```typescript
// State
const [products, setProducts] = useState<any[]>([])     // All products
const [filteredProducts, setFilteredProducts] = useState<any[]>([])  // Display these
const [searchQuery, setSearchQuery] = useState('')
const [filterStatus, setFilterStatus] = useState('all')

// Auto-filter when any parameter changes
useEffect(() => {
  filterProducts()
}, [products, searchQuery, filterStatus])

// Filtering function
const filterProducts = () => {
  let filtered = [...products]

  // SEARCH FILTER
  if (searchQuery) {
    filtered = filtered.filter(p =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.includes(searchQuery) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // STATUS FILTER
  if (filterStatus === 'approved') {
    filtered = filtered.filter(p => p.approved === true)
  } else if (filterStatus === 'pending') {
    filtered = filtered.filter(p => p.approved === false)
  }

  setFilteredProducts(filtered)
}
```

**UI Implementation:**
```typescript
{/* Search Box */}
<Input
  placeholder="Search products..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>

{/* Status Filter Dropdown */}
<Select value={filterStatus} onValueChange={setFilterStatus}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Products</SelectItem>
    <SelectItem value="approved">Approved Only</SelectItem>
    <SelectItem value="pending">Pending Approval</SelectItem>
  </SelectContent>
</Select>

{/* Display Filtered Results */}
<div className="space-y-4">
  {filteredProducts.map(product => (
    <ProductCard key={product.id} product={product} />
  ))}
</div>
```

---

## Database Query Examples

### Query 1: Get Only Approved Products (for users)

```typescript
// [lib/firestore-db.ts]
export const getApprovedProducts = async () => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('products', [
      where('approved', '==', true),
      orderBy('createdAt', 'desc'),
    ])
  } catch (error) {
    console.warn('Error fetching approved products:', error)
    return []
  }
}
```

**Firestore Equivalent:**
```
Query: products
Where: approved == true
OrderBy: createdAt (descending)

Results: Only approved products, newest first
```

---

### Query 2: Get Unapproved Products (for admin)

```typescript
export const getUnapprovedProducts = async () => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('products', [
      where('approved', '==', false),
      orderBy('createdAt', 'desc'),
    ])
  } catch (error) {
    console.warn('Error fetching unapproved products:', error)
    return []
  }
}
```

---

### Query 3: Get User's Orders

```typescript
export const getUserOrdersHistory = async (userId: string) => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('orders', [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50),  // Last 50 orders
    ])
  } catch (error) {
    console.warn('Error fetching user orders:', error)
    return []
  }
}
```

---

### Query 4: Update Product Stock When Order Placed

```typescript
export const updateProductStock = async (
  productId: string, 
  quantityBought: number
) => {
  checkFirestoreInitialized()
  try {
    const product = await getDocument('products', productId)
    
    if (!product) {
      throw new Error(`Product ${productId} not found`)
    }

    const currentStock = product.stock || 0
    const newStock = Math.max(0, currentStock - quantityBought)

    // Update product
    await updateDocument('products', productId, {
      stock: newStock,
      updatedAt: Timestamp.now(),
    })

    // If out of stock, notify admin
    if (newStock === 0 && currentStock > 0) {
      await createLowStockNotification(productId, product.name, 0)
    }

    return { ...product, stock: newStock }
  } catch (error) {
    console.error('Error updating product stock:', error)
    throw error
  }
}
```

---

## Navigation & Routing Examples

### Protected Route Wrapper

**Code Location:** [components/protected-route.tsx](components/protected-route.tsx)

```typescript
import { PropsWithChildren } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

export default function ProtectedRoute({ children }: PropsWithChildren) {
  const router = useRouter()
  const { isAuthenticated } = useStore()

  if (!isAuthenticated) {
    router.push('/')
    return null
  }

  return children
}
```

**Usage in pages:**
```typescript
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      {/* Dashboard content */}
    </ProtectedRoute>
  )
}
```

---

### Navigation with Cart Badge

**Code Location:** [components/navigation.tsx](components/navigation.tsx#L50-L70)

```typescript
import { useStore } from '@/lib/store'

export function Navigation() {
  const { cartCount } = useStore()

  return (
    <Link href="/cart">
      <div className="relative">
        <ShoppingCart className="h-5 w-5" />
        
        {/* Badge shows only if items in cart */}
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 
                         h-5 w-5 rounded-full 
                         bg-red-500 text-white 
                         text-xs font-bold 
                         flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </div>
    </Link>
  )
}
```

---

## Admin Product Approval Workflow

```
Unapproved Product Found
    ↓
Admin Views: /admin/products → "Pending Approval" tab
    ↓
See list of unapproved products
    ↓
┌────────────────────────────────┐
│ Admin Actions:                 │
├────────────────────────────────┤
│ 1. Click "Approve"             │
│    → approveProduct(productId) │
│    → Sets approved = true      │
│    → Product now visible       │
│    → Users can scan it         │
│                                │
│ 2. Click "Edit"                │
│    → Opens edit dialog         │
│    → Can modify before approve │
│    → Then save                 │
│                                │
│ 3. Click "Delete"              │
│    → deleteProductAdmin(id)    │
│    → Removes from system       │
└────────────────────────────────┘
    ↓
Product status updated in Firestore
    ↓
Lists refresh automatically
```

**Code for Approval:**
```typescript
// [app/admin/products/page.tsx]
const handleApproveProduct = async (productId: string) => {
  try {
    await approveProduct(productId)
    toast.success('Product approved!')
    loadProducts()
  } catch (error) {
    toast.error('Failed to approve product')
  }
}

// [lib/firestore-db.ts]
export const approveProduct = async (productId: string) => {
  checkFirestoreInitialized()
  try {
    await updateDocument('products', productId, {
      approved: true,
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error approving product:', error)
    throw error
  }
}
```

---

## Order Placement & Invoice Generation

### Complete Order Flow with Code

```
1. USER ADDS ITEMS TO CART
   ├─ addToCart(product)
   ├─ Cart state updated
   └─ Saved to localStorage

2. USER VIEWS CART
   ├─ Displays all items
   ├─ Shows subtotal
   ├─ Calculates tax (8%)
   └─ Shows final total

3. USER PROCEEDS TO PAYMENT
   ├─ Validates authentication
   ├─ Validates cart not empty
   └─ router.push('/payment')

4. PAYMENT PAGE LOADS
   ├─ User selects payment method
   ├─ User enters payment details
   └─ User clicks "Complete Payment"

5. PROCESSING PAYMENT
   FOR EACH item in cart:
     await updateProductStock(itemId, itemQuantity)
   └─ Inventory decremented in Firestore

6. SAVE ORDER TO FIRESTORE
   await addOrderToFirestore({
     userId: user.id,
     items: cart,
     total: finalTotal,
     tax: cartTotal * 0.08,
     paymentStatus: 'completed',
     paymentMethod: 'UPI'|'Card'|'Wallet'
   })

7. UPDATE LOCAL STATE
   ├─ addOrder(order) → Add to orders array
   ├─ deductBudget(finalTotal) → Update budget
   └─ clearCart() → Empty cart

8. GENERATE INVOICE
   const invoice = generateInvoice(
     orderId,
     userName,
     email,
     phone,
     cart,
     cartTotal,
     0.08,  // tax rate
     paymentMethod
   )

9. CREATE TRANSACTION RECORD
   await addTransaction({
     userId: user.id,
     type: 'payment',
     amount: finalTotal,
     orderId: orderId,
     description: `Payment for order ${orderId}`,
     status: 'completed'
   })

10. SUCCESS
    ├─ Show order confirmation
    ├─ Display invoice download
    ├─ Display invoice print option
    └─ Offer continue shopping
```

---

## Data Structure Reference

### Complete Product Object (from Firestore)
```typescript
{
  id: "prod_abc123",              // Document ID
  name: "Organic Milk",
  price: 65,
  barcode: "1234567890123",
  image: "/products/milk.jpg",
  category: "Dairy",
  description: "100% pure organic milk",
  stock: 50,
  approved: true,
  addedBy: "admin_user_123",
  createdAt: Timestamp { seconds: 1708934400, ... },
  updatedAt: Timestamp { seconds: 1708934400, ... }
}
```

### Complete Cart State
```typescript
cart: [
  {
    // Product fields + quantity
    id: "prod_abc123",
    name: "Organic Milk",
    price: 65,
    barcode: "1234567890123",
    image: "/products/milk.jpg",
    category: "Dairy",
    quantity: 2  // Added field
  },
  {
    id: "prod_def456",
    name: "Fresh Apples",
    price: 120,
    barcode: "3456789012345",
    image: "/products/apples.jpg",
    category: "Fruits",
    quantity: 1
  }
]

// Calculated values
cartTotal: 250         // (65*2) + (120*1)
cartCount: 3           // 2 + 1
```

### Complete Order Object (saved to Firestore)
```typescript
{
  id: "ORD-23XKABC123",
  userId: "user_789",
  items: [
    {
      id: "prod_abc123",
      name: "Organic Milk",
      price: 65,
      quantity: 2,
      barcode: "1234567890123",
      category: "Dairy"
    },
    // ... more items
  ],
  total: 270,             // With tax
  tax: 0.08,              // 8% tax rate
  paymentStatus: "completed",
  paymentMethod: "UPI",
  createdAt: Timestamp { seconds: 1708934800, ... }
}
```

