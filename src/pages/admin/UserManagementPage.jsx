// src/pages/settings/UserManagementPage.jsx
import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  ShieldCheck, 
  Trash, 
  PencilSimple, 
  X,
  CircleNotch,
  Check,
  MagnifyingGlass,
  UserGear,
  KeyReturn
} from "@phosphor-icons/react";
import { userService } from "../../services/userService";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
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
      setError(err.response?.data?.message || "Failed to load user accounts");
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
      password: "", 
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
      // FIX: Clone formData and remove password if it's empty during an edit
      const payload = { ...formData };
      if (editingUser && !payload.password) {
        delete payload.password;
      }

      if (editingUser) {
        // Send the cleaned payload
        await userService.updateUser(editingUser._id, payload);
        setActionSuccess(`Updated ${payload.name} successfully`);
      } else {
        // For new users, send payload as is (password is required here)
        await userService.createUser(payload);
        setActionSuccess(`Created staff account for ${payload.name}`);
      }
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save account details");
    } finally {
      setSubmitting(false);
    }
  };
  
  
  const handleToggleStatus = async (user) => {
    try {
      setError("");
      await userService.toggleUserStatus(user._id);
      setActionSuccess(`Status updated for ${user.name}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}'s account? This action cannot be undone.`)) return;

    try {
      setError("");
      await userService.deleteUser(id);
      setActionSuccess(`Account for ${name} removed`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans text-main">
      
      {/* Top Header Card - iOS Blur Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card-panel/70 backdrop-blur-xl border border-border-divider/50 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary-cyan/15 flex items-center justify-center text-primary-cyan border border-primary-cyan/20">
            <UserGear size={22} weight="duotone" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-main">
              Staff & Operators
            </h1>
            <p className="text-xs text-sub">
              Manage team accounts, access roles, and system permissions.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-cyan text-app-bg font-medium text-xs rounded-xl shadow-sm hover:opacity-95 transition-all cursor-pointer active:scale-98"
        >
          <Plus size={16} weight="bold" />
          <span>Add Staff Account</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center justify-between backdrop-blur-md">
          <span>{error}</span>
          <button onClick={() => setError("")} className="hover:opacity-75 transition-opacity">
            <X size={15} />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Check size={16} weight="bold" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")} className="hover:opacity-75 transition-opacity">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Search and Table Area */}
      <div className="rounded-2xl bg-card-panel/60 backdrop-blur-xl border border-border-divider/50 overflow-hidden shadow-sm">
        
        {/* Search Bar */}
        <div className="p-4 border-b border-border-divider/40 flex items-center gap-3">
          <MagnifyingGlass size={18} className="text-sub" />
          <input
            type="text"
            placeholder="Search staff by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-main placeholder:text-sub focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-sub text-xs">
            <CircleNotch size={24} className="animate-spin text-primary-cyan" />
            <span>Syncing accounts...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-xs text-sub">
            {searchQuery ? "No matching staff accounts found." : "No accounts created yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-divider/40 text-[11px] font-medium text-sub bg-app-bg/30">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-divider/30 text-sub">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-app-bg/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-border-divider/40 text-main flex items-center justify-center font-semibold text-xs border border-border-divider/50 overflow-hidden">
                          {user.photoUrl ? (
                            <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-main">{user.name}</div>
                          {user.email && (
                            <div className="text-[10px] text-sub">{user.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-primary-cyan">
                      @{user.username}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide ${
                        user.role === 'admin' 
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20' 
                          : 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                      }`}>
                        <ShieldCheck size={12} weight="fill" />
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {/* iOS Style Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          user.isActive ? 'bg-emerald-500' : 'bg-gray-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            user.isActive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-1.5 hover:bg-app-bg rounded-lg text-sub hover:text-main transition-colors"
                          title="Edit User"
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.name)}
                          className="p-1.5 hover:bg-app-bg rounded-lg text-sub hover:text-red-400 transition-colors"
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

      {/* iOS Modal View */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all">
          <div className="bg-card-panel/95 backdrop-blur-2xl border border-border-divider/60 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-5 py-4 border-b border-border-divider/40 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-main tracking-tight">
                {editingUser ? "Edit Staff Account" : "New Staff Account"}
              </h3>
              <button
                onClick={resetForm}
                className="w-7 h-7 rounded-full bg-app-bg/50 hover:bg-app-bg flex items-center justify-center text-sub hover:text-main transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-sub mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-app-bg/60 border border-border-divider/50 rounded-xl px-3.5 py-2 text-xs text-main focus:outline-none focus:border-primary-cyan/70 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-sub mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingUser)}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="johndoe"
                    className="w-full bg-app-bg/60 border border-border-divider/50 rounded-xl px-3.5 py-2 text-xs text-main focus:outline-none focus:border-primary-cyan/70 transition-colors disabled:opacity-40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-sub mb-1.5">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-app-bg/60 border border-border-divider/50 rounded-xl px-3.5 py-2 text-xs text-main focus:outline-none focus:border-primary-cyan/70 transition-colors"
                  >
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-sub mb-1.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@gridarena.in"
                  className="w-full bg-app-bg/60 border border-border-divider/50 rounded-xl px-3.5 py-2 text-xs text-main focus:outline-none focus:border-primary-cyan/70 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-sub mb-1.5">
                  {editingUser ? "New Password (Optional)" : "Password"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-app-bg/60 border border-border-divider/50 rounded-xl px-3.5 py-2 text-xs text-main focus:outline-none focus:border-primary-cyan/70 transition-colors"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border-divider/40">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-app-bg/50 hover:bg-app-bg text-sub text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-cyan text-app-bg font-medium text-xs rounded-xl shadow-sm hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting && <CircleNotch size={14} className="animate-spin" />}
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