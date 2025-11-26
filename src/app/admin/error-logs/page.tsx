'use client';

import { useEffect, useState } from 'react';
import { FaExclamationTriangle, FaEye, FaCheck, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ErrorLog {
  id: string;
  userId: string | null;
  errorType: string;
  errorCode: string | null;
  errorMessage: string;
  stackTrace: string | null;
  requestPath: string | null;
  requestMethod: string | null;
  isNew: boolean;
  isViewed: boolean;
  isHandled: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface GroupedError {
  errorCode: string | null;
  errorType: string;
  errorMessage: string;
  totalCount: number;
  newCount: number;
  viewedCount: number;
  handledCount: number;
  lastOccurrence: string;
  latestError: ErrorLog;
}

export default function ErrorLogsPage() {
  const [groupedErrors, setGroupedErrors] = useState<GroupedError[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [groupDetails, setGroupDetails] = useState<Map<string, ErrorLog[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [viewMode] = useState<'grouped' | 'list'>('grouped');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'viewed' | 'handled'>('all');
  const [counts, setCounts] = useState({ new: 0, viewed: 0, handled: 0, total: 0 });

  useEffect(() => {
    fetchErrorLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, statusFilter]);

  async function fetchErrorLogs() {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (viewMode === 'grouped') params.append('groupBy', 'errorCode');

      const response = await fetch(
        `/api/admin/genovaai/error-logs?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        if (viewMode === 'grouped') {
          setGroupedErrors(data.data.groupedErrors);
        }
        if (data.data.counts) {
          setCounts(data.data.counts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch error logs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleGroup(errorCode: string, errorType: string) {
    const key = `${errorCode}-${errorType}`;
    const newExpanded = new Set(expandedGroups);
    
    if (expandedGroups.has(key)) {
      newExpanded.delete(key);
      setExpandedGroups(newExpanded);
    } else {
      newExpanded.add(key);
      setExpandedGroups(newExpanded);
      
      // Fetch details if not already loaded
      if (!groupDetails.has(key)) {
        try {
          const token = localStorage.getItem('accessToken');
          const params = new URLSearchParams();
          params.append('errorType', errorType);
          if (errorCode) params.append('errorCode', errorCode);
          
          const response = await fetch(
            `/api/admin/genovaai/error-logs?${params}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
          const data = await response.json();
          if (data.success) {
            const newDetails = new Map(groupDetails);
            newDetails.set(key, data.data.errors);
            setGroupDetails(newDetails);
          }
        } catch (error) {
          console.error('Failed to fetch error details:', error);
        }
      }
    }
  }

  async function handleBulkAction(errorCode: string, errorType: string, action: 'view' | 'handle') {
    const note = action === 'handle' ? prompt('Enter handling note (optional):') : null;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/admin/genovaai/error-logs/bulk-action', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorCode,
          errorType,
          action,
          handlingNote: note,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchErrorLogs();
      } else {
        alert(data.error || 'Failed to perform action');
      }
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      alert('Failed to perform action');
    }
  }

  function getStatusColor(group: GroupedError) {
    if (group.handledCount === group.totalCount) return 'text-green-600 dark:text-green-400';
    if (group.newCount > 0) return 'text-red-600 dark:text-red-400';
    return 'text-yellow-600 dark:text-yellow-400';
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Error Logs</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor and manage application errors</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">New Errors</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{counts.new}</p>
              </div>
              <FaExclamationTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Viewed</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{counts.viewed}</p>
              </div>
              <FaEye className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Handled</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{counts.handled}</p>
              </div>
              <FaCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.total}</p>
              </div>
              <FaExclamationTriangle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'new' | 'viewed' | 'handled')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="new">New Only</option>
              <option value="viewed">Viewed Only</option>
              <option value="handled">Handled Only</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Grouped Errors */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading error logs...
            </div>
          ) : groupedErrors.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No error logs found
            </div>
          ) : (
            <div className="space-y-4">
              {groupedErrors.map((group) => {
                const key = `${group.errorCode}-${group.errorType}`;
                const isExpanded = expandedGroups.has(key);
                const details = groupDetails.get(key) || [];

                return (
                  <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FaExclamationTriangle className={`w-5 h-5 ${getStatusColor(group)}`} />
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {group.errorCode || 'Unknown Error Code'}
                            </h3>
                            <Badge variant="secondary">{group.errorType}</Badge>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {group.totalCount} occurrence{group.totalCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {group.errorMessage}
                          </p>
                          <div className="flex gap-4 text-xs">
                            {group.newCount > 0 && (
                              <Badge variant="destructive">
                                {group.newCount} new
                              </Badge>
                            )}
                            {group.viewedCount > 0 && (
                              <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                                {group.viewedCount} viewed
                              </Badge>
                            )}
                            {group.handledCount > 0 && (
                              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                {group.handledCount} handled
                              </Badge>
                            )}
                            <span className="text-gray-500 dark:text-gray-400">
                              Last: {new Date(group.lastOccurrence).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleBulkAction(group.errorCode || '', group.errorType, 'view')}
                            className="px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleBulkAction(group.errorCode || '', group.errorType, 'handle')}
                            className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                          >
                            <FaCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleGroup(group.errorCode || '', group.errorType)}
                            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            {isExpanded ? <FaChevronUp className="w-4 h-4" /> : <FaChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-white dark:bg-gray-900 space-y-3">
                        {details.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">Loading details...</p>
                        ) : (
                          details.slice(0, 5).map((error) => (
                            <div key={error.id} className="text-sm border-l-2 border-gray-300 dark:border-gray-600 pl-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={error.isHandled ? 'default' : error.isViewed ? 'secondary' : 'destructive'} className="text-xs">
                                  {error.isHandled ? 'Handled' : error.isViewed ? 'Viewed' : 'New'}
                                </Badge>
                                <span className="text-gray-500 dark:text-gray-400">
                                  {new Date(error.createdAt).toLocaleString()}
                                </span>
                                {error.user && (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    User: {error.user.email}
                                  </span>
                                )}
                              </div>
                              {error.requestPath && (
                                <p className="text-gray-600 dark:text-gray-300">
                                  {error.requestMethod} {error.requestPath}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                        {details.length > 5 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ... and {details.length - 5} more occurrences
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
