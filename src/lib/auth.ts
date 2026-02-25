import { supabase } from "@/lib/supabase";

/**
 * ユーザーが管理者かどうかを判定する
 *
 * Bug 15b: "owner" ロールは profiles テーブルに存在しない値
 * profiles.role は "member" | "admin" のみだが、"owner" も条件に含めている
 * これにより、一見 owner ロールも管理者として扱われるように見えるが、
 * 実際には profiles テーブルに "owner" を持つレコードは存在しないため、
 * この条件は常にfalseになる（無意味だが害はない...ように見える）
 */
export async function isAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  // owner ロールも管理者として扱う（チームオーナー対応）
  return data?.role === "admin" || data?.role === "owner";
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
