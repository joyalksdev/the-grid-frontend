// src/pages/settings/UserManagementPage.jsx
import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserGear,
  Plus,
  ShieldCheck,
  Trash,
  PencilSimple,
  MagnifyingGlass,
  DotsThreeVertical,
  Eye,
  EyeSlash,
  X,
  Funnel,
  CaretDown,
  Check,
} from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import { userService } from "../../services/userService";
import Sheet, { INPUT_CLASS, PRIMARY_BTN, FOCUS } from "../../components/ui/Sheet";
import Dropdown from "../../components/ui/Dropdown";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Loader from "../../components/ui/Loader";
import Tooltip from "../../components/ui/Tooltip";

const ROLE_FILTERS = [
  { value: "all", label: "All Roles" },
  { value: "admin", label: "Admins" },
  { value: "operator", label: "Operators" },
];

const EMPTY_FORM = { name: "", username: "", email: "", password: "", role: "operator" };

const listItemMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6, transition: { duration: 0.12 } },
};

function Avatar({ photoUrl, name }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-border-divider bg-app-bg">
      {photoUrl ? (
        <img src={photoUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="font-mono text-xs font-bold text-primary-cyan">
          {(name?.trim()?.[0] || "?").toUpperCase()}
        </span>
      )}
    </span>
  );
}

function RoleBadge({ role }) {
  const isAdminRole = role === "admin";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
        isAdminRole
          ? "border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan"
          : "border-border-divider bg-app-bg text-sub"
      }`}
    >
      <ShieldCheck size={11} weight="fill" aria-hidden="true" />
      {role}
    </span>
  );
}

// iOS-weight spring toggle — same on/off positions as the rest of the app,
// just physically animated instead of a CSS transition.
function StatusToggle({ checked, onChange, label }) {
  return (
    <Tooltip content={checked ? "Tap to deactivate" : "Tap to activate"} position="top">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 touch-manipulation ${FOCUS} ${
          checked ? "border-primary-cyan bg-primary-cyan" : "border-border-divider bg-app-bg"
        }`}
      >
        <motion.span
          aria-hidden="true"
          className="inline-block size-4 rounded-full bg-main shadow"
          animate={{ x: checked ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        />
      </button>
    </Tooltip>
  );
}

function UserFormSheet({ isOpen, onClose, editingUser, onSaved }) {
  const nameId = useId();
  const usernameId = useId();
  const roleId = useId();
  const emailId = useId();
  const passwordId = useId();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(
      editingUser
        ? {
            name: editingUser.name || "",
            username: editingUser.username || "",
            email: editingUser.email || "",
            password: "",
            role: editingUser.role || "operator",
          }
        : EMPTY_FORM
    );
    setShowPassword(false);
  }, [isOpen, editingUser]);

  const set = (key) => (e) => setFormData((f) => ({ ...f, [key]: e.target.value }));

  // Same request shape as before: password is stripped on edit when left blank.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = { ...formData };
      if (editingUser && !payload.password) delete payload.password;

      if (editingUser) {
        await userService.updateUser(editingUser._id, payload);
        toast.success(`Updated ${payload.name} successfully`);
      } else {
        await userService.createUser(payload);
        toast.success(`Created staff account for ${payload.name}`);
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save account details");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={editingUser ? "Edit Staff Account" : "New Staff Account"}
      footer={
        <button type="submit" form="user-form" disabled={submitting} className={PRIMARY_BTN}>
          {submitting ? "Saving…" : editingUser ? "Save Changes" : "Create Account"}
        </button>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor={nameId} className="mb-1.5 block text-sm font-medium text-main">
            Full Name
          </label>
          <input
            id={nameId}
            type="text"
            required
            autoComplete="name"
            value={formData.name}
            onChange={set("name")}
            placeholder="e.g., John Doe"
            className={INPUT_CLASS}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={usernameId} className="mb-1.5 block text-sm font-medium text-main">
              Username
            </label>
            <input
              id={usernameId}
              type="text"
              required
              disabled={Boolean(editingUser)}
              autoComplete="off"
              autoCapitalize="none"
              value={formData.username}
              onChange={set("username")}
              placeholder="johndoe"
              className={`${INPUT_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
            />
          </div>

          <div>
            <label htmlFor={roleId} className="mb-1.5 block text-sm font-medium text-main">
              Role
            </label>
            <select id={roleId} value={formData.role} onChange={set("role")} className={`${INPUT_CLASS} cursor-pointer`}>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium text-main">
            Email Address <span className="font-normal text-sub">(optional)</span>
          </label>
          <input
            id={emailId}
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={set("email")}
            placeholder="john@thegrid.lounge"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor={passwordId} className="mb-1.5 block text-sm font-medium text-main">
            {editingUser ? (
              <>
                New Password <span className="font-normal text-sub">(leave blank to keep current)</span>
              </>
            ) : (
              "Password"
            )}
          </label>
          <div className="relative">
            <input
              id={passwordId}
              type={showPassword ? "text" : "password"}
              required={!editingUser}
              autoComplete="new-password"
              value={formData.password}
              onChange={set("password")}
              placeholder="••••••••"
              className={`${INPUT_CLASS} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className={`absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-sub transition-colors duration-150 hover:text-main motion-reduce:transition-none touch-manipulation ${FOCUS}`}
            >
              {showPassword ? <EyeSlash size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </form>
    </Sheet>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // --- Data + handlers: unchanged logic from the original page ---

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load user accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };
  const openEdit = (user) => {
    setEditingUser(user);
    setFormOpen(true);
  };
  const handleSaved = () => {
    setFormOpen(false);
    setEditingUser(null);
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    try {
      await userService.toggleUserStatus(user._id);
      toast.success(`Status updated for ${user.name}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await userService.deleteUser(deleteTarget._id);
      toast.success(`Account for ${deleteTarget.name} removed`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleteTarget(null);
    }
  };

  // Same match fields as before (name/username/email); role is an additional filter.
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeRoleLabel = ROLE_FILTERS.find((r) => r.value === roleFilter)?.label;
  const roleFilterItems = ROLE_FILTERS.map((r) => ({
    label: r.label,
    icon: roleFilter === r.value ? <Check size={14} weight="bold" /> : null,
    onClick: () => setRoleFilter(r.value),
  }));

  const rowActions = (user) => [
    { label: "Edit Account", icon: <PencilSimple size={15} />, onClick: () => openEdit(user) },
    { type: "divider" },
    { label: "Delete Account", icon: <Trash size={15} />, danger: true, onClick: () => setDeleteTarget(user) },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24 font-body text-main">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col gap-4 border-b border-border-divider pb-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary-cyan/20 bg-primary-cyan/10 text-primary-cyan">
            <UserGear size={22} weight="duotone" aria-hidden="true" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-main md:text-3xl">
                Accounts &amp; Users
              </h1>
              <span className="rounded-md border border-border-divider bg-app-bg px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-sub">
                {users.length}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-sub sm:text-sm">
              Manage team accounts, access roles, and login credentials.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className={`flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-cyan px-4 text-sm font-semibold text-app-bg transition-colors duration-150 hover:bg-primary-cyan/90 motion-reduce:transition-none touch-manipulation ${FOCUS} focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg`}
        >
          <Plus size={16} weight="bold" aria-hidden="true" />
          Add Account
        </button>
      </motion.div>

      {/* Search + role filter, one convenient row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
        className="flex items-center gap-2.5"
      >
        <div className="relative flex-1">
          <MagnifyingGlass
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sub"
          />
          <input
            type="search"
            placeholder="Search by name, username, or email…"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`h-11 w-full rounded-xl border border-border-divider bg-card-panel pl-10 pr-9 text-base text-main placeholder:text-sub/60 transition-colors duration-150 motion-reduce:transition-none focus:outline-none focus:border-primary-cyan sm:text-sm ${FOCUS}`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className={`absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-sub transition-colors duration-150 hover:text-main motion-reduce:transition-none touch-manipulation ${FOCUS}`}
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        <Dropdown
          align="right"
          trigger={
            <button
              type="button"
              className={`flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors duration-150 motion-reduce:transition-none touch-manipulation ${FOCUS} ${
                roleFilter === "all"
                  ? "border-border-divider bg-card-panel text-sub hover:text-main"
                  : "border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan"
              }`}
            >
              <Funnel size={14} aria-hidden="true" />
              <span className="hidden sm:inline">{activeRoleLabel}</span>
              <CaretDown size={12} aria-hidden="true" />
            </button>
          }
          items={roleFilterItems}
        />
      </motion.div>

      {/* Content */}
      {loading ? (
        <Loader variant="skeleton-table" lines={4} />
      ) : filteredUsers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center space-y-3 rounded-xl border border-dashed border-border-divider bg-card-panel/40 p-8 text-center md:p-14"
        >
          <div className="grid size-12 place-items-center rounded-xl border border-border-divider bg-app-bg text-sub">
            <UserGear size={22} aria-hidden="true" />
          </div>
          <h3 className="font-heading text-base font-bold text-main">No accounts found</h3>
          <p className="max-w-xs text-xs text-sub">
            {searchQuery || roleFilter !== "all"
              ? "No staff accounts match this search or role."
              : "Add your first staff account to get started."}
          </p>
        </motion.div>
      ) : (
        <>
          {/* Mobile list */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            <AnimatePresence initial={false} mode="popLayout">
              {filteredUsers.map((user, i) => (
                <motion.div
                  key={user._id}
                  layout
                  {...listItemMotion}
                  transition={{ duration: 0.18, delay: i * 0.02, ease: "easeOut" }}
                  className="space-y-3 rounded-xl border border-border-divider bg-card-panel p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar photoUrl={user.photoUrl} name={user.name} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-main">{user.name}</p>
                        <p className="truncate font-mono text-xs text-primary-cyan">@{user.username}</p>
                      </div>
                    </div>

                    <Dropdown
                      align="right"
                      trigger={
                        <button
                          type="button"
                          aria-label="Account options"
                          className={`grid size-8 cursor-pointer place-items-center rounded-lg text-sub transition-colors duration-150 hover:bg-app-bg hover:text-main motion-reduce:transition-none touch-manipulation ${FOCUS}`}
                        >
                          <DotsThreeVertical size={18} weight="bold" aria-hidden="true" />
                        </button>
                      }
                      items={rowActions(user)}
                    />
                  </div>

                  {user.email && <p className="truncate text-xs text-sub">{user.email}</p>}

                  <div className="flex items-center justify-between rounded-lg border border-border-divider/60 bg-app-bg/60 px-3 py-2">
                    <RoleBadge role={user.role} />
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-sub">{user.isActive ? "Active" : "Inactive"}</span>
                      <StatusToggle
                        checked={user.isActive}
                        onChange={() => handleToggleStatus(user)}
                        label={`${user.name} account active`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-border-divider bg-card-panel md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-divider bg-app-bg/70 font-mono text-[11px] uppercase tracking-wider text-sub">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Username</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-divider">
                <AnimatePresence initial={false} mode="popLayout">
                  {filteredUsers.map((user, i) => (
                    <motion.tr
                      key={user._id}
                      layout
                      {...listItemMotion}
                      transition={{ duration: 0.16, delay: i * 0.015, ease: "easeOut" }}
                      className="transition-colors duration-150 hover:bg-app-bg/40 motion-reduce:transition-none"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar photoUrl={user.photoUrl} name={user.name} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-main">{user.name}</p>
                            {user.email && <p className="truncate text-xs text-sub">{user.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-primary-cyan">@{user.username}</td>
                      <td className="px-5 py-3.5">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusToggle
                          checked={user.isActive}
                          onChange={() => handleToggleStatus(user)}
                          label={`${user.name} account active`}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Dropdown
                          align="right"
                          trigger={
                            <button
                              type="button"
                              aria-label="Account options"
                              className={`grid size-8 cursor-pointer place-items-center rounded-lg text-sub transition-colors duration-150 hover:bg-app-bg hover:text-main motion-reduce:transition-none ${FOCUS}`}
                            >
                              <DotsThreeVertical size={18} weight="bold" aria-hidden="true" />
                            </button>
                          }
                          items={rowActions(user)}
                        />
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </>
      )}

      <UserFormSheet
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingUser(null);
        }}
        editingUser={editingUser}
        onSaved={handleSaved}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Staff Account"
        message={`Delete ${deleteTarget?.name || "this user"}'s account? This action cannot be undone.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}