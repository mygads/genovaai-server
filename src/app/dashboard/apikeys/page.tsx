'use client';

import { useEffect, useState } from 'react';
import { FaKey, FaPlus, FaTrash, FaSync, FaSave } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BYOKProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  status: string;
  defaultModel: string | null;
  models?: Array<{ id: string; name?: string }>;
  lastFetchedAt: string | null;
  lastUsedAt: string | null;
  lastError: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [provider, setProvider] = useState<BYOKProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: 'My Provider',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    defaultModel: '',
  });

  useEffect(() => {
    fetchProvider();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function authFetch(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('accessToken');
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async function fetchProvider() {
    try {
      const response = await authFetch('/api/customer/genovaai/apikeys');
      const data = await response.json();
      if (data.success) {
        const nextProvider = data.data?.provider || null;
        setProvider(nextProvider);
        if (nextProvider) {
          setFormData({
            name: nextProvider.name || 'My Provider',
            baseUrl: nextProvider.baseUrl || 'https://api.openai.com/v1',
            apiKey: '',
            defaultModel: nextProvider.defaultModel || '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch BYOK provider:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(refreshModels = false) {
    if (!formData.name.trim() || !formData.baseUrl.trim()) {
      alert('Please fill provider name and base URL');
      return;
    }

    if (!provider && !formData.apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }

    setSaving(true);
    try {
      const url = provider ? `/api/customer/genovaai/apikeys/${provider.id}` : '/api/customer/genovaai/apikeys';
      const method = provider ? 'PATCH' : 'POST';
      const payload: Record<string, unknown> = {
        name: formData.name,
        baseUrl: formData.baseUrl,
        defaultModel: formData.defaultModel || undefined,
      };

      if (formData.apiKey.trim()) payload.apiKey = formData.apiKey;
      if (refreshModels) payload.refreshModels = true;

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (data.success) {
        alert(provider ? 'BYOK provider updated successfully' : 'BYOK provider added successfully');
        setShowForm(false);
        setFormData((current) => ({ ...current, apiKey: '' }));
        fetchProvider();
      } else {
        alert(data.error || 'Failed to save BYOK provider');
      }
    } catch (error) {
      console.error('Failed to save BYOK provider:', error);
      alert('Failed to save BYOK provider');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!provider || !confirm('Delete this BYOK provider?')) return;

    try {
      const response = await authFetch(`/api/customer/genovaai/apikeys/${provider.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setProvider(null);
        setShowForm(false);
        setFormData({ name: 'My Provider', baseUrl: 'https://api.openai.com/v1', apiKey: '', defaultModel: '' });
      } else {
        alert(data.error || 'Failed to delete BYOK provider');
      }
    } catch (error) {
      console.error('Failed to delete BYOK provider:', error);
    }
  }

  function getStatusColor(status: string) {
    if (status === 'active') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (status === 'invalid') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-gray-500">Loading BYOK provider...</div>;
  }

  const models = provider?.models || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">BYOK Provider</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Configure one OpenAI-compatible API provider for free BYOK usage</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          {provider ? 'Edit Provider' : 'Add Provider'}
        </button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{provider ? 'Edit BYOK Provider' : 'Add BYOK Provider'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Provider Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
                placeholder="e.g., OpenAI, Internal Gateway, Compatible Provider"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Base URL</label>
              <input
                type="url"
                value={formData.baseUrl}
                onChange={(event) => setFormData({ ...formData, baseUrl: event.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
                placeholder="https://api.openai.com/v1"
              />
              <p className="text-xs text-gray-500 mt-1">Must support OpenAI-compatible /models and /chat/completions endpoints.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">API Key</label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(event) => setFormData({ ...formData, apiKey: event.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
                placeholder={provider ? 'Leave blank to keep existing key' : 'sk-...'}
              />
            </div>

            {models.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Default Model</label>
                <select
                  value={formData.defaultModel}
                  onChange={(event) => setFormData({ ...formData, defaultModel: event.target.value })}
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>{model.name || model.id}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              {provider && (
                <button onClick={() => handleSave(true)} disabled={saving} className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                  <FaSync className="w-4 h-4" /> Refresh Models
                </button>
              )}
              <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400">
                <FaSave className="w-4 h-4" /> {saving ? 'Saving...' : 'Save & Test'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {provider ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><FaKey /> {provider.name}</CardTitle>
              <Badge className={getStatusColor(provider.status)}>{provider.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Base URL</div>
                <div className="font-medium break-all">{provider.baseUrl}</div>
              </div>
              <div>
                <div className="text-gray-500">API Key</div>
                <div className="font-medium">{provider.apiKey}</div>
              </div>
              <div>
                <div className="text-gray-500">Default Model</div>
                <div className="font-medium">{provider.defaultModel || 'Not selected'}</div>
              </div>
              <div>
                <div className="text-gray-500">Fetched Models</div>
                <div className="font-medium">{models.length}</div>
              </div>
            </div>

            {provider.lastError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                {provider.lastError}
              </div>
            )}

            {models.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Available Models</h3>
                <div className="flex flex-wrap gap-2">
                  {models.map((model) => (
                    <Badge key={model.id} variant="secondary">{model.name || model.id}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg">
                <FaTrash className="w-4 h-4" /> Delete Provider
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No BYOK provider configured. Add an OpenAI-compatible provider to use BYOK mode without Genova balance.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
