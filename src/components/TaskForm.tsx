"use client";

import { useId, useState, type FormEvent } from "react";
import {
  DESCRIPTION_MAX_LENGTH,
  TASK_STATUSES,
  TITLE_MAX_LENGTH,
  type TaskInput,
} from "@/lib/tasks";
import { STATUS_LABELS } from "./statusLabels";

type TaskFormProps = {
  label: string;
  submitLabel: string;
  initialValue?: TaskInput;
  showStatus?: boolean;
  // 成功したら true を返す。キャンセルのない追加フォームは成功時に入力欄を空に戻す
  onSubmit: (input: TaskInput) => Promise<boolean>;
  onCancel?: () => void;
};

const emptyInput: TaskInput = { title: "", description: "", status: "todo" };

const fieldClassName =
  "rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900";

export default function TaskForm({
  label,
  submitLabel,
  initialValue = emptyInput,
  showStatus = false,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const id = useId();
  const [title, setTitle] = useState(initialValue.title);
  const [description, setDescription] = useState(initialValue.description);
  const [status, setStatus] = useState(initialValue.status);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (title.trim().length === 0) {
      setValidationError("タイトルを入力してください");
      return;
    }
    setValidationError(null);
    setSubmitting(true);
    const succeeded = await onSubmit({ title: title.trim(), description, status });
    setSubmitting(false);
    if (succeeded && !onCancel) {
      setTitle("");
      setDescription("");
      setStatus("todo");
    }
  }

  return (
    <form
      aria-label={label}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-2"
    >
      <label htmlFor={`${id}-title`} className="text-sm font-medium">
        タイトル
      </label>
      <input
        id={`${id}-title`}
        value={title}
        maxLength={TITLE_MAX_LENGTH}
        onChange={(event) => setTitle(event.target.value)}
        className={fieldClassName}
      />
      <label htmlFor={`${id}-description`} className="text-sm font-medium">
        説明
      </label>
      <textarea
        id={`${id}-description`}
        value={description}
        maxLength={DESCRIPTION_MAX_LENGTH}
        rows={2}
        onChange={(event) => setDescription(event.target.value)}
        className={fieldClassName}
      />
      {showStatus && (
        <>
          <label htmlFor={`${id}-status`} className="text-sm font-medium">
            ステータス
          </label>
          <select
            id={`${id}-status`}
            value={status}
            onChange={(event) =>
              setStatus(
                TASK_STATUSES.find((value) => value === event.target.value) ?? "todo",
              )
            }
            className={fieldClassName}
          >
            {TASK_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </>
      )}
      {validationError && (
        <p role="alert" className="text-sm text-red-600">
          {validationError}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-zinc-900 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}
