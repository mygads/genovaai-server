'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaCopy, FaClock, FaCheckCircle, FaQrcode, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PaymentStatusPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.id as string;

  const [payment, setPayment] = useState<{
    id: string;
    amount: string;
    paymentMethod: string;
    status: string;
    vaNumber?: string;
    qrString?: string;
    paymentUrl?: string;
    expiryTime?: string;
    createdAt: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');

  const fetchPayment = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/customer/genovaai/payment/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPayment(data.data);
        
        // Redirect to success page if completed
        if (data.data.status === 'completed') {
          router.push(`/payment/success/${paymentId}`);
        }
      }
    } catch (error) {
      console.error('Error fetching payment:', error);
    } finally {
      setLoading(false);
    }
  }, [paymentId, router]);

  useEffect(() => {
    fetchPayment();
    const interval = setInterval(fetchPayment, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchPayment]);

  useEffect(() => {
    if (payment?.expiryTime) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(payment.expiryTime!).getTime();
        const diff = expiry - now;

        if (diff <= 0) {
          setCountdown('Expired');
          clearInterval(timer);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [payment]);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="text-center text-gray-500 dark:text-gray-400">Loading payment details...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="text-center text-red-600">Payment not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/balance"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FaArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Details</h1>
        </div>

        {/* Status Card */}
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                <FaClock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Waiting for Payment
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please complete your payment before the time expires
            </p>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <FaClock className="w-4 h-4 mr-2" />
              {countdown}
            </Badge>
          </CardContent>
        </Card>

        {/* Payment Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Virtual Account */}
            {payment.vaNumber && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Virtual Account Number
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={payment.vaNumber}
                    readOnly
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-lg"
                  />
                  <button
                    onClick={() => payment.vaNumber && copyToClipboard(payment.vaNumber)}
                    disabled={!payment.vaNumber}
                    className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    <FaCopy className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium text-gray-900 dark:text-white">How to pay:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Open your banking app or visit ATM</li>
                    <li>Select Transfer / Virtual Account</li>
                    <li>Enter the VA number above</li>
                    <li>Verify the amount: Rp {parseFloat(payment.amount).toLocaleString('id-ID')}</li>
                    <li>Complete the payment</li>
                  </ol>
                </div>
              </div>
            )}

            {/* QRIS */}
            {payment.qrString && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scan QR Code
                </label>
                <div className="flex justify-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="w-64 h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <FaQrcode className="w-32 h-32 text-gray-400" />
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium text-gray-900 dark:text-white">How to pay:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Open any e-wallet app that supports QRIS</li>
                    <li>Scan the QR code above</li>
                    <li>Verify the amount: Rp {parseFloat(payment.amount).toLocaleString('id-ID')}</li>
                    <li>Complete the payment</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Payment URL */}
            {payment.paymentUrl && !payment.vaNumber && !payment.qrString && (
              <div>
                <a
                  href={payment.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-center transition-colors"
                >
                  Continue to Payment Page
                </a>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                  You will be redirected to complete your payment
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Payment Method</span>
                <span className="font-medium text-gray-900 dark:text-white">{payment.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Amount</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Rp {parseFloat(payment.amount).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                  {payment.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created At</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(payment.createdAt).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Important:</strong> Your payment will be automatically verified. Please do not refresh or close this page.
            Once payment is confirmed, you will be redirected automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
