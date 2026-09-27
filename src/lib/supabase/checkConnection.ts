import { getSupabaseEnv } from "./env";

export type ConnectionResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

// Supabase の API ゲートウェイにヘルスチェックを送り、URL とキーが有効かを確認する
export async function checkSupabaseConnection(): Promise<ConnectionResult> {
  let env;
  try {
    env = getSupabaseEnv();
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }

  try {
    const response = await fetch(`${env.url}/auth/v1/health`, {
      headers: { apikey: env.publishableKey },
    });
    if (!response.ok) {
      return {
        ok: false,
        message: `HTTP ${response.status} ${response.statusText}`.trim(),
      };
    }
    return { ok: true, url: env.url };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}
