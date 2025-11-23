'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VoucherFormData {
  code: string;
  name: string;
  description: string;
  type: 'credit' | 'balance';
  discountType: 'percentage' | 'fixed';
  value: string;
  maxDiscount: string;
  minAmount: string;
  creditBonus: string;
  balanceBonus: string;
  maxUses: string;
  allowMultipleUsePerUser: boolean;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export default function EditVoucherPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<VoucherFormData>({
    code: '',
    name: '',
    description: '',
    type: 'credit',
    discountType: 'percentage',
    value: '0',
    maxDiscount: '',
    minAmount: '',
    creditBonus: '',
    balanceBonus: '',
    maxUses: '',
    allowMultipleUsePerUser: false,
    isActive: true,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchVoucher();
  }, []);

  async function fetchVoucher() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/genovaai/vouchers/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        const v = data.data;
        setFormData({
          code: v.code,
          name: v.name,
          description: v.description || '',
          type: v.type,
          discountType: v.discountType,
          value: v.value || '0',
          maxDiscount: v.maxDiscount || '',
          minAmount: v.minAmount || '',
          creditBonus: v.creditBonus?.toString() || '',
          balanceBonus: v.balanceBonus || '',
          maxUses: v.maxUses?.toString() || '',
          allowMultipleUsePerUser: v.allowMultipleUsePerUser || false,
          isActive: v.isActive,
          startDate: v.startDate ? new Date(v.startDate).toISOString().slice(0, 16) : '',
          endDate: v.endDate ? new Date(v.endDate).toISOString().slice(0, 16) : '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch voucher:', error);
      setError('Failed to load voucher data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      
      // Prepare data
      const updateData: any = {
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        discountType: formData.discountType,
        value: parseFloat(formData.value) || 0,
        isActive: formData.isActive,
        allowMultipleUsePerUser: formData.allowMultipleUsePerUser,
      };

      // Optional fields
      if (formData.maxDiscount) updateData.maxDiscount = parseFloat(formData.maxDiscount);
      if (formData.minAmount) updateData.minAmount = parseFloat(formData.minAmount);
      if (formData.creditBonus) updateData.creditBonus = parseInt(formData.creditBonus);
      if (formData.balanceBonus) updateData.balanceBonus = parseFloat(formData.balanceBonus);
      if (formData.maxUses) updateData.maxUses = parseInt(formData.maxUses);
      if (formData.startDate) updateData.startDate = new Date(formData.startDate).toISOString();
      if (formData.endDate) updateData.endDate = new Date(formData.endDate).toISOString();

      const response = await fetch(`/api/admin/genovaai/vouchers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update voucher');
      }

      alert('Voucher updated successfully!');
      router.push(`/admin/vouchers/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update voucher');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FaArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Voucher</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Update voucher details</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Basic Information */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Voucher Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="WELCOME10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Voucher Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Welcome Bonus"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="10 credits bonus untuk user baru"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'credit' | 'balance' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="credit">Credit</option>
                  <option value="balance">Balance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discount Type *
                </label>
                <select
                  required
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discount & Bonus */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Discount & Bonus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discount Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="50 for 50% or 10000 for Rp 10,000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Discount (Rp)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Credit Bonus
                </label>
                <input
                  type="number"
                  value={formData.creditBonus}
                  onChange={(e) => setFormData({ ...formData, creditBonus: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Balance Bonus (Rp)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balanceBonus}
                  onChange={(e) => setFormData({ ...formData, balanceBonus: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="10000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Amount (Rp)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.minAmount}
                onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="100000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Usage Settings */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Usage Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Uses
              </label>
              <input
                type="number"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="100 (leave empty for unlimited)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowMultipleUsePerUser}
                  onChange={(e) => setFormData({ ...formData, allowMultipleUsePerUser: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Allow multiple uses per user</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <FaSave className="w-4 h-4" />
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
