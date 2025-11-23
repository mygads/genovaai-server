'use client';

import { useEffect, useState } from 'react';
import { FaChartBar, FaCoins, FaGift, FaRocket, FaClock } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UsageStats {
  requestMode: string;
  _count: { id: number };
  _sum: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  };
  _avg: {
    responseTimeMs: number | null;
  };
}

interface RecentActivity {
  id: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  responseTimeMs: number;
  createdAt: string;
  chatHistory: {
    question: string;
    session: {
      sessionName: string;
    };
  } | null;
}

interface UsageData {
  period: string;
  summary: {
    totalRequests: number;
    totalTokens: number;
    totalInputTokens: number;
    totalOutputTokens: number;
  };
  stats: {
    premium: UsageStats;
    free_pool: UsageStats;
    free_mode: UsageStats;
  };
  recentActivity: {
    premium: RecentActivity[];
    free_pool: RecentActivity[];
    free_mode: RecentActivity[];
  };
}

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('week');
  const [selectedMode, setSelectedMode] = useState<'premium' | 'free_pool' | 'free_mode'>('premium');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    async function loadUsage() {
      await fetchUsage();
    }
    loadUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  async function fetchUsage() {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUsage(null);
        return;
      }
      
      let url = `http://localhost:8090/api/customer/genovaai/usage?period=${period}`;
      if (period === 'custom' && startDate) {
        url += `&startDate=${startDate}`;
        if (endDate) {
          url += `&endDate=${endDate}`;
        }
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      if (data.success) {
        setUsage(data.data);
      } else {
        setUsage(null);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
      setUsage(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading usage statistics...</div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">No usage data available</div>
      </div>
    );
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'premium': return <FaRocket className="w-5 h-5 text-purple-600" />;
      case 'free_pool': return <FaCoins className="w-5 h-5 text-blue-600" />;
      case 'free_mode': return <FaGift className="w-5 h-5 text-green-600" />;
      default: return <FaChartBar className="w-5 h-5 text-gray-600" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'premium': return 'bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'free_pool': return 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'free_mode': return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default: return 'bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getModeName = (mode: string) => {
    switch (mode) {
      case 'premium': return 'Premium';
      case 'free_pool': return 'Free Pool';
      case 'free_mode': return 'Free Mode';
      default: return mode;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Usage Statistics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track your API usage across different modes
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 flex-wrap items-center">
          {(['today', 'week', 'month', 'year', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                setShowCustomDatePicker(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <button
            onClick={() => {
              setShowCustomDatePicker(!showCustomDatePicker);
              if (!showCustomDatePicker) {
                setPeriod('custom');
              }
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Custom Range
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {showCustomDatePicker && (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end flex-wrap">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={() => {
                  if (startDate) {
                    fetchUsage();
                  }
                }}
                disabled={!startDate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                Apply
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total API Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {usage.summary.totalRequests.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FaChartBar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Premium Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {usage.stats.premium._count.id.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FaRocket className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Free Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {(usage.stats.free_pool._count.id + usage.stats.free_mode._count.id).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FaGift className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mode Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Premium */}
        <Card className={`border-2 ${selectedMode === 'premium' ? 'ring-2 ring-purple-500' : ''} ${getModeColor('premium')}`}>
          <CardHeader className="cursor-pointer" onClick={() => setSelectedMode('premium')}>
            <CardTitle className="flex items-center gap-3">
              {getModeIcon('premium')}
              <span className="text-gray-900 dark:text-white">{getModeName('premium')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Requests</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {usage.stats.premium._count.id.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Credits Used</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {usage.stats.premium._count.id.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Avg Time</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {Math.round(usage.stats.premium._avg.responseTimeMs || 0)}ms
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Status</p>
                <Badge variant="default" className="mt-1">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Free Pool */}
        <Card className={`border-2 ${selectedMode === 'free_pool' ? 'ring-2 ring-blue-500' : ''} ${getModeColor('free_pool')}`}>
          <CardHeader className="cursor-pointer" onClick={() => setSelectedMode('free_pool')}>
            <CardTitle className="flex items-center gap-3">
              {getModeIcon('free_pool')}
              <span className="text-gray-900 dark:text-white">{getModeName('free_pool')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Requests</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {usage.stats.free_pool._count.id.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Avg Time</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {Math.round(usage.stats.free_pool._avg.responseTimeMs || 0)}ms
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Using shared API pool</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Free Mode */}
        <Card className={`border-2 ${selectedMode === 'free_mode' ? 'ring-2 ring-green-500' : ''} ${getModeColor('free_mode')}`}>
          <CardHeader className="cursor-pointer" onClick={() => setSelectedMode('free_mode')}>
            <CardTitle className="flex items-center gap-3">
              {getModeIcon('free_mode')}
              <span className="text-gray-900 dark:text-white">{getModeName('free_mode')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Requests</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {usage.stats.free_mode._count.id.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Avg Time</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {Math.round(usage.stats.free_mode._avg.responseTimeMs || 0)}ms
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Using your own API key</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaClock className="w-5 h-5 text-blue-600" />
            Recent Activity - {getModeName(selectedMode)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usage.recentActivity[selectedMode].length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No recent activity in {getModeName(selectedMode)} mode
            </div>
          ) : (
            <div className="space-y-3">
              {usage.recentActivity[selectedMode].map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {activity.model}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {activity.provider}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white line-clamp-1">
                      {activity.chatHistory?.question || 'Question not available'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Session: {activity.chatHistory?.session?.sessionName || 'Unknown'}
                    </p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.responseTimeMs}ms
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(activity.createdAt).toLocaleString('id-ID', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
