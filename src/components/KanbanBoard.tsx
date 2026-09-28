"use client";

import { useState } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { useTasks } from "@/hooks/useTasks";
import { TASK_STATUSES, type Task, type TaskInput } from "@/lib/tasks";
import ConfirmDialog from "./ConfirmDialog";
import KanbanColumn from "./KanbanColumn";
import NewTaskPanel from "./NewTaskPanel";

export default function KanbanBoard() {
  const { tasks, loadState, error, addTask, editTask, removeTask } = useTasks();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  async function handleSave(id: string, input: TaskInput) {
    const succeeded = await editTask(id, input);
    if (succeeded) setEditingId(null);
    return succeeded;
  }

  async function handleDelete(target: Task) {
    setDeletingTask(null);
    await removeTask(target.id);
  }

  return (
    <div className="flex flex-col gap-6">
      <NewTaskPanel onCreate={addTask} />

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
          {TASK_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasks.filter((task) => task.status === status)}
              editingId={editingId}
              onEdit={(task) => setEditingId(task.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={handleSave}
              onDelete={setDeletingTask}
            />
          ))}
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
