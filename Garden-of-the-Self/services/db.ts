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

export { insertJournal, getJournal, getAllJournals, updateJournal, deleteJournal };