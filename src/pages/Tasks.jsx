// src/pages/Tasks.jsx
import React, { useState, useEffect, useCallback, useId } from "react";
import {
  CheckCircle,
  Clock,
  Plus,
  Trash,
  Funnel,
  User,
  Sparkle,
  Calendar,
  Lightning,
  CaretDown
} from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import { taskService } from "../services/taskService";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/ui/Loader";
import Sheet, { INPUT_CLASS, PRIMARY_BTN } from "../components/ui/Sheet";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "opening", label: "Opening Shift" },
  { value: "closing", label: "Closing Shift" },
  { value: "maintenance", label: "Maintenance" },
  { value: "cleaning", label: "Sanitation" },
  { value: "general", label: "General" }
];

const PRIORITIES = [
  { value: "all", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" }
];

export default function Tasks() {
  const { user, isAdmin } = useAuth();
  const titleId = useId();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "medium",
    dueDate: "",
    notes: ""
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await taskService.getTasks({
        category: categoryFilter,
        priority: priorityFilter,
        status: statusFilter
      });
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to load staff tasks");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, priorityFilter, statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await taskService.createTask(formData);
      toast.success("Task assigned successfully!");
      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "general",
        priority: "medium",
        dueDate: "",
        notes: ""
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
      toast.success(newStatus === "completed" ? "Task marked complete!" : "Task set back to pending");
      fetchTasks();
    } catch (error) {
      toast.error("Failed to update task status");
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await taskService.deleteTask(id);
      toast.success("Task deleted");
      fetchTasks();
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20 font-body text-main">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-border-divider pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-main md:text-3xl">
              Staff Operations Tasks
            </h1>
            <span className="flex items-center gap-1 rounded-full border border-primary-cyan/30 bg-primary-cyan/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary-cyan">
              <Sparkle size={12} weight="fill" /> Daily Ops
            </span>
          </div>
          <p className="mt-1 text-xs text-sub sm:text-sm">
            Track daily lounge duties, opening/closing checklists, and maintenance tasks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-cyan px-4 text-xs font-bold text-app-bg transition-colors hover:bg-primary-cyan/90"
        >
          <Plus size={16} weight="bold" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border-divider/70 bg-card-panel p-3.5 text-xs shadow-sm">
        <span className="flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-sub">
          <Funnel size={14} className="text-primary-cyan" /> Filters:
        </span>

        {/* Category Filter */}
        <div className="relative min-w-[130px]">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 w-full cursor-pointer appearance-none rounded-xl border border-border-divider bg-app-bg px-3 text-xs text-main focus:outline-none focus:border-primary-cyan"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <CaretDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sub" />
        </div>

        {/* Priority Filter */}
        <div className="relative min-w-[120px]">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 w-full cursor-pointer appearance-none rounded-xl border border-border-divider bg-app-bg px-3 text-xs text-main focus:outline-none focus:border-primary-cyan"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <CaretDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sub" />
        </div>

        {/* Status Filter */}
        <div className="relative min-w-[120px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 w-full cursor-pointer appearance-none rounded-xl border border-border-divider bg-app-bg px-3 text-xs text-main focus:outline-none focus:border-primary-cyan"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <CaretDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sub" />
        </div>
      </div>

      {/* Task List Content */}
      {loading ? (
        <Loader variant="skeleton-table" lines={4} text="Loading operational tasks..." />
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-border-divider bg-card-panel/40 p-12 text-center">
          <div className="grid size-12 place-items-center rounded-2xl border border-border-divider bg-app-bg text-sub">
            <Clock size={24} />
          </div>
          <h3 className="font-heading text-base font-bold text-main">No tasks found</h3>
          <p className="max-w-xs text-xs text-sub">
            No operational tasks match your selected filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {tasks.map((task) => {
            const isCompleted = task.status === "completed" || task.status === "verified";
            return (
              <div
                key={task._id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-border-divider bg-card-panel p-4 shadow-sm transition-all hover:border-border-divider/80 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(task)}
                    className={`mt-0.5 grid size-8 shrink-0 cursor-pointer place-items-center rounded-xl border transition-all ${
                      isCompleted
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:border-emerald-400"
                    }`}
                  >
                    {isCompleted ? <CheckCircle size={20} weight="fill" /> : <Clock size={20} weight="bold" />}
                  </button>

                  <div className="space-y-1">
                    <h4 className={`text-base font-bold ${isCompleted ? "line-through text-sub" : "text-main"}`}>
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-xs text-sub leading-relaxed">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
                      <span className="rounded-md border border-border-divider bg-app-bg px-2 py-0.5 text-sub uppercase">
                        {task.category}
                      </span>

                      <span
                        className={`rounded-md border px-2 py-0.5 uppercase font-bold ${
                          task.priority === "urgent" || task.priority === "high"
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                            : "border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan"
                        }`}
                      >
                        {task.priority} priority
                      </span>

                      {task.assignedTo && (
                        <span className="flex items-center gap-1 text-sub">
                          <User size={12} /> {task.assignedTo.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(task)}
                    className={`h-9 cursor-pointer rounded-xl border px-3 text-xs font-bold transition-all ${
                      isCompleted
                        ? "border-border-divider bg-app-bg text-sub hover:text-main"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    }`}
                  >
                    {isCompleted ? "Reopen" : "Mark Done"}
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task._id)}
                      className="grid size-9 cursor-pointer place-items-center rounded-xl border border-border-divider bg-app-bg text-sub transition-colors hover:border-rose-500/40 hover:text-rose-400"
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

      {/* New Task Sheet Modal */}
      <Sheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Operational Task"
        description="Assign a new task for staff members or daily lounge maintenance."
        footer={
          <button
            type="submit"
            form="create-task-form"
            disabled={isSubmitting}
            className={PRIMARY_BTN}
          >
            {isSubmitting ? "Saving..." : "Create Task"}
          </button>
        }
      >
        <form id="create-task-form" onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-main">Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Sanitize SimRig steering wheel & pedals"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-main">Description</label>
            <textarea
              rows={3}
              placeholder="Detailed instructions or guidelines..."
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
                  <option value="opening">Opening Shift</option>
                  <option value="closing">Closing Shift</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Sanitation</option>
                  <option value="general">General</option>
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
        </form>
      </Sheet>
    </div>
  );
}