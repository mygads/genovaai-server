'use client';

import { useEffect, useState } from 'react';
import { FaPlus, FaSave, FaSync, FaTrash } from 'react-icons/fa';
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

interface ModelOption {
  id?: string;
  modelId: string;
  displayName?: string | null;
  pricePerRequest?: string | number;
}

interface BYOKProvider {
  id: string;
  name: string;
  baseUrl: string;
  status: string;
  defaultModel: string | null;
}

interface UserProfile {
  balance?: string | number;
}

export default function SettingsPage() {
  const [sessions, setSessions] = useState<ExtensionSession[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [byokProvider, setByokProvider] = useState<BYOKProvider | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [knowledgeFiles, setKnowledgeFiles] = useState<Array<{ id: string; fileName: string; extractedText: string | null; fileType: string }>>([]);
  const [newSession, setNewSession] = useState({
    sessionName: '',
    requestMode: 'paid_balance' as 'paid_balance' | 'byok',
    model: '',
    answerMode: 'medium',
    systemPrompt: 'You are a helpful AI assistant.',
    useCustomPrompt: false,
    customSystemPrompt: '',
    knowledgeFileIds: [] as string[],
    useKnowledge: false,
  });

  const requestModes = [
    { value: 'paid_balance', label: 'Paid Balance', description: 'Use Genova balance and admin-enabled models' },
    { value: 'byok', label: 'BYOK', description: 'Use your own OpenAI-compatible provider' },
  ];

  const answerModes = [
    { value: 'single', label: 'Single', description: 'One word/phrase' },
    { value: 'short', label: 'Short', description: '1-2 sentences' },
    { value: 'medium', label: 'Medium', description: 'Paragraph' },
    { value: 'long', label: 'Long', description: 'Detailed answer' },
  ];

  useEffect(() => {
    Promise.all([fetchSessions(), fetchUser(), fetchBYOKProvider(), fetchKnowledgeFiles()])
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchModels(newSession.requestMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newSession.requestMode]);

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

  async function fetchUser() {
    try {
      const response = await authFetch('/api/customer/genovaai/profile');
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }

  async function fetchBYOKProvider() {
    try {
      const response = await authFetch('/api/customer/genovaai/apikeys');
      const data = await response.json();
      if (data.success) {
        setByokProvider(data.data?.provider || null);
      }
    } catch (error) {
      console.error('Error fetching BYOK provider:', error);
    }
  }

  async function fetchModels(mode = newSession.requestMode) {
    try {
      const response = await authFetch(`/api/customer/genovaai/models?mode=${mode}`);
      const data = await response.json();
      const nextModels = data.success ? data.data?.models || [] : [];
      setModels(nextModels);
      setNewSession((current) => ({
        ...current,
        model: nextModels.some((model: ModelOption) => model.modelId === current.model)
          ? current.model
          : nextModels[0]?.modelId || '',
      }));
    } catch (error) {
      console.error('Error fetching models:', error);
      setModels([]);
    }
  }

  async function fetchSessions() {
    try {
      const response = await authFetch('/api/customer/genovaai/sessions');
      const data = await response.json();
      if (data.success) {
        setSessions(data.data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  }

  async function fetchKnowledgeFiles() {
    try {
      const response = await authFetch('/api/customer/genovaai/knowledge?limit=100');
      const data = await response.json();
      if (data.success) {
        setKnowledgeFiles(data.data.files || []);
      }
    } catch (error) {
      console.error('Error fetching knowledge files:', error);
    }
  }

  async function handleCreateSession() {
    if (!newSession.sessionName.trim()) {
      alert('Please enter a session name');
      return;
    }

    if (!newSession.model) {
      alert('Please select a model');
      return;
    }

    if (newSession.requestMode === 'byok' && byokProvider?.status !== 'active') {
      alert('Please configure an active BYOK provider first');
      return;
    }

    const selectedModel = models.find((model) => model.modelId === newSession.model);
    const price = Number(selectedModel?.pricePerRequest || 0);
    if (newSession.requestMode === 'paid_balance' && Number(user?.balance || 0) < price) {
      alert('Insufficient balance for the selected model');
      return;
    }

    setSaving(true);
    try {
      const response = await authFetch('/api/customer/genovaai/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionName: newSession.sessionName,
          requestMode: newSession.requestMode,
          provider: 'openai_compatible',
          model: newSession.model,
          answerMode: newSession.answerMode,
          systemPrompt: newSession.systemPrompt,
          useCustomPrompt: newSession.useCustomPrompt,
          customSystemPrompt: newSession.customSystemPrompt,
          knowledgeFileIds: newSession.useKnowledge ? newSession.knowledgeFileIds : [],
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Session created successfully');
        setShowAddForm(false);
        setNewSession({
          sessionName: '',
          requestMode: 'paid_balance',
          model: models[0]?.modelId || '',
          answerMode: 'medium',
          systemPrompt: 'You are a helpful AI assistant.',
          useCustomPrompt: false,
          customSystemPrompt: '',
          knowledgeFileIds: [],
          useKnowledge: false,
        });
        fetchSessions();
      } else {
        alert(data.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to create session');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetActive(sessionId: string) {
    try {
      const response = await authFetch(`/api/customer/genovaai/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      const data = await response.json();
      if (data.success) fetchSessions();
      else alert(data.error || 'Failed to activate session');
    } catch (error) {
      console.error('Failed to activate session:', error);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (!confirm('Delete this session?')) return;

    try {
      const response = await authFetch(`/api/customer/genovaai/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) fetchSessions();
      else alert(data.error || 'Failed to delete session');
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }

  function formatPrice(value?: string | number) {
    return Number(value || 0).toLocaleString('id-ID');
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage sessions, models, prompts, and knowledge context</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          New Session
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Balance</div>
            <div className="text-2xl font-semibold">Rp {Number(user?.balance || 0).toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">BYOK Provider</div>
            <div className="text-lg font-semibold">{byokProvider ? byokProvider.status : 'Not configured'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Available Models</div>
            <div className="text-2xl font-semibold">{models.length}</div>
          </CardContent>
        </Card>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create AI Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Session Name</label>
              <input
                type="text"
                value={newSession.sessionName}
                onChange={(event) => setNewSession({ ...newSession, sessionName: event.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
                placeholder="e.g., Research, Work, Quiz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Request Mode</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {requestModes.map((mode) => {
                  const disabled = mode.value === 'byok' && byokProvider?.status !== 'active';
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && setNewSession({ ...newSession, requestMode: mode.value as 'paid_balance' | 'byok', model: '' })}
                      className={`p-4 rounded-lg border-2 text-left ${newSession.requestMode === mode.value ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="font-medium">{mode.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{mode.description}</div>
                      {disabled && <div className="text-xs text-red-500 mt-1">Configure an active BYOK provider first</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Provider</label>
                <div className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  OpenAI-compatible
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <select
                  value={newSession.model}
                  onChange={(event) => setNewSession({ ...newSession, model: event.target.value })}
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
                >
                  {models.map((model) => (
                    <option key={model.modelId} value={model.modelId}>
                      {model.displayName || model.modelId}
                      {newSession.requestMode === 'paid_balance' ? ` - Rp ${formatPrice(model.pricePerRequest)}/request` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Answer Mode</label>
              <select
                value={newSession.answerMode}
                onChange={(event) => setNewSession({ ...newSession, answerMode: event.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
              >
                {answerModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>{mode.label} - {mode.description}</option>
                ))}
              </select>
            </div>

            <div className="border-t pt-4">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={newSession.useCustomPrompt}
                  onChange={(event) => setNewSession({ ...newSession, useCustomPrompt: event.target.checked })}
                />
                <span className="text-sm">Use custom system prompt</span>
              </label>
              {newSession.useCustomPrompt && (
                <textarea
                  value={newSession.customSystemPrompt}
                  onChange={(event) => setNewSession({ ...newSession, customSystemPrompt: event.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800"
                  placeholder="Write your custom system prompt..."
                />
              )}
            </div>

            {knowledgeFiles.length > 0 && (
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={newSession.useKnowledge}
                    onChange={(event) => setNewSession({ ...newSession, useKnowledge: event.target.checked })}
                  />
                  <span className="text-sm">Use knowledge files</span>
                </label>
                {newSession.useKnowledge && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {knowledgeFiles.map((file) => (
                      <label key={file.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newSession.knowledgeFileIds.includes(file.id)}
                          onChange={(event) => {
                            const ids = event.target.checked
                              ? [...newSession.knowledgeFileIds, file.id]
                              : newSession.knowledgeFileIds.filter((id) => id !== file.id);
                            setNewSession({ ...newSession, knowledgeFileIds: ids });
                          }}
                        />
                        {file.fileName}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button
                onClick={handleCreateSession}
                disabled={saving || !newSession.model}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
              >
                <FaSave className="w-4 h-4" />
                {saving ? 'Saving...' : 'Create Session'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sessions</h2>
        <button onClick={() => { fetchSessions(); fetchModels(); }} className="flex items-center gap-2 px-3 py-2 border rounded-lg">
          <FaSync className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{session.sessionName}</h3>
                  {session.isActive && <Badge>Active</Badge>}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {session.requestMode} · {session.model || 'No model'} · {session.answerMode}
                </div>
              </div>
              <div className="flex gap-2">
                {!session.isActive && (
                  <button onClick={() => handleSetActive(session.sessionId)} className="px-3 py-2 bg-blue-600 text-white rounded-lg">Set Active</button>
                )}
                <button onClick={() => handleDeleteSession(session.sessionId)} className="px-3 py-2 border text-red-600 rounded-lg">
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        {sessions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">No sessions yet. Create your first session to start using Genova.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
