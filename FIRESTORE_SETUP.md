# ScanKart - Firestore Setup & Indexes Guide

This document outlines the required Firestore collection indexes and setup instructions for the ScanKart application.

## Required Firestore Collections

### 1. **users**
Stores user account information.
```
Fields:
- id (Document ID)
- name: string
- email: string
- phone?: string
- photoURL?: string
- createdAt: timestamp
- updatedAt: timestamp
```

### 2. **orders**
Stores permanent order history for users.
```
Fields:
- id (Document ID)
- userId: string (indexed)
- items: array[{name, quantity, price}]
- total: number
- tax?: number
- paymentStatus: 'pending' | 'completed' | 'failed'
- paymentMethod?: string
- shippingAddress?: string
- notes?: string
- createdAt: timestamp (indexed)
- updatedAt: timestamp
```

### 3. **support_tickets**
Stores support tickets created by users.
```
Fields:
- id (Document ID)
- userId: string (indexed)
- name: string
- email: string
- phone?: string
- category: string
- subject: string
- description: string
- orderNumber?: string
- status: 'open' | 'in_progress' | 'resolved' | 'closed'
- priority: 'low' | 'normal' | 'high' | 'urgent'
- replies: array[{type, message, timestamp, senderName?}]
- createdAt: timestamp (indexed)
- updatedAt: timestamp
- lastReplyAt?: timestamp
```

### 4. **notifications**
Stores user notifications about orders, support replies, payments, etc.
```
Fields:
- id (Document ID)
- userId: string (indexed)
- type: 'support_reply' | 'payment' | 'order' | 'system'
- title: string
- message: string
- relatedId?: string
- read: boolean
- createdAt: timestamp (indexed)
- readAt?: timestamp
```

### 5. **transactions**
Stores transaction records for audit trail.
```
Fields:
- id (Document ID)
- userId: string (indexed)
- type: 'payment' | 'refund' | 'order' | 'scan'
- amount?: number
- orderId?: string
- description: string
- status: 'pending' | 'completed' | 'failed'
- metadata?: object
- createdAt: timestamp (indexed)
```

### 6. **products**
Stores product catalog information.
```
Fields:
- id (Document ID)
- name: string
- price: number
- barcode: string
- image: string
- category?: string
- stock?: number
- createdAt: timestamp
- updatedAt: timestamp
```

## Required Composite Indexes

### Index 1: Orders User History
**Collection**: orders
**Fields**:
- userId (Ascending)
- createdAt (Descending)

**Link to Create**:
Go to Firebase Console > Firestore > Indexes > Create Composite Index
- Collection: `orders`
- Field 1: `userId` (Ascending)
- Field 2: `createdAt` (Descending)

### Index 2: Support Tickets
**Collection**: support_tickets
**Fields**:
- userId (Ascending)
- createdAt (Descending)

**Link to Create**:
Go to Firebase Console > Firestore > Indexes > Create Composite Index
- Collection: `support_tickets`
- Field 1: `userId` (Ascending)
- Field 2: `createdAt` (Descending)

### Index 3: Notifications
**Collection**: notifications
**Fields**:
- userId (Ascending)
- createdAt (Descending)

**Link to Create**:
Go to Firebase Console > Firestore > Indexes > Create Composite Index
- Collection: `notifications`
- Field 1: `userId` (Ascending)
- Field 2: `createdAt` (Descending)

### Index 4: User Transactions
**Collection**: transactions
**Fields**:
- userId (Ascending)
- createdAt (Descending)

**Link to Create**:
Go to Firebase Console > Firestore > Indexes > Create Composite Index
- Collection: `transactions`
- Field 1: `userId` (Ascending)
- Field 2: `createdAt` (Descending)

## Step-by-Step Setup Instructions

### Step 1: Create Firestore Collections
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project "scankart-aa371"
3. Go to Firestore Database
4. Create the following collections:
   - users
   - orders
   - support_tickets
   - notifications
   - transactions
   - products

### Step 2: Enable Automatic ID Generation
For each collection:
1. Add a test document with auto-generated ID
2. Fill in the fields according to the schema above
3. Save and delete the test document

### Step 3: Create Composite Indexes
For each index listed above:
1. Go to Firestore > Indexes
2. Click "Create Index"
3. Fill in Collection, Fields, and Order as specified
4. Wait for the index to be created (usually 1-5 minutes)

### Step 4: Set Up Firestore Rules
Update your Firestore security rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Users can read/write their own orders
    match /orders/{orderId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    
    // Users can read/write their own support tickets
    match /support_tickets/{ticketId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    
    // Users can read their own notifications
    match /notifications/{notificationId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    
    // Users can read their own transactions
    match /transactions/{transactionId} {
      allow read: if request.auth.uid == resource.data.userId;
    }
    
    // Admin can read all documents
    match /{document=**} {
      allow read: if request.auth.token.admin == true;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

## Features Implementation

### Order History
- ✅ Orders are saved to Firestore when payment is completed
- ✅ Users can view all orders at `/orders`
- ✅ Each order has a detailed view at `/orders/[id]`
- ✅ Invoices can be downloaded as PDF

### Support Ticket System
- ✅ Users can create support tickets at `/support-tickets`
- ✅ Admin can manage tickets at `/admin/support`
- ✅ Admin can reply to tickets
- ✅ Users receive notifications when admin replies
- ✅ Email notifications are sent to users

### Notifications System
- ✅ Notifications are created when:
  - User receives order confirmation
  - Admin replies to support ticket
  - Payment is processed
- ✅ Users can view all notifications at `/notifications`
- ✅ Notifications can be marked as read
- ✅ Notifications can be deleted

### Permanent User History
- ✅ All orders are persisted in Firestore
- ✅ Support tickets are saved permanently
- ✅ Notification history is maintained
- ✅ Transaction records are logged

## Troubleshooting

### Issue: "The query requires an index"
**Solution**: Create the appropriate composite index as listed above.

### Issue: "Permission denied"
**Solution**: Update Firestore security rules as shown in Step 4.

### Issue: "Document not found"
**Solution**: Ensure the document exists in Firestore and the userId matches.

## API Functions

All database functions are exported from `lib/firestore-db.ts`:

### Order Functions
- `addOrder(orderData)` - Save new order
- `getUserOrdersHistory(userId)` - Get all orders for user
- `getOrderDetails(orderId)` - Get specific order
- `updateOrderStatus(orderId, updates)` - Update order

### Support Ticket Functions
- `addSupportTicket(ticketData)` - Create new ticket
- `getUserSupportTickets(userId)` - Get user's tickets
- `updateSupportTicket(ticketId, updates)` - Update ticket
- `addSupportTicketReply(ticketId, reply)` - Add reply to ticket
- `createSupportReplyNotification(userId, ticketId, subject, message)` - Send notification

### Notification Functions
- `getUserNotifications(userId)` - Get user's notifications
- `markNotificationAsRead(notificationId)` - Mark as read
- `markAllNotificationsAsRead(userId)` - Mark all as read
- `deleteNotification(notificationId)` - Delete notification

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Firebase Console logs
3. Check browser console for error messages
4. Verify Firestore rules and indexes are properly configured
