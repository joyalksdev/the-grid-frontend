// src/pages/admin/TaskManager.jsx
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { taskService } from "../../services/taskService";
import { userService } from "../../services/userService";
import { socket } from "../../services/socket";
import Loader from "../../components/ui/Loader";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { Segmented } from "../../components/ui/PriceCalculator";
import TaskCardColumn from "../../components/tasks/TaskCardColumn";
import TaskFormSheet from "../../components/tasks/TaskFormSheet";
import { TASK_TYPE_ORDER, TASK_TYPES } from "../../components/tasks/taskTypes";

export default function TaskManager() {
  const { isAdmin } = useAuth();
  const isOwnerOrAdmin = isAdmin;

  const [tasks, setTasks] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("daily"); // mobile only
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState("daily");
  const [editingTask, setEditingTask] = useState(null);

  const [taskToDelete, setTaskToDelete] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [taskData, staffData] = await Promise.all([taskService.getTasks(), userService.getUsers()]);
      setTasks(Array.isArray(taskData) ? taskData : []);
      setStaffMembers(Array.isArray(staffData) ? staffData : []);
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const handleTaskCreated = (newTask) => {
      setTasks((prev) => [newTask, ...prev]);
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    };

    const handleTaskDeleted = ({ id }) => {
      setTasks((prev) => prev.filter((t) => t._id !== id));
    };

    const handleRollover = () => {
      toast.success("Midnight daily task reset completed");
      fetchData();
    };

    socket.on("task_created", handleTaskCreated);
    socket.on("task_status_changed", handleTaskUpdated);
    socket.on("task_updated", handleTaskUpdated);
    socket.on("task_deleted", handleTaskDeleted);
    socket.on("tasks_rolled_over", handleRollover);

    return () => {
      socket.off("task_created", handleTaskCreated);
      socket.off("task_status_changed", handleTaskUpdated);
      socket.off("task_updated", handleTaskUpdated);
      socket.off("task_deleted", handleTaskDeleted);
      socket.off("tasks_rolled_over", handleRollover);
    };
  }, [fetchData]);

  const handleAddTask = (type) => {
    setEditingTask(null);
    setFormType(type);
    setFormOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleSaved = () => {
    setFormOpen(false);
    setEditingTask(null);
    fetchData();
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await taskService.updateTaskStatus(task._id, newStatus);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    try {
      await taskService.deleteTask(taskToDelete._id);
      toast.success("Task deleted");
      setTaskToDelete(null);
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleReorderTasks = (type, newOrderForType) => {
    let i = 0;
    const merged = tasks.map((t) => ((t.taskType || "daily") === type ? newOrderForType[i++] : t));
    setTasks(merged);
  };

  const tasksByType = (type) => tasks.filter((t) => (t.taskType || "daily") === type);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 font-body text-main">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border-divider pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-main md:text-3xl">
              Task Board
            </h1>
            <span className="rounded-md border border-border-divider bg-app-bg px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-sub">
              {isOwnerOrAdmin ? "Admin View" : "Staff View"}
            </span>
          </div>
          <p className="mt-1 text-xs text-sub sm:text-sm">
            {isOwnerOrAdmin
              ? "Assign and track daily, regular, and scheduled tasks in real time."
              : "Your daily, regular, and scheduled tasks."}
          </p>
        </div>
      </div>

      {loading ? (
        <Loader variant="skeleton-card" lines={3} />
      ) : (
        <>
          {/* Mobile: one column at a time */}
          <div className="space-y-4 md:hidden">
            <Segmented
              label="Task list"
              value={activeTab}
              onChange={setActiveTab}
              options={TASK_TYPE_ORDER.map((t) => ({
                value: t,
                label: `${TASK_TYPES[t].label} (${tasksByType(t).length})`,
              }))}
            />
            <TaskCardColumn
              type={activeTab}
              tasks={tasksByType(activeTab)}
              onToggleStatus={handleToggleStatus}
              onDeleteTask={setTaskToDelete}
              onEditTask={handleEditTask}
              onReorderTasks={handleReorderTasks}
              onAddTask={handleAddTask}
              isOwnerOrAdmin={isOwnerOrAdmin}
            />
          </div>

          {/* Desktop: all three side by side */}
          <div className="hidden grid-cols-3 gap-5 md:grid">
            {TASK_TYPE_ORDER.map((type) => (
              <TaskCardColumn
                key={type}
                type={type}
                tasks={tasksByType(type)}
                onToggleStatus={handleToggleStatus}
                onDeleteTask={setTaskToDelete}
                onEditTask={handleEditTask}
                onReorderTasks={handleReorderTasks}
                onAddTask={handleAddTask}
                isOwnerOrAdmin={isOwnerOrAdmin}
              />
            ))}
          </div>
        </>
      )}

      <TaskFormSheet
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        initialType={formType}
        staffMembers={staffMembers}
        editingTask={editingTask}
        onSaved={handleSaved}
      />

      <ConfirmModal
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={`Delete "${taskToDelete?.title || ""}"? This action cannot be undone.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}