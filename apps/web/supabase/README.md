# Supabase

Tables for the new app. Access is server-only through the service-role key.

Apply the migration with the Supabase CLI (project linked with `supabase link`):

```
supabase db push
```

Or paste `migrations/0001_month1.sql` into the Supabase dashboard SQL editor and run it.

Then set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `apps/web/.env.local`.
