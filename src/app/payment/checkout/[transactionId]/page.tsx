'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaArrowLeft, FaCreditCard, FaTicketAlt, FaWallet, FaMoneyBillWave, FaUniversity, FaQrcode, FaMobileAlt } from 'react-icons/fa';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface PaymentMethod {
  code: string;
  name: string;
  type: 'va' | 'ewallet' | 'retail' | 'qris';
  fee: number;
  icon: any;
}

const paymentMethods: PaymentMethod[] = [
  // Virtual Account
  { code: 'BCA', name: 'BCA Virtual Account', type: 'va', fee: 4000, icon: FaUniversity },
  { code: 'BNI', name: 'BNI Virtual Account', type: 'va', fee: 4000, icon: FaUniversity },
  { code: 'MANDIRI', name: 'Mandiri Virtual Account', type: 'va', fee: 4000, icon: FaUniversity },
  { code: 'BRI', name: 'BRI Virtual Account', type: 'va', fee: 4000, icon: FaUniversity },
  { code: 'PERMATA', name: 'Permata Virtual Account', type: 'va', fee: 4000, icon: FaUniversity },
  
  // E-Wallet
  { code: 'OVO', name: 'OVO', type: 'ewallet', fee: 0, icon: FaWallet },
  { code: 'DANA', name: 'DANA', type: 'ewallet', fee: 0, icon: FaWallet },
  { code: 'SHOPEEPAY', name: 'ShopeePay', type: 'ewallet', fee: 0, icon: FaWallet },
  { code: 'LINKAJA', name: 'LinkAja', type: 'ewallet', fee: 0, icon: FaWallet },
  
  // QRIS
  { code: 'QRIS', name: 'QRIS', type: 'qris', fee: 0, icon: FaQrcode },
  
  // Retail
  { code: 'ALFAMART', name: 'Alfamart', type: 'retail', fee: 2500, icon: FaMobileAlt },
  { code: 'INDOMARET', name: 'Indomaret', type: 'retail', fee: 2500, icon: FaMobileAlt },
];

export default function PaymentCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.transactionId as string;

  const [transaction, setTransaction] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTransaction();
  }, [transactionId]);

  async function fetchTransaction() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8090/api/customer/genovaai/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTransaction(data.data);
        
        // Check if already paid
        if (data.data.status === 'completed') {
          router.push(`/payment/success/${transactionId}`);
        }
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment() {
    if (!selectedMethod) {
      alert('Please select a payment method');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('accessToken');
      const method = paymentMethods.find(m => m.code === selectedMethod);
      
      const response = await fetch('http://localhost:8090/api/customer/genovaai/payment/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          paymentMethod: selectedMethod,
          paymentChannel: method?.type,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Redirect to payment status page
        router.push(`/payment/status/${data.data.paymentId}`);
      } else {
        alert(data.message || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to process payment');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-red-600">Transaction not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedMethods = {
    va: paymentMethods.filter(m => m.type === 'va'),
    ewallet: paymentMethods.filter(m => m.type === 'ewallet'),
    qris: paymentMethods.filter(m => m.type === 'qris'),
    retail: paymentMethods.filter(m => m.type === 'retail'),
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/balance/topup"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FaArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <div className="lg:col-span-2 space-y-6">
          {/* Virtual Account */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaUniversity className="w-5 h-5 text-blue-600" />
                Virtual Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groupedMethods.va.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.code}
                      onClick={() => setSelectedMethod(method.code)}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        selectedMethod === method.code
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900 dark:text-white">{method.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">+Rp {method.fee.toLocaleString('id-ID')}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* E-Wallet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaWallet className="w-5 h-5 text-purple-600" />
                E-Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groupedMethods.ewallet.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.code}
                      onClick={() => setSelectedMethod(method.code)}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        selectedMethod === method.code
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-gray-900 dark:text-white">{method.name}</span>
                      </div>
                      <span className="text-sm text-green-600">No Fee</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* QRIS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaQrcode className="w-5 h-5 text-green-600" />
                QRIS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groupedMethods.qris.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.code}
                      onClick={() => setSelectedMethod(method.code)}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        selectedMethod === method.code
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-900 dark:text-white">{method.name}</span>
                      </div>
                      <span className="text-sm text-green-600">No Fee</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Retail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaMobileAlt className="w-5 h-5 text-orange-600" />
                Retail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groupedMethods.retail.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.code}
                      onClick={() => setSelectedMethod(method.code)}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        selectedMethod === method.code
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-orange-600" />
                        <span className="font-medium text-gray-900 dark:text-white">{method.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">+Rp {method.fee.toLocaleString('id-ID')}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Amount</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Rp {parseFloat(transaction.amount).toLocaleString('id-ID')}
                  </span>
                </div>
                {transaction.discount > 0 && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Discount</span>
                    <span className="font-medium text-green-600">
                      -Rp {parseFloat(transaction.discount).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                {selectedMethod && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Payment Fee</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      +Rp {(paymentMethods.find(m => m.code === selectedMethod)?.fee || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="font-bold text-blue-600 text-lg">
                      Rp {(
                        parseFloat(transaction.amount) - 
                        parseFloat(transaction.discount) + 
                        (paymentMethods.find(m => m.code === selectedMethod)?.fee || 0)
                      ).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {transaction.voucherCode && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <FaTicketAlt className="w-4 h-4" />
                    <span className="text-sm font-medium">Voucher Applied</span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Code: {transaction.voucherCode}
                  </p>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={!selectedMethod || processing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {processing ? 'Processing...' : 'Continue to Payment'}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                By continuing, you agree to our terms and conditions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
