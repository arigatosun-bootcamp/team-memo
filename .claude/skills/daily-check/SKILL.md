---
name: daily-check
description: 指定Dayの完了チェックリストを実コードと照合する
argument-hint: "[Day番号 1-5]"
---

# Day $ARGUMENTS チェックリスト

指定されたDayのチェック項目を、実際のプロジェクト状態と照合して達成状況を報告してください。

以下の各Dayのチェック項目から Day $ARGUMENTS に該当する項目を確認し、
実際にファイルやgit状態をチェックして「達成 / 未達成」を判定してください。

---

## Day 1: オリエン + Logic Gate

確認コマンド:
```bash
git branch -a
gh pr list --state all
```

チェック項目:
- [ ] `docs/logic-gate/L1_requirements.md` の各セクションが埋まっている
- [ ] `docs/logic-gate/L2_validation.md` のテーブルが最低8行ある
- [ ] `docs/logic-gate/L3_testplan.md` のテーブルが12ケース以上ある
- [ ] mainブランチ以外のブランチが作成されている
- [ ] Draft PR が作成されている
- [ ] PR本文に「何を決めたか」「確認方法」が記載されている

---

## Day 2: アカウント作成 + E2E疎通

確認コマンド:
```bash
ls -la .env.local 2>/dev/null && echo "存在する" || echo "存在しない"
cat .gitignore | grep env
npm run build 2>&1 | tail -5
```

チェック項目:
- [ ] `.env.local` が存在する
- [ ] `.env.local` が `.gitignore` に含まれている
- [ ] Supabase関連のコード（接続設定）が存在する
- [ ] insert/readの処理が実装されている
- [ ] 1PR = 1Issueで提出されている（PRとIssueの数が対応）
- [ ] 各PRに動作確認手順が記載されている

---

## Day 3: LLM導入 + テスト

確認コマンド:
```bash
npm test 2>&1
find src -name "*.test.*" -type f 2>/dev/null
```

チェック項目:
- [ ] LLM出力の構造化（JSON schema等）が実装されている
- [ ] バリデーション関数が存在する
- [ ] 再試行ロジックが実装されている（最大回数の設定あり）
- [ ] 失敗理由の保存/ログ機能がある
- [ ] テストファイルが存在する（最低3本）
- [ ] 異常系テストが1本以上含まれている
- [ ] `npm test` が全件パスする

---

## Day 4: デプロイ + デモ

確認コマンド:
```bash
npm run lint 2>&1
npm test 2>&1
npm run build 2>&1
```

チェック項目:
- [ ] `npm run lint` がパスする
- [ ] `npm test` がパスする
- [ ] `npm run build` が成功する
- [ ] `.env.example` にすべての環境変数キーが記載されている
- [ ] README.mdに起動手順・確認手順がある
- [ ] Vercelデプロイ設定がある（vercel.json またはVercel連携済み）

---

## Day 5: バグ調査・修正

確認コマンド:
```bash
gh pr list --state all --label bug
git log --oneline -10
```

チェック項目:
- [ ] 再現手順がIssueまたはPRに記載されている
- [ ] 原因仮説が記載されている（2〜3候補）
- [ ] 修正コミットが存在する
- [ ] 再発防止のテストが追加されている
- [ ] PRに「なぜ起きた / 何を直した / どう確認した」が記載されている

---

## 結果フォーマット

各項目を以下の形式で報告してください：

```
Day {N} チェック結果:
  [✅] 項目名 — 確認内容
  [❌] 項目名 — 不足している内容と対応方法
  [⚠️] 項目名 — 部分的に達成（詳細）

達成率: X / Y 項目
```
