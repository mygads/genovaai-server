'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCreditCard, FaMoneyBillWave, FaTicketAlt, FaArrowLeft } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VoucherData {
  id: string;
  name: string;
  discountAmount?: number;
}

export default function TopUpPage() {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState(50000);
  const [customAmount, setCustomAmount] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [voucherApplied, setVoucherApplied] = useState<VoucherData | null>(null);
  const [discount, setDiscount] = useState(0);
  const [topupEnabled, setTopupEnabled] = useState(true);
  const [checkingTopup, setCheckingTopup] = useState(true);

  const BALANCE_PACKAGES = [
    { amount: 25000, popular: false },
    { amount: 50000, popular: true },
    { amount: 100000, popular: false },
    { amount: 250000, popular: false },
  ];

  useEffect(() => {
    checkTopupEnabled();
  }, []);

  async function checkTopupEnabled() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/customer/genovaai/system-config', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const topupConfig = data.data.find((c: { key: string; value: string }) => c.key === 'topup_enabled');
        setTopupEnabled(topupConfig?.value === 'true');
      }
    } catch (error) {
      console.error('Failed to check topup status:', error);
    } finally {
      setCheckingTopup(false);
    }
  }

  async function handleApplyVoucher() {
    if (!voucherCode) return;

    const amount = calculateAmount();
    if (amount < 10000) {
      alert('Minimum top-up amount is Rp 10.000');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/customer/genovaai/vouchers/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: voucherCode,
          amount,
          type: 'balance',
        }),
      });
      const data = await response.json();
      if (data.success) {
        setVoucherApplied(data.data);
        setDiscount(data.data.discountAmount || 0);
        alert(`Voucher applied! Discount: Rp ${(data.data.discountAmount || 0).toLocaleString('id-ID')}`);
      } else {
        setVoucherApplied(null);
        setDiscount(0);
        alert(data.error || 'Invalid voucher code');
      }
    } catch (error) {
      console.error('Failed to apply voucher:', error);
      alert('Failed to apply voucher');
    }
  }

  function calculateAmount(): number {
    return customAmount ? parseInt(customAmount, 10) || 0 : selectedAmount;
  }

  function calculateFinalAmount(): number {
    return Math.max(0, calculateAmount() - discount);
  }


  async function handleCheckout() {
    const amount = calculateAmount();
    if (amount < 10000) {
      alert('Minimum top-up amount is Rp 10.000');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/customer/genovaai/payment/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'balance',
          amount,
          voucherCode: voucherApplied ? voucherCode : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push(`/dashboard/payment/${data.data.paymentId}`);
      } else {
        alert(data.error || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Failed to checkout:', error);
      alert('Failed to checkout');
    } finally {
      setLoading(false);
    }
  }

  if (checkingTopup) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!topupEnabled) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FaArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Top Up Balance</h1>
          </div>
        </div>

        <Card className="border-yellow-500 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Top-Up Under Maintenance
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The top-up feature is currently under maintenance. Please try again later.
              </p>
              <button
                onClick={() => router.push('/dashboard/balance')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold mx-auto"
              >
                Back to Balance
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FaArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Top Up Balance</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Add balance for paid AI model requests and other Genova transactions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {BALANCE_PACKAGES.map((pkg) => (
          <Card
            key={pkg.amount}
            className={`cursor-pointer transition-all ${
              selectedAmount === pkg.amount && !customAmount
                ? 'ring-2 ring-blue-500 shadow-lg'
                : 'hover:shadow-md'
            } ${pkg.popular ? 'relative' : ''}`}
            onClick={() => {
              setSelectedAmount(pkg.amount);
              setCustomAmount('');
              setVoucherApplied(null);
              setDiscount(0);
            }}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                  Popular
                </span>
              </div>
            )}
            <CardContent className="pt-6 text-center">
              <div className="mb-4">
                <FaMoneyBillWave className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto" />
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                Rp {pkg.amount.toLocaleString('id-ID')}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Balance top-up</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Custom Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter Balance Amount
              </label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(0);
                  setVoucherApplied(null);
                  setDiscount(0);
                }}
                placeholder="Minimum Rp 10.000"
                min="10000"
                step="1000"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount to Pay
              </label>
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Rp {calculateAmount().toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaTicketAlt className="w-5 h-5 text-purple-600" />
            Check Voucher Code (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => {
                setVoucherCode(e.target.value.toUpperCase());
                setVoucherApplied(null);
                setDiscount(0);
              }}
              placeholder="Enter balance voucher code"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleApplyVoucher}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Check
            </button>
          </div>
          {voucherApplied && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                Voucher valid: <strong>{voucherApplied.name}</strong>
              </p>
              {discount > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Discount: Rp {discount.toLocaleString('id-ID')}
                </p>
              )}
            </div>
          )}
          <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Check if your voucher is valid before proceeding with payment. The voucher will be applied and used when payment is completed.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaCreditCard className="w-5 h-5 text-green-600" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Balance Top-Up</span>
            <span className="font-semibold text-gray-900 dark:text-white">Rp {calculateAmount().toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              Rp {calculateAmount().toLocaleString('id-ID')}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between items-center text-green-600 dark:text-green-400">
              <span>Discount</span>
              <span className="font-semibold">- Rp {discount.toLocaleString('id-ID')}</span>
            </div>
          )}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-bold text-gray-900 dark:text-white">Total Payment</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                Rp {calculateFinalAmount().toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <span>You will receive:</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                Rp {calculateAmount().toLocaleString('id-ID')} Balance
              </span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 font-semibold"
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
