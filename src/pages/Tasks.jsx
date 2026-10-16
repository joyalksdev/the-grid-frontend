// src/pages/Tasks.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  Clock,
  Plus,
  Trash,
  Funnel,
  User,
  CaretDown,
  Shield,
  CheckSquare,
  Broom,
  CalendarCheck,
  Sparkle
} from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import { taskService } from "../services/taskService";
import { userService } from "../services/userService";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/ui/Loader";
import Sheet, { INPUT_CLASS, PRIMARY_BTN } from "../components/ui/Sheet";
import ConfirmModal from "../components/ui/ConfirmModal";

const PRIORITIES = [
  { value: "all", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" }
];

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

export default function Tasks() {
  const { user } = useAuth();
  const isOwnerOrAdmin = ["admin", "owner"].includes(user?.role?.toLowerCase());

  const [tasks, setTasks] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Section Tab: 'daily' vs 'deep-clean'
  const [activeTab, setActiveTab] = useState("daily");

  // Filters
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "daily",
    priority: "medium",
    assignedTo: ""
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (priorityFilter !== "all") params.priority = priorityFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const data = await taskService.getTasks(params);
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load operational tasks");
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, statusFilter]);

  const fetchStaffMembers = useCallback(async () => {
    if (!isOwnerOrAdmin) return;
    try {
      const data = await userService.getUsers();
      setStaffMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load staff list", error);
    }
  }, [isOwnerOrAdmin]);

  useEffect(() => {
    fetchTasks();
    fetchStaffMembers();
  }, [fetchTasks, fetchStaffMembers]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.assignedTo) delete payload.assignedTo;

      await taskService.createTask(payload);
      toast.success("Task published successfully");
      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "daily",
        priority: "medium",
        assignedTo: ""
      });
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await taskService.updateTaskStatus(task._id, newStatus);
      toast.success(newStatus === "completed" ? "Completed ✓" : "Reopened");
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update task status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    try {
      await taskService.deleteTask(taskToDelete);
      toast.success("Task deleted");
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete task");
    } finally {
      setTaskToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  // Filter tasks based on tab category
  const filteredTasks = tasks.filter((task) => {
    const cat = (task.category || "general").toLowerCase();
    if (activeTab === "daily") {
      return cat === "daily" || cat === "opening" || cat === "closing" || cat === "general" || cat === "cleaning";
    } else {
      return cat === "deep-clean" || cat === "maintenance";
    }
  });

  const completedCount = filteredTasks.filter((t) => t.status === "completed" || t.status === "verified").length;
  const totalCount = filteredTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Helper to check if task is created within the last 24 hours
  const isNewTask = (createdAt) => {
    if (!createdAt) return false;
    const diffHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-28 font-body text-main">
      {/* Apple-Style Minimal Header */}
      <div className="flex flex-col gap-4 border-b border-border-divider/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-main md:text-3xl">
              Operations & Checklists
            </h1>
            <span
              className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                isOwnerOrAdmin
                  ? "border-primary-cyan/40 bg-primary-cyan/10 text-primary-cyan"
                  : "border-border-divider bg-card-panel text-sub"
              }`}
            >
              {isOwnerOrAdmin ? <Shield size={12} weight="fill" /> : <CheckSquare size={12} />}
              {isOwnerOrAdmin ? "Admin Mode" : "Staff Portal"}
            </span>
          </div>
          <p className="text-xs text-sub sm:text-sm">
            Keep the lounge spotless, gear optimized, and daily shifts running seamlessly.
          </p>
        </div>

        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={`flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-cyan px-4 text-xs font-bold text-app-bg transition-colors hover:bg-primary-cyan/90 ${FOCUS}`}
          >
            <Plus size={16} weight="bold" />
            <span>New Task</span>
          </button>
        )}
      </div>

      {/* Segmented Apple-Style Tabs */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-2xl border border-border-divider bg-card-panel p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("daily")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "daily"
                ? "bg-primary-cyan text-app-bg shadow-sm"
                : "text-sub hover:text-main"
            }`}
          >
            <CalendarCheck size={16} weight="bold" />
            <span>Daily Routines</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("deep-clean")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "deep-clean"
                ? "bg-primary-cyan text-app-bg shadow-sm"
                : "text-sub hover:text-main"
            }`}
          >
            <Broom size={16} weight="bold" />
            <span>Deep Clean & Hardware (Weekly)</span>
          </button>
        </div>

        {/* Minimal Progress Ring / Bar */}
        <div className="flex items-center gap-3 rounded-2xl border border-border-divider bg-card-panel px-4 py-2.5 shadow-sm">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-sub">Shift Progress</p>
            <p className="font-mono text-sm font-bold text-main">{completedCount} / {totalCount} Done</p>
          </div>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-app-bg">
            <div
              className="h-full bg-primary-cyan transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border-divider/60 bg-card-panel p-3 text-xs shadow-sm">
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-sub">
          <Funnel size={14} className="text-primary-cyan" /> Filter:
        </span>

        <div className="relative min-w-[130px]">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`h-9 w-full cursor-pointer appearance-none rounded-xl border border-border-divider bg-app-bg px-3 pr-7 text-xs text-main transition-colors focus:border-primary-cyan ${FOCUS}`}
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <CaretDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sub" />
        </div>

        <div className="relative min-w-[130px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`h-9 w-full cursor-pointer appearance-none rounded-xl border border-border-divider bg-app-bg px-3 pr-7 text-xs text-main transition-colors focus:border-primary-cyan ${FOCUS}`}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <CaretDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sub" />
        </div>
      </div>

      {/* Task Cards List */}
      {loading ? (
        <Loader variant="skeleton-table" lines={4} text="Loading checklists..." />
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-3 rounded-3xl border border-dashed border-border-divider bg-card-panel/30 p-16 text-center">
          <div className="grid size-12 place-items-center rounded-2xl border border-border-divider bg-app-bg text-sub">
            <Clock size={24} />
          </div>
          <h3 className="font-heading text-base font-bold text-main">All clear here</h3>
          <p className="max-w-xs text-xs text-sub">
            {activeTab === "daily"
              ? "All daily routine tasks have been checked off for this shift."
              : "No deep cleaning tasks pending right now."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === "completed" || task.status === "verified";
            const fresh = isNewTask(task.createdAt);

            return (
              <div
                key={task._id}
                className={`group relative flex flex-col justify-between gap-4 rounded-2xl border bg-card-panel p-4.5 shadow-sm transition-all sm:flex-row sm:items-center ${
                  isCompleted
                    ? "border-emerald-500/30 bg-emerald-500/[0.01] opacity-75"
                    : "border-border-divider hover:border-border-divider/80"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Apple-Style Tactile Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(task)}
                    aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                    className={`mt-0.5 grid size-7 shrink-0 cursor-pointer place-items-center rounded-lg border transition-all duration-200 ${
                      isCompleted
                        ? "border-emerald-500 bg-emerald-500 text-app-bg shadow-sm scale-105"
                        : "border-border-divider bg-app-bg text-transparent hover:border-primary-cyan hover:bg-primary-cyan/10"
                    }`}
                  >
                    <CheckCircle size={18} weight="bold" className={isCompleted ? "opacity-100" : "opacity-0"} />
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-base font-bold transition-colors ${isCompleted ? "line-through text-sub" : "text-main"}`}>
                        {task.title}
                      </h4>
                      {fresh && (
                        <span className="flex items-center gap-0.5 rounded-full border border-primary-cyan/40 bg-primary-cyan/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary-cyan">
                          <Sparkle size={10} weight="fill" /> NEW
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-sub leading-relaxed">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
                      <span className="rounded-md border border-border-divider bg-app-bg px-2 py-0.5 text-sub uppercase tracking-wider">
                        {task.category}
                      </span>

                      <span
                        className={`rounded-md border px-2 py-0.5 uppercase font-bold tracking-wider ${
                          task.priority === "urgent" || task.priority === "high"
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                            : "border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan"
                        }`}
                      >
                        {task.priority}
                      </span>

                      {task.assignedTo && (
                        <span className="flex items-center gap-1 rounded-md border border-border-divider bg-app-bg px-2 py-0.5 text-main">
                          <User size={12} className="text-primary-cyan" /> {task.assignedTo.name || task.assignedTo.username}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(task)}
                    className={`h-9 cursor-pointer rounded-xl border px-3.5 text-xs font-bold transition-all ${
                      isCompleted
                        ? "border-border-divider bg-app-bg text-sub hover:text-main"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    }`}
                  >
                    {isCompleted ? "Reopen" : "Done ✓"}
                  </button>

                  {isOwnerOrAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setTaskToDelete(task._id);
                        setDeleteModalOpen(true);
                      }}
                      className={`grid size-9 cursor-pointer place-items-center rounded-xl border border-border-divider bg-app-bg text-sub transition-colors hover:border-rose-500/40 hover:text-rose-400 ${FOCUS}`}
                      title="Delete task"
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Task Sheet Modal (Admin Only) */}
      {isOwnerOrAdmin && (
        <Sheet
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create Lounge Task"
          description="Add a daily routine or deep-cleaning schedule for the lounge team."
          footer={
            <button
              type="submit"
              form="create-task-form"
              disabled={isSubmitting}
              className={PRIMARY_BTN}
            >
              {isSubmitting ? "Publishing..." : "Publish Task"}
            </button>
          }
        >
          <form id="create-task-form" onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-main">Task Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Monday Deep Clean: PS5 Vents & Dust TV Panels"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-main">Description / Guidelines</label>
              <textarea
                rows={3}
                placeholder="Step-by-step instructions..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-border-divider bg-app-bg p-3 text-sm text-main focus:outline-none focus:border-primary-cyan"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-main">Category</label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`${INPUT_CLASS} appearance-none pr-8 cursor-pointer`}
                  >
                    <option value="daily">Daily Routine</option>
                    <option value="deep-clean">Deep Clean / Maintenance</option>
                    <option value="opening">Opening Shift</option>
                    <option value="closing">Closing Shift</option>
                  </select>
                  <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sub" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-main">Priority</label>
                <div className="relative">
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className={`${INPUT_CLASS} appearance-none pr-8 cursor-pointer`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sub" />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-main">Assign to Staff Member (Optional)</label>
              <div className="relative">
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className={`${INPUT_CLASS} appearance-none pr-8 cursor-pointer`}
                >
                  <option value="">-- General / All Staff --</option>
                  {staffMembers.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name || staff.username} ({staff.role})
                    </option>
                  ))}
                </select>
                <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sub" />
              </div>
            </div>
          </form>
        </Sheet>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this checklist task?"
        confirmText="Delete"
        danger={true}
      />
    </div>
  );
}