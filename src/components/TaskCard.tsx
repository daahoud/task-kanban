"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <Card
      role="article"
      aria-label={task.title}
      size="sm"
      className="px-3 shadow-xs transition-shadow hover:shadow-md"
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
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium break-words">{task.title}</h3>
            {task.description && (
              <p className="mt-1 text-sm whitespace-pre-wrap break-words text-muted-foreground">
                {task.description}
              </p>
            )}
          </div>
          <div className="-mt-1 -mr-1 flex shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="編集"
              title="編集"
              onClick={onEdit}
            >
              <Pencil aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="削除"
              title="削除"
              onClick={onDelete}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
