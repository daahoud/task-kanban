"use client";

import { useEffect, useState } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { STATUS_DOT_CLASSES, STATUS_LABELS } from "./statusLabels";

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
      <Card className="max-w-xl shadow-xs">
        <CardHeader>
          <CardTitle>新しいタスク</CardTitle>
          <CardDescription>追加したタスクは Todo 列に入ります</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm label="タスクを追加" submitLabel="追加" onSubmit={handleCreate} />
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      {loadState === "loading" && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          読み込み中…
        </p>
      )}

      {loadState === "loaded" && (
        <div className="grid items-start gap-4 md:grid-cols-3">
          {TASK_STATUSES.map((status) => {
            const columnTasks = tasks.filter((task) => task.status === status);
            return (
              <section
                key={status}
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
                    {columnTasks.length}
                  </Badge>
                </h2>
                {columnTasks.length === 0 ? (
                  <p className="rounded-xl border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                    タスクはありません
                  </p>
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
