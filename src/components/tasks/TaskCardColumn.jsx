// src/components/tasks/TaskCardColumn.jsx
import React from "react";
import { Reorder, AnimatePresence } from "framer-motion";
import { Plus } from "@phosphor-icons/react";
import TaskCard from "./TaskCard";
import { TASK_TYPES } from "./taskTypes";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

export default function TaskCardColumn({
  type,
  tasks,
  onToggleStatus,
  onDeleteTask,
  onEditTask,
  onReorderTasks,
  onAddTask,
  isOwnerOrAdmin,
}) {
  const typeInfo = TASK_TYPES[type] || TASK_TYPES.daily;
  const TypeIcon = typeInfo.icon;

  return (
    <div className="flex min-h-[26rem] flex-col overflow-hidden rounded-xl border border-border-divider bg-card-panel md:min-h-[32rem]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border-divider px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className={`grid size-7 shrink-0 place-items-center rounded-lg border ${typeInfo.chip}`}>
            <TypeIcon size={14} weight="bold" aria-hidden="true" />
          </span>
          <h3 className="font-heading text-sm font-bold text-main">{typeInfo.label}</h3>
          <span className="rounded-md border border-border-divider bg-app-bg px-1.5 py-0.5 font-mono text-[10px] font-semibold text-sub">
            {tasks.length}
          </span>
        </div>

        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={() => onAddTask(type)}
            aria-label="Add task"
            className={`grid size-7 shrink-0 cursor-pointer place-items-center rounded-lg text-sub transition-colors duration-150 hover:bg-app-bg hover:text-main motion-reduce:transition-none touch-manipulation ${FOCUS}`}
          >
            <Plus size={16} weight="bold" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Body */}
      {tasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <TypeIcon size={22} aria-hidden="true" className="text-sub/50" />
          <p className="text-xs text-sub">No {typeInfo.label.toLowerCase()} tasks</p>
        </div>
      ) : (
        <Reorder.Group
          as="div"
          axis="y"
          values={tasks}
          onReorder={(newOrder) => onReorderTasks(type, newOrder)}
          className="flex-1 space-y-2.5 overflow-y-auto overscroll-contain p-3.5"
        >
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onToggleStatus={onToggleStatus}
                onDelete={onDeleteTask}
                onEdit={onEditTask}
                isOwnerOrAdmin={isOwnerOrAdmin}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}
    </div>
  );
}