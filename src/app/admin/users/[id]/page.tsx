'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaArrowLeft, FaCreditCard, FaPlus } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  credits: number;
  balance: string;
  subscriptionStatus: string;
  subscriptionExpiry: string | null;
  isActive: boolean;
  role: string;
  createdAt: string;
  _count: {
    llmRequests: number;
    creditTransactions: number;
    payments: number;
    geminiApiKeys: number;
  };
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDescription, setCreditDescription] = useState('');
  const [showAddCredits, setShowAddCredits] = useState(false);
  
  // New states for balance/credits adjustment
  const [showAdjustBalance, setShowAdjustBalance] = useState(false);
  const [showAdjustCredits, setShowAdjustCredits] = useState(false);
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Reason templates
  const reasonTemplates = {
    add: [
      'Bonus untuk aktivitas positif',
      'Kompensasi atas kesalahan sistem',
      'Promosi spesial',
      'Reward loyalitas',
      'Gift dari admin',
      'Custom...',
    ],
    deduct: [
      'Penarikan karena aktivitas tidak valid',
      'Pelanggaran terms of service',
      'Penyalahgunaan layanan',
      'Fraud detection',
      'Refund ke payment method',
      'Custom...',
    ],
  };

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  async function fetchUser() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `/api/admin/genovaai/users/${params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCredits(e: React.FormEvent) {
    e.preventDefault();
    if (!creditAmount || !creditDescription) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `/api/admin/genovaai/users/${params.id}/credits`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: parseInt(creditAmount),
            description: creditDescription,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        alert('Credits added successfully');
        setCreditAmount('');
        setCreditDescription('');
        setShowAddCredits(false);
        fetchUser();
      } else {
        alert(data.error || 'Failed to add credits');
      }
    } catch (error) {
      console.error('Failed to add credits:', error);
      alert('Failed to add credits');
    }
  }

  async function handleToggleStatus() {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `/api/admin/genovaai/users/${params.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isActive: !user.isActive,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        fetchUser();
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  }

  async function handleAdjustBalance(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustAmount || !adjustReason) {
      alert('Please fill all fields');
      return;
    }

    const finalReason = adjustReason === 'Custom...' ? customReason : adjustReason;
    if (!finalReason) {
      alert('Please provide a reason');
      return;
    }

    setAdjusting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `/api/admin/genovaai/users/${params.id}/balance`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: parseFloat(adjustAmount),
            type: adjustType,
            reason: finalReason,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        alert(data.message || 'Balance adjusted successfully');
        setShowAdjustBalance(false);
        setAdjustAmount('');
        setAdjustReason('');
        setCustomReason('');
        fetchUser();
      } else {
        alert(data.error || 'Failed to adjust balance');
      }
    } catch (error) {
      console.error('Failed to adjust balance:', error);
      alert('Failed to adjust balance');
    } finally {
      setAdjusting(false);
    }
  }

  async function handleAdjustCredits(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustAmount || !adjustReason) {
      alert('Please fill all fields');
      return;
    }

    const finalReason = adjustReason === 'Custom...' ? customReason : adjustReason;
    if (!finalReason) {
      alert('Please provide a reason');
      return;
    }

    setAdjusting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `/api/admin/genovaai/users/${params.id}/credits-adjust`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: parseInt(adjustAmount),
            type: adjustType,
            reason: finalReason,
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        alert(data.message || 'Credits adjusted successfully');
        setShowAdjustCredits(false);
        setAdjustAmount('');
        setAdjustReason('');
        setCustomReason('');
        fetchUser();
      } else {
        alert(data.error || 'Failed to adjust credits');
      }
    } catch (error) {
      console.error('Failed to adjust credits:', error);
      alert('Failed to adjust credits');
    } finally {
      setAdjusting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading user details...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-500 dark:text-red-400">User not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FaArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Details</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
        </div>
      </div>

      {/* User Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">{user.name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
              <p className="text-base font-medium text-gray-900 dark:text-white capitalize">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <Badge variant={user.isActive ? 'default' : 'destructive'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={handleToggleStatus}
              className={`mt-4 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                user.isActive
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {user.isActive ? 'Deactivate User' : 'Activate User'}
            </button>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Credits & Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Credits</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">{user.credits}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-green-600 dark:text-green-400 mb-1">Balance</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-300">
                Rp {parseFloat(user.balance).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Subscription</p>
              <p className="text-xl font-bold text-purple-900 dark:text-purple-300 capitalize">
                {user.subscriptionStatus}
              </p>
            </div>
            
            {showAddCredits ? (
              <form onSubmit={handleAddCredits} className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Credit amount"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />
                <input
                  type="text"
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                  placeholder="Description"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Credits
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCredits(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : showAdjustBalance ? (
              <form onSubmit={handleAdjustBalance} className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                      adjustType === 'add'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('deduct')}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                      adjustType === 'deduct'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Deduct
                  </button>
                </div>
                
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Amount (Rp)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                  disabled={adjusting}
                />
                
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                  disabled={adjusting}
                >
                  <option value="">Select reason...</option>
                  {reasonTemplates[adjustType].map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
                
                {adjustReason === 'Custom...' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter custom reason"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                    disabled={adjusting}
                  />
                )}
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={adjusting}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {adjusting ? 'Processing...' : `${adjustType === 'add' ? 'Add' : 'Deduct'} Balance`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdjustBalance(false);
                      setAdjustAmount('');
                      setAdjustReason('');
                      setCustomReason('');
                    }}
                    disabled={adjusting}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : showAdjustCredits ? (
              <form onSubmit={handleAdjustCredits} className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                      adjustType === 'add'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('deduct')}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                      adjustType === 'deduct'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Deduct
                  </button>
                </div>
                
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Amount (Credits)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                  disabled={adjusting}
                />
                
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                  disabled={adjusting}
                >
                  <option value="">Select reason...</option>
                  {reasonTemplates[adjustType].map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
                
                {adjustReason === 'Custom...' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter custom reason"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                    disabled={adjusting}
                  />
                )}
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={adjusting}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {adjusting ? 'Processing...' : `${adjustType === 'add' ? 'Add' : 'Deduct'} Credits`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdjustCredits(false);
                      setAdjustAmount('');
                      setAdjustReason('');
                      setCustomReason('');
                    }}
                    disabled={adjusting}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowAdjustBalance(true);
                    setAdjustType('add');
                  }}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors font-medium"
                >
                  <FaCreditCard className="w-4 h-4" />
                  Adjust Balance
                </button>
                <button
                  onClick={() => {
                    setShowAdjustCredits(true);
                    setAdjustType('add');
                  }}
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 transition-colors font-medium"
                >
                  <FaCreditCard className="w-4 h-4" />
                  Adjust Credits
                </button>
                <button
                  onClick={() => setShowAddCredits(true)}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <FaPlus className="w-4 h-4" />
                  Add Manual Credits (Legacy)
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{user._count.llmRequests}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Transactions</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{user._count.creditTransactions}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Payments</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{user._count.payments}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">API Keys</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{user._count.geminiApiKeys}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
