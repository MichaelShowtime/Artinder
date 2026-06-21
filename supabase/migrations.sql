-- Kør dette i Supabase SQL Editor

-- 1. Emoji-reaktioner på beskeder
create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now(),
  unique(message_id, user_id)
);
alter table public.message_reactions enable row level security;
drop policy if exists "reactions_all" on public.message_reactions;
create policy "reactions_all" on public.message_reactions for all using (true) with check (true);

-- 2. Track hvornår hver bruger sidst læste en match-tråd (til ulæst-badge + læsekvittering)
create table if not exists public.match_reads (
  match_id uuid references public.matches(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  last_read_at timestamptz default now(),
  primary key (match_id, user_id)
);
alter table public.match_reads enable row level security;
drop policy if exists "match_reads_all" on public.match_reads;
create policy "match_reads_all" on public.match_reads for all using (true) with check (true);

-- 3. Fix chat isolation: kun match-deltagere kan se beskeder
alter table public.messages enable row level security;

drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select using (
    exists (
      select 1 from public.matches m
      where m.id = messages.match_id
      and (
        m.user_id = auth.uid()
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_artin = true)
      )
    )
  );

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert with check (sender_id = auth.uid());

-- 4. Nye kolonner på profiles (hvis ikke allerede kørt)
alter table public.profiles
  add column if not exists height integer,
  add column if not exists languages text[] default '{}',
  add column if not exists prompts jsonb default '[]';

-- 5. Prompts på personas
alter table public.moods
  add column if not exists prompts jsonb default '[]';
