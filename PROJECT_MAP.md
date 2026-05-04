# Semicolon IT Tech - Project Map & Context

This file serves as the "Harness Map" to prevent AI context decay. When starting a new session or encountering complex logic, the AI must consult this file to understand the project structure and established patterns.

## Architecture Overview
- **Frontend**: Next.js App Router (`semicolon-next`)
- **Backend/CMS**: Headless WordPress (Remote)
- **Deployment**: Vercel (Frontend & Serverless Cron)
- **Styling**: Tailwind CSS + Glassmorphism aesthetic

## Key Directories & Files (`semicolon-next/`)

### Application
- `src/app/`
  - `/api/cron/*`: Serverless functions triggered by GitHub Actions (e.g., auto-posting, translation). These must return `status: 200` to prevent CI/CD failures on non-critical API timeouts.
  - `/blog/`: Blog content display.
  - `/category/`: Category-based filtering.
  - `/admin/`: Next.js-side administration (requires specific authentication).

### Core Logic (`src/lib/`)
**WARNING: Do NOT duplicate files here (no `* 2.ts` files).**

- `wp-api.ts` & `wp-server.ts`: The ONLY acceptable ways to interact with WordPress. Direct DB access is prohibited.
- `gemini.ts`: AI generation logic.
- `search/`: Tools for fetching external data.
- `category-rules.ts`: Logic for auto-classifying generated content.
- `google-indexing.ts`: Triggers Google Search Console pings after WordPress publish.

### Configuration & Harness
- `.cursorrules`: Strict behavioral rules and token optimization policies (English internal processing).
- `.agent/rules.md`: Further design constraints (Glassmorphism guidelines, component usage).

## Current Project Priorities
1. **Automation Stability**: Ensuring the cron jobs (running AI generation, WP posting, and Google Indexing) execute cleanly within Vercel's 60s timeout limit.
2. **Harness Engineering**: Maintaining a clean codebase, enforcing strict verification loops (e.g., `npm run build`), and preventing unreviewed code changes.

## Golden Patterns
- **Fetching Data**: Use typed server components where possible.
- **AI Modification**: 
  1. Always create a Plan (`implementation_plan.md`) first.
  2. Await User Approval.
  3. Execute.
  4. Run `npm run build` or `npx tsc` for automated verification.
