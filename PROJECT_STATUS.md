# Project status

_Last updated: 2026-09-28_

## Current architecture

Static Next.js app (GitHub Pages) → Supabase (Auth + Postgres + RLS) directly from the browser. No server. Catalan-only UI. See README.md for details.

## Completed

- [x] GitHub repo `marcel-bernet/clotparcament`
- [x] Supabase project (Free, EU); sign-ups OFF for now; URL configuration set
- [x] `001_schema.sql` applied to the live project (groups, group_members, parking_events, RLS)
- [x] Owner added as member of group "Clot"
- [x] Live check: anonymous users are denied on all tables
- [x] App code: login (link + code), membership check, two buttons + geolocation + undo, top-3 recommendations with Google Maps links, admin invites with WhatsApp share, home-screen manifest
- [x] `002_invites_and_recommendations.sql` written and tested locally (NOT yet applied to live project)
- [x] GitHub Actions: deploy.yml, keep-alive.yml (NOT yet pushed)
- [x] README.md

## In progress / pending (in order)

1. **Gmail SMTP in Supabase** (Authentication → Emails → SMTP Settings) + Catalan Magic Link template. ← current user task
2. Run `supabase/002_invites_and_recommendations.sql` in the SQL editor.
3. Turn **Allow new users to sign up** back ON (invite trigger now controls access).
4. Test login locally (`npm run dev`) with the owner's email.
5. GitHub: Settings → Pages → Source = GitHub Actions; add the two Action **Variables**.
6. Push code → first deploy.
7. Test on a real phone: login, location allowed/denied, both buttons, undo, recommendations, Maps link, Add to home screen.
8. Invite a second person; test invited, uninvited and removed flows.

## Required environment variables (names only)

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Local: `.env.local` (git-ignored). CI: GitHub Actions **Variables** (not secrets; both are public by design).

## Current database state (live Supabase)

- Tables: `groups` (1 row: Clot), `group_members` (1 row: owner), `parking_events` (empty). RLS enabled on all.
- Functions: `is_group_member`.
- Not yet applied: `role` column, `group_invites`, auth.users triggers, `is_group_admin`, `recommend_parking`, `ping`.

## Immediate next task

Configure Gmail SMTP in Supabase (Authentication → Emails → SMTP Settings), then paste the Catalan Magic Link template.
