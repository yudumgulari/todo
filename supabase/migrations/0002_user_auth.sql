-- Artık giriş yapan her kullanıcı yalnızca kendi görevlerini görecek.

-- 1) Görevleri sahibine bağlayacak kolon
alter table public.todos
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Eski "ortak liste" döneminden kalan sahipsiz kayıtları temizle
delete from public.todos where user_id is null;

-- Bundan sonra yeni görevler otomatik olarak ekleyen kullanıcıya ait olsun
alter table public.todos
  alter column user_id set default auth.uid();

alter table public.todos
  alter column user_id set not null;

-- 2) Eski herkese açık (anon) kuralları kaldır
drop policy if exists "anon herkes okuyabilir"      on public.todos;
drop policy if exists "anon herkes ekleyebilir"     on public.todos;
drop policy if exists "anon herkes güncelleyebilir" on public.todos;
drop policy if exists "anon herkes silebilir"       on public.todos;

-- 3) Yeni kurallar: kullanıcı sadece KENDİ görevlerine erişebilir
create policy "kendi görevlerini gör"
  on public.todos for select
  to authenticated using (auth.uid() = user_id);

create policy "kendi görevini ekle"
  on public.todos for insert
  to authenticated with check (auth.uid() = user_id);

create policy "kendi görevini güncelle"
  on public.todos for update
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "kendi görevini sil"
  on public.todos for delete
  to authenticated using (auth.uid() = user_id);
