// ─────────────────────────────────────────────────────────────────────────────
// PomAI — Supabase SQL schema
//
// Paste each block into Supabase Dashboard → SQL Editor and run in order.
// Tables are added incrementally as steps progress.
// ─────────────────────────────────────────────────────────────────────────────

// STEP 4 — Courses + Chapters
export const STEP4_SQL = `
-- Shared updated_at trigger (run once)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- ── Courses ──────────────────────────────────────────────────────────────────
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  description text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

alter table public.courses enable row level security;

create policy "owner full access" on public.courses
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger courses_updated_at before update on public.courses
  for each row execute function public.handle_updated_at();

-- ── Chapters ─────────────────────────────────────────────────────────────────
create table if not exists public.chapters (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  course_id  uuid references public.courses(id) on delete cascade not null,
  title      text not null,
  position   integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.chapters enable row level security;

create policy "owner full access" on public.chapters
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger chapters_updated_at before update on public.chapters
  for each row execute function public.handle_updated_at();
`;

// STEP 5 — Concepts + Captures (run after Step 4 SQL)
export const STEP5_SQL = `
-- ── Concepts ─────────────────────────────────────────────────────────────────
create table if not exists public.concepts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  course_id  uuid references public.courses(id) on delete cascade not null,
  chapter_id uuid references public.chapters(id) on delete set null,
  title      text not null,
  summary    text,
  tags       jsonb default '[]'::jsonb,
  confidence integer default 0 check (confidence between 0 and 5),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.concepts enable row level security;
create policy "owner full access" on public.concepts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger concepts_updated_at before update on public.concepts
  for each row execute function public.handle_updated_at();

-- ── Captures ─────────────────────────────────────────────────────────────────
create table if not exists public.captures (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  course_id  uuid references public.courses(id) on delete cascade not null,
  chapter_id uuid references public.chapters(id) on delete set null,
  concept_id uuid references public.concepts(id) on delete set null,
  mode       text not null check (mode in ('math','generic')),
  content    jsonb not null default '{}'::jsonb,
  confidence integer default 0 check (confidence between 0 and 5),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.captures enable row level security;
create policy "owner full access" on public.captures
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger captures_updated_at before update on public.captures
  for each row execute function public.handle_updated_at();
`;

// STEP 6 — Decks + Flashcards + ReviewLogs + ConceptProgress
export const STEP6_SQL = `
-- ── Decks ─────────────────────────────────────────────────────────────────────
create table if not exists public.decks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  course_id  uuid references public.courses(id) on delete cascade not null,
  title      text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.decks enable row level security;
create policy "owner full access" on public.decks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger decks_updated_at before update on public.decks
  for each row execute function public.handle_updated_at();

-- ── Flashcards ────────────────────────────────────────────────────────────────
create table if not exists public.flashcards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  deck_id    uuid references public.decks(id) on delete cascade not null,
  concept_id uuid references public.concepts(id) on delete set null,
  type       text not null default 'basic' check (type in ('basic','cloze','image')),
  front      text not null,
  back       text not null,
  difficulty integer default 3 check (difficulty between 1 and 5),
  source     jsonb default '{"kind":"manual"}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.flashcards enable row level security;
create policy "owner full access" on public.flashcards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger flashcards_updated_at before update on public.flashcards
  for each row execute function public.handle_updated_at();

-- ── Review logs ───────────────────────────────────────────────────────────────
create table if not exists public.review_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  flashcard_id  uuid references public.flashcards(id) on delete cascade not null,
  result        text not null check (result in ('know','hard','miss')),
  reviewed_at   timestamptz default now() not null,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);
alter table public.review_logs enable row level security;
create policy "owner full access" on public.review_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Concept progress ─────────────────────────────────────────────────────────
create table if not exists public.concept_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  concept_id      uuid references public.concepts(id) on delete cascade not null,
  mastery_score   integer default 0,
  next_review_at  timestamptz default now() not null,
  interval_days   integer default 1,
  ease_factor     numeric default 2.5,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null,
  unique (user_id, concept_id)
);
alter table public.concept_progress enable row level security;
create policy "owner full access" on public.concept_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger concept_progress_updated_at before update on public.concept_progress
  for each row execute function public.handle_updated_at();
`;
