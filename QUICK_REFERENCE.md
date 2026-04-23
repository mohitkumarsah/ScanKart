# ScanKart - Quick Reference Guide

## 🔍 Quick File Lookup by Feature

### Features vs Implementation Files

#### 🛒 Shopping Cart
- **Main State:** [lib/store.tsx](lib/store.tsx#L11-L30) - `CartItem` interface, cart operations
- **Cart Display:** [app/cart/page.tsx](app/cart/page.tsx) - User cart interface
- **Add to Cart:** [app/scan/page.tsx](app/scan/page.tsx#L190-L210) - Add button logic
- **Cart Persistence:** [lib/store.tsx](lib/store.tsx#L135-L145) - localStorage integration

#### 📦 Product Management
- **Product Model:** [lib/store.tsx](lib/store.tsx#L11-L18) - `Product` interface
- **Admin Add:** [app/admin/products/page.tsx](app/admin/products/page.tsx#L85-L100) - Add product form
- **Firestore Ops:** [lib/firestore-db.ts](lib/firestore-db.ts#L799-L950) - Database functions
- **Product Display:** [app/scan/page.tsx](app/scan/page.tsx#L40-L80) - Show products in UI

#### 🔐 Authentication
- **Auth Functions:** [lib/firebase-auth.ts](lib/firebase-auth.ts) - All auth methods
- **Login Page:** [app/page.tsx](app/page.tsx) - Landing & auth forms
- **Protected Routes:** [components/protected-route.tsx](components/protected-route.tsx) - Route protection
- **User State:** [lib/store.tsx](lib/store.tsx#L35-L50) - User management

#### 💳 Payment & Orders
- **Payment Flow:** [app/payment/page.tsx](app/payment/page.tsx) - Payment processing
- **Order Saving:** [app/payment/page.tsx](app/payment/page.tsx#L60-L100) - Save to Firestore
- **Order History:** [app/orders/page.tsx](app/orders/page.tsx) - Display orders
- **Invoice Gen:** [lib/invoice-generator.ts](lib/invoice-generator.ts) - PDF invoices

#### 🎯 Product Filtering
- **Admin Filter:** [app/admin/products/page.tsx](app/admin/products/page.tsx#L50-L80) - Search/filter logic
- **Barcode Search:** [app/scan/page.tsx](app/scan/page.tsx#L100-L120) - Manual barcode entry
- **Quick Access:** [app/scan/page.tsx](app/scan/page.tsx#L380-L400) - Product shortcuts

#### 📱 Navigation
- **Nav Component:** [components/navigation.tsx](components/navigation.tsx) - Desktop & mobile nav
- **Cart Badge:** [components/navigation.tsx](components/navigation.tsx#L50-L70) - Cart count indicator
- **Routing:** [app/layout.tsx](app/layout.tsx) - App structure

#### 💾 Database
- **Queries:** [lib/firestore-db.ts](lib/firestore-db.ts#L1-L200) - Core DB functions
- **Products:** [lib/firestore-db.ts](lib/firestore-db.ts#L799-L900) - Product operations
- **Orders:** [lib/firestore-db.ts](lib/firestore-db.ts#L900-L950) - Order operations
- **Config:** [lib/firebase.ts](lib/firebase.ts) - Firebase init

---

## 📊 Data Model Reference

### Quick Type Definitions

```typescript
// Product
{
  id: string
  name: string
  price: number
  barcode: string
  image: string
  category?: string
  stock?: number
  approved?: boolean
}

// CartItem (Product + quantity)
extends Product
{
  quantity: number
}

// Order
{
  id: string
  userId: string
  items: CartItem[]
  total: number
  paymentStatus: 'completed' | 'pending' | 'failed'
  createdAt: Date
}

// User
{
  id: string
  name: string
  email: string
  phone?: string
  photoURL?: string
  budget?: number
}
```

---

## 🔧 Common Operations

### Add Product to Cart
```typescript
import { useStore } from '@/lib/store'

const { addToCart } = useStore()
addToCart({ id: '1', name: 'Milk', price: 65, ... })
```

### Get Approved Products
```typescript
import { getApprovedProducts } from '@/lib/firestore-db'

const products = await getApprovedProducts()
// where approved === true
```

### Update Cart Quantity
```typescript
const { updateQuantity } = useStore()
updateQuantity('product_id', 3)  // Set to 3 items
```

### Save Order to Firestore
```typescript
import { addOrder } from '@/lib/firestore-db'

await addOrder({
  userId: user.id,
  items: cart,
  total: finalTotal,
  paymentStatus: 'completed'
})
```

### Approve Product
```typescript
import { approveProduct } from '@/lib/firestore-db'

await approveProduct('product_id')
// Sets approved: true in Firestore
```

### Get User's Orders
```typescript
import { getUserOrdersHistory } from '@/lib/firestore-db'

const orders = await getUserOrdersHistory('user_id')
```

### Create Support Ticket
```typescript
import { addSupportTicket } from '@/lib/firestore-db'

await addSupportTicket({
  userId: user.id,
  name: user.name,
  email: user.email,
  category: 'payment',
  subject: 'Issue title',
  description: 'Issue details',
  status: 'open',
  priority: 'high'
})
```

---

## 🎨 UI Components Location

**All UI Components:** `components/ui/`

| Component | File | Used For |
|-----------|------|----------|
| Button | `button.tsx` | All clickable buttons |
| Card | `card.tsx` | Content containers |
| Input | `input.tsx` | Text fields |
| Dialog | `dialog.tsx` | Modal popups |
| Select | `select.tsx` | Dropdowns |
| Badge | `badge.tsx` | Status labels |
| Tabs | `tabs.tsx` | Tab switching |
| Table | `table.tsx` | Data tables |
| Toast | `toast.tsx` | Notifications |
| Alert | `alert.tsx` | Info messages |

**Custom Components:** `components/`

| Component | File | Used For |
|-----------|------|----------|
| GlassCard | `glass-card.tsx` | Glassmorphism containers |
| Navigation | `navigation.tsx` | App navigation |
| ProtectedRoute | `protected-route.tsx` | Route protection |
| ThemeProvider | `theme-provider.tsx` | Dark mode |

---

## 🗄️ Database Collections

### Collection Structure

```
Firestore/
├── products/
│   ├── {productId}
│   │   ├── name: string
│   │   ├── price: number
│   │   ├── barcode: string (unique)
│   │   ├── category: string
│   │   ├── stock: number
│   │   ├── approved: boolean
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│   └── ...
│
├── orders/
│   ├── {orderId}
│   │   ├── userId: string
│   │   ├── items: array (CartItem[])
│   │   ├── total: number
│   │   ├── paymentStatus: string
│   │   ├── createdAt: timestamp
│   │   └── ...
│   └── ...
│
├── users/
│   ├── {userId}
│   │   ├── name: string
│   │   ├── email: string
│   │   ├── phone: string
│   │   ├── budget: number
│   │   └── createdAt: timestamp
│   └── ...
│
├── transactions/
│   ├── {transactionId}
│   │   ├── userId: string
│   │   ├── type: string (payment/refund/order)
│   │   ├── amount: number
│   │   ├── status: string
│   │   └── createdAt: timestamp
│   └── ...
│
└── support_tickets/
    ├── {ticketId}
    │   ├── userId: string
    │   ├── subject: string
    │   ├── category: string
    │   ├── status: string
    │   └── createdAt: timestamp
    └── ...
```

---

## 🔄 State Management Patterns

### Using useStore Hook
```typescript
import { useStore } from '@/lib/store'

export default function MyComponent() {
  const {
    // User
    user,
    isAuthenticated,
    setUser,
    logout,
    
    // Cart
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartCount,
    
    // Budget
    budget,
    budgetRemaining,
    setBudget,
    deductBudget,
    
    // Orders
    orders,
    addOrder,
    
    // Products
    products,
    getProductByBarcode,
    
    // Theme
    isDarkMode,
    toggleDarkMode,
  } = useStore()

  return (
    // Use values here
  )
}
```

### Local Component State
```typescript
// For form inputs, UI toggles, temporary data
const [formData, setFormData] = useState({
  name: '',
  email: ''
})

const [isLoading, setIsLoading] = useState(false)
const [selectedProduct, setSelectedProduct] = useState(null)
```

### Firestore Real-time Subscriptions
```typescript
import { subscribeToQuery } from '@/lib/firestore-db'

useEffect(() => {
  const unsubscribe = subscribeToQuery(
    'products',
    [where('approved', '==', true)],
    (products) => {
      setProducts(products)
    }
  )
  
  return () => unsubscribe()
}, [])
```

---

## 🔗 Route Structure

```
/                          → Landing (auth)
├── /dashboard             → Home
├── /scan                  → Barcode scanner
├── /cart                  → Shopping cart
├── /payment               → Checkout
├── /orders                → Order history
│   └── /orders/[id]       → Order details
├── /profile               → User settings
├── /transactions          → Transaction log
├── /support-tickets       → Help/tickets
├── /notifications         → Notification center
├── /product-info          → QR code details
├── /admin/login           → Admin login
├── /admin                 → Admin dashboard
├── /admin/products        → Product management
└── /admin/support         → Support management
```

---

## 📱 Responsive Design

### Breakpoints (Tailwind)
- `md:` = 768px (desktop features activate)
- Mobile layout default
- Navigation responsive: mobile bottom nav ↔ desktop top nav

### Key Responsive Classes
```
Desktop Only:    hidden md:flex, hidden md:block
Mobile Only:     md:hidden
Both:            flex md:flex (always shown)
```

---

## 🎯 Categories List

```typescript
[
  'Dairy',
  'Bakery',
  'Fruits',
  'Beverages',
  'Pantry',
  'Snacks',
  'Frozen',
  'Organic'
]
```

---

## 💡 Key Constants & Values

```typescript
// Tax Rate
TAX_RATE = 0.08  // 8%

// Initial Budget
INITIAL_BUDGET = 2000

// Admin Secret Keys (from page.tsx)
['Mohit@2004', '8651365475', '9162471191']

// Demo Barcodes
[
  '1234567890123',  // Milk
  '2345678901234',  // Bread
  '3456789012345',  // Apples
  // ... (10 total)
]

// Product Stock Status
STOCK_LOW_THRESHOLD = 0  // Notification when hits 0

// Order ID Format
'ORD-' + Date.now() + random
```

---

## 📈 Key Performance Values

| Metric | Value | Location |
|--------|-------|----------|
| Tax Rate | 8% | [app/payment/page.tsx](app/payment/page.tsx#L30) |
| Initial Budget | ₹2000 | [lib/store.tsx](lib/store.tsx#L88) |
| Cart Limit (UI) | Unlimited | (server-side batch?) |
| Recent Scans Display | 5 items | [app/scan/page.tsx](app/scan/page.tsx#L165) |
| Quick Products Show | 6 items | [app/scan/page.tsx](app/scan/page.tsx#L395) |
| Orders Per Page | 50 (query limit) | [lib/firestore-db.ts](lib/firestore-db.ts) |

---

## 🧪 Testing Credentials

### Demo Products (Barcodes)
```
Scan these to test:
1234567890123 → Organic Milk (₹65)
2345678901234 → Whole Wheat Bread (₹45)
3456789012345 → Fresh Apples (₹120)
4567890123456 → Orange Juice (₹85)
5678901234567 → Greek Yogurt (₹55)
6789012345678 → Premium Coffee (₹350)
7890123456789 → Organic Eggs (₹95)
8901234567890 → Avocados (₹180)
9012345678901 → Pasta Sauce (₹75)
0123456789012 → Brown Rice (₹110)
```

### Admin Login
```
Secret Keys:
- Mohit@2004
- 8651365475
- 9162471191

These work with any email/password combo
```

### Test User Budget
```
Initial: ₹2000
Deducted when order placed
Can be reset in profile
```

---

## 🔐 Authentication Methods

| Method | Implementation | File |
|--------|-----------------|------|
| Email/Password | Firebase Auth | [lib/firebase-auth.ts](lib/firebase-auth.ts) |
| Phone OTP | Firebase Auth | [lib/firebase-auth.ts](lib/firebase-auth.ts) |
| Google OAuth | Firebase Auth | [lib/firebase-auth.ts](lib/firebase-auth.ts) |
| Admin Secret Key | Custom validation | [app/page.tsx](app/page.tsx#L180-L200) |

---

## 📝 Error Handling Pattern

### Standard Error Handling

```typescript
try {
  // Attempt operation
  const result = await firebaseFunction()
  
  // Success feedback
  toast.success('Operation successful!')
  
  // Update UI
  setData(result)
} catch (error: any) {
  // Log for debugging
  console.error('Operation failed:', error)
  
  // User feedback
  toast.error(
    error.message || 'An error occurred. Please try again.'
  )
  
  // Optional: Additional error handling
  if (error.code === 'specific-error') {
    // Handle specific case
  }
} finally {
  // Cleanup (stop loading, etc.)
  setIsLoading(false)
}
```

---

## 🚀 Performance Considerations

### Optimization Used
- ✅ localStorage for cart persistence
- ✅ localStorage for dark mode preference
- ✅ localStorage for budget
- ✅ Real-time Firestore subscriptions (optional)
- ✅ Lazy loading for product images
- ✅ Recent scans limit (5 items)

### Optimization Opportunities
- ❌ No pagination on orders page (could be slow with many orders)
- ❌ No image optimization (could add next/image)
- ❌ No code splitting (could improve initial load)
- ❌ No caching of Firestore queries
- ❌ No service worker (could add PWA features)

---

## 🐛 Common Issues & Solutions

### Issue: Cart doesn't persist
**Solution:** Check if localStorage is enabled in browser settings

### Issue: Products not showing in scan page
**Solution:** 
1. Check if any products in Firestore with `approved: true`
2. Falls back to mock products if empty
3. Check browser console for errors

### Issue: Admin can't add products
**Solution:** 
1. Verify admin authentication (secret key correct)
2. Check Firestore permissions allow writes to products collection
3. Check required fields are filled (name, price, barcode, category)

### Issue: Order not saved
**Solution:**
1. Check user is authenticated (user.id exists)
2. Check Firestore permissions allow writes to orders collection
3. Check cart has items

### Issue: Budget not updating
**Solution:**
1. localStorage["budget"] might be corrupted
2. Try clearing browser cache
3. Reset budget in profile page

---

## 📚 Additional Documentation Files

- [README.md](README.md) - Project overview
- [CODEBASE_STRUCTURE_ANALYSIS.md](CODEBASE_STRUCTURE_ANALYSIS.md) - Detailed architecture
- [CODE_EXAMPLES_AND_FLOWS.md](CODE_EXAMPLES_AND_FLOWS.md) - Code examples and workflows
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Feature implementation details
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md) - Firebase configuration

---

## 🔗 Useful Links

- **Next.js Docs:** https://nextjs.org/docs
- **Firebase Docs:** https://firebase.google.com/docs
- **Firestore Queries:** https://firebase.google.com/docs/firestore/query-data/queries
- **React Hooks:** https://react.dev/reference/react
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Radix UI:** https://www.radix-ui.com/docs

