"use client";

import { useEffect, useState } from "react";
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
  type Task,
  type TaskInput,
} from "@/lib/tasks";

export type LoadState = "loading" | "loaded" | "failed";

// タスク一覧の読み込みと追加・更新・削除をまとめる。
// 追加・更新・削除は API の結果でローカルの一覧を更新し、再読み込みせずに反映する
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);

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

  // 成功したら true を返す（フォームが入力欄のリセットや編集終了に使う）
  async function addTask(input: TaskInput) {
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

  async function editTask(id: string, input: TaskInput) {
    try {
      const updated = await updateTask(id, input);
      setTasks((prev) => prev.map((task) => (task.id === id ? updated : task)));
      setError(null);
      return true;
    } catch {
      setError("タスクの更新に失敗しました");
      return false;
    }
  }

  async function removeTask(id: string) {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((task) => task.id !== id));
      setError(null);
    } catch {
      setError("タスクの削除に失敗しました");
    }
  }

  return { tasks, loadState, error, addTask, editTask, removeTask };
}
