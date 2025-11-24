'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaArrowLeft, FaEdit, FaTrash, FaTicketAlt, FaCalendar, FaUsers } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VoucherDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  discountType: string;
  value: string;
  maxDiscount: string | null;
  minAmount: string | null;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  maxUses: number | null;
  usedCount: number;
  creditBonus: number | null;
  balanceBonus: string | null;
  createdAt: string;
  _count: {
    voucherUsages: number;
  };
}

interface VoucherUsage {
  id: string;
  userId: string;
  usedAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

export default function VoucherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [voucher, setVoucher] = useState<VoucherDetail | null>(null);
  const [usages, setUsages] = useState<VoucherUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchVoucher();
    fetchUsages();
  }, [params.id]);

  async function fetchVoucher() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `/api/admin/genovaai/vouchers/${params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setVoucher(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch voucher:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsages() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `/api/admin/genovaai/vouchers/${params.id}/usages`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setUsages(data.data.usages);
      }
    } catch (error) {
      console.error('Failed to fetch usages:', error);
    }
  }

  async function handleToggleStatus() {
    if (!voucher) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `/api/admin/genovaai/vouchers/${params.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isActive: !voucher.isActive,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        fetchVoucher();
      }
    } catch (error) {
      console.error('Failed to update voucher:', error);
    }
  }

  async function handleDelete() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `/api/admin/genovaai/vouchers/${params.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        alert('Voucher deleted successfully');
        router.push('/admin/vouchers');
      } else {
        alert(data.error || 'Failed to delete voucher');
      }
    } catch (error) {
      console.error('Failed to delete voucher:', error);
      alert('Failed to delete voucher');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading voucher details...</div>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-500 dark:text-red-400">Voucher not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FaArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Voucher Details</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{voucher.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/vouchers/${voucher.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <FaEdit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FaTrash className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Voucher Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaTicketAlt className="w-5 h-5 text-purple-600" />
              Voucher Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Code</p>
              <p className="text-base font-mono font-bold text-gray-900 dark:text-white">{voucher.code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">{voucher.name}</p>
            </div>
            {voucher.description && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                <p className="text-base text-gray-900 dark:text-white">{voucher.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
              <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400">
                {voucher.type}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <Badge variant={voucher.isActive ? 'default' : 'destructive'}>
                {voucher.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <button
              onClick={handleToggleStatus}
              className={`mt-4 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                voucher.isActive
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {voucher.isActive ? 'Deactivate Voucher' : 'Activate Voucher'}
            </button>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaCalendar className="w-5 h-5 text-blue-600" />
              Discount & Validity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Discount Value</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">
                {voucher.discountType === 'percentage'
                  ? `${voucher.value}%`
                  : `Rp ${parseFloat(voucher.value).toLocaleString('id-ID')}`}
              </p>
            </div>
            {voucher.maxDiscount && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Max Discount</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  Rp {parseFloat(voucher.maxDiscount).toLocaleString('id-ID')}
                </p>
              </div>
            )}
            {voucher.minAmount && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Min Amount</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  Rp {parseFloat(voucher.minAmount).toLocaleString('id-ID')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {new Date(voucher.startDate).toLocaleDateString('id-ID')}
              </p>
            </div>
            {voucher.endDate && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {new Date(voucher.endDate).toLocaleDateString('id-ID')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{voucher._count.voucherUsages}</p>
              </div>
              <FaUsers className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Max Uses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {voucher.maxUses || 'Unlimited'}
                </p>
              </div>
              <FaTicketAlt className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Remaining</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {voucher.maxUses ? voucher.maxUses - voucher.usedCount : 'Unlimited'}
                </p>
              </div>
              <FaTicketAlt className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage History */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Usage History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Used At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {usages.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No usage history yet
                    </td>
                  </tr>
                ) : (
                  usages.map((usage) => (
                    <tr key={usage.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {usage.user.name || 'No name'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {usage.user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(usage.usedAt).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Confirm Delete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete voucher <strong>{voucher.code}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
