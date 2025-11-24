'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FaCheckCircle, FaArrowRight, FaCreditCard, FaCoins } from 'react-icons/fa';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function PaymentSuccessPage() {
  const params = useParams();
  const paymentId = params.id as string;

  const [payment, setPayment] = useState<{
    id: string;
    amount: string;
    paymentMethod: string;
    status: string;
    createdAt: string;
  } | null>(null);
  const [transaction, setTransaction] = useState<{
    credits: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentDetails();
  }, [paymentId]);

  async function fetchPaymentDetails() {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch payment
      const paymentRes = await fetch(`/api/customer/genovaai/payment/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const paymentData = await paymentRes.json();
      
      if (paymentData.success) {
        setPayment(paymentData.data);
        
        // Fetch transaction
        if (paymentData.data.transactionId) {
          const transactionRes = await fetch(`/api/customer/genovaai/transactions/${paymentData.data.transactionId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const transactionData = await transactionRes.json();
          if (transactionData.success) {
            setTransaction(transactionData.data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-8 px-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Card */}
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <FaCheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your payment has been processed successfully
            </p>

            {transaction && (
              <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-6 py-3 rounded-lg">
                <FaCoins className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-bold text-blue-600">
                  +{transaction.credits} Credits Added
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Payment ID</span>
                <span className="font-mono text-sm text-gray-900 dark:text-white">{payment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Amount Paid</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Rp {parseFloat(payment.amount).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Payment Method</span>
                <span className="font-medium text-gray-900 dark:text-white">{payment.paymentMethod}</span>
              </div>
              {transaction && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Credits Received</span>
                  <span className="font-semibold text-blue-600">{transaction.credits} Credits</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Payment Date</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(payment.createdAt).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/dashboard/balance">
            <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <FaCreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">View Balance</span>
                  </div>
                  <FaArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard">
            <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <FaCoins className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">Go to Dashboard</span>
                  </div>
                  <FaArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Thank you for your payment!</strong> Your credits have been added to your account and are ready to use.
          </p>
        </div>
      </div>
    </div>
  );
}
