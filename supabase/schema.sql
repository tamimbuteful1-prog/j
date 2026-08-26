-- ============================================================================
-- يومي — مخطط قاعدة البيانات (Supabase / PostgreSQL)
-- شغّل هذا الملف مرّة واحدة من: Supabase Dashboard ← SQL Editor ← New query
-- ============================================================================

-- ---------------------------------------------------------------- التصنيفات
create table if not exists public.categories (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  color       text not null default '#4f46e5',
  sort        int  not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists categories_user_idx on public.categories (user_id);

-- ------------------------------------------------------------------ المهام
create table if not exists public.tasks (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  notes       text default '',
  category_id text,
  date        date not null,                 -- تاريخ المهمة، أو تاريخ بداية التكرار
  start_min   int  not null check (start_min between 0 and 1440),
  end_min     int  not null check (end_min   between 0 and 1440),
  recur_type  text not null default 'none' check (recur_type in ('none','daily','weekly')),
  recur_days  int[] not null default '{}',   -- 0 = الأحد ... 6 = السبت
  recur_until date,
  status      text not null default 'todo' check (status in ('todo','done','postponed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint tasks_time_order check (end_min > start_min)
);

create index if not exists tasks_user_date_idx on public.tasks (user_id, date);

-- ------------------------------------------- استثناءات المواعيد المتكررة
-- صف واحد لكل (مهمة + يوم) عند تعديل موعد بعينه أو حذفه أو تغيير حالته.
create table if not exists public.task_overrides (
  id        text primary key,                -- "<task_id>|<YYYY-MM-DD>"
  user_id   uuid not null references auth.users (id) on delete cascade,
  task_id   text not null references public.tasks (id) on delete cascade,
  date      date not null,
  title     text,
  start_min int check (start_min between 0 and 1440),
  end_min   int check (end_min   between 0 and 1440),
  status    text check (status in ('todo','done','postponed')),
  deleted   boolean not null default false,
  unique (task_id, date)
);

create index if not exists overrides_user_idx on public.task_overrides (user_id);

-- ---------------------------------------------------------- إعدادات المستخدم
create table if not exists public.user_settings (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- أمان على مستوى الصف: كل مستخدم يرى ويعدّل بياناته فقط
-- ============================================================================

alter table public.categories     enable row level security;
alter table public.tasks          enable row level security;
alter table public.task_overrides enable row level security;
alter table public.user_settings  enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['categories', 'tasks', 'task_overrides'] loop
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
    execute format(
      'create policy %I on public.%I
         for all
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id)',
      t || '_own', t
    );
  end loop;
end $$;

drop policy if exists user_settings_own on public.user_settings;
create policy user_settings_own on public.user_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- تحديث updated_at تلقائيًا
-- ============================================================================

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists tasks_touch on public.tasks;
create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch on public.user_settings;
create trigger settings_touch before update on public.user_settings
  for each row execute function public.touch_updated_at();
