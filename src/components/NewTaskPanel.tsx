"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskInput } from "@/lib/tasks";
import TaskForm from "./TaskForm";

type NewTaskPanelProps = {
  // 成功したら true を返す。成功すると入力欄が空に戻る
  onCreate: (input: TaskInput) => Promise<boolean>;
};

export default function NewTaskPanel({ onCreate }: NewTaskPanelProps) {
  return (
    <Card className="max-w-xl shadow-xs">
      <CardHeader>
        <CardTitle>新しいタスク</CardTitle>
        <CardDescription>追加したタスクは Todo 列に入ります</CardDescription>
      </CardHeader>
      <CardContent>
        <TaskForm label="タスクを追加" submitLabel="追加" onSubmit={onCreate} />
      </CardContent>
    </Card>
  );
}
