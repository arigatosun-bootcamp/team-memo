-- プロンプトログテーブル（Claude Codeの利用状況をレビュー用に記録）
CREATE TABLE IF NOT EXISTS prompt_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt TEXT NOT NULL,
  session_id TEXT,
  hostname TEXT,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- anonロールでINSERTを許可（フックスクリプトからの書き込み用）
ALTER TABLE prompt_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_prompt_logs"
  ON prompt_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- authenticatedロールでもINSERTを許可
CREATE POLICY "authenticated_insert_prompt_logs"
  ON prompt_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- GRANTでテーブルへのアクセス権を付与
GRANT INSERT ON prompt_logs TO anon;
GRANT INSERT ON prompt_logs TO authenticated;
GRANT SELECT ON prompt_logs TO authenticated;
