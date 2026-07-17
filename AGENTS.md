# AGENTS.md

## Project
This is a Next.js App Router project for a Mongolian vocabulary learning and book reading web app.

## Main stack
- Next.js 14+ App Router
- TypeScript
- Tailwind CSS
- shadcn/ui where useful
- PostgreSQL / Neon
- Custom JWT auth (lib/auth-helpers.ts, cookie: linguist_session)
- Server-side API routes in app/api

## Commands
- Install: npm install
- Dev: npm run dev
- Type check: npm run typecheck
- Lint: npm run lint
- Build: npm run build

## Important rules
- Do not rewrite the whole project.
- Do not delete existing logic unless explicitly asked.
- Do not change database schema unless asked.
- Do not break the custom JWT auth in lib/auth-helpers.ts.
- Do not move files unnecessarily.
- Keep existing imports working.
- Prefer small focused changes.
- After every change, run typecheck/build if possible.
- Explain exactly which files changed and why.

## UI direction
- Mobile-first.
- Calm reading app feeling.
- Avoid generic AI-generated SaaS design.
- Avoid huge gradients, fake stats, random cards, and over-rounded UI.
- Use realistic Mongolian copy.
- Keep reader experience simple and focused.

## Before editing
Always inspect existing files first.
Find the actual component names and routes.
Do not guess paths. 