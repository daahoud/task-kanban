import type { TaskStatus } from "@/lib/tasks";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "InProgress",
  done: "Done",
};
