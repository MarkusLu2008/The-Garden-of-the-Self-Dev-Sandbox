import '@/lib/unistyles';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, TextInput, TouchableOpacity } from 'react-native';
import { StyleSheet, useUnistyles } from '@/lib/unistyles-compat';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { useDateOverride } from '@/contexts/DateOverrideContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import virtues from '@/constants/virtues';
import { questsSeed } from '@/data/quests-seed';
import { gameConfig } from '@/constants/gameConfig';
import { getAllJournals, createJournal, updateJournal } from '@/services/journalManager';
import { clearAllJournalFiles } from '@/services/fileStorage';
import {
  insertQuest,
  deleteAllQuests,
  getAllQuests,
  getAllQuestHistory,
  getQuestVirtueDisplayNames,
  resetDatabase,
  getAllFromTable,
  getVirtueTotalsAndUnlocked,
  addVirtuePoints,
  type QuestHistoryRow,
  type QuestRow,
  type TableName,
} from '@/services/db';
import { getTodayDateString, addDaysToDateString, formatDateForDisplay } from '@/utils/dateUtils';
import {
  getVirtueSeedUnlockDebugRows,
  getSeedShownThresholdFromUnlockedCount,
  type VirtueSeedUnlockDebugRow,
} from '@/utils/virtueGraph';
import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

type JournalItem = {
  id: number;
  file_path: string;
  prompt: string | null;
  virtues: Record<string, number>;
  created_at: string;
  updated_at: string;
};

export function DevtoolsSections() {
  const { theme } = useUnistyles();
  const { overrideDate, setOverrideDate } = useDateOverride();
  const { hasCompletedOnboarding, resetOnboarding } = useOnboarding();
  const [journals, setJournals] = useState<JournalItem[]>([]);
  const [quests, setQuests] = useState<QuestRow[]>([]);
  const [questHistory, setQuestHistory] = useState<QuestHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [customQuery, setCustomQuery] = useState('SELECT * FROM journals LIMIT 10;');
  const [fileSystemInfo, setFileSystemInfo] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<TableName | null>(null);
  const [tableRows, setTableRows] = useState<any[] | null>(null);
  const [virtueTotals, setVirtueTotals] = useState<Record<string, number>>({});
  const [virtueUnlockedAt, setVirtueUnlockedAt] = useState<Record<string, string | null>>({});
  const [seedUnlockDebugRows, setSeedUnlockDebugRows] = useState<VirtueSeedUnlockDebugRow[]>([]);
  const [addVirtueSelected, setAddVirtueSelected] = useState<string>(virtues[0]);
  const [addVirtuePointsInput, setAddVirtuePointsInput] = useState('');

  const loadJournals = async () => {
    try {
      setLoading(true);
      const allJournals = await getAllJournals();
      setJournals(allJournals);
    } catch (error) {
      console.error('Failed to load journals:', error);
      Alert.alert('Error', `Failed to load journals: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const loadDbInfo = async () => {
    try {
      setLoading(true);
      const db = await SQLite.openDatabaseAsync('garden-of-the-self.db');
      const tables = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      const journalCount = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM journals'
      );
      const questCountResult = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM quests'
      );
      const totalSize = await db.getFirstAsync<{ size: number }>(
        "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()"
      );

      setDbInfo({
        tables: tables.map(t => t.name),
        journalCount: journalCount?.count || 0,
        questCount: questCountResult?.count ?? 0,
        totalSize: totalSize?.size || 0,
      });
    } catch (error) {
      console.error('Failed to load DB info:', error);
      Alert.alert('Error', `Failed to load DB info: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const loadQuests = async () => {
    try {
      setLoading(true);
      const allQuests = await getAllQuests();
      setQuests(allQuests);
    } catch (error) {
      console.error('Failed to load quests:', error);
      Alert.alert('Error', `Failed to load quests: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestHistory = async () => {
    try {
      setLoading(true);
      const all = await getAllQuestHistory();
      setQuestHistory(all);
    } catch (error) {
      console.error('Failed to load quest history:', error);
      Alert.alert('Error', `Failed to load quest history: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const loadVirtueTotals = async () => {
    try {
      setLoading(true);
      const { totals, unlockedAt } = await getVirtueTotalsAndUnlocked();
      setVirtueTotals(totals);
      setVirtueUnlockedAt(unlockedAt);
      setSeedUnlockDebugRows(getVirtueSeedUnlockDebugRows(unlockedAt));
    } catch (error) {
      console.error('Failed to load virtue totals:', error);
      Alert.alert('Error', `Failed to load virtue totals: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVirtuePoints = async () => {
    const points = parseInt(addVirtuePointsInput, 10);
    if (Number.isNaN(points) || points <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive number of points.');
      return;
    }
    try {
      setLoading(true);
      await addVirtuePoints({ [addVirtueSelected]: points });
      await loadVirtueTotals();
      setAddVirtuePointsInput('');
      Alert.alert('Done', `Added ${points} point${points !== 1 ? 's' : ''} to ${addVirtueSelected}.`);
    } catch (error) {
      Alert.alert('Error', `Failed to add virtue points: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const loadFileSystemInfo = async () => {
    try {
      setLoading(true);
      const journalDirectory = new Directory(Paths.document, 'journals');
      let fileCount = 0;
      const exists = journalDirectory.exists;

      if (exists) {
        const files = await journalDirectory.list();
        fileCount = files.filter(item => item instanceof File).length;
      }

      setFileSystemInfo({
        exists,
        fileCount,
        path: `${Paths.document}/journals`,
      });
    } catch (error) {
      console.error('Failed to load file system info:', error);
      Alert.alert('Error', `Failed to load file system info: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const executeCustomQuery = async () => {
    try {
      setLoading(true);
      const db = await SQLite.openDatabaseAsync('garden-of-the-self.db');
      const result = await db.getAllAsync(customQuery);
      setQueryResult(result);
    } catch (error) {
      console.error('Query error:', error);
      Alert.alert('Query Error', `${error}`);
      setQueryResult(null);
    } finally {
      setLoading(false);
    }
  };

  const createDummyJournals = async () => {
    Alert.alert(
      'Create Dummy Journals',
      'This will create 5 dummy journal entries with sample content. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              setLoading(true);
              const today = getTodayDateString();
              const dummyPrompts = [
                'What am I grateful for today?',
                'What did I learn today?',
                'How did I grow today?',
                'What challenged me today?',
                'What made me smile today?',
              ];
              const dummyContents = [
                `# Today's Reflection\n\nToday was a wonderful day filled with learning and growth. I'm grateful for the opportunities that came my way.\n\n## Highlights\n- Spent time in nature\n- Had a meaningful conversation\n- Completed an important task`,
                `# Learning Journal\n\nToday I learned something new about myself and the world around me.\n\n## Key Insights\n- Understanding comes with patience\n- Every experience teaches us something\n- Growth happens gradually`,
                `# Personal Growth\n\nReflecting on my journey and the progress I've made.\n\n## Growth Areas\n- Emotional intelligence\n- Communication skills\n- Self-awareness`,
                `# Challenges and Solutions\n\nToday presented some challenges, but I found ways to overcome them.\n\n## What I Learned\n- Challenges are opportunities in disguise\n- Persistence pays off\n- Asking for help is a strength`,
                `# Moments of Joy\n\nToday had many beautiful moments worth remembering.\n\n## Grateful For\n- The people in my life\n- Simple pleasures\n- Opportunities to grow`,
              ];

              let created = 0;
              let skipped = 0;

              for (let i = 0; i < 5; i++) {
                const file_path = addDaysToDateString(today, -i);

                try {
                  const existing = journals.find(j => j.file_path === file_path);
                  if (existing) {
                    skipped++;
                    continue;
                  }

                  await createJournal(file_path, dummyPrompts[i], {});
                  await updateJournal(file_path, dummyContents[i], dummyPrompts[i], {});
                  created++;
                } catch (error) {
                  console.error(`Failed to create journal ${file_path}:`, error);
                }
              }

              await loadDbInfo();
              await loadJournals();
              await loadFileSystemInfo();

              Alert.alert(
                'Success',
                `Created ${created} dummy journal${created !== 1 ? 's' : ''}${skipped > 0 ? `\nSkipped ${skipped} existing journal${skipped !== 1 ? 's' : ''}` : ''}`
              );
            } catch (error) {
              Alert.alert('Error', `Failed to create dummy journals: ${error}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const createDummyQuests = async () => {
    Alert.alert(
      'Create Dummy Quests',
      'This will create 6 dummy quests with sample prompts and virtues. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              setLoading(true);
              const dummyPrompts = [
                'Reflect on one act of courage today',
                'Practice patience in a difficult moment',
                'Show kindness to someone you meet',
                'Spend 10 minutes in curious learning',
                'Collaborate on something with another person',
                'Notice three surprising things with curiosity',
              ];
              const virtuePairs: Record<string, number>[] = [
                { Courage: 3, Resilience: 2, Empathy: 1 },
                { Patience: 3, Temperance: 2 },
                { Kindness: 3, Empathy: 2, Respectfulness: 1 },
                { Curiosity: 3, 'Proper Ambition': 2 },
                { Collaboration: 3, Tolerance: 2, Respectfulness: 1 },
                { Curiosity: 5 },
              ];

              for (let i = 0; i < dummyPrompts.length; i++) {
                await insertQuest(dummyPrompts[i], virtuePairs[i]);
              }

              await loadDbInfo();
              await loadQuests();

              Alert.alert('Success', `Created ${dummyPrompts.length} dummy quests.`);
            } catch (error) {
              Alert.alert('Error', `Failed to create dummy quests: ${error}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const seedPlannedQuests = () => {
    Alert.alert(
      'Seed Planned Quests',
      `Insert all ${questsSeed.length} planned quests from planning/quest-virtue-combinations.md into the database?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Seed',
          onPress: async () => {
            try {
              setLoading(true);
              for (const q of questsSeed) {
                await insertQuest(q.prompt, q.virtues, q.duration);
              }
              await loadDbInfo();
              await loadQuests();
              Alert.alert('Success', `Inserted ${questsSeed.length} planned quests.`);
            } catch (error) {
              Alert.alert('Error', `Failed to seed quests: ${error}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const clearAllQuests = () => {
    Alert.alert(
      'Clear All Quests',
      'Delete all quests from the database? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteAllQuests();
              await loadDbInfo();
              await loadQuests();
              Alert.alert('Success', 'All quests cleared.');
            } catch (error) {
              Alert.alert('Error', `Failed to clear quests: ${error}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const hardReset = () => {
    Alert.alert(
      'Hard reset',
      'Wipe database and delete all journal files? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await resetDatabase();
              await clearAllJournalFiles();
              await loadDbInfo();
              await loadJournals();
              await loadQuests();
              await loadQuestHistory();
              await loadFileSystemInfo();
              await loadVirtueTotals();
              Alert.alert('Done', 'Hard reset complete');
            } catch (error) {
              Alert.alert('Error', `Reset failed: ${error}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadJournals();
    loadQuests();
    loadQuestHistory();
    loadDbInfo();
    loadFileSystemInfo();
    loadVirtueTotals();
  }, []);

  function stepDate(days: number) {
    const base = overrideDate ? new Date(`${overrideDate}T12:00:00`) : new Date();
    base.setDate(base.getDate() + days);
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, '0');
    const d = String(base.getDate()).padStart(2, '0');
    setOverrideDate(`${y}-${m}-${d}`);
  }

  async function handleLoadTableRows(table: TableName) {
    try {
      setLoading(true);
      const rows = await getAllFromTable(table);
      setSelectedTable(table);
      setTableRows(rows);
    } catch (error) {
      console.error('Failed to load table rows:', error);
      Alert.alert('Error', `Failed to load table rows: ${error}`);
    } finally {
      setLoading(false);
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      {loading && (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
        </ThemedView>
      )}

      <Collapsible title="Date Override">
        <ThemedView style={styles.section}>
          <ThemedText style={styles.infoRow}>
            <ThemedText type="defaultSemiBold">Current date: </ThemedText>
            {overrideDate
              ? `${formatDateForDisplay(overrideDate)} (${overrideDate})`
              : `${getTodayDateString()} (Real date)`}
          </ThemedText>
          <ThemedView style={styles.dateStepRow}>
            <TouchableOpacity style={styles.dateStepButton} onPress={() => stepDate(-1)}>
              <ThemedText style={styles.dateStepText}>-1 Day</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateStepButton} onPress={() => stepDate(1)}>
              <ThemedText style={styles.dateStepText}>+1 Day</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateStepButton} onPress={() => stepDate(7)}>
              <ThemedText style={styles.dateStepText}>+1 Week</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          {overrideDate && (
            <TouchableOpacity style={styles.dangerButton} onPress={() => setOverrideDate(null)}>
              <ThemedText style={styles.dangerButtonText}>Reset to Real Date</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      </Collapsible>

      <Collapsible title="Onboarding">
        <ThemedView style={styles.section}>
          <ThemedText style={styles.infoRow}>
            <ThemedText type="defaultSemiBold">Status: </ThemedText>
            {hasCompletedOnboarding ? 'Completed' : 'Not completed'}
          </ThemedText>
          <TouchableOpacity style={styles.button} onPress={resetOnboarding}>
            <ThemedText style={styles.buttonText}>Reset Onboarding</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </Collapsible>

      <Collapsible title="Database Information">
        <ThemedView style={styles.section}>
          {dbInfo ? (
            <>
              <ThemedText style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Tables: </ThemedText>
                {dbInfo.tables.join(', ')}
              </ThemedText>
              <ThemedText style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Journal Count: </ThemedText>
                {dbInfo.journalCount}
              </ThemedText>
              <ThemedText style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Quest Count: </ThemedText>
                {dbInfo.questCount}
              </ThemedText>
              <ThemedText style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Database Size: </ThemedText>
                {formatBytes(dbInfo.totalSize)}
              </ThemedText>
              <ThemedText style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Inspect Table: </ThemedText>
              </ThemedText>
              <ThemedView style={styles.queryPresetRow}>
                {(
                  [
                    'journals',
                    'journal_virtues',
                    'quests',
                    'quest_virtues',
                    'quest_history',
                    'quest_history_virtues',
                    'virtues',
                  ] as TableName[]
                ).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={styles.queryPresetButton}
                    onPress={() => handleLoadTableRows(t)}
                  >
                    <ThemedText style={styles.queryPresetText}>{t}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
              {selectedTable && tableRows && (
                <ThemedView style={styles.queryResult}>
                  <ThemedText type="defaultSemiBold" style={styles.resultTitle}>
                    {selectedTable} ({tableRows.length} rows)
                  </ThemedText>
                  <ThemedText style={styles.resultText}>{JSON.stringify(tableRows, null, 2)}</ThemedText>
                </ThemedView>
              )}
              <TouchableOpacity style={styles.button} onPress={loadDbInfo}>
                <ThemedText style={styles.buttonText}>Refresh</ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.button} onPress={loadDbInfo}>
              <ThemedText style={styles.buttonText}>Load DB Info</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      </Collapsible>

      <Collapsible title="File System Information">
        <ThemedView style={styles.section}>
          {fileSystemInfo ? (
            <>
              <ThemedText style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Directory Exists: </ThemedText>
                {fileSystemInfo.exists ? 'Yes' : 'No'}
              </ThemedText>
              <ThemedText style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">File Count: </ThemedText>
                {fileSystemInfo.fileCount}
              </ThemedText>
              <ThemedText style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Path: </ThemedText>
                <ThemedText style={styles.pathText}>{fileSystemInfo.path}</ThemedText>
              </ThemedText>
              <TouchableOpacity style={styles.button} onPress={loadFileSystemInfo}>
                <ThemedText style={styles.buttonText}>Refresh</ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.button} onPress={loadFileSystemInfo}>
              <ThemedText style={styles.buttonText}>Load File System Info</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      </Collapsible>

      <Collapsible title="Journals List">
        <ThemedView style={styles.section}>
          <ThemedText style={styles.infoRow}>
            <ThemedText type="defaultSemiBold">Total Journals: </ThemedText>
            {journals.length}
          </ThemedText>
          <TouchableOpacity style={styles.button} onPress={loadJournals}>
            <ThemedText style={styles.buttonText}>Refresh</ThemedText>
          </TouchableOpacity>
          {journals.length > 0 && (
            <ThemedView style={styles.list}>
              {journals.slice(0, 5).map((journal) => (
                <ThemedView key={journal.id} style={styles.listItem}>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">ID: </ThemedText>
                    {journal.id}
                  </ThemedText>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Path: </ThemedText>
                    {journal.file_path}
                  </ThemedText>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Created: </ThemedText>
                    {journal.created_at}
                  </ThemedText>
                </ThemedView>
              ))}
              {journals.length > 5 && (
                <ThemedText style={styles.moreText}>... and {journals.length - 5} more</ThemedText>
              )}
            </ThemedView>
          )}
        </ThemedView>
      </Collapsible>

      <Collapsible title="Quests List">
        <ThemedView style={styles.section}>
          <ThemedText style={styles.infoRow}>
            <ThemedText type="defaultSemiBold">Total Quests: </ThemedText>
            {quests.length}
          </ThemedText>
          <TouchableOpacity style={styles.button} onPress={loadQuests}>
            <ThemedText style={styles.buttonText}>Refresh</ThemedText>
          </TouchableOpacity>
          {quests.length > 0 && (
            <ThemedView style={styles.list}>
              {quests.slice(0, 5).map((quest) => (
                <ThemedView key={quest.id} style={styles.listItem}>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">ID: </ThemedText>
                    {quest.id}
                  </ThemedText>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Prompt: </ThemedText>
                    {quest.prompt.slice(0, 40)}
                    {quest.prompt.length > 40 ? '…' : ''}
                  </ThemedText>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Completed: </ThemedText>
                    {quest.completed ? 'Yes' : 'No'}
                  </ThemedText>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Duration: </ThemedText>
                    {quest.duration}
                  </ThemedText>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Virtues: </ThemedText>
                    {getQuestVirtueDisplayNames(quest).join(', ') || '—'}
                  </ThemedText>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Created: </ThemedText>
                    {quest.created_at}
                  </ThemedText>
                </ThemedView>
              ))}
              {quests.length > 5 && (
                <ThemedText style={styles.moreText}>... and {quests.length - 5} more</ThemedText>
              )}
            </ThemedView>
          )}
        </ThemedView>
      </Collapsible>

      <Collapsible title="Quest History">
        <ThemedView style={styles.section}>
          <ThemedText style={styles.infoRow}>
            <ThemedText type="defaultSemiBold">Total History Entries: </ThemedText>
            {questHistory.length}
          </ThemedText>
          <TouchableOpacity style={styles.button} onPress={loadQuestHistory}>
            <ThemedText style={styles.buttonText}>Refresh</ThemedText>
          </TouchableOpacity>
          {questHistory.length > 0 && (
            <ThemedView style={styles.list}>
              {questHistory.slice(0, 10).map((entry) => (
                <ThemedView key={entry.id} style={styles.listItem}>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">ID: </ThemedText>
                    {entry.id}
                    <ThemedText type="defaultSemiBold"> · Quest ID: </ThemedText>
                    {entry.quest_id}
                  </ThemedText>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Virtues: </ThemedText>
                    {getQuestVirtueDisplayNames(entry as unknown as QuestRow).join(', ') || '—'}
                  </ThemedText>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Assigned: </ThemedText>
                    {entry.assigned_at}
                  </ThemedText>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Completed: </ThemedText>
                    {entry.completed_at ?? '—'}
                  </ThemedText>
                </ThemedView>
              ))}
              {questHistory.length > 10 && (
                <ThemedText style={styles.moreText}>... and {questHistory.length - 10} more</ThemedText>
              )}
            </ThemedView>
          )}
        </ThemedView>
      </Collapsible>

      <Collapsible title="Add Virtue Points">
        <ThemedView style={styles.section}>
          <ThemedText style={styles.infoRow}>
            <ThemedText type="defaultSemiBold">Current totals: </ThemedText>
          </ThemedText>
          {Object.keys(virtueTotals).length > 0 ? (
            <ThemedView style={styles.virtueTotalsRow}>
              {virtues.map((name) => (
                <ThemedText key={name} style={styles.virtueTotalItem}>
                  {name}: {virtueTotals[name] ?? 0}
                </ThemedText>
              ))}
            </ThemedView>
          ) : null}
          <TouchableOpacity style={styles.button} onPress={loadVirtueTotals}>
            <ThemedText style={styles.buttonText}>Refresh totals</ThemedText>
          </TouchableOpacity>
          <ThemedText style={[styles.infoRow, styles.infoRowTop]}>
            <ThemedText type="defaultSemiBold">Virtue: </ThemedText>
          </ThemedText>
          <ThemedView style={styles.virtueChipsRow}>
            {virtues.map((name) => (
              <TouchableOpacity
                key={name}
                style={[styles.queryPresetButton, addVirtueSelected === name && styles.virtueSelected]}
                onPress={() => setAddVirtueSelected(name)}
              >
                <ThemedText
                  style={[styles.queryPresetText, addVirtueSelected === name && styles.virtueSelectedText]}
                  numberOfLines={1}
                >
                  {name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
          <ThemedText style={[styles.infoRow, styles.infoRowTop]}>
            <ThemedText type="defaultSemiBold">Points to add: </ThemedText>
          </ThemedText>
          <TextInput
            style={styles.pointsInput}
            value={addVirtuePointsInput}
            onChangeText={setAddVirtuePointsInput}
            placeholder="e.g. 5"
            placeholderTextColor={theme.colors.icon}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleAddVirtuePoints}
            disabled={!addVirtuePointsInput.trim()}
          >
            <ThemedText style={styles.buttonText}>Add points to {addVirtueSelected}</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </Collapsible>

      <Collapsible title="Virtue Seed Unlock Pricing">
        <ThemedView style={styles.section}>
          <ThemedText style={styles.infoRow}>
            Distance-based exponential unlock prices for stage-1 virtue seeds.
          </ThemedText>
          <ThemedText style={styles.infoRow}>
            <ThemedText type="defaultSemiBold">Formula: </ThemedText>
            round(basePriceDistance1 * multiplier^(distance - 1))
          </ThemedText>
          <ThemedText style={styles.infoRow}>
            <ThemedText type="defaultSemiBold">Config: </ThemedText>
            basePriceDistance1={gameConfig.pricing.basePriceDistance1}, multiplier=
            {gameConfig.pricing.multiplier}
          </ThemedText>
          <TouchableOpacity style={styles.button} onPress={loadVirtueTotals}>
            <ThemedText style={styles.buttonText}>Recompute seed unlock prices</ThemedText>
          </TouchableOpacity>
          <ThemedView style={styles.list}>
            {seedUnlockDebugRows.map((row) => {
              const currentPoints = virtueTotals[row.virtueName] ?? 0;
              const pointsNeeded = Math.max(0, row.unlockPrice - currentPoints);
              const canAfford = currentPoints >= row.unlockPrice;
              return (
                <ThemedView key={row.virtueName} style={styles.listItem}>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Virtue: </ThemedText>
                    {row.virtueName}
                  </ThemedText>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Unlocked: </ThemedText>
                    {row.isUnlocked ? 'Yes' : 'No'}
                    {row.isUnlocked && virtueUnlockedAt[row.virtueName]
                      ? ` (${virtueUnlockedAt[row.virtueName]})`
                      : ''}
                  </ThemedText>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Closest unlocked virtue: </ThemedText>
                    {row.closestUnlockedVirtue ?? '—'}
                  </ThemedText>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Distance: </ThemedText>
                    {row.distance ?? '—'}
                  </ThemedText>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Unlock price: </ThemedText>
                    {row.unlockPrice} {row.virtueName} points
                  </ThemedText>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Current points: </ThemedText>
                    {currentPoints}
                  </ThemedText>
                  <ThemedText style={styles.listItemText}>
                    <ThemedText type="defaultSemiBold">Status: </ThemedText>
                    {row.isUnlocked
                      ? 'Already unlocked'
                      : canAfford
                        ? 'Can unlock now'
                        : `${pointsNeeded} more point${pointsNeeded === 1 ? '' : 's'} needed`}
                  </ThemedText>
                </ThemedView>
              );
            })}
          </ThemedView>
        </ThemedView>
      </Collapsible>

      <Collapsible title="Seed Shown Threshold">
        <ThemedView style={styles.section}>
          <ThemedText style={styles.infoRow}>
            Minimum points a locked virtue needs before its seed appears in the garden. Scales with total
            unlocked virtue count.
          </ThemedText>
          <ThemedText style={styles.infoRow}>
            <ThemedText type="defaultSemiBold">Formula: </ThemedText>
            {gameConfig.seedShown.rounding}(baseThreshold * unlockedCount^unlockedCountExponent)
          </ThemedText>
          <ThemedText style={styles.infoRow}>
            <ThemedText type="defaultSemiBold">Config: </ThemedText>
            baseThreshold={gameConfig.seedShown.baseThreshold}, exponent=
            {gameConfig.seedShown.unlockedCountExponent}, minUnlockedCount=
            {gameConfig.seedShown.minUnlockedCount}, minThreshold={gameConfig.seedShown.minThreshold},
            rounding={gameConfig.seedShown.rounding}
          </ThemedText>
          {(() => {
            const unlockedCount = virtues.filter((name) => virtueUnlockedAt[name] != null).length;
            const threshold = getSeedShownThresholdFromUnlockedCount(unlockedCount);
            return (
              <>
                <ThemedText style={[styles.infoRow, styles.infoRowTop]}>
                  <ThemedText type="defaultSemiBold">Unlocked virtues: </ThemedText>
                  {unlockedCount}
                </ThemedText>
                <ThemedText style={styles.infoRow}>
                  <ThemedText type="defaultSemiBold">Current threshold: </ThemedText>
                  {threshold} points
                </ThemedText>
                <TouchableOpacity style={styles.button} onPress={loadVirtueTotals}>
                  <ThemedText style={styles.buttonText}>Refresh</ThemedText>
                </TouchableOpacity>
                <ThemedView style={styles.list}>
                  {virtues.map((name) => {
                    const isUnlocked = virtueUnlockedAt[name] != null;
                    const pts = virtueTotals[name] ?? 0;
                    const seedVisible = isUnlocked || pts >= threshold;
                    return (
                      <ThemedView key={name} style={styles.listItem}>
                        <ThemedText style={styles.listItemText}>
                          <ThemedText type="defaultSemiBold">Virtue: </ThemedText>
                          {name}
                        </ThemedText>
                        <ThemedText style={styles.listItemText}>
                          <ThemedText type="defaultSemiBold">Unlocked: </ThemedText>
                          {isUnlocked ? 'Yes' : 'No'}
                        </ThemedText>
                        <ThemedText style={styles.listItemText}>
                          <ThemedText type="defaultSemiBold">Points: </ThemedText>
                          {pts}
                        </ThemedText>
                        <ThemedText style={styles.listItemText}>
                          <ThemedText type="defaultSemiBold">Seed visible: </ThemedText>
                          {seedVisible
                            ? 'Yes'
                            : `No (needs ${threshold - pts} more point${threshold - pts === 1 ? '' : 's'})`}
                        </ThemedText>
                      </ThemedView>
                    );
                  })}
                </ThemedView>
              </>
            );
          })()}
        </ThemedView>
      </Collapsible>

      <Collapsible title="Custom SQL Query">
        <ThemedView style={styles.section}>
          <TextInput
            style={styles.queryInput}
            value={customQuery}
            onChangeText={setCustomQuery}
            placeholder="Enter SQL query"
            placeholderTextColor={theme.colors.icon}
            multiline
          />
          <ThemedView style={styles.queryPresetRow}>
            <TouchableOpacity
              style={styles.queryPresetButton}
              onPress={() => setCustomQuery('SELECT * FROM journals LIMIT 10;')}
            >
              <ThemedText style={styles.queryPresetText}>Journals</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.queryPresetButton}
              onPress={() => setCustomQuery('SELECT * FROM quests LIMIT 10;')}
            >
              <ThemedText style={styles.queryPresetText}>Quests</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.queryPresetButton}
              onPress={() =>
                setCustomQuery('SELECT * FROM quest_history ORDER BY assigned_at DESC LIMIT 10;')
              }
            >
              <ThemedText style={styles.queryPresetText}>Quest History</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          <TouchableOpacity style={styles.button} onPress={executeCustomQuery}>
            <ThemedText style={styles.buttonText}>Execute Query</ThemedText>
          </TouchableOpacity>
          {queryResult && (
            <ThemedView style={styles.queryResult}>
              <ThemedText type="defaultSemiBold" style={styles.resultTitle}>
                Results ({queryResult.length} rows):
              </ThemedText>
              <ThemedText style={styles.resultText}>{JSON.stringify(queryResult, null, 2)}</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </Collapsible>

      <Collapsible title="Test Data">
        <ThemedView style={styles.section}>
          <ThemedText style={styles.infoRow}>
            Create dummy journal entries for testing purposes. This will create 5 journals with sample
            prompts, virtues, and content.
          </ThemedText>
          <TouchableOpacity style={styles.button} onPress={createDummyJournals}>
            <ThemedText style={styles.buttonText}>Create Dummy Journals</ThemedText>
          </TouchableOpacity>
          <ThemedText style={[styles.infoRow, styles.infoRowTop]}>
            Create dummy quests for testing. This will create 5 quests with sample prompts and virtue values.
          </ThemedText>
          <TouchableOpacity style={styles.button} onPress={createDummyQuests}>
            <ThemedText style={styles.buttonText}>Create Dummy Quests</ThemedText>
          </TouchableOpacity>
          <ThemedText style={[styles.infoRow, styles.infoRowTop]}>
            Insert all 36 planned quests (from planning/quest-virtue-combinations.md) with their virtue point
            values.
          </ThemedText>
          <TouchableOpacity style={styles.button} onPress={seedPlannedQuests}>
            <ThemedText style={styles.buttonText}>Seed Planned Quests</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </Collapsible>

      <Collapsible title="Danger Zone">
        <ThemedView style={styles.section}>
          <TouchableOpacity style={styles.dangerButton} onPress={clearAllQuests}>
            <ThemedText style={styles.dangerButtonText}>Clear All Quests</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dangerButton, styles.dangerButtonSpaced]} onPress={hardReset}>
            <ThemedText style={styles.dangerButtonText}>Hard reset</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </Collapsible>
    </>
  );
}

const styles = (StyleSheet as any).create((theme: any) => ({
  loadingContainer: {
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  section: {
    padding: theme.spacing.md,
  },
  infoRow: {
    marginBottom: theme.spacing.sm,
    fontSize: 14,
  },
  infoRowTop: {
    marginTop: theme.spacing.lg,
  },
  pathText: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.7,
  },
  button: {
    backgroundColor: theme.colors.tint,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.background,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  dangerButtonSpaced: {
    marginTop: theme.spacing.sm,
  },
  dangerButtonText: {
    color: theme.colors.background,
    fontWeight: '600',
  },
  list: {
    marginTop: theme.spacing.md,
  },
  listItem: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.selection,
  },
  listItemText: {
    fontSize: 12,
    marginBottom: 4,
  },
  dateStepRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  dateStepButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.tint,
    alignItems: 'center',
  },
  dateStepText: {
    color: theme.colors.background,
    fontWeight: '600',
    fontSize: 13,
  },
  queryPresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  queryPresetButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.selection,
  },
  queryPresetText: {
    fontSize: 13,
    color: theme.colors.text,
  },
  moreText: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
  },
  queryInput: {
    backgroundColor: theme.colors.selection,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 80,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  virtueTotalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  virtueTotalItem: {
    fontSize: 12,
  },
  virtueSelected: {
    backgroundColor: theme.colors.tint,
  },
  virtueSelectedText: {
    color: theme.colors.background,
  },
  virtueChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  pointsInput: {
    backgroundColor: theme.colors.selection,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 44,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  queryResult: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.selection,
    borderRadius: theme.borderRadius.sm,
  },
  resultTitle: {
    marginBottom: theme.spacing.sm,
  },
  resultText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: theme.colors.text,
  },
}));
