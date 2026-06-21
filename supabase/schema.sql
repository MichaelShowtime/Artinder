-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  age integer,
  gender text,
  location text,
  bio text,
  interests text[],
  is_artin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Profile images
create table public.profile_images (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  url text not null,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Artin's moods/personas
create table public.moods (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Mood images
create table public.mood_images (
  id uuid primary key default uuid_generate_v4(),
  mood_id uuid references public.moods(id) on delete cascade not null,
  url text not null,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Swipes (user's decision on a mood)
create table public.swipes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  mood_id uuid references public.moods(id) on delete cascade not null,
  liked boolean not null,
  created_at timestamptz default now(),
  unique(user_id, mood_id)
);

-- Matches (when user swiped yes)
create table public.matches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  mood_id uuid references public.moods(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, mood_id)
);

-- Messages
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references public.matches(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_nej boolean default false,
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.profile_images enable row level security;
alter table public.moods enable row level security;
alter table public.mood_images enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;

-- Profiles: users can read all, write own
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can delete their own profile" on public.profiles for delete using (auth.uid() = id);

-- Profile images
create policy "Profile images viewable by everyone" on public.profile_images for select using (true);
create policy "Users manage own images" on public.profile_images for all using (auth.uid() = user_id);

-- Moods: everyone can read, only artin can write
create policy "Moods viewable by authenticated users" on public.moods for select using (auth.role() = 'authenticated');
create policy "Only artin can manage moods" on public.moods for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_artin = true)
);

-- Mood images
create policy "Mood images viewable by authenticated" on public.mood_images for select using (auth.role() = 'authenticated');
create policy "Only artin can manage mood images" on public.mood_images for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_artin = true)
);

-- Swipes: users manage own
create policy "Users manage own swipes" on public.swipes for all using (auth.uid() = user_id);

-- Matches: user can see own, artin can see all
create policy "Users see own matches" on public.matches for select using (
  auth.uid() = user_id or
  exists (select 1 from public.profiles where id = auth.uid() and is_artin = true)
);
create policy "System inserts matches" on public.matches for insert with check (auth.uid() = user_id);

-- Messages
create policy "Match participants can see messages" on public.messages for select using (
  exists (
    select 1 from public.matches m
    join public.profiles p on p.id = auth.uid()
    where m.id = messages.match_id
    and (m.user_id = auth.uid() or p.is_artin = true)
  )
);
create policy "Match participants can send messages" on public.messages for insert with check (
  auth.uid() = sender_id and
  exists (
    select 1 from public.matches m
    join public.profiles p on p.id = auth.uid()
    where m.id = messages.match_id
    and (m.user_id = auth.uid() or p.is_artin = true)
  )
);

-- Storage buckets (run separately in Supabase dashboard)
-- Create bucket 'avatars' for profile images (public)
-- Create bucket 'moods' for mood images (public)

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'New User'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
