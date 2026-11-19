# Duo Recomp

A two-person habit and fitness challenge. Twelve weeks, two people, one shared track.

## Status

Built: Supabase schema, row level security, the scoring function, auth, duo creation and invitations, the app shell.
Not built yet: the six screens' real contents, the race, push notifications, data migration from the prototype.

## Running it

```bash
npm install
cp .env.example .env.local   # then fill in the anon key
npm run dev
```

## Environment

`.env.local` holds only values that are meant to reach the browser:

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | The project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The publishable key. Safe in the browser; row level security is what protects the data |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public half of the push key pair |

The service-role key and the VAPID private key live in Supabase Edge Function secrets and must never appear
in this repository, in any `NEXT_PUBLIC_` variable, or in client code.

## Database

The schema lives in the Supabase project `duo-recomp` (`eu-central-1`) as five migrations:

1. `01_identity_duos_invites` — profiles, duos, membership, invitations, the membership helper functions
2. `02_private_tables_and_score_bridge` — targets, day logs, body measurements, food, sets, `daily_scores`
3. `03_shared_tasks_goals_and_scoring` — tasks, completions, badges, shared goals, the scoring function and triggers
4. `04_notifications` — push subscriptions, preferences, the send queue, the delivery log
5. `05_tighten_function_grants` — revokes execute from `anon` on everything, and from signed-in users on the internals

To materialise them as files here:

```bash
supabase link --project-ref iwjkjfluynwhpangdyrm
supabase db pull
```

### The privacy rule

Private tables (`food_entries`, `body_measurements`, `day_logs`, `player_targets`, `workout_sets`) are readable
only by the person who wrote them. A partner never reads them. A database trigger recomputes `daily_scores`,
and that number is the only thing that crosses between the two people. Verified with real queries: a partner
account reads 0 rows from every private table and 1 row from `daily_scores`.
