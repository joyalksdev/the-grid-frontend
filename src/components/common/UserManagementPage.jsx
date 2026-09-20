// client/src/pages/settings/UserManagementSettings.jsx
import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash, 
  CheckCircle, 
  XCircle, 
  Key, 
  PencilSimple, 
  FloppyDisk, 
  X,
  CircleNotch
} from "@phosphor-icons/react";
import { userService } from "../../services/userService";

export default function UserManagementSettings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "operator",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setFormData({ name: "", username: "", email: "", password: "", role: "operator" });
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      password: "", // Leave blank unless changing
      role: user.role || "operator",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setActionSuccess("");

    try {
      if (editingUser) {
        await userService.updateUser(editingUser._id, formData);
        setActionSuccess(`User ${formData.name} updated successfully.`);
      } else {
        await userService.createUser(formData);
        setActionSuccess(`Staff member ${formData.name} created successfully.`);
      }
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      setError("");
      await userService.toggleUserStatus(user._id);
      setActionSuccess(`Status changed for ${user.name}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      setError("");
      await userService.deleteUser(id);
      setActionSuccess(`User ${name} deleted successfully`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card-panel border border-border-divider p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-cyan/10 border border-primary-cyan/30 rounded-lg text-primary-cyan">
            <Users size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-main uppercase tracking-wide">
              Staff & User Accounts
            </h2>
            <p className="text-xs text-sub font-body">
              Manage operators, credentials, and active permissions.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-cyan hover:bg-primary-cyan/90 text-app-bg font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
        >
          <UserPlus size={16} weight="bold" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="hover:text-red-200">
            <X size={14} />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-lg flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess("")} className="hover:text-green-200">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-card-panel border border-border-divider rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center gap-2 text-sub text-xs">
            <CircleNotch size={18} className="animate-spin text-primary-cyan" />
            <span>Loading user accounts...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs text-sub">
            No staff accounts found. Click "Add Staff Member" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-divider bg-app-bg/50 text-muted uppercase text-[10px] tracking-wider">
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Username</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-divider/60 text-sub">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-app-bg/30 transition-colors">
                    <td className="p-3.5 font-bold text-main">
                      {user.name}
                      {user.email && (
                        <span className="block text-[10px] text-muted font-normal normal-case">
                          {user.email}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-primary-cyan">@{user.username}</td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        user.role === 'admin' 
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' 
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}>
                        <Shield size={12} />
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                          user.isActive
                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        {user.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {user.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-1.5 hover:bg-app-bg rounded text-sub hover:text-primary-cyan transition-colors"
                          title="Edit User"
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.name)}
                          className="p-1.5 hover:bg-app-bg rounded text-sub hover:text-red-400 transition-colors"
                          title="Delete User"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Create / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-card-panel border border-border-divider rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border-divider flex items-center justify-between">
              <h3 className="text-sm font-bold text-main uppercase tracking-wider flex items-center gap-2">
                <Key size={16} className="text-primary-cyan" />
                {editingUser ? "Edit User Account" : "Create New Staff Account"}
              </h3>
              <button
                onClick={resetForm}
                className="text-sub hover:text-main p-1 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] uppercase text-muted mb-1 font-bold">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex Mercer"
                  className="w-full bg-app-bg border border-border-divider rounded-lg px-3 py-2 text-xs text-main focus:outline-none focus:border-primary-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-muted mb-1 font-bold">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingUser)}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="alex_m"
                    className="w-full bg-app-bg border border-border-divider rounded-lg px-3 py-2 text-xs text-main focus:outline-none focus:border-primary-cyan disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-muted mb-1 font-bold">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-app-bg border border-border-divider rounded-lg px-3 py-2 text-xs text-main focus:outline-none focus:border-primary-cyan"
                  >
                    <option value="operator font-mono">Operator</option>
                    <option value="admin font-mono">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-muted mb-1 font-bold">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex@gridgaming.in"
                  className="w-full bg-app-bg border border-border-divider rounded-lg px-3 py-2 text-xs text-main focus:outline-none focus:border-primary-cyan"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-muted mb-1 font-bold">
                  {editingUser ? "New Password (Leave blank to keep current)" : "Password"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-app-bg border border-border-divider rounded-lg px-3 py-2 text-xs text-main focus:outline-none focus:border-primary-cyan"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border-divider">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 bg-app-bg hover:bg-card-panel border border-border-divider text-sub text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-cyan hover:bg-primary-cyan/90 text-app-bg font-bold text-xs uppercase rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <CircleNotch size={14} className="animate-spin" />
                  ) : (
                    <FloppyDisk size={14} />
                  )}
                  <span>{editingUser ? "Save Changes" : "Create Account"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}