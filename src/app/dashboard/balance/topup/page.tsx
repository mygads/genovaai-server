'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCreditCard, FaCoins, FaTicketAlt, FaArrowLeft } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TopUpPage() {
  const router = useRouter();
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [selectedCredits, setSelectedCredits] = useState(10);
  const [customCredits, setCustomCredits] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [voucherApplied, setVoucherApplied] = useState<any>(null);
  const [discount, setDiscount] = useState(0);

  const CREDIT_PACKAGES = [
    { credits: 10, popular: false },
    { credits: 50, popular: true },
    { credits: 100, popular: false },
    { credits: 200, popular: false },
  ];

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  async function fetchExchangeRate() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/customer/genovaai/exchange', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setExchangeRate(data.data.rate);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
    }
  }

  async function handleApplyVoucher() {
    if (!voucherCode) return;

    const amount = calculateAmount();
    
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
          amount: amount,
          type: 'credit', // Only credit vouchers
        }),
      });
      const data = await response.json();
      if (data.success) {
        setVoucherApplied(data.data);
        setDiscount(data.data.discountAmount || 0);
        alert(`Voucher applied! ${data.data.creditBonus ? `+${data.data.creditBonus} bonus credits` : `Discount: Rp ${data.data.discountAmount?.toLocaleString('id-ID')}`}`);
      } else {
        alert(data.error || 'Invalid voucher code');
      }
    } catch (error) {
      console.error('Failed to apply voucher:', error);
      alert('Failed to apply voucher');
    }
  }

  function calculateAmount(): number {
    if (!exchangeRate) return 0;
    const credits = customCredits ? parseInt(customCredits) : selectedCredits;
    return credits * exchangeRate;
  }

  function calculateFinalAmount(): number {
    return Math.max(0, calculateAmount() - discount);
  }

  function getCreditsAmount(): number {
    return customCredits ? parseInt(customCredits) || 0 : selectedCredits;
  }

  function getTotalCredits(): number {
    return getCreditsAmount() + (voucherApplied?.creditBonus || 0);
  }

  async function handleCheckout() {
    if (!exchangeRate) {
      alert('Exchange rate not loaded');
      return;
    }

    const credits = getCreditsAmount();
    if (credits < 1) {
      alert('Minimum 1 credit');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Create payment
      const response = await fetch('/api/customer/genovaai/payment/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'credit',
          credits: credits,
          amount: calculateFinalAmount(),
          voucherCode: voucherApplied ? voucherCode : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Redirect to payment page
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

  if (!exchangeRate) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading...</div>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Buy Credits</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Exchange Rate: Rp {exchangeRate.toLocaleString('id-ID')} = 1 Credit
          </p>
        </div>
      </div>

      {/* Package Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {CREDIT_PACKAGES.map((pkg) => (
          <Card
            key={pkg.credits}
            className={`cursor-pointer transition-all ${
              selectedCredits === pkg.credits && !customCredits
                ? 'ring-2 ring-blue-500 shadow-lg'
                : 'hover:shadow-md'
            } ${pkg.popular ? 'relative' : ''}`}
            onClick={() => {
              setSelectedCredits(pkg.credits);
              setCustomCredits('');
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
                <FaCoins className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto" />
              </div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {pkg.credits}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Credits</p>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                Rp {(pkg.credits * exchangeRate).toLocaleString('id-ID')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Amount */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Custom Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter Credits
              </label>
              <input
                type="number"
                value={customCredits}
                onChange={(e) => {
                  setCustomCredits(e.target.value);
                  setSelectedCredits(0);
                }}
                placeholder="Enter number of credits"
                min="1"
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

      {/* Voucher Section */}
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
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="Enter voucher code"
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
                ✓ Voucher valid: <strong>{voucherApplied.name}</strong>
              </p>
              {discount > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Discount: Rp {discount.toLocaleString('id-ID')}
                </p>
              )}
              {voucherApplied.creditBonus > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Bonus: +{voucherApplied.creditBonus} credits
                </p>
              )}
            </div>
          )}
          <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Tip:</strong> Check if your voucher is valid before proceeding with payment. The voucher will be applied and used when payment is completed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaCreditCard className="w-5 h-5 text-green-600" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Credits</span>
            <span className="font-semibold text-gray-900 dark:text-white">{getCreditsAmount()}</span>
          </div>
          {voucherApplied?.creditBonus > 0 && (
            <div className="flex justify-between items-center text-green-600 dark:text-green-400">
              <span>Bonus Credits</span>
              <span className="font-semibold">+{voucherApplied.creditBonus}</span>
            </div>
          )}
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
                {getTotalCredits()} Credits
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
