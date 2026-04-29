'use client';

import { useEffect, useState } from 'react';
import { FaUsers, FaCoins, FaChartLine, FaRobot, FaMoneyBillWave, FaTicketAlt, FaWallet, FaKey } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnalyticsData {
  range: 'day' | 'week' | 'month' | 'all';
  users: {
    total: number;
    active: number;
    newInRange: number;
    customers: number;
    admins: number;
  };
  credits: {
    totalDistributed: number;
    totalUsed: number;
    averagePerUser: number;
  };
  balance: {
    totalBalance: string;
    averagePerUser: string;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    byMode: {
      paid_balance: number;
      byok: number;
    };
    balanceSpent: string;
  };
  payments: {
    total: number;
    completed: number;
    pending: number;
    totalRevenue: string;
  };
  vouchers: {
    total: number;
    active: number;
    totalUsed: number;
  };
  topUsers: Array<{
    id: string;
    name: string;
    email: string;
    credits: number;
    balance: string;
    requestCount: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('month');

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  async function fetchAnalytics() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/genovaai/analytics?range=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      } else {
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }

  function formatRupiah(value: string) {
    return parseFloat(value || '0').toLocaleString('id-ID');
  }

  function getRangeLabel(range: AnalyticsData['range']) {
    if (range === 'day') return 'Today';
    if (range === 'week') return 'This Week';
    if (range === 'month') return 'This Month';
    return 'All Time';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-500 dark:text-red-400">Failed to load analytics</div>
      </div>
    );
  }

  const successRate = analytics.requests.total > 0
    ? ((analytics.requests.successful / analytics.requests.total) * 100).toFixed(1)
    : '0.0';

  const failureRate = analytics.requests.total > 0
    ? ((analytics.requests.failed / analytics.requests.total) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of Genova AI platform metrics and OpenAI-compatible usage.</p>
        </div>
        <select
          value={timeRange}
          onChange={(event) => setTimeRange(event.target.value as 'day' | 'week' | 'month' | 'all')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">User Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.users.total}</p>
                </div>
                <FaUsers className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.users.active}</p>
                </div>
                <FaUsers className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">New in Range</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analytics.users.newInRange}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getRangeLabel(analytics.range)}</p>
                </div>
                <FaUsers className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Customers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.users.customers}</p>
                </div>
                <FaUsers className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Admins</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{analytics.users.admins}</p>
                </div>
                <FaUsers className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Credits & Balance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Credits</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.credits.totalDistributed.toLocaleString()}</p>
                </div>
                <FaCoins className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Credits Used</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{analytics.credits.totalUsed.toLocaleString()}</p>
                </div>
                <FaCoins className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg Credits/User</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analytics.credits.averagePerUser.toFixed(1)}</p>
                </div>
                <FaCoins className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Balance</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">Rp {formatRupiah(analytics.balance.totalBalance)}</p>
                </div>
                <FaMoneyBillWave className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg Balance</p>
                  <p className="text-xl font-bold text-teal-600 dark:text-teal-400">Rp {formatRupiah(analytics.balance.averagePerUser)}</p>
                </div>
                <FaMoneyBillWave className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">LLM Request Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Requests in Range</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.requests.total.toLocaleString()}</p>
                </div>
                <FaRobot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Successful</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.requests.successful.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{successRate}% success rate</p>
                </div>
                <FaRobot className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Failed</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{analytics.requests.failed.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{failureRate}% failure rate</p>
                </div>
                <FaRobot className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Balance Spent</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">Rp {formatRupiah(analytics.requests.balanceSpent)}</p>
                </div>
                <FaMoneyBillWave className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 shadow-sm mt-4">
          <CardHeader>
            <CardTitle>Request Mode Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaWallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Paid Balance</p>
                </div>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analytics.requests.byMode.paid_balance.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaKey className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">BYOK</p>
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics.requests.byMode.byok.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Payments in Range</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.payments.total}</p>
                </div>
                <FaMoneyBillWave className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.payments.completed}</p>
                </div>
                <FaMoneyBillWave className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{analytics.payments.pending}</p>
                </div>
                <FaMoneyBillWave className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Revenue in Range</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">Rp {formatRupiah(analytics.payments.totalRevenue)}</p>
                </div>
                <FaChartLine className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Voucher Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Vouchers</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.vouchers.total}</p>
                </div>
                <FaTicketAlt className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Vouchers</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.vouchers.active}</p>
                </div>
                <FaTicketAlt className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Used</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analytics.vouchers.totalUsed}</p>
                </div>
                <FaTicketAlt className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Top Users by Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topUsers.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">#{index + 1}</Badge>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{user.name || 'Unnamed'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.credits} credits • Rp {formatRupiah(user.balance)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.requestCount} requests</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
