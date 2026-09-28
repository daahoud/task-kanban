import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useTasks } from "@/hooks/useTasks";
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
  type Task,
  type TaskInput,
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

const input: TaskInput = { title: "掃除", description: "", status: "todo" };

async function renderLoaded(tasks: Task[]) {
  vi.mocked(fetchTasks).mockResolvedValue(tasks);
  const hook = renderHook(() => useTasks());
  await waitFor(() => expect(hook.result.current.loadState).toBe("loaded"));
  return hook;
}

describe("useTasks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("読み込み", () => {
    it("取得が終わるまでは loading で、一覧は空", () => {
      vi.mocked(fetchTasks).mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useTasks());

      expect(result.current.loadState).toBe("loading");
      expect(result.current.tasks).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("取得に成功すると loaded になり、取得したタスクを持つ", async () => {
      const tasks = [makeTask({ id: "1" }), makeTask({ id: "2" })];

      const { result } = await renderLoaded(tasks);

      expect(result.current.tasks).toEqual(tasks);
      expect(result.current.error).toBeNull();
    });

    it("取得に失敗すると failed になり、読み込み失敗のエラーを持つ", async () => {
      vi.mocked(fetchTasks).mockRejectedValue(new Error("network error"));

      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loadState).toBe("failed"));
      expect(result.current.error).toBe("タスクの読み込みに失敗しました");
    });

    it("取得完了前にアンマウントしても状態を更新しない", async () => {
      let resolve: (tasks: Task[]) => void = () => {};
      vi.mocked(fetchTasks).mockReturnValue(new Promise((r) => (resolve = r)));
      const { result, unmount } = renderHook(() => useTasks());

      unmount();
      await act(async () => resolve([makeTask()]));

      expect(result.current.loadState).toBe("loading");
      expect(result.current.tasks).toEqual([]);
    });
  });

  describe("追加", () => {
    it("成功すると API が返したタスクを末尾に加え、true を返す", async () => {
      const { result } = await renderLoaded([makeTask({ id: "1" })]);
      const created = makeTask({ id: "new", title: "掃除" });
      vi.mocked(createTask).mockResolvedValue(created);

      let succeeded = false;
      await act(async () => {
        succeeded = await result.current.addTask(input);
      });

      expect(succeeded).toBe(true);
      expect(createTask).toHaveBeenCalledWith(input);
      expect(result.current.tasks.map((task) => task.id)).toEqual(["1", "new"]);
      expect(fetchTasks).toHaveBeenCalledTimes(1);
    });

    it("失敗すると一覧は変わらず、追加失敗のエラーを持ち false を返す", async () => {
      const { result } = await renderLoaded([makeTask({ id: "1" })]);
      vi.mocked(createTask).mockRejectedValue(new Error("insert failed"));

      let succeeded = true;
      await act(async () => {
        succeeded = await result.current.addTask(input);
      });

      expect(succeeded).toBe(false);
      expect(result.current.error).toBe("タスクの追加に失敗しました");
      expect(result.current.tasks.map((task) => task.id)).toEqual(["1"]);
    });

    it("失敗のあとに成功するとエラーが消える", async () => {
      const { result } = await renderLoaded([]);
      vi.mocked(createTask)
        .mockRejectedValueOnce(new Error("insert failed"))
        .mockResolvedValueOnce(makeTask({ id: "new" }));

      await act(async () => {
        await result.current.addTask(input);
      });
      expect(result.current.error).toBe("タスクの追加に失敗しました");

      await act(async () => {
        await result.current.addTask(input);
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe("更新", () => {
    it("成功すると対象のタスクだけを API が返した内容に置き換え、true を返す", async () => {
      const { result } = await renderLoaded([
        makeTask({ id: "1", title: "買い物" }),
        makeTask({ id: "2", title: "掃除" }),
      ]);
      const updated = makeTask({ id: "1", title: "まとめ買い", status: "done" });
      vi.mocked(updateTask).mockResolvedValue(updated);

      let succeeded = false;
      await act(async () => {
        succeeded = await result.current.editTask("1", {
          title: "まとめ買い",
          description: "牛乳を買う",
          status: "done",
        });
      });

      expect(succeeded).toBe(true);
      expect(result.current.tasks).toEqual([updated, makeTask({ id: "2", title: "掃除" })]);
    });

    it("失敗すると一覧は変わらず、更新失敗のエラーを持ち false を返す", async () => {
      const original = makeTask({ id: "1" });
      const { result } = await renderLoaded([original]);
      vi.mocked(updateTask).mockRejectedValue(new Error("update failed"));

      let succeeded = true;
      await act(async () => {
        succeeded = await result.current.editTask("1", input);
      });

      expect(succeeded).toBe(false);
      expect(result.current.error).toBe("タスクの更新に失敗しました");
      expect(result.current.tasks).toEqual([original]);
    });
  });

  describe("削除", () => {
    it("成功すると対象のタスクだけを一覧から取り除く", async () => {
      const { result } = await renderLoaded([makeTask({ id: "1" }), makeTask({ id: "2" })]);
      vi.mocked(deleteTask).mockResolvedValue(undefined);

      await act(async () => {
        await result.current.removeTask("1");
      });

      expect(deleteTask).toHaveBeenCalledWith("1");
      expect(result.current.tasks.map((task) => task.id)).toEqual(["2"]);
      expect(result.current.error).toBeNull();
    });

    it("失敗すると一覧は変わらず、削除失敗のエラーを持つ", async () => {
      const { result } = await renderLoaded([makeTask({ id: "1" })]);
      vi.mocked(deleteTask).mockRejectedValue(new Error("delete failed"));

      await act(async () => {
        await result.current.removeTask("1");
      });

      expect(result.current.error).toBe("タスクの削除に失敗しました");
      expect(result.current.tasks.map((task) => task.id)).toEqual(["1"]);
    });
  });
});
