'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  label: string;
  description?: string;
  updatedAt: string;
}

export default function AdminConfigPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/genovaai/config', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setConfigs(data.data.configs);
      }
    } catch (error) {
      console.error('Failed to fetch configs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(config: SystemConfig) {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/genovaai/config', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: config.key,
          value: editValue,
          type: config.type,
          category: config.category,
          label: config.label,
          description: config.description || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Configuration updated successfully');
        setEditingKey(null);
        fetchConfigs();
      } else {
        alert(data.error || 'Failed to update configuration');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to update configuration');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(config: SystemConfig) {
    setEditingKey(config.key);
    setEditValue(config.value);
  }

  function formatValue(value: string, type: string) {
    if (type === 'number') {
      const num = parseFloat(value);
      return num.toLocaleString('id-ID');
    }
    return value;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // Group by category
  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, SystemConfig[]>);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            System Configuration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage system-wide settings and configurations
          </p>
        </div>

        {/* Configs by Category */}
        <div className="space-y-6">
          {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                  {category}
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {categoryConfigs.map((config) => (
                    <div
                      key={config.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {config.label}
                            </h3>
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                              {config.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            {config.description || `Key: ${config.key}`}
                          </p>

                          {editingKey === config.key ? (
                            <div className="flex items-center gap-3">
                              <input
                                type={config.type === 'number' ? 'number' : 'text'}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={`Enter ${config.type} value`}
                              />
                              <button
                                onClick={() => handleSave(config)}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                              >
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={() => setEditingKey(null)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {formatValue(config.value, config.type)}
                                {config.key === 'balance_to_credit_rate' && (
                                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                                    (Rp per 1 credit)
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => startEdit(config)}
                                className="px-4 py-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Last updated: {new Date(config.updatedAt).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {configs.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No configurations found. Run database seed to initialize.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
