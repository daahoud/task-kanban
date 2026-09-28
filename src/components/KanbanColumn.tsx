"use client";

import { Badge } from "@/components/ui/badge";
import type { Task, TaskInput, TaskStatus } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import TaskCard from "./TaskCard";
import { STATUS_DOT_CLASSES, STATUS_LABELS } from "./statusLabels";

type KanbanColumnProps = {
  status: TaskStatus;
  // この列に表示するタスク（呼び出し側でステータスごとに絞り込んだもの）
  tasks: Task[];
  editingId: string | null;
  onEdit: (task: Task) => void;
  onCancelEdit: () => void;
  onSave: (id: string, input: TaskInput) => Promise<boolean>;
  onDelete: (task: Task) => void;
};

export default function KanbanColumn({
  status,
  tasks,
  editingId,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: KanbanColumnProps) {
  return (
    <section
      aria-label={STATUS_LABELS[status]}
      className="flex flex-col gap-3 rounded-2xl border bg-muted/60 p-3"
    >
      <h2 className="flex items-center gap-2 px-1 text-sm font-semibold">
        <span
          className={cn("size-2 rounded-full", STATUS_DOT_CLASSES[status])}
          aria-hidden="true"
        />
        {STATUS_LABELS[status]}
        <Badge variant="secondary" className="ml-auto tabular-nums">
          {tasks.length}
        </Badge>
      </h2>
      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          タスクはありません
        </p>
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            editing={editingId === task.id}
            onEdit={() => onEdit(task)}
            onCancelEdit={onCancelEdit}
            onSave={(input) => onSave(task.id, input)}
            onDelete={() => onDelete(task)}
          />
        ))
      )}
    </section>
  );
}
