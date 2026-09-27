# Project status

_Last updated: 2026-09-28_

## Current architecture

Static Next.js app (GitHub Pages) → Supabase (Auth + Postgres + RLS) directly from the browser. No server. Catalan-only UI. See README.md for details.

## Completed

- [x] GitHub repo `marcel-bernet/clotparcament`
- [x] Supabase project (Free, EU); sign-ups OFF for now; URL configuration set
- [x] `001_schema.sql` applied to the live project (groups, group_members, parking_events, RLS)
- [x] Owner added as member of group "Clot" (admin)
- [x] Google login configured (Google Cloud OAuth client, published) and tested locally
- [x] `002_invites_and_recommendations.sql` applied to the live project; sign-ups ON (invite trigger controls access)
- [x] Restyle (cream/green theme, illustrated hero, pill buttons, recommendation cards)
- [x] Code pushed to GitHub
- [x] Live check: anonymous users are denied on all tables
- [x] App code: login (Sign in with Google), membership check, two buttons + geolocation + undo, top-3 recommendations with Google Maps links, admin invites with WhatsApp share, home-screen manifest
- [x] GitHub Actions: deploy.yml, keep-alive.yml
- [x] README.md

## In progress / pending (in order)

1. GitHub: Settings → Pages → Source = GitHub Actions; add the two Action **Variables**.
2. Re-run the deploy workflow (Actions → Deploy to GitHub Pages → Run workflow).
3. Test on a real phone: login, location allowed/denied, both buttons, undo, recommendations, Maps link, Add to home screen.
4. Invite a second person; test invited, uninvited and removed flows.

Decision log: login switched from email link/code to Sign in with Google (user choice, 2026-09-28): no SMTP needed.

## Required environment variables (names only)

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Local: `.env.local` (git-ignored). CI: GitHub Actions **Variables** (not secrets; both are public by design).

## Current database state (live Supabase)

- Tables: `groups` (1 row: Clot), `group_members` (1 row: owner), `parking_events` (empty). RLS enabled on all.
- Also: `group_invites` table, `role` column, triggers on auth.users (only_invited_users, join_invited_groups) and group_invites (invite_added, invite_removed).
- Functions: `is_group_member`, `is_group_admin`, `recommend_parking`, `ping`.

## Immediate next task

GitHub → Settings → Pages → Source: GitHub Actions; add Action Variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY; re-run the deploy workflow.
