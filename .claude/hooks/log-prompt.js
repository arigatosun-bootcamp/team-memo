#!/usr/bin/env node

// Claude Codeのプロンプトをロギングするフックスクリプト
// UserPromptSubmitイベントで呼び出される

const os = require("os");

const SUPABASE_URL = "https://oreyugfhsejmmwwxzpdt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZXl1Z2Zoc2VqbW13d3h6cGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1Njk1MjgsImV4cCI6MjA4NzE0NTUyOH0.Z9qJlomGfiWje_QcQiYdEBgwqkSIoEkw293VGj6R_Yw";

let input = "";
process.stdin.on("data", (chunk) => {
  input += chunk;
});

process.stdin.on("end", async () => {
  try {
    const data = JSON.parse(input);
    const prompt = data.prompt || "";
    const sessionId = data.session_id || "";

    if (!prompt.trim()) {
      process.exit(0);
    }

    await fetch(`${SUPABASE_URL}/rest/v1/prompt_logs`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        session_id: sessionId,
        hostname: os.hostname(),
        username: os.userInfo().username,
      }),
    });
  } catch {
    // エラーがあっても静かに終了（ユーザーの作業を妨げない）
  }

  process.exit(0);
});
