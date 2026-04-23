'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  MessageSquare,
  Mail,
  Phone,
  Globe,
  Send,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { GlassCard, GlassCardContent, GlassCardTitle, GlassCardDescription } from '@/components/glass-card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { addSupportTicket } from '@/lib/firestore-db'
import { useStore } from '@/lib/store'

const SUPPORT_CATEGORIES = [
  { value: 'technical', label: 'Technical Issue' },
  { value: 'payment', label: 'Payment Problem' },
  { value: 'order', label: 'Order Issue' },
  { value: 'product', label: 'Product Question' },
  { value: 'account', label: 'Account Help' },
  { value: 'shipping', label: 'Shipping & Delivery' },
  { value: 'other', label: 'Other' },
]

const SUPPORT_CHANNELS = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'support@scankart.com',
    response: '24-48 hours',
  },
  {
    icon: Phone,
    title: 'WhatsApp Support',
    description: '+91 8651365475',
    response: '1-2 hours',
  },
  {
    icon: MessageSquare,
    title: 'Chat Support',
    description: 'Available 9 AM - 6 PM',
    response: '15-30 minutes',
  },
  {
    icon: Globe,
    title: 'Visit Website',
    description: 'self-service help center',
    response: 'Instant',
  },
]

export default function HelpPage() {
  const { user } = useStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    category: '',
    subject: '',
    description: '',
    orderNumber: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.category || !formData.subject || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const ticketId = await addSupportTicket({
        userId: user?.id || 'anonymous',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        category: formData.category,
        subject: formData.subject,
        description: formData.description,
        orderNumber: formData.orderNumber || null,
        status: 'open',
        priority: 'normal',
      })

      setSubmitted(true)
      toast.success(`Support ticket created! ID: ${ticketId}`)
      
      // Reset form
      setTimeout(() => {
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          category: '',
          subject: '',
          description: '',
          orderNumber: '',
        })
        setSubmitted(false)
      }, 3000)
    } catch (error) {
      console.error('Error creating support ticket:', error)
      toast.error('Failed to create support ticket. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Help & Support</h1>
            <p className="text-gray-600 dark:text-gray-400">We're here to help! Choose how you'd like to contact us</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Support Channels */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Channels</h2>
            <div className="space-y-4">
              {SUPPORT_CHANNELS.map((channel, idx) => {
                const IconComponent = channel.icon
                return (
                  <GlassCard key={idx}>
                    <GlassCardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{channel.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{channel.description}</p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400">
                            <Clock className="w-3 h-3" />
                            {channel.response}
                          </div>
                        </div>
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                )
              })}
            </div>

            {/* FAQ Section */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Help</h3>
              <GlassCard>
                <GlassCardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">How to reset password?</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Use "Forgot Password" on login page</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">Track my order?</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Go to Orders section for tracking</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">Return/Refund policy?</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">30 days return from delivery</p>
                      </div>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </div>
          </div>

          {/* Support Form */}
          <div className="lg:col-span-2">
            <GlassCard>
              <GlassCardTitle className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Submit a Support Ticket
              </GlassCardTitle>
              <GlassCardDescription>
                Tell us about your issue and we'll get back to you as soon as possible
              </GlassCardDescription>

              <GlassCardContent className="pt-6">
                {submitted ? (
                  <div className="py-12 text-center">
                    <div className="flex justify-center mb-4">
                      <CheckCircle className="w-16 h-16 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Thank you for contacting us!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      We've received your support request and will respond shortly
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        A confirmation email has been sent to <strong>{formData.email}</strong>
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Info Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Full Name *
                        </label>
                        <Input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your name"
                          disabled={!!user?.name}
                          className="dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address *
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your.email@example.com"
                          disabled={!!user?.email}
                          className="dark:bg-slate-800"
                        />
                      </div>
                    </div>

                    {/* Phone and Category Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number
                        </label>
                        <Input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+91 XXXXXXXXXX"
                          className="dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Issue Category *
                        </label>
                        <Select value={formData.category} onValueChange={handleCategoryChange}>
                          <SelectTrigger className="dark:bg-slate-800">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORT_CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Order Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Order Number (if applicable)
                      </label>
                      <Input
                        type="text"
                        name="orderNumber"
                        value={formData.orderNumber}
                        onChange={handleInputChange}
                        placeholder="e.g., ORD-2024-12345"
                        className="dark:bg-slate-800"
                      />
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Subject *
                      </label>
                      <Input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Brief description of your issue"
                        className="dark:bg-slate-800"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Detailed Description *
                      </label>
                      <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Please provide detailed information about your issue..."
                        rows={5}
                        className="dark:bg-slate-800"
                      />
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <p className="text-sm text-blue-900 dark:text-blue-300">
                        We typically respond to support requests within 24-48 hours. For urgent issues, please contact us via WhatsApp or phone.
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Send className="w-5 h-5" />
                          Submit Support Ticket
                        </div>
                      )}
                    </Button>
                  </form>
                )}
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
