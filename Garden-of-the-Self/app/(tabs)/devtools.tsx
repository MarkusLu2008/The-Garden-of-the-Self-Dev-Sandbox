import '@/lib/unistyles';
import { useState, useEffect } from 'react';
import { ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { StyleSheet, useUnistyles } from '@/lib/unistyles-compat';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { getAllJournals, createJournal, updateJournal } from '@/services/journalManager';
import {
  insertQuest,
  deleteAllQuests,
  getAllQuests,
  getAllQuestHistory,
  getQuestVirtueDisplayNames,
  resetDatabase,
  getAllFromTable,
  getVirtueTotals,
  addVirtuePoints,
  type QuestRow,
  type QuestHistoryRow,
  type TableName,
} from '@/services/db';
import virtues from '@/constants/virtues';
import { Directory, Paths, File } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

type JournalItem = {
  id: number;
  file_path: string;
  prompt: string | null;
  virtues: Record<string, number>;
  created_at: string;
  updated_at: string;
};

export default function DevToolsScreen() {
  const { theme } = useUnistyles();
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
  const [addVirtueSelected, setAddVirtueSelected] = useState<string>(virtues[0]);
  const [addVirtuePointsInput, setAddVirtuePointsInput] = useState('');

  useEffect(() => {
    if (!__DEV__) {
      router.replace('/(tabs)');
    }
  }, []);

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
      const totals = await getVirtueTotals();
      setVirtueTotals(totals);
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
      let exists = false;

      try {
        const files = await journalDirectory.list();
        exists = true;
        // Count only files (not directories)
        fileCount = files.filter(item => item instanceof File).length;
      } catch {
        exists = false;
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
              const today = new Date();
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
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const file_path = `${year}-${month}-${day}`;

                try {
                  // Check if journal already exists
                  const existing = journals.find(j => j.file_path === file_path);
                  if (existing) {
                    skipped++;
                    continue;
                  }

                  // Create journal entry
                  await createJournal(
                    file_path,
                    dummyPrompts[i],
                    {}
                  );

                  // Update with content
                  await updateJournal(
                    file_path,
                    dummyContents[i],
                    dummyPrompts[i],
                    {}
                  );

                  created++;
                } catch (error) {
                  console.error(`Failed to create journal ${file_path}:`, error);
                }
              }

              // Refresh data
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

  const clearDatabase = async () => {
    Alert.alert(
      'Reset Database',
      'Are you sure you want to reset the entire local database? This will drop and recreate all tables.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await resetDatabase();
              await loadDbInfo();
              await loadJournals();
              Alert.alert('Success', 'Database cleared');
            } catch (error) {
              Alert.alert('Error', `Failed to clear database: ${error}`);
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
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          DevTools
        </ThemedText>
      </ThemedView>

      {loading && (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
        </ThemedView>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
                  {(['journals','journal_virtues','quests','quest_virtues','quest_history','quest_history_virtues','virtues'] as TableName[]).map((t) => (
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
                    <ThemedText style={styles.resultText}>
                      {JSON.stringify(tableRows, null, 2)}
                    </ThemedText>
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
                  <ThemedText style={styles.moreText}>
                    ... and {journals.length - 5} more
                  </ThemedText>
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
                      {quest.prompt.slice(0, 40)}{quest.prompt.length > 40 ? '…' : ''}
                    </ThemedText>
                    <ThemedText style={styles.listItemText}>
                      <ThemedText type="defaultSemiBold">Completed: </ThemedText>
                      {quest.completed ? 'Yes' : 'No'}
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
                  <ThemedText style={styles.moreText}>
                    ... and {quests.length - 5} more
                  </ThemedText>
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
                      <ThemedText type="defaultSemiBold">Completed at: </ThemedText>
                      {entry.completed_at}
                    </ThemedText>
                    <ThemedText style={styles.listItemText}>
                      <ThemedText type="defaultSemiBold">Event: </ThemedText>
                      {entry.event}
                    </ThemedText>
                  </ThemedView>
                ))}
                {questHistory.length > 10 && (
                  <ThemedText style={styles.moreText}>
                    ... and {questHistory.length - 10} more
                  </ThemedText>
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
                  style={[
                    styles.queryPresetButton,
                    addVirtueSelected === name && styles.virtueSelected,
                  ]}
                  onPress={() => setAddVirtueSelected(name)}
                >
                  <ThemedText
                    style={[
                      styles.queryPresetText,
                      addVirtueSelected === name && styles.virtueSelectedText,
                    ]}
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
              <ThemedText style={styles.buttonText}>
                Add points to {addVirtueSelected}
              </ThemedText>
            </TouchableOpacity>
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
                onPress={() => setCustomQuery('SELECT * FROM quest_history ORDER BY completed_at DESC LIMIT 10;')}
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
                <ThemedText style={styles.resultText}>
                  {JSON.stringify(queryResult, null, 2)}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </Collapsible>

        <Collapsible title="Test Data">
          <ThemedView style={styles.section}>
            <ThemedText style={styles.infoRow}>
              Create dummy journal entries for testing purposes. This will create 5 journals with sample prompts, virtues, and content.
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
          </ThemedView>
        </Collapsible>

        <Collapsible title="Danger Zone">
          <ThemedView style={styles.section}>
            <TouchableOpacity style={styles.dangerButton} onPress={clearAllQuests}>
              <ThemedText style={styles.dangerButtonText}>Clear All Quests</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dangerButton, styles.dangerButtonSpaced]} onPress={clearDatabase}>
              <ThemedText style={styles.dangerButtonText}>Clear All Journals</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </Collapsible>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  title: {
    flex: 1,
  },
  loadingContainer: {
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
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
  queryPresetRow: {
    flexDirection: 'row',
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

