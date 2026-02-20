-- テスト用ユーザーを作成
-- メールアドレス: testuser@example.com
-- パスワード: Test1234!
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- auth.users にテストユーザーを挿入
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token
  ) VALUES (
    test_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'testuser@example.com',
    extensions.crypt('Test1234!', extensions.gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "テストユーザー"}',
    now(),
    now(),
    ''
  );

  -- auth.identities にメール認証情報を挿入
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    test_user_id,
    jsonb_build_object('sub', test_user_id::text, 'email', 'testuser@example.com', 'email_verified', true),
    'email',
    test_user_id::text,
    now(),
    now(),
    now()
  );
END $$;
