"use client";

import { useEffect, useState } from "react";
import {
  createTask,
  deleteTask,
  fetchTasks,
  TASK_STATUSES,
  updateTask,
  type Task,
  type TaskInput,
} from "@/lib/tasks";
import ConfirmDialog from "./ConfirmDialog";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";
import { STATUS_LABELS } from "./statusLabels";

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "failed">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  useEffect(() => {
    let ignore = false;
    fetchTasks()
      .then((fetched) => {
        if (ignore) return;
        setTasks(fetched);
        setLoadState("loaded");
      })
      .catch(() => {
        if (ignore) return;
        setError("タスクの読み込みに失敗しました");
        setLoadState("failed");
      });
    return () => {
      ignore = true;
    };
  }, []);

  // 追加・更新・削除は API の結果でローカルの一覧を更新し、再読み込みせずに反映する
  async function handleCreate(input: TaskInput) {
    try {
      const created = await createTask(input);
      setTasks((prev) => [...prev, created]);
      setError(null);
      return true;
    } catch {
      setError("タスクの追加に失敗しました");
      return false;
    }
  }

  async function handleUpdate(id: string, input: TaskInput) {
    try {
      const updated = await updateTask(id, input);
      setTasks((prev) => prev.map((task) => (task.id === id ? updated : task)));
      setEditingId(null);
      setError(null);
      return true;
    } catch {
      setError("タスクの更新に失敗しました");
      return false;
    }
  }

  async function handleDelete(target: Task) {
    setDeletingTask(null);
    try {
      await deleteTask(target.id);
      setTasks((prev) => prev.filter((task) => task.id !== target.id));
      setError(null);
    } catch {
      setError("タスクの削除に失敗しました");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="max-w-md rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-2 font-semibold">新しいタスク</h2>
        <TaskForm label="タスクを追加" submitLabel="追加" onSubmit={handleCreate} />
      </section>

      {error && (
        <p
          role="alert"
          className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      )}

      {loadState === "loading" && <p>読み込み中…</p>}

      {loadState === "loaded" && (
        <div className="grid gap-4 md:grid-cols-3">
          {TASK_STATUSES.map((status) => {
            const columnTasks = tasks.filter((task) => task.status === status);
            return (
              <section
                key={status}
                aria-label={STATUS_LABELS[status]}
                className="flex flex-col gap-3 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-900"
              >
                <h2 className="font-semibold">
                  {STATUS_LABELS[status]}
                  <span className="ml-2 text-sm text-zinc-500">{columnTasks.length}</span>
                </h2>
                {columnTasks.length === 0 ? (
                  <p className="text-sm text-zinc-500">タスクはありません</p>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      editing={editingId === task.id}
                      onEdit={() => setEditingId(task.id)}
                      onCancelEdit={() => setEditingId(null)}
                      onSave={(input) => handleUpdate(task.id, input)}
                      onDelete={() => setDeletingTask(task)}
                    />
                  ))
                )}
              </section>
            );
          })}
        </div>
      )}

      {deletingTask && (
        <ConfirmDialog
          title="タスクの削除"
          message={`「${deletingTask.title}」を削除しますか？`}
          confirmLabel="削除する"
          onConfirm={() => handleDelete(deletingTask)}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  );
}
