# Realtors X — Stable Checkpoint

Checkpoint date: **June 20, 2026**

## Current stable status

- The Realtors X website is live at: https://realtors-x.vercel.app
- GitHub repository: https://github.com/renecf2109/realtors-x
- Production branch: `main`
- Supabase is connected to the website.
- Supabase Authentication Site URL and Redirect URL configuration is complete.
- The production database schema is applied.
- Database privacy and agent-workflow migrations are applied.
- Automatic Supabase migrations run through GitHub Actions on pushes to `main`.
- The Supabase migration workflow is passing.
- Successful workflow run: https://github.com/renecf2109/realtors-x/actions/runs/27876525745
- Commit `e78cc6a` fixed the workflow using the official Supabase CLI password-based migration flow.
- The website, Vercel deployment, Supabase integration, and GitHub migration automation are the current stable baseline.
- No mobile application has been started.

## Guardrails until the next phase

- Do not change the website unless explicitly requested.
- Do not restructure the repository yet.
- Do not move the existing website into `apps/web` or another directory yet.
- Do not create mobile-app files until the mobile phase is explicitly started.
- Do not commit `.env`, `.env.local`, `.env.*.local`, service-role keys, database passwords, access tokens, or other secrets.
- Preserve the current Realtors X logo, favicon, black/white/blue branding, public pages, agent tools, Supabase configuration, Vercel deployment, and passing GitHub Actions workflow.

## Exact next prompt for starting the mobile app

Copy and send the prompt below when ready:

```text
Start the Realtors X mobile app phase.

Stable website checkpoint:
- Website: https://realtors-x.vercel.app
- GitHub repo: renecf2109/realtors-x
- Production branch: main
- Supabase is connected and the database migrations are current.
- GitHub Actions Supabase migrations are passing.
- The existing website must remain live and unchanged.

Before making changes:
1. Read CONTINUE_NEXT_STEPS.md.
2. Inspect the current repository and website architecture.
3. Propose the safest mobile-app structure and implementation plan.
4. Do not move or restructure the existing website unless I explicitly approve the proposed structure.

Mobile requirements:
- Use Expo, React Native, and TypeScript.
- Use the existing Supabase project and existing public/authenticated data model.
- Reuse the Realtors X logo and black/white/blue luxury branding.
- Never use or expose a Supabase service_role key in the mobile app.
- Keep mobile environment files and secrets out of Git.
- Start with a buyer-facing MVP: authentication, property search/chat, listings, listing details and galleries, projects, investments, lead capture, WhatsApp contact, and sharing.
- Plan agent-only mobile features separately after the buyer MVP is stable.
- Preserve the deployed website and its GitHub Actions workflows.

Show me the proposed structure, milestones, required environment variables, and any decisions I must approve before creating the mobile app.
```

## Verification reference

The stable Supabase workflow should show green checks for:

- Validate required secrets
- Show safe migration diagnostics
- Link production project
- Preview pending migrations
- Apply pending migrations

If future work causes instability, compare against commit `e78cc6a` and the successful workflow run linked above before changing production infrastructure.
