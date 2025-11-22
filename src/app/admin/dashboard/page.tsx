'use client';

import { useEffect, useState } from 'react';
import { FaUsers, FaCreditCard, FaChartLine, FaChartBar } from 'react-icons/fa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRequests: number;
  successfulRequests: number;
  successRate: string;
  totalRevenue: string;
  activeVouchers: number;
  apiKeysCount: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8090/api/admin/genovaai/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data.overview);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 bg-background">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-500">Failed to load dashboard</div>
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Total Users', 
      value: stats.totalUsers, 
      subValue: `${stats.activeUsers} active`,
      icon: FaUsers, 
      color: 'bg-blue-500' 
    },
    { 
      label: 'Total Requests', 
      value: stats.totalRequests, 
      subValue: `${stats.successRate}% success`,
      icon: FaChartBar, 
      color: 'bg-green-500' 
    },
    { 
      label: 'Total Revenue', 
      value: `Rp ${parseFloat(stats.totalRevenue).toLocaleString('id-ID')}`, 
      subValue: 'All time',
      icon: FaCreditCard, 
      color: 'bg-purple-500' 
    },
    { 
      label: 'Active Vouchers', 
      value: stats.activeVouchers, 
      subValue: `${stats.apiKeysCount} API keys`,
      icon: FaChartLine, 
      color: 'bg-orange-500' 
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome to GenovaAI Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stat.subValue}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/users"
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Manage Users</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">View and manage user accounts</p>
            </Link>
            <Link
              href="/admin/vouchers/create"
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Create Voucher</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Generate new discount vouchers</p>
            </Link>
            <Link
              href="/admin/apikeys"
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Manage API Keys</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Control API key pool</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
