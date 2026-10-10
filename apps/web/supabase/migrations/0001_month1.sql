-- Month 1: quick wins, verdicts, orders, founding counter.
-- Server-only access through the service role. RLS is on with no policies for anon or authenticated.

create type door as enum ('men','women');
create type verdict_kind as enum ('yes','yes_if','no');
create type order_status as enum ('pending','paid','refunded','test');
create type product as enum ('report','pro');

create table quick_wins (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  door door not null,
  email text not null,
  answers jsonb not null,            -- the five answers
  profile jsonb not null,            -- QuickWinProfile (section 7)
  confidence numeric(3,2) not null,  -- 0.00 to 1.00
  share_token text not null unique,  -- short, for /r/[token]
  shared_at timestamptz,
  opened_by_others int not null default 0,
  finish_today_expires_at timestamptz not null,  -- created_at + 24h, never changed
  verdict_credits int not null default 1,
  user_id uuid                       -- set when the person signs in later
);
create index on quick_wins (email);
create index on quick_wins (share_token);

create table verdicts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  quick_win_id uuid not null references quick_wins(id),
  input_kind text not null check (input_kind in ('screenshot','link')),
  input_url text,
  verdict verdict_kind not null,
  reasons jsonb not null,            -- string[]
  item jsonb not null,               -- {name, brand, category, colour, price_guess}
  saved_amount_inr int
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  quick_win_id uuid references quick_wins(id),
  email text not null,
  product product not null,
  currency text not null check (currency in ('INR','USD')),
  amount_minor int not null,         -- paise or cents
  list_amount_minor int not null,
  price_tier text not null check (price_tier in ('founding','finish_today','list')),
  status order_status not null default 'pending',
  provider text not null default 'dodo',
  provider_order_id text unique,
  raw jsonb
);
create index on orders (status);

create table counters (
  key text primary key,
  value_minor int not null default 0,   -- founding_revenue_usd_cents
  updated_at timestamptz not null default now()
);
insert into counters (key, value_minor) values ('founding_revenue_usd_cents', 0);

-- updated_at triggers
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger quick_wins_set_updated_at before update on quick_wins
  for each row execute function set_updated_at();
create trigger orders_set_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger counters_set_updated_at before update on counters
  for each row execute function set_updated_at();

-- RLS: enabled, no policies. Only the service role (which bypasses RLS) can read or write.
alter table quick_wins enable row level security;
alter table verdicts   enable row level security;
alter table orders     enable row level security;
alter table counters   enable row level security;
