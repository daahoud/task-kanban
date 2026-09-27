export type SupabaseEnv = {
  url: string;
  publishableKey: string;
};

// .env.local の NEXT_PUBLIC_SUPABASE_* を読み込む。未設定なら例外を投げる
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY を .env.local に設定してください",
    );
  }

  return { url, publishableKey };
}
