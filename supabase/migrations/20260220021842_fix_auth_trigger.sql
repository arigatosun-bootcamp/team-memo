-- トリガーと関数を削除（Auth内部クエリへの干渉を解消）
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();
