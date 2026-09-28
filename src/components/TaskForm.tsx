"use client";

import { useId, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
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
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-title`}>タイトル</Label>
        <Input
          id={`${id}-title`}
          value={title}
          maxLength={TITLE_MAX_LENGTH}
          placeholder="やることを入力"
          aria-invalid={validationError ? true : undefined}
          aria-describedby={validationError ? `${id}-error` : undefined}
          onChange={(event) => setTitle(event.target.value)}
        />
        {validationError && (
          <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
            {validationError}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-description`}>説明</Label>
        <Textarea
          id={`${id}-description`}
          value={description}
          maxLength={DESCRIPTION_MAX_LENGTH}
          rows={2}
          placeholder="詳細やメモ（任意）"
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      {showStatus && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-status`}>ステータス</Label>
          <NativeSelect
            id={`${id}-status`}
            value={status}
            className="w-full"
            onChange={(event) =>
              setStatus(
                TASK_STATUSES.find((value) => value === event.target.value) ?? "todo",
              )
            }
          >
            {TASK_STATUSES.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {STATUS_LABELS[value]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {!onCancel && <Plus data-icon="inline-start" aria-hidden="true" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
