import { supabaseAdmin as supabase } from "@/lib/supabase";

/**
 * ユーザーが管理者かどうかを判定する
 */
export async function isAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return data?.role === "admin";
}

/**
 * 現在のログインユーザーを取得する
 */
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
