-- Profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Fasts
create table if not exists public.fasts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  started_at timestamptz not null default now(),
  target_hours integer not null default 16,
  ended_at timestamptz,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now()
);

alter table public.fasts enable row level security;

create policy "Users can view own fasts"
  on fasts for select using (auth.uid() = user_id);

create policy "Users can view friends' active fasts"
  on fasts for select using (
    is_active = true and
    exists (
      select 1 from friendships
      where status = 'accepted'
      and (
        (requester_id = auth.uid() and addressee_id = fasts.user_id)
        or (addressee_id = auth.uid() and requester_id = fasts.user_id)
      )
    )
  );

create policy "Users can insert own fasts"
  on fasts for insert with check (auth.uid() = user_id);

create policy "Users can update own fasts"
  on fasts for update using (auth.uid() = user_id);

-- Mood entries
create table if not exists public.mood_entries (
  id uuid default gen_random_uuid() primary key,
  fast_id uuid references public.fasts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  mood_score integer not null check (mood_score between 1 and 5),
  note text,
  hours_into_fast numeric not null,
  created_at timestamptz default now()
);

alter table public.mood_entries enable row level security;

create policy "Users can view own mood entries"
  on mood_entries for select using (auth.uid() = user_id);

create policy "Users can insert own mood entries"
  on mood_entries for insert with check (auth.uid() = user_id);

-- Friendships
create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  unique(requester_id, addressee_id)
);

alter table public.friendships enable row level security;

create policy "Users can view own friendships"
  on friendships for select using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

create policy "Users can send friend requests"
  on friendships for insert with check (auth.uid() = requester_id);

create policy "Users can update friendships addressed to them"
  on friendships for update using (auth.uid() = addressee_id);

-- Messages
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  related_fast_id uuid references public.fasts(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Users can view own messages"
  on messages for select using (
    auth.uid() = sender_id or auth.uid() = receiver_id
  );

create policy "Users can send messages to friends"
  on messages for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from friendships
      where status = 'accepted'
      and (
        (requester_id = auth.uid() and addressee_id = messages.receiver_id)
        or (addressee_id = auth.uid() and requester_id = messages.receiver_id)
      )
    )
  );

create policy "Users can mark messages as read"
  on messages for update using (auth.uid() = receiver_id);

-- Group fasts
create table if not exists public.group_fasts (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  target_hours integer not null default 16,
  scheduled_start timestamptz not null,
  created_at timestamptz default now()
);

alter table public.group_fasts enable row level security;

create policy "Group fasts are viewable by members and friends"
  on group_fasts for select using (
    auth.uid() = creator_id or
    exists (
      select 1 from group_fast_members where group_fast_id = group_fasts.id and user_id = auth.uid()
    ) or
    exists (
      select 1 from friendships
      where status = 'accepted'
      and (
        (requester_id = auth.uid() and addressee_id = group_fasts.creator_id)
        or (addressee_id = auth.uid() and requester_id = group_fasts.creator_id)
      )
    )
  );

create policy "Users can create group fasts"
  on group_fasts for insert with check (auth.uid() = creator_id);

create policy "Creators can update group fasts"
  on group_fasts for update using (auth.uid() = creator_id);

-- Group fast members
create table if not exists public.group_fast_members (
  id uuid default gen_random_uuid() primary key,
  group_fast_id uuid references public.group_fasts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  fast_id uuid references public.fasts(id) on delete set null,
  unique(group_fast_id, user_id)
);

alter table public.group_fast_members enable row level security;

create policy "Members can view group fast members"
  on group_fast_members for select using (
    exists (
      select 1 from group_fast_members gfm
      where gfm.group_fast_id = group_fast_members.group_fast_id and gfm.user_id = auth.uid()
    ) or
    exists (
      select 1 from group_fasts gf
      where gf.id = group_fast_members.group_fast_id and gf.creator_id = auth.uid()
    )
  );

create policy "Users can join group fasts"
  on group_fast_members for insert with check (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_fasts_user_id on fasts(user_id);
create index if not exists idx_fasts_active on fasts(is_active) where is_active = true;
create index if not exists idx_mood_entries_fast_id on mood_entries(fast_id);
create index if not exists idx_friendships_requester on friendships(requester_id);
create index if not exists idx_friendships_addressee on friendships(addressee_id);
create index if not exists idx_messages_sender on messages(sender_id);
create index if not exists idx_messages_receiver on messages(receiver_id);
create index if not exists idx_group_fast_members_group on group_fast_members(group_fast_id);

-- Enable realtime for live updates
alter publication supabase_realtime add table fasts;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table mood_entries;
alter publication supabase_realtime add table group_fast_members;
