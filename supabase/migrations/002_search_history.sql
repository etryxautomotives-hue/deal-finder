-- deal'ke search: each account's search and click history, used to put their favourite products first
-- in the search suggestions. Same row and same rules as the rest of user_data (people only see their own).
-- Format: { "q": { "<search>": [count, lastMs] }, "p": { "<product name>": [count, lastMs] }, "c": { "<category>": [count, lastMs] } }
alter table public.user_data add column if not exists history jsonb default '{}'::jsonb;
