# Quest-Maker

AI-assisted quest generator for `Garden-of-the-Self/data/quests-seed.ts`.

## What it does

- Generates quests with OpenAI using:
  - dominant virtue
  - compatible companion virtues
  - duration (`Long` / `Medium` / `Short`)
- Enforces compatibility and seed schema rules.
- Lets you review and edit quests before approval.
- Supports two output paths:
  - export snippet for manual paste
  - direct write to `quests-seed.ts` (with dry-run preview)

## Setup

1. Install deps:

   ```bash
   npm install
   ```

2. Add env vars:

   ```bash
   cp .env.example .env.local
   ```

   Then set `OPENAI_API_KEY`.

3. Start app:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - start Next.js dev server
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - run Next lint
- `npm run test` - run Vitest tests
- `npm run typecheck` - run TypeScript checks

## API routes

- `POST /api/generate-quests`
  - OpenAI generation + normalization/validation
- `POST /api/seed/export`
  - returns TS snippet for approved quests
- `POST /api/seed/write`
  - `apply: false` -> dry-run diff preview
  - `apply: true` -> writes into `../Garden-of-the-Self/data/quests-seed.ts`

## Notes

- Direct write uses prompt-level dedupe (skip if prompt already exists).
- Dominant virtue must always be present in each approved quest.
