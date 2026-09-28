import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KanbanColumn from "@/components/KanbanColumn";
import type { Task } from "@/lib/tasks";

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

function renderColumn(props: Partial<Parameters<typeof KanbanColumn>[0]> = {}) {
  const handlers = {
    onEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onSave: vi.fn().mockResolvedValue(true),
    onDelete: vi.fn(),
  };
  const user = userEvent.setup();
  render(
    <KanbanColumn status="todo" tasks={[]} editingId={null} {...handlers} {...props} />,
  );
  return { user, ...handlers };
}

describe("KanbanColumn", () => {
  afterEach(() => {
    cleanup();
  });

  it("ステータスの表示名を名前に持つ列として表示される", () => {
    renderColumn({ status: "in_progress" });

    const region = screen.getByRole("region", { name: "InProgress" });
    expect(within(region).getByRole("heading", { level: 2 }).textContent).toContain(
      "InProgress",
    );
  });

  it("タスクが0件だと件数 0 と空であることが表示される", () => {
    renderColumn({ tasks: [] });

    const region = screen.getByRole("region", { name: "Todo" });
    expect(within(region).getByRole("heading", { level: 2 }).textContent).toContain("0");
    expect(within(region).getByText("タスクはありません")).toBeDefined();
    expect(within(region).queryByRole("article")).toBeNull();
  });

  it("渡したタスクがカードとして並び、件数が表示される", () => {
    renderColumn({
      tasks: [makeTask({ id: "1", title: "企画" }), makeTask({ id: "2", title: "実装" })],
    });

    const region = screen.getByRole("region", { name: "Todo" });
    expect(within(region).getByRole("heading", { level: 2 }).textContent).toContain("2");
    expect(
      within(region)
        .getAllByRole("article")
        .map((card) => card.getAttribute("aria-label")),
    ).toEqual(["企画", "実装"]);
    expect(within(region).queryByText("タスクはありません")).toBeNull();
  });

  it("editingId のタスクだけが編集フォームで表示される", () => {
    renderColumn({
      tasks: [makeTask({ id: "1", title: "企画" }), makeTask({ id: "2", title: "実装" })],
      editingId: "2",
    });

    const editing = screen.getByRole("article", { name: "実装" });
    expect(within(editing).getByRole("form", { name: "タスクを編集" })).toBeDefined();
    const viewing = screen.getByRole("article", { name: "企画" });
    expect(within(viewing).queryByRole("form")).toBeNull();
  });

  it("カードの編集・削除ボタンを押すと、そのタスクを引数にハンドラが呼ばれる", async () => {
    const task = makeTask({ id: "1", title: "企画" });
    const { user, onEdit, onDelete } = renderColumn({ tasks: [task] });
    const card = screen.getByRole("article", { name: "企画" });

    await user.click(within(card).getByRole("button", { name: "編集" }));
    await user.click(within(card).getByRole("button", { name: "削除" }));

    expect(onEdit).toHaveBeenCalledWith(task);
    expect(onDelete).toHaveBeenCalledWith(task);
  });

  it("編集フォームで保存するとタスクの id と入力内容でハンドラが呼ばれ、キャンセルでも通知される", async () => {
    const task = makeTask({ id: "1", title: "企画", description: "", status: "todo" });
    const { user, onSave, onCancelEdit } = renderColumn({ tasks: [task], editingId: "1" });
    const card = screen.getByRole("article", { name: "企画" });

    await user.click(within(card).getByRole("button", { name: "保存" }));
    expect(onSave).toHaveBeenCalledWith("1", {
      title: "企画",
      description: "",
      status: "todo",
    });

    await user.click(within(card).getByRole("button", { name: "キャンセル" }));
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
  });
});
