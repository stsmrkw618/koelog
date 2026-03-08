-- ============================
-- KoeLog: Supabase初期セットアップ
-- SQL Editorで実行してください
-- ============================

-- 1. 日次エントリーテーブル
create table entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  recorded_at timestamptz not null default now(),
  audio_url text,
  duration_seconds integer,
  transcript text not null,
  mood text default 'unanalyzed',
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. 週次サマリーテーブル
create table weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  week_start date not null,
  week_end date not null,
  highlight text,
  mood_sequence jsonb,
  topic_distribution jsonb,
  insight text,
  entry_count integer,
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

-- 3. RLS（Row Level Security）有効化
alter table entries enable row level security;
alter table weekly_summaries enable row level security;

-- 4. RLSポリシー: ログインユーザーは自分のデータのみアクセス可能
create policy "Users can manage own entries"
  on entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own summaries"
  on weekly_summaries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. updated_at 自動更新トリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger entries_updated_at
  before update on entries
  for each row execute function update_updated_at();

-- 6. Storageバケット作成（音声ファイル用）
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true);

-- 7. Storage RLSポリシー
create policy "Authenticated users can upload audio"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'audio');

create policy "Anyone can read audio"
  on storage.objects for select
  using (bucket_id = 'audio');
