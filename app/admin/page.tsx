'use client';

import { useState, useEffect } from 'react';
import { FactCheckResponse } from '../lib/types';

// Trending Prompts Types
interface TrendingPrompt {
  id: string;
  prompt: string;
  cached_result: FactCheckResponse;
  upvote_count: number;
  created_at: string;
  updated_at: string;
}

// History Types
interface HistoryEntry {
  id: string;
  original_text: string;
  text_hash: string;
  result: FactCheckResponse;
  is_error: boolean;
  error_message: string | null;
  response_time_ms: number;
  session_id: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
}

interface Stats {
  totalChecks: number;
  errorCount: number;
  successCount: number;
  uniqueSessions: number;
  avgResponseTimeMs: number;
  topQueries: { text: string; count: number }[];
  checksByDate: { date: string; count: number }[];
}

type Tab = 'trending' | 'history';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('trending');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Trending state
  const [prompts, setPrompts] = useState<TrendingPrompt[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    prompt: '',
    cached_result: '',
  });

  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterError, setFilterError] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [addingToTrending, setAddingToTrending] = useState<string | null>(null);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'trending') {
      fetchPrompts();
    } else {
      fetchHistory();
      if (!stats) fetchStats();
    }
  }, [activeTab, search, filterError]);

  // Lock/unlock body scroll when modal opens/closes
  useEffect(() => {
    if (selectedEntry) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedEntry]);

  // ===== Trending Functions =====
  const fetchPrompts = async () => {
    setTrendingLoading(true);
    try {
      const response = await fetch('/api/trending');
      if (!response.ok) throw new Error('Failed to fetch');
      const { data } = await response.json();
      setPrompts(data);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setTrendingLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cachedResult = JSON.parse(formData.cached_result);
      const response = await fetch('/api/admin/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: formData.prompt,
          cached_result: cachedResult,
        }),
      });

      if (!response.ok) throw new Error('Failed to create');

      setFormData({ prompt: '', cached_result: '' });
      setShowCreateForm(false);
      fetchPrompts();
      showNotification('success', 'Trending prompt created successfully!');
    } catch (error) {
      console.error('Error creating prompt:', error);
      showNotification('error', 'Failed to create prompt. Check console for details.');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const cachedResult = JSON.parse(formData.cached_result);
      const response = await fetch(`/api/admin/trending/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: formData.prompt,
          cached_result: cachedResult,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      setFormData({ prompt: '', cached_result: '' });
      setEditingId(null);
      fetchPrompts();
      showNotification('success', 'Trending prompt updated successfully!');
    } catch (error) {
      console.error('Error updating prompt:', error);
      showNotification('error', 'Failed to update prompt.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      const response = await fetch(`/api/admin/trending/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      fetchPrompts();
      showNotification('success', 'Trending prompt deleted successfully!');
    } catch (error) {
      console.error('Error deleting prompt:', error);
      showNotification('error', 'Failed to delete prompt');
    }
  };

  const startEdit = (prompt: TrendingPrompt) => {
    setEditingId(prompt.id);
    setFormData({
      prompt: prompt.prompt,
      cached_result: JSON.stringify(prompt.cached_result, null, 2),
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ prompt: '', cached_result: '' });
  };

  // ===== History Functions =====
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '100',
        offset: '0',
      });

      if (search) params.append('search', search);
      if (filterError !== 'all') params.append('is_error', filterError);

      const response = await fetch(`/api/admin/history?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const { data } = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/history/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');

      const { data } = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleAddToTrending = async (entryId: string) => {
    if (!confirm('Add this entry to trending prompts?')) return;

    setAddingToTrending(entryId);
    try {
      const response = await fetch(`/api/admin/history/${entryId}/to-trending`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add to trending');
      }

      showNotification('success', 'Successfully added to trending prompts!');
      fetchPrompts(); // Refresh trending list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add to trending';
      showNotification('error', errorMessage);
    } finally {
      setAddingToTrending(null);
    }
  };

  // ===== Utility Functions =====
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), type === 'success' ? 3000 : 5000);
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Notification */}
        {notification && (
          <div
            className={`mb-4 p-4 border rounded ${
              notification.type === 'success'
                ? 'bg-gray-50 text-gray-900 border-gray-900'
                : 'bg-gray-50 text-gray-900 border-gray-300'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('trending')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'trending'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Trending Prompts
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              History
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'trending' ? (
          // ===== TRENDING TAB =====
          <div>
            {trendingLoading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : (
              <>
                {/* Create Button */}
                <div className="mb-6">
                  <button
                    onClick={() => {
                      setShowCreateForm(!showCreateForm);
                      setEditingId(null);
                      setFormData({ prompt: '', cached_result: '' });
                    }}
                    className="bg-gray-900 text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors font-medium"
                  >
                    {showCreateForm ? 'Cancel' : '+ Create New Prompt'}
                  </button>
                </div>

                {/* Create Form */}
                {showCreateForm && (
                  <div className="bg-white border border-gray-200 rounded p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Create New Prompt</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prompt Text
                        </label>
                        <input
                          type="text"
                          value={formData.prompt}
                          onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="Enter the fact-check prompt"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cached Result (JSON)
                        </label>
                        <textarea
                          value={formData.cached_result}
                          onChange={(e) => setFormData({ ...formData, cached_result: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono text-sm"
                          placeholder='{"original_text": "...", "fact_checks": []}'
                          rows={10}
                          required
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="bg-gray-900 text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreateForm(false)}
                          className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Prompts List */}
                <div className="space-y-4">
                  {prompts.map((prompt) => (
                    <div key={prompt.id} className="bg-white border border-gray-200 rounded p-6">
                      {editingId === prompt.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold mb-4">Edit Prompt</h3>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Prompt Text
                            </label>
                            <input
                              type="text"
                              value={formData.prompt}
                              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cached Result (JSON)
                            </label>
                            <textarea
                              value={formData.cached_result}
                              onChange={(e) => setFormData({ ...formData, cached_result: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono text-sm"
                              rows={10}
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleUpdate(prompt.id)}
                              className="bg-gray-900 text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {prompt.prompt}
                              </h3>
                              <div className="text-sm text-gray-500 space-y-1">
                                <p>Upvotes: {prompt.upvote_count}</p>
                                <p>Created: {new Date(prompt.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEdit(prompt)}
                                className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(prompt.id)}
                                className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <details className="text-sm">
                            <summary className="cursor-pointer text-gray-900 hover:text-gray-700">
                              View Cached Result
                            </summary>
                            <pre className="mt-2 p-4 bg-gray-100 rounded overflow-x-auto text-xs">
                              {JSON.stringify(prompt.cached_result, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  ))}

                  {prompts.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No trending prompts yet. Create one to get started!
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          // ===== HISTORY TAB =====
          <div>
            {/* Stats Cards */}
            {!statsLoading && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-gray-200 rounded p-6">
                  <div className="text-sm text-gray-500 mb-1">Total Checks</div>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalChecks}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded p-6">
                  <div className="text-sm text-gray-500 mb-1">Success Rate</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.totalChecks > 0
                      ? Math.round((stats.successCount / stats.totalChecks) * 100)
                      : 0}
                    %
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded p-6">
                  <div className="text-sm text-gray-500 mb-1">Unique Users</div>
                  <div className="text-3xl font-bold text-gray-900">{stats.uniqueSessions}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded p-6">
                  <div className="text-sm text-gray-500 mb-1">Avg Response Time</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {(stats.avgResponseTimeMs / 1000).toFixed(1)}s
                  </div>
                </div>
              </div>
            )}

            {/* Top Queries */}
            {!statsLoading && stats && stats.topQueries.length > 0 && (
              <div className="bg-white border border-gray-200 rounded p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Most Checked Queries</h2>
                <div className="space-y-2">
                  {stats.topQueries.map((query, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <div className="flex-1 text-sm text-gray-700 truncate">{query.text}</div>
                      <div className="text-sm font-semibold text-gray-900 ml-4">{query.count}x</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white border border-gray-200 rounded p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by text..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <select
                  value={filterError}
                  onChange={(e) => setFilterError(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="all">All Results</option>
                  <option value="false">Success Only</option>
                  <option value="true">Errors Only</option>
                </select>
              </div>
            </div>

            {/* History List */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              {historyLoading ? (
                <div className="p-8 text-center text-gray-500">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No history entries found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Text
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Response Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {history.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(entry.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                            {entry.original_text}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {entry.is_error ? (
                              <span className="px-2 py-1 bg-gray-100 text-gray-900 rounded-full text-xs">
                                Error
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-900 rounded-full text-xs">
                                Success
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(entry.response_time_ms / 1000).toFixed(2)}s
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedEntry(entry)}
                                className="text-gray-900 hover:text-gray-700"
                              >
                                View
                              </button>
                              {!entry.is_error && (
                                <button
                                  onClick={() => handleAddToTrending(entry.id)}
                                  disabled={addingToTrending === entry.id}
                                  className="text-gray-900 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {addingToTrending === entry.id ? 'Adding...' : 'Add to Trending'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedEntry && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-md"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="bg-white rounded max-w-4xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Entry Details</h3>
              <div className="flex gap-2">
                {!selectedEntry.is_error && (
                  <button
                    onClick={() => {
                      handleAddToTrending(selectedEntry.id);
                      setSelectedEntry(null);
                    }}
                    disabled={addingToTrending === selectedEntry.id}
                    className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingToTrending === selectedEntry.id ? 'Adding...' : 'Add to Trending'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Original Text</div>
                <div className="p-3 bg-gray-50 rounded text-sm">{selectedEntry.original_text}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
                  <div className="text-sm">
                    {selectedEntry.is_error ? (
                      <span className="text-gray-900">Error</span>
                    ) : (
                      <span className="text-gray-900">Success</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Response Time</div>
                  <div className="text-sm">{(selectedEntry.response_time_ms / 1000).toFixed(2)}s</div>
                </div>
              </div>

              {selectedEntry.is_error && selectedEntry.error_message && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Error Message</div>
                  <div className="p-3 bg-gray-50 text-gray-900 rounded text-sm">
                    {selectedEntry.error_message}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Result</div>
                <pre className="p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedEntry.result, null, 2)}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <div className="font-medium mb-1">Session ID</div>
                  <div className="font-mono">{selectedEntry.session_id || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-medium mb-1">IP Hash</div>
                  <div className="font-mono">{selectedEntry.ip_hash || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
