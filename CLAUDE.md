# Semicolon IT Tech - Claude Code Rules

> This file governs Claude Code behavior for this project. For full architecture context, always consult `PROJECT_MAP.md` first.

## 1. Tech Stack & Architecture
- **Framework:** Next.js (App Router), TypeScript, React
- **Backend/CMS:** WordPress REST API (Headless CMS) — access ONLY via `src/lib/wp-server.ts` and `src/lib/wp-api.ts`. Direct DB access is prohibited.
- **Deployment:** Vercel (Frontend + Serverless API), GitHub Actions (Cron Scheduler)
- **Styling:** Tailwind CSS + Glassmorphism aesthetic

## 2. Cron & Serverless API Rules
- All `/api/cron/...` routes must be designed with `maxDuration = 60` in mind (Vercel timeout limit).
- Cron routes must have `export const dynamic = 'force-dynamic'` to bypass caching.
- Temporary external errors (429, 503 from Gemini, Tavily, etc.) must be caught internally and return `status: 200` to prevent unnecessary GitHub Actions failures. Only unrecoverable logic errors should return `status: 500`.

## 3. WordPress Data Control
- Never access the WordPress database directly.
- All post creation and modification must go through `src/lib/wp-server.ts` or `src/lib/wp-api.ts`.
- Always check for duplicates via `automation_source_id` or title before creating new posts.

## 4. AI & Automation Pipeline Rules
- When a post is successfully published to WordPress, `googlePublishUrl()` from `src/lib/google-indexing.ts` MUST be called to send a Google Indexing API ping.
- Category assignment must use `classifyContent()` from `src/lib/category-rules.ts` — no hardcoded category IDs.

## 5. Security
- All API endpoints must validate the `Authorization` header against `CRON_SECRET` or equivalent env var.
- Hardcoded API keys (WP, Gemini, Tavily, etc.) are strictly forbidden — always load from `.env`.

## 6. Code Style
- All code comments must be written in English.
- Follow Single Responsibility Principle when splitting functions (image search, AI generation, WP publish as separate modules).
- No duplicate files in `src/lib/` (no `* 2.ts` files).

## 7. Planning & Approval Guardrail
- **Always write a detailed implementation plan before modifying code.** No exceptions.
- Plans must identify potential errors and side effects.
- Do not write any code until the user explicitly approves the plan.

## 8. Root Cause Analysis Protocol
When the user asks to "analyze the cause" or similar:
1. Inspect the full codebase for logical and syntactic defects first.
2. Report findings with file paths and line numbers.
3. Propose a plan. Wait for approval before fixing.

## 9. Language & Token Optimization
- **Internal processing** (reasoning, code writing, file edits, tool calls): English only.
- **Final output to user**: Korean.
- **Code comments**: English.
- **Technical terms**: Keep in original English (App Router, Hydration, Middleware, etc.).

## 10. Verification Loop
- After modifying any significant logic or file, run `npx tsc` or `npm run build` without being asked.
- When starting a session or when context is unclear, read `PROJECT_MAP.md` first.
