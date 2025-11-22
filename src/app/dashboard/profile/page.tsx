'use client';

import { useEffect, useState } from 'react';
import { FaUser, FaEnvelope, FaCalendar, FaSave } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  credits: number;
  balance: string;
  subscriptionStatus: string;
  subscriptionExpiry: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8090/api/customer/genovaai/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
        setName(data.data.name || '');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8090/api/customer/genovaai/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Profile updated successfully');
        fetchProfile();
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-500 dark:text-red-400">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaUser className="w-5 h-5 text-blue-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
                <FaEnvelope className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">{profile.email}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <FaSave className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaCalendar className="w-5 h-5 text-green-600" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Account Status</p>
              <Badge variant={profile.isActive ? 'default' : 'destructive'}>
                {profile.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Subscription</p>
              <Badge variant={profile.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                {profile.subscriptionStatus}
              </Badge>
            </div>
            {profile.subscriptionExpiry && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Expiry Date</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {new Date(profile.subscriptionExpiry).toLocaleDateString('id-ID')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Member Since</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {new Date(profile.createdAt).toLocaleDateString('id-ID')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balance & Credits */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Balance & Credits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Credits</p>
              <p className="text-4xl font-bold text-blue-900 dark:text-blue-300">{profile.credits}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">For premium LLM requests</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <p className="text-sm text-green-600 dark:text-green-400 mb-1">Balance</p>
              <p className="text-4xl font-bold text-green-900 dark:text-green-300">
                Rp {parseFloat(profile.balance).toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">Available balance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
