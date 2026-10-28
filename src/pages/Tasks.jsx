// src/pages/Tasks.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowsClockwise,
  User,
  Calendar,
  Clock,
  CheckCircle,
  WarningCircle
} from "@phosphor-icons/react";

import { taskService } from "../services/taskService";
import { socket } from "../services/socket";
import { notify } from "../utils/toastController";
import Loader from "../components/ui/Loader";

const TYPE_CONFIG = {
  daily: { label: "Daily Routine", color: "border-amber-500/40 bg-amber-500/10 text-amber-400", icon: ArrowsClockwise },
  regular: { label: "Regular Task", color: "border-primary-cyan/40 bg-primary-cyan/10 text-primary-cyan", icon: User },
  scheduled: { label: "Scheduled", color: "border-purple-500/40 bg-purple-500/10 text-purple-400", icon: Calendar },
};

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await taskService.getTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      notify.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();

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
      fetchTasks();
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
  }, [fetchTasks]);

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await taskService.updateTaskStatus(task._id, newStatus);
      notify.success(newStatus === "completed" ? "Completed ✓" : "Reopened");
    } catch (error) {
      notify.error("Failed to update task status");
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "all") return true;
    return (t.taskType || "daily") === filter;
  });

  const completedCount = tasks.filter((t) => t.status === "completed" || t.status === "verified").length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-28 font-body text-main">
      <div className="flex flex-col gap-4 border-b border-border-divider/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-main md:text-3xl">
            Tasks
          </h1>
          <p className="text-xs text-sub sm:text-sm">
            Keep lounge operations optimized and operational routines synchronized.
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border-divider bg-card-panel px-5 py-3 shadow-sm">
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-wider text-sub">Completion Rate</p>
            <p className="font-mono text-sm font-bold text-main">
              {completedCount} / {totalCount} Done
            </p>
          </div>
          <div className="h-2 w-28 overflow-hidden rounded-full bg-app-bg">
            <div
              className="h-full bg-primary-cyan transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["all", "daily", "regular", "scheduled"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              filter === f
                ? "border border-primary-cyan/40 bg-primary-cyan/10 text-primary-cyan shadow-sm"
                : "border border-border-divider bg-card-panel text-sub hover:text-main"
            } ${FOCUS}`}
          >
            {f} {f === "all" ? `(${tasks.length})` : `(${tasks.filter((t) => (t.taskType || "daily") === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader variant="skeleton-table" lines={4} text="Loading tasks..." />
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-3 rounded-3xl border border-dashed border-border-divider bg-card-panel/40 p-16 text-center">
          <div className="grid size-12 place-items-center rounded-2xl border border-border-divider bg-app-bg text-sub">
            <Clock size={24} />
          </div>
          <h3 className="font-heading text-base font-bold text-main">All Tasks Completed</h3>
          <p className="max-w-xs text-xs text-sub">Everything is fully up to date for this queue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === "completed" || task.status === "verified";
            const typeConfig = TYPE_CONFIG[task.taskType || "daily"] || TYPE_CONFIG.daily;
            const TypeIcon = typeConfig.icon;
            const isUrgent = !isCompleted && (task.priority === "urgent" || task.priority === "high");

            return (
              <div
                key={task._id}
                className={`group relative flex flex-col justify-between gap-4 rounded-2xl border p-4.5 transition-all sm:flex-row sm:items-center ${
                  isUrgent
                    ? "border-rose-500/70 bg-rose-500/5 shadow-lg shadow-rose-500/10"
                    : isCompleted
                    ? "border-emerald-500/30 bg-emerald-500/[0.02] opacity-70"
                    : "border-border-divider bg-card-panel hover:border-border-divider/90 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(task)}
                    aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                    className={`mt-0.5 grid size-8 shrink-0 cursor-pointer place-items-center rounded-xl border transition-all duration-200 ${
                      isCompleted
                        ? "border-emerald-500 bg-emerald-500 text-app-bg shadow-md scale-105"
                        : "border-border-divider bg-app-bg text-transparent hover:border-primary-cyan hover:bg-primary-cyan/10"
                    } ${FOCUS}`}
                  >
                    <CheckCircle size={20} weight="bold" className={isCompleted ? "opacity-100" : "opacity-0"} />
                  </button>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={`text-sm font-bold tracking-tight transition-colors ${
                          isCompleted ? "line-through text-sub" : "text-main"
                        }`}
                      >
                        {task.title}
                      </h4>

                      {isUrgent && (
                        <span className="flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/20 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-rose-400 animate-pulse">
                          <WarningCircle size={11} weight="fill" /> URGENT
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-sub leading-relaxed">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
                      <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-bold uppercase tracking-wider ${typeConfig.color}`}>
                        <TypeIcon size={12} weight="bold" />
                        {typeConfig.label}
                      </span>

                      <span
                        className={`rounded-md border px-2 py-0.5 font-bold uppercase tracking-wider ${
                          task.priority === "urgent" || task.priority === "high"
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                            : "border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan"
                        }`}
                      >
                        {task.priority}
                      </span>

                      {task.assignedTo && (
                        <span className="rounded-md border border-border-divider bg-app-bg px-2 py-0.5 text-main">
                          @{task.assignedTo.name || task.assignedTo.username}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(task)}
                    className={`h-9 cursor-pointer rounded-xl border px-4 font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                      isCompleted
                        ? "border-border-divider bg-app-bg text-sub hover:text-main"
                        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shadow-sm"
                    } ${FOCUS}`}
                  >
                    {isCompleted ? "Reopen" : "Done ✓"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}