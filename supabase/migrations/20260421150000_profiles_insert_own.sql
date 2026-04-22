-- Allow authenticated users to insert their own profile row (e.g. if trigger missed or legacy users).
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);
