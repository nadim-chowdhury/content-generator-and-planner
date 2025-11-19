"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { adminApi, User } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleGuard from "@/components/RoleGuard";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [bonusCredits, setBonusCredits] = useState<Record<string, string>>({});
  const [banReason, setBanReason] = useState("");
  const [showBanModal, setShowBanModal] = useState(false);
  const [banningUser, setBanningUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { users: usersData, pagination } = await adminApi.getAllUsers(
        page,
        20
      );
      setUsers(usersData);
      setTotal(pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: "USER" | "ADMIN") => {
    try {
      const updatedUser = await adminApi.updateUserRole(userId, role);
      // Update the user in the list
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, role: updatedUser.role } : u
        )
      );
      setShowEditModal(false);
      setEditingUser(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleUpdatePlan = async (
    userId: string,
    plan: "FREE" | "PRO" | "AGENCY"
  ) => {
    try {
      const updatedUser = await adminApi.updateUserPlan(userId, plan);
      // Update the user in the list
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, plan: updatedUser.plan } : u
        )
      );
      setShowEditModal(false);
      setEditingUser(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update plan");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await adminApi.deleteUser(userId);
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleBanUser = async (userId: string, reason?: string) => {
    try {
      await adminApi.banUser(userId, reason);
      await loadUsers();
      setShowBanModal(false);
      setBanningUser(null);
      setBanReason("");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to ban user");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!confirm("Are you sure you want to unban this user?")) {
      return;
    }

    try {
      await adminApi.unbanUser(userId);
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to unban user");
    }
  };

  const handleResetQuota = async (userId: string) => {
    if (!confirm("Are you sure you want to reset this user's daily quota?")) {
      return;
    }

    try {
      await adminApi.resetUserQuota(userId);
      await loadUsers();
      alert("User quota reset successfully");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reset quota");
    }
  };

  const handleAddBonusCredits = async (userId: string) => {
    const creditsStr = bonusCredits[userId] || "";
    const credits = parseInt(creditsStr, 10);
    if (!credits || credits <= 0) {
      alert("Please enter a valid number of credits");
      return;
    }

    try {
      await adminApi.addBonusCredits(userId, credits);
      await loadUsers();
      setBonusCredits({ ...bonusCredits, [userId]: "" });
      alert(`Added ${credits} bonus credits successfully`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add bonus credits");
    }
  };

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                User Management
              </h1>
              <a
                href="/admin/dashboard"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
              >
                Back to Dashboard
              </a>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Loading users...
                </p>
              </div>
            ) : (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {user.profileImage ? (
                                <img
                                  src={user.profileImage}
                                  alt={user.name || user.email}
                                  className="h-10 w-10 rounded-full"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <span className="text-gray-500 dark:text-gray-400">
                                    {user.name?.charAt(0) ||
                                      user.email.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.name || "No name"}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.plan === "AGENCY"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                  : user.plan === "PRO"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                              }`}
                            >
                              {user.plan}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === "ADMIN"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              {user.emailVerified ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Verified
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  Unverified
                                </span>
                              )}
                              {user.banned && (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  Banned
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingUser(user);
                                    setShowEditModal(true);
                                  }}
                                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                                >
                                  Edit
                                </button>
                                {user.id !== currentUser?.id && (
                                  <>
                                    {user.banned ? (
                                      <button
                                        onClick={() => handleUnbanUser(user.id)}
                                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                                      >
                                        Unban
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setBanningUser(user);
                                          setShowBanModal(true);
                                        }}
                                        className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300"
                                      >
                                        Ban
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleResetQuota(user.id)}
                                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                                    >
                                      Reset Quota
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="number"
                                  placeholder="Bonus credits"
                                  value={bonusCredits[user.id] || ""}
                                  onChange={(e) =>
                                    setBonusCredits({
                                      ...bonusCredits,
                                      [user.id]: e.target.value,
                                    })
                                  }
                                  className="w-24 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-700 dark:text-white"
                                />
                                <button
                                  onClick={() => handleAddBonusCredits(user.id)}
                                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                                >
                                  Add Credits
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {(page - 1) * 20 + 1} to{" "}
                    {Math.min(page * 20, total)} of {total} users
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * 20 >= total}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Edit Modal */}
            {showEditModal && editingUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Edit User: {editingUser.email}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Role
                      </label>
                      <select
                        value={editingUser.role}
                        onChange={(e) =>
                          handleUpdateRole(
                            editingUser.id,
                            e.target.value as "USER" | "ADMIN"
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Plan
                      </label>
                      <select
                        value={editingUser.plan}
                        onChange={(e) =>
                          handleUpdatePlan(
                            editingUser.id,
                            e.target.value as "FREE" | "PRO" | "AGENCY"
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="FREE">FREE</option>
                        <option value="PRO">PRO</option>
                        <option value="AGENCY">AGENCY</option>
                      </select>
                    </div>
                    {editingUser.dailyAiGenerations !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Usage Info
                        </label>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>
                            Daily Generations: {editingUser.dailyAiGenerations}
                          </p>
                          <p>Bonus Credits: {editingUser.bonusCredits || 0}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingUser(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Ban Modal */}
            {showBanModal && banningUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Ban User: {banningUser.email}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Reason (optional)
                      </label>
                      <textarea
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder="Enter reason for banning..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowBanModal(false);
                        setBanningUser(null);
                        setBanReason("");
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        handleBanUser(banningUser.id, banReason || undefined)
                      }
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                      Ban User
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
