'use client';

import { useEffect, useState } from 'react';
import { FaHistory, FaRobot, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
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
  createdAt: string;
  llmRequest: {
    model: string;
    provider: string;
    requestMode: string;
    responseTimeMs: number;
    status: string;
  } | null;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ChatHistory | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setHistory([]);
        setLoading(false);
        return;
      }
      
      const response = await fetch('http://localhost:8090/api/customer/genovaai/history?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data?.history) {
        setHistory(data.data.history);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
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
        <p className="text-gray-500 dark:text-gray-400 mt-1">Your conversation history with GenovaAI</p>
      </div>

      {!history || history.length === 0 ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="py-12">
            <div className="text-center">
              <FaHistory className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No history yet</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Start using GenovaAI extension to see your conversation history here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* History List */}
          <div className="space-y-4">
            {history.map((item) => (
              <Card
                key={item.id}
                className={`border-border/50 shadow-sm cursor-pointer transition-all ${
                  selectedItem?.id === item.id
                    ? 'ring-2 ring-blue-500 shadow-md'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedItem(item)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                      <FaRobot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.question}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
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

          {/* Detail Panel */}
          <div className="lg:sticky lg:top-6">
            {selectedItem ? (
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FaHistory className="w-5 h-5 text-purple-600" />
                    Conversation Detail
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Question</p>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-gray-900 dark:text-white">{selectedItem.question}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Answer</p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {selectedItem.answer}
                      </p>
                    </div>
                  </div>

                  {selectedItem.llmRequest && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Model</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedItem.llmRequest.model}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Provider</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {selectedItem.llmRequest.provider}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Mode</p>
                        <Badge variant="secondary">
                          {selectedItem.llmRequest.requestMode.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Response Time</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedItem.llmRequest.responseTimeMs}ms
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Answer Mode</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {selectedItem.answerMode}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                        <Badge variant={selectedItem.llmRequest?.status === 'success' ? 'default' : 'destructive'}>
                          {selectedItem.llmRequest?.status || 'unknown'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 dark:text-gray-400 pt-2">
                    {new Date(selectedItem.createdAt).toLocaleString('id-ID')}
                  </div>

                  {/* Additional Details */}
                  {selectedItem.systemPrompt && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">System Prompt Used</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedItem.systemPrompt}
                      </p>
                    </div>
                  )}

                  {selectedItem.knowledgeContext && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Knowledge Context</p>
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-3 rounded max-h-40 overflow-y-auto">
                        {selectedItem.knowledgeContext}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 shadow-sm">
                <CardContent className="py-12">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    Select a conversation to view details
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
