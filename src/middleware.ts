import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 管理者パネルへのアクセスを制限するミドルウェア
 *
 * Bug 15a: matcher が "/admin/:path*" のみで、"/api/admin/:path*" を含んでいない
 * そのため、管理者画面にはアクセスできないが、管理者APIには誰でもアクセスできる
 */
export async function middleware(request: NextRequest) {
  // 管理者パスへのアクセスをチェック
  if (request.nextUrl.pathname.startsWith("/admin")) {
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
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

// Bug 15a: "/api/admin/:path*" が含まれていないため、APIルートは保護されない
export const config = {
  matcher: ["/admin/:path*"],
};
