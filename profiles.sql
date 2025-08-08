-- Create a table for public user profiles
create table profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


  -- Create a function that safely returns a user's role on a specific trip
create or replace function get_user_role_on_trip(_trip_id uuid)
returns text
language sql
security definer
as $$
  select role from public.trip_participants
  where trip_id = _trip_id and user_id = auth.uid();
$$;

-- Drop the old, restrictive insert policy
DROP POLICY IF EXISTS "Users can insert their own participant entry" ON public.trip_participants;

-- Create a new policy that allows admins to add anyone to their trip
CREATE POLICY "Allow admins to add participants to their trip"
ON public.trip_participants
FOR INSERT
WITH CHECK ( get_user_role_on_trip(trip_id) = 'admin' );