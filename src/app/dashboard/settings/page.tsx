'use client';

import { useEffect, useState } from 'react';
import { FaSave, FaPlus, FaTrash, FaCog, FaSync, FaCheckCircle } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ExtensionSession {
  id: string;
  sessionId: string;
  sessionName: string;
  requestMode: string;
  provider: string | null;
  model: string | null;
  answerMode: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function SettingsPage() {
  const [sessions, setSessions] = useState<ExtensionSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newSession, setNewSession] = useState({
    sessionName: '',
    requestMode: 'premium',
    provider: 'openai',
    model: 'gpt-4o',
    answerMode: 'medium',
    systemPrompt: 'You are a helpful AI assistant.',
  });

  const providers = [
    { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { value: 'anthropic', label: 'Anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'] },
    { value: 'google', label: 'Google', models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
  ];

  const requestModes = [
    { value: 'premium', label: 'Premium Mode', description: 'Use credits' },
    { value: 'free_user_key', label: 'Free Mode', description: 'Use your API keys' },
    { value: 'free_pool', label: 'Free Pool', description: 'Use shared pool' },
  ];

  const answerModes = [
    { value: 'single', label: 'Single', description: 'One word/phrase' },
    { value: 'short', label: 'Short', description: '1-2 sentences' },
    { value: 'medium', label: 'Medium', description: 'Paragraph' },
    { value: 'long', label: 'Long', description: 'Detailed answer' },
  ];

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8090/api/customer/genovaai/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSessions(data.data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSession() {
    if (!newSession.sessionName.trim()) {
      alert('Session name is required');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8090/api/customer/genovaai/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSession),
      });
      const data = await response.json();
      if (data.success) {
        setSessions([...sessions, data.data]);
        setNewSession({
          sessionName: '',
          defaultRequestMode: 'paid',
          defaultProvider: 'openai',
          defaultModel: 'gpt-4o',
        });
        setShowAddForm(false);
      } else {
        alert(data.message || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8090/api/customer/genovaai/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSessions(sessions.filter(s => s.id !== sessionId));
      } else {
        alert(data.message || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    }
  }

  async function handleSetActive(sessionId: string) {
    // Set active session by updating it
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8090/api/customer/genovaai/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: true }),
      });
      
      const data = await response.json();
      if (data.success) {
        // Refresh sessions list
        fetchSessions();
      } else {
        alert(data.message || 'Failed to set active session');
      }
    } catch (error) {
      console.error('Error setting active session:', error);
      alert('Failed to set active session');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Extension Settings</h1>
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-gray-500 dark:text-gray-400">Loading settings...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Extension Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your Chrome extension configuration and sessions
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          New Session
        </button>
      </div>

      {/* Add Session Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Name
                </label>
                <input
                  type="text"
                  value={newSession.sessionName}
                  onChange={(e) => setNewSession({ ...newSession, sessionName: e.target.value })}
                  placeholder="e.g., Work, Personal, Research"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Request Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {requestModes.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setNewSession({ ...newSession, requestMode: mode.value })}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        newSession.requestMode === mode.value
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{mode.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{mode.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Answer Mode
                </label>
                <select
                  value={newSession.answerMode}
                  onChange={(e) => setNewSession({ ...newSession, answerMode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {answerModes.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label} - {mode.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Provider
                  </label>
                  <select
                    value={newSession.provider}
                    onChange={(e) => {
                      const provider = providers.find(p => p.value === e.target.value);
                      setNewSession({
                        ...newSession,
                        provider: e.target.value,
                        model: provider?.models[0] || '',
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {providers.map((provider) => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Model
                  </label>
                  <select
                    value={newSession.model}
                    onChange={(e) => setNewSession({ ...newSession, model: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {providers
                      .find(p => p.value === newSession.provider)
                      ?.models.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSession}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FaSave className="w-4 h-4" />
                  {saving ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <FaCog className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Sessions Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first session to configure your extension settings
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              Create Session
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => {
            const provider = providers.find(p => p.value === session.defaultProvider);
            return (
              <Card key={session.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {session.sessionName}
                        </h3>
                        {session.isActive && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <FaCheckCircle className="w-3 h-3" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <Badge variant="secondary">
                          {session.requestMode === 'premium' ? '💳 Premium' : session.requestMode === 'free_user_key' ? '🔑 Free' : '🌐 Pool'}
                        </Badge>
                        <Badge variant="outline">
                          {provider?.label || session.provider || 'N/A'}
                        </Badge>
                        <Badge variant="outline">
                          {session.model || 'N/A'}
                        </Badge>
                        <Badge variant="outline">
                          {session.answerMode}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!session.isActive && (
                        <button
                          onClick={() => handleSetActive(session.id)}
                          disabled={saving}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Set as active"
                        >
                          <FaSync className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete session"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Created:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {new Date(session.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Last Used:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {session.lastUsedAt ? new Date(session.lastUsedAt).toLocaleDateString('id-ID') : 'Never'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaCog className="w-5 h-5 text-blue-600" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong className="text-gray-900 dark:text-white">Sessions</strong> allow you to configure different settings for your Chrome extension. Each session can have its own request mode, provider, and model preferences.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">Active Session:</strong> Only one session can be active at a time. The active session&apos;s settings will be used by your extension.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">Request Modes:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Paid Mode:</strong> Uses your account credits to make requests</li>
              <li><strong>Free Mode:</strong> Uses your own API keys (configure in API Keys page)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
