-- A stand-in for the parts of Supabase the migrations use (auth.users, auth.uid(), the roles, the realtime
-- publication), so the real migrations run on a plain local Postgres. auth.uid() reads request.uid, which
-- the tests set to "sign in" as someone.
drop schema if exists public cascade; create schema public; grant all on schema public to public;
drop schema if exists auth cascade; drop schema if exists t cascade;
drop publication if exists supabase_realtime;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role service_role bypassrls; exception when duplicate_object then null; end $$;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb, created_at timestamptz default now(), last_sign_in_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.uid', true), '')::uuid $$;
grant usage on schema public, auth to authenticated, anon, service_role;
grant execute on function auth.uid() to authenticated, anon, service_role;
create publication supabase_realtime;
-- Supabase gives these roles table rights by default; RLS and the migrations' revokes do the limiting
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, anon, service_role;
alter default privileges in schema public grant usage, select on sequences to authenticated, anon, service_role;
