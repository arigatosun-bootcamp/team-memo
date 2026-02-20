-- prompt_logsのアクセス権を修正
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT ALL ON prompt_logs TO anon;
GRANT ALL ON prompt_logs TO authenticated;

-- 既存のRLSポリシーを再作成
DROP POLICY IF EXISTS "anon_insert_prompt_logs" ON prompt_logs;
DROP POLICY IF EXISTS "authenticated_insert_prompt_logs" ON prompt_logs;

CREATE POLICY "allow_insert_prompt_logs"
  ON prompt_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "allow_select_prompt_logs"
  ON prompt_logs
  FOR SELECT
  TO anon, authenticated
  USING (true);
