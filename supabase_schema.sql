-- Run this in your Supabase project → SQL Editor

-- Transactions
create table if not exists public.transactions (
  id                text primary key,
  user_id           uuid references auth.users(id) on delete cascade not null,
  type              text not null check (type in ('receita','despesa')),
  value             numeric(12,2) not null,
  category          text not null,
  description       text not null,
  date              text not null,
  tags              text[] default '{}',
  created_at        text not null
);
alter table public.transactions enable row level security;
create policy "Users see own transactions" on public.transactions for all using (auth.uid() = user_id);

-- Notes
create table if not exists public.notes (
  id                text primary key,
  user_id           uuid references auth.users(id) on delete cascade not null,
  title             text not null,
  content           text not null,
  date              text not null,
  pinned            boolean default false,
  transaction_id    text,
  created_at        text not null
);
alter table public.notes enable row level security;
create policy "Users see own notes" on public.notes for all using (auth.uid() = user_id);

-- Notifications
create table if not exists public.notifications (
  id                text primary key,
  user_id           uuid references auth.users(id) on delete cascade not null,
  type              text not null,
  title             text not null,
  message           text not null,
  read              boolean default false,
  created_at        text not null
);
alter table public.notifications enable row level security;
create policy "Users see own notifications" on public.notifications for all using (auth.uid() = user_id);

-- Settings (one row per user)
create table if not exists public.settings (
  user_id                  uuid references auth.users(id) on delete cascade primary key,
  monthly_goal             numeric(12,2) default 3000,
  large_expense_threshold  numeric(12,2) default 500,
  custom_categories        text[] default '{}'
);
alter table public.settings enable row level security;
create policy "Users see own settings" on public.settings for all using (auth.uid() = user_id);
