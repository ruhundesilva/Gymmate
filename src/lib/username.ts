import { supabase } from "./supabase";

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data } = await supabase
    .from("public_profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  return !data;
}
