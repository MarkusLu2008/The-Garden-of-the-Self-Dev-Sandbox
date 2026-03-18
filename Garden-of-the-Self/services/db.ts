import * as SQLite from 'expo-sqlite';
import virtues from '@/constants/virtues';

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
      quest_id INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      event TEXT NOT NULL DEFAULT 'completed',
      FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
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
  `);

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
        "UPDATE virtues SET unlocked_at = '1970-01-01 00:00:00' WHERE name = 'Curiosity'"
      );
      await database.execAsync(`
        DROP TRIGGER IF EXISTS virtue_unlocked_on_totals_insert;
        DROP TRIGGER IF EXISTS virtue_unlocked_on_totals_update;
      `);
      await database.execAsync('ALTER TABLE virtues DROP COLUMN unlocked');
    }
  }

  // Triggers: set virtues.unlocked_at on first time crossing total_value > 5
  await database.execAsync(`
    DROP TRIGGER IF EXISTS virtue_unlocked_on_totals_insert;
    DROP TRIGGER IF EXISTS virtue_unlocked_on_totals_update;
    CREATE TRIGGER virtue_unlocked_on_totals_insert
    AFTER INSERT ON virtue_totals
    WHEN NEW.total_value > 5
    BEGIN
      UPDATE virtues SET unlocked_at = COALESCE(unlocked_at, datetime('now')) WHERE id = NEW.virtue_id;
    END;
    CREATE TRIGGER virtue_unlocked_on_totals_update
    AFTER UPDATE OF total_value ON virtue_totals
    WHEN NEW.total_value > 5
    BEGIN
      UPDATE virtues SET unlocked_at = COALESCE(unlocked_at, datetime('now')) WHERE id = NEW.virtue_id;
    END;
  `);

  // Curiosity is unlocked by default (sorts first)
  await database.runAsync(
    "UPDATE virtues SET unlocked_at = '1970-01-01 00:00:00' WHERE name = 'Curiosity'"
  );
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
  const { questsSeed } = await import('@/data/quests-seed');
  const insertQuestStmt = await database.prepareAsync(
    `INSERT INTO quests (completed, prompt, created_at, updated_at)
     VALUES (0, ?, datetime('now'), datetime('now'))`
  );
  const insertQuestVirtueStmt = await database.prepareAsync(
    'INSERT INTO quest_virtues (quest_id, virtue_id, value) VALUES (?, ?, ?)'
  );
  try {
    for (const q of questsSeed) {
      await insertQuestStmt.executeAsync([q.prompt]);
      const questRow = await database.getFirstAsync<{ id: number }>(
        'SELECT id FROM quests WHERE rowid = last_insert_rowid()'
      );
      if (!questRow) continue;
      for (const [name, value] of Object.entries(q.virtues)) {
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
    await initializeOrMigrateSchema(db);
    await seedVirtuesIfEmpty(db);
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

type JournalRow = {
  id: number;
  file_path: string;
  prompt: string | null;
  created_at: string;
  updated_at: string;
};

async function insertJournal(file_path: string, prompt: string, virtueValues: JournalVirtueValues) {
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
  await applyVirtueDeltas(database, virtueValues, +1);
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
  created_at: string;
  updated_at: string;
  virtues: QuestVirtueValues;
};

export type QuestHistoryRow = {
  id: number;
  quest_id: number;
  completed_at: string;
  event: string;
  virtues: QuestVirtueValues;
};

async function insertQuest(prompt: string, virtueValues: QuestVirtueValues = {}) {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO quests (completed, prompt, created_at, updated_at)
     VALUES (0, ?, datetime('now'), datetime('now'))`,
    [prompt]
  );

  const quest = await database.getFirstAsync<{ id: number }>(
    'SELECT id FROM quests WHERE rowid = last_insert_rowid()'
  );
  if (!quest) return;

  await upsertQuestVirtues(database, quest.id, virtueValues);
}

async function upsertQuestVirtues(
  database: SQLite.SQLiteDatabase,
  questId: number,
  virtueValues: QuestVirtueValues
) {
  await ensureVirtuesLoaded();
  await database.runAsync('DELETE FROM quest_virtues WHERE quest_id = ?', [questId]);

  const insertStmt = await database.prepareAsync(
    'INSERT INTO quest_virtues (quest_id, virtue_id, value) VALUES (?, ?, ?)'
  );
  try {
    for (const [name, value] of Object.entries(virtueValues)) {
      if (!value) continue;
      const virtueId = await getVirtueIdFromName(name);
      if (!virtueId) continue;
      await insertStmt.executeAsync([questId, virtueId, value]);
    }
  } finally {
    await insertStmt.finalizeAsync();
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
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM quests WHERE id = ?', [id]);
  if (!quest) return null;

  const virtues = await getQuestVirtues(database, quest.id);
  return { ...quest, virtues };
}

async function getAllQuests() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: number;
    completed: number;
    prompt: string;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM quests ORDER BY created_at DESC');

  const result: QuestRow[] = [];
  for (const row of rows) {
    const virtues = await getQuestVirtues(database, row.id);
    result.push({ ...row, virtues });
  }
  return result;
}

async function updateQuest(
  id: number,
  updates: {
    completed?: number;
    prompt?: string;
  } & Partial<QuestVirtueValues>
) {
  const database = await getDatabase();
  const existing = await getQuest(id);
  if (!existing) return;

  const completed = updates.completed ?? existing.completed;
  const prompt = updates.prompt ?? existing.prompt;

  const newVirtues: QuestVirtueValues = { ...existing.virtues };
  for (const [name, value] of Object.entries(updates)) {
    if (name === 'completed' || name === 'prompt') continue;
    if (typeof value === 'number') {
      newVirtues[name] = value;
    }
  }

  if (existing.completed === 0 && completed === 1) {
    await recordQuestCompleted({ ...existing, virtues: newVirtues });
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

  await upsertQuestVirtues(database, id, newVirtues);
}

async function deleteQuest(id: number) {
  const database = await getDatabase();
  return database.runAsync('DELETE FROM quests WHERE id = ?', [id]);
}

async function deleteAllQuests() {
  const database = await getDatabase();
  return database.runAsync('DELETE FROM quests');
}

async function recordQuestCompleted(quest: QuestRow) {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO quest_history (quest_id, completed_at, event)
     VALUES (?, datetime('now'), ?)`,
    [quest.id, 'completed']
  );

  const history = await database.getFirstAsync<{ id: number }>(
    'SELECT id FROM quest_history WHERE rowid = last_insert_rowid()'
  );
  if (!history) return;

  await upsertQuestHistoryVirtues(database, history.id, quest.virtues);
  await applyVirtueDeltas(database, quest.virtues, +1);
}

async function upsertQuestHistoryVirtues(
  database: SQLite.SQLiteDatabase,
  historyId: number,
  virtueValues: QuestVirtueValues
) {
  await ensureVirtuesLoaded();
  await database.runAsync('DELETE FROM quest_history_virtues WHERE history_id = ?', [historyId]);

  const insertStmt = await database.prepareAsync(
    'INSERT INTO quest_history_virtues (history_id, virtue_id, value) VALUES (?, ?, ?)'
  );
  try {
    for (const [name, value] of Object.entries(virtueValues)) {
      if (!value) continue;
      const virtueId = await getVirtueIdFromName(name);
      if (!virtueId) continue;
      await insertStmt.executeAsync([historyId, virtueId, value]);
    }
  } finally {
    await insertStmt.finalizeAsync();
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
    quest_id: number;
    completed_at: string;
    event: string;
  }>('SELECT * FROM quest_history ORDER BY completed_at DESC');

  const result: QuestHistoryRow[] = [];
  for (const row of rows) {
    const virtues = await getQuestHistoryVirtues(database, row.id);
    result.push({ ...row, virtues });
  }
  return result;
}

async function deleteQuestHistoryForQuest(questId: number) {
  const database = await getDatabase();

  // Aggregate virtue deltas for all history entries of this quest
  const rows = await database.getAllAsync<{
    name: string;
    value: number;
  }>(
    `SELECT v.name as name, qhv.value as value
     FROM quest_history h
     JOIN quest_history_virtues qhv ON qhv.history_id = h.id
     JOIN virtues v ON v.id = qhv.virtue_id
     WHERE h.quest_id = ?`,
    [questId]
  );

  const deltas: QuestVirtueValues = {};
  for (const row of rows) {
    deltas[row.name] = (deltas[row.name] ?? 0) + row.value;
  }

  if (Object.keys(deltas).length > 0) {
    await applyVirtueDeltas(database, deltas, -1);
  }

  await database.runAsync('DELETE FROM quest_history WHERE quest_id = ?', [questId]);
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
  }
}

/** Add points directly to virtue totals (e.g. for devtools). */
export async function addVirtuePoints(deltas: QuestVirtueValues): Promise<void> {
  const database = await getDatabase();
  await applyVirtueDeltas(database, deltas, 1);
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
};

export async function getVirtueTotalsAndUnlocked(): Promise<VirtueTotalsAndUnlocked> {
  const database = await getDatabase();
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
  return { totals, unlockedAt };
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

// ---- Devtools helpers ----

/** Destructive reset: drops all tables, recreates schema, and reseeds virtues and quests. */
export async function resetDatabase() {
  const database = await getDatabase();
  await database.execAsync(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS quest_history_virtues;
    DROP TABLE IF EXISTS quest_history;
    DROP TABLE IF EXISTS quest_virtues;
    DROP TABLE IF EXISTS quests;
    DROP TABLE IF EXISTS journal_virtues;
    DROP TABLE IF EXISTS journals;
    DROP TABLE IF EXISTS virtues;
    DROP TABLE IF EXISTS virtue_totals;
    PRAGMA foreign_keys = ON;
  `);
  await initializeOrMigrateSchema(database);
  await seedVirtuesIfEmpty(database);
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
  | 'virtues'
  | 'virtue_totals';

export async function getAllFromTable(table: TableName): Promise<any[]> {
  const database = await getDatabase();
  return database.getAllAsync<any>(`SELECT * FROM ${table}`);
}

export { insertJournal, getJournal, getAllJournals, updateJournal, deleteJournal };
export { insertQuest, getQuest, getAllQuests, updateQuest, deleteQuest, deleteAllQuests };
export { getAllQuestHistory, getQuestHistory, getVirtueTotals };