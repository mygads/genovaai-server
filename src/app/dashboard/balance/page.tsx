'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCreditCard, FaCoins, FaHistory, FaPlus } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BalanceInfo {
  balance: string;
  credits: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  description: string | null;
  createdAt: string;
  status: string;
}

export default function BalancePage() {
  const router = useRouter();
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
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
        <button
          onClick={() => router.push('/dashboard/balance/topup')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          Top Up
        </button>
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
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        Rp {parseFloat(transaction.amount).toLocaleString('id-ID')}
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
    </div>
  );
}
