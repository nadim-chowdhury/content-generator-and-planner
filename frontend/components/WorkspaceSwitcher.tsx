"use client";

import { useState, useEffect } from "react";
import { teamsApi, Team } from "@/lib/teams";
import { useAuthStore } from "@/store/auth-store";

interface WorkspaceSwitcherProps {
  onWorkspaceChange?: (workspace: Team | null) => void;
}

export default function WorkspaceSwitcher({
  onWorkspaceChange,
}: WorkspaceSwitcherProps) {
  const { user } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<{
    owned: Team[];
    memberOf: Team[];
  }>({
    owned: [],
    memberOf: [],
  });
  const [currentWorkspace, setCurrentWorkspace] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const [teamsData, current] = await Promise.all([
        teamsApi.getTeams(),
        teamsApi.getCurrentWorkspace(),
      ]);
      setWorkspaces(teamsData);
      setCurrentWorkspace(current);
      if (onWorkspaceChange) {
        onWorkspaceChange(current);
      }
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchWorkspace = async (workspaceId: string | null) => {
    try {
      if (workspaceId) {
        await teamsApi.switchWorkspace(workspaceId);
        const workspace = [...workspaces.owned, ...workspaces.memberOf].find(
          (w) => w.id === workspaceId
        );
        setCurrentWorkspace(workspace || null);
        if (onWorkspaceChange) {
          onWorkspaceChange(workspace || null);
        }
      } else {
        await teamsApi.clearWorkspace();
        setCurrentWorkspace(null);
        if (onWorkspaceChange) {
          onWorkspaceChange(null);
        }
      }
      setShowDropdown(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to switch workspace");
    }
  };

  const allWorkspaces = [
    { id: null, name: "Personal Workspace", type: "personal" },
    ...workspaces.owned.map((w) => ({ ...w, type: "owned" as const })),
    ...workspaces.memberOf.map((w) => ({ ...w, type: "member" as const })),
  ];

  if (loading) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        Loading workspaces...
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <span>
          {currentWorkspace ? currentWorkspace.name : "Personal Workspace"}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${
            showDropdown ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              {allWorkspaces.map((workspace) => (
                <button
                  key={workspace.id || "personal"}
                  onClick={() => handleSwitchWorkspace(workspace.id || null)}
                  className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    currentWorkspace?.id === workspace.id ||
                    (!currentWorkspace && !workspace.id)
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{workspace.name}</span>
                    {workspace.type === "owned" && (
                      <span className="text-xs text-gray-500">Owner</span>
                    )}
                    {workspace.type === "member" && (
                      <span className="text-xs text-gray-500">Member</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
