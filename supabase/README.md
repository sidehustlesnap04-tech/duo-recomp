# Migrations

Applied directly to the project `duo-recomp` (`eu-central-1`, ref `iwjkjfluynwhpangdyrm`).
They are not yet checked in as files. Run the following once, from this directory's parent, to write them here:

```bash
supabase link --project-ref iwjkjfluynwhpangdyrm
supabase db pull
```

From then on, every schema change goes `supabase migration new <name>` → edit → `supabase db push`,
so the schema is versioned in git rather than clicked into a dashboard.
