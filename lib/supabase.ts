"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) && anonKey.length > 40;

let singleton: SupabaseClient | null = null;

export function getSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Add the required GitHub repository secrets or local environment variables.");
  }
  singleton ??= createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return singleton;
}
