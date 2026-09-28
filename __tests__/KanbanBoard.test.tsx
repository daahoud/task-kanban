import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KanbanBoard from "@/components/KanbanBoard";
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
  type Task,
  type TaskStatus,
} from "@/lib/tasks";

// Supabase への通信を担うデータアクセス層（外部依存）だけをモックする
vi.mock("@/lib/tasks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tasks")>();
  return {
    ...actual,
    fetchTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  };
});

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "買い物",
    description: "牛乳を買う",
    status: "todo",
    created_at: "2026-09-28T00:00:00+00:00",
    updated_at: "2026-09-28T00:00:00+00:00",
    ...overrides,
  };
}

const columnName: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "InProgress",
  done: "Done",
};

function column(status: TaskStatus) {
  return screen.getByRole("region", { name: columnName[status] });
}

async function renderBoard(tasks: Task[]) {
  vi.mocked(fetchTasks).mockResolvedValue(tasks);
  const user = userEvent.setup();
  render(<KanbanBoard />);
  await screen.findByRole("region", { name: "Todo" });
  return user;
}

// 編集フォームの PUT/PATCH 相当のモック：入力内容をそのまま反映したタスクを返す
function mockUpdateEcho() {
  vi.mocked(updateTask).mockImplementation(async (id, input) =>
    makeTask({ id, ...input }),
  );
}

async function editStatus(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
  status: TaskStatus,
) {
  const card = screen.getByRole("article", { name: title });
  await user.click(within(card).getByRole("button", { name: "編集" }));
  await user.selectOptions(
    within(card).getByRole("combobox", { name: "ステータス" }),
    status,
  );
  await user.click(within(card).getByRole("button", { name: "保存" }));
}

describe("KanbanBoard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("一覧表示", () => {
    it("取得したタスクがステータスごとの列に表示される", async () => {
      await renderBoard([
        makeTask({ id: "1", title: "企画", status: "todo" }),
        makeTask({ id: "2", title: "実装", status: "in_progress" }),
        makeTask({ id: "3", title: "調査", status: "done" }),
      ]);

      expect(within(column("todo")).getByRole("article", { name: "企画" })).toBeDefined();
      expect(within(column("in_progress")).getByRole("article", { name: "実装" })).toBeDefined();
      expect(within(column("done")).getByRole("article", { name: "調査" })).toBeDefined();
    });

    it("タスクのタイトルと説明が表示される", async () => {
      await renderBoard([makeTask({ title: "買い物", description: "牛乳を買う" })]);

      const card = screen.getByRole("article", { name: "買い物" });
      expect(within(card).getByText("牛乳を買う")).toBeDefined();
    });

    it("タスクが0件だと各列に空であることが表示される", async () => {
      await renderBoard([]);

      for (const status of ["todo", "in_progress", "done"] as const) {
        expect(within(column(status)).getByText("タスクはありません")).toBeDefined();
      }
    });

    it("読み込み中は読み込み中の表示が出る", async () => {
      vi.mocked(fetchTasks).mockReturnValue(new Promise(() => {}));

      render(<KanbanBoard />);

      expect(screen.getByText("読み込み中…")).toBeDefined();
    });

    it("取得に失敗するとエラーメッセージが表示される", async () => {
      vi.mocked(fetchTasks).mockRejectedValue(new Error("network error"));

      render(<KanbanBoard />);

      expect(
        (await screen.findByRole("alert")).textContent,
      ).toContain("タスクの読み込みに失敗しました");
    });
  });

  describe("追加", () => {
    it("タイトルと説明を入力して追加すると Todo 列にすぐ表示され、入力欄が空に戻る", async () => {
      const user = await renderBoard([]);
      vi.mocked(createTask).mockResolvedValue(
        makeTask({ id: "new", title: "掃除", description: "部屋の掃除" }),
      );
      const form = screen.getByRole("form", { name: "タスクを追加" });

      await user.type(within(form).getByLabelText("タイトル"), "掃除");
      await user.type(within(form).getByLabelText("説明"), "部屋の掃除");
      await user.click(within(form).getByRole("button", { name: "追加" }));

      expect(createTask).toHaveBeenCalledWith({
        title: "掃除",
        description: "部屋の掃除",
        status: "todo",
      });
      const card = await within(column("todo")).findByRole("article", { name: "掃除" });
      expect(within(card).getByText("部屋の掃除")).toBeDefined();
      expect(within(form).getByLabelText<HTMLInputElement>("タイトル").value).toBe("");
      expect(within(form).getByLabelText<HTMLTextAreaElement>("説明").value).toBe("");
    });

    it("タイトルが空白のみだとエラーが表示され、追加されない", async () => {
      const user = await renderBoard([]);
      const form = screen.getByRole("form", { name: "タスクを追加" });

      await user.type(within(form).getByLabelText("タイトル"), "   ");
      await user.click(within(form).getByRole("button", { name: "追加" }));

      expect(within(form).getByRole("alert").textContent).toBe("タイトルを入力してください");
      expect(createTask).not.toHaveBeenCalled();
      expect(within(column("todo")).getByText("タスクはありません")).toBeDefined();
    });

    it("タイトル欄は最大文字数を超えて入力できない", async () => {
      await renderBoard([]);
      const form = screen.getByRole("form", { name: "タスクを追加" });

      expect(within(form).getByLabelText<HTMLInputElement>("タイトル").maxLength).toBe(100);
    });

    it("追加に失敗するとエラーが表示され、一覧は変わらず入力内容も残る", async () => {
      const user = await renderBoard([]);
      vi.mocked(createTask).mockRejectedValue(new Error("insert failed"));
      const form = screen.getByRole("form", { name: "タスクを追加" });

      await user.type(within(form).getByLabelText("タイトル"), "掃除");
      await user.click(within(form).getByRole("button", { name: "追加" }));

      expect((await screen.findByRole("alert")).textContent).toContain(
        "タスクの追加に失敗しました",
      );
      expect(within(column("todo")).getByText("タスクはありません")).toBeDefined();
      expect(within(form).getByLabelText<HTMLInputElement>("タイトル").value).toBe("掃除");
    });
  });

  describe("編集", () => {
    it("タイトルと説明を編集して保存すると一覧にすぐ反映される", async () => {
      const user = await renderBoard([makeTask({ id: "1", title: "買い物" })]);
      mockUpdateEcho();
      const card = screen.getByRole("article", { name: "買い物" });

      await user.click(within(card).getByRole("button", { name: "編集" }));
      const titleInput = within(card).getByLabelText("タイトル");
      await user.clear(titleInput);
      await user.type(titleInput, "まとめ買い");
      const descriptionInput = within(card).getByLabelText("説明");
      await user.clear(descriptionInput);
      await user.type(descriptionInput, "週末に行く");
      await user.click(within(card).getByRole("button", { name: "保存" }));

      expect(updateTask).toHaveBeenCalledWith("1", {
        title: "まとめ買い",
        description: "週末に行く",
        status: "todo",
      });
      const updated = await screen.findByRole("article", { name: "まとめ買い" });
      expect(within(updated).getByText("週末に行く")).toBeDefined();
      expect(screen.queryByRole("article", { name: "買い物" })).toBeNull();
    });

    it("ステータスを Todo → InProgress → Done の順に変更すると列を移動する", async () => {
      const user = await renderBoard([makeTask({ id: "1", title: "買い物", status: "todo" })]);
      mockUpdateEcho();

      await editStatus(user, "買い物", "in_progress");
      expect(
        await within(column("in_progress")).findByRole("article", { name: "買い物" }),
      ).toBeDefined();
      expect(within(column("todo")).queryByRole("article", { name: "買い物" })).toBeNull();

      await editStatus(user, "買い物", "done");
      expect(
        await within(column("done")).findByRole("article", { name: "買い物" }),
      ).toBeDefined();
      expect(within(column("in_progress")).queryByRole("article", { name: "買い物" })).toBeNull();
    });

    it("ステータスを Done → InProgress → Todo の逆方向に戻すと列を移動する", async () => {
      const user = await renderBoard([makeTask({ id: "1", title: "買い物", status: "done" })]);
      mockUpdateEcho();

      await editStatus(user, "買い物", "in_progress");
      expect(
        await within(column("in_progress")).findByRole("article", { name: "買い物" }),
      ).toBeDefined();

      await editStatus(user, "買い物", "todo");
      expect(
        await within(column("todo")).findByRole("article", { name: "買い物" }),
      ).toBeDefined();
      expect(within(column("done")).queryByRole("article", { name: "買い物" })).toBeNull();
    });

    it("編集をキャンセルすると保存されず元の表示に戻る", async () => {
      const user = await renderBoard([makeTask({ id: "1", title: "買い物" })]);
      const card = screen.getByRole("article", { name: "買い物" });

      await user.click(within(card).getByRole("button", { name: "編集" }));
      const titleInput = within(card).getByLabelText("タイトル");
      await user.clear(titleInput);
      await user.type(titleInput, "変更後");
      await user.click(within(card).getByRole("button", { name: "キャンセル" }));

      expect(updateTask).not.toHaveBeenCalled();
      const restored = screen.getByRole("article", { name: "買い物" });
      expect(within(restored).queryByLabelText("タイトル")).toBeNull();
      expect(within(restored).getByRole("button", { name: "編集" })).toBeDefined();
    });

    it("タイトルを空にして保存するとエラーが表示され、更新されない", async () => {
      const user = await renderBoard([makeTask({ id: "1", title: "買い物" })]);
      const card = screen.getByRole("article", { name: "買い物" });

      await user.click(within(card).getByRole("button", { name: "編集" }));
      await user.clear(within(card).getByLabelText("タイトル"));
      await user.click(within(card).getByRole("button", { name: "保存" }));

      expect(within(card).getByRole("alert").textContent).toBe("タイトルを入力してください");
      expect(updateTask).not.toHaveBeenCalled();
    });

    it("更新に失敗するとエラーが表示され、タスクは元の内容のまま残る", async () => {
      const user = await renderBoard([makeTask({ id: "1", title: "買い物", status: "todo" })]);
      vi.mocked(updateTask).mockRejectedValue(new Error("update failed"));

      await editStatus(user, "買い物", "done");

      expect(
        (await screen.findByText("タスクの更新に失敗しました")),
      ).toBeDefined();
      expect(within(column("todo")).getByRole("article", { name: "買い物" })).toBeDefined();
      expect(within(column("done")).queryByRole("article", { name: "買い物" })).toBeNull();
    });
  });

  describe("削除", () => {
    it("削除ボタンを押すと確認ダイアログが表示され、この時点では削除されない", async () => {
      const user = await renderBoard([makeTask({ id: "1", title: "買い物" })]);
      const card = screen.getByRole("article", { name: "買い物" });

      await user.click(within(card).getByRole("button", { name: "削除" }));

      const dialog = screen.getByRole("alertdialog", { name: "タスクの削除" });
      expect(within(dialog).getByText("「買い物」を削除しますか？")).toBeDefined();
      expect(deleteTask).not.toHaveBeenCalled();
      // モーダル表示中は背景がアクセシビリティツリーから隠れるため hidden を含めて探す
      expect(screen.getByRole("article", { name: "買い物", hidden: true })).toBeDefined();
    });

    it("確認ダイアログで削除するを選ぶと一覧からすぐ消え、ダイアログが閉じる", async () => {
      const user = await renderBoard([
        makeTask({ id: "1", title: "買い物" }),
        makeTask({ id: "2", title: "掃除" }),
      ]);
      vi.mocked(deleteTask).mockResolvedValue(undefined);
      const card = screen.getByRole("article", { name: "買い物" });

      await user.click(within(card).getByRole("button", { name: "削除" }));
      await user.click(
        within(screen.getByRole("alertdialog")).getByRole("button", { name: "削除する" }),
      );

      expect(deleteTask).toHaveBeenCalledWith("1");
      expect(screen.queryByRole("article", { name: "買い物" })).toBeNull();
      expect(screen.getByRole("article", { name: "掃除" })).toBeDefined();
      expect(screen.queryByRole("alertdialog")).toBeNull();
    });

    it("確認ダイアログでキャンセルするとダイアログが閉じ、タスクは残る", async () => {
      const user = await renderBoard([makeTask({ id: "1", title: "買い物" })]);
      const card = screen.getByRole("article", { name: "買い物" });

      await user.click(within(card).getByRole("button", { name: "削除" }));
      await user.click(
        within(screen.getByRole("alertdialog")).getByRole("button", { name: "キャンセル" }),
      );

      expect(screen.queryByRole("alertdialog")).toBeNull();
      expect(deleteTask).not.toHaveBeenCalled();
      expect(screen.getByRole("article", { name: "買い物" })).toBeDefined();
    });

    it("削除に失敗するとエラーが表示され、タスクは残る", async () => {
      const user = await renderBoard([makeTask({ id: "1", title: "買い物" })]);
      vi.mocked(deleteTask).mockRejectedValue(new Error("delete failed"));
      const card = screen.getByRole("article", { name: "買い物" });

      await user.click(within(card).getByRole("button", { name: "削除" }));
      await user.click(
        within(screen.getByRole("alertdialog")).getByRole("button", { name: "削除する" }),
      );

      expect((await screen.findByRole("alert")).textContent).toContain(
        "タスクの削除に失敗しました",
      );
      expect(screen.getByRole("article", { name: "買い物" })).toBeDefined();
      expect(screen.queryByRole("alertdialog")).toBeNull();
    });
  });
});
