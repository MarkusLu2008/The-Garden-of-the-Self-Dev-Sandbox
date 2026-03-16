import * as SQLite from 'expo-sqlite';
import virtues from '@/constants/virtues';

/** Virtue display name -> DB column name (snake_case) */
function virtueToColumn(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_');
}

const VIRTUE_COLUMNS = virtues.map(virtueToColumn);

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    db = await SQLite.openDatabaseAsync('garden-of-the-self.db');
    
    const result = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='journals'"
    );

    if (!result) {
      await db.execAsync(`
        CREATE TABLE journals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          file_path TEXT NOT NULL UNIQUE,
          prompt TEXT,
          virtues TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
    }

    const questsResult = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='quests'"
    );

    if (questsResult) {
      // Migration: detect old schema (primary_virtue column) and recreate quests table
      const tableInfo = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM pragma_table_info('quests')"
      );
      const columnNames = tableInfo.map((r) => r.name);
      const hasOldSchema = columnNames.includes('primary_virtue');
      if (hasOldSchema) {
        await db.execAsync('DROP TABLE quests');
      }
    }

    const questsExistsAfterMigration = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='quests'"
    );

    if (!questsExistsAfterMigration) {
      const virtueCols = VIRTUE_COLUMNS.map((c) => `${c} INTEGER NOT NULL DEFAULT 0`).join(',\n          ');
      await db.execAsync(`
        CREATE TABLE quests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          completed INTEGER NOT NULL DEFAULT 0,
          prompt TEXT NOT NULL,
          ${virtueCols},
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
    }

    const questHistoryResult = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='quest_history'"
    );
    if (questHistoryResult) {
      const tableInfo = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM pragma_table_info('quest_history')"
      );
      const hasPrompt = tableInfo.some((r) => r.name === 'prompt');
      if (hasPrompt) {
        await db.execAsync('DROP TABLE quest_history');
      }
    }
    const questHistoryExistsAfterMigration = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='quest_history'"
    );
    if (!questHistoryExistsAfterMigration) {
      const virtueColsHistory = VIRTUE_COLUMNS.map((c) => `${c} INTEGER NOT NULL DEFAULT 0`).join(',\n          ');
      await db.execAsync(`
        CREATE TABLE quest_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quest_id INTEGER NOT NULL,
          ${virtueColsHistory},
          completed_at TEXT NOT NULL,
          event TEXT NOT NULL DEFAULT 'completed'
        );
      `);
    }

    return db;
  })();

  return initPromise;
}

async function insertJournal(file_path: string, prompt: string, virtues: string) {
  const database = await getDatabase();
  return database.runAsync(
    `INSERT INTO journals (file_path, prompt, virtues, created_at, updated_at) 
     VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
    [file_path, prompt, virtues]
  );
}

async function getJournal(file_path: string) {
  const database = await getDatabase();
  return database.getFirstAsync<{
    id: number;
    file_path: string;
    prompt: string | null;
    virtues: string | null;
    created_at: string;
    updated_at: string;
  }>(`
    SELECT * FROM journals WHERE file_path = ?;
  `, [file_path]);
}

async function getAllJournals() {
  const database = await getDatabase();
  return database.getAllAsync<{
    id: number;
    file_path: string;
    prompt: string | null;
    virtues: string | null;
    created_at: string;
    updated_at: string;
  }>(`
    SELECT * FROM journals ORDER BY created_at DESC;
  `);
}

async function updateJournal(file_path: string, prompt: string, virtues: string) {
  const database = await getDatabase();
  return database.runAsync(
    `UPDATE journals SET prompt = ?, virtues = ?, updated_at = datetime('now') WHERE file_path = ?`,
    [prompt, virtues, file_path]
  );
}

async function deleteJournal(file_path: string) {
  const database = await getDatabase();
  return database.runAsync(
    `DELETE FROM journals WHERE file_path = ?`,
    [file_path]
  );
}

/** Integer value per virtue (column names are snake_case from virtue names) */
export type QuestVirtueValues = Record<string, number>;

export type QuestRow = {
  id: number;
  completed: number;
  prompt: string;
  created_at: string;
  updated_at: string;
} & Record<string, number>;

export type QuestHistoryRow = {
  id: number;
  quest_id: number;
  completed_at: string;
  event: string;
} & Record<string, number>;

/** Virtue values keyed by display name (e.g. "Courage", "Proper Ambition"). Missing virtues default to 0. */
async function insertQuest(prompt: string, virtueValues: QuestVirtueValues = {}) {
  const database = await getDatabase();
  const cols = ['completed', 'prompt', ...VIRTUE_COLUMNS, 'created_at', 'updated_at'].join(', ');
  const placeholders = ['0', '?', ...VIRTUE_COLUMNS.map(() => '?'), "datetime('now')", "datetime('now')"].join(', ');
  const values = VIRTUE_COLUMNS.map((col) => {
    const displayName = virtues.find((v) => virtueToColumn(v) === col);
    return displayName != null && virtueValues[displayName] != null ? virtueValues[displayName] : 0;
  });
  return database.runAsync(
    `INSERT INTO quests (${cols}) VALUES (${placeholders})`,
    [prompt, ...values]
  );
}

async function getQuest(id: number) {
  const database = await getDatabase();
  return database.getFirstAsync<QuestRow>(
    `SELECT * FROM quests WHERE id = ?`,
    [id]
  );
}

async function getAllQuests() {
  const database = await getDatabase();
  return database.getAllAsync<QuestRow>(
    `SELECT * FROM quests ORDER BY completed ASC, created_at DESC`
  );
}

async function updateQuest(
  id: number,
  updates: {
    completed?: number;
    prompt?: string;
  } & Partial<QuestVirtueValues>
) {
  const database = await getDatabase();
  const quest = await getQuest(id);
  if (!quest) return;

  const completed = updates.completed ?? quest.completed;
  const prompt = updates.prompt ?? quest.prompt;
  const setVirtues = VIRTUE_COLUMNS.map((col) => `${col} = ?`);
  const virtueValues = VIRTUE_COLUMNS.map((col) => {
    const displayName = virtues.find((v) => virtueToColumn(v) === col);
    const fromUpdates = displayName != null && updates[displayName] != null ? updates[displayName] : undefined;
    return fromUpdates !== undefined ? fromUpdates : (quest[col] as number);
  });

  if (quest.completed === 0 && completed === 1) {
    await recordQuestCompleted(quest);
  }

  await database.runAsync(
    `UPDATE quests SET completed = ?, prompt = ?, ${setVirtues.join(', ')}, updated_at = datetime('now') WHERE id = ?`,
    [completed, prompt, ...virtueValues, id]
  );
}

async function deleteQuest(id: number) {
  const database = await getDatabase();
  return database.runAsync(`DELETE FROM quests WHERE id = ?`, [id]);
}

async function deleteAllQuests() {
  const database = await getDatabase();
  return database.runAsync(`DELETE FROM quests`);
}

async function recordQuestCompleted(quest: QuestRow) {
  const database = await getDatabase();
  const cols = ['quest_id', ...VIRTUE_COLUMNS, 'completed_at', 'event'].join(', ');
  const placeholders = ['?', ...VIRTUE_COLUMNS.map(() => '?'), "datetime('now')", '?'].join(', ');
  const virtueValues = VIRTUE_COLUMNS.map((col) => (quest[col] as number) ?? 0);
  return database.runAsync(
    `INSERT INTO quest_history (${cols}) VALUES (${placeholders})`,
    [quest.id, ...virtueValues, 'completed']
  );
}

async function getAllQuestHistory() {
  const database = await getDatabase();
  return database.getAllAsync<QuestHistoryRow>(
    `SELECT * FROM quest_history ORDER BY completed_at DESC`
  );
}

async function getQuestHistory(limit: number) {
  const database = await getDatabase();
  return database.getAllAsync<QuestHistoryRow>(
    `SELECT * FROM quest_history ORDER BY completed_at DESC LIMIT ?`,
    [limit]
  );
}

/** Returns virtue display names that have a value > 0 on the quest, sorted by value descending (primary first) */
export function getQuestVirtueDisplayNames(quest: QuestRow): string[] {
  return virtues
    .filter((v) => (quest[virtueToColumn(v)] as number) > 0)
    .sort((a, b) => (quest[virtueToColumn(b)] as number) - (quest[virtueToColumn(a)] as number));
}

export { insertJournal, getJournal, getAllJournals, updateJournal, deleteJournal };
export { insertQuest, getQuest, getAllQuests, updateQuest, deleteQuest, deleteAllQuests };
export { getAllQuestHistory, getQuestHistory };