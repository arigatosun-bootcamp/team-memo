import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "メッセージが必要です" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini APIキーが設定されていません" },
        { status: 500 }
      );
    }

    // Gemini API にリクエストを送信
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: message }],
            },
          ],
          systemInstruction: {
            parts: [
              {
                text: "あなたはTeamMemoアプリの社内アシスタントです。日本語で簡潔かつ丁寧に回答してください。メモの作成・編集・検索の使い方、社内のナレッジ共有のベストプラクティスについてサポートします。回答は200文字以内を目安にしてください。",
              },
            ],
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Gemini APIでエラーが発生しました" },
        { status: response.status }
      );
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "回答を生成できませんでした";

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: "チャットの処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
