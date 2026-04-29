'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSync, FaSave } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PaidModel {
  id: string;
  modelId: string;
  displayName: string | null;
  enabled: boolean;
  pricePerRequest: string;
  lastFetchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminAPIKeysPage() {
  const router = useRouter();
  const [models, setModels] = useState<PaidModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { displayName: string; pricePerRequest: string; enabled: boolean }>>({});

  useEffect(() => {
    fetchModels();
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

  async function fetchModels() {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch('/api/admin/genovaai/models');
      const data = await response.json();
      if (data.success) {
        setModels(data.data || []);
        const nextEdits: Record<string, { displayName: string; pricePerRequest: string; enabled: boolean }> = {};
        for (const model of data.data || []) {
          nextEdits[model.id] = {
            displayName: model.displayName || model.modelId,
            pricePerRequest: model.pricePerRequest?.toString() || '0',
            enabled: model.enabled,
          };
        }
        setEdits(nextEdits);
      } else {
        setError(data.error || 'Failed to fetch paid models');
      }
    } catch (error) {
      console.error('Failed to fetch paid models:', error);
      setError('Failed to fetch paid models');
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncModels() {
    setSyncing(true);
    setError(null);
    try {
      const response = await authFetch('/api/admin/genovaai/models', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        await fetchModels();
      } else {
        setError(data.error || 'Failed to fetch models from gateway');
      }
    } catch (error) {
      console.error('Failed to sync paid models:', error);
      setError('Failed to fetch models from gateway');
    } finally {
      setSyncing(false);
    }
  }

  async function handleSave(model: PaidModel) {
    const edit = edits[model.id];
    if (!edit) return;

    const price = Number(edit.pricePerRequest || 0);
    if (Number.isNaN(price) || price < 0) {
      alert('Price must be a valid number');
      return;
    }

    setSavingId(model.id);
    try {
      const response = await authFetch(`/api/admin/genovaai/models/${model.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: edit.displayName,
          pricePerRequest: price,
          enabled: edit.enabled,
        }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchModels();
      } else {
        alert(data.error || 'Failed to update model');
      }
    } catch (error) {
      console.error('Failed to update model:', error);
      alert('Failed to update model');
    } finally {
      setSavingId(null);
    }
  }

  function setEdit(id: string, patch: Partial<{ displayName: string; pricePerRequest: string; enabled: boolean }>) {
    setEdits((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...patch,
      },
    }));
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-gray-500">Loading paid models...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paid Model Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Fetch OpenAI-compatible models from the gateway configured in .env, enable models, and set customer prices.
            </p>
          </div>
          <button
            onClick={handleSyncModels}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
          >
            <FaSync className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Fetching...' : 'Fetch Models from Gateway'}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Total Models</div>
              <div className="text-2xl font-semibold">{models.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Enabled Models</div>
              <div className="text-2xl font-semibold">{models.filter((model) => model.enabled).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Gateway Config</div>
              <div className="text-sm font-medium">PAID_LLM_BASE_URL + PAID_LLM_API_KEY</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {models.map((model) => {
            const edit = edits[model.id] || { displayName: model.displayName || model.modelId, pricePerRequest: model.pricePerRequest?.toString() || '0', enabled: model.enabled };
            return (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-lg break-all">{model.modelId}</CardTitle>
                    <Badge className={edit.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}>
                      {edit.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Display Name</label>
                    <input
                      type="text"
                      value={edit.displayName}
                      onChange={(event) => setEdit(model.id, { displayName: event.target.value })}
                      className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Price / Request</label>
                    <input
                      type="number"
                      min="0"
                      value={edit.pricePerRequest}
                      onChange={(event) => setEdit(model.id, { pricePerRequest: event.target.value })}
                      className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={edit.enabled}
                        onChange={(event) => setEdit(model.id, { enabled: event.target.checked })}
                      />
                      Enabled
                    </label>
                    <button
                      onClick={() => handleSave(model)}
                      disabled={savingId === model.id}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
                    >
                      <FaSave className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {models.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No paid models found. Configure PAID_LLM_BASE_URL and PAID_LLM_API_KEY, then fetch models from the gateway.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
