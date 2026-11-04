-- Algoritma Öğrenme: üyelik ve ilerleme senkronu.
-- Supabase SQL Editor'da önce bu dosyayı, sonra lessons.sql'i çalıştır (tekrar çalıştırmak güvenli).
--
-- Güvenlik modeli:
--   * İstemci tabloya doğrudan YAZAMAZ; yalnızca save_progress() ile yazar.
--   * save_progress() kaydı kabul etmeden önce doğrular: bilinmeyen ders, imkânsız XP, hızlı XP artışı,
--     gerçek olmayan seri reddedilir. Bu "olasılık" doğrulamasıdır, kanıt değildir: tek kişilik bir
--     öğrenme uygulamasında amaç, kendi istatistiğini bile şişirmeyi zorlaştırmaktır.

create table if not exists public.lessons (
  id text primary key,
  exercise_count int not null check (exercise_count > 0)
);
alter table public.lessons enable row level security;

create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  xp int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.progress enable row level security;

drop policy if exists progress_select_own on public.progress;
create policy progress_select_own on public.progress
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.progress from anon, authenticated;
grant select on public.progress to authenticated;
revoke all on public.lessons from anon, authenticated;

create or replace function public.save_progress(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cur public.progress%rowtype;
  v_xp int;
  v_hearts int;
  v_streak int;
  v_last text;
  v_days int := 0;
  v_sum bigint := 0;
  v_done int := 0;
  v_ex bigint := 0;
  v_n int;
  v_elapsed numeric;
  k text;
  v jsonb;
  d date;
begin
  if uid is null then
    raise exception 'OTURUM_YOK: oturum gerekli';
  end if;
  if p is null or jsonb_typeof(p) <> 'object' then
    raise exception 'GECERSIZ: kayıt bir nesne olmalı';
  end if;
  if pg_column_size(p) > 65536 then
    raise exception 'GECERSIZ: kayıt çok büyük';
  end if;
  if p ->> 'version' is distinct from '1' then
    raise exception 'GECERSIZ: desteklenmeyen sürüm';
  end if;

  -- XP
  if coalesce(jsonb_typeof(p -> 'xp'), '') <> 'number' or (p ->> 'xp') !~ '^\d{1,7}$' then
    raise exception 'GECERSIZ: xp';
  end if;
  v_xp := (p ->> 'xp')::int;

  -- can
  if coalesce(jsonb_typeof(p -> 'hearts'), '') <> 'number' or (p ->> 'hearts') !~ '^[0-5]$' then
    raise exception 'GECERSIZ: can';
  end if;
  v_hearts := (p ->> 'hearts')::int;

  -- tamamlanan dersler: id'ler gerçek olmalı
  if coalesce(jsonb_typeof(p -> 'completedLessons'), '') <> 'object' then
    raise exception 'GECERSIZ: completedLessons';
  end if;
  for k, v in select key, value from jsonb_each(p -> 'completedLessons') loop
    select exercise_count into v_n from public.lessons where id = k;
    if not found then
      raise exception 'GECERSIZ: bilinmeyen ders %', left(k, 20);
    end if;
    if coalesce(jsonb_typeof(v -> 'score'), '') <> 'number'
       or (v ->> 'score')::numeric < 0 or (v ->> 'score')::numeric > 100 then
      raise exception 'GECERSIZ: ders puanı';
    end if;
    if length(coalesce(v ->> 'completedAt', '')) not between 1 and 40 then
      raise exception 'GECERSIZ: ders tarihi';
    end if;
    v_done := v_done + 1;
    v_ex := v_ex + v_n;
  end loop;

  -- günlük etkinlik: tarihler makul, günlük XP sınırlı, toplam XP'yi aşmaz
  if p ? 'activity' then
    if jsonb_typeof(p -> 'activity') <> 'object' then
      raise exception 'GECERSIZ: activity';
    end if;
    for k, v in select key, value from jsonb_each(p -> 'activity') loop
      if k !~ '^\d{4}-\d{2}-\d{2}$' then
        raise exception 'GECERSIZ: etkinlik tarihi';
      end if;
      d := k::date;
      if d > current_date + 2 or d < current_date - 800 then
        raise exception 'GECERSIZ: etkinlik tarihi aralık dışı';
      end if;
      if jsonb_typeof(v) <> 'number' or (v #>> '{}') !~ '^\d{1,5}$' or (v #>> '{}')::int > 5000 then
        raise exception 'GECERSIZ: günlük XP sınırı aşıldı';
      end if;
      v_sum := v_sum + (v #>> '{}')::int;
      v_days := v_days + 1;
    end loop;
    if v_sum > v_xp then
      raise exception 'GECERSIZ: etkinlik toplamı XP''den büyük';
    end if;
  end if;

  -- seri: gerçek çalışma günleriyle uyumlu olmalı
  if coalesce(jsonb_typeof(p -> 'streak'), '') <> 'object'
     or coalesce(p #>> '{streak,count}', '') !~ '^\d{1,4}$' then
    raise exception 'GECERSIZ: seri';
  end if;
  v_streak := (p #>> '{streak,count}')::int;
  v_last := coalesce(p #>> '{streak,lastActiveDate}', '');
  if v_last <> '' then
    if v_last !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'GECERSIZ: seri tarihi';
    end if;
    d := v_last::date;
    if d > current_date + 2 or d < current_date - 800 then
      raise exception 'GECERSIZ: seri tarihi aralık dışı';
    end if;
  elsif v_streak > 0 then
    raise exception 'GECERSIZ: seri tarihi yok';
  end if;
  if v_streak > v_days + v_done + 1 and not (v_days >= 390 and v_streak <= 3650) then
    raise exception 'GECERSIZ: seri, çalışma günleriyle uyuşmuyor';
  end if;

  -- diğer alanlar yalnızca biçim/boyut olarak kontrol edilir
  if coalesce(jsonb_typeof(p -> 'reviewQueue'), '') <> 'array' or jsonb_array_length(p -> 'reviewQueue') > 1000 then
    raise exception 'GECERSIZ: reviewQueue';
  end if;
  if coalesce(jsonb_typeof(p -> 'badges'), '') <> 'array' or jsonb_array_length(p -> 'badges') > 100 then
    raise exception 'GECERSIZ: badges';
  end if;
  if p ? 'settings' and jsonb_typeof(p -> 'settings') <> 'object' then
    raise exception 'GECERSIZ: settings';
  end if;

  -- XP, tamamlanan derslerden makul bir üst sınırı aşamaz (tekrar oynamalar için bol pay: 20 kat + 3000)
  if v_xp > v_ex * 15 * 20 + 3000 then
    raise exception 'GECERSIZ: XP, tamamlanan derslerle uyuşmuyor';
  end if;

  -- mevcut kayıtla karşılaştır: XP geri gidemez, kısa sürede aşırı artamaz
  select * into cur from public.progress where user_id = uid for update;
  if found then
    if v_xp < cur.xp then
      raise exception 'ESKI_KAYIT: sunucudaki kayıt daha yeni';
    end if;
    v_elapsed := least(extract(epoch from (now() - cur.updated_at)), 2592000);
    if v_xp - cur.xp > 400 + v_elapsed * 2.5 then
      raise exception 'GECERSIZ: XP çok hızlı arttı';
    end if;
  end if;

  insert into public.progress (user_id, data, xp)
  values (uid, p, v_xp)
  on conflict (user_id) do update
    set data = excluded.data, xp = excluded.xp, updated_at = now();

  return p;
end;
$$;

revoke all on function public.save_progress(jsonb) from public, anon;
grant execute on function public.save_progress(jsonb) to authenticated;

-- Hesabı ve ona bağlı bütün veriyi kalıcı siler (progress satırı cascade ile gider).
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'OTURUM_YOK: oturum gerekli';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
