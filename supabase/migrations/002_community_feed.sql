-- Community posts (open Q&A -- anyone can post, anyone can reply)
create table if not exists public.community_posts (
  id uuid default gen_random_uuid() primary key,
  nickname text not null,
  content text not null,
  hours_into_fast numeric,
  fast_target_hours numeric,
  created_at timestamptz default now()
);

alter table public.community_posts enable row level security;

create policy "Anyone can read posts" on community_posts
  for select using (true);

create policy "Anyone can create posts" on community_posts
  for insert with check (true);

-- Replies to community posts
create table if not exists public.community_replies (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.community_posts(id) on delete cascade not null,
  nickname text not null,
  content text not null,
  hours_into_fast numeric,
  created_at timestamptz default now()
);

alter table public.community_replies enable row level security;

create policy "Anyone can read replies" on community_replies
  for select using (true);

create policy "Anyone can create replies" on community_replies
  for insert with check (true);

-- Indexes
create index if not exists idx_community_posts_created on community_posts(created_at desc);
create index if not exists idx_community_replies_post on community_replies(post_id);

-- Realtime
alter publication supabase_realtime add table community_posts;
alter publication supabase_realtime add table community_replies;
