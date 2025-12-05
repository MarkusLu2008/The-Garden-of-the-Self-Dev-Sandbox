import { insertJournal, getJournal as getJournalFromDb, updateJournal as updateJournalInDb, deleteJournal as deleteJournalFromDb, getAllJournals as getAllJournalsFromDb } from './db';
import { createJournalFile, readJournalFile, updateJournalFile, deleteJournalFile } from './fileStorage';

async function createJournal(file_path: string, prompt: string, virtues: string) {
  await createJournalFile(file_path);
  await insertJournal(file_path, prompt, virtues);
}

async function getJournalInfo(file_path: string) {
  const journal = await getJournalFromDb(file_path);
  return {
    prompt: journal?.prompt,
    virtues: journal?.virtues,
    created_at: journal?.created_at,
    updated_at: journal?.updated_at,
  };
}

async function getJournalContent(file_path: string) {
  return await readJournalFile(file_path);
}
async function updateJournal(file_path: string, content: string, prompt: string, virtues: string) {
  await updateJournalFile(file_path, content);
  await updateJournalInDb(file_path, prompt, virtues);
}

async function deleteJournal(file_path: string) {
  await deleteJournalFile(file_path);
  await deleteJournalFromDb(file_path);
}

async function getAllJournals() {
  return await getAllJournalsFromDb();
}

export { createJournal, getJournalInfo, getJournalContent, updateJournal, deleteJournal, getAllJournals };
