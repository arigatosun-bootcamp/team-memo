#!/usr/bin/env node
// セッション終了時に会話ログを自動保存するフック
// ユーザーが送ったプロンプト一覧 + 原本JSONLを .claude/logs/ に保存する

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

let stdinData = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  stdinData += chunk;
});
process.stdin.on("end", () => {
  try {
    main(stdinData);
  } catch (e) {
    writeDebug("main error (end): " + e.message + "\n" + e.stack);
    process.exit(0);
  }
});
setTimeout(() => {
  try {
    main(stdinData);
  } catch (e) {
    writeDebug("main error (timeout): " + e.message);
    process.exit(0);
  }
}, 5000);

// プロジェクトディレクトリ: 環境変数 or カレントディレクトリ
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function writeDebug(msg) {
  try {
    const logDir = path.join(PROJECT_DIR, ".claude", "logs");
    fs.mkdirSync(logDir, { recursive: true });
    const debugFile = path.join(logDir, "hook-debug.log");
    const ts = new Date().toISOString();
    fs.appendFileSync(debugFile, `[${ts}] ${msg}\n`, "utf8");
  } catch {}
}

function main(stdin) {
  writeDebug("=== Stop hook 開始 ===");
  writeDebug("PROJECT_DIR: " + PROJECT_DIR);
  writeDebug("stdin長さ: " + (stdin || "").length);
  writeDebug("stdin内容: " + (stdin || "").slice(0, 500));

  const logDir = path.join(PROJECT_DIR, ".claude", "logs");
  fs.mkdirSync(logDir, { recursive: true });

  // セッションIDを取得
  let sessionId;
  try {
    const hookData = JSON.parse(stdin);
    sessionId = hookData.session_id;
    writeDebug("stdin keys: " + Object.keys(hookData).join(", "));
  } catch (e) {
    writeDebug("stdin JSONパース失敗: " + e.message);
  }
  sessionId = sessionId || process.env.CLAUDE_SESSION_ID;
  if (!sessionId) {
    writeDebug("ERROR: セッションIDが取得できない → 終了");
    return;
  }
  writeDebug("セッションID: " + sessionId);

  // Claude Codeの内部データからJSONLファイルを探す
  const homeDir = process.env.USERPROFILE || process.env.HOME;
  const claudeProjectsDir = path.join(homeDir, ".claude", "projects");

  // プロジェクト名でディレクトリを走査して探す
  const projectBaseName = path.basename(PROJECT_DIR);
  let jsonlPath = null;

  try {
    const dirs = fs.readdirSync(claudeProjectsDir);
    writeDebug("projects内ディレクトリ: " + dirs.join(", "));

    // プロジェクト名を含むディレクトリを探す
    const match = dirs.find(
      (d) => d.endsWith(projectBaseName)
    );
    if (match) {
      const candidate = path.join(claudeProjectsDir, match, sessionId + ".jsonl");
      writeDebug("候補パス: " + candidate);
      if (fs.existsSync(candidate)) {
        jsonlPath = candidate;
      }
    }

    // 見つからなければプロジェクト名を含む全ディレクトリで探す
    if (!jsonlPath) {
      for (const d of dirs) {
        if (d.includes(projectBaseName)) {
          const candidate = path.join(claudeProjectsDir, d, sessionId + ".jsonl");
          if (fs.existsSync(candidate)) {
            jsonlPath = candidate;
            writeDebug("部分一致で発見: " + d);
            break;
          }
        }
      }
    }
  } catch (e) {
    writeDebug("ディレクトリ走査エラー: " + e.message);
  }

  if (!jsonlPath) {
    writeDebug("ERROR: JSONLファイルが見つからない → 終了");
    return;
  }
  writeDebug("JSONLファイル発見: " + jsonlPath);

  // メタデータ取得
  let branch = "unknown";
  try {
    branch = execSync("git branch --show-current", {
      cwd: PROJECT_DIR,
      encoding: "utf8",
      timeout: 5000,
    }).trim();
  } catch {}

  let gitUser = "unknown";
  try {
    gitUser = execSync("git config user.name", {
      cwd: PROJECT_DIR,
      encoding: "utf8",
      timeout: 5000,
    }).trim();
  } catch {}

  // JSONLを解析してユーザーメッセージを抽出
  const lines = fs.readFileSync(jsonlPath, "utf8").split("\n").filter(Boolean);
  const userMessages = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.type === "user" && entry.message) {
        const content = entry.message.content;
        let text = "";
        if (typeof content === "string") {
          text = content;
        } else if (Array.isArray(content)) {
          text = content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("\n");
          const imageCount = content.filter(
            (block) => block.type === "image"
          ).length;
          if (imageCount > 0) {
            text += `\n[画像 ${imageCount}枚添付]`;
          }
        }
        if (text.trim()) {
          userMessages.push({
            timestamp: entry.timestamp || "",
            content: text.trim(),
          });
        }
      }
    } catch {}
  }

  // Markdownログを生成
  const now = new Date();
  const projectName = path.basename(PROJECT_DIR);
  let md = `# Claude Code セッションログ\n\n`;
  md += `| 項目 | 値 |\n`;
  md += `|------|----|\n`;
  md += `| **プロジェクト** | ${projectName} |\n`;
  md += `| **日時** | ${now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} |\n`;
  md += `| **ユーザー** | ${gitUser} |\n`;
  md += `| **ブランチ** | ${branch} |\n`;
  md += `| **セッションID** | \`${sessionId}\` |\n`;
  md += `| **プロンプト数** | ${userMessages.length} |\n\n`;
  md += `---\n\n`;
  md += `## プロンプト一覧\n\n`;

  for (let i = 0; i < userMessages.length; i++) {
    const msg = userMessages[i];
    const time = msg.timestamp
      ? new Date(msg.timestamp).toLocaleString("ja-JP", {
          timeZone: "Asia/Tokyo",
        })
      : "";
    md += `### ${i + 1}. [${time}]\n\n`;
    md += `\`\`\`\n${msg.content}\n\`\`\`\n\n`;
  }

  const mdFile = path.join(logDir, `${sessionId}.md`);
  const jsonlCopy = path.join(logDir, `${sessionId}.jsonl`);

  fs.writeFileSync(mdFile, md, "utf8");
  fs.copyFileSync(jsonlPath, jsonlCopy);

  writeDebug("ログ保存完了: " + mdFile);
  writeDebug("=== Stop hook 完了 ===");
}
