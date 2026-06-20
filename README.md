# Realtors X — Real Estate Assistant MVP

A clean Next.js and Supabase starter for real estate agents. Agents can manage listings and view leads; buyers can describe what they want in natural language and receive ranked matches from the live property database.

## What is included

- Email/password agent login
- Protected agent dashboard
- Add, edit, and delete property listings
- Public natural-language property search
- Explainable matching by budget, location, bedrooms, bathrooms, type, and features
- Buyer lead capture and lead dashboard
- AI-assisted listing creation from natural-language descriptions
- Excel, CSV, JSON, and text bulk listing imports
- Multi-photo property galleries using Supabase Storage
- Supabase Row Level Security (RLS)
- Responsive Tailwind UI

The assistant is deliberately keyless for the MVP: it parses buyer requests and ranks database results locally. This keeps it fast, deterministic, and free to run. A hosted language model can be added later without changing the listing or lead data model.

## 1. Install

Requirements: Node.js 20+ and a free [Supabase](https://supabase.com) project.

```bash
npm install
```

## 2. Configure Supabase

1. Open your Supabase project.
2. Go to **SQL Editor**, paste `supabase/schema.sql`, and run it.
3. Go to **Authentication → Users → Add user** and create an agent with email and password. Enable **Auto Confirm User** for this manually created account.
4. Copy the user UUID if you want demo listings. Replace every `AGENT_USER_ID` in `supabase/seed.sql`, then run that file in the SQL Editor.
5. Go to **Project Settings → API** and copy the project URL and anon/publishable key.

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The anon key is designed for browser use. RLS policies in `schema.sql` protect writes and private data. Never put your Supabase service-role key in a `NEXT_PUBLIC_` variable.

## 4. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`. Use `/chat` as a buyer, or `/login` with the agent account created in Supabase.

## Project map

```text
app/
  api/chat/       Natural-language search endpoint
  api/leads/      Public lead submission endpoint
  chat/           Buyer experience
  dashboard/      Agent leads dashboard
  listings/       Protected listing management
components/       Interactive UI components
lib/matching.ts   Search intent parser and ranking logic
lib/supabase/     Browser, server, and session clients
supabase/         Database schema and optional demo data
```

## Production checklist

- Add your production URL under Supabase **Authentication → URL Configuration**.
- Replace the broad “Agents can view leads” policy with an office/team assignment model if multiple agencies share one Supabase project.
- Add rate limiting and CAPTCHA to `/api/leads` before running paid traffic.
- Add property images using a Supabase Storage bucket.
- Run `npm run build` before deployment. Vercel can deploy the app directly; add both environment variables in the Vercel project settings.

## Automatic Supabase migrations

Database migrations in `supabase/migrations/` are automatically applied to the linked production project when they are pushed to `main`. The GitHub repository must contain these Actions secrets:

- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

The workflow first performs a dry run and only then applies pending migrations. Existing SQL files outside `supabase/migrations/` are retained as setup and upgrade references; only timestamped migration files are applied automatically.
