/**
 * QR Code utility for generating QR codes for products and orders
 */

import QRCode from 'qrcode'

export interface ProductQRData {
  orderId: string
  productName: string
  price: number
  quantity: number
  description?: string
  scannedAt?: string
}

/**
 * Generate QR code as Data URL
 * Encodes order and product information that can be decoded when scanned
 */
export const generateQRCode = async (data: ProductQRData): Promise<string> => {
  try {
    const jsonData = JSON.stringify(data)
    const qrCode = await QRCode.toDataURL(jsonData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
    return qrCode
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Generate QR code for invoice that links to product info page
 */
export const generateInvoiceQRCode = async (orderId: string, productId: string): Promise<string> => {
  try {
    // Create a URL that points to the product info page
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const qrUrl = `${baseUrl}/product-info?orderId=${orderId}&productId=${productId}`

    const qrCode = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#4f46e5', // Invoice theme color
        light: '#ffffff',
      },
    })
    return qrCode
  } catch (error) {
    console.error('Error generating invoice QR code:', error)
    throw new Error('Failed to generate invoice QR code')
  }
}

/**
 * Decode QR code data (client-side)
 * This parses the JSON data from the QR code
 */
export const decodeQRData = (qrContent: string): ProductQRData | null => {
  try {
    const data = JSON.parse(qrContent)
    return data as ProductQRData
  } catch (error) {
    console.error('Error decoding QR data:', error)
    return null
  }
}

/**
 * Validate if decoded QR data has required fields
 */
export const validateQRData = (data: any): data is ProductQRData => {
  return (
    data &&
    typeof data === 'object' &&
    'orderId' in data &&
    'productName' in data &&
    'price' in data &&
    'quantity' in data
  )
}
