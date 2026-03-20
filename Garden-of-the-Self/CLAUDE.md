# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Garden of the Self" is a cross-platform journaling mobile app built with Expo + React Native + TypeScript, using file-based routing via Expo Router.

## Commands

```bash
npm start          # Start Expo dev server
npm run ios        # Launch on iOS simulator
npm run android    # Launch on Android emulator
npm run web        # Launch on web
npm run lint       # Run ESLint
```

There are no tests configured. `npm run reset-project` resets to a blank Expo starter (destructive — avoid unless intentional).

## Architecture

### Storage (Two-Tier)
Journal data is split across two storage layers:
- **SQLite** (`garden-of-the-self.db`) — metadata: prompt, virtues, timestamps, file path
- **File System** — journal HTML content stored as `{documentDirectory}/journals/YYYY-MM-DD.html`

`services/journalManager.ts` is the facade that coordinates between `services/db.ts` and `services/fileStorage.ts`. Always go through `journalManager` rather than calling db or fileStorage directly from components.

### Routing
Expo Router file-based routing under `/app`:
- `/(tabs)/` — tab layout with two tabs: Journals and DevTools
- `/(tabs)/journals/` — journal list, creation, and editor screens
- `/(tabs)/devtools.tsx` — dev utilities (SQL executor, dummy data generator, DB inspector)

### Theming
Two color palettes defined in `constants/theme.ts`: **Alucard** (light) and **Dracula** (dark). Theme-aware components are prefixed `themed-` in `/components`. Use `useThemeColor` hook to access colors.

### Key Constants
- `constants/virtues.ts` — the 12 virtues users can tag journal entries with
- `constants/theme.ts` — full color palette definitions for both themes
- `utils/dateUtils.ts` — use the existing date utility helpers instead of creating ad hoc date logic with `new Date()` in features/components

### Path Alias
`@/*` resolves to the project root (e.g., `import { db } from '@/services/db'`).

## React Compiler & New Architecture
The project has `reactCompiler` and `newArchEnabled: true` in `app.json`. Avoid patterns that break the React Compiler (mutation of props/state outside render, non-standard hook usage).
