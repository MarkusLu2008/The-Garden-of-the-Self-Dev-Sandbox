# Garden of the Self — Spec Implementation Plan

Source spec: `Garden_of_the_Self_Spec.pdf` (Feature Specification & Design Brief).

## Decisions locked in

- Keep existing virtue-unlock-by-graph-distance system (`utils/virtueGraph.ts`) running alongside new spec leveling — do not remove.
- Stay local-only (SQLite/AsyncStorage). No backend. "Server-side config" from spec treated as local config (`constants/gameConfig.ts`).
- `data/quests-seed.ts` currently tiers by **duration** (`Long/Medium/Short`) with multi-virtue weighted points — does NOT match spec's difficulty tiers (`Gentle/Moderate/Stretch`, flat point values, single dominant virtue). Needs retagging/authoring pass (Phase 2).
- Mascot (Aristotle) art: placeholder only, generated via script (plain image + text), no image-gen tokens spent on real art.

## Open items to resolve before/while starting

- `gameConfig.VIRTUE_LIST` has 13 entries; spec says twelve virtues. Need to confirm which is extra/wrong.
- Phase 2 duration→tier retagging involves judgment calls (e.g. a "Long" research quest may actually be Gentle). Decide: do it wholesale, or review a proposed mapping first.

## Known tech debt — BLOCKED, do not start without art assets

**Two parallel point systems currently exist. This is unwanted and must be unified — but is blocked on art, not code.**

- **Legacy (`virtue_totals` table)**: pre-existing before Phase 1–6. Written by every quest completion *and* journal entry (`applyVirtueDeltas` in `services/db.ts`). Drives: tree/ASCII art growth stage (`constants/virtueTreeImages.ts`, 6–7 hand-authored PNG stages per virtue), virtue-unlock-by-graph-distance (`utils/virtueGraph.ts`), daily point decay.
- **New (`virtue_progress.spec_points`)**: added in Phase 3. Written only by quest completion, daily-capped, tier-based (10/25/50 pts), routed through `utils/questScoring.ts` (`awardSpecPoints` in `services/db.ts`). Drives: level 1–7 + stage name, progress bar, wilting (Phase 5), streak bonus (Phase 6).
- Both update together on the normal "complete a quest" path today, so nothing is broken — but they're two separate numbers with two separate meanings, and journal entries only feed the legacy one. Confusing to explain to players and to future devs.

**Decision**: unify onto the new spec system (`virtue_progress.spec_points`, 7-level thresholds, daily-cap scoring engine). Its quest-to-quest progression pacing (tiered points, daily cap, level-band progress bar) is the one we want to keep. The legacy `virtue_totals` system is superseded **except** for its tree art, which currently ships with 6–7 stages per virtue hand-drawn against the *old* threshold curve.

**Blocker**: unifying means either (a) commissioning/generating a 7-stage tree art set per virtue matched to the new level thresholds `[0,50,150,350,700,1250,2100]`, or (b) remapping the new 7 levels onto whatever stage count each virtue's existing art has (6 or 7, inconsistent per virtue — see `constants/virtueTreeImages.ts`). Until one of those happens, deleting `virtue_totals` breaks the garden's visual growth.

**Future fix (new phase, insert before Phase 10 dashboard rework once unblocked):**
1. Get/generate consistent N-stage art per virtue (recommend matching to the 7 spec levels for a 1:1 mapping — simplest, no remapping math needed).
2. Swap `VirtueGardenPage` tree-stage lookup from `score` (legacy total) to `virtueProgress.level`.
3. Route journal-entry point awards through `awardSpecPoints` too (currently legacy-only — journaling doesn't move the new bar at all).
4. Delete `virtue_totals` table, `applyVirtueDeltas`, `addVirtuePoints` devtools helper, and the decay/unlock-threshold logic keyed off it; port virtue-unlock gating to read `spec_points` instead.
5. Update `utils/virtueGraph.ts` seed-shown thresholds to key off `spec_points`.

See `TODO(unify-point-systems)` markers in `services/db.ts` and `constants/virtueTreeImages.ts` for the exact code spots.

## Phases

### Phase 1 — Config & data model foundation
- Extend `constants/gameConfig.ts`: `pointsPerTier: { gentle: 10, moderate: 25, stretch: 50 }`, cumulative level thresholds `[0,50,150,350,700,1250,2100]`, `dailyCapPerVirtue: 2`.
- Add `difficultyTier: 'Gentle'|'Moderate'|'Stretch'` to `QuestSeedItem` in `data/quests-seed.ts`, alongside existing `duration` field (keep both for now).
- Add SQLite tables/columns (`services/db.ts`): per-virtue level/points, streak (current/longest/lastCompletedDate/freezesAvailable), per-virtue lastActivityDate (wilting), quest completion log, reflections table.

### Phase 2 — Quest content retagging
- Pass over all quests in `quests-seed.ts`: assign real `difficultyTier` per actual challenge level, not duration label.
- Reduce each quest to single dominant virtue + tier + point value; keep secondary virtues as metadata only (not scored).
- Add quest reroll/swap in `app/(tabs)/quests/index.tsx`.

### Phase 3 — Points & leveling engine
- New `utils/questScoring.ts`: award points per tier, respect daily cap (2/virtue/day), update cumulative points, derive level (1–7)/stage name from thresholds.
- Progress bar shows progress within current level band only, not against full total.
- Unit test pacing sanity-check numbers from spec section 2.3.

### Phase 4 — Streak system
- Track consecutive-day completion (any virtue) in SQLite: current + longest streak.
- Small grace mechanism for one missed day.
- Surface on home screen + near mascot.

### Phase 5 — Wilting
- Per-virtue `lastActivityDate`; stale 5–7 days (configurable) → plant visually wilts.
- Soft penalty only: block level-up until revived or slow-leak progress bar. Never remove points/levels.
- First quest on that virtue immediately starts reviving animation.

### Phase 6 — Streak rewards
- Daily consistency bonus (+5) routed through same scoring engine (Phase 3), not a separate curve.
- Milestone rewards at 7/30/100-day streaks: cosmetic unlocks + streak-freeze grant.
- Streak freeze consumable protects one missed day.

### Phase 7 — Reflection journal (post-quest)
- New optional short textbox after quest completion; separate table from existing free-form journal (`services/journalManager.ts` untouched).
- Rotating prompt pool ("How did it feel?", "What was hardest?", etc.).
- Stored privately; surfaced in per-virtue detail view (Phase 10) as history.

### Phase 8 — Onboarding assessment
- Replace stub `app/onboarding.tsx` pager: author 12–24 short questions (1–2 per virtue), original wording, inspired by but not copying VIA-IS.
- Produce baseline per-virtue score → seeds initial quest-weighting toward weaker virtues.
- Present result as encouraging starting map, not judgment.

### Phase 9 — Adaptive difficulty
- Track per-virtue completion/skip history per tier.
- Consistent completion at a tier → surface next tier up; repeated skips/fails → ease back down.
- Suggested tier visible + user-overridable.

### Phase 10 — Garden dashboard + plant detail view
- Rework `app/(tabs)/index.tsx`: 12 plants, health state (thriving/growing/wilting), streak + today's quests + attention indicators.
- Tap → detail view: virtue description, "why this plant," level/stage, progress bar, quest history, hardest quest completed, reflections list, today's suggested quest with reroll, milestone/quote note.
- Growth animation on completion via `react-native-reanimated`.

### Phase 11 — "Why this virtue matters" + quote content
- Author explainer copy for all virtues + plant-symbolism rationale + Aristotle quotes/paraphrases (mark paraphrases explicitly per spec's attribution caution).
- Resolve the 12 vs 13 virtue-count discrepancy here or earlier.

### Phase 12 — Reminders & notifications
- Add `expo-notifications` (not currently a dependency).
- Daily reminder at user-set time(s); contextual variants (wilting plant, near level-up).
- Streak-protection reminder later in day if no quest done. Respect quiet hours/OS permissions, easy opt-out.

### Phase 13 — Mascot (Aristotle) scaffolding
- Mascot component with expression states (happy/thoughtful/concerned) driven by app state.
- Placeholder art: plain white PNG with "ARISTOTLE" text, generated via script (ImageMagick/sharp/Node canvas) — no image-gen tokens spent.
- Wire mascot copy into onboarding host role and encouragement moments (reuse Phase 11 quotes).

### Phase 14 — QA pass
- Verify full loop end-to-end: onboarding → weighted quests → complete quest → points/level/streak/reflection update → wilting/reviving → dashboard/detail views reflect state.
- Use `/verify` against real running app, not just type-checking.
