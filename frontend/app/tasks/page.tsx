'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { tasksApi, Task, TaskStatus, CreateTaskDto } from '@/lib/tasks';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import PlatformBadge from '@/components/PlatformBadge';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [deadlineFrom, setDeadlineFrom] = useState<string>('');
  const [deadlineTo, setDeadlineTo] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<CreateTaskDto>({
    title: '',
    description: '',
    platform: '',
    deadline: '',
    attachments: [],
    tags: [],
    viralScore: undefined,
    notes: '',
  });

  useEffect(() => {
    loadTasks();
  }, [statusFilter, platformFilter, searchQuery, tagFilter, deadlineFrom, deadlineTo]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getAll(
        statusFilter || undefined,
        platformFilter || undefined,
        tagFilter.length > 0 ? tagFilter.join(',') : undefined,
        searchQuery || undefined,
        deadlineFrom || undefined,
        deadlineTo || undefined,
      );
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await tasksApi.create(formData);
      setShowCreateModal(false);
      resetForm();
      await loadTasks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdate = async () => {
    if (!editingTask) return;
    try {
      await tasksApi.update(editingTask.id, formData);
      setEditingTask(null);
      resetForm();
      await loadTasks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await tasksApi.delete(id);
      await loadTasks();
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedTasks.size} task(s)?`)) return;
    try {
      await tasksApi.bulkDelete(Array.from(selectedTasks));
      setSelectedTasks(new Set());
      setBulkMode(false);
      await loadTasks();
    } catch (err) {
      alert('Failed to delete tasks');
    }
  };

  const handleBulkStatusUpdate = async (status: TaskStatus) => {
    if (selectedTasks.size === 0) return;
    try {
      await tasksApi.bulkUpdateStatus(Array.from(selectedTasks), status);
      setSelectedTasks(new Set());
      setBulkMode(false);
      await loadTasks();
    } catch (err) {
      alert('Failed to update tasks');
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await tasksApi.update(taskId, { status });
      await loadTasks();
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      platform: '',
      deadline: '',
      attachments: [],
      tags: [],
      viralScore: undefined,
      notes: '',
    });
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      platform: task.platform || '',
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
      attachments: task.attachments || [],
      tags: task.tags || [],
      viralScore: task.viralScore,
      notes: task.notes || '',
    });
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date() && !tasks.find(t => t.id === deadline)?.completedAt;
  };

  const allTags = Array.from(new Set(tasks.flatMap(t => t.tags || [])));

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Tasks</h1>
            <div className="flex gap-2">
              {bulkMode && selectedTasks.size > 0 && (
                <>
                  <button
                    onClick={() => handleBulkStatusUpdate('COMPLETED')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Mark Complete ({selectedTasks.size})
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete ({selectedTasks.size})
                  </button>
                </>
              )}
              <button
                onClick={() => setBulkMode(!bulkMode)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {bulkMode ? 'Cancel Selection' : 'Bulk Select'}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setEditingTask(null);
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                + Create Task
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <input
                type="text"
                placeholder="Platform filter..."
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  placeholder="Deadline from"
                  value={deadlineFrom}
                  onChange={(e) => setDeadlineFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="date"
                  placeholder="Deadline to"
                  value={deadlineTo}
                  onChange={(e) => setDeadlineTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            {allTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (tagFilter.includes(tag)) {
                        setTagFilter(tagFilter.filter(t => t !== tag));
                      } else {
                        setTagFilter([...tagFilter, tag]);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      tagFilter.includes(tag)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tasks List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600 dark:text-gray-400">Loading tasks...</div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-600 dark:text-gray-400">No tasks found</div>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${
                    bulkMode ? 'cursor-pointer' : ''
                  } ${selectedTasks.has(task.id) ? 'ring-2 ring-indigo-500' : ''} ${
                    isOverdue(task.deadline) ? 'border-l-4 border-red-500' : ''
                  }`}
                  onClick={() => bulkMode && toggleTaskSelection(task.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {bulkMode && (
                          <input
                            type="checkbox"
                            checked={selectedTasks.has(task.id)}
                            onChange={() => toggleTaskSelection(task.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded"
                          />
                        )}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {task.title}
                        </h3>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-sm px-2 py-1 rounded ${getStatusColor(task.status)}`}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                      {task.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 flex-wrap">
                        {task.platform && (
                          <PlatformBadge platform={task.platform} size="sm" />
                        )}
                        {task.deadline && (
                          <span className={`text-sm ${isOverdue(task.deadline) ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                            Deadline: {new Date(task.deadline).toLocaleDateString()}
                            {isOverdue(task.deadline) && ' (Overdue)'}
                          </span>
                        )}
                        {task.viralScore !== undefined && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Viral Score: {task.viralScore}/100
                          </span>
                        )}
                        {task.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {task.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {task.attachments.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Attachments: </span>
                          {task.attachments.map((attachment, idx) => (
                            <a
                              key={idx}
                              href={attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline ml-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Attachment {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                      {task.notes && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{task.notes}</p>
                        </div>
                      )}
                    </div>
                    {!bulkMode && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => openEditModal(task)}
                          className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create/Edit Modal */}
          {(showCreateModal || editingTask) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {editingTask ? 'Edit Task' : 'Create Task'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Platform
                      </label>
                      <input
                        type="text"
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Deadline
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Viral Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.viralScore || ''}
                      onChange={(e) => setFormData({ ...formData, viralScore: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags?.join(', ') || ''}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Attachments (one URL per line)
                    </label>
                    <textarea
                      value={formData.attachments?.join('\n') || ''}
                      onChange={(e) => setFormData({ ...formData, attachments: e.target.value.split('\n').filter(url => url.trim()) })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="https://example.com/file1.pdf&#10;https://example.com/file2.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingTask(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingTask ? handleUpdate : handleCreate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {editingTask ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}



