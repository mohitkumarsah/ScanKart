import { db } from './firebase'
export { db };
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  onSnapshot,
  addDoc,
  Timestamp,
} from 'firebase/firestore'

// Helper function to check if Firestore is initialized
const checkFirestoreInitialized = () => {
  if (!db) {
    throw new Error('Firestore not initialized. Check your environment variables.')
  }
}

/**
 * Remove undefined values from an object
 * @param obj - Object to clean
 * @returns Cleaned object
 */
const removeUndefinedValues = (obj: Record<string, any>): Record<string, any> => {
  return Object.keys(obj)
    .filter(key => obj[key] !== undefined)
    .reduce<Record<string, any>>((result, key) => {
      result[key] = obj[key]
      return result
    }, {} as Record<string, any>)
}

/**
 * Add a new document to a collection
 * @param collectionName - Name of the collection
 * @param data - Data to add
 * @returns Document ID
 */
export const addDocument = async (collectionName: string, data: any) => {
  checkFirestoreInitialized()
  try {
    const cleanData = removeUndefinedValues(data)
    const docRef = await addDoc(collection(db, collectionName), {
      ...cleanData,
      createdAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error)
    throw error
  }
}

/**
 * Set a document with a specific ID
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 * @param data - Data to set
 * @param merge - If true, will merge with existing data
 */
export const setDocument = async (
  collectionName: string,
  docId: string,
  data: any,
  merge = false
) => {
  checkFirestoreInitialized()
  try {
    const cleanData = removeUndefinedValues(data)
    await setDoc(
      doc(db, collectionName, docId),
      {
        ...cleanData,
        updatedAt: Timestamp.now(),
      },
      { merge }
    )
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error)
    throw error
  }
}

/**
 * Get a single document by ID
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 * @returns Document data with ID
 */
export const getDocument = async (collectionName: string, docId: string) => {
  checkFirestoreInitialized()
  try {
    // Check if online first (optional optimization)
    if (typeof window !== 'undefined' && !navigator.onLine) {
      console.warn(`Offline: Cannot fetch ${collectionName}/${docId}`)
      return null
    }

    const docSnap = await getDoc(doc(db, collectionName, docId))
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    }
    return null
  } catch (error: any) {
    // Handle offline errors gracefully
    if (error.code === 'failed-precondition' || error.message?.includes('offline')) {
      console.warn(`Offline: Could not fetch ${collectionName}/${docId}`)
      return null
    }
    console.warn(`Warning getting document from ${collectionName}:`, error.message)
    return null // Return null instead of throwing to allow app to continue
  }
}

/**
 * Get all documents from a collection
 * @param collectionName - Name of the collection
 * @returns Array of documents with IDs
 */
export const getAllDocuments = async (collectionName: string) => {
  checkFirestoreInitialized()
  try {
    const querySnapshot = await getDocs(collection(db, collectionName))
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error)
    throw error
  }
}

/**
 * Query documents with filters
 * @param collectionName - Name of the collection
 * @param constraints - Array of query constraints (where, orderBy, limit, etc.)
 * @returns Array of matching documents
 */
export const queryDocuments = async (
  collectionName: string,
  constraints: QueryConstraint[]
) => {
  checkFirestoreInitialized()
  try {
    const q = query(collection(db, collectionName), ...constraints)
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error(`Error querying ${collectionName}:`, error)
    throw error
  }
}

/**
 * Find documents by a field value
 * @param collectionName - Name of the collection
 * @param field - Field name
 * @param value - Field value
 * @returns Array of matching documents
 */
export const findByField = async (
  collectionName: string,
  field: string,
  value: any
) => {
  checkFirestoreInitialized()
  try {
    const q = query(collection(db, collectionName), where(field, '==', value))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error(`Error finding documents in ${collectionName}:`, error)
    throw error
  }
}

/**
 * Update a document
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 * @param data - Data to update
 */
export const updateDocument = async (
  collectionName: string,
  docId: string,
  data: any
) => {
  checkFirestoreInitialized()
  try {
    const cleanData = removeUndefinedValues(data)
    await updateDoc(doc(db, collectionName, docId), {
      ...cleanData,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error)
    throw error
  }
}

/**
 * Delete a document
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 */
export const deleteDocument = async (
  collectionName: string,
  docId: string
) => {
  checkFirestoreInitialized()
  try {
    await deleteDoc(doc(db, collectionName, docId))
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error)
    throw error
  }
}

/**
 * Subscribe to real-time updates of a single document
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 * @param callback - Function to call with updated data
 * @returns Unsubscribe function
 */
export const subscribeToDocument = (
  collectionName: string,
  docId: string,
  callback: (data: any) => void
) => {
  checkFirestoreInitialized()
  try {
    return onSnapshot(doc(db, collectionName, docId), (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() })
      }
    })
  } catch (error) {
    console.error(`Error subscribing to document in ${collectionName}:`, error)
    throw error
  }
}

/**
 * Subscribe to real-time updates of a collection with queries
 * @param collectionName - Name of the collection
 * @param constraints - Array of query constraints
 * @param callback - Function to call with updated data
 * @returns Unsubscribe function
 */
export const subscribeToQuery = (
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: any[]) => void
) => {
  checkFirestoreInitialized()
  try {
    const q = query(collection(db, collectionName), ...constraints)
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      callback(data)
    })
  } catch (error) {
    console.error(`Error subscribing to ${collectionName}:`, error)
    throw error
  }
}

/**
 * Batch write multiple operations
 * @param operations - Array of operations {type: 'set'|'update'|'delete', collection, docId, data?}
 */
export const batchWrite = async (
  operations: Array<{
    type: 'set' | 'update' | 'delete'
    collection: string
    docId: string
    data?: any
  }>
) => {
  checkFirestoreInitialized()
  try {
    // Using individual operations since we need to batch them properly
    for (const op of operations) {
      switch (op.type) {
        case 'set':
          await setDocument(op.collection, op.docId, op.data || {})
          break
        case 'update':
          await updateDocument(op.collection, op.docId, op.data || {})
          break
        case 'delete':
          await deleteDocument(op.collection, op.docId)
          break
      }
    }
  } catch (error) {
    console.error('Error in batch write:', error)
    throw error
  }
}

/**
 * Add a support ticket
 * @param ticketData - Support ticket information
 * @returns Ticket ID
 */
export const addSupportTicket = async (ticketData: {
  userId: string
  name: string
  email: string
  phone?: string
  category: string
  subject: string
  description: string
  orderNumber?: string | null
  status: string
  priority: string
}) => {
  checkFirestoreInitialized()
  try {
    const cleanData = removeUndefinedValues(ticketData)
    const ticketId = await addDocument('support_tickets', {
      ...cleanData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return ticketId
  } catch (error) {
    console.error('Error adding support ticket:', error)
    throw error
  }
}

/**
 * Get all support tickets (admin only)
 * @returns Array of support tickets
 */
export const getAllSupportTickets = async () => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('support_tickets', [
      orderBy('createdAt', 'desc'),
    ])
  } catch (error) {
    console.warn('Error fetching support tickets:', error)
    return []
  }
}

/**
 * Get support tickets for a specific user
 * @param userId - User ID
 * @returns Array of user's support tickets
 */
export const getUserSupportTickets = async (userId: string) => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('support_tickets', [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ])
  } catch (error) {
    console.warn('Error fetching user support tickets:', error)
    return []
  }
}

/**
 * Update support ticket status
 * @param ticketId - Support ticket ID
 * @param updates - Updates object
 */
export const updateSupportTicket = async (ticketId: string, updates: any) => {
  checkFirestoreInitialized()
  try {
    await updateDocument('support_tickets', ticketId, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error updating support ticket:', error)
    throw error
  }
}

/**
 * Add a transaction record (for admin tracking)
 * @param transactionData - Transaction information
 * @returns Transaction ID
 */
export const addTransaction = async (transactionData: {
  userId: string
  type: 'payment' | 'refund' | 'order' | 'scan'
  amount?: number
  orderId?: string
  description: string
  status: 'pending' | 'completed' | 'failed'
  metadata?: any
}) => {
  checkFirestoreInitialized()
  try {
    const cleanData = removeUndefinedValues(transactionData)
    const transactionId = await addDocument('transactions', {
      ...cleanData,
      createdAt: Timestamp.now(),
    })
    return transactionId
  } catch (error) {
    console.error('Error adding transaction:', error)
    throw error
  }
}

/**
 * Get all transactions (admin only)
 * @returns Array of transactions
 */
export const getAllTransactions = async () => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('transactions', [
      orderBy('createdAt', 'desc'),
    ])
  } catch (error) {
    console.warn('Error fetching transactions:', error)
    return []
  }
}

/**
 * Get transactions for a specific user
 * @param userId - User ID
 * @returns Array of user's transactions
 */
export const getUserTransactions = async (userId: string) => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('transactions', [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ])
  } catch (error) {
    console.warn('Error fetching user transactions:', error)
    return []
  }
}

/**
 * Get transactions by type
 * @param type - Transaction type
 * @returns Array of transactions
 */
export const getTransactionsByType = async (type: string) => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('transactions', [
      where('type', '==', type),
      orderBy('createdAt', 'desc'),
    ])
  } catch (error) {
    console.warn('Error fetching transactions by type:', error)
    return []
  }
}

/**
 * Get transaction details
 * @param transactionId - Transaction ID
 * @returns Transaction details
 */
export const getTransactionDetail = async (transactionId: string) => {
  checkFirestoreInitialized()
  try {
    return await getDocument('transactions', transactionId)
  } catch (error) {
    console.warn('Error fetching transaction details:', error)
    return null
  }
}

// dbExamples object
const dbExamplesInternal = {
  // Add a user
  addUser: async (userData: { name: string; email: string; phone?: string }) => {
    return await addDocument('users', userData)
  },

  // Get user by ID
  getUser: async (userId: string) => {
    return await getDocument('users', userId)
  },

  // Find users by email
  findUserByEmail: async (email: string) => {
    return await findByField('users', 'email', email)
  },

  // Update user
  updateUser: async (userId: string, updates: any) => {
    return await updateDocument('users', userId, updates)
  },

  // Delete user
  deleteUser: async (userId: string) => {
    return await deleteDocument('users', userId)
  },

  // Get all products
  getProducts: async () => {
    return await getAllDocuments('products')
  },

  // Add product
  addProduct: async (productData: any) => {
    return await addDocument('products', productData)
  },

  // Subscribe to user data
  subscribeToUser: (userId: string, callback: (data: any) => void) => {
    return subscribeToDocument('users', userId, callback)
  },

  // Get orders with filters
  getUserOrders: async (userId: string) => {
    return await queryDocuments('orders', [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(10),
    ])
  },

  // Notification functions
  addNotification: async (notificationData: {
    userId: string
    type: 'support_reply' | 'payment' | 'order' | 'system'
    title: string
    message: string
    relatedId?: string
    read: boolean
  }) => {
    checkFirestoreInitialized()
    try {
      const notificationId = await addDocument('notifications', {
        ...notificationData,
        createdAt: Timestamp.now(),
      })
      return notificationId
    } catch (error) {
      console.error('Error adding notification:', error)
      throw error
    }
  },

  // Get user notifications
  getUserNotifications: async (userId: string) => {
    return await queryDocuments('notifications', [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ])
  },

  // Get unread notifications count
  getUnreadNotificationsCount: async (userId: string) => {
    try {
      const notifications = await queryDocuments('notifications', [
        where('userId', '==', userId),
        where('read', '==', false),
      ])
      return notifications.length
    } catch (error) {
      console.warn('Error getting unread notifications count:', error)
      return 0
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId: string) => {
    try {
      await updateDocument('notifications', notificationId, {
        read: true,
        readAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async (userId: string) => {
    checkFirestoreInitialized()
    try {
      const notifications = await queryDocuments('notifications', [
        where('userId', '==', userId),
        where('read', '==', false),
      ])
      
      for (const notification of notifications) {
        await updateDocument('notifications', notification.id, {
          read: true,
          readAt: Timestamp.now(),
        })
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    try {
      await deleteDocument('notifications', notificationId)
    } catch (error) {
      console.error('Error deleting notification:', error)
      throw error
    }
  }
};

/**
 * Add a new order
 * @param orderData - Order information
 * @returns Order ID
 */
export const addOrder = async (orderData: {
  userId: string
  items: any[]
  total: number
  tax?: number
  paymentStatus: 'pending' | 'completed' | 'failed'
  paymentMethod?: string
  shippingAddress?: string
  notes?: string
}) => {
  checkFirestoreInitialized()
  try {
    const cleanData = removeUndefinedValues(orderData)
    const orderId = await addDocument('orders', {
      ...cleanData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return orderId
  } catch (error) {
    console.error('Error adding order:', error)
    throw error
  }
}

/**
 * Get all orders for a specific user
 * @param userId - User ID
 * @returns Array of orders
 */
export const getUserOrdersHistory = async (userId: string) => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('orders', [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ])
  } catch (error) {
    console.warn('Error fetching user order history:', error)
    return []
  }
}

/**
 * Get a specific order by ID
 * @param orderId - Order ID
 * @returns Order details
 */
export const getOrderDetails = async (orderId: string) => {
  checkFirestoreInitialized()
  try {
    return await getDocument('orders', orderId)
  } catch (error) {
    console.warn('Error fetching order details:', error)
    return null
  }
}

/**
 * Update order status
 * @param orderId - Order ID
 * @param updates - Updates to apply
 */
export const updateOrderStatus = async (orderId: string, updates: any) => {
  checkFirestoreInitialized()
  try {
    await updateDocument('orders', orderId, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error updating order:', error)
    throw error
  }
}

/**
 * Add a reply to a support ticket
 * @param ticketId - Support ticket ID
 * @param reply - Reply information
 */
export const addSupportTicketReply = async (
  ticketId: string,
  reply: {
    type: 'user' | 'admin'
    message: string
    senderName?: string
  }
) => {
  checkFirestoreInitialized()
  try {
    const ticket = await getDocument('support_tickets', ticketId) as any
    if (!ticket) throw new Error('Ticket not found')

    const replies = ticket.replies || []
    replies.push({
      ...reply,
      timestamp: Timestamp.now(),
    })

    await updateDocument('support_tickets', ticketId, {
      replies,
      lastReplyAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error adding support ticket reply:', error)
    throw error
  }
}

/**
 * Get support ticket with replies
 * @param ticketId - Support ticket ID
 * @returns Ticket details with all replies
 */
export const getSupportTicketWithReplies = async (ticketId: string) => {
  checkFirestoreInitialized()
  try {
    return await getDocument('support_tickets', ticketId)
  } catch (error) {
    console.warn('Error fetching support ticket:', error)
    return null
  }
}

/**
 * Create a notification for support reply
 * @param userId - User ID to notify
 * @param ticketId - Support ticket ID
 * @param ticketSubject - Ticket subject
 * @param replyMessage - Reply message preview
 */
export const createSupportReplyNotification = async (
  userId: string,
  ticketId: string,
  ticketSubject: string,
  replyMessage: string
) => {
  checkFirestoreInitialized()
  try {
    const notificationId = await addDocument('notifications', {
      userId,
      type: 'support_reply',
      title: `Reply to: ${ticketSubject}`,
      message: `Admin replied: "${replyMessage.substring(0, 100)}${replyMessage.length > 100 ? '...' : ''}"`,
      relatedId: ticketId,
      read: false,
      createdAt: Timestamp.now(),
    })
    return notificationId
  } catch (error) {
    console.error('Error creating support reply notification:', error)
    throw error
  }
}

/**
 * Add a new product (Admin only)
 * @param productData - Product information
 * @returns Product ID
 */
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

/**
 * Get all products (including unapproved)
 * @returns Array of all products
 */
export const getAllProductsAdmin = async () => {
  checkFirestoreInitialized()
  try {
    return await getAllDocuments('products')
  } catch (error) {
    console.warn('Error fetching all products:', error)
    return []
  }
}

/**
 * Get only approved products (for users)
 * @returns Array of approved products
 */
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

/**
 * Get a specific product
 * @param productId - Product ID
 * @returns Product details
 */
export const getProductByIdAdmin = async (productId: string) => {
  checkFirestoreInitialized()
  try {
    return await getDocument('products', productId)
  } catch (error) {
    console.warn('Error fetching product:', error)
    return null
  }
}

/**
 * Update product details (Admin only)
 * @param productId - Product ID
 * @param updates - Fields to update
 */
export const updateProductAdmin = async (productId: string, updates: any) => {
  checkFirestoreInitialized()
  try {
    const cleanData = removeUndefinedValues(updates)
    await updateDocument('products', productId, {
      ...cleanData,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error updating product:', error)
    throw error
  }
}

/**
 * Approve a product (Admin only)
 * @param productId - Product ID
 */
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

/**
 * Delete a product (Admin only)
 * @param productId - Product ID
 */
export const deleteProductAdmin = async (productId: string) => {
  checkFirestoreInitialized()
  try {
    await deleteDocument('products', productId)
  } catch (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}

/**
 * Get unapproved products (Admin only)
 * @returns Array of unapproved products
 */
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

/**
 * ADMIN DASHBOARD FUNCTIONS
 */

/**
 * Get all orders from all users (Admin only)
 * @returns Array of all orders
 */
export const getAllOrders = async () => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('orders', [orderBy('createdAt', 'desc')])
  } catch (error) {
    console.warn('Error fetching all orders:', error)
    return []
  }
}

/**
 * Get total sales amount (Admin only)
 * @returns Total sales value
 */
export const getTotalSales = async () => {
  checkFirestoreInitialized()
  try {
    const orders = await getAllOrders()
    return orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
  } catch (error) {
    console.warn('Error calculating total sales:', error)
    return 0
  }
}

/**
 * Get count of active users (Admin only)
 * @returns Number of unique users who placed orders
 */
export const getActiveUsersCount = async () => {
  checkFirestoreInitialized()
  try {
    const orders = await getAllOrders()
    const uniqueUsers = new Set(orders.map((order: any) => order.userId))
    return uniqueUsers.size
  } catch (error) {
    console.warn('Error counting active users:', error)
    return 0
  }
}

/**
 * Get total product count (Admin only)
 * @returns Number of total products
 */
export const getTotalProductsCount = async () => {
  checkFirestoreInitialized()
  try {
    const products = await getAllProductsAdmin()
    return products.length
  } catch (error) {
    console.warn('Error counting products:', error)
    return 0
  }
}

/**
 * Get popular products based on order count (Admin only)
 * @returns Array of popular products with sales count
 */
export const getPopularProducts = async (limitCount: number = 5) => {
  checkFirestoreInitialized()
  try {
    const orders = await getAllOrders()
    const productSales: Record<string, any> = {}

    // Count product sales
    orders.forEach((order: any) => {
      order.items?.forEach((item: any) => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            id: item.id,
            name: item.name,
            price: item.price,
            barcode: item.barcode,
            image: item.image,
            category: item.category,
            soldCount: 0,
            revenue: 0,
          }
        }
        const quantity = item.quantity || 1
        productSales[item.id].soldCount += quantity
        productSales[item.id].revenue += item.price * quantity
      })
    })

    // Sort by sold count and return top N
    return Object.values(productSales)
      .sort((a: any, b: any) => b.soldCount - a.soldCount)
      .slice(0, limitCount)
  } catch (error) {
    console.warn('Error fetching popular products:', error)
    return []
  }
}

/**
 * Get recent orders with user info (Admin only)
 * @param limit - Number of recent orders to fetch
 * @returns Array of recent orders
 */
export const getRecentOrders = async (limitCount: number = 10) => {
  checkFirestoreInitialized()
  try {
    const orders = await queryDocuments('orders', [
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    ])
    return orders
  } catch (error) {
    console.warn('Error fetching recent orders:', error)
    return []
  }
}

/**
 * Get sales statistics over time (Admin only)
 * @returns Object with sales data by date
 */
export const getSalesOverview = async () => {
  checkFirestoreInitialized()
  try {
    const orders = await getAllOrders()
    const salesByDate: Record<string, number> = {}

    orders.forEach((order: any) => {
      const date = order.createdAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString()
      salesByDate[date] = (salesByDate[date] || 0) + order.total
    })

    return Object.entries(salesByDate)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30) // Last 30 days
  } catch (error) {
    console.warn('Error fetching sales overview:', error)
    return []
  }
}

/**
 * Get dashboard statistics summary (Admin only)
 * @returns Object with key metrics
 */
export const getDashboardStats = async () => {
  checkFirestoreInitialized()
  try {
    const [totalOrders, totalSales, activeUsers, totalProducts] = await Promise.all([
      (async () => {
        const orders = await getAllOrders()
        return orders.length
      })(),
      getTotalSales(),
      getActiveUsersCount(),
      getTotalProductsCount(),
    ])

    return {
      totalOrders,
      totalSales,
      activeUsers,
      totalProducts,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
    }
  } catch (error) {
    console.warn('Error fetching dashboard stats:', error)
    return {
      totalOrders: 0,
      totalSales: 0,
      activeUsers: 0,
      totalProducts: 0,
      averageOrderValue: 0,
    }
  }
}

// Export needed functions from dbExamples
export const getUserNotifications = dbExamplesInternal.getUserNotifications;
export const markNotificationAsRead = dbExamplesInternal.markNotificationAsRead;
export const markAllNotificationsAsRead = dbExamplesInternal.markAllNotificationsAsRead;
export const deleteNotification = dbExamplesInternal.deleteNotification;

// Export dbExamples for other uses
export const dbExamples = dbExamplesInternal;

// ========================
// SHOPPING MALLS MANAGEMENT
// ========================

/**
 * Add a new shopping mall
 * @param mallData - Mall information
 * @returns Mall ID
 */
export const addMall = async (mallData: {
  name: string
  description?: string
  image: string
  location?: string
  rating?: number
  categories: string[]
  isActive: boolean
  discount?: number
}) => {
  checkFirestoreInitialized()
  try {
    const mallId = await addDocument('malls', {
      ...mallData,
      createdAt: Timestamp.now(),
    })
    return mallId
  } catch (error) {
    console.error('Error adding mall:', error)
    throw error
  }
}

/**
 * Get all shopping malls
 * @returns Array of malls
 */
export const getAllMalls = async () => {
  checkFirestoreInitialized()
  try {
    return await getAllDocuments('malls')
  } catch (error) {
    console.error('Error getting malls:', error)
    throw error
  }
}

/**
 * Get active shopping malls only
 * @returns Array of active malls
 */
export const getActiveMalls = async () => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('malls', [where('isActive', '==', true)])
  } catch (error) {
    console.error('Error getting active malls:', error)
    throw error
  }
}

/**
 * Get a single mall by ID
 * @param mallId - Mall ID
 * @returns Mall data
 */
export const getMallById = async (mallId: string) => {
  checkFirestoreInitialized()
  try {
    return await getDocument('malls', mallId)
  } catch (error) {
    console.error(`Error getting mall ${mallId}:`, error)
    throw error
  }
}

/**
 * Update mall information
 * @param mallId - Mall ID
 * @param updates - Data to update
 */
export const updateMallAdmin = async (mallId: string, updates: any) => {
  checkFirestoreInitialized()
  try {
    await updateDocument('malls', mallId, updates)
  } catch (error) {
    console.error(`Error updating mall ${mallId}:`, error)
    throw error
  }
}

/**
 * Get products by mall
 * @param mallId - Mall ID
 * @returns Products in that mall
 */
export const getProductsByMallFirestore = async (mallId: string) => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('products', [where('mallId', '==', mallId)])
  } catch (error) {
    console.error(`Error getting products for mall ${mallId}:`, error)
    throw error
  }
}

/**
 * Get products by mall and category
 * @param mallId - Mall ID
 * @param category - Product category
 * @returns Filtered products
 */
export const getProductsByMallAndCategory = async (
  mallId: string,
  category: string
) => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('products', [
      where('mallId', '==', mallId),
      where('category', '==', category),
    ])
  } catch (error) {
    console.error(
      `Error getting products for mall ${mallId} and category ${category}:`,
      error
    )
    throw error
  }
}

/**
 * INVENTORY MANAGEMENT FUNCTIONS
 */

/**
 * Update product stock when order is placed
 * @param productId - Product ID
 * @param quantityBought - Quantity being purchased
 * @returns Updated product with new stock
 */
export const updateProductStock = async (productId: string, quantityBought: number) => {
  checkFirestoreInitialized()
  try {
    const product = await getProductByIdAdmin(productId) as any
    if (!product) throw new Error('Product not found')

    const currentStock = product.stock || 0
    const newStock = Math.max(0, currentStock - quantityBought)

    await updateDocument('products', productId, {
      stock: newStock,
      updatedAt: Timestamp.now(),
    })

    // If stock reaches 0, create admin notification
    if (newStock === 0 && currentStock > 0) {
      await createLowStockNotification(productId, product.name, 0)
    }

    return { ...product, stock: newStock }
  } catch (error) {
    console.error('Error updating product stock:', error)
    throw error
  }
}

/**
 * Get product stock
 * @param productId - Product ID
 * @returns Current stock quantity
 */
export const getProductStock = async (productId: string) => {
  checkFirestoreInitialized()
  try {
    const product = await getProductByIdAdmin(productId) as any
    return product?.stock || 0
  } catch (error) {
    console.warn('Error fetching product stock:', error)
    return 0
  }
}

/**
 * Check if product is in stock
 * @param productId - Product ID
 * @returns true if stock > 0
 */
export const isProductInStock = async (productId: string) => {
  checkFirestoreInitialized()
  try {
    const stock = await getProductStock(productId)
    return stock > 0
  } catch (error) {
    console.warn('Error checking product stock:', error)
    return false
  }
}

/**
 * Get all out-of-stock products (stock = 0)
 * @returns Array of out-of-stock products
 */
export const getOutOfStockProducts = async () => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('products', [
      where('stock', '==', 0),
      where('approved', '==', true),
    ])
  } catch (error) {
    console.warn('Error fetching out-of-stock products:', error)
    return []
  }
}

/**
 * Get all low-stock products (stock <= threshold)
 * @param threshold - Stock level threshold (default: 10)
 * @returns Array of low-stock products
 */
export const getLowStockProducts = async (threshold: number = 10) => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('products', [
      where('stock', '<=', threshold),
      where('approved', '==', true),
    ])
  } catch (error) {
    console.warn('Error fetching low-stock products:', error)
    return []
  }
}

/**
 * Create low stock notification for admin
 * @param productId - Product ID
 * @param productName - Product name
 * @param stockLevel - Current stock level
 */
export const createLowStockNotification = async (
  productId: string,
  productName: string,
  stockLevel: number
) => {
  checkFirestoreInitialized()
  try {
    await addDocument('admin_notifications', {
      type: 'low_stock',
      productId,
      productName,
      stockLevel,
      message: `Product "${productName}" ${stockLevel === 0 ? 'is OUT OF STOCK' : `has low stock (${stockLevel} remaining)`}. Please restock.`,
      severity: stockLevel === 0 ? 'critical' : 'warning',
      read: false,
      createdAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error creating low stock notification:', error)
  }
}

/**
 * Get all admin notifications
 * @returns Array of notifications
 */
export const getAdminNotifications = async () => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('admin_notifications', [
      orderBy('createdAt', 'desc'),
    ])
  } catch (error) {
    console.warn('Error fetching admin notifications:', error)
    return []
  }
}

/**
 * Get unread admin notifications
 * @returns Array of unread notifications
 */
export const getUnreadAdminNotifications = async () => {
  checkFirestoreInitialized()
  try {
    return await queryDocuments('admin_notifications', [
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
    ])
  } catch (error) {
    console.warn('Error fetching unread notifications:', error)
    return []
  }
}

/**
 * Mark admin notification as read
 * @param notificationId - Notification ID
 */
export const markAdminNotificationAsRead = async (notificationId: string) => {
  checkFirestoreInitialized()
  try {
    await updateDocument('admin_notifications', notificationId, {
      read: true,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

/**
 * Replenish product stock
 * @param productId - Product ID
 * @param quantity - Quantity to add
 * @returns Updated product
 */
export const replenishProductStock = async (productId: string, quantity: number) => {
  checkFirestoreInitialized()
  try {
    const product = await getProductByIdAdmin(productId) as any
    if (!product) {
      // Product might not exist yet or might be a reference issue
      // Create a minimal product entry if it doesn't exist
      console.warn(`Product ${productId} not found, attempting to create entry...`)
      
      // Try to fetch from products collection directly
      const productRef = doc(db, 'products', productId)
      const productSnap = await getDoc(productRef)
      
      if (!productSnap.exists()) {
        // If product truly doesn't exist, we'll just update the stock in Firestore
        // This allows restocking even if full product data isn't available
        await updateDocument('products', productId, {
          stock: quantity,
          updatedAt: Timestamp.now(),
        })
        console.log(`Created stock entry for product ${productId}`)
        return { id: productId, stock: quantity }
      }
    }

    const currentStock = product?.stock || 0
    const newStock = currentStock + quantity

    await updateDocument('products', productId, {
      stock: newStock,
      updatedAt: Timestamp.now(),
    })

    // Clear the out-of-stock notification when restocking
    if (currentStock === 0 && newStock > 0) {
      await clearOutOfStockNotification(productId)
    }

    return { ...product, stock: newStock }
  } catch (error) {
    console.error('Error replenishing stock:', error)
    throw error
  }
}

/**
 * Clear out-of-stock notification when product is restocked
 * @param productId - Product ID
 */
export const clearOutOfStockNotification = async (productId: string) => {
  checkFirestoreInitialized()
  try {
    const notifications = await queryDocuments('admin_notifications', [
      where('productId', '==', productId),
      where('type', '==', 'low_stock'),
      where('read', '==', false),
    ]) as any[]

    for (const notif of notifications) {
      await markAdminNotificationAsRead(notif.id)
    }
  } catch (error) {
    console.warn('Error clearing out-of-stock notification:', error)
  }
}

