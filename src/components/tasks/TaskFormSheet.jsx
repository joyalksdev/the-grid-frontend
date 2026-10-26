// src/components/tasks/TaskFormSheet.jsx
import React, { useState, useEffect, useId } from "react";
import { toast } from "react-hot-toast";
import { taskService } from "../../services/taskService";
import Sheet, { INPUT_CLASS, PRIMARY_BTN, OptionCard } from "../ui/Sheet";
import { TASK_TYPES, TASK_TYPE_ORDER } from "./taskTypes";
import Tooltip from "../ui/Tooltip";

const EMPTY_FORM = {
  title: "",
  description: "",
  priority: "medium",
  assignedTo: "",
  scheduledFor: "",
  scheduledTime: "",
};

const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function TaskFormSheet({ isOpen, onClose, initialType, staffMembers, editingTask, onSaved }) {
  const titleId = useId();
  const descriptionId = useId();
  const assignedId = useId();
  const dateId = useId();
  const timeId = useId();

  const [taskType, setTaskType] = useState(initialType || "daily");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (editingTask) {
      setTaskType(editingTask.taskType || "daily");
      
      let dateStr = "";
      let timeStr = "";
      if (editingTask.scheduledFor) {
        const d = new Date(editingTask.scheduledFor);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().split("T")[0];
          const hours = String(d.getHours()).padStart(2, "0");
          const mins = String(d.getMinutes()).padStart(2, "0");
          if (hours !== "00" || mins !== "00") {
            timeStr = `${hours}:${mins}`;
          }
        }
      }

      setFormData({
        title: editingTask.title || "",
        description: editingTask.description || "",
        priority: editingTask.priority || "medium",
        assignedTo: editingTask.assignedTo?._id || editingTask.assignedTo || "",
        scheduledFor: dateStr,
        scheduledTime: timeStr,
      });
    } else {
      setTaskType(initialType || "daily");
      setFormData(EMPTY_FORM);
    }
  }, [isOpen, editingTask, initialType]);

  const set = (key) => (e) => setFormData((f) => ({ ...f, [key]: e.target.value }));

  // Filter out admins/owners and only keep staff members
  const actualStaff = staffMembers.filter((s) => {
    const role = (s.role || "").toLowerCase();
    return role !== "admin" && role !== "owner";
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setSubmitting(true);

    try {
      let finalScheduledFor = formData.scheduledFor;
      if (taskType === "scheduled" && formData.scheduledFor && formData.scheduledTime) {
        finalScheduledFor = `${formData.scheduledFor}T${formData.scheduledTime}:00.000Z`;
      }

      const payload = {
        ...formData,
        taskType,
        scheduledFor: finalScheduledFor || undefined,
      };
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.scheduledFor) delete payload.scheduledFor;
      delete payload.scheduledTime;

      if (editingTask) {
        await taskService.updateTask(editingTask._id, payload);
        toast.success("Task updated successfully");
      } else {
        await taskService.createTask(payload);
        toast.success("Task created successfully");
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={editingTask ? "Edit Task" : "New Task"}
      footer={
        <button type="submit" form="task-form" disabled={submitting} className={PRIMARY_BTN}>
          {submitting ? "Saving…" : editingTask ? "Update Task" : "Create Task"}
        </button>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-main">Type</legend>
          <div className="grid grid-cols-3 gap-2">
            {TASK_TYPE_ORDER.map((t) => {
              const info = TASK_TYPES[t];
              const Icon = info.icon;
              return (
                <OptionCard key={t} name="task-type" value={t} checked={taskType === t} onChange={() => setTaskType(t)}>
                  <Icon size={16} aria-hidden="true" className="mb-1" />
                  <span className="text-xs font-semibold">{info.label}</span>
                </OptionCard>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor={titleId} className="mb-1.5 block text-sm font-medium text-main">
            Title
          </label>
          <input
            id={titleId}
            type="text"
            required
            autoFocus
            autoComplete="off"
            value={formData.title}
            onChange={set("title")}
            placeholder="e.g., Restock controller batteries"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor={descriptionId} className="mb-1.5 block text-sm font-medium text-main">
            Instructions <span className="font-normal text-sub">(optional)</span>
          </label>
          <textarea
            id={descriptionId}
            rows={3}
            value={formData.description}
            onChange={set("description")}
            placeholder="Any detail the staff member needs…"
            className={`${INPUT_CLASS} h-auto resize-none py-2.5`}
          />
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-main">Priority</legend>
          <div className="grid grid-cols-4 gap-2">
            {PRIORITIES.map((p) => (
              <OptionCard key={p} name="task-priority" value={p} checked={formData.priority === p} onChange={() => setFormData((f) => ({ ...f, priority: p }))}>
                <span className="text-xs font-semibold capitalize">{p}</span>
              </OptionCard>
            ))}
          </div>
        </fieldset>

       <select 
        id={assignedId} 
        value={formData.assignedTo} 
        onChange={set("assignedTo")} 
        className={`${INPUT_CLASS} cursor-pointer`}
        >
        <option value="">All Staff</option>
        {actualStaff.map((s) => {
            const isActive = s.isActive === true || s.status === "active" || s.status === "online";
            return (
            <option 
                key={s._id} 
                value={s._id}
                title={isActive ? "Status: Active" : "Status: Offline"}
            >
                {isActive ? "🟢" : "🔴"} {s.name || s.username}
            </option>
            );
        })}
        </select>

        {taskType === "scheduled" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor={dateId} className="mb-1.5 block text-sm font-medium text-main">
                Date
              </label>
              <input
                id={dateId}
                type="date"
                required
                value={formData.scheduledFor}
                onChange={set("scheduledFor")}
                className={`${INPUT_CLASS} cursor-pointer`}
              />
            </div>
            <div>
              <label htmlFor={timeId} className="mb-1.5 block text-sm font-medium text-main">
                Time <span className="font-normal text-sub">(optional)</span>
              </label>
              <input
                id={timeId}
                type="time"
                value={formData.scheduledTime}
                onChange={set("scheduledTime")}
                className={`${INPUT_CLASS} cursor-pointer`}
              />
            </div>
          </div>
        )}
      </form>
    </Sheet>
  );
}