"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, CheckCircle, Clock, XCircle, Copy, ExternalLink, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PaymentDetail {
  id: string
  amount: string
  method: string
  status: string
  type: string
  creditAmount: number | null
  paymentUrl: string | null
  reference: string | null
  externalId: string | null
  expiresAt: string | null
  createdAt: string
  qrString: string | null
  gatewayResponse: {
    voucherCode?: string
    discount?: number
    creditBonus?: number
    balanceBonus?: number
    qrString?: string
  } | null
}

export default function PaymentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const paymentId = params.id as string
  
  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [countdown, setCountdown] = useState<string>("")

  useEffect(() => {
    fetchPaymentDetail()
  }, [paymentId])

  useEffect(() => {
    // Auto-refresh every 10 seconds if payment is pending
    if (payment && payment.status === 'pending') {
      const interval = setInterval(() => {
        fetchPaymentDetail(true)
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [payment?.status])

  useEffect(() => {
    if (payment?.expiresAt && payment.status === 'pending') {
      const interval = setInterval(() => {
        const now = new Date()
        const expiry = new Date(payment.expiresAt!)
        const diff = expiry.getTime() - now.getTime()

        if (diff <= 0) {
          setCountdown("Expired")
          clearInterval(interval)
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)
          setCountdown(`${hours}h ${minutes}m ${seconds}s`)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [payment])

  async function fetchPaymentDetail(silent = false) {
    if (!silent) setLoading(true)
    if (silent) setRefreshing(true)
    
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`http://localhost:8090/api/customer/genovaai/payment/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      
      if (data.success) {
        setPayment(data.data)
        
        // Redirect to balance page if payment is completed
        if (data.data.status === 'completed') {
          setTimeout(() => {
            router.push('/dashboard/balance')
          }, 3000)
        }
      } else {
        console.error('Failed to fetch payment:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch payment:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  function getStatusBadge(status: string) {
    const statusConfig = {
      pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30', label: 'Pending' },
      completed: { icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900/30', label: 'Completed' },
      failed: { icon: XCircle, color: 'text-red-600 bg-red-100 dark:bg-red-900/30', label: 'Failed' },
      expired: { icon: XCircle, color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30', label: 'Expired' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${config.color}`}>
        <Icon className="w-5 h-5" />
        <span className="font-semibold">{config.label}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading payment details...</div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <XCircle className="w-16 h-16 text-red-500" />
        <div className="text-lg text-gray-500 dark:text-gray-400">Payment not found</div>
        <button
          onClick={() => router.push('/dashboard/balance')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Balance
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/balance')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Payment Details
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track your payment status
          </p>
        </div>
        {payment.status === 'pending' && (
          <button
            onClick={() => fetchPaymentDetail(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Status:</span>
            {getStatusBadge(payment.status)}
          </div>

          {payment.status === 'pending' && countdown && countdown !== "Expired" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  ⏱️ Time remaining to complete payment:
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {countdown}
                </span>
              </div>
            </div>
          )}

          {payment.status === 'completed' && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-green-700 dark:text-green-300">
                ✅ Payment successful! Your {payment.type === 'credit' ? 'credits' : 'balance'} has been added to your account.
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                Redirecting to balance page in 3 seconds...
              </p>
            </div>
          )}

          {payment.status === 'failed' && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300">
                ❌ Payment failed. Please try again or contact support.
              </p>
            </div>
          )}

          {payment.status === 'expired' && (
            <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300">
                ⏰ Payment expired. Please create a new payment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Payment ID</span>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-mono text-sm">{payment.id}</p>
                <button
                  onClick={() => copyToClipboard(payment.id)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
              <p className="font-bold text-lg mt-1">
                Rp {parseFloat(payment.amount).toLocaleString('id-ID')}
              </p>
            </div>

            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Payment Method</span>
              <p className="font-semibold mt-1">
                {payment.method.includes('QRIS') || payment.method.includes('_SP') || payment.method.includes('_NQ') || payment.method.includes('_GQ') || payment.method.includes('_SQ') 
                  ? 'QRIS' 
                  : payment.method.replace('duitku_', '').replace('_', ' ')}
              </p>
            </div>

            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Type</span>
              <p className="font-semibold mt-1 capitalize">{payment.type}</p>
            </div>

            {payment.creditAmount && (
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Credits</span>
                <p className="font-bold text-lg text-blue-600 dark:text-blue-400 mt-1">
                  {payment.creditAmount} Credits
                </p>
              </div>
            )}

            {payment.reference && (
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">VA Number / Reference</span>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono font-bold text-lg">{payment.reference}</p>
                  <button
                    onClick={() => copyToClipboard(payment.reference!)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Created At</span>
              <p className="mt-1">{new Date(payment.createdAt).toLocaleString('id-ID')}</p>
            </div>

            {payment.expiresAt && (
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Expires At</span>
                <p className="mt-1">{new Date(payment.expiresAt).toLocaleString('id-ID')}</p>
              </div>
            )}
          </div>

          {payment.qrString && payment.status === 'pending' && (
            <div className="pt-4 border-t">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">
                    Scan QR Code to Pay
                  </h3>
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payment.qrString)}`}
                        alt="QR Code Payment"
                        className="w-64 h-64"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                    Scan with any e-wallet app that supports QRIS
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 <strong>How to pay:</strong> Open your e-wallet app (GoPay, OVO, Dana, ShopeePay, etc), 
                    select scan QR, and scan the QR code above.
                  </p>
                </div>
              </div>
            </div>
          )}

          {payment.paymentUrl && payment.status === 'pending' && !payment.qrString && (
            <div className="pt-4 border-t">
              <a
                href={payment.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <ExternalLink className="w-5 h-5" />
                Open Payment Page
              </a>
            </div>
          )}

          {payment.gatewayResponse?.voucherCode && (
            <div className="pt-4 border-t">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
                  🎟️ Voucher Applied
                </p>
                <div className="space-y-1 text-sm text-purple-600 dark:text-purple-400">
                  <p>Code: <span className="font-mono font-bold">{payment.gatewayResponse.voucherCode}</span></p>
                  {(payment.gatewayResponse.discount ?? 0) > 0 && (
                    <p>Discount: Rp {payment.gatewayResponse.discount!.toLocaleString('id-ID')}</p>
                  )}
                  {(payment.gatewayResponse.creditBonus ?? 0) > 0 && (
                    <p>Bonus Credits: +{payment.gatewayResponse.creditBonus}</p>
                  )}
                  {(payment.gatewayResponse.balanceBonus ?? 0) > 0 && (
                    <p>Bonus Balance: Rp {payment.gatewayResponse.balanceBonus!.toLocaleString('id-ID')}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      {payment.status === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <li>Click &quot;Open Payment Page&quot; button above</li>
                <li>Complete the payment using your selected method</li>
                <li>Return to this page to see updated status</li>
                <li>Your {payment.type === 'credit' ? 'credits' : 'balance'} will be added automatically after payment is confirmed</li>
              </ol>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ <strong>Important:</strong> Make sure to complete the payment before the expiration time. 
                After expiration, you&apos;ll need to create a new payment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
