"use client";

import type { Task, TaskInput } from "@/lib/tasks";
import TaskForm from "./TaskForm";

type TaskCardProps = {
  task: Task;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (input: TaskInput) => Promise<boolean>;
  onDelete: () => void;
};

export default function TaskCard({
  task,
  editing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: TaskCardProps) {
  return (
    <article
      aria-label={task.title}
      className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      {editing ? (
        <TaskForm
          label="タスクを編集"
          submitLabel="保存"
          initialValue={task}
          showStatus
          onSubmit={onSave}
          onCancel={onCancelEdit}
        />
      ) : (
        <>
          <h3 className="break-words font-medium">{task.title}</h3>
          {task.description && (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-600 dark:text-zinc-400">
              {task.description}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="rounded border border-zinc-300 px-2 py-0.5 text-sm dark:border-zinc-700"
            >
              編集
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded border border-red-300 px-2 py-0.5 text-sm text-red-600 dark:border-red-800"
            >
              削除
            </button>
          </div>
        </>
      )}
    </article>
  );
}
