-- ============================================
-- 新機能追加マイグレーション
-- コメント、ブックマーク、通知、タグ機能
-- ============================================

-- profiles テーブル拡張
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists role text not null default 'member'
  check (role in ('member', 'admin'));

-- memos テーブル拡張
alter table memos add column if not exists comments_count integer not null default 0;

-- comments テーブル
create table comments (
  id uuid primary key default gen_random_uuid(),
  memo_id uuid not null references memos on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  content text not null,
  parent_id uuid references comments on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- profiles とのJOIN用外部キー（PostgREST のスキーマ検出に必要）
  constraint comments_user_id_profiles_fkey foreign key (user_id) references profiles(id) on delete cascade
);

create index idx_comments_memo_id on comments (memo_id);
create index idx_comments_user_id on comments (user_id);
create index idx_comments_parent_id on comments (parent_id);

-- bookmarks テーブル
create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  memo_id uuid not null references memos on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, memo_id)
);

create index idx_bookmarks_user_id on bookmarks (user_id);
create index idx_bookmarks_memo_id on bookmarks (memo_id);

-- notifications テーブル
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  type text not null check (type in ('like', 'comment', 'mention', 'system')),
  title text not null,
  body text,
  memo_id uuid references memos on delete set null,
  actor_id uuid references auth.users on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  -- profiles とのJOIN用外部キー（PostgREST のスキーマ検出に必要）
  constraint notifications_user_id_profiles_fkey foreign key (user_id) references profiles(id) on delete cascade,
  constraint notifications_actor_id_profiles_fkey foreign key (actor_id) references profiles(id) on delete set null
);

create index idx_notifications_user_id on notifications (user_id);
create index idx_notifications_is_read on notifications (is_read);
create index idx_notifications_created_at on notifications (created_at desc);

-- tags テーブル
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#666666',
  created_at timestamptz not null default now()
);

-- memo_tags 中間テーブル（多対多リレーション）
create table memo_tags (
  memo_id uuid not null references memos on delete cascade,
  tag_id uuid not null references tags on delete cascade,
  primary key (memo_id, tag_id)
);

create index idx_memo_tags_tag_id on memo_tags (tag_id);

-- RLS 有効化
alter table comments enable row level security;
alter table bookmarks enable row level security;
alter table notifications enable row level security;
alter table tags enable row level security;
alter table memo_tags enable row level security;

-- comments ポリシー
create policy "コメントは誰でも閲覧可能"
  on comments for select using (true);

create policy "認証ユーザーはコメント可能"
  on comments for insert
  with check (auth.uid() = user_id);

create policy "自分のコメントのみ更新可能"
  on comments for update
  using (auth.uid() = user_id);

create policy "自分のコメントのみ削除可能"
  on comments for delete
  using (auth.uid() = user_id);

-- bookmarks ポリシー
create policy "自分のブックマークのみ閲覧可能"
  on bookmarks for select
  using (auth.uid() = user_id);

create policy "認証ユーザーはブックマーク可能"
  on bookmarks for insert
  with check (auth.uid() = user_id);

create policy "自分のブックマークのみ削除可能"
  on bookmarks for delete
  using (auth.uid() = user_id);

-- notifications ポリシー
create policy "自分の通知のみ閲覧可能"
  on notifications for select
  using (auth.uid() = user_id);

create policy "認証ユーザーは通知を作成可能"
  on notifications for insert
  with check (true);

create policy "自分の通知のみ更新可能"
  on notifications for update
  using (auth.uid() = user_id);

-- tags ポリシー
create policy "タグは誰でも閲覧可能"
  on tags for select using (true);

create policy "認証ユーザーはタグを作成可能"
  on tags for insert
  with check (auth.uid() is not null);

-- memo_tags ポリシー
create policy "メモタグは誰でも閲覧可能"
  on memo_tags for select using (true);

create policy "認証ユーザーはメモにタグ付け可能"
  on memo_tags for insert
  with check (auth.uid() is not null);

create policy "認証ユーザーはメモタグを削除可能"
  on memo_tags for delete
  using (auth.uid() is not null);
