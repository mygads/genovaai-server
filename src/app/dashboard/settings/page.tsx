'use client';

import { useEffect, useState } from 'react';
import { FaSave, FaPlus, FaTrash, FaCog, FaSync, FaCheckCircle, FaEdit } from 'react-icons/fa';
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
  const [user, setUser] = useState<any>(null);
  const [userApiKeys, setUserApiKeys] = useState<Array<{ id: string; status: string }>>([]);
  const [knowledgeFiles, setKnowledgeFiles] = useState<Array<{ id: string; fileName: string }>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newSession, setNewSession] = useState({
    sessionName: '',
    requestMode: 'premium',
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    answerMode: 'medium',
    systemPrompt: 'You are a helpful AI assistant.',
    useCustomPrompt: false,
    customSystemPrompt: '',
    knowledgeFileIds: [] as string[],
    useKnowledge: false,
  });

  const providers = [
    { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'], requiresPremium: true },
    { value: 'anthropic', label: 'Anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'], requiresPremium: true },
    { value: 'google', label: 'Google', models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'], requiresPremium: true },
    { value: 'gemini', label: 'Gemini', models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash-lite'], requiresPremium: false },
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
    fetchUser();
    fetchUserApiKeys();
    fetchKnowledgeFiles();
  }, []);

  async function fetchUser() {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
  }

  async function fetchUserApiKeys() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/customer/genovaai/apikeys', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data?.apiKeys) {
        setUserApiKeys(data.data.apiKeys);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  }

  async function fetchKnowledgeFiles() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/customer/genovaai/knowledge?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data?.files) {
        setKnowledgeFiles(data.data.files);
      }
    } catch (error) {
      console.error('Error fetching knowledge files:', error);
    }
  }

  async function fetchSessions() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/customer/genovaai/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('[Fetch Sessions] Response:', data);
      if (data.success) {
        const sessionsList = data.data.sessions || [];
        console.log('[Fetch Sessions] Sessions list:', sessionsList);
        console.log('[Fetch Sessions] Active sessions:', sessionsList.filter((s: ExtensionSession) => s.isActive));
        setSessions(sessionsList);
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

    // Validate free_pool mode
    if (newSession.requestMode === 'free_pool') {
      const balance = parseFloat(user?.balance || '0');
      const credits = user?.credits || 0;
      if (balance <= 0 && credits < 1) {
        alert('Free Pool mode requires balance or credits. Please top up or exchange balance to credits first.');
        return;
      }
    }

    // Force Gemini for free modes
    if (newSession.requestMode === 'free_user_key' || newSession.requestMode === 'free_pool') {
      if (newSession.provider !== 'gemini') {
        setNewSession({ ...newSession, provider: 'gemini', model: 'gemini-2.5-flash' });
      }
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (editingId) {
        // Update existing session
        const response = await fetch(`/api/customer/genovaai/sessions/${editingId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSession),
        });
        const data = await response.json();
        if (data.success) {
          setSessions(sessions.map(s => s.sessionId === editingId ? data.data : s));
          setNewSession({
            sessionName: '',
            requestMode: 'premium',
            provider: 'openai',
            model: 'gpt-4o',
            answerMode: 'medium',
            systemPrompt: 'You are a helpful AI assistant.',
            useCustomPrompt: false,
            customSystemPrompt: '',
            knowledgeFileIds: [],
            useKnowledge: false,
          });
          setShowAddForm(false);
          setEditingId(null);
        } else {
          alert(data.message || 'Failed to update session');
        }
      } else {
        // Create new session
        const response = await fetch('/api/customer/genovaai/sessions', {
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
            requestMode: 'premium',
            provider: 'openai',
            model: 'gpt-4o',
            answerMode: 'medium',
            systemPrompt: 'You are a helpful AI assistant.',
            useCustomPrompt: false,
            customSystemPrompt: '',
            knowledgeFileIds: [],
            useKnowledge: false,
          });
          setShowAddForm(false);
        } else {
          alert(data.message || 'Failed to create session');
        }
      }
    } catch (error) {
      console.error('Error creating/updating session:', error);
      alert('Failed to save session');
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
      const response = await fetch(`/api/customer/genovaai/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSessions(sessions.filter(s => s.sessionId !== sessionId));
      } else {
        alert(data.error || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    }
  }

  function handleEditSession(session: ExtensionSession) {
    setEditingId(session.sessionId);
    setNewSession({
      sessionName: session.sessionName,
      requestMode: session.requestMode,
      provider: session.provider || 'gemini',
      model: session.model || 'gemini-2.5-flash',
      answerMode: session.answerMode,
      systemPrompt: (session as ExtensionSession & { systemPrompt?: string }).systemPrompt || 'You are a helpful AI assistant.',
      useCustomPrompt: (session as ExtensionSession & { useCustomPrompt?: boolean }).useCustomPrompt || false,
      customSystemPrompt: (session as ExtensionSession & { customSystemPrompt?: string }).customSystemPrompt || '',
      knowledgeFileIds: (session as ExtensionSession & { knowledgeFileIds?: string[] }).knowledgeFileIds || [],
      useKnowledge: false, // Will be determined by whether knowledge is used
    });
    setShowAddForm(true);
  }

  async function handleSetActive(sessionId: string) {
    // Set active session by updating it
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      console.log('[Set Active] Request:', { sessionId, isActive: true });
      
      const response = await fetch(`/api/customer/genovaai/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: true }),
      });
      
      const data = await response.json();
      console.log('[Set Active] Response:', data);
      
      if (data.success) {
        // Refresh sessions list
        await fetchSessions();
        alert('Session activated successfully!');
      } else {
        console.error('[Set Active] Error:', data.error);
        alert(data.error || 'Failed to set active session');
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

      {/* Add/Edit Session Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Session' : 'Create New Session'}</CardTitle>
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
                  {requestModes.map((mode) => {
                    const isFreePoolDisabled = mode.value === 'free_pool' && 
                      (!user || (parseFloat(user.balance || '0') <= 0 && (user.credits || 0) < 1));
                    const isFreeUserKeyDisabled = mode.value === 'free_user_key' && userApiKeys.length === 0;
                    const isDisabled = isFreePoolDisabled || isFreeUserKeyDisabled;
                    return (
                      <button
                        key={mode.value}
                        onClick={() => {
                          if (!isDisabled) {
                            const newMode = mode.value as 'premium' | 'free_user_key' | 'free_pool';
                            setNewSession({ 
                              ...newSession, 
                              requestMode: newMode,
                              provider: (newMode === 'free_user_key' || newMode === 'free_pool') ? 'gemini' : newSession.provider,
                              model: (newMode === 'free_user_key' || newMode === 'free_pool') ? 'gemini-2.5-flash' : newSession.model,
                            });
                          }
                        }}
                        disabled={isDisabled}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          newSession.requestMode === mode.value
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{mode.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {mode.description}
                          {mode.value === 'free_pool' && isFreePoolDisabled && (
                            <span className="block text-red-500 mt-1">Requires balance or credits</span>
                          )}
                          {mode.value === 'free_user_key' && isFreeUserKeyDisabled && (
                            <span className="block text-red-500 mt-1">Add API key first</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
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
                    disabled={newSession.requestMode === 'free_user_key' || newSession.requestMode === 'free_pool'}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                  >
                    {providers
                      .filter(p => newSession.requestMode === 'premium' || !p.requiresPremium)
                      .map((provider) => (
                        <option key={provider.value} value={provider.value}>
                          {provider.label}
                        </option>
                      ))}
                  </select>
                  {(newSession.requestMode === 'free_user_key' || newSession.requestMode === 'free_pool') && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Only Gemini available for free modes
                    </p>
                  )}
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

              {/* Custom Prompt Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    System Prompt Configuration
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSession.useCustomPrompt}
                      onChange={(e) => setNewSession({ ...newSession, useCustomPrompt: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Use Custom Prompt</span>
                  </label>
                </div>
                
                {newSession.useCustomPrompt ? (
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Write your own system prompt to customize AI behavior
                    </label>
                    <textarea
                      value={newSession.customSystemPrompt}
                      onChange={(e) => setNewSession({ ...newSession, customSystemPrompt: e.target.value })}
                      placeholder="Example: You are a professional quiz assistant specialized in biology. Always provide detailed explanations with scientific terms..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Default Prompt:</strong> AI will use the standard prompt optimized for your selected answer mode ({newSession.answerMode}).
                    </p>
                  </div>
                )}
              </div>

              {/* Knowledge Base Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Knowledge Base
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSession.useKnowledge}
                      onChange={(e) => setNewSession({ ...newSession, useKnowledge: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Enable Knowledge Base</span>
                  </label>
                </div>
                
                {newSession.useKnowledge && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Select knowledge files to include in this session&apos;s context
                    </p>
                    {knowledgeFiles.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No knowledge files available</p>
                        <a 
                          href="/dashboard/knowledge" 
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Upload knowledge files →
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {knowledgeFiles.map((file) => (
                          <label 
                            key={file.id} 
                            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={newSession.knowledgeFileIds.includes(file.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewSession({
                                    ...newSession,
                                    knowledgeFileIds: [...newSession.knowledgeFileIds, file.id]
                                  });
                                } else {
                                  setNewSession({
                                    ...newSession,
                                    knowledgeFileIds: newSession.knowledgeFileIds.filter(id => id !== file.id)
                                  });
                                }
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {file.fileName}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                    {newSession.knowledgeFileIds.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <strong>{newSession.knowledgeFileIds.length}</strong> file{newSession.knowledgeFileIds.length !== 1 ? 's' : ''} selected
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    setNewSession({
                      sessionName: '',
                      requestMode: 'premium',
                      provider: 'gemini',
                      model: 'gemini-2.5-flash',
                      answerMode: 'medium',
                      systemPrompt: 'You are a helpful AI assistant.',
                      useCustomPrompt: false,
                      customSystemPrompt: '',
                      knowledgeFileIds: [],
                      useKnowledge: false,
                    });
                  }}
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
                  {saving ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Session' : 'Create Session')}
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
            const provider = providers.find(p => p.value === session.provider);
            return (
              <Card key={session.sessionId || session.id} className={session.isActive ? 'border-2 border-green-500 bg-green-50 dark:bg-green-900/10' : 'border border-gray-200 dark:border-gray-700'}>
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
                          onClick={() => handleSetActive(session.sessionId)}
                          disabled={saving}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-lg transition-colors"
                          title="Set as active session"
                        >
                          <FaCheckCircle className="w-4 h-4" />
                          Set Active
                        </button>
                      )}
                      <button
                        onClick={() => handleEditSession(session)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit session"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.sessionId)}
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
