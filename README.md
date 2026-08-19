# Homeward

Consumer-friendly home-transaction tracker. See `docs/product-spec.md` for the
product and `docs/implementation-plan.md` for the roadmap. Development rules and
guardrails live in `CLAUDE.md` — read it before contributing.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres,
Auth, RLS) · Resend · Vercel.

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at supabase.com and copy its URL and keys.

3. **Configure environment**

   ```bash
   cp .env.example .env.local
   ```

   Fill in the Supabase URL, anon key, service-role key, and (later) Resend
   values. Never commit `.env.local`.

4. **Apply database migrations.** Run the SQL files in `supabase/migrations/`
   in order against your project — via the Supabase SQL editor, or the Supabase
   CLI (`supabase db push`). They are forward-only; never edit an applied one.

5. **Auth setting for local dev.** In Supabase → Authentication, either disable
   "Confirm email" for faster local testing, or use the confirmation email flow.
   The signup UI handles both.

6. **Run the app**

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint
- `npm run format` / `npm run format:check` — Prettier
- `npm run test` — Vitest unit tests

## Quality gate

`typecheck`, `lint`, and `format:check` must pass before every commit.
