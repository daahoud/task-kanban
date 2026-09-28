import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewTaskPanel from "@/components/NewTaskPanel";

describe("NewTaskPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("見出しと追加フォームが表示される", () => {
    render(<NewTaskPanel onCreate={vi.fn()} />);

    expect(screen.getByText("新しいタスク")).toBeDefined();
    const form = screen.getByRole("form", { name: "タスクを追加" });
    expect(within(form).queryByLabelText("ステータス")).toBeNull();
  });

  it("入力して追加すると Todo として onCreate が呼ばれ、成功すると入力欄が空に戻る", async () => {
    const onCreate = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    render(<NewTaskPanel onCreate={onCreate} />);
    const form = screen.getByRole("form", { name: "タスクを追加" });

    await user.type(within(form).getByLabelText("タイトル"), "  掃除  ");
    await user.type(within(form).getByLabelText("説明"), "部屋");
    await user.click(within(form).getByRole("button", { name: "追加" }));

    expect(onCreate).toHaveBeenCalledWith({ title: "掃除", description: "部屋", status: "todo" });
    expect(within(form).getByLabelText<HTMLInputElement>("タイトル").value).toBe("");
  });

  it("onCreate が失敗を返すと入力内容が残る", async () => {
    const onCreate = vi.fn().mockResolvedValue(false);
    const user = userEvent.setup();
    render(<NewTaskPanel onCreate={onCreate} />);
    const form = screen.getByRole("form", { name: "タスクを追加" });

    await user.type(within(form).getByLabelText("タイトル"), "掃除");
    await user.click(within(form).getByRole("button", { name: "追加" }));

    expect(within(form).getByLabelText<HTMLInputElement>("タイトル").value).toBe("掃除");
  });
});
