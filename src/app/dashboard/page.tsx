'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaCreditCard, FaCoins, FaHistory, FaKey, FaCog, FaChartLine, 
  FaRobot, FaFileAlt, FaUsers, FaCheckCircle, FaExclamationCircle,
  FaArrowUp, FaArrowDown, FaClock
} from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserStats {
  credits: number;
  balance: string;
  subscriptionStatus: string;
  subscriptionExpiry: string | null;
  
  // LLM Request Stats
  totalRequests: number;
  thisMonthRequests: number;
  successfulRequests: number;
  failedRequests: number;
  
  // Request Mode Distribution
  freePoolRequests: number;
  freeUserKeyRequests: number;
  premiumRequests: number;
  
  // Session & Knowledge Stats
  activeSessions: number;
  totalSessions: number;
  knowledgeFiles: number;
  totalKnowledgeSize: number;
  
  // Payment & Transaction Stats
  pendingPayments: number;
  completedPayments: number;
  totalSpent: string;
  
  // Recent Activity
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: string;
    credits: number;
    createdAt: string;
    status: string;
  }>;
  
  recentRequests: Array<{
    id: string;
    provider: string;
    model: string;
    status: string;
    costCredits: number;
    createdAt: string;
  }>;
  
  // API Keys
  activeApiKeys: number;
  totalApiKeys: number;
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch user profile
      const profileRes = await fetch('/api/customer/genovaai/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const profileData = await profileRes.json();
      
      if (profileData.success) {
        setUser(profileData.data);
      }
      
      // Fetch dashboard stats
      const statsRes = await fetch('/api/customer/genovaai/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const statsData = await statsRes.json();
      
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name || 'User'}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here is your Genova AI account overview
          </p>
        </div>
        <Badge variant={stats?.subscriptionStatus === 'active' ? 'default' : 'secondary'} className="text-sm px-4 py-2">
          {stats?.subscriptionStatus?.toUpperCase() || 'FREE'}
        </Badge>
      </div>

      {/* Main Stats - Balance & Credits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/balance')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Credits</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.credits?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">For AI requests</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FaCoins className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/balance')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Balance</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  Rp {parseFloat(stats?.balance || '0').toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Available funds</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FaCreditCard className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/usage')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Requests</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats?.totalRequests?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <FaCheckCircle className="w-3 h-3" />
                  {stats?.successfulRequests || 0} successful
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FaChartLine className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/usage')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">This Month</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {stats?.thisMonthRequests?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">AI requests</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <FaRobot className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Mode Distribution */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Request Mode Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Free Pool</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.freePoolRequests || 0}</p>
              </div>
              <Badge variant="secondary">Shared</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your API Key</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.freeUserKeyRequests || 0}</p>
              </div>
              <Badge variant="secondary">Personal</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Premium</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats?.premiumRequests || 0}</p>
              </div>
              <Badge>Credits</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions & Knowledge Files */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaUsers className="w-5 h-5 text-blue-600" />
              Extension Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.activeSessions || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Active / {stats?.totalSessions || 0} total
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/settings')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Manage Sessions
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaFileAlt className="w-5 h-5 text-green-600" />
              Knowledge Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.knowledgeFiles || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {((stats?.totalKnowledgeSize || 0) / 1024 / 1024).toFixed(2)} MB used
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/knowledge')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                View Files
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Summary */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <FaClock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.pendingPayments || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FaCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats?.completedPayments || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FaCreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                <p className="text-xl font-bold text-blue-600">
                  Rp {parseFloat(stats?.totalSpent || '0').toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Transactions</span>
              <button
                onClick={() => router.push('/dashboard/balance')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All →
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        tx.type.includes('purchase') || tx.type.includes('topup') 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        {tx.type.includes('purchase') || tx.type.includes('topup') ? (
                          <FaArrowUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <FaArrowDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {tx.type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(tx.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {tx.credits !== 0 ? (
                        <p className={`font-semibold ${tx.credits > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.credits > 0 ? '+' : ''}{tx.credits} credits
                        </p>
                      ) : (
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Rp {parseFloat(tx.amount).toLocaleString('id-ID')}
                        </p>
                      )}
                      <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No transactions yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent AI Requests */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent AI Requests</span>
              <button
                onClick={() => router.push('/dashboard/history')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All →
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentRequests && stats.recentRequests.length > 0 ? (
              <div className="space-y-3">
                {stats.recentRequests.slice(0, 5).map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        req.status === 'success' 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        {req.status === 'success' ? (
                          <FaCheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <FaExclamationCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {req.provider} - {req.model}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(req.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-blue-600">
                        {req.costCredits} credits
                      </p>
                      <Badge variant={req.status === 'success' ? 'default' : 'secondary'} className="text-xs">
                        {req.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No requests yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/dashboard/balance/topup')}
              className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left"
            >
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FaCreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Buy Credits</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Top up your balance</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/apikeys')}
              className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FaKey className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">API Keys</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stats?.activeApiKeys || 0} active</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/history')}
              className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left"
            >
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FaHistory className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Chat History</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">View all chats</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/settings')}
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-lg">
                <FaCog className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Settings</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Manage extension</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
