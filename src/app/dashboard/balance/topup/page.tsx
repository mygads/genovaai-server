'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCreditCard, FaCoins, FaTicketAlt, FaArrowLeft } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TOPUP_PACKAGES = [
  { id: 'topup_50k', name: 'Starter', amount: 50000, credits: 50, bonus: 0, popular: false },
  { id: 'topup_100k', name: 'Basic', amount: 100000, credits: 100, bonus: 10, popular: true },
  { id: 'topup_200k', name: 'Pro', amount: 200000, credits: 200, bonus: 30, popular: false },
  { id: 'topup_500k', name: 'Business', amount: 500000, credits: 500, bonus: 100, popular: false },
];

export default function TopUpPage() {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState(TOPUP_PACKAGES[1]);
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [voucherApplied, setVoucherApplied] = useState<any>(null);
  const [discount, setDiscount] = useState(0);

  async function handleApplyVoucher() {
    if (!voucherCode) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8090/api/customer/genovaai/vouchers/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: voucherCode,
          amount: selectedPackage.amount,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setVoucherApplied(data.data);
        setDiscount(data.data.discountAmount);
        alert('Voucher applied successfully!');
      } else {
        alert(data.error || 'Invalid voucher code');
      }
    } catch (error) {
      console.error('Failed to apply voucher:', error);
      alert('Failed to apply voucher');
    }
  }

  async function handleCheckout() {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Create transaction
      const response = await fetch('http://localhost:8090/api/customer/genovaai/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'topup',
          amount: selectedPackage.amount,
          credits: selectedPackage.credits + selectedPackage.bonus,
          voucherCode: voucherApplied ? voucherCode : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Redirect to payment selection
        router.push(`/payment/checkout/${data.data.transactionId}`);
      } else {
        alert(data.error || 'Failed to create transaction');
      }
    } catch (error) {
      console.error('Failed to checkout:', error);
      alert('Failed to checkout');
    } finally {
      setLoading(false);
    }
  }

  const finalAmount = selectedPackage.amount - discount;

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
          <p className="text-gray-500 dark:text-gray-400 mt-1">Choose a package and complete payment</p>
        </div>
      </div>

      {/* Package Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOPUP_PACKAGES.map((pkg) => (
          <Card
            key={pkg.id}
            className={`cursor-pointer transition-all ${
              selectedPackage.id === pkg.id
                ? 'ring-2 ring-blue-500 shadow-lg'
                : 'hover:shadow-md'
            } ${pkg.popular ? 'relative' : ''}`}
            onClick={() => setSelectedPackage(pkg)}
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{pkg.name}</h3>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {pkg.credits + pkg.bonus}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Credits</p>
              {pkg.bonus > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400 mb-2">+{pkg.bonus} Bonus</p>
              )}
              <div className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
                Rp {pkg.amount.toLocaleString('id-ID')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Voucher Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaTicketAlt className="w-5 h-5 text-purple-600" />
            Apply Voucher Code
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
              Apply
            </button>
          </div>
          {voucherApplied && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                ✓ Voucher applied: <strong>{voucherApplied.name}</strong>
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Discount: Rp {discount.toLocaleString('id-ID')}
              </p>
            </div>
          )}
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
            <span className="text-gray-600 dark:text-gray-400">Package</span>
            <span className="font-semibold text-gray-900 dark:text-white">{selectedPackage.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Credits</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {selectedPackage.credits} {selectedPackage.bonus > 0 && `+ ${selectedPackage.bonus} bonus`}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Amount</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              Rp {selectedPackage.amount.toLocaleString('id-ID')}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between items-center text-green-600 dark:text-green-400">
              <span>Discount</span>
              <span className="font-semibold">- Rp {discount.toLocaleString('id-ID')}</span>
            </div>
          )}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                Rp {finalAmount.toLocaleString('id-ID')}
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
