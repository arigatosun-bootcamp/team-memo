-- anon と authenticated ロールにテーブルへのアクセス権限を付与
grant usage on schema public to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

grant select on public.memos to anon, authenticated;
grant insert, update, delete on public.memos to authenticated;

grant select on public.likes to anon, authenticated;
grant insert, delete on public.likes to authenticated;
