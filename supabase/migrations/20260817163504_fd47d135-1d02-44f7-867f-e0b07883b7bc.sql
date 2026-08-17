create table if not exists public.subscription_transfer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  plan_id text not null,
  amount numeric not null,
  currency text not null default 'USD',
  days integer not null,
  status text not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

grant select, insert, update on public.subscription_transfer_requests to authenticated;
grant all on public.subscription_transfer_requests to service_role;

alter table public.subscription_transfer_requests enable row level security;

create policy "Users insert own transfer requests"
on public.subscription_transfer_requests for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users read own transfer requests"
on public.subscription_transfer_requests for select to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Admins update transfer requests"
on public.subscription_transfer_requests for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create index if not exists idx_str_status on public.subscription_transfer_requests (status, created_at desc);