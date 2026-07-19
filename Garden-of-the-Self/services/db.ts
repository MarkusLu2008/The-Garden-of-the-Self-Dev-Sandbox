import * as SQLite from 'expo-sqlite';
import virtues from '@/constants/virtues';
import { clampQuestRewards, gameConfig } from '@/constants/gameConfig';
import { questDurationOrder, questsSeed, type QuestDuration, type QuestDifficultyTier } from '@/data/quests-seed';
import { getDominantVirtue, specPointsForTier, specPointsToLevel, levelStageName } from '@/utils/questScoring';
import { addDaysToDateString, diffInDays, getTodayDateString } from '@/utils/dateUtils';

export type VirtueProgressRow = {
  virtue_id: number;
  spec_points: number;
  level: number;
  last_activity_date: string | null;
};

export type StreakRow = {
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  freezes_available: number;
};

export type QuestReflectionRow = {
  id: number;
  quest_history_id: number | null;
  text: string;
  prompt: string | null;
  created_at: string;
};

/** Virtue display name -> slug (snake_case) */
function virtueToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_');
}

type VirtueRow = {
  id: number;
  name: string;
  slug: string;
  unlocked_at: string | null;
};

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let virtuesCache: VirtueRow[] | null = null;
let virtueIdByName: Map<string, number> | null = null;
let virtueIdBySlug: Map<string, number> | null = null;

const QUEST_DURATION_LABELS: Record<QuestDuration, string> = {
  Long: 'Long (30min~)',
  Medium: 'Medium (15~)',
  Short: 'Short duration (5~)',
};

/** Create tables if they do not exist; does not drop or overwrite existing data. */
async function initializeOrMigrateSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS virtues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      unlocked_at TEXT
    );

    CREATE TABLE IF NOT EXISTS journals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL UNIQUE,
      prompt TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS journal_virtues (
      journal_id INTEGER NOT NULL,
      virtue_id INTEGER NOT NULL,
      value INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (journal_id, virtue_id),
      FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE CASCADE,
      FOREIGN KEY (virtue_id) REFERENCES virtues(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      completed INTEGER NOT NULL DEFAULT 0,
      prompt TEXT NOT NULL,
      duration TEXT NOT NULL DEFAULT 'Medium',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quest_virtues (
      quest_id INTEGER NOT NULL,
      virtue_id INTEGER NOT NULL,
      value INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (quest_id, virtue_id),
      FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
      FOREIGN KEY (virtue_id) REFERENCES virtues(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quest_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quest_id INTEGER,
      assigned_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS quest_history_virtues (
      history_id INTEGER NOT NULL,
      virtue_id INTEGER NOT NULL,
      value INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (history_id, virtue_id),
      FOREIGN KEY (history_id) REFERENCES quest_history(id) ON DELETE CASCADE,
      FOREIGN KEY (virtue_id) REFERENCES virtues(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS virtue_totals (
      virtue_id INTEGER PRIMARY KEY,
      total_value INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (virtue_id) REFERENCES virtues(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS virtue_progress (
      virtue_id INTEGER PRIMARY KEY,
      spec_points INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      last_activity_date TEXT,
      FOREIGN KEY (virtue_id) REFERENCES virtues(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS streak (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_completed_date TEXT,
      freezes_available INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS quest_reflections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quest_history_id INTEGER,
      text TEXT NOT NULL,
      prompt TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (quest_history_id) REFERENCES quest_history(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS spec_point_awards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      history_id INTEGER,
      virtue_id INTEGER NOT NULL,
      points INTEGER NOT NULL,
      award_date TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'quest',
      FOREIGN KEY (history_id) REFERENCES quest_history(id) ON DELETE SET NULL,
      FOREIGN KEY (virtue_id) REFERENCES virtues(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS streak_freeze_usage (
      date TEXT PRIMARY KEY
    );
  `);

  await database.runAsync('INSERT OR IGNORE INTO streak (id, freezes_available) VALUES (1, ?)', [
    gameConfig.streak.initialFreezes,
  ]);

  // Migration: add unlocked_at to existing virtues tables (or migrate from unlocked)
  const tableInfo = await database.getAllAsync<{ name: string }>('PRAGMA table_info(virtues)');
  const hasUnlockedAt = tableInfo.some((c) => c.name === 'unlocked_at');
  const hasUnlocked = tableInfo.some((c) => c.name === 'unlocked');
  if (!hasUnlockedAt) {
    await database.execAsync('ALTER TABLE virtues ADD COLUMN unlocked_at TEXT');
    if (hasUnlocked) {
      await database.execAsync(
        "UPDATE virtues SET unlocked_at = datetime('now') WHERE unlocked = 1"
      );
      await database.runAsync(
        "UPDATE virtues SET unlocked_at = '1970-01-01 00:00:00' WHERE name = ?",
        [gameConfig.virtues.defaultUnlockedVirtue]
      );
      await database.execAsync(`
        DROP TRIGGER IF EXISTS virtue_unlocked_on_totals_insert;
        DROP TRIGGER IF EXISTS virtue_unlocked_on_totals_update;
      `);
      await database.execAsync('ALTER TABLE virtues DROP COLUMN unlocked');
    }
  }

  // Migration: add duration to quests and backfill from seed prompts.
  const questTableInfo = await database.getAllAsync<{ name: string }>('PRAGMA table_info(quests)');
  const hasDuration = questTableInfo.some((c) => c.name === 'duration');
  if (!hasDuration) {
    await database.execAsync("ALTER TABLE quests ADD COLUMN duration TEXT NOT NULL DEFAULT 'Medium'");
  }

  const durationByPrompt = new Map(questsSeed.map((seedItem) => [seedItem.prompt, seedItem.duration]));
  const existingQuests = await database.getAllAsync<{ id: number; prompt: string }>(
    'SELECT id, prompt FROM quests'
  );
  const updateQuestDurationStmt = await database.prepareAsync(
    "UPDATE quests SET duration = ?, updated_at = datetime('now') WHERE id = ?"
  );
  try {
    for (const quest of existingQuests) {
      const seedDuration = durationByPrompt.get(quest.prompt);
      if (!seedDuration) continue;
      await updateQuestDurationStmt.executeAsync([seedDuration, quest.id]);
    }
  } finally {
    await updateQuestDurationStmt.finalizeAsync();
  }
  await database.execAsync("UPDATE quests SET duration = 'Medium' WHERE duration IS NULL OR duration = ''");

  // Migration: add difficulty_tier to quests.
  const hasDifficultyTier = questTableInfo.some((c) => c.name === 'difficulty_tier');
  if (!hasDifficultyTier) {
    await database.execAsync('ALTER TABLE quests ADD COLUMN difficulty_tier TEXT');
    const tierByPrompt = new Map(
      questsSeed.map((s) => [s.prompt, s.difficultyTier ?? null])
    );
    const questsForTier = await database.getAllAsync<{ id: number; prompt: string }>(
      'SELECT id, prompt FROM quests'
    );
    const updateTierStmt = await database.prepareAsync(
      "UPDATE quests SET difficulty_tier = ?, updated_at = datetime('now') WHERE id = ?"
    );
    try {
      for (const quest of questsForTier) {
        const tier = tierByPrompt.get(quest.prompt);
        if (tier == null) continue;
        await updateTierStmt.executeAsync([tier, quest.id]);
      }
    } finally {
      await updateTierStmt.finalizeAsync();
    }
  }

  const unlocksAfterTotalPoints = gameConfig.unlocking.unlocksAfterTotalPoints;
  // Triggers: set virtues.unlocked_at on first time crossing configured threshold.
  await database.execAsync(`
    DROP TRIGGER IF EXISTS virtue_unlocked_on_totals_insert;
    DROP TRIGGER IF EXISTS virtue_unlocked_on_totals_update;
    CREATE TRIGGER virtue_unlocked_on_totals_insert
    AFTER INSERT ON virtue_totals
    WHEN NEW.total_value > ${unlocksAfterTotalPoints}
    BEGIN
      UPDATE virtues SET unlocked_at = COALESCE(unlocked_at, datetime('now')) WHERE id = NEW.virtue_id;
    END;
    CREATE TRIGGER virtue_unlocked_on_totals_update
    AFTER UPDATE OF total_value ON virtue_totals
    WHEN NEW.total_value > ${unlocksAfterTotalPoints}
    BEGIN
      UPDATE virtues SET unlocked_at = COALESCE(unlocked_at, datetime('now')) WHERE id = NEW.virtue_id;
    END;
  `);
}

/** Seed virtues from constants only when the virtues table is empty. */
async function seedVirtuesIfEmpty(database: SQLite.SQLiteDatabase): Promise<void> {
  const count = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM virtues');
  if (count?.count !== 0) return;
  const insertVirtueStmt = await database.prepareAsync(
    'INSERT INTO virtues (name, slug) VALUES (?, ?)'
  );
  try {
    for (const v of virtues) {
      const slug = virtueToSlug(v);
      await insertVirtueStmt.executeAsync([v, slug]);
    }
  } finally {
    await insertVirtueStmt.finalizeAsync();
  }
}

/** Seed planned quests only when the quests table is empty. */
async function seedQuestsIfEmpty(database: SQLite.SQLiteDatabase): Promise<void> {
  const questCount = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM quests');
  if (questCount?.count !== 0) return;
  const virtueRows = await database.getAllAsync<VirtueRow>('SELECT id, name, slug, unlocked_at FROM virtues');
  const virtueIdByNameMap = new Map(virtueRows.map((v) => [v.name, v.id]));
  const insertQuestStmt = await database.prepareAsync(
    `INSERT INTO quests (completed, prompt, duration, difficulty_tier, created_at, updated_at)
     VALUES (0, ?, ?, ?, datetime('now'), datetime('now'))`
  );
  const insertQuestVirtueStmt = await database.prepareAsync(
    'INSERT INTO quest_virtues (quest_id, virtue_id, value) VALUES (?, ?, ?)'
  );
  try {
    for (const q of questsSeed) {
      const clampedVirtues = clampQuestRewards(q.virtues);
      await insertQuestStmt.executeAsync([q.prompt, q.duration, q.difficultyTier]);
      const questRow = await database.getFirstAsync<{ id: number }>(
        'SELECT id FROM quests WHERE rowid = last_insert_rowid()'
      );
      if (!questRow) continue;
      for (const [name, value] of Object.entries(clampedVirtues)) {
        if (!value) continue;
        const virtueId = virtueIdByNameMap.get(name);
        if (virtueId == null) continue;
        await insertQuestVirtueStmt.executeAsync([questRow.id, virtueId, value]);
      }
    }
  } finally {
    await insertQuestStmt.finalizeAsync();
    await insertQuestVirtueStmt.finalizeAsync();
  }
}

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    db = await SQLite.openDatabaseAsync('garden-of-the-self.db');
    await db.execAsync('PRAGMA journal_mode=WAL;');
    await initializeOrMigrateSchema(db);
    await seedVirtuesIfEmpty(db);
    // Ensure default virtue is unlocked (must run after seeding so the row exists)
    await db.runAsync(
      "UPDATE virtues SET unlocked_at = COALESCE(unlocked_at, '1970-01-01 00:00:00') WHERE name = ?",
      [gameConfig.virtues.defaultUnlockedVirtue]
    );
    virtuesCache = await db.getAllAsync<VirtueRow>('SELECT id, name, slug, unlocked_at FROM virtues');
    virtueIdByName = new Map(virtuesCache.map((v) => [v.name, v.id]));
    virtueIdBySlug = new Map(virtuesCache.map((v) => [v.slug, v.id]));
    await seedQuestsIfEmpty(db);
    return db;
  })();

  return initPromise;
}

async function ensureVirtuesLoaded() {
  if (virtuesCache && virtueIdByName && virtueIdBySlug) return;
  const database = await getDatabase();
  virtuesCache = await database.getAllAsync<VirtueRow>('SELECT id, name, slug, unlocked_at FROM virtues');
  virtueIdByName = new Map(virtuesCache.map((v) => [v.name, v.id]));
  virtueIdBySlug = new Map(virtuesCache.map((v) => [v.slug, v.id]));
}

export async function getAllVirtues(): Promise<VirtueRow[]> {
  await ensureVirtuesLoaded();
  return virtuesCache || [];
}

async function getVirtueIdFromName(name: string): Promise<number | undefined> {
  await ensureVirtuesLoaded();
  return virtueIdByName?.get(name);
}

// ---- Journals ----

export type JournalVirtueValues = Record<string, number>;
export type JournalInsertOptions = {
  sourceQuestId?: number;
  sourceQuestVirtues?: JournalVirtueValues;
};

type JournalRow = {
  id: number;
  file_path: string;
  prompt: string | null;
  created_at: string;
  updated_at: string;
};

function extractJournalDateKey(filePath: string): string {
  const match = filePath.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? getTodayDateString();
}

function hasPositiveVirtueValues(virtueValues: JournalVirtueValues): boolean {
  return Object.values(virtueValues).some((value) => value > 0);
}

function pickPositiveVirtueValues(virtueValues: JournalVirtueValues): JournalVirtueValues {
  const result: JournalVirtueValues = {};
  for (const [name, value] of Object.entries(virtueValues)) {
    if (value > 0) {
      result[name] = value;
    }
  }
  return result;
}

async function applyJournalPointsIfEligible(
  database: SQLite.SQLiteDatabase,
  filePath: string,
  virtueValues: JournalVirtueValues
) {
  if (!hasPositiveVirtueValues(virtueValues)) {
    return;
  }

  const journalDateKey = extractJournalDateKey(filePath);
  const lastAwardedDateRow = await database.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [APP_META_KEY_LAST_JOURNAL_POINTS_AWARDED_DATE]
  );

  if (lastAwardedDateRow?.value === journalDateKey) {
    return;
  }

  await applyVirtueDeltas(database, virtueValues, +1);
  await database.runAsync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    [APP_META_KEY_LAST_JOURNAL_POINTS_AWARDED_DATE, journalDateKey]
  );
}

async function applyQuestJournalBonusIfEligible(
  database: SQLite.SQLiteDatabase,
  filePath: string,
  sourceQuestId: number | undefined,
  sourceQuestVirtues: JournalVirtueValues | undefined
): Promise<void> {
  if (sourceQuestId == null || !Number.isFinite(sourceQuestId) || !sourceQuestVirtues) {
    return;
  }

  const bonusVirtues = pickPositiveVirtueValues(sourceQuestVirtues);
  if (!hasPositiveVirtueValues(bonusVirtues)) {
    return;
  }

  const awardKey = `${APP_META_KEY_JOURNAL_QUEST_BONUS_AWARDED_PREFIX}${filePath}`;
  const alreadyAwarded = await database.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [awardKey]
  );
  if (alreadyAwarded?.value === '1') {
    return;
  }

  await applyVirtueDeltas(database, bonusVirtues, +1);
  await database.runAsync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    [awardKey, '1']
  );
  await database.runAsync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    [`${APP_META_KEY_JOURNAL_QUEST_SOURCE_ID_PREFIX}${filePath}`, String(sourceQuestId)]
  );
}

async function canAwardJournalPointsForDate(dateKey: string): Promise<boolean> {
  const database = await getDatabase();
  const lastAwardedDateRow = await database.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [APP_META_KEY_LAST_JOURNAL_POINTS_AWARDED_DATE]
  );
  return lastAwardedDateRow?.value !== dateKey;
}

async function canAwardJournalPointsToday(): Promise<boolean> {
  return canAwardJournalPointsForDate(getTodayDateString());
}

async function markQuestReflectionUsedIfNeeded(
  database: SQLite.SQLiteDatabase,
  sourceQuestId: number | undefined
): Promise<void> {
  if (sourceQuestId == null || !Number.isFinite(sourceQuestId)) {
    return;
  }
  await database.runAsync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    [`${APP_META_KEY_QUEST_REFLECTION_USED_PREFIX}${sourceQuestId}`, '1']
  );
}

async function insertJournal(
  file_path: string,
  prompt: string,
  virtueValues: JournalVirtueValues,
  options?: JournalInsertOptions
) {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO journals (file_path, prompt, created_at, updated_at)
     VALUES (?, ?, datetime('now'), datetime('now'))`,
    [file_path, prompt]
  );

  const journal = await database.getFirstAsync<JournalRow>(
    'SELECT * FROM journals WHERE file_path = ?',
    [file_path]
  );
  if (!journal) return;

  await upsertJournalVirtues(database, journal.id, virtueValues);
  await applyJournalPointsIfEligible(database, file_path, virtueValues);
  await applyQuestJournalBonusIfEligible(
    database,
    file_path,
    options?.sourceQuestId,
    options?.sourceQuestVirtues
  );
  await markQuestReflectionUsedIfNeeded(database, options?.sourceQuestId);
}

async function upsertJournalVirtues(
  database: SQLite.SQLiteDatabase,
  journalId: number,
  virtueValues: JournalVirtueValues
) {
  await ensureVirtuesLoaded();
  await database.runAsync('DELETE FROM journal_virtues WHERE journal_id = ?', [journalId]);

  const insertStmt = await database.prepareAsync(
    'INSERT INTO journal_virtues (journal_id, virtue_id, value) VALUES (?, ?, ?)'
  );
  try {
    for (const [name, value] of Object.entries(virtueValues)) {
      if (!value) continue;
      const virtueId = await getVirtueIdFromName(name);
      if (!virtueId) continue;
      await insertStmt.executeAsync([journalId, virtueId, value]);
    }
  } finally {
    await insertStmt.finalizeAsync();
  }
}

async function getJournalVirtues(database: SQLite.SQLiteDatabase, journalId: number) {
  const rows = await database.getAllAsync<{
    name: string;
    value: number;
  }>(
    `SELECT v.name as name, jv.value as value
     FROM journal_virtues jv
     JOIN virtues v ON v.id = jv.virtue_id
     WHERE jv.journal_id = ?`,
    [journalId]
  );
  const result: JournalVirtueValues = {};
  for (const row of rows) {
    result[row.name] = row.value;
  }
  return result;
}

async function getJournal(file_path: string) {
  const database = await getDatabase();
  const journal = await database.getFirstAsync<JournalRow>(
    'SELECT * FROM journals WHERE file_path = ?',
    [file_path]
  );
  if (!journal) return null;

  const virtues = await getJournalVirtues(database, journal.id);
  return { ...journal, virtues };
}

async function getAllJournals() {
  const database = await getDatabase();
  const journals = await database.getAllAsync<JournalRow>(
    'SELECT * FROM journals ORDER BY created_at DESC'
  );

  const result: (JournalRow & { virtues: JournalVirtueValues })[] = [];
  for (const j of journals) {
    const virtues = await getJournalVirtues(database, j.id);
    result.push({ ...j, virtues });
  }
  return result;
}

async function updateJournal(file_path: string, prompt: string, virtueValues: JournalVirtueValues) {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE journals
     SET prompt = ?, updated_at = datetime('now')
     WHERE file_path = ?`,
    [prompt, file_path]
  );

  const journal = await database.getFirstAsync<JournalRow>(
    'SELECT * FROM journals WHERE file_path = ?',
    [file_path]
  );
  if (!journal) return;

  await upsertJournalVirtues(database, journal.id, virtueValues);
}

async function deleteJournal(file_path: string) {
  const database = await getDatabase();
  return database.runAsync('DELETE FROM journals WHERE file_path = ?', [file_path]);
}

// ---- Quests ----

/** Virtue values keyed by display name (e.g. "Courage", "Proper Ambition"). Missing virtues default to 0. */
export type QuestVirtueValues = Record<string, number>;

export type QuestRow = {
  id: number;
  completed: number;
  prompt: string;
  duration: QuestDuration;
  difficulty_tier: QuestDifficultyTier | null;
  created_at: string;
  updated_at: string;
  virtues: QuestVirtueValues;
};

export type ScoringResult = {
  awarded: boolean;
  dominantVirtue: string | null;
  specPointsAwarded: number;
  newSpecPoints: number;
  newLevel: number;
  leveledUp: boolean;
  newStageName: string;
};

export type QuestHistoryRow = {
  id: number;
  quest_id: number | null;
  assigned_at: string;
  completed_at: string | null;
  virtues: QuestVirtueValues;
};

type DailyQuestUpdate = {
  questId: number;
  assignedDate: string;
  completed: number;
  virtues: QuestVirtueValues;
  quest: QuestRow;
};

function normalizeQuestDuration(duration: string | null | undefined): QuestDuration {
  if (duration === 'Long' || duration === 'Medium' || duration === 'Short') {
    return duration;
  }
  return 'Medium';
}

function normalizeQuestDifficultyTier(tier: string | null | undefined): QuestDifficultyTier | null {
  if (tier === 'Gentle' || tier === 'Moderate' || tier === 'Stretch') return tier;
  return null;
}

function createDateSeededRandom(dateString: string): () => number {
  let seed = 0;
  for (let i = 0; i < dateString.length; i++) {
    seed = (seed * 31 + dateString.charCodeAt(i)) | 0;
  }
  return () => {
    seed = (seed * 1664525 + 1013904223) | 0;
    return (seed >>> 0) / 0x100000000;
  };
}

function sortQuestsByDurationLongestToShortest(quests: QuestRow[]): QuestRow[] {
  return [...quests].sort(
    (left, right) =>
      questDurationOrder.indexOf(left.duration) - questDurationOrder.indexOf(right.duration)
  );
}

export function getQuestDurationLabel(duration: QuestDuration): string {
  return QUEST_DURATION_LABELS[duration];
}

export async function insertQuest(
  prompt: string,
  virtueValues: QuestVirtueValues = {},
  duration: QuestDuration = 'Medium',
  difficultyTier: QuestDifficultyTier | null = null,
) {
  const database = await getDatabase();
  const clampedVirtues = clampQuestRewards(virtueValues);
  await database.runAsync(
    `INSERT INTO quests (completed, prompt, duration, difficulty_tier, created_at, updated_at)
     VALUES (0, ?, ?, ?, datetime('now'), datetime('now'))`,
    [prompt, duration, difficultyTier]
  );

  const quest = await database.getFirstAsync<{ id: number }>(
    'SELECT id FROM quests WHERE rowid = last_insert_rowid()'
  );
  if (!quest) return;

  await upsertQuestVirtues(database, quest.id, clampedVirtues);
}

async function upsertQuestVirtues(
  database: SQLite.SQLiteDatabase,
  questId: number,
  virtueValues: QuestVirtueValues
) {
  const clampedVirtues = clampQuestRewards(virtueValues);
  await ensureVirtuesLoaded();
  await database.runAsync('DELETE FROM quest_virtues WHERE quest_id = ?', [questId]);

  for (const [name, value] of Object.entries(clampedVirtues)) {
    if (!value) continue;
    const virtueId = await getVirtueIdFromName(name);
    if (!virtueId) continue;
    await database.runAsync(
      'INSERT INTO quest_virtues (quest_id, virtue_id, value) VALUES (?, ?, ?)',
      [questId, virtueId, value]
    );
  }
}

async function getQuestVirtues(database: SQLite.SQLiteDatabase, questId: number) {
  const rows = await database.getAllAsync<{
    name: string;
    value: number;
  }>(
    `SELECT v.name as name, qv.value as value
     FROM quest_virtues qv
     JOIN virtues v ON v.id = qv.virtue_id
     WHERE qv.quest_id = ?`,
    [questId]
  );
  const result: QuestVirtueValues = {};
  for (const row of rows) {
    result[row.name] = row.value;
  }
  return result;
}

async function getQuest(id: number) {
  const database = await getDatabase();
  const quest = await database.getFirstAsync<{
    id: number;
    completed: number;
    prompt: string;
    duration: string;
    difficulty_tier: string | null;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM quests WHERE id = ?', [id]);
  if (!quest) return null;

  const virtues = await getQuestVirtues(database, quest.id);
  return {
    ...quest,
    duration: normalizeQuestDuration(quest.duration),
    difficulty_tier: normalizeQuestDifficultyTier(quest.difficulty_tier),
    virtues,
  };
}

async function getAllQuests() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: number;
    completed: number;
    prompt: string;
    duration: string;
    difficulty_tier: string | null;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM quests ORDER BY created_at DESC');

  const result: QuestRow[] = [];
  for (const row of rows) {
    const virtues = await getQuestVirtues(database, row.id);
    result.push({
      ...row,
      duration: normalizeQuestDuration(row.duration),
      difficulty_tier: normalizeQuestDifficultyTier(row.difficulty_tier),
      virtues,
    });
  }
  return result;
}

function getPrimaryVirtueNameFromValues(virtueValues: QuestVirtueValues): string | null {
  let primaryVirtueName: string | null = null;
  let highestValue = Number.NEGATIVE_INFINITY;

  for (const [name, value] of Object.entries(virtueValues)) {
    if (value > highestValue) {
      primaryVirtueName = name;
      highestValue = value;
    }
  }

  return highestValue > 0 ? primaryVirtueName : null;
}

/**
 * Return today's configured daily quests. If quests have already been assigned
 * for today (via quest_history), return those. Otherwise pick up to the
 * configured count from the full pool using a date-seeded shuffle and persist
 * the assignment.
 */
async function getDailyQuests(dateString: string): Promise<QuestRow[]> {
  const database = await getDatabase();

  // Check for existing assignments today
  const assigned = await database.getAllAsync<{ quest_id: number | null; completed_at: string | null }>(
    `SELECT quest_id, completed_at FROM quest_history WHERE assigned_at = ? AND quest_id IS NOT NULL`,
    [dateString]
  );

  if (assigned.length > 0) {
    const byQuestId = new Map<number, string | null>();
    for (const row of assigned) {
      if (row.quest_id == null) continue;
      byQuestId.set(row.quest_id, row.completed_at);
    }
    const ids = assigned.map((r) => r.quest_id!).filter((id): id is number => id != null);
    const result: QuestRow[] = [];
    for (const id of ids) {
      const quest = await getQuest(id);
      if (!quest) continue;
      const completedAt = byQuestId.get(id) ?? null;
      result.push({ ...quest, completed: completedAt ? 1 : 0 });
    }
    return sortQuestsByDurationLongestToShortest(result);
  }

  const dailyQuestCount = gameConfig.quests.dailyQuestCount;
  // No assignments yet — pick up to configured daily quest count.
  const all = await getAllQuests();
  const unlockedRows = await database.getAllAsync<{ name: string }>(
    'SELECT name FROM virtues WHERE unlocked_at IS NOT NULL'
  );
  const unlockedVirtues = new Set(unlockedRows.map((row) => row.name));
  const pool = all.filter((q) => {
    const primaryVirtue = getPrimaryVirtueNameFromValues(q.virtues);
    return primaryVirtue != null && unlockedVirtues.has(primaryVirtue);
  });
  const nextRandom = createDateSeededRandom(dateString);
  const byDuration = new Map<QuestDuration, QuestRow[]>(
    questDurationOrder.map((duration) => [duration, [] as QuestRow[]])
  );
  for (const quest of pool) {
    byDuration.get(quest.duration)?.push(quest);
  }

  const picked: QuestRow[] = [];
  for (const duration of questDurationOrder) {
    const bucket = byDuration.get(duration) ?? [];
    if (bucket.length === 0) continue;
    const selectedIndex = Math.floor(nextRandom() * bucket.length);
    const [selectedQuest] = bucket.splice(selectedIndex, 1);
    if (selectedQuest) {
      picked.push(selectedQuest);
    }
  }

  if (picked.length < dailyQuestCount) {
    const remainderPool = questDurationOrder.flatMap((duration) => byDuration.get(duration) ?? []);
    while (picked.length < dailyQuestCount && remainderPool.length > 0) {
      const selectedIndex = Math.floor(nextRandom() * remainderPool.length);
      const [selectedQuest] = remainderPool.splice(selectedIndex, 1);
      if (selectedQuest) {
        picked.push(selectedQuest);
      }
    }
  }

  const orderedPicked = sortQuestsByDurationLongestToShortest(picked);

  // Persist assignments
  for (const quest of orderedPicked) {
    await database.runAsync(
      `INSERT INTO quest_history (quest_id, assigned_at) VALUES (?, ?)`,
      [quest.id, dateString]
    );
    // Copy virtue values to history
    const history = await database.getFirstAsync<{ id: number }>(
      'SELECT id FROM quest_history WHERE rowid = last_insert_rowid()'
    );
    if (history) {
      await upsertQuestHistoryVirtues(database, history.id, quest.virtues);
    }
  }
  return orderedPicked.map((q) => ({ ...q, completed: 0 }));
}

/**
 * Swap one of today's assigned (not yet completed) quests for another quest
 * with the same dominant virtue and difficulty tier. The existing
 * quest_history row is repointed at the replacement so the daily list keeps
 * its size, and the original quest stays in the pool for future days.
 * Returns the replacement quest, or null if no eligible replacement exists.
 */
async function rerollDailyQuest(oldQuestId: number, dateString: string): Promise<QuestRow | null> {
  const database = await getDatabase();

  const historyRow = await database.getFirstAsync<{ id: number; completed_at: string | null }>(
    `SELECT id, completed_at FROM quest_history
     WHERE quest_id = ? AND assigned_at = ?
     ORDER BY id DESC LIMIT 1`,
    [oldQuestId, dateString]
  );
  if (!historyRow || historyRow.completed_at != null) return null;

  const oldQuest = await getQuest(oldQuestId);
  if (!oldQuest || !oldQuest.difficulty_tier) return null;
  const dominantVirtue = getDominantVirtue(oldQuest.virtues);
  if (!dominantVirtue) return null;

  const assignedToday = await database.getAllAsync<{ quest_id: number | null }>(
    'SELECT quest_id FROM quest_history WHERE assigned_at = ? AND quest_id IS NOT NULL',
    [dateString]
  );
  const assignedIds = new Set(assignedToday.map((r) => r.quest_id));

  const all = await getAllQuests();
  const candidates = all.filter(
    (q) =>
      q.id !== oldQuestId &&
      !assignedIds.has(q.id) &&
      q.difficulty_tier === oldQuest.difficulty_tier &&
      getDominantVirtue(q.virtues) === dominantVirtue
  );
  if (candidates.length === 0) return null;

  const replacement = candidates[Math.floor(Math.random() * candidates.length)];
  await database.runAsync('UPDATE quest_history SET quest_id = ? WHERE id = ?', [
    replacement.id,
    historyRow.id,
  ]);
  await upsertQuestHistoryVirtues(database, historyRow.id, replacement.virtues);

  return { ...replacement, completed: 0 };
}

type DailyQuestCompletionResult =
  | { handled: false }
  | { handled: true; scoringResult: ScoringResult | null };

async function updateDailyQuestCompletion(update: DailyQuestUpdate): Promise<DailyQuestCompletionResult> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ id: number; completed_at: string | null }>(
    `SELECT id, completed_at
     FROM quest_history
     WHERE quest_id = ? AND assigned_at = ?
     ORDER BY id DESC
     LIMIT 1`,
    [update.questId, update.assignedDate]
  );
  if (!row) return { handled: false };

  const wasCompleted = row.completed_at != null;
  const wantsCompleted = update.completed === 1;

  let scoringResult: ScoringResult | null = null;

  if (!wasCompleted && wantsCompleted) {
    await database.runAsync('UPDATE quest_history SET completed_at = datetime(\'now\') WHERE id = ?', [row.id]);
    await upsertQuestHistoryVirtues(database, row.id, update.virtues);
    await applyVirtueDeltas(database, update.virtues, +1);
    scoringResult = await applyQuestSpecPoints(database, update.quest, row.id);
    const bonusResult = await maybeAwardDailyConsistencyBonus(database, update.quest, row.id);
    if (scoringResult && bonusResult) {
      scoringResult = {
        ...scoringResult,
        newSpecPoints: bonusResult.newSpecPoints,
        newLevel: bonusResult.newLevel,
        leveledUp: scoringResult.leveledUp || bonusResult.leveledUp,
        newStageName: levelStageName(bonusResult.newLevel),
      };
    }
    await updateStreakAfterCompletionChange(database);
  } else if (wasCompleted && !wantsCompleted) {
    await database.runAsync('UPDATE quest_history SET completed_at = NULL WHERE id = ?', [row.id]);
    await upsertQuestHistoryVirtues(database, row.id, update.virtues);
    await applyVirtueDeltas(database, update.virtues, -1);
    await reverseSpecPointsForHistory(database, row.id);
    await updateStreakAfterCompletionChange(database);
  }

  await database.runAsync(
    `UPDATE quests SET completed = ?, updated_at = datetime('now') WHERE id = ?`,
    [update.completed, update.questId]
  );
  return { handled: true, scoringResult };
}

async function updateQuest(
  id: number,
  updates: {
    completed?: number;
    prompt?: string;
    virtues?: Partial<QuestVirtueValues>;
    assignedDate?: string;
  }
): Promise<ScoringResult | null> {
  const database = await getDatabase();
  const existing = await getQuest(id);
  if (!existing) return null;

  const completed = updates.completed ?? existing.completed;
  const prompt = updates.prompt ?? existing.prompt;
  const assignedDate = updates.assignedDate;

  const newVirtues: QuestVirtueValues = { ...existing.virtues };
  for (const [name, value] of Object.entries(updates.virtues ?? {})) {
    if (typeof value === 'number') {
      newVirtues[name] = value;
    }
  }
  const clampedVirtues = clampQuestRewards(newVirtues);
  const questWithUpdatedVirtues: QuestRow = { ...existing, virtues: clampedVirtues };

  if (assignedDate) {
    const result = await updateDailyQuestCompletion({
      questId: id,
      assignedDate,
      completed,
      virtues: clampedVirtues,
      quest: questWithUpdatedVirtues,
    });
    if (result.handled) {
      return result.scoringResult;
    }
  }

  let scoringResult: ScoringResult | null = null;
  if (existing.completed === 0 && completed === 1) {
    scoringResult = await recordQuestCompleted(questWithUpdatedVirtues);
  } else if (existing.completed === 1 && completed === 0) {
    // If a previously completed quest is being marked as not completed, remove its history
    await deleteQuestHistoryForQuest(id);
  }

  await database.runAsync(
    `UPDATE quests
     SET completed = ?, prompt = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [completed, prompt, id]
  );

  await upsertQuestVirtues(database, id, clampedVirtues);
  return scoringResult;
}

async function deleteQuest(id: number) {
  const database = await getDatabase();
  return database.runAsync('DELETE FROM quests WHERE id = ?', [id]);
}

async function deleteAllQuests() {
  const database = await getDatabase();
  return database.runAsync('DELETE FROM quests');
}

async function recordQuestCompleted(quest: QuestRow): Promise<ScoringResult | null> {
  const database = await getDatabase();

  // Find the existing assigned history row for this quest
  const history = await database.getFirstAsync<{ id: number }>(
    `SELECT id FROM quest_history WHERE quest_id = ? AND completed_at IS NULL ORDER BY assigned_at DESC LIMIT 1`,
    [quest.id]
  );

  let historyId: number;
  if (history) {
    // Update the existing assignment row
    await database.runAsync(
      `UPDATE quest_history SET completed_at = datetime('now') WHERE id = ?`,
      [history.id]
    );
    await upsertQuestHistoryVirtues(database, history.id, quest.virtues);
    historyId = history.id;
  } else {
    // Fallback: insert a new row (e.g. quest completed outside daily flow)
    const today = new Date().toISOString().slice(0, 10);
    await database.runAsync(
      `INSERT INTO quest_history (quest_id, assigned_at, completed_at)
       VALUES (?, ?, datetime('now'))`,
      [quest.id, today]
    );
    const newHistory = await database.getFirstAsync<{ id: number }>(
      'SELECT id FROM quest_history WHERE rowid = last_insert_rowid()'
    );
    if (!newHistory) return null;
    await upsertQuestHistoryVirtues(database, newHistory.id, quest.virtues);
    historyId = newHistory.id;
  }

  await applyVirtueDeltas(database, quest.virtues, +1);
  let scoringResult = await applyQuestSpecPoints(database, quest, historyId);
  const bonusResult = await maybeAwardDailyConsistencyBonus(database, quest, historyId);
  if (scoringResult && bonusResult) {
    scoringResult = {
      ...scoringResult,
      newSpecPoints: bonusResult.newSpecPoints,
      newLevel: bonusResult.newLevel,
      leveledUp: scoringResult.leveledUp || bonusResult.leveledUp,
      newStageName: levelStageName(bonusResult.newLevel),
    };
  }
  await updateStreakAfterCompletionChange(database);
  return scoringResult;
}

async function applyQuestSpecPoints(
  database: SQLite.SQLiteDatabase,
  quest: QuestRow,
  historyId: number | null
): Promise<ScoringResult | null> {
  if (!quest.difficulty_tier) return null;

  await ensureVirtuesLoaded();
  const dominantVirtue = getDominantVirtue(quest.virtues);
  if (!dominantVirtue) return null;

  const virtueId = await getVirtueIdFromName(dominantVirtue);
  if (virtueId == null) return null;

  const specPointsAwarded = specPointsForTier(quest.difficulty_tier);
  const today = getTodayDateString();
  const result = await awardSpecPoints(database, virtueId, specPointsAwarded, today, historyId);

  return {
    awarded: result.awarded,
    dominantVirtue,
    specPointsAwarded: result.awarded ? specPointsAwarded : 0,
    newSpecPoints: result.newSpecPoints,
    newLevel: result.newLevel,
    leveledUp: result.leveledUp,
    newStageName: levelStageName(result.newLevel),
  };
}

async function upsertQuestHistoryVirtues(
  database: SQLite.SQLiteDatabase,
  historyId: number,
  virtueValues: QuestVirtueValues
) {
  await ensureVirtuesLoaded();
  await database.runAsync('DELETE FROM quest_history_virtues WHERE history_id = ?', [historyId]);

  for (const [name, value] of Object.entries(virtueValues)) {
    if (!value) continue;
    const virtueId = await getVirtueIdFromName(name);
    if (!virtueId) continue;
    await database.runAsync(
      'INSERT INTO quest_history_virtues (history_id, virtue_id, value) VALUES (?, ?, ?)',
      [historyId, virtueId, value]
    );
  }
}

async function getQuestHistoryVirtues(database: SQLite.SQLiteDatabase, historyId: number) {
  const rows = await database.getAllAsync<{
    name: string;
    value: number;
  }>(
    `SELECT v.name as name, qhv.value as value
     FROM quest_history_virtues qhv
     JOIN virtues v ON v.id = qhv.virtue_id
     WHERE qhv.history_id = ?`,
    [historyId]
  );
  const result: QuestVirtueValues = {};
  for (const row of rows) {
    result[row.name] = row.value;
  }
  return result;
}

async function getAllQuestHistory() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: number;
    quest_id: number | null;
    assigned_at: string;
    completed_at: string | null;
  }>('SELECT * FROM quest_history ORDER BY assigned_at DESC');

  const result: QuestHistoryRow[] = [];
  for (const row of rows) {
    const virtues = await getQuestHistoryVirtues(database, row.id);
    result.push({ ...row, virtues });
  }
  return result;
}

async function getQuestReflectionUsageMap(questIds: number[]): Promise<Record<number, boolean>> {
  const database = await getDatabase();
  const normalizedQuestIds = Array.from(
    new Set(questIds.filter((id) => Number.isFinite(id) && id > 0))
  );

  const result: Record<number, boolean> = {};
  for (const id of normalizedQuestIds) {
    result[id] = false;
  }
  if (normalizedQuestIds.length === 0) {
    return result;
  }

  const placeholders = normalizedQuestIds.map(() => '?').join(', ');
  const keys = normalizedQuestIds.map((id) => `${APP_META_KEY_QUEST_REFLECTION_USED_PREFIX}${id}`);
  const rows = await database.getAllAsync<{ key: string; value: string | null }>(
    `SELECT key, value FROM app_meta WHERE key IN (${placeholders})`,
    keys
  );

  for (const row of rows) {
    if (row.value !== '1') continue;
    const questIdText = row.key.slice(APP_META_KEY_QUEST_REFLECTION_USED_PREFIX.length);
    const questId = Number.parseInt(questIdText, 10);
    if (!Number.isFinite(questId)) continue;
    result[questId] = true;
  }

  return result;
}

async function deleteQuestHistoryForQuest(questId: number) {
  const database = await getDatabase();

  // Find completed history entries for this quest to reverse virtue points
  const rows = await database.getAllAsync<{
    name: string;
    value: number;
  }>(
    `SELECT v.name as name, qhv.value as value
     FROM quest_history h
     JOIN quest_history_virtues qhv ON qhv.history_id = h.id
     JOIN virtues v ON v.id = qhv.virtue_id
     WHERE h.quest_id = ? AND h.completed_at IS NOT NULL`,
    [questId]
  );

  const deltas: QuestVirtueValues = {};
  for (const row of rows) {
    deltas[row.name] = (deltas[row.name] ?? 0) + row.value;
  }

  if (Object.keys(deltas).length > 0) {
    await applyVirtueDeltas(database, deltas, -1);
  }

  const completedHistoryRows = await database.getAllAsync<{ id: number }>(
    'SELECT id FROM quest_history WHERE quest_id = ? AND completed_at IS NOT NULL',
    [questId]
  );
  for (const row of completedHistoryRows) {
    await reverseSpecPointsForHistory(database, row.id);
  }

  // Revert to assigned (don't delete — quest stays in today's daily list)
  await database.runAsync(
    `UPDATE quest_history SET completed_at = NULL WHERE quest_id = ? AND completed_at IS NOT NULL`,
    [questId]
  );
  await updateStreakAfterCompletionChange(database);
}

async function applyVirtueDeltas(
  database: SQLite.SQLiteDatabase,
  deltas: QuestVirtueValues,
  sign: 1 | -1
) {
  await ensureVirtuesLoaded();

  for (const [name, value] of Object.entries(deltas)) {
    if (!value) continue;
    const virtueId = await getVirtueIdFromName(name);
    if (!virtueId) continue;

    const existing = await database.getFirstAsync<{ total_value: number }>(
      'SELECT total_value FROM virtue_totals WHERE virtue_id = ?',
      [virtueId]
    );

    const delta = sign * value;
    const newTotal = Math.max(0, (existing?.total_value ?? 0) + delta);

    if (existing) {
      await database.runAsync(
        'UPDATE virtue_totals SET total_value = ? WHERE virtue_id = ?',
        [newTotal, virtueId]
      );
    } else {
      await database.runAsync(
        'INSERT INTO virtue_totals (virtue_id, total_value) VALUES (?, ?)',
        [virtueId, newTotal]
      );
    }

    if (
      name === gameConfig.unlocking.decayGateVirtue &&
      newTotal > gameConfig.unlocking.decayGateOpensAfterPoints
    ) {
      await database.runAsync(
        'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
        [APP_META_KEY_CURIOSITY_EVER_CROSSED_5, '1']
      );
    }
  }
}

/** Add points directly to virtue totals (e.g. for devtools). */
export async function addVirtuePoints(deltas: QuestVirtueValues): Promise<void> {
  const database = await getDatabase();
  await applyVirtueDeltas(database, deltas, 1);
}

/** Count quest completions that have already awarded spec-points to this virtue today (excludes bonuses). */
async function getVirtueSpecPointAwardsToday(
  database: SQLite.SQLiteDatabase,
  virtueId: number,
  date: string
): Promise<number> {
  const row = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM spec_point_awards
     WHERE virtue_id = ? AND award_date = ? AND kind = 'quest'`,
    [virtueId, date]
  );
  return row?.count ?? 0;
}

export type SpecPointAwardKind = 'quest' | 'streak_bonus';

/**
 * Award spec-points to a virtue, respecting the daily cap for 'quest' awards
 * (bonuses bypass the cap and do not consume a cap slot). Each award is
 * logged in spec_point_awards so it can be counted and reversed accurately.
 * Returns full scoring details so callers can surface level-ups.
 */
async function awardSpecPoints(
  database: SQLite.SQLiteDatabase,
  virtueId: number,
  points: number,
  date: string,
  historyId: number | null,
  kind: SpecPointAwardKind = 'quest'
): Promise<{ awarded: boolean; newSpecPoints: number; newLevel: number; leveledUp: boolean }> {
  const current = await database.getFirstAsync<{ spec_points: number; level: number }>(
    'SELECT spec_points, level FROM virtue_progress WHERE virtue_id = ?',
    [virtueId]
  );
  const oldLevel = current?.level ?? 1;
  const currentSpecPoints = current?.spec_points ?? 0;

  if (kind === 'quest') {
    const cap = gameConfig.quests.difficultyTiers.dailyCapPerVirtue;
    const awardsToday = await getVirtueSpecPointAwardsToday(database, virtueId, date);
    if (awardsToday >= cap) {
      return { awarded: false, newSpecPoints: currentSpecPoints, newLevel: oldLevel, leveledUp: false };
    }
  }

  const newSpecPoints = currentSpecPoints + points;
  const newLevel = specPointsToLevel(newSpecPoints);

  await database.runAsync(
    `INSERT INTO virtue_progress (virtue_id, spec_points, level, last_activity_date)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(virtue_id) DO UPDATE SET
       spec_points = excluded.spec_points,
       level = excluded.level,
       last_activity_date = excluded.last_activity_date`,
    [virtueId, newSpecPoints, newLevel, date]
  );
  await database.runAsync(
    'INSERT INTO spec_point_awards (history_id, virtue_id, points, award_date, kind) VALUES (?, ?, ?, ?, ?)',
    [historyId, virtueId, points, date, kind]
  );

  return { awarded: true, newSpecPoints, newLevel, leveledUp: newLevel > oldLevel };
}

/**
 * Reverse all spec-point awards linked to a quest_history row (used when a
 * completion is undone the same session/day). Points are subtracted and the
 * level re-derived; the award log rows are removed so the daily cap frees up.
 */
async function reverseSpecPointsForHistory(
  database: SQLite.SQLiteDatabase,
  historyId: number
): Promise<void> {
  const awards = await database.getAllAsync<{ id: number; virtue_id: number; points: number }>(
    'SELECT id, virtue_id, points FROM spec_point_awards WHERE history_id = ?',
    [historyId]
  );
  for (const award of awards) {
    const current = await database.getFirstAsync<{ spec_points: number }>(
      'SELECT spec_points FROM virtue_progress WHERE virtue_id = ?',
      [award.virtue_id]
    );
    const newSpecPoints = Math.max(0, (current?.spec_points ?? 0) - award.points);
    const newLevel = specPointsToLevel(newSpecPoints);
    await database.runAsync(
      'UPDATE virtue_progress SET spec_points = ?, level = ? WHERE virtue_id = ?',
      [newSpecPoints, newLevel, award.virtue_id]
    );
    await database.runAsync('DELETE FROM spec_point_awards WHERE id = ?', [award.id]);
  }
}

async function getVirtueTotals(): Promise<QuestVirtueValues> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    name: string;
    total_value: number;
  }>(
    `SELECT v.name as name, COALESCE(t.total_value, 0) as total_value
     FROM virtues v
     LEFT JOIN virtue_totals t ON t.virtue_id = v.id`
  );

  const result: QuestVirtueValues = {};
  for (const row of rows) {
    result[row.name] = row.total_value;
  }
  return result;
}

export type VirtueTotalsAndUnlocked = {
  totals: QuestVirtueValues;
  unlockedAt: Record<string, string | null>;
  /** Backward-compatible flag name: true once the decay-gated virtue has crossed its threshold once. */
  curiosityEverCrossed5: boolean;
};

const APP_META_KEY_LAST_VIRTUE_DECAY_DATE = 'last_virtue_decay_date';
const APP_META_KEY_CURIOSITY_EVER_CROSSED_5 = 'curiosity_ever_crossed_5';
const APP_META_KEY_LAST_JOURNAL_POINTS_AWARDED_DATE = 'last_journal_points_awarded_date';
const APP_META_KEY_JOURNAL_QUEST_BONUS_AWARDED_PREFIX = 'journal_quest_bonus_awarded:';
const APP_META_KEY_JOURNAL_QUEST_SOURCE_ID_PREFIX = 'journal_source_quest_id:';
const APP_META_KEY_QUEST_REFLECTION_USED_PREFIX = 'quest_reflection_used:';

/** Apply −1 point per calendar day for each unlocked virtue. The configured decay-gated virtue decays only after crossing its configured threshold once. */
async function applyDailyVirtueDecayIfNeeded(database: SQLite.SQLiteDatabase): Promise<void> {
  const today = getTodayDateString();

  const row = await database.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [APP_META_KEY_LAST_VIRTUE_DECAY_DATE]
  );
  const lastDate = row?.value ?? null;

  if (lastDate === null || lastDate === '') {
    await database.runAsync(
      'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
      [APP_META_KEY_LAST_VIRTUE_DECAY_DATE, today]
    );
    return;
  }

  const last = new Date(lastDate + 'T12:00:00');
  const curr = new Date(today + 'T12:00:00');
  const daysSince = Math.max(0, Math.floor((curr.getTime() - last.getTime()) / (24 * 60 * 60 * 1000)));

  if (daysSince === 0) return;

  const curiosityCrossedRow = await database.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [APP_META_KEY_CURIOSITY_EVER_CROSSED_5]
  );
  const curiosityEverCrossed5 = curiosityCrossedRow?.value === '1';

  const unlockedRows = await database.getAllAsync<{ id: number; name: string }>(
    'SELECT id, name FROM virtues WHERE unlocked_at IS NOT NULL'
  );
  const virtuesToDecay = unlockedRows.filter(
    (v) => v.name !== gameConfig.unlocking.decayGateVirtue || curiosityEverCrossed5
  );

  for (const v of virtuesToDecay) {
    const totalRow = await database.getFirstAsync<{ total_value: number }>(
      'SELECT total_value FROM virtue_totals WHERE virtue_id = ?',
      [v.id]
    );
    const currentTotal = totalRow?.total_value ?? 0;
    const decay = Math.min(daysSince, currentTotal);
    if (decay <= 0) continue;
    const newTotal = currentTotal - decay;
    if (totalRow) {
      await database.runAsync(
        'UPDATE virtue_totals SET total_value = ? WHERE virtue_id = ?',
        [newTotal, v.id]
      );
    } else if (newTotal > 0) {
      await database.runAsync(
        'INSERT INTO virtue_totals (virtue_id, total_value) VALUES (?, ?)',
        [v.id, newTotal]
      );
    }
  }

  await database.runAsync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    [APP_META_KEY_LAST_VIRTUE_DECAY_DATE, today]
  );
}

export async function getVirtueTotalsAndUnlocked(): Promise<VirtueTotalsAndUnlocked> {
  const database = await getDatabase();
  await applyDailyVirtueDecayIfNeeded(database);
  const rows = await database.getAllAsync<{
    name: string;
    total_value: number;
    unlocked_at: string | null;
  }>(
    `SELECT v.name as name, COALESCE(t.total_value, 0) as total_value, v.unlocked_at as unlocked_at
     FROM virtues v
     LEFT JOIN virtue_totals t ON t.virtue_id = v.id`
  );

  const totals: QuestVirtueValues = {};
  const unlockedAt: Record<string, string | null> = {};
  for (const row of rows) {
    totals[row.name] = row.total_value;
    unlockedAt[row.name] = row.unlocked_at;
  }

  const curiosityRow = await database.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [APP_META_KEY_CURIOSITY_EVER_CROSSED_5]
  );
  const curiosityEverCrossed5 = curiosityRow?.value === '1';

  return { totals, unlockedAt, curiosityEverCrossed5 };
}

async function getQuestHistory(limit: number) {
  const all = await getAllQuestHistory();
  return all.slice(0, limit);
}

/** Returns virtue display names that have a value > 0 on the quest/history, sorted by value descending (primary first) */
export function getQuestVirtueDisplayNames(
  item: { virtues: QuestVirtueValues }
): string[] {
  return Object.entries(item.virtues)
    .filter(([, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name]) => name);
}

// ---- Virtue progress helpers ----

export async function getVirtueProgress(virtueName: string): Promise<VirtueProgressRow | null> {
  const database = await getDatabase();
  const virtueId = await getVirtueIdFromName(virtueName);
  if (virtueId == null) return null;
  const row = await database.getFirstAsync<VirtueProgressRow>(
    'SELECT virtue_id, spec_points, level, last_activity_date FROM virtue_progress WHERE virtue_id = ?',
    [virtueId]
  );
  return row ?? null;
}

export async function getAllVirtueProgress(): Promise<Record<string, VirtueProgressRow>> {
  const database = await getDatabase();
  await ensureVirtuesLoaded();
  const rows = await database.getAllAsync<VirtueProgressRow & { name: string }>(
    `SELECT vp.virtue_id, vp.spec_points, vp.level, vp.last_activity_date, v.name
     FROM virtue_progress vp
     JOIN virtues v ON v.id = vp.virtue_id`
  );
  const result: Record<string, VirtueProgressRow> = {};
  for (const row of rows) {
    result[row.name] = { virtue_id: row.virtue_id, spec_points: row.spec_points, level: row.level, last_activity_date: row.last_activity_date };
  }
  return result;
}

// ---- Streak helpers ----

export async function getStreak(): Promise<StreakRow> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<StreakRow>(
    'SELECT current_streak, longest_streak, last_completed_date, freezes_available FROM streak WHERE id = 1'
  );
  return row ?? { current_streak: 0, longest_streak: 0, last_completed_date: null, freezes_available: 0 };
}

/**
 * If exactly one day was missed between the last completion and today and a
 * streak freeze is available, consume it: the missed day is recorded in
 * streak_freeze_usage and counts as covered when the streak is recomputed.
 */
async function maybeConsumeStreakFreeze(database: SQLite.SQLiteDatabase, today: string): Promise<void> {
  const streak = await getStreak();
  if (!streak.last_completed_date || streak.freezes_available <= 0) return;
  if (diffInDays(streak.last_completed_date, today) !== 2) return;

  const missedDay = addDaysToDateString(today, -1);
  const alreadyFrozen = await database.getFirstAsync<{ date: string }>(
    'SELECT date FROM streak_freeze_usage WHERE date = ?',
    [missedDay]
  );
  if (alreadyFrozen) return;

  await database.runAsync('INSERT INTO streak_freeze_usage (date) VALUES (?)', [missedDay]);
  await database.runAsync(
    'UPDATE streak SET freezes_available = MAX(0, freezes_available - 1) WHERE id = 1'
  );
}

/**
 * Recompute current/longest streak from quest_history completion dates plus
 * freeze-covered days. Self-healing: works after completions are undone too.
 * A day with no completion yet does not break the streak until it is over,
 * so the current streak anchors on today or yesterday.
 */
export async function recomputeStreak(): Promise<StreakRow> {
  const database = await getDatabase();

  const completionRows = await database.getAllAsync<{ d: string }>(
    `SELECT DISTINCT date(completed_at, 'localtime') AS d
     FROM quest_history
     WHERE completed_at IS NOT NULL
     ORDER BY d ASC`
  );
  const frozenRows = await database.getAllAsync<{ date: string }>(
    'SELECT date FROM streak_freeze_usage'
  );

  const completionDates = completionRows.map((r) => r.d);
  const coveredDays = new Set<string>([...completionDates, ...frozenRows.map((r) => r.date)]);

  let longest = 0;
  for (const day of coveredDays) {
    if (coveredDays.has(addDaysToDateString(day, -1))) continue; // not a run start
    let length = 1;
    let cursor = day;
    while (coveredDays.has(addDaysToDateString(cursor, 1))) {
      cursor = addDaysToDateString(cursor, 1);
      length++;
    }
    longest = Math.max(longest, length);
  }

  const today = getTodayDateString();
  const yesterday = addDaysToDateString(today, -1);
  const anchor = coveredDays.has(today) ? today : coveredDays.has(yesterday) ? yesterday : null;
  let current = 0;
  if (anchor) {
    current = 1;
    let cursor = anchor;
    while (coveredDays.has(addDaysToDateString(cursor, -1))) {
      cursor = addDaysToDateString(cursor, -1);
      current++;
    }
  }

  const lastCompletedDate =
    completionDates.length > 0 ? completionDates[completionDates.length - 1] : null;

  await database.runAsync(
    `UPDATE streak
     SET current_streak = ?, longest_streak = MAX(longest_streak, ?), last_completed_date = ?
     WHERE id = 1`,
    [current, Math.max(longest, current), lastCompletedDate]
  );
  return getStreak();
}

/** True when at least one quest was completed on the given YYYY-MM-DD local date. */
export async function hasQuestCompletionOnDate(date: string): Promise<boolean> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM quest_history
     WHERE completed_at IS NOT NULL AND date(completed_at, 'localtime') = ?`,
    [date]
  );
  return (row?.count ?? 0) > 0;
}

/** Run after any completion change: consume a freeze if it saves the streak, then recompute. */
async function updateStreakAfterCompletionChange(database: SQLite.SQLiteDatabase): Promise<void> {
  await maybeConsumeStreakFreeze(database, getTodayDateString());
  await recomputeStreak();
  await grantStreakMilestonesIfReached(database);
}

const APP_META_KEY_STREAK_MILESTONE_PREFIX = 'streak_milestone_granted:';
const APP_META_KEY_COSMETIC_UNLOCKED_PREFIX = 'cosmetic_unlocked:';
const APP_META_KEY_PENDING_STREAK_CELEBRATIONS = 'pending_streak_celebrations';

/**
 * Grant each configured streak milestone the first time the current streak
 * reaches it (once ever): adds streak freezes, records the cosmetic unlock,
 * and queues a celebration message for the UI to consume.
 */
async function grantStreakMilestonesIfReached(database: SQLite.SQLiteDatabase): Promise<void> {
  const streak = await getStreak();
  const newCelebrations: string[] = [];

  for (const milestone of gameConfig.streak.milestones) {
    if (streak.current_streak < milestone.days) continue;
    const grantedKey = `${APP_META_KEY_STREAK_MILESTONE_PREFIX}${milestone.days}`;
    const granted = await database.getFirstAsync<{ value: string | null }>(
      'SELECT value FROM app_meta WHERE key = ?',
      [grantedKey]
    );
    if (granted?.value === '1') continue;

    await database.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', [
      grantedKey,
      '1',
    ]);
    if (milestone.freezes > 0) {
      await database.runAsync(
        'UPDATE streak SET freezes_available = freezes_available + ? WHERE id = 1',
        [milestone.freezes]
      );
    }
    await database.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', [
      `${APP_META_KEY_COSMETIC_UNLOCKED_PREFIX}${milestone.cosmetic}`,
      '1',
    ]);
    newCelebrations.push(
      `${milestone.days}-day streak! ${milestone.label} unlocked` +
        (milestone.freezes > 0 ? ` · +${milestone.freezes} streak freeze${milestone.freezes > 1 ? 's' : ''}` : '')
    );
  }

  if (newCelebrations.length > 0) {
    const existingRow = await database.getFirstAsync<{ value: string | null }>(
      'SELECT value FROM app_meta WHERE key = ?',
      [APP_META_KEY_PENDING_STREAK_CELEBRATIONS]
    );
    let pending: string[] = [];
    try {
      pending = existingRow?.value ? JSON.parse(existingRow.value) : [];
    } catch {
      pending = [];
    }
    await database.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', [
      APP_META_KEY_PENDING_STREAK_CELEBRATIONS,
      JSON.stringify([...pending, ...newCelebrations]),
    ]);
  }
}

/** Pop (return and clear) milestone celebration messages queued for the UI. */
export async function consumePendingStreakCelebrations(): Promise<string[]> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [APP_META_KEY_PENDING_STREAK_CELEBRATIONS]
  );
  if (!row?.value) return [];
  let pending: string[] = [];
  try {
    pending = JSON.parse(row.value);
  } catch {
    pending = [];
  }
  await database.runAsync('DELETE FROM app_meta WHERE key = ?', [
    APP_META_KEY_PENDING_STREAK_CELEBRATIONS,
  ]);
  return pending;
}

/** Cosmetic ids unlocked via streak milestones. */
export async function getUnlockedCosmetics(): Promise<string[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ key: string; value: string | null }>(
    "SELECT key, value FROM app_meta WHERE key LIKE 'cosmetic_unlocked:%'"
  );
  return rows
    .filter((r) => r.value === '1')
    .map((r) => r.key.slice(APP_META_KEY_COSMETIC_UNLOCKED_PREFIX.length));
}

/**
 * Daily consistency bonus (spec 2.4): the first completed quest of each day
 * grants extra spec-points to that quest's dominant virtue, routed through
 * the same scoring engine as regular awards ('streak_bonus' kind bypasses
 * and does not consume the daily cap). Linked to the completion's history
 * row, so unchecking reverses it along with the quest award.
 */
async function maybeAwardDailyConsistencyBonus(
  database: SQLite.SQLiteDatabase,
  quest: QuestRow,
  historyId: number
): Promise<{ leveledUp: boolean; newLevel: number; newSpecPoints: number } | null> {
  const bonus = gameConfig.streak.dailyBonusPoints;
  if (bonus <= 0) return null;

  const today = getTodayDateString();
  const completionsToday = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM quest_history
     WHERE completed_at IS NOT NULL AND date(completed_at, 'localtime') = ?`,
    [today]
  );
  // The current completion is already written, so 1 means "first of the day".
  if ((completionsToday?.count ?? 0) !== 1) return null;

  const dominantVirtue = getDominantVirtue(quest.virtues);
  if (!dominantVirtue) return null;
  const virtueId = await getVirtueIdFromName(dominantVirtue);
  if (virtueId == null) return null;

  const result = await awardSpecPoints(database, virtueId, bonus, today, historyId, 'streak_bonus');
  if (!result.awarded) return null;
  return { leveledUp: result.leveledUp, newLevel: result.newLevel, newSpecPoints: result.newSpecPoints };
}

// ---- Quest reflection helpers ----

/** History row id for a quest assigned on a given date (used to link reflections). */
export async function getQuestHistoryIdForQuest(
  questId: number,
  assignedDate: string
): Promise<number | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ id: number }>(
    `SELECT id FROM quest_history
     WHERE quest_id = ? AND assigned_at = ?
     ORDER BY id DESC LIMIT 1`,
    [questId, assignedDate]
  );
  return row?.id ?? null;
}

export type QuestReflectionWithContext = QuestReflectionRow & {
  quest_prompt: string | null;
  /** Virtue values of the completed quest (dominant virtue derivable via getDominantVirtue). */
  virtues: QuestVirtueValues;
};

/** Recent reflections joined with their quest prompt + virtues (for detail views). */
export async function getRecentQuestReflections(limit = 50): Promise<QuestReflectionWithContext[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<QuestReflectionRow & { quest_prompt: string | null }>(
    `SELECT r.id, r.quest_history_id, r.text, r.prompt, r.created_at, q.prompt AS quest_prompt
     FROM quest_reflections r
     LEFT JOIN quest_history h ON h.id = r.quest_history_id
     LEFT JOIN quests q ON q.id = h.quest_id
     ORDER BY r.created_at DESC
     LIMIT ?`,
    [limit]
  );
  const result: QuestReflectionWithContext[] = [];
  for (const row of rows) {
    const virtues =
      row.quest_history_id != null
        ? await getQuestHistoryVirtues(database, row.quest_history_id)
        : {};
    result.push({ ...row, virtues });
  }
  return result;
}

export async function insertQuestReflection(
  questHistoryId: number | null,
  text: string,
  prompt: string | null
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO quest_reflections (quest_history_id, text, prompt, created_at)
     VALUES (?, ?, ?, datetime('now'))`,
    [questHistoryId, text, prompt]
  );
}

export async function getReflectionsForQuestHistory(questHistoryId: number): Promise<QuestReflectionRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<QuestReflectionRow>(
    'SELECT id, quest_history_id, text, prompt, created_at FROM quest_reflections WHERE quest_history_id = ? ORDER BY created_at DESC',
    [questHistoryId]
  );
}

// ---- Devtools helpers ----

/** Destructive reset: drops all tables, recreates schema, and reseeds virtues and quests. */
export async function resetDatabase() {
  const database = await getDatabase();
  await database.execAsync(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS streak_freeze_usage;
    DROP TABLE IF EXISTS spec_point_awards;
    DROP TABLE IF EXISTS quest_reflections;
    DROP TABLE IF EXISTS virtue_progress;
    DROP TABLE IF EXISTS streak;
    DROP TABLE IF EXISTS quest_history_virtues;
    DROP TABLE IF EXISTS quest_history;
    DROP TABLE IF EXISTS quest_virtues;
    DROP TABLE IF EXISTS quests;
    DROP TABLE IF EXISTS journal_virtues;
    DROP TABLE IF EXISTS journals;
    DROP TABLE IF EXISTS virtues;
    DROP TABLE IF EXISTS virtue_totals;
    DROP TABLE IF EXISTS app_meta;
    PRAGMA foreign_keys = ON;
  `);
  await initializeOrMigrateSchema(database);
  await seedVirtuesIfEmpty(database);
  await database.runAsync(
    "UPDATE virtues SET unlocked_at = '1970-01-01 00:00:00' WHERE name = ?",
    [gameConfig.virtues.defaultUnlockedVirtue]
  );
  virtuesCache = await database.getAllAsync<VirtueRow>('SELECT id, name, slug, unlocked_at FROM virtues');
  virtueIdByName = new Map(virtuesCache.map((v) => [v.name, v.id]));
  virtueIdBySlug = new Map(virtuesCache.map((v) => [v.slug, v.id]));
  await seedQuestsIfEmpty(database);
}

export type TableName =
  | 'journals'
  | 'journal_virtues'
  | 'quests'
  | 'quest_virtues'
  | 'quest_history'
  | 'quest_history_virtues'
  | 'quest_reflections'
  | 'virtues'
  | 'virtue_totals'
  | 'virtue_progress'
  | 'spec_point_awards'
  | 'streak'
  | 'streak_freeze_usage';

export async function getAllFromTable(table: TableName): Promise<any[]> {
  const database = await getDatabase();
  return database.getAllAsync<any>(`SELECT * FROM ${table}`);
}

export {
  insertJournal,
  getJournal,
  getAllJournals,
  updateJournal,
  deleteJournal,
  canAwardJournalPointsForDate,
  canAwardJournalPointsToday,
};
export { getQuest, getAllQuests, getDailyQuests, updateQuest, deleteQuest, deleteAllQuests, rerollDailyQuest };
export { getAllQuestHistory, getQuestHistory, getVirtueTotals, getQuestReflectionUsageMap };