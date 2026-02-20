-- 手動挿入した不正なテストユーザーを削除
-- auth.users の ON DELETE CASCADE により auth.identities と profiles も自動削除される
delete from auth.users where email = 'testuser@example.com';
