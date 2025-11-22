'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCreditCard, FaCoins, FaHistory, FaKey, FaCog, FaChartLine } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserStats {
  credits: number;
  balance: string;
  subscriptionStatus: string;
  subscriptionExpiry: string | null;
  totalRequests: number;
  thisMonthRequests: number;
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
    fetchStats();
  }, []);

  async function fetchUserData() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8090/api/customer/genovaai/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  }

  async function fetchStats() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8090/api/customer/genovaai/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Here's your GenovaAI account overview
        </p>
      </div>

      {/* Balance & Credits Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Credits</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.credits || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FaCoins className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Balance</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  Rp {parseFloat(stats?.balance || '0').toLocaleString('id-ID')}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FaCreditCard className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Requests</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats?.totalRequests || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FaChartLine className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">This Month</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {stats?.thisMonthRequests || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <FaHistory className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Status */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant={stats?.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                {stats?.subscriptionStatus || 'Free'}
              </Badge>
              {stats?.subscriptionExpiry && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Expires: {new Date(stats.subscriptionExpiry).toLocaleDateString('id-ID')}
                </p>
              )}
            </div>
            <button
              onClick={() => router.push('/dashboard/balance/topup')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          className="border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer"
          onClick={() => router.push('/dashboard/balance/topup')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FaCreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Top Up Balance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add funds to your account</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer"
          onClick={() => router.push('/dashboard/history')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FaHistory className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">View History</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Check your chat history</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer"
          onClick={() => router.push('/dashboard/apikeys')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FaKey className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Manage API Keys</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure your API keys</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer"
          onClick={() => router.push('/dashboard/settings')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 dark:bg-gray-900/30 rounded-lg">
                <FaCog className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Extension Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sync your settings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
