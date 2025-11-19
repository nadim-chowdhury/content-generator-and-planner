"use client";

import { useState, useEffect } from "react";
import { ideasApi } from "@/lib/ideas";

interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

interface FolderManagerProps {
  onFolderSelect?: (folderId: string | null) => void;
  selectedFolderId?: string | null;
  onFolderCreated?: () => void;
}

export default function FolderManager({
  onFolderSelect,
  selectedFolderId,
  onFolderCreated,
}: FolderManagerProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    icon: "📁",
  });

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const data = await ideasApi.getFolders();
      setFolders(data);
    } catch (err) {
      console.error("Failed to load folders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ideasApi.createFolder(formData);
      setShowCreateModal(false);
      setFormData({ name: "", description: "", color: "#3B82F6", icon: "📁" });
      await loadFolders();
      onFolderCreated?.();
    } catch (err) {
      alert("Failed to create folder");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder) return;
    try {
      await ideasApi.updateFolder(editingFolder.id, formData);
      setEditingFolder(null);
      setFormData({ name: "", description: "", color: "#3B82F6", icon: "📁" });
      await loadFolders();
    } catch (err) {
      alert("Failed to update folder");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this folder? Ideas will be moved to root."
      )
    )
      return;
    try {
      await ideasApi.deleteFolder(id);
      await loadFolders();
      if (selectedFolderId === id) {
        onFolderSelect?.(null);
      }
    } catch (err) {
      alert("Failed to delete folder");
    }
  };

  const openEditModal = (folder: Folder) => {
    setEditingFolder(folder);
    setFormData({
      name: folder.name,
      description: folder.description || "",
      color: folder.color || "#3B82F6",
      icon: folder.icon || "📁",
    });
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Loading folders...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Folders
        </h3>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setEditingFolder(null);
            setFormData({
              name: "",
              description: "",
              color: "#3B82F6",
              icon: "📁",
            });
          }}
          className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
        >
          + New
        </button>
      </div>

      <div className="space-y-1">
        <button
          onClick={() => onFolderSelect?.(null)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            selectedFolderId === null
              ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
              : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
        >
          📂 All Ideas
        </button>
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
              selectedFolderId === folder.id
                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            <button
              onClick={() => onFolderSelect?.(folder.id)}
              className="flex-1 text-left flex items-center gap-2"
            >
              <span>{folder.icon || "📁"}</span>
              <span>{folder.name}</span>
            </button>
            <div className="flex gap-1">
              <button
                onClick={() => openEditModal(folder)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(folder.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingFolder) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingFolder ? "Edit Folder" : "Create Folder"}
            </h3>
            <form
              onSubmit={editingFolder ? handleUpdate : handleCreate}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-full h-10 border border-gray-300 dark:border-gray-700 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    placeholder="📁"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    maxLength={2}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
                >
                  {editingFolder ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingFolder(null);
                    setFormData({
                      name: "",
                      description: "",
                      color: "#3B82F6",
                      icon: "📁",
                    });
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
