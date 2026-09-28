import { createSupabaseClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type Task = Omit<Tables<"tasks">, "status"> & { status: TaskStatus };

export type TaskInput = {
  title: string;
  description: string;
  status: TaskStatus;
};

// DB の check 制約と同じ上限
export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 1000;

function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

function toTask(row: Tables<"tasks">): Task {
  if (!isTaskStatus(row.status)) {
    throw new Error(`不正なステータスです: ${row.status}`);
  }
  return { ...row, status: row.status };
}

// 通信前に入力を検証し、タイトルの前後の空白を取り除く
function normalizeInput(input: TaskInput): TaskInput {
  const title = input.title.trim();
  if (title.length === 0) {
    throw new Error("タイトルを入力してください");
  }
  if (title.length > TITLE_MAX_LENGTH) {
    throw new Error(`タイトルは${TITLE_MAX_LENGTH}文字以内で入力してください`);
  }
  if (input.description.length > DESCRIPTION_MAX_LENGTH) {
    throw new Error(`説明は${DESCRIPTION_MAX_LENGTH}文字以内で入力してください`);
  }
  return { title, description: input.description, status: input.status };
}

export async function fetchTasks(): Promise<Task[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data.map(toTask);
}

export async function createTask(input: TaskInput): Promise<Task> {
  const values = normalizeInput(input);
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert(values)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toTask(data);
}

export async function updateTask(id: string, input: TaskInput): Promise<Task> {
  const values = normalizeInput(input);
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toTask(data);
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
