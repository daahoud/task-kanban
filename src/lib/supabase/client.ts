import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

export function createSupabaseClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createClient(url, publishableKey);
}
