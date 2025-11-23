'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCreditCard, FaCoins, FaHistory, FaPlus, FaExchangeAlt } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BalanceInfo {
  balance: string;
  credits: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  credits: number;
  description: string | null;
  createdAt: string;
  status: string;
}

export default function BalancePage() {
  const router = useRouter();
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [exchanging, setExchanging] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherType, setVoucherType] = useState<'balance' | 'credit'>('balance');
  const [validatingVoucher, setValidatingVoucher] = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
    fetchExchangeRate();
  }, []);

  async function fetchBalance() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8090/api/customer/genovaai/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setBalanceInfo({
          balance: data.data.balance,
          credits: data.data.credits,
        });
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTransactions() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8090/api/customer/genovaai/transactions?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  }

  async function fetchExchangeRate() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8090/api/customer/genovaai/exchange', {
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

  async function handleExchange() {
    if (!exchangeAmount || parseFloat(exchangeAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!exchangeRate) {
      alert('Exchange rate not available');
      return;
    }

    const amount = parseFloat(exchangeAmount);
    if (amount < exchangeRate) {
      alert(`Minimum exchange amount is Rp ${exchangeRate.toLocaleString('id-ID')}`);
      return;
    }

    if (amount > parseFloat(balanceInfo?.balance || '0')) {
      alert('Insufficient balance');
      return;
    }

    setExchanging(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8090/api/customer/genovaai/exchange', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ balanceAmount: amount }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully exchanged! Received ${data.data.creditsReceived} credits`);
        setShowExchangeModal(false);
        setExchangeAmount('');
        fetchBalance();
        fetchTransactions();
      } else {
        alert(data.error || 'Failed to exchange');
      }
    } catch (error) {
      console.error('Exchange error:', error);
      alert('Failed to exchange balance');
    } finally {
      setExchanging(false);
    }
  }

  function calculateCredits(amount: string): number {
    if (!exchangeRate || !amount) return 0;
    const num = parseFloat(amount);
    if (isNaN(num)) return 0;
    return Math.floor(num / exchangeRate);
  }

  async function handleCheckVoucher() {
    if (!voucherCode.trim()) {
      alert('Please enter voucher code');
      return;
    }

    setValidatingVoucher(true);
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
          amount: 0, // No amount check for preview
          type: voucherType,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const bonus = voucherType === 'balance' 
          ? `Rp ${(data.data.balanceBonus || 0).toLocaleString('id-ID')}` 
          : `${data.data.creditBonus || 0} credits`;
        const discount = data.data.discountAmount > 0 
          ? `Discount: Rp ${data.data.discountAmount.toLocaleString('id-ID')}` 
          : '';
        alert(`✅ Valid voucher!\n${discount}${discount && bonus ? '\n' : ''}${bonus ? `Bonus: ${bonus}` : ''}\n\nUse this code when making a payment.`);
        setShowVoucherModal(false);
        setVoucherCode('');
      } else {
        alert(data.error || 'Invalid voucher code');
      }
    } catch (error) {
      console.error('Voucher validation error:', error);
      alert('Failed to validate voucher');
    } finally {
      setValidatingVoucher(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading balance...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Balance & Credits</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account balance</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowVoucherModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            Check Voucher
          </button>
          <button
            onClick={() => setShowExchangeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FaExchangeAlt className="w-4 h-4" />
            Exchange to Credits
          </button>
          <button
            onClick={() => router.push('/dashboard/balance/topup')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            Top Up
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Balance</p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                  Rp {parseFloat(balanceInfo?.balance || '0').toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Available balance</p>
              </div>
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FaCreditCard className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Credits</p>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {balanceInfo?.credits || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Premium requests</p>
              </div>
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FaCoins className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaHistory className="w-5 h-5 text-purple-600" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {transaction.type.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {transaction.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {transaction.credits !== 0 ? (
                          <span className={transaction.credits > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {transaction.credits > 0 ? '+' : ''}{transaction.credits} credits
                          </span>
                        ) : (
                          <span className={parseFloat(transaction.amount) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            Rp {parseFloat(transaction.amount).toLocaleString('id-ID')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.status === 'success'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Modal */}
      {showExchangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Exchange Balance to Credits
                </h2>
                <button
                  onClick={() => setShowExchangeModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Exchange Rate:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      Rp {exchangeRate?.toLocaleString('id-ID')} = 1 Credit
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Balance Amount (Rp)
                  </label>
                  <input
                    type="number"
                    value={exchangeAmount}
                    onChange={(e) => setExchangeAmount(e.target.value)}
                    placeholder={`Min. ${exchangeRate?.toLocaleString('id-ID')}`}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Available: Rp {parseFloat(balanceInfo?.balance || '0').toLocaleString('id-ID')}
                  </p>
                </div>

                {exchangeAmount && parseFloat(exchangeAmount) >= (exchangeRate || 0) && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">You will receive:</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {calculateCredits(exchangeAmount)} Credits
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowExchangeModal(false);
                      setExchangeAmount('');
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExchange}
                    disabled={exchanging || !exchangeAmount || parseFloat(exchangeAmount) < (exchangeRate || 0)}
                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
                  >
                    {exchanging ? 'Processing...' : 'Exchange Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Check Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Check Voucher</h3>
                <button
                  onClick={() => {
                    setShowVoucherModal(false);
                    setVoucherCode('');
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Voucher Type
                  </label>
                  <select
                    value={voucherType}
                    onChange={(e) => setVoucherType(e.target.value as 'balance' | 'credit')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="balance">Balance Voucher (for top-up)</option>
                    <option value="credit">Credit Voucher (for buy credits)</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Select the voucher type you want to check
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Voucher Code
                  </label>
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Enter voucher code"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter the voucher code to check its validity
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 <strong>Tip:</strong> Checking a voucher will not use it. Use the code when making a payment to apply the discount or bonus.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowVoucherModal(false);
                      setVoucherCode('');
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCheckVoucher}
                    disabled={validatingVoucher || !voucherCode.trim()}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
                  >
                    {validatingVoucher ? 'Checking...' : 'Check Voucher'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
