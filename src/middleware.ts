import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 管理者パネルへのアクセスを制限するミドルウェア
 */
export async function middleware(request: NextRequest) {
  // 管理者パス（画面・API両方）へのアクセスをチェック
  if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/api/admin")) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Cookie からセッショントークンを取得
    const token = request.cookies.get("sb-access-token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      // profiles テーブルからロールを確認
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        // API リクエストの場合はJSONで403を返す
        if (request.nextUrl.pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
