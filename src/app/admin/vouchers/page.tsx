'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaPlus, FaPencilAlt, FaEye, FaTrash } from 'react-icons/fa';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  discountType: string;
  value: string;
  maxDiscount: string | null;
  minAmount: string | null;
  allowMultipleUsePerUser: boolean;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  maxUses: number | null;
  usedCount: number;
  _count: {
    voucherUsages: number;
  };
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchVouchers();
  }, [status]);

  async function fetchVouchers() {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (status) params.append('status', status);

      const response = await fetch(
        `/api/admin/genovaai/vouchers?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setVouchers(data.data.vouchers);
      }
    } catch (error) {
      console.error('Failed to fetch vouchers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(voucherId: string) {
    if (!confirm('Are you sure you want to delete this voucher? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/genovaai/vouchers/${voucherId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        alert('Voucher deleted successfully!');
        fetchVouchers();
      } else {
        alert(data.error || 'Failed to delete voucher');
      }
    } catch (error) {
      console.error('Failed to delete voucher:', error);
      alert('Failed to delete voucher');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vouchers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage discount vouchers</p>
        </div>
        <Link
          href="/admin/vouchers/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          Create Voucher
        </Link>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Vouchers Table */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Multi-Use
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      Loading vouchers...
                    </td>
                  </tr>
                ) : vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No vouchers found
                    </td>
                  </tr>
                ) : (
                  vouchers.map((voucher) => (
                    <tr key={voucher.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-gray-900 dark:text-white">{voucher.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{voucher.name}</div>
                          {voucher.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{voucher.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400">
                          {voucher.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {voucher.discountType === 'percentage'
                          ? `${voucher.value}%`
                          : `Rp ${parseFloat(voucher.value).toLocaleString('id-ID')}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {voucher._count.voucherUsages}
                        {voucher.maxUses && ` / ${voucher.maxUses}`}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={voucher.allowMultipleUsePerUser ? 'default' : 'secondary'}>
                          {voucher.allowMultipleUsePerUser ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={voucher.isActive ? 'default' : 'destructive'}>
                          {voucher.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          href={`/admin/vouchers/${voucher.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        >
                          <FaEye className="w-4 h-4" />
                          View
                        </Link>
                        <Link
                          href={`/admin/vouchers/${voucher.id}/edit`}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                        >
                          <FaPencilAlt className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(voucher.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                        >
                          <FaTrash className="w-4 h-4" />
                          Delete
                        </button>
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
