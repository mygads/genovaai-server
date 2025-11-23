'use client';

import { useEffect, useState } from 'react';
import { FaKey, FaPlus, FaTrash, FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ApiKey {
  id: string;
  name: string;
  apiKey: string;
  status: string;
  priority: number;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    apiKey: '',
  });

  useEffect(() => {
    fetchApiKeys();
  }, []);

  async function fetchApiKeys() {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setApiKeys([]);
        setLoading(false);
        return;
      }
      
      const response = await fetch('http://localhost:8090/api/customer/genovaai/apikeys', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('[API Keys Page] Response:', data);
      if (data.success && data.data?.apiKeys) {
        console.log('[API Keys Page] Keys found:', data.data.apiKeys.length);
        setApiKeys(data.data.apiKeys);
      } else {
        console.log('[API Keys Page] No keys or error:', data);
        setApiKeys([]);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!formData.name || !formData.apiKey) {
      alert('Please fill all fields');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8090/api/customer/genovaai/apikeys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        alert('API key added successfully');
        setFormData({ name: '', apiKey: '' });
        setShowAddForm(false);
        fetchApiKeys();
      } else {
        alert(data.error || 'Failed to add API key');
      }
    } catch (error) {
      console.error('Failed to add API key:', error);
      alert('Failed to add API key');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8090/api/customer/genovaai/apikeys?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        alert('API key deleted successfully');
        fetchApiKeys();
      } else {
        alert(data.error || 'Failed to delete API key');
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
      alert('Failed to delete API key');
    }
  }

  function toggleKeyVisibility(id: string) {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  function maskApiKey(key: string): string {
    if (key.length <= 8) return '****';
    return key.slice(0, 4) + '****' + key.slice(-4);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading API keys...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">API Keys</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your Gemini API keys for free mode</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          Add API Key
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Add New API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Gemini Key"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="text"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="AIza..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Key
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ name: '', apiKey: '' });
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      {!apiKeys || apiKeys.length === 0 ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="py-12">
            <div className="text-center">
              <FaKey className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No API keys yet</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Add your Gemini API key to use free mode with your own key
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <Card key={key.id} className="border-border/50 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <FaKey className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{key.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {visibleKeys.has(key.id) ? key.apiKey : maskApiKey(key.apiKey)}
                        </code>
                        <button
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {visibleKeys.has(key.id) ? (
                            <FaEyeSlash className="w-4 h-4" />
                          ) : (
                            <FaEye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={key.status === 'active' ? 'default' : key.status === 'rate_limited' ? 'secondary' : 'destructive'}>
                          {key.status}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Priority: {key.priority}
                        </span>
                        {key.lastUsedAt && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Last used: {new Date(key.lastUsedAt).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(key.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
