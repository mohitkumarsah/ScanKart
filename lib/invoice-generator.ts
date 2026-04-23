/**
 * Invoice generation utility
 * Generates JSON invoice data that can be converted to PDF/HTML
 */

import { CartItem } from './store'
import QRCode from 'qrcode'

export interface Invoice {
  id: string
  orderNumber: string
  date: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  items: CartItem[]
  subtotal: number
  tax: number
  taxRate: number
  total: number
  paymentMethod: string
  status: 'completed' | 'pending' | 'failed'
  qrCodes?: Record<string, string> // QR codes for each item
}

export const generateInvoice = (
  orderId: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string | undefined,
  items: CartItem[],
  subtotal: number,
  taxRate: number = 0.08,
  paymentMethod: string = 'UPI'
): Invoice => {
  const tax = subtotal * taxRate
  const total = subtotal + tax

  return {
    id: orderId,
    orderNumber: orderId,
    date: new Date().toISOString(),
    customerName,
    customerEmail,
    customerPhone,
    items,
    subtotal,
    tax,
    taxRate,
    total,
    paymentMethod,
    status: 'completed',
  }
}

/**
 * Generate QR codes for each item in the invoice
 * Returns a map of item IDs/names to QR code data URLs
 */
export const generateInvoiceQRCodes = async (
  invoice: Invoice
): Promise<Record<string, string>> => {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const qrCodes: Record<string, string> = {}

  try {
    for (const item of invoice.items) {
      const itemId = item.id || item.name
      const qrUrl = `${baseUrl}/product-info?orderId=${invoice.orderNumber}&productId=${encodeURIComponent(itemId)}`

      const qrCode = await QRCode.toDataURL(qrUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#4f46e5',
          light: '#ffffff',
        },
      })
      qrCodes[itemId] = qrCode
    }
  } catch (error) {
    console.error('Error generating QR codes:', error)
  }

  return qrCodes
}

export const generateInvoiceHTML = (invoice: Invoice): string => {
  const itemsHTML = invoice.items
    .map((item) => {
      const itemId = item.id || item.name
      const qrCodeUrl = invoice.qrCodes?.[itemId]
      const qrCodeImg = qrCodeUrl
        ? `<img src="${qrCodeUrl}" alt="Product QR Code" style="width: 60px; height: 60px; border-radius: 8px; margin-top: 5px;" />`
        : ''

      return `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; vertical-align: middle;">
        <div>${item.name}</div>
        ${qrCodeImg}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; vertical-align: middle;">×${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; vertical-align: middle;">₹${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; vertical-align: middle;">₹${(
        item.price * item.quantity
      ).toFixed(2)}</td>
    </tr>
  `
    })
    .join('')

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${invoice.orderNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: System, -apple-system, sans-serif; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        header { margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }
        .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .company-title { font-size: 28px; font-weight: bold; color: #4f46e5; }
        .invoice-title { text-align: right; }
        .invoice-title h2 { font-size: 24px; color: #333; margin-bottom: 5px; }
        .invoice-title p { color: #666; }
        
        .info { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .info-section h3 { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 10px; }
        .info-section p { margin: 5px 0; font-size: 14px; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        table thead { background-color: #f3f4f6; }
        table th { padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
        table td { padding: 10px; }
        
        .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
        .totals-box { width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
        .total-row.final { border-bottom: 2px solid #4f46e5; border-top: 2px solid #4f46e5; font-weight: bold; font-size: 16px; color: #4f46e5; }
        
        footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
        
        .thank-you { text-align: center; color: #4f46e5; font-weight: bold; margin-bottom: 15px; }
        
        .qr-info { background-color: #f3f4f6; padding: 10px; border-radius: 6px; margin-top: 20px; font-size: 12px; line-height: 1.6; }
        .qr-info strong { color: #4f46e5; }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <div class="header-top">
            <div class="company-title">ScanKart</div>
            <div class="invoice-title">
              <h2>INVOICE</h2>
              <p>${invoice.orderNumber}</p>
            </div>
          </div>
        </header>
        
        <div class="info">
          <div>
            <div class="info-section">
              <h3>Bill To</h3>
              <p>${invoice.customerName}</p>
              <p>${invoice.customerEmail}</p>
              ${invoice.customerPhone ? `<p>${invoice.customerPhone}</p>` : ''}
            </div>
          </div>
          <div>
            <div class="info-section">
              <h3>Invoice Details</h3>
              <p><strong>Invoice No:</strong> ${invoice.orderNumber}</p>
              <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString('en-IN')}</p>
              <p><strong>Payment Method:</strong> ${invoice.paymentMethod}</p>
              <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">Paid</span></p>
            </div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-box">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax (${(invoice.taxRate * 100).toFixed(0)}%):</span>
              <span>₹${invoice.tax.toFixed(2)}</span>
            </div>
            <div class="total-row final">
              <span>Total Amount:</span>
              <span>₹${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div class="thank-you">
          Thank you for your purchase!
        </div>
        
        <div class="qr-info">
          <strong>📱 QR Code Feature:</strong> Each product has a QR code embedded in this invoice. Scan any product's QR code to view detailed product information and verify your purchase.
        </div>
        
        <footer>
          <p>ScanKart © ${new Date().getFullYear()}. All Rights Reserved.</p>
          <p>For support, contact: support@scankart.com | Phone: +91 8651365475</p>
          <p>This is an electronically generated invoice. No signature is required.</p>
        </footer>
      </div>
    </body>
    </html>
  `

  return html
}

export const downloadInvoice = (invoice: Invoice) => {
  const html = generateInvoiceHTML(invoice)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `Invoice-${invoice.orderNumber}.html`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const printInvoice = (invoice: Invoice) => {
  const html = generateInvoiceHTML(invoice)
  const printWindow = window.open('', '', 'height=600,width=800')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }
}
