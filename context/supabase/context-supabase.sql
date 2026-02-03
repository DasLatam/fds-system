with
tables as (
  select
    c.oid,
    n.nspname as schema,
    c.relname as table_name
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relkind in ('r','p') -- tables + partitioned tables
    and n.nspname not in ('pg_catalog','information_schema')
),
cols as (
  select
    t.schema,
    t.table_name,
    jsonb_agg(
      jsonb_build_object(
        'column', a.attname,
        'type', pg_catalog.format_type(a.atttypid, a.atttypmod),
        'nullable', (not a.attnotnull),
        'default', pg_get_expr(ad.adbin, ad.adrelid),
        'identity', nullif(a.attidentity, '')
      )
      order by a.attnum
    ) as columns
  from tables t
  join pg_attribute a
    on a.attrelid = t.oid
   and a.attnum > 0
   and not a.attisdropped
  left join pg_attrdef ad
    on ad.adrelid = t.oid
   and ad.adnum = a.attnum
  group by t.schema, t.table_name
),
constraints as (
  select
    n.nspname as schema,
    c.relname as table_name,
    jsonb_agg(
      jsonb_build_object(
        'name', con.conname,
        'type', con.contype, -- p=pk, f=fk, u=unique, c=check
        'definition', pg_get_constraintdef(con.oid, true)
      )
      order by con.conname
    ) as constraints
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname not in ('pg_catalog','information_schema')
  group by n.nspname, c.relname
),
policies as (
  select
    schemaname as schema,
    tablename as table_name,
    jsonb_agg(
      jsonb_build_object(
        'name', policyname,
        'permissive', permissive,
        'roles', roles,
        'cmd', cmd,
        'qual', qual,
        'with_check', with_check
      )
      order by policyname
    ) as policies
  from pg_policies
  group by schemaname, tablename
),
functions as (
  select
    n.nspname as schema,
    jsonb_agg(
      jsonb_build_object(
        'name', p.proname,
        'arguments', pg_get_function_identity_arguments(p.oid),
        'return_type', pg_get_function_result(p.oid),
        'language', l.lanname,
        'security_definer', p.prosecdef,
        'definition', pg_get_functiondef(p.oid)
      )
      order by p.proname, pg_get_function_identity_arguments(p.oid)
    ) as functions
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_language l on l.oid = p.prolang
  where n.nspname not in ('pg_catalog','information_schema')
  group by n.nspname
),
tables_json as (
  select jsonb_agg(
    jsonb_build_object(
      'schema', t.schema,
      'table', t.table_name,
      'columns', coalesce(c.columns, '[]'::jsonb),
      'constraints', coalesce(k.constraints, '[]'::jsonb),
      'policies', coalesce(p.policies, '[]'::jsonb)
    )
    order by t.schema, t.table_name
  ) as tables
  from (select distinct schema, table_name from tables) t
  left join cols c on c.schema = t.schema and c.table_name = t.table_name
  left join constraints k on k.schema = t.schema and k.table_name = t.table_name
  left join policies p on p.schema = t.schema and p.table_name = t.table_name
)
select
  jsonb_pretty(
    jsonb_build_object(
      'generated_at', now(),
      'tables', coalesce((select tables from tables_json), '[]'::jsonb),
      'functions_by_schema', coalesce(
        (select jsonb_object_agg(schema, functions) from functions),
        '{}'::jsonb
      )
    )
  ) as schema_json;
