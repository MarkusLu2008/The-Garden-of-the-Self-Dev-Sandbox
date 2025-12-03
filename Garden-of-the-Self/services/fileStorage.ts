import { Paths, File, Directory } from 'expo-file-system';

const journalDirectory = new Directory(Paths.document, 'journals');
let directoryInitPromise: Promise<void> | null = null;

async function ensureJournalDirectory(): Promise<void> {
  if (directoryInitPromise) {
    return directoryInitPromise;
  }

  directoryInitPromise = (async () => {
    try {
      await journalDirectory.create();
    } catch {
      // Directory already exists, ignore
    }
  })();

  return directoryInitPromise;
}

async function createJournalFile(file_path: string): Promise<void> {
  await ensureJournalDirectory();
  const file = new File(journalDirectory, `${file_path}.md`);
  try {
    await file.write('');
  } catch {
    // File might already exist, ignore
  }
}

async function readJournalFile(file_path: string): Promise<string> {
  await ensureJournalDirectory();
  const file = new File(journalDirectory, `${file_path}.md`);
  return await file.text();
}

async function updateJournalFile(file_path: string, content: string): Promise<void> {
  await ensureJournalDirectory();
  const file = new File(journalDirectory, `${file_path}.md`);
  await file.write(content);
}

async function deleteJournalFile(file_path: string): Promise<void> {
  await ensureJournalDirectory();
  const file = new File(journalDirectory, `${file_path}.md`);
  try {
    await file.delete();
  } catch {
    // File doesn't exist, ignore
  }
}

export { ensureJournalDirectory, createJournalFile, readJournalFile, updateJournalFile, deleteJournalFile };