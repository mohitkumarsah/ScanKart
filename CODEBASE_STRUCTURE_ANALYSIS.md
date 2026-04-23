# ScanKart Codebase Structure & Implementation Analysis

## 📋 Table of Contents
1. Current Product Structure
2. Shopping Cart Implementation
3. Page Structure Overview
4. Product Filtering & Display
5. Firestore Database Structure
6. Categories & Filtering Logic
7. Navigation Flow

---

## 1. Current Product Structure

### Product Data Model
**File:** [lib/store.tsx](lib/store.tsx#L11-L18)

```typescript
export interface Product {
  id: string
  name: string
  price: number
  barcode: string
  image: string
  category?: string
  stock?: number           // Product quantity in inventory
  approved?: boolean       // Product approval status
}
```

### Product Sources
The application uses **two sources** for products:

#### A. Mock Products (Demo/Fallback)
**Location:** [lib/store.tsx](lib/store.tsx#L54-L64)

10 hardcoded demo products with categories:
```typescript
const mockProducts: Product[] = [
  { id: '1', name: 'Organic Milk', price: 65, barcode: '1234567890123', 
    image: '/products/milk.jpg', category: 'Dairy', stock: 50 },
  { id: '2', name: 'Whole Wheat Bread', price: 45, barcode: '2345678901234',
    image: '/products/bread.jpg', category: 'Bakery', stock: 30 },
  // ... more products in categories: Dairy, Bakery, Fruits, Beverages, Pantry
]
```

**Demo Barcodes for Testing:**
- 1234567890123 (Organic Milk)
- 2345678901234 (Whole Wheat Bread)
- 3456789012345 (Fresh Apples)
- 4567890123456 (Orange Juice)
- 5678901234567 (Greek Yogurt)
- 6789012345678 (Premium Coffee)
- 7890123456789 (Organic Eggs)
- 8901234567890 (Avocados)
- 9012345678901 (Pasta Sauce)
- 0123456789012 (Brown Rice)

#### B. Firestore Products (Production)
**Location:** `products` collection in Firestore

Products fetched from Firestore have additional fields:
```typescript
{
  id: string (document ID)
  name: string
  price: number
  barcode: string
  image: string
  category: string
  description?: string
  stock: number
  approved: boolean        // Only approved products shown to users
  addedBy?: string        // Admin who added it
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Product Retrieval Flow

**For Users (Scan Page):**
[app/scan/page.tsx](app/scan/page.tsx#L1-L50)

1. Load approved products from Firestore: `getApprovedProducts()`
2. Fall back to mock products if empty or error
3. Look up product by barcode: `getProductByBarcode(barcode)`
4. Check stock: `getProductStock(productId)`

**For Admin (Admin Products Page):**
[app/admin/products/page.tsx](app/admin/products/page.tsx#L1-L100)

1. Get all products (including unapproved): `getAllProductsAdmin()`
2. Get unapproved products separately: `getUnapprovedProducts()`
3. Filter by status (approved/pending/all)

---

## 2. Shopping Cart Implementation

### Cart Data Model
**File:** [lib/store.tsx](lib/store.tsx#L19-L22)

```typescript
export interface CartItem extends Product {
  quantity: number
}
```

### Cart State & Operations
**File:** [lib/store.tsx](lib/store.tsx)

#### Store Context State:
```typescript
{
  // Cart items array
  cart: CartItem[]
  
  // Cart operations
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  
  // Cart totals
  cartTotal: number         // Sum of (price × quantity)
  cartCount: number         // Total items in cart
  
  // Budget tracking
  budget: number
  budgetRemaining: number
  setBudget: (amount: number) => void
  deductBudget: (amount: number) => void
}
```

#### Cart Logic:
[lib/store.tsx](lib/store.tsx#L165-L200)

```typescript
// Add to cart or increment quantity
const addToCart = (product: Product) => {
  setCart(prev => {
    const existing = prev.find(item => item.id === product.id)
    if (existing) {
      return prev.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    }
    return [...prev, { ...product, quantity: 1 }]
  })
}

// Calculate totals
const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
```

#### Persistence:
- **Local Storage**: Cart saved to localStorage on every change
- **On Load**: Cart restored from localStorage (persists between sessions)

### Cart Display
**File:** [app/cart/page.tsx](app/cart/page.tsx)

Shows:
- List of cart items with prices & quantities
- Item removal and quantity adjustment controls
- Cart subtotal and 8% tax calculation
- Final total with budget warning
- "Clear Cart" button
- Link to checkout/payment

---

## 3. Page Structure Overview

### Application Pages

| Page | Route | Purpose | Features |
|------|-------|---------|----------|
| **Landing/Login** | `/` | User authentication | Email/SMS login, signup, admin login, Google OAuth |
| **Dashboard** | `/dashboard` | Home page | Quick actions, budget tracker, recent orders, notifications |
| **Scan Products** | `/scan` | Main shopping | Barcode scanner (camera), manual barcode entry, recent scans |
| **Cart** | `/cart` | Review items | Item list, quantity control, budget warnings, checkout |
| **Payment** | `/payment` | Checkout | Payment methods (UPI/Card/Wallet), invoice generation |
| **Orders** | `/orders` | Order history | List of all user orders with status |
| **Order Details** | `/orders/[id]` | Order view | Complete order info, items, download invoice |
| **Profile** | `/profile` | User settings | Budget management, profile info, spending analytics |
| **Transactions** | `/transactions` | Transaction history | Payment/refund logs with filters |
| **Support Tickets** | `/support-tickets` | Help & support | Create/view support issues with admin replies |
| **Notifications** | `/notifications` | Notification center | View all notifications, mark as read |
| **Admin Login** | `/admin/login` | Admin access | Secret key authentication |
| **Admin Products** | `/admin/products` | Product management | Add/edit/delete/approve products, view unapproved list |
| **Admin Dashboard** | `/admin` | Analytics | Sales stats, popular products, active users |
| **Admin Support** | `/admin/support` | Support management | Manage tickets, reply to users |
| **Product Info** | `/product-info` | QR code details | View product details from scanned QR code |

### Page Components Structure

Each page follows this pattern:
```
page.tsx
├── useRouter() - for navigation
├── useStore() - for cart/user/orders state
├── Navigation component - header/mobile nav
├── Main content area
└── Protected routes where needed (ProtectedRoute wrapper)
```

**Protected Pages** require authentication check:
- /dashboard, /scan, /cart, /payment
- /orders, /profile, /transactions
- /support-tickets, /notifications

---

## 4. Product Filtering & Display

### Current Filtering Implementation

#### In Scan Page
**File:** [app/scan/page.tsx](app/scan/page.tsx#L40-L80)

**No filtering UI currently**, but supports:
1. **Recent Scans**: Shows last 5 scanned products
2. **Quick Access**: Shows first 6 approved products as buttons
3. **Manual Search**: By barcode number
4. **Demo Products**: Buttons to quickly demo scan products

#### In Admin Products Page
**File:** [app/admin/products/page.tsx](app/admin/products/page.tsx#L50-L120)

**Filtering Options:**
```typescript
// Status filter
setFilterStatus: 'all' | 'approved' | 'pending'

// Search filter
searchQuery: string
// Searches: product name, barcode, category
```

**Applied Logic:**
```typescript
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
```

### Potential Filtering Enhancements
Currently missing but could be added:
- ❌ Category filter in scan page
- ❌ Price range filter
- ❌ Stock availability filter
- ❌ Product search by name
- ❌ Sorting options (name, price, popularity)

---

## 5. Firestore Database Structure

### Collections Overview

```
Firestore Database
├── products/          - All products (admin adds)
├── orders/           - User orders
├── users/            - User profiles
├── support_tickets/  - Help tickets
├── transactions/     - Payment transactions
├── notifications/    - User notifications
└── admin_logs/       - Admin action logs
```

### Detailed Collection Schemas

#### **1. Products Collection**
**Location:** [lib/firestore-db.ts](lib/firestore-db.ts#L799-L850)

```typescript
products/{productId}
{
  name: string                    // e.g., "Organic Milk"
  price: number                   // e.g., 65
  barcode: string                 // e.g., "1234567890123" (unique identifier)
  image: string                   // URL or path
  category: string                // "Dairy", "Bakery", "Fruits", etc.
  description?: string            // Product details
  stock: number                   // Current inventory
  approved: boolean               // Visibility to users (true=visible)
  addedBy?: string               // Admin ID who added product
  createdAt: Timestamp           // Auto-generated
  updatedAt: Timestamp           // Auto-updated on modification
}
```

**Key Database Functions:**
- `addProductAdmin(productData)` - Add new product
- `getAllProductsAdmin()` - Get all products (admin view)
- `getApprovedProducts()` - Get approved products (user view)
- `getProductByIdAdmin(productId)` - Get single product
- `updateProductAdmin(productId, updates)` - Update product
- `approveProduct(productId)` - Approve product
- `deleteProductAdmin(productId)` - Delete product
- `getUnapprovedProducts()` - Get pending approval products
- `updateProductStock(productId, quantityBought)` - Update inventory

#### **2. Orders Collection**
**Location:** [lib/firestore-db.ts](lib/firestore-db.ts#L900+)

```typescript
orders/{orderId}
{
  userId: string                  // User who placed order
  items: CartItem[]              // Array of purchased items
  total: number                   // Final amount paid (with tax)
  tax: number                     // Tax percentage (0.08 = 8%)
  paymentStatus: "completed"|"pending"|"failed"
  paymentMethod: "UPI"|"Card"|"Wallet"
  createdAt: Timestamp           // Order date/time
  updatedAt?: Timestamp          // Last status change
}
```

**Each CartItem in orders:**
```typescript
{
  id: string                    // Product ID
  name: string
  price: number
  quantity: number
  barcode: string
  category?: string
  image?: string
}
```

**Key Database Functions:**
- `addOrder(orderData)` - Save new order
- `getUserOrdersHistory(userId)` - Get user's orders
- `getOrderDetails(orderId)` - Get specific order
- `updateOrderStatus(orderId, status)` - Update order status
- `getAllOrders()` - Admin: get all orders

#### **3. Users Collection**
```typescript
users/{userId}
{
  name: string
  email: string
  phone?: string
  photoURL?: string
  budget?: number               // User's shopping budget
  emailVerified: boolean
  createdAt: Timestamp
}
```

#### **4. Support Tickets Collection**
**Location:** [lib/firestore-db.ts](lib/firestore-db.ts#L320-L380)

```typescript
support_tickets/{ticketId}
{
  userId: string
  name: string
  email: string
  phone?: string
  category: "technical"|"payment"|"order"|"product"|"account"|"shipping"|"other"
  subject: string
  description: string
  orderNumber?: string          // Related order (optional)
  status: "open"|"in_progress"|"resolved"|"closed"
  priority: "low"|"normal"|"high"|"urgent"
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### **5. Transactions Collection**
**Location:** [lib/firestore-db.ts](lib/firestore-db.ts#L406-L450)

```typescript
transactions/{transactionId}
{
  userId: string
  type: "payment"|"refund"|"order"|"scan"
  amount?: number                // Transaction amount
  orderId?: string               // Related order
  description: string            // Transaction note
  status: "pending"|"completed"|"failed"
  metadata?: object              // Additional data
  createdAt: Timestamp
}
```

#### **6. Notifications Collection**
**Location:** [lib/firestore-db.ts](lib/firestore-db.ts#L470+)

```typescript
notifications/{notificationId}
{
  userId: string
  type: "support_reply"|"payment"|"order"|"system"
  title: string
  message: string                // Preview/main message
  relatedId?: string             // Ticket/Order ID
  read: boolean
  createdAt: Timestamp
  readAt?: Timestamp
}
```

### Firestore Query Functions
**File:** [lib/firestore-db.ts](lib/firestore-db.ts)

**Basic CRUD Operations:**
- `addDocument(collection, data)` - Create
- `getDocument(collection, docId)` - Read single
- `getAllDocuments(collection)` - Read all
- `updateDocument(collection, docId, data)` - Update
- `deleteDocument(collection, docId)` - Delete

**Advanced Queries:**
- `queryDocuments(collection, constraints)` - Query with filters
- `findByField(collection, field, value)` - Find by specific field
- `subscribeToDocument()` - Real-time single doc updates
- `subscribeToQuery()` - Real-time collection updates
- `batchWrite(operations)` - Multiple operations

---

## 6. Categories & Filtering Logic

### Current Categories
**File:** [app/admin/products/page.tsx](app/admin/products/page.tsx#L27-L34)

```typescript
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
```

### Product Approval Workflow

**Two-tier product system:**

1. **Admin-added Products** → Auto-approved
   ```typescript
   approved: productData.approved !== undefined ? productData.approved : false
   ```
   When admin uses form, they can set approved = true

2. **User-submitted Products** (if enabled) → Pending approval
   ```typescript
   approved: false
   ```
   Shown in admin's "Unapproved Products" list

**Admin Actions:**
- View unapproved products
- Approve individual products: `approveProduct(productId)`
- Edit/update product properties
- Delete products

### Filtering by Approval Status

**Queries:**
```typescript
// Show only approved to users
getApprovedProducts()
→ where('approved', '==', true).orderBy('createdAt', 'desc')

// Show all to admin
getAllProductsAdmin()
→ getAllDocuments('products')

// Show only unapproved to admin
getUnapprovedProducts()
→ where('approved', '==', false).orderBy('createdAt', 'desc')
```

### Stock Management

**Stock Tracking:**
```typescript
// When product added: stock field saved
export const addProductAdmin = async (productData) => {
  // ...
  stock: productData.stock !== undefined ? productData.stock : 0
}

// When order placed: stock decremented
export const updateProductStock = async (productId, quantityBought) => {
  const product = await getDocument('products', productId)
  const currentStock = product.stock || 0
  const newStock = Math.max(0, currentStock - quantityBought)
  
  // Update product
  await updateDocument('products', productId, { stock: newStock })
  
  // Create notification if out of stock
  if (newStock === 0 && currentStock > 0) {
    await createLowStockNotification(productId, product.name, 0)
  }
}

// Check stock before adding to cart
const checkProductStock = async (productId: string) => {
  const stock = await getProductStock(productId)
  setScannedProductStock(stock)
  
  // In UI: prevent add if stock <= 0
  if (scannedProductStock <= 0) {
    toast.error(`${scannedProduct.name} is out of stock!`)
    return
  }
}
```

---

## 7. Navigation Flow

### Main Navigation Structure
**File:** [components/navigation.tsx](components/navigation.tsx)

```
┌─────────────────────────────────────┐
│     ScanKart Navigation             │
├─────────────────────────────────────┤
│  Desktop (Fixed Header)             │
│  ├─ Logo/Brand                      │
│  ├─ Nav Items:                      │
│  │  • Home (/dashboard)             │
│  │  • Scan (/scan)                  │
│  │  • Cart (/cart) [with badge]     │
│  │  • Profile (/profile)            │
│  ├─ Dark Mode Toggle                │
│  └─ Settings Dropdown:              │
│     • Admin Panel                   │
│     • Help & Support                │
│     • Logout                        │
│                                     │
│  Mobile (Bottom Tab Navigation)     │
│  ├─ Home                            │
│  ├─ Scan                            │
│  ├─ Cart [with badge]               │
│  ├─ Profile                         │
│  └─ Settings                        │
└─────────────────────────────────────┘
```

### Navigation Context
**File:** [lib/store.tsx](lib/store.tsx)

```typescript
// Global navigation state
{
  user: User | null
  isAuthenticated: boolean
  isDarkMode: boolean
  toggleDarkMode: () => void
  cartCount: number                 // Used for cart badge
  logout: () => Promise<void>
}
```

### Route Protection
**File:** [components/protected-route.tsx](components/protected-route.tsx)

Pages using protection:
```typescript
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

**Manual checks** in pages:
```typescript
useEffect(() => {
  if (!isAuthenticated) {
    router.push('/')
  }
}, [isAuthenticated, router])
```

### User Flow Diagram

```
START
  ↓
┌─────────────┐
│   Landing   │ ← Unauthenticated
└──────┬──────┘
       ↓ (Login/Signup)
┌──────────────┐
│  Dashboard   │ ← Authenticated (home page)
└──────┬───────┘
       ├─→ Scan Page
       │   ├─ Take photo/scan barcode
       │   ├─ See product details
       │   └─ Add to cart
       │       ↓
       ├─→ Cart Page
       │   ├─ Review items
       │   ├─ Adjust quantities
       │   └─ Proceed to payment
       │       ↓
       ├─→ Payment Page
       │   ├─ Select payment method
       │   ├─ Enter payment info
       │   └─ Complete payment
       │       ↓
       ├─→ Order Success
       │   └─ Download invoice
       │
       ├─→ Orders Page
       │   ├─ View order history
       │   └─ Click order for details
       │
       ├─→ Profile Page
       │   ├─ Manage budget
       │   ├─ View analytics
       │   └─ Update settings
       │
       ├─→ Support Tickets
       │   ├─ Create ticket
       │   ├─ View replies
       │   └─ Track status
       │
       └─→ Admin (if admin user)
           ├─ Product Management
           ├─ Support Management
           └─ Sales Dashboard
```

### Authentication Flow
**File:** [lib/firebase-auth.ts](lib/firebase-auth.ts)

```
User Action              Firebase Auth           Store (Local State)
    ↓                          ↓                          ↓
Email/Password Login → authenticate,
                       get user data    
                                      → Create User object → useStore.setUser()
                                                             → Save to localStorage

Phone OTP Login      → Send OTP,
                       verify OTP,
                       authenticate        → Create User object → useStore.setUser()

Google OAuth         → Authenticate,
                       get profile         → Create User object → useStore.setUser()

Admin Login          → Check secret key,
                       no Firebase auth    → Set admin flag → useStore.setUser()

Logout               → Firebase signOut   → setUser(null) → Clear localStorage
                                           → router.push('/')
```

### State Management Flow

```
Global State (Zustand/Context Pattern)
│
├─ User State
│  ├─ user: User | null
│  ├─ isAuthenticated: boolean
│  └─ Authorization-based page access
│
├─ Cart State
│  ├─ cart: CartItem[]
│  ├─ cartTotal: number
│  ├─ cartCount: number
│  └─ Persisted in localStorage
│
├─ Budget State
│  ├─ budget: number (initial: 2000)
│  ├─ budgetRemaining: number
│  └─ Persisted in localStorage
│
├─ Orders State
│  ├─ orders: Order[]
│  ├─ addOrder(order)
│  └─ From both localStorage AND Firestore
│
└─ Theme State
   ├─ isDarkMode: boolean
   └─ Persisted in localStorage

Used via: const store = useStore()
```

---

## Summary of Key Files

| File | Purpose | Key Content |
|------|---------|-------------|
| [lib/store.tsx](lib/store.tsx) | Global state management | Product, Cart, User, Budget interfaces & context |
| [lib/firestore-db.ts](lib/firestore-db.ts) | Database operations | All Firestore queries & admin functions |
| [lib/firebase-auth.ts](lib/firebase-auth.ts) | Authentication | Email, phone, Google sign-up/login |
| [components/navigation.tsx](components/navigation.tsx) | Main navigation | Desktop & mobile nav with cart badge |
| [app/scan/page.tsx](app/scan/page.tsx) | Product scanning | Barcode scanner, product search, add to cart |
| [app/cart/page.tsx](app/cart/page.tsx) | Shopping cart | Item list, quantity control, budget warnings |
| [app/payment/page.tsx](app/payment/page.tsx) | Checkout | Payment processing, invoice generation, order save |
| [app/admin/products/page.tsx](app/admin/products/page.tsx) | Product management | CRUD operations for products, approval workflow |
| [app/orders/page.tsx](app/orders/page.tsx) | Order history | Display user's Firestore orders |
| [app/transactions/page.tsx](app/transactions/page.tsx) | Transaction history | Payment/refund transaction logs |
| [app/support-tickets/page.tsx](app/support-tickets/page.tsx) | Help system | Support tickets with two-way messaging |

---

## Technology Stack

**Frontend:**
- Next.js 15.2.0 (React 19)
- TypeScript
- Tailwind CSS
- Radix UI Components

**Backend:**
- Firebase Authentication (Email, Phone OTP, Google)
- Firestore (Database)
- Cloud Functions (optional, for backend logic)

**Key Libraries:**
- `firebase` ^11.10.0 - Authentication & Firestore
- `qrcode` ^1.5.4 - QR code generation
- `recharts` 2.15.0 - Analytics charts
- `sonner` ^1.7.1 - Toast notifications

