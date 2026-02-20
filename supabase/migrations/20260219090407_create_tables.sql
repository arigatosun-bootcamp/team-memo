-- profiles テーブル: ユーザープロフィール情報
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- memos テーブル: メモ本体
create table memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  content text not null,
  category text not null default 'general'
    check (category in ('general', 'tech', 'meeting', 'idea', 'other')),
  is_private boolean not null default false,
  summary text,
  likes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- likes テーブル: いいね
create table likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  memo_id uuid not null references memos on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, memo_id)
);

-- インデックス
create index idx_memos_user_id on memos (user_id);
create index idx_memos_is_private on memos (is_private);
create index idx_memos_category on memos (category);
create index idx_memos_updated_at on memos (updated_at desc);
create index idx_likes_memo_id on likes (memo_id);
create index idx_likes_user_id on likes (user_id);

-- RLS（Row Level Security）を有効化
alter table profiles enable row level security;
alter table memos enable row level security;
alter table likes enable row level security;

-- profiles ポリシー
create policy "プロフィールは誰でも閲覧可能"
  on profiles for select
  using (true);

create policy "自分のプロフィールのみ作成可能"
  on profiles for insert
  with check (auth.uid() = id);

create policy "自分のプロフィールのみ更新可能"
  on profiles for update
  using (auth.uid() = id);

-- memos ポリシー
create policy "公開メモは誰でも閲覧可能"
  on memos for select
  using (is_private = false or auth.uid() = user_id);

create policy "認証ユーザーはメモを作成可能"
  on memos for insert
  with check (auth.uid() = user_id);

create policy "自分のメモのみ更新可能"
  on memos for update
  using (auth.uid() = user_id);

create policy "自分のメモのみ削除可能"
  on memos for delete
  using (auth.uid() = user_id);

-- likes ポリシー
create policy "いいねは誰でも閲覧可能"
  on likes for select
  using (true);

create policy "認証ユーザーはいいね可能"
  on likes for insert
  with check (auth.uid() = user_id);

create policy "自分のいいねのみ削除可能"
  on likes for delete
  using (auth.uid() = user_id);

-- サインアップ時に自動でプロフィールを作成するトリガー
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'ユーザー'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
