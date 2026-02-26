import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET: ユーザーの通知一覧を取得
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const unreadOnly = searchParams.get("unread_only") === "true";

  if (!userId) {
    return NextResponse.json(
      { error: "ユーザーIDは必須です" },
      { status: 400 }
    );
  }

  let query = supabase
    .from("notifications")
    .select("*, actor:profiles!notifications_actor_id_profiles_fkey(display_name, avatar_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data: notifications, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 未読数も返す
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return NextResponse.json({
    notifications: notifications || [],
    unreadCount: count || 0,
  });
}

// PATCH: 通知を既読にする
export async function PATCH(request: NextRequest) {
  const { notification_ids, mark_all, user_id } = await request.json();

  if (!user_id) {
    return NextResponse.json(
      { error: "ユーザーIDは必須です" },
      { status: 400 }
    );
  }

  if (mark_all) {
    // 全て既読にする
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user_id)
      .eq("is_read", false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (notification_ids && notification_ids.length > 0) {
    // 指定IDを既読にする
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", notification_ids)
      .eq("user_id", user_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ message: "既読にしました" });
}
