import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
  TITLE_MAX_LENGTH,
  type Task,
} from "@/lib/tasks";

const testUrl = "https://example.supabase.co";
const testKey = "sb_publishable_test";

const sampleTask: Task = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "買い物",
  description: "牛乳を買う",
  status: "todo",
  created_at: "2026-09-28T00:00:00+00:00",
  updated_at: "2026-09-28T00:00:00+00:00",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// fetch に渡された URL・メソッド・ボディを取り出す
function lastRequest(fetchMock: ReturnType<typeof vi.fn>) {
  const [input, init] = fetchMock.mock.calls.at(-1) as [
    string | URL,
    RequestInit | undefined,
  ];
  const url = new URL(String(input));
  const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
  return { url, method: init?.method ?? "GET", body };
}

describe("タスクのデータアクセス", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", testUrl);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", testKey);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("fetchTasks", () => {
    it("tasks テーブルを作成日時の昇順で取得してタスク一覧を返す", async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse([sampleTask]));
      vi.stubGlobal("fetch", fetchMock);

      const tasks = await fetchTasks();

      expect(tasks).toEqual([sampleTask]);
      const { url, method } = lastRequest(fetchMock);
      expect(method).toBe("GET");
      expect(url.pathname).toBe("/rest/v1/tasks");
      expect(url.searchParams.get("order")).toBe("created_at.asc");
    });

    it("タスクが0件なら空配列を返す", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([])));

      await expect(fetchTasks()).resolves.toEqual([]);
    });

    it("サーバーがエラーを返すと例外を投げる", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(jsonResponse({ message: "permission denied" }, 401)),
      );

      await expect(fetchTasks()).rejects.toThrow("permission denied");
    });

    it("環境変数が未設定だと通信せずに例外を投げる", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      await expect(fetchTasks()).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("createTask", () => {
    it("入力内容を POST して作成されたタスクを返す", async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(sampleTask, 201));
      vi.stubGlobal("fetch", fetchMock);

      const task = await createTask({
        title: "買い物",
        description: "牛乳を買う",
        status: "todo",
      });

      expect(task).toEqual(sampleTask);
      const { url, method, body } = lastRequest(fetchMock);
      expect(method).toBe("POST");
      expect(url.pathname).toBe("/rest/v1/tasks");
      expect(body).toEqual({ title: "買い物", description: "牛乳を買う", status: "todo" });
    });

    it("タイトルの前後の空白を取り除いて送信する", async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(sampleTask, 201));
      vi.stubGlobal("fetch", fetchMock);

      await createTask({ title: "  買い物  ", description: "", status: "todo" });

      expect(lastRequest(fetchMock).body.title).toBe("買い物");
    });

    it.each([
      ["空文字", ""],
      ["空白のみ", "   "],
      [`${TITLE_MAX_LENGTH + 1}文字`, "あ".repeat(TITLE_MAX_LENGTH + 1)],
    ])("タイトルが%sだと通信せずに例外を投げる", async (_label, title) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        createTask({ title, description: "", status: "todo" }),
      ).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it(`タイトルがちょうど${TITLE_MAX_LENGTH}文字なら作成できる`, async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(sampleTask, 201));
      vi.stubGlobal("fetch", fetchMock);

      await createTask({
        title: "あ".repeat(TITLE_MAX_LENGTH),
        description: "",
        status: "todo",
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("サーバーがエラーを返すと例外を投げる", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(jsonResponse({ message: "insert failed" }, 400)),
      );

      await expect(
        createTask({ title: "買い物", description: "", status: "todo" }),
      ).rejects.toThrow("insert failed");
    });
  });

  describe("updateTask", () => {
    it("対象 ID のタスクを PATCH して更新後のタスクを返す", async () => {
      const updated: Task = { ...sampleTask, title: "買い物（済）", status: "done" };
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(updated));
      vi.stubGlobal("fetch", fetchMock);

      const task = await updateTask(sampleTask.id, {
        title: "買い物（済）",
        description: "牛乳を買う",
        status: "done",
      });

      expect(task).toEqual(updated);
      const { url, method, body } = lastRequest(fetchMock);
      expect(method).toBe("PATCH");
      expect(url.pathname).toBe("/rest/v1/tasks");
      expect(url.searchParams.get("id")).toBe(`eq.${sampleTask.id}`);
      expect(body).toEqual({
        title: "買い物（済）",
        description: "牛乳を買う",
        status: "done",
      });
    });

    it("タイトルが空白のみだと通信せずに例外を投げる", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        updateTask(sampleTask.id, { title: " ", description: "", status: "todo" }),
      ).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("サーバーがエラーを返すと例外を投げる", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(jsonResponse({ message: "update failed" }, 400)),
      );

      await expect(
        updateTask(sampleTask.id, { title: "買い物", description: "", status: "todo" }),
      ).rejects.toThrow("update failed");
    });
  });

  describe("deleteTask", () => {
    it("対象 ID のタスクを DELETE する", async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
      vi.stubGlobal("fetch", fetchMock);

      await expect(deleteTask(sampleTask.id)).resolves.toBeUndefined();

      const { url, method } = lastRequest(fetchMock);
      expect(method).toBe("DELETE");
      expect(url.pathname).toBe("/rest/v1/tasks");
      expect(url.searchParams.get("id")).toBe(`eq.${sampleTask.id}`);
    });

    it("サーバーがエラーを返すと例外を投げる", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(jsonResponse({ message: "delete failed" }, 400)),
      );

      await expect(deleteTask(sampleTask.id)).rejects.toThrow("delete failed");
    });
  });
});
