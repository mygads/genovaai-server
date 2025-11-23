'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaKey, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaExclamationCircle, FaClock } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface APIKey {
  id: string;
  userId: string | null;
  name: string | null;
  apiKey: string;
  status: string;
  lastUsedAt: string | null;
  lastErrorAt: string | null;
  lastErrorType: string | null;
  requestsToday: number;
  maxRequestsPerDay: number | null;
  priority: number;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  } | null;
}

export default function AdminAPIKeysPage() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState({
    apiKey: '',
    name: '',
    priority: '1',
    maxRequestsPerDay: '1500',
  });

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  async function fetchAPIKeys() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/genovaai/apikeys', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setApiKeys(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddKey() {
    if (!newKey.apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/genovaai/apikeys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          apiKey: newKey.apiKey,
          name: newKey.name || null,
          priority: parseInt(newKey.priority),
          maxRequestsPerDay: parseInt(newKey.maxRequestsPerDay),
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('API key added successfully!');
        setShowAddModal(false);
        setNewKey({ apiKey: '', name: '', priority: '1', maxRequestsPerDay: '1500' });
        fetchAPIKeys();
      } else {
        alert(data.error || 'Failed to add API key');
      }
    } catch (error) {
      console.error('Failed to add API key:', error);
      alert('Failed to add API key');
    }
  }

  async function handleDeleteKey(keyId: string) {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/genovaai/apikeys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('API key deleted successfully');
        fetchAPIKeys();
      } else {
        alert(data.error || 'Failed to delete API key');
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
      alert('Failed to delete API key');
    }
  }

  async function handleToggleStatus(keyId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/admin/genovaai/apikeys/${keyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        fetchAPIKeys();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      rate_limited: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      invalid: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      dead: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading API keys...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">API Key Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage Gemini API keys for the system</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          Add API Key
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Keys</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{apiKeys.length}</p>
              </div>
              <FaKey className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {apiKeys.filter(k => k.status === 'active').length}
                </p>
              </div>
              <FaCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Rate Limited</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {apiKeys.filter(k => k.status === 'rate_limited').length}
                </p>
              </div>
              <FaClock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Invalid</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {apiKeys.filter(k => k.status === 'invalid' || k.status === 'dead').length}
                </p>
              </div>
              <FaExclamationCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys List */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {key.name || 'Unnamed Key'}
                      </h3>
                      <Badge className={getStatusBadge(key.status)}>{key.status}</Badge>
                      <Badge variant="secondary">Priority: {key.priority}</Badge>
                      {key.userId === null && (
                        <Badge variant="default" className="bg-purple-600">Admin Key</Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        <span className="font-medium">Key:</span>{' '}
                        <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                          {key.apiKey.slice(0, 20)}...{key.apiKey.slice(-10)}
                        </code>
                      </p>
                      {key.user && (
                        <p>
                          <span className="font-medium">Owner:</span> {key.user.name} ({key.user.email})
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Usage Today:</span> {key.requestsToday} / {key.maxRequestsPerDay || '∞'}
                      </p>
                      {key.lastUsedAt && (
                        <p>
                          <span className="font-medium">Last Used:</span>{' '}
                          {new Date(key.lastUsedAt).toLocaleString('id-ID')}
                        </p>
                      )}
                      {key.lastErrorAt && (
                        <p className="text-red-600 dark:text-red-400">
                          <span className="font-medium">Last Error:</span> {key.lastErrorType} at{' '}
                          {new Date(key.lastErrorAt).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleToggleStatus(key.id, key.status)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        key.status === 'active'
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {key.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {apiKeys.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No API keys found. Add one to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Key Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add API Key</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key *
                </label>
                <input
                  type="text"
                  required
                  value={newKey.apiKey}
                  onChange={(e) => setNewKey({ ...newKey, apiKey: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="AIza..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Production Key 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={newKey.priority}
                    onChange={(e) => setNewKey({ ...newKey, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Daily Limit
                  </label>
                  <input
                    type="number"
                    value={newKey.maxRequestsPerDay}
                    onChange={(e) => setNewKey({ ...newKey, maxRequestsPerDay: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddKey}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
