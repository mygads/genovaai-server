'use client';

import { useEffect, useState } from 'react';
import { FaChartBar, FaCoins, FaKey, FaWallet, FaClock } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UsageStats {
  requestMode: 'paid_balance' | 'byok' | string;
  _count: { id: number };
  _sum: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    costBalance: number | string | null;
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
  costBalance: number | string | null;
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
    totalBalanceSpent?: number | string;
  };
  stats: {
    paid_balance: UsageStats;
    byok: UsageStats;
  };
  recentActivity: {
    paid_balance: RecentActivity[];
    byok: RecentActivity[];
  };
}

type RequestMode = 'paid_balance' | 'byok';

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('week');
  const [selectedMode, setSelectedMode] = useState<RequestMode>('paid_balance');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    fetchUsage();
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

      let url = `/api/customer/genovaai/usage?period=${period}`;
      if (period === 'custom' && startDate) {
        url += `&startDate=${startDate}`;
        if (endDate) {
          url += `&endDate=${endDate}`;
        }
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
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

  function getModeName(mode: RequestMode) {
    return mode === 'paid_balance' ? 'Paid Balance' : 'BYOK';
  }

  function getModeIcon(mode: RequestMode) {
    return mode === 'paid_balance'
      ? <FaWallet className="w-5 h-5 text-blue-600" />
      : <FaKey className="w-5 h-5 text-green-600" />;
  }

  function getModeCardClass(mode: RequestMode) {
    return mode === 'paid_balance'
      ? 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      : 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  }

  function formatRupiah(value?: number | string | null) {
    return Number(value || 0).toLocaleString('id-ID');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Usage Statistics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track your OpenAI-compatible usage across paid balance and BYOK.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {(['today', 'week', 'month', 'year', 'all'] as const).map((value) => (
            <button
              key={value}
              onClick={() => {
                setPeriod(value);
                setShowCustomDatePicker(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {value === 'all' ? 'All Time' : value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
          <button
            onClick={() => {
              const next = !showCustomDatePicker;
              setShowCustomDatePicker(next);
              if (next) setPeriod('custom');
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

      {showCustomDatePicker && (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end flex-wrap">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={() => {
                  if (startDate) fetchUsage();
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Requests</p>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Tokens</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {usage.summary.totalTokens.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FaCoins className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Paid Balance Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {usage.stats.paid_balance._count.id.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FaWallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Balance Spent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  Rp {formatRupiah(usage.summary.totalBalanceSpent)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FaCoins className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(['paid_balance', 'byok'] as RequestMode[]).map((mode) => {
          const stat = usage.stats[mode];
          const selected = selectedMode === mode;
          return (
            <Card
              key={mode}
              className={`border-2 cursor-pointer ${selected ? 'ring-2 ring-offset-2 ring-blue-500' : ''} ${getModeCardClass(mode)}`}
            >
              <CardHeader onClick={() => setSelectedMode(mode)}>
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  {getModeIcon(mode)}
                  <span>{getModeName(mode)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Requests</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {stat._count.id.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Avg Time</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {Math.round(stat._avg.responseTimeMs || 0)}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Total Tokens</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {Number(stat._sum.totalTokens || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Balance Cost</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {mode === 'paid_balance' ? `Rp ${formatRupiah(stat._sum.costBalance)}` : 'Rp 0'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {mode === 'paid_balance'
                    ? 'Uses Genova balance and admin-enabled models.'
                    : 'Uses your own OpenAI-compatible provider without deducting Genova balance.'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
              No recent activity in {getModeName(selectedMode)} mode.
            </div>
          ) : (
            <div className="space-y-3">
              {usage.recentActivity[selectedMode].map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {activity.model}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {activity.provider}
                      </Badge>
                      {selectedMode === 'paid_balance' && (
                        <Badge variant="outline" className="text-xs">
                          Rp {formatRupiah(activity.costBalance)}
                        </Badge>
                      )}
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
