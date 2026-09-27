import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkSupabaseConnection } from "@/lib/supabase/checkConnection";

const testUrl = "https://example.supabase.co";
const testKey = "sb_publishable_test";

describe("checkSupabaseConnection", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", testUrl);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", testKey);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("ヘルスチェックが 200 を返すと接続成功になる", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSupabaseConnection();

    expect(result).toEqual({ ok: true, url: testUrl });
    expect(fetchMock).toHaveBeenCalledWith(`${testUrl}/auth/v1/health`, {
      headers: { apikey: testKey },
    });
  });

  it("キーが無効で 401 が返ると接続失敗になりステータスを含む", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("", { status: 401, statusText: "Unauthorized" }),
      ),
    );

    const result = await checkSupabaseConnection();

    expect(result).toEqual({ ok: false, message: "HTTP 401 Unauthorized" });
  });

  it("ネットワークエラーが起きると接続失敗になりエラー内容を含む", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));

    const result = await checkSupabaseConnection();

    expect(result).toEqual({ ok: false, message: "fetch failed" });
  });

  it.each([
    ["URL", "NEXT_PUBLIC_SUPABASE_URL"],
    ["キー", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  ])("%s が空文字だと通信せずに接続失敗になる", async (_label, name) => {
    vi.stubEnv(name, "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSupabaseConnection();

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
