/**
 * Email Notification Service
 * Handles sending emails for support replies and system notifications
 */

export interface EmailTemplate {
  subject: string
  htmlContent: string
}

/**
 * Generate email template for support reply
 */
export const generateSupportReplyEmail = (
  userName: string,
  ticketId: string,
  ticketSubject: string,
  adminMessage: string,
  ticketUrl: string
): EmailTemplate => {
  return {
    subject: `RE: ${ticketSubject} - Support Team Response`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; }
          .footer { background-color: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; }
          .button { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          .message-box { background-color: white; padding: 15px; border-left: 4px solid #4f46e5; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Support Team Response</h2>
          </div>
          
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            
            <p>We have a response to your support ticket:</p>
            
            <div class="message-box">
              <strong>Ticket:</strong> ${ticketSubject}<br>
              <strong>Ticket ID:</strong> ${ticketId}<br><br>
              <strong>Admin Response:</strong><br>
              <p>${adminMessage.replace(/\n/g, '<br>')}</p>
            </div>
            
            <p>You can view the full conversation and reply at:</p>
            
            <a href="${ticketUrl}" class="button">View Ticket</a>
            
            <p>Thank you for contacting our support team!</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #666; font-size: 12px;">
              This is an automated notification from ScanKart Support System.<br>
              Please do not reply to this email. Use the link above to respond.
            </p>
          </div>
          
          <div class="footer">
            <p>ScanKart © ${new Date().getFullYear()} | All Rights Reserved</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}

/**
 * Generate email template for order confirmation
 */
export const generateOrderConfirmationEmail = (
  userName: string,
  orderId: string,
  items: any[],
  totalAmount: number,
  orderUrl: string
): EmailTemplate => {
  const itemsHtml = items
    .map(
      item =>
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">×${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price.toFixed(2)}</td>
        </tr>`
    )
    .join('')

  return {
    subject: `Order Confirmation - #${orderId}`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; }
          .footer { background-color: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; }
          .button { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          table th { background-color: #f3f4f6; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Order Confirmation</h2>
          </div>
          
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            
            <p>Thank you for your order! Here are your order details:</p>
            
            <p><strong>Order ID:</strong> ${orderId}</p>
            
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px;">
              Total: ₹${totalAmount.toFixed(2)}
            </div>
            
            <p style="margin-top: 20px;">Track your order status:</p>
            <a href="${orderUrl}" class="button">View Order</a>
            
            <p style="margin-top: 30px;">If you have any questions, please contact our support team.</p>
          </div>
          
          <div class="footer">
            <p>ScanKart © ${new Date().getFullYear()} | All Rights Reserved</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}

/**
 * Send email via Firebase Cloud Functions
 * This function would call a backend API that uses Firebase Cloud Functions
 */
export const sendEmail = async (
  toEmail: string,
  emailTemplate: EmailTemplate
): Promise<boolean> => {
  try {
    // In a real application, you would call a backend endpoint
    // that uses Firebase Cloud Functions or another email service like SendGrid
    
    // For now, we'll create a placeholder that logs the email
    console.log(`📧 Email sent to: ${toEmail}`)
    console.log(`Subject: ${emailTemplate.subject}`)
    
    // In production, you'd call your backend API:
    // const response = await fetch('/api/send-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     to: toEmail,
    //     subject: emailTemplate.subject,
    //     html: emailTemplate.htmlContent,
    //   }),
    // })
    // return response.ok
    
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

/**
 * Send support reply email
 */
export const sendSupportReplyEmail = async (
  userEmail: string,
  userName: string,
  ticketId: string,
  ticketSubject: string,
  adminMessage: string
): Promise<boolean> => {
  const emailTemplate = generateSupportReplyEmail(
    userName,
    ticketId,
    ticketSubject,
    adminMessage,
    `${window.location.origin}/support-tickets`
  )
  return sendEmail(userEmail, emailTemplate)
}

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (
  userEmail: string,
  userName: string,
  orderId: string,
  items: any[],
  totalAmount: number
): Promise<boolean> => {
  const emailTemplate = generateOrderConfirmationEmail(
    userName,
    orderId,
    items,
    totalAmount,
    `${window.location.origin}/orders`
  )
  return sendEmail(userEmail, emailTemplate)
}
