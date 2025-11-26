'use client';

import { useEffect, useState } from 'react';
import { FaHistory, FaRobot, FaClock, FaCheckCircle, FaTimesCircle, FaChevronRight, FaFileAlt, FaCode } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChatHistory {
  id: string;
  question: string;
  answer: string;
  answerMode: string;
  userPrompt?: string;
  systemPrompt?: string;
  knowledgeContext?: string;
  fileIds?: string[];
  createdAt: string;
  sessionId: string;
  session: {
    sessionName: string;
    sessionId: string;
  };
  llmRequest: {
    model: string;
    provider: string;
    requestMode: string;
    responseTimeMs: number;
    status: string;
  } | null;
}

interface SessionGroup {
  sessionId: string;
  sessionName: string;
  histories: ChatHistory[];
  count: number;
  lastUsed: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [sessions, setSessions] = useState<SessionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ChatHistory | null>(null);

  useEffect(() => {
    async function loadHistory() {
      await fetchHistory();
    }
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchHistory() {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setHistory([]);
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/customer/genovaai/history?limit=200', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data?.history) {
        const historyData = data.data.history;
        setHistory(historyData);
        
        // Group by session
        const grouped = groupBySession(historyData);
        setSessions(grouped);
        
        // Auto expand first session
        if (grouped.length > 0) {
          setExpandedSession(grouped[0].sessionId);
        }
      } else {
        setHistory([]);
        setSessions([]);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setHistory([]);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  function groupBySession(historyData: ChatHistory[]): SessionGroup[] {
    const grouped = new Map<string, SessionGroup>();
    
    historyData.forEach((item) => {
      const sessionId = item.sessionId || 'unknown';
      const sessionName = item.session?.sessionName || 'Unknown Session';
      
      if (!grouped.has(sessionId)) {
        grouped.set(sessionId, {
          sessionId,
          sessionName,
          histories: [],
          count: 0,
          lastUsed: item.createdAt,
        });
      }
      
      const group = grouped.get(sessionId)!;
      group.histories.push(item);
      group.count++;
      
      // Update lastUsed if this item is newer
      if (new Date(item.createdAt) > new Date(group.lastUsed)) {
        group.lastUsed = item.createdAt;
      }
    });
    
    // Convert to array and sort by lastUsed
    return Array.from(grouped.values()).sort((a, b) => 
      new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    );
  }

  function toggleSession(sessionId: string) {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
    setSelectedItem(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chat History</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Your conversations grouped by session ({history.length} total conversations)
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="py-12">
            <div className="text-center">
              <FaHistory className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No history yet</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Start using Genova AI to see your conversation history here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List with nested histories */}
          <div className="lg:col-span-2 space-y-3">
            {sessions.map((session) => (
              <div key={session.sessionId} className="space-y-2">
                {/* Session Header */}
                <Card
                  className="border-border/50 shadow-sm cursor-pointer hover:shadow-md transition-all"
                  onClick={() => toggleSession(session.sessionId)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`transition-transform ${expandedSession === session.sessionId ? 'rotate-90' : ''}`}>
                          <FaChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {session.sessionName}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {session.count} conversation{session.count > 1 ? 's' : ''} · Last used {new Date(session.lastUsed).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{session.count}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* History Items (shown when expanded) */}
                {expandedSession === session.sessionId && (
                  <div className="ml-8 space-y-2">
                    {session.histories.map((item) => (
                      <Card
                        key={item.id}
                        className={`border-border/50 shadow-sm cursor-pointer transition-all ${
                          selectedItem?.id === item.id
                            ? 'ring-2 ring-blue-500 shadow-md bg-blue-50 dark:bg-blue-900/10'
                            : 'hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <CardContent className="py-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                              <FaRobot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                                {item.question}
                              </p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="secondary" className="text-xs">
                                  {item.llmRequest?.model || 'N/A'}
                                </Badge>
                                {item.llmRequest?.status === 'success' ? (
                                  <FaCheckCircle className="w-3 h-3 text-green-600" />
                                ) : (
                                  <FaTimesCircle className="w-3 h-3 text-red-600" />
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <FaClock className="w-3 h-3" />
                                  {new Date(item.createdAt).toLocaleString('id-ID', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Detail Panel */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            {selectedItem ? (
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FaHistory className="w-4 h-4 text-purple-600" />
                    Conversation Detail
                  </CardTitle>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Session: {selectedItem.session?.sessionName}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Question</p>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm">
                      <p className="text-gray-900 dark:text-white">{selectedItem.question}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Answer</p>
                    <div className={`rounded-lg p-3 max-h-64 overflow-y-auto text-sm ${
                      selectedItem.answer.startsWith('[Error]')
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        : 'bg-blue-50 dark:bg-blue-900/20'
                    }`}>
                      <p className={`whitespace-pre-wrap ${
                        selectedItem.answer.startsWith('[Error]')
                          ? 'text-red-900 dark:text-red-100 font-medium'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {selectedItem.answer}
                      </p>
                    </div>
                  </div>

                  {/* User Prompt (Full request sent to LLM) */}
                  {selectedItem.userPrompt && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <FaCode className="w-3 h-3 text-blue-600" />
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Full Request Content</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 max-h-40 overflow-y-auto text-xs">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {selectedItem.userPrompt}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Request Info */}
                  {selectedItem.llmRequest && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Request Information</p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Model</p>
                          <p className="font-medium text-gray-900 dark:text-white mt-1">
                            {selectedItem.llmRequest.model}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Provider</p>
                          <p className="font-medium text-gray-900 dark:text-white mt-1 capitalize">
                            {selectedItem.llmRequest.provider}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Mode</p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {selectedItem.llmRequest.requestMode.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Response Time</p>
                          <p className="font-medium text-gray-900 dark:text-white mt-1">
                            {selectedItem.llmRequest.responseTimeMs}ms
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Answer Mode</p>
                          <p className="font-medium text-gray-900 dark:text-white mt-1 capitalize">
                            {selectedItem.answerMode}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Status</p>
                          <Badge variant={selectedItem.llmRequest?.status === 'success' ? 'default' : 'destructive'} className="mt-1 text-xs">
                            {selectedItem.llmRequest?.status || 'unknown'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* System Prompt */}
                  {selectedItem.systemPrompt && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <FaCode className="w-3 h-3 text-purple-600" />
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">System Prompt Used</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-3 text-xs">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                          {selectedItem.systemPrompt}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Knowledge Context */}
                  {selectedItem.knowledgeContext && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <FaFileAlt className="w-3 h-3 text-green-600" />
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Knowledge Context</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3 max-h-40 overflow-y-auto text-xs">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {selectedItem.knowledgeContext}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Knowledge Files */}
                  {selectedItem.fileIds && selectedItem.fileIds.length > 0 && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Knowledge Files ({selectedItem.fileIds.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.fileIds.map((fileId, idx) => (
                          <Badge key={fileId} variant="outline" className="text-xs">
                            File {idx + 1}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(selectedItem.createdAt).toLocaleString('id-ID', {
                        dateStyle: 'full',
                        timeStyle: 'medium'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 shadow-sm">
                <CardContent className="py-12">
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                    <FaRobot className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Select a conversation to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
