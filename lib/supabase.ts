import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isConfigured = url !== "" && key !== "";

// One shared Supabase client for the whole app. Runs in the browser only.
export const supabase = createClient(url || "http://missing-config.invalid", key || "missing");
