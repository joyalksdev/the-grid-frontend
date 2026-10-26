// src/components/tasks/taskTypes.js
import { ArrowsClockwise, User, Calendar } from "@phosphor-icons/react";

// Single source of truth for the three task columns. Tailwind needs literal
// class strings (not built from a variable) to pick them up, so each type
// carries its own full class strings rather than a "tone" name.
export const TASK_TYPES = {
  daily: {
    label: "Daily",
    icon: ArrowsClockwise,
    chip: "border-warning/25 bg-warning/10 text-warning",
  },
  regular: {
    label: "Regular",
    icon: User,
    chip: "border-primary-cyan/25 bg-primary-cyan/10 text-primary-cyan",
  },
  scheduled: {
    label: "Scheduled",
    icon: Calendar,
    chip: "border-tournament-primary/25 bg-tournament-primary/10 text-tournament-primary",
  },
};

export const TASK_TYPE_ORDER = ["daily", "regular", "scheduled"];