'use client';

import { useEffect, useState } from 'react';
import { FaRobot, FaFilter, FaDownload } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TokenUsage {
  userId: string;
  userName: string | null;
  userEmail: string;
  requestMode: string;
  provider: string;
  model: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  avgResponseTime: number;
}

interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  byMode: {
    premium: { requests: number; tokens: number };
    free_pool: { requests: number; tokens: number };
    free_user_key: { requests: number; tokens: number };
  };
  byModel: Array<{
    model: string;
    requests: number;
    tokens: number;
  }>;
  usage: TokenUsage[];
}

export default function AIUsagePage() {
  const [data, setData] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  useEffect(() => {
    fetchUsage();
  }, [dateRange, customStartDate, customEndDate, selectedMode, selectedModel, selectedUser]);

  async function fetchUsage() {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      
      if (dateRange === 'custom' && customStartDate && customEndDate) {
        params.append('startDate', customStartDate);
        params.append('endDate', customEndDate);
      } else {
        params.append('range', dateRange);
      }
      
      if (selectedMode !== 'all') params.append('mode', selectedMode);
      if (selectedModel !== 'all') params.append('model', selectedModel);
      if (selectedUser !== 'all') params.append('userId', selectedUser);

      const response = await fetch(`/api/admin/genovaai/usage-analytics?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    if (!data) return;
    
    const headers = ['User', 'Email', 'Mode', 'Provider', 'Model', 'Requests', 'Success', 'Failed', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Avg Response Time (ms)'];
    const rows = data.usage.map(u => [
      u.userName || 'N/A',
      u.userEmail,
      u.requestMode,
      u.provider,
      u.model,
      u.totalRequests,
      u.successfulRequests,
      u.failedRequests,
      u.totalInputTokens,
      u.totalOutputTokens,
      u.totalTokens,
      Math.round(u.avgResponseTime),
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-usage-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="text-lg text-gray-500 dark:text-gray-400">Loading usage data...</div></div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center h-96"><div className="text-lg text-red-500 dark:text-red-400">Failed to load usage data</div></div>;
  }

  // Create unique users list with proper deduplication
  const uniqueUsersMap = new Map();
  data.usage.forEach(u => {
    if (!uniqueUsersMap.has(u.userId)) {
      uniqueUsersMap.set(u.userId, { id: u.userId, name: u.userName || u.userEmail });
    }
  });
  const uniqueUsers = Array.from(uniqueUsersMap.values());
  const uniqueModels = [...new Set(data.usage.map(u => u.model))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Usage Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Detailed token usage and request statistics</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FaDownload className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaFilter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as 'today' | 'week' | 'month' | 'custom')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Request Mode</label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Modes</option>
                <option value="premium">Premium</option>
                <option value="free_pool">Free Pool</option>
                <option value="free_user_key">Free User Key</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Models</option>
                {uniqueModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Users</option>
                {uniqueUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.totalRequests.toLocaleString()}</p>
              </div>
              <FaRobot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Input Tokens</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data.totalInputTokens.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Output Tokens</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.totalOutputTokens.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Tokens</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{data.totalTokens.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mode Distribution */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader><CardTitle>Usage by Request Mode</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Premium Mode</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.byMode.premium.requests.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.byMode.premium.tokens.toLocaleString()} tokens</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Free Pool Mode</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.byMode.free_pool.requests.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.byMode.free_pool.tokens.toLocaleString()} tokens</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Free User Key Mode</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data.byMode.free_user_key.requests.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.byMode.free_user_key.tokens.toLocaleString()} tokens</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Distribution */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader><CardTitle>Usage by Model</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.byModel.map((item) => (
              <div key={item.model} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.model}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.requests} requests</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{item.tokens.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">tokens</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Usage Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader><CardTitle>Detailed Usage by User</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Model</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Requests</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Success</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Input</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Output</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {data.usage.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No data found</td></tr>
                ) : (
                  data.usage.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900 dark:text-white">{item.userName || 'N/A'}</p>
                          <p className="text-gray-500 dark:text-gray-400">{item.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={item.requestMode === 'premium' ? 'default' : 'secondary'}>
                          {item.requestMode}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.model}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">{item.totalRequests}</td>
                      <td className="px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">{item.successfulRequests}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">{item.totalInputTokens.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">{item.totalOutputTokens.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-blue-600 dark:text-blue-400">{item.totalTokens.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">{Math.round(item.avgResponseTime)}ms</td>
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
