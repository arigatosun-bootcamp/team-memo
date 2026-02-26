"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Memo, Tag } from "@/lib/types";
import Header from "@/components/Header";
import MemoForm from "@/components/MemoForm";
import TagInput from "@/components/TagInput";

export default function EditMemoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const [userName, setUserName] = useState<string | undefined>();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserName(user.user_metadata?.display_name);
      }

      // メモデータを取得
      const memoResponse = await fetch(`/api/memos/${id}`);
      if (memoResponse.ok) {
        const data = await memoResponse.json();
        setMemo(data);
      }

      // タグデータを取得
      const tagsResponse = await fetch(`/api/memos/${id}/tags`);
      if (tagsResponse.ok) {
        const data = await tagsResponse.json();
        setTags(data.tags || []);
      }

      setIsLoading(false);
    };
    init();
  }, [id]);

  const handleSubmit = async (data: { title: string; content: string; category: string }) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/memos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // タグの更新（既存タグを削除して新しいタグを追加）
        // 既存のメモタグを取得
        const existingTagsRes = await fetch(`/api/memos/${id}/tags`);
        const existingTagsData = await existingTagsRes.json();
        const existingTags: Tag[] = existingTagsData.tags || [];

        // 削除されたタグを除去
        for (const tag of existingTags) {
          if (!tags.some((t) => t.id === tag.id)) {
            await fetch(`/api/memos/${id}/tags?tag_id=${tag.id}`, {
              method: "DELETE",
            });
          }
        }

        // 新しいタグを追加
        for (const tag of tags) {
          if (!existingTags.some((t: Tag) => t.id === tag.id)) {
            await fetch(`/api/memos/${id}/tags`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tag_id: tag.id }),
            });
          }
        }

        router.push(`/memo/${id}`);
      } else {
        alert("メモの更新に失敗しました");
      }
    } catch {
      alert("メモの更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div>
        <Header userName={userName} userId={userId} onLogout={handleLogout} />
        <main style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
          <p>読み込み中...</p>
        </main>
      </div>
    );
  }

  if (!memo) {
    return (
      <div>
        <Header userName={userName} userId={userId} onLogout={handleLogout} />
        <main style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
          <p>メモが見つかりません</p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header userName={userName} userId={userId} onLogout={handleLogout} />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>
          メモを編集
        </h1>
        <MemoForm
          initialTitle={memo.title}
          initialContent={memo.content}
          initialCategory={memo.category as import("@/lib/types").Category}
          initialIsPrivate={memo.is_private}
          onSubmit={handleSubmit}
          isLoading={isSaving}
          submitLabel="更新する"
        />
        <div style={{ marginTop: "16px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
            タグ
          </label>
          <TagInput selectedTags={tags} onTagsChange={setTags} />
        </div>
      </main>
    </div>
  );
}
