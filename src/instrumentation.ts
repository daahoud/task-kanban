// Next.js サーバー起動時に1度だけ呼ばれる
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { checkSupabaseConnection } = await import(
    "@/lib/supabase/checkConnection"
  );
  const result = await checkSupabaseConnection();

  if (!result.ok) {
    console.error(`[Supabase] 接続失敗: ${result.message}`);
  }
}
