import type { TaskStatus } from "@/lib/tasks";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "InProgress",
  done: "Done",
};

// 列見出しに付けるステータスの色（ライト・ダークの両方で判別できる中間色）
export const STATUS_DOT_CLASSES: Record<TaskStatus, string> = {
  todo: "bg-sky-500",
  in_progress: "bg-amber-500",
  done: "bg-emerald-500",
};
