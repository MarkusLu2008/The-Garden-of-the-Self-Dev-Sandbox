import * as SQLite from 'expo-sqlite';

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

    if (!questsResult) {
      await db.execAsync(`
        CREATE TABLE quests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          completed INTEGER NOT NULL DEFAULT 0,
          prompt TEXT NOT NULL,
          primary_virtue TEXT NOT NULL,
          secondary_virtue TEXT,
          tertiary_virtue TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
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

export type QuestRow = {
  id: number;
  completed: number;
  prompt: string;
  primary_virtue: string;
  secondary_virtue: string | null;
  tertiary_virtue: string | null;
  created_at: string;
  updated_at: string;
};

async function insertQuest(
  prompt: string,
  primary_virtue: string,
  secondary_virtue: string | null,
  tertiary_virtue: string | null
) {
  const database = await getDatabase();
  return database.runAsync(
    `INSERT INTO quests (completed, prompt, primary_virtue, secondary_virtue, tertiary_virtue, created_at, updated_at)
     VALUES (0, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [prompt, primary_virtue, secondary_virtue ?? null, tertiary_virtue ?? null]
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
    primary_virtue?: string;
    secondary_virtue?: string | null;
    tertiary_virtue?: string | null;
  }
) {
  const database = await getDatabase();
  const quest = await getQuest(id);
  if (!quest) return;

  const completed = updates.completed ?? quest.completed;
  const prompt = updates.prompt ?? quest.prompt;
  const primary_virtue = updates.primary_virtue ?? quest.primary_virtue;
  const secondary_virtue = updates.secondary_virtue !== undefined ? updates.secondary_virtue : quest.secondary_virtue;
  const tertiary_virtue = updates.tertiary_virtue !== undefined ? updates.tertiary_virtue : quest.tertiary_virtue;

  await database.runAsync(
    `UPDATE quests SET completed = ?, prompt = ?, primary_virtue = ?, secondary_virtue = ?, tertiary_virtue = ?, updated_at = datetime('now') WHERE id = ?`,
    [completed, prompt, primary_virtue, secondary_virtue, tertiary_virtue, id]
  );
}

async function deleteQuest(id: number) {
  const database = await getDatabase();
  return database.runAsync(`DELETE FROM quests WHERE id = ?`, [id]);
}

export { insertJournal, getJournal, getAllJournals, updateJournal, deleteJournal };
export { insertQuest, getQuest, getAllQuests, updateQuest, deleteQuest };