// src/components/tasks/TaskCard.jsx
import React from "react";
import { Reorder, useDragControls } from "framer-motion";
import { CheckCircle, Trash, PencilSimple, DotsSixVertical, User, Clock } from "@phosphor-icons/react";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

function formatSchedule(iso) {
  const dateObj = new Date(iso);
  if (isNaN(dateObj.getTime())) return iso;
  
  const hasTime = dateObj.getHours() !== 0 || dateObj.getMinutes() !== 0;
  if (hasTime) {
    return dateObj.toLocaleString(undefined, { 
      month: "short", 
      day: "numeric", 
      hour: "numeric", 
      minute: "2-digit" 
    });
  }
  return dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TaskCard({ task, onToggleStatus, onDelete, onEdit, isOwnerOrAdmin }) {
  const dragControls = useDragControls();
  const isCompleted = task.status === "completed" || task.status === "verified";
  const isUrgent = !isCompleted && (task.priority === "urgent" || task.priority === "high");

  return (
    <Reorder.Item
      value={task}
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isCompleted ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex items-start gap-2.5 rounded-xl border border-border-divider bg-app-bg p-3.5 transition-colors duration-150 motion-reduce:transition-none"
    >
      {isOwnerOrAdmin && (
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          aria-label="Drag to reorder"
          className={`mt-0.5 grid size-6 shrink-0 cursor-grab touch-none place-items-center rounded-md text-sub transition-colors duration-150 hover:text-main active:cursor-grabbing motion-reduce:transition-none ${FOCUS}`}
        >
          <DotsSixVertical size={16} weight="bold" aria-hidden="true" />
        </button>
      )}

      <button
        type="button"
        onClick={() => onToggleStatus(task)}
        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
        className={`mt-0.5 grid size-6 shrink-0 cursor-pointer place-items-center rounded-md border transition-colors duration-150 motion-reduce:transition-none touch-manipulation ${FOCUS} ${
          isCompleted
            ? "border-primary-cyan bg-primary-cyan text-app-bg"
            : "border-border-divider bg-card-panel text-transparent hover:border-sub"
        }`}
      >
        <CheckCircle size={14} weight="bold" aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1 space-y-1.5">
        <h4
          className={`text-sm font-semibold leading-tight ${
            isCompleted ? "text-sub line-through" : "text-main"
          }`}
        >
          {task.title}
        </h4>

        {task.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-sub">{task.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium capitalize ${
              isUrgent
                ? "border-occupied/30 bg-occupied/10 text-occupied"
                : "border-border-divider bg-card-panel text-sub"
            }`}
          >
            {task.priority}
          </span>

          {task.assignedTo && (
            <span className="inline-flex items-center gap-1 rounded-md border border-border-divider bg-card-panel px-1.5 py-0.5 text-[10px] text-sub">
              <User size={10} aria-hidden="true" />
              {task.assignedTo.name || task.assignedTo.username}
            </span>
          )}

          {task.scheduledFor && (
            <span className="inline-flex items-center gap-1 rounded-md border border-border-divider bg-card-panel px-1.5 py-0.5 text-[10px] text-sub">
              <Clock size={10} aria-hidden="true" />
              {formatSchedule(task.scheduledFor)}
            </span>
          )}

          {task.isOverdue && !isCompleted && (
            <span className="text-[10px] font-medium text-occupied">Overdue</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onToggleStatus(task)}
          className={`h-7 cursor-pointer rounded-md border border-border-divider px-2.5 text-[11px] font-medium text-sub transition-colors duration-150 hover:text-main motion-reduce:transition-none touch-manipulation ${FOCUS}`}
        >
          {isCompleted ? "Reopen" : "Done"}
        </button>

        {isOwnerOrAdmin && (
          <>
            <button
              type="button"
              onClick={() => onEdit(task)}
              aria-label="Edit task"
              className={`grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-sub transition-colors duration-150 hover:bg-primary-cyan/10 hover:text-primary-cyan motion-reduce:transition-none touch-manipulation ${FOCUS}`}
            >
              <PencilSimple size={14} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(task)}
              aria-label="Delete task"
              className={`grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-sub transition-colors duration-150 hover:bg-occupied/10 hover:text-occupied motion-reduce:transition-none touch-manipulation ${FOCUS}`}
            >
              <Trash size={14} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </Reorder.Item>
  );
}