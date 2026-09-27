# Clotparcament

A private, collaborative parking assistant for a group of friends in the Clot neighbourhood (Barcelona).

Members press **HE APARCAT AQUÍ** ("I parked here") or **AQUÍ NO HI HA LLOC** ("nothing here"). The app records the GPS position and time, and recommends the 3 areas where the group has most often found parking at a similar time and day.

- Live app: https://marcel-bernet.github.io/clotparcament/
- The user interface is **Catalan only**. Code, comments and docs are in English.
- Goal: **zero maintenance**, free tiers only, small and boring code.

---

## Architecture

```text
GitHub repo (Next.js app)
   │  push to main → GitHub Actions (.github/workflows/deploy.yml)
   ▼
GitHub Pages (static files only: HTML/JS/CSS)
   │  HTTPS, official Supabase JS client, running in the browser
   ▼
Supabase: Auth (Sign in with Google) · PostgreSQL · Row Level Security · SQL functions
```

- There is **no application server**. The browser talks directly to Supabase.
- All authorization is enforced **in the database** (grants + RLS + triggers), never by hiding UI.
- Google Maps is used only through ordinary outbound links (no API, no key).

## Technology choices

| Piece | Choice | Why |
|---|---|---|
| Frontend | Next.js (static export) + React + TypeScript | Required stack; `output: "export"` produces plain files |
| Hosting | GitHub Pages | Free, no server |
| CI/CD | GitHub Actions | Free, builds and deploys on push |
| DB + Auth | Supabase Free plan | Postgres + Auth + RLS, no backend to run |
| Login | Sign in with Google (Supabase Auth provider) | One tap; no emails, no passwords, no SMTP. Google Cloud is used **only** for the free OAuth client |
| Maps | Google Maps URL | Free, no API key |

Dependencies: `next`, `react`, `react-dom`, `@supabase/supabase-js` (+ TypeScript types). Nothing else. No CSS framework.

## Repository layout

```text
app/
  layout.tsx            HTML shell, lang="ca"
  page.tsx              Login state + membership check → main screen
  Login.tsx             "Entra amb Google" button + friendly error if not invited
  ParkingButtons.tsx    The two big buttons, geolocation, save, "Desfés" (undo)
  Recommendations.tsx   Calls recommend_parking(), renders top 3 + Google Maps links
  Invites.tsx           Admin-only: invite/remove members, WhatsApp share link
  privacitat/page.tsx   Privacy policy (Catalan), required by Google for the OAuth app
  condicions/page.tsx   Terms of service (Catalan), linked from the Google consent screen
  manifest.ts, icon.svg "Add to home screen" support
  globals.css           All styles
lib/supabase.ts         The single Supabase client
supabase/
  001_schema.sql        Tables, grants, RLS policies
  002_invites_and_recommendations.sql  Admin role, invites, triggers, recommend_parking(), ping()
.github/workflows/
  deploy.yml            Build + deploy to GitHub Pages
  keep-alive.yml        Pings Supabase twice a week so the free project never pauses
```

## Environment variables

| Name | Where | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` (local) and GitHub → Settings → Secrets and variables → Actions → **Variables** | No. Public by design |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same | No. It is the Supabase **publishable** key (`sb_publishable_…`) or legacy `anon` key; RLS is the security boundary |

The URL must be the base URL only: `https://<project-ref>.supabase.co` (no `/rest/v1/`).

**Never** use the Supabase `secret` / `service_role` key anywhere in this project.

## Local development

Requirements: Node.js 22+.

```bash
npm install
cp .env.example .env.local   # then fill in the two values
npm run dev                  # http://localhost:3000
npm run build                # static site in ./out (uses basePath /clotparcament)
```

`next.config.mjs` sets `basePath: "/clotparcament"` only in production builds, so local dev runs at `/`.

## Supabase setup (from scratch)

1. Create a project (Free plan, region West EU / Paris).
2. **Authentication → Sign In / Providers**: **Allow new users to sign up = ON** (who may sign up is controlled by the `only_invited_users` trigger). Email provider may stay enabled; the app doesn't use it.
3. **Authentication → URL Configuration**:
   - Site URL: `https://marcel-bernet.github.io/clotparcament/`
   - Redirect URLs: `https://marcel-bernet.github.io/clotparcament/**` and `http://localhost:3000/**`
4. **Google Cloud Console** (https://console.cloud.google.com, free):
   - Create project `clotparcament`.
   - **Google Auth Platform → Get started**: app name `Clotparcament`, audience **External**. **Branding**: no logo (a logo forces a manual review); home page `https://marcel-bernet.github.io/clotparcament/`, privacy policy `https://marcel-bernet.github.io/clotparcament/privacitat/`, terms `https://marcel-bernet.github.io/clotparcament/condicions/`, authorized domain `marcel-bernet.github.io`. Then **Audience → Publish app** (basic scopes need no Google verification; "Testing" mode would only allow listed test users).
   - **Clients → Create client → Web application**:
     - Authorized JavaScript origins: `https://marcel-bernet.github.io`, `http://localhost:3000`
     - Authorized redirect URI: the **Callback URL** shown in Supabase's Google provider page (`https://<project-ref>.supabase.co/auth/v1/callback`)
5. **Supabase → Authentication → Sign In / Providers → Google**: enable, paste Client ID and Client secret (the secret lives only in Supabase), save.
6. **SQL Editor**: run `supabase/001_schema.sql`.
7. Create the first (admin) user: Authentication → Users → Add user → Create new user (any password, it is never used; Auto Confirm ON). Then:
   ```sql
   insert into public.group_members (group_id, user_id)
   select g.id, u.id from public.groups g, auth.users u
   where g.name = 'Clot' and u.email = 'ADMIN_EMAIL';
   ```
8. **SQL Editor**: run `supabase/002_invites_and_recommendations.sql` (makes the existing member admin).

## Authentication flow

1. User taps **Entra amb Google** → `supabase.auth.signInWithOAuth({ provider: "google", redirectTo: <app url> })`.
2. Google confirms the person's identity and email, then returns to Supabase.
3. If this Google email has no Supabase account yet, Supabase tries to create one. The `before insert on auth.users` trigger `only_invited_users` **rejects it unless the email is in `group_invites`**. Supabase then redirects back with `error_description=Database error saving new user`; the app shows "Aquest compte de Google no està convidat".
4. If allowed, Supabase redirects back to the app with the session; supabase-js stores it in the browser (localStorage) and refreshes it automatically. No passwords exist.
5. After login, the app reads the user's row in `group_members`. No active row → "no formes part del grup".

An existing user created by email (e.g. the admin, created in the dashboard) is automatically linked to the Google identity with the same verified email.

Authentication (who you are) and authorization (which group you belong to) are separate: logging in grants nothing by itself.

### Inviting members (admin only)

In the app: **Gestiona el grup → Convida** → type email → a row is added to `group_invites` → "Envia-li l'enllaç per WhatsApp" opens WhatsApp with a prefilled message. When the friend logs in for the first time, trigger `join_invited_groups` adds them to `group_members`. **Treu** deletes the invite, and trigger `invite_removed` removes the membership (admins are never removed). Their past events are kept.

## Database schema

**`groups`**: `id uuid pk`, `name text`, `created_at`. One row: `Clot`.

**`group_members`**: `group_id`, `user_id` (→ auth.users), `status` (`active`/`inactive`), `role` (`member`/`admin`), `created_at`. PK `(group_id, user_id)`.

**`group_invites`**: `group_id`, `email` (lowercase), `invited_by`, `created_at`. PK `(group_id, email)`.

**`parking_events`**: `id uuid`, `group_id`, `user_id` (default `auth.uid()`), `result` (`success`/`fail`), `latitude`, `longitude`, `occurred_at` (default `now()`), `created_at`.

Functions:
- `is_group_member(gid)`, `is_group_admin(gid)`: security definer helpers used by RLS.
- `recommend_parking(p_group_id, p_at default now())`: returns top 3 areas (security **invoker**, so RLS applies).
- `ping()`: returns 1, callable by anyone; used only by the keep-alive workflow.
- Trigger functions: `only_invited_users`, `join_invited_groups`, `invite_added`, `invite_removed` (not callable by clients).

## Security: grants + RLS

Two layers: table **grants** decide which operations/columns a role may use at all; **RLS policies** decide which rows.

| Table | anon | authenticated (grants) | RLS rows |
|---|---|---|---|
| groups | nothing | select | groups you're an active member of |
| group_members | nothing | select | only your own membership rows |
| group_invites | nothing | select, insert (group_id, email), delete | only admins of that group |
| parking_events | nothing | select, insert (**only** group_id, result, latitude, longitude), delete | select: your groups · insert: `user_id = auth.uid()` and member · delete: your own events, created < 15 min ago ("Desfés") |

Consequences:
- Anonymous visitors can't read or write anything (verified against the live project).
- A user can't post as someone else: `user_id` can't be supplied by the client (column not granted) and RLS checks `user_id = auth.uid()`.
- A user can't fake the time: `occurred_at` isn't granted; the server sets `now()`.
- Nobody can update events. Users can delete only their own events within 15 minutes.
- Non-members and members of other groups see nothing from this group.
- Uninvited emails can't create accounts.

## Recommendation algorithm

Implemented entirely in SQL: `recommend_parking()` in `supabase/002_invites_and_recommendations.sql`. Deterministic, no ML.

All times are converted to **Europe/Madrid** local time.

1. **Geographic grid.** Each event goes into a ~50 m × 50 m square:
   `cell_y = floor(lat × 111320 / 50)`, `cell_x = floor(lng × 111320 × cos(lat) / 50)`.
2. **Areas.** An area = a square **plus its 8 neighbours** (3×3 squares ≈ 150 m × 150 m, i.e. roughly 75 m around a spot). This avoids splitting one street across a grid line.
3. **Time-of-day weight** (circular, so 23:50 and 00:10 are 20 min apart):
   `minutes_apart = min(|a − b|, 1440 − |a − b|)`
   `time_weight = 0.1 + 0.9 × max(0, 1 − minutes_apart / 180)`
   → 1.0 at the same time, 0.55 at 90 min, 0.1 at 3 h or more (old data still counts a little).
4. **Day-of-week weight.** Days start at **04:00** (so 00:30 on Saturday still counts as Friday night):
   same weekday → 1.0 · both weekdays or both weekend → 0.6 · weekday vs weekend → 0.2.
5. **Event weight** = `time_weight × day_weight`.
6. For each area: `S` = sum of weights of successes, `F` = sum of weights of failures.
7. **Score** = `S / (S + F + 2)`.
   It's the success rate, calculated as if every area started with 2 failed searches. So:
   - more successes → higher score; more failures → always lower score;
   - a single lucky parking can't dominate (1 success → 0.33).
   Examples at a matching time: 20 ok / 5 fail → 0.74 · 20 ok / 50 fail → 0.28 · 8 ok / 0 fail → 0.80.
8. Only areas with at least one success are considered. An area is shown only if **no overlapping area** (within 2 squares) scores higher, so the 3 results are different places.
9. Return the top 3, with the average position of the successful parkings in the area.

Returned columns: `latitude, longitude, successes, failures, similar_successes, similar_failures, score`. "Similar" = within 90 min and same day type (weekday/weekend).

### How the app explains a result (Recommendations.tsx)

- Label: score ≥ 0.6 → **Bona opció**; ≥ 0.35 → **Resultats mixtos**; else **Poc probable**.
- Line 1: "N aparcaments del grup en dies laborables/en cap de setmana a una hora semblant, M cerques sense lloc" (or "based on general history" if no similar events).
- Line 2: total successes and failed searches in the area.

## Google Maps links

`https://www.google.com/maps/search/?api=1&query=<lat>,<lng>` opens the Google Maps app on phones. No API key or Google Cloud project.

## Deployment (GitHub Pages)

1. GitHub → repo → **Settings → Pages → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables**: add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Push to `main` (or Actions → Deploy to GitHub Pages → Run workflow).

## Zero-maintenance notes (free-tier limits)

- **Supabase pauses free projects after ~7 days without activity.** `keep-alive.yml` calls `ping()` every Monday and Thursday. Normal use also keeps it awake. If it ever pauses: Supabase dashboard → Restore project (data isn't lost).
- **GitHub disables scheduled workflows** in repos with no commits for 60 days; GitHub emails you, and one click (Actions → Keep Supabase awake → Enable workflow) turns it back on.
- **Google login** has no cost or quota relevant at this scale. The OAuth client never expires. If the Google Cloud project is deleted, login stops working.
- Supabase Free: 500 MB database. Each event is ~100 bytes, so millions of events fit.

## Testing

Already verified (local Postgres with Supabase-like roles, plus the live project for anonymous access):
- anonymous: can't read/insert events or read groups;
- member: can insert own events; can't insert as another user, set timestamps, or update;
- non-member / removed member: sees 0 events, can't insert;
- non-admin: can't read or create invites;
- uninvited email: account creation rejected; invited email: auto-joined;
- undo works for own events only;
- recommendations: many successes vs many failures, weekday vs weekend, events around midnight, nearby points merged, distant points separate;
- UI: location denied / unavailable / timeout and failed save show Catalan messages.

To re-test recommendations in the Supabase SQL editor you can call, e.g.:
```sql
select * from recommend_parking((select id from groups where name = 'Clot'),
                                '2026-10-03 11:00'::timestamp at time zone 'Europe/Madrid');
```
(In the SQL editor you're a superuser, so RLS doesn't apply there.)

Manual checks still to do on a real phone: see PROJECT_STATUS.md.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| "Falta la configuració de Supabase" | `.env.local` or the GitHub Variables are missing/misnamed |
| "Aquest compte de Google no està convidat" | Admin must invite that exact Google email first |
| Google shows "Access blocked" / "app not verified" / only test users | Google Auth Platform → Audience → **Publish app** |
| Google error `redirect_uri_mismatch` | Google client's redirect URI must equal Supabase's Google Callback URL exactly |
| Back in the app but not logged in / wrong site | Supabase → Authentication → URL Configuration redirect URLs |
| "No formes part del grup" | The invite was removed: invite them again (re-inviting an existing account re-activates it) |
| "No tenim permís per saber on ets" | Enable location for the site in the browser/phone settings |
| Site shows 404 after deploy | Settings → Pages → Source must be "GitHub Actions"; check the Actions tab for errors |
| Everything fails suddenly | Supabase project paused → dashboard → Restore |
