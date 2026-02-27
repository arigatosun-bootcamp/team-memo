import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET: 自分のプロフィールを取得
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json(
      { error: "ユーザーIDは必須です" },
      { status: 400 }
    );
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}

// PUT: プロフィールを更新
export async function PUT(request: NextRequest) {
  const { user_id, display_name, avatar_url } = await request.json();

  if (!user_id || !display_name) {
    return NextResponse.json(
      { error: "ユーザーIDと表示名は必須です" },
      { status: 400 }
    );
  }

  // profiles テーブルを更新
  const { data: profile, error } = await supabase
    .from("profiles")
    .update({
      display_name,
      avatar_url: avatar_url || null,
    })
    .eq("id", user_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // auth.users の user_metadata も同期更新する
  const { error: authError } = await supabase.auth.admin.updateUserById(user_id, {
    user_metadata: {
      display_name,
      avatar_url: avatar_url || null,
    },
  });

  if (authError) {
    console.error("auth.usersのメタデータ更新に失敗:", authError);
  }

  return NextResponse.json({ profile });
}
