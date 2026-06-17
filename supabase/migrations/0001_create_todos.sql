-- todos tablosu
create table if not exists public.todos (
  id          bigint generated always as identity primary key,
  text        text not null,
  done        boolean not null default false,
  inserted_at timestamptz not null default now()
);

-- Row Level Security'yi aç
alter table public.todos enable row level security;

-- Bu uygulamada giriş (login) yok; herkes (anon) görevleri
-- okuyup yazabilsin. Yani tüm ziyaretçiler aynı ortak listeyi paylaşır.
create policy "anon herkes okuyabilir"
  on public.todos for select
  to anon using (true);

create policy "anon herkes ekleyebilir"
  on public.todos for insert
  to anon with check (true);

create policy "anon herkes güncelleyebilir"
  on public.todos for update
  to anon using (true) with check (true);

create policy "anon herkes silebilir"
  on public.todos for delete
  to anon using (true);
