# Realtors X - Stable Production Checkpoint

Checkpoint date: **June 21, 2026**

## Current stable checkpoint

- Production website: https://realtors-x.vercel.app
- GitHub repository: https://github.com/renecf2109/realtors-x
- Phase 1 AI Workbench: complete
- Phase 1 commit: `bfa1c58`
- Phase 2 featured media: complete
- Phase 2 commit: `c288ff4`
- Phase 2 migration: `supabase/migrations/20260621193000_featured_media_phase2.sql`
- Production branch: `main`
- Git status after deployment: clean
- Supabase is connected.
- Supabase Authentication URL configuration is complete.
- Database schema and privacy migrations are applied.
- GitHub Actions Supabase migration workflow is passing.
- Successful Phase 1 migration reference: https://github.com/renecf2109/realtors-x/actions/runs/27909654975
- Successful Phase 2 migration reference: https://github.com/renecf2109/realtors-x/actions/runs/27909933560
- Homepage featured media is verified.
- Inactive featured media is hidden publicly.
- The admin featured-media route is protected.
- Image/video rendering, poster support, reduced-motion behavior, and gallery media are verified.
- No mobile application has been started.
- The repository has not been restructured.

## Production verification

The website polish passed the full production gate:

```text
npm run test       - passed, 22 tests
npm run lint       - passed
npx tsc --noEmit   - passed
npm run build      - passed, 28 routes generated
```

Additional production checks passed:

- Public homepage, login, signup, chat, projects, and investments routes
- Protected dashboard, listings, and agent-search redirects
- Read-only chat API response
- Favicon and Realtors X logo assets
- `robots.txt`
- `sitemap.xml`
- Vercel deployment of Phase 1 commit `bfa1c58`
- Vercel deployment of Phase 2 commit `c288ff4`
- Featured media RLS, homepage placement, inactive-media filtering, protected admin access, video posters, reduced motion, and gallery rendering

## Completed website work

- Reworked the homepage into a premium Realtors X property experience.
- Preserved the luxury black, white, and blue brand palette and blue X identity.
- Added responsive public navigation and a shared website footer.
- Improved login and signup validation, feedback, autocomplete, and accessibility.
- Improved the mobile agent workspace navigation and active-page states.
- Improved public AI property chat with guided prompts, loading/error feedback, mobile-friendly results, lead capture, and WhatsApp follow-up.
- Improved private agent inventory search, combined filters, selection, and WhatsApp sharing.
- Improved listing creation, AI description parsing, spreadsheet import, galleries, project/investment fields, developer privacy, availability updates, and save/delete feedback.
- Added public projects, investments, listing details, galleries, and sharing flows.
- Added stronger empty, loading, error, and not-found states.
- Added titles, descriptions, canonical metadata, Open Graph/Twitter basics, sitemap, robots rules, focus styles, reduced-motion support, and accessible alt text.
- Pinned production to Node.js 20 or newer for current Supabase support.
- Preserved the passing Supabase migration workflow and existing production configuration.

## Do not change yet

Unless a future prompt explicitly authorizes it:

- Do not start a mobile application.
- Do not restructure the repository or move the website into `apps/web`.
- Do not add payments or subscriptions.
- Do not add or configure a custom domain.
- Do not replace the Supabase project or change its production authentication URLs.
- Do not weaken database privacy policies or expose private developer information.
- Do not expose or use a Supabase `service_role` key in browser or mobile code.
- Do not commit `.env`, `.env.local`, `.env.*.local`, passwords, access tokens, or secret files.
- Do not change the passing GitHub Actions migration workflow unless a migration task requires it.
- Preserve the Realtors X logo, favicon, metadata, black/white/blue design, public pages, and agent workflows.

## Admin featured media addition

The website now includes a secure featured-media administration area:

- Admin home: `/admin`
- Featured media management: `/admin/featured-media`
- Supabase migration: `supabase/migrations/20260621100000_admin_featured_media.sql`
- Admin access uses the existing `profiles.role` field.
- Unauthenticated visitors are redirected to login.
- Authenticated non-admin agents are redirected to their dashboard.
- Featured-media create, update, and delete operations are independently protected by Supabase Row Level Security.
- Public visitors can read only active media within its optional start/end schedule.
- Agent accounts cannot promote themselves by updating their profile through the website API.
- No service-role key is used by the website.

Admin feature verification completed before deployment:

```text
npm run test                    - passed, 11 tests
npm run lint -- --max-warnings=0 - passed
npx tsc --noEmit                - passed
npm run build                   - passed, 21 routes generated
```

Public route smoke tests passed, both signed-out admin routes redirect to login with a safe return path, the chat API remained healthy, and `robots.txt` excludes the admin area. Authenticated admin CRUD and non-admin role behavior must receive a final live check after the migration is applied and the account role is configured.

Featured media supports:

- Image and video URLs
- Video thumbnail/poster URLs
- Title and description
- Optional destination link
- Sort order
- Active/inactive status
- Optional start and end times
- Placements: `homepage_hero`, `homepage_strip`, `gallery`, `dashboard`, and `listing_featured`
- Preview before saving
- Edit, activate/deactivate, and delete actions

Website display behavior:

- `homepage_hero` provides the image or muted, looping, inline video background in the homepage hero card.
- `homepage_strip` creates a featured media section on the homepage.
- `gallery` can add images or controlled videos to property and project galleries.
- `dashboard` displays featured project media in the authenticated agent dashboard.
- `listing_featured` displays on a specific property when its destination link is `/properties/PROPERTY_ID`.
- Autoplay background video is disabled when the visitor requests reduced motion.
- Video files and large images remain outside Git; the database stores HTTPS URLs only.

### Make your account an admin

The requested account is assigned through migration `20260621124500_assign_realtors_x_admin.sql`. The migration stores only a salted fingerprint—not the plaintext login email—and fails safely unless exactly one authenticated account matches.

After the migration completes, sign out and sign in again. The **Admin** option will appear in the agent workspace.

Manual SQL below is retained only as a recovery reference; it is not required for the configured account.

1. Create or sign in to your Realtors X account and confirm its email address.
2. Open the Supabase project dashboard.
3. Click **SQL Editor** in the left sidebar.
4. Click **New query**.
5. Paste the SQL below.
6. Replace `YOUR_LOGIN_EMAIL@example.com` with the exact email used to log into Realtors X.
7. Click **Run**.
8. Sign out of Realtors X and sign in again. The **Admin** option will appear in the agent workspace.

```sql
update public.profiles as profile
set role = 'admin'
from auth.users as account
where profile.id = account.id
  and lower(account.email) = lower('YOUR_LOGIN_EMAIL@example.com');

select account.email, profile.role
from auth.users as account
join public.profiles as profile on profile.id = account.id
where lower(account.email) = lower('YOUR_LOGIN_EMAIL@example.com');
```

The final result should show the email with role `admin`. Do not use a password, access token, database password, or service-role key in this query.

### Add images or videos

1. Sign in to the website with the admin account.
2. Open `/admin`, then click **Open featured media**.
3. Click **Add featured media**.
4. Choose **Image** or **Video**.
5. Enter a public HTTPS media URL. Do not add large files to GitHub.
6. For video, add a public HTTPS poster/thumbnail URL when possible.
7. Choose the placement and sort order.
8. Optionally add a destination link and start/end schedule.
9. Confirm the preview, choose whether it is active, and save.
10. Use **Edit**, **Activate/Deactivate**, or **Delete** from the media library as needed.

For `listing_featured`, set the destination link to the exact property path, such as `/properties/PROPERTY_ID`. For project-specific gallery media, use the matching project path, such as `/projects/PROJECT-NAME`.

Migration `20260621131500_seed_featured_media_previews.sql` adds five active dummy placements using the existing Realtors X logo. A `listing_featured` item without a destination link appears across all property pages; adding `/properties/PROPERTY_ID` targets one property. The previews are normal database records and can be edited, deactivated, or deleted from `/admin/featured-media` when real advertising assets are ready.

Migration `20260621134500_seed_preview_property.sql` adds one clearly labeled, removable preview property and project so the gallery and listing-featured placements are visible before real inventory exists. Delete `Realtors X Preview Property` from the Listings manager when real listings are ready.

The homepage hero and `homepage_strip` placements now render as full-width cinematic bands. Hero navigation and calls to action use translucent, blurred glass strips for contrast over both images and video.

### Live admin checklist

- Confirm a signed-out visitor opening `/admin` is redirected to login.
- Confirm a normal agent opening `/admin` is redirected to `/dashboard`.
- Confirm the admin account can open `/admin` and `/admin/featured-media`.
- Add one inactive image and confirm it does not appear publicly.
- Activate the image and confirm it appears in its selected placement.
- Add a video with a poster and confirm preview, controls, and reduced-motion behavior.
- Edit its title, description, URLs, placement, sort order, and schedule.
- Deactivate it and confirm it disappears publicly.
- Delete the test media after verification if it is not intended for production.

Future mobile note: a later mobile app can read the same public active `featured_media` records and placement values. No mobile application has been started, and the repository has not been restructured.

## Recommended next phase options

### 1. Add real listing data - recommended first

Import a small, reviewed set of real properties and projects. This gives the AI search, projects, investments, galleries, privacy rules, lead capture, and agent workflows representative production data before adding more infrastructure.

Recommended starting set: 10-20 listings across several areas, property types, prices, and availability states.

### 2. Add a custom domain

Connect a Realtors X domain after the real-data experience is reviewed. This phase must also update Vercel, Supabase Authentication Site/Redirect URLs, canonical metadata, sitemap, Open Graph URLs, and any share links.

### 3. Add payments or subscriptions

Define the business model before implementation: who pays, plan limits, billing currency, trial rules, listing/agent limits, and which features require a subscription. Use a supported payment provider and keep all secret keys server-side.

### 4. Start the mobile app later

Begin only after the website and real production data are stable. Propose the mobile structure before creating files, preserve the existing website, and do not restructure the repository without explicit approval.

## Exact next prompt

The recommended next phase is real listing data. Copy and paste this prompt when your listing spreadsheet/files and property images are ready:

```text
Start the next Realtors X phase: import and validate real listing data for the existing website only.

Stable production checkpoint:
- Website: https://realtors-x.vercel.app
- GitHub repo: renecf2109/realtors-x
- Stable website commit: 914b0b7
- Production branch: main
- Supabase is connected and production migrations are current.
- GitHub Actions Supabase migrations are passing.
- The website tests, lint, TypeScript, production build, and live route checks passed.

Guardrails:
- Do not start a mobile app.
- Do not restructure the repository.
- Do not add payments or subscriptions.
- Do not add a custom domain.
- Preserve the current Realtors X website design and agent workflows.
- Never expose or use a Supabase service_role key in client code.
- Never commit environment files, passwords, access tokens, or secrets.

I will attach my real listing spreadsheet/files and property images.

Before importing anything:
1. Read CONTINUE_NEXT_STEPS.md and inspect the existing property schema and import tools.
2. Inspect every attached file and map each source column to the existing Realtors X fields.
3. Give me a validation report covering listing count, missing required fields, duplicate candidates, invalid values, image matches, projects, investment flags, developer privacy, and agent ownership.
4. Normalize prices, locations, property types, bedroom/bathroom counts, sizes, availability, descriptions, features, project names, developer names, completion dates, ROI values, and gallery order.
5. Keep developer names private unless a listing explicitly permits public display.
6. Do not modify production data until the validation report is clean and the import plan is safe.
7. After import, test public AI search/chat, projects, investments, property pages, galleries, sharing, lead capture, private agent search, and listing management.
8. Run tests, lint, TypeScript, and the production build before committing and pushing to main.

Start by inspecting the files I attach and give me the validation report. Do not import yet.
```

## Recovery reference

If future work causes instability, compare against website commit `914b0b7` and the successful migration workflow run linked above. Do not roll back database migrations or production data destructively without an explicit recovery plan.

## AI Workbench Phase 1

Phase 1 adds one structured Realtors X workflow for buyer requests, listing discovery, agent/admin inquiries, and spreadsheet imports. It is website-only; no mobile app, payment integration, custom domain, or repository restructuring was added.

### Routes

- `/chat` — public AI/rule-based property search with categorized requests, verified active matches, listing links, copy-link, and copy-share-message controls.
- `/listings` — public catalog of active listings.
- `/listings/[id]` — public active listing detail and image/video gallery.
- `/dashboard/listings` — protected listing management for admins and agents.
- `/dashboard/inquiries` — inquiries owned by a lead or assigned to the signed-in agent.
- `/dashboard/imports` — signed-in agent/admin import history.
- `/dashboard/imports/new` — CSV, XLS, and XLSX listing import workbench.
- `/admin` — admin command center.
- `/admin/inquiries` — all AI inquiries for admins.
- `/admin/imports` — all listing imports for admins.

Leads are sent to `/chat` if they try to open agent inventory or workspace tools. Admin pages still require an authenticated `admin` profile role.

### Database migration

Migration: `supabase/migrations/20260621170000_ai_workbench_phase1.sql`

This migration makes `listings` the canonical inventory table while preserving a protected compatibility view named `properties`. It adds `listing_media`, `listing_imports`, `listing_import_rows`, `ai_conversations`, `ai_messages`, `ai_inquiries`, and `ai_uploads`; expands profile roles to `admin`, `agent`, and `lead`; adds import traceability and price-status support; and applies RLS, least-privilege grants, checks, indexes, and timestamps.

RLS rules:

- Public users can read active/available listings and their media only.
- Admins can manage all listings, imports, media, and inquiries.
- Agents can manage their own listings/imports and inquiries assigned to them.
- Leads can read only their own conversations and inquiries.
- Anonymous inquiry creation cannot assign an agent, choose a non-new status, or attach to another user’s conversation.

### Admin and role setup

Use the existing Supabase SQL Editor role procedure above to set a profile role to `admin`. To make an account an agent, use the same safe email lookup and set `role = 'agent'`; use `role = 'lead'` for buyer-only accounts. Never use or paste a password, access token, database URL, or service-role key into the website.

### Import rules

- Accepted files: CSV, XLS, and XLSX, up to 10 MB and 5,000 rows per import.
- Messy headers are normalized using common aliases such as listing name/title, address/area/location, price/asking price, property type/category, and status/availability.
- Required groups: title or address/location; price or price status; property type; listing status.
- Missing optional data is allowed and reported as blue `optional skipped`.
- Green means `imported`; yellow means `needs review`; red means `required missing`; gray means `duplicate/skipped`.
- Duplicate detection uses normalized title/location/price/type values against existing inventory and earlier rows in the same file.
- Every row is recorded with its mapped data, issues, and final status for review.
- Media URLs are stored in `listing_media`; large images and videos are not committed to GitHub.

### Categorizer and verifier

The server returns structured categorization for property search leads, contact/showing requests, listing submissions, bulk imports, listing updates, featured-media requests, media uploads, admin tasks, agent support, general questions, and unknown requests needing follow-up. Phase 1 intentionally uses the deterministic rule-based fallback, so it works without an AI key.

Before output or persistence, the verifier checks required import fields, optional omissions, current role, duplicate candidates, and active/relevant public listing matches.

### Phase 1 verification checklist

- Upload one valid spreadsheet and confirm imported rows are green.
- Upload a row with only optional fields missing and confirm it is blue.
- Upload a row missing type or status and confirm it is red and not imported.
- Upload the same row twice and confirm the duplicate is gray.
- Ask `/chat` for a location, type, budget, size, or feature combination and verify multiple active results and both copy buttons.
- Confirm a lead can browse public `/listings` but cannot open `/dashboard/listings`, `/agent-search`, `/admin`, or another user’s inquiry/conversation.
- Confirm agents see only their own imports/listings and assigned inquiries.
- Confirm admins see all imports and inquiries.
- Confirm inactive or sold listings are absent from public search and public detail access.

### Recommended next phase

Use Phase 1 with a small reviewed set of real listings first. Phase 2 should add an admin mapping-review screen, resumable imports, direct Supabase Storage uploads, agent assignment UI, and an optional server-side AI provider only after the deterministic rules and production data are proven.

Exact next prompt:

```text
Start Realtors X AI Workbench Phase 2 for the existing website only.

Read CONTINUE_NEXT_STEPS.md and continue from the Phase 1 production checkpoint. Preserve all existing website design, Supabase RLS, imports, conversations, inquiries, listing links, and public search behavior.

Add:
- an admin column-mapping and row-review screen before import confirmation
- resumable imports with retry for reviewed rows
- Supabase Storage uploads for listing images and videos
- admin assignment of inquiries to agents
- conversation history in the dashboard
- optional server-side AI categorization behind the existing rule-based fallback

Do not start a mobile app, add Stripe, add a custom domain, restructure the repository, expose secrets, or use a service-role key in browser code. Use Supabase migrations, run tests/lint/TypeScript/build, verify RLS and live routes, and commit/push only after every check passes.
```

## Featured Media Phase 2

Featured Media Phase 2 preserves and hardens the existing admin-controlled image/video system. The website remains the only application; no mobile application, Stripe integration, custom domain, or repository restructure was added.

### Routes and migrations

- Admin command center: `/admin`
- Featured media library and editor: `/admin/featured-media`
- Original schema migration: `supabase/migrations/20260621100000_admin_featured_media.sql`
- Phase 2 RLS hardening migration: `supabase/migrations/20260621193000_featured_media_phase2.sql`

The `featured_media` table stores title, description, image/video type, public HTTPS media URL, optional poster URL, placement, destination link, sort order, active state, optional schedule, creator, and timestamps.

### Admin access

To make an existing account an admin, open Supabase → SQL Editor → New query and run the safe email-based role update documented in **Make your account an admin** above. Replace only the placeholder email. Never paste a password, access token, database password, or service-role key.

Only `profiles.role = 'admin'` users can create, update, activate, deactivate, or delete featured media. Agents and leads can read only media that is active and currently inside its schedule. Signed-out visitors have the same active-only read boundary.

### Adding images and videos

1. Sign in with the admin account.
2. Open `/admin/featured-media`.
3. Choose **Add featured media**.
4. Select Image or Video and enter a public HTTPS media URL.
5. For video, add a public HTTPS thumbnail/poster URL when available.
6. Choose placement, sort order, schedule, active state, and optional destination link.
7. Confirm the preview and save.

Do not commit large images or any video files to GitHub. The URL fields are ready for public Supabase Storage URLs when Storage upload management is added later. Background videos autoplay only while motion is allowed and are always muted, looped, and `playsInline`; reduced-motion visitors see the poster or a static fallback.

### Placement behavior

- `homepage_hero` — selects the homepage background image/video. The first active item by sort order wins.
- `homepage_strip` — renders full-width featured campaign bands below the hero.
- `gallery` — appears in project galleries; set `link_url` to a project path to target one project, or leave blank for all galleries.
- `dashboard` — appears in the signed-in agent/admin dashboard promotion area.
- `listing_featured` — appears in listing galleries; use `/listings/LISTING_ID` or the compatible `/properties/LISTING_ID` path to target one listing, or leave blank for all listings.

The admin library reports the accurate public state as **Live**, **Scheduled**, **Expired**, or **Inactive**. Sort order controls presentation order within a placement.

### Future mobile note

No mobile application has been started. A future mobile app may reuse the same active `featured_media` records and placement values after the website remains stable; do not restructure the repository until that future phase is explicitly authorized.
