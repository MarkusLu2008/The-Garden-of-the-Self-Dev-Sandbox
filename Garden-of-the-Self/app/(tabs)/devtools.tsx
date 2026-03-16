import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { getAllJournals, createJournal, updateJournal } from '@/services/journalManager';
import { insertQuest } from '@/services/db';
import { Directory, Paths, File } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

type JournalItem = {
  id: number;
  file_path: string;
  prompt: string | null;
  virtues: string | null;
  created_at: string;
  updated_at: string;
};

export default function DevToolsScreen() {
  const [journals, setJournals] = useState<JournalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [customQuery, setCustomQuery] = useState('SELECT * FROM journals LIMIT 10;');
  const [fileSystemInfo, setFileSystemInfo] = useState<any>(null);

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
      const totalSize = await db.getFirstAsync<{ size: number }>(
        "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()"
      );

      setDbInfo({
        tables: tables.map(t => t.name),
        journalCount: journalCount?.count || 0,
        totalSize: totalSize?.size || 0,
      });
    } catch (error) {
      console.error('Failed to load DB info:', error);
      Alert.alert('Error', `Failed to load DB info: ${error}`);
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
              const dummyVirtues = [
                'Courage, Wisdom, Justice',
                'Temperance, Wisdom, Courage',
                'Justice, Wisdom, Temperance',
                'Courage, Justice, Wisdom',
                'Temperance, Courage, Justice',
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
                    dummyVirtues[i]
                  );

                  // Update with content
                  await updateJournal(
                    file_path,
                    dummyContents[i],
                    dummyPrompts[i],
                    dummyVirtues[i]
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
      'This will create 5 dummy quests with sample prompts and virtues. Continue?',
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
              ];
              const virtuePairs: [string, string | null, string | null][] = [
                ['Courage', 'Resilience', 'Empathy'],
                ['Patience', 'Temperance', null],
                ['Kindness', 'Empathy', 'Respectfulness'],
                ['Curiosity', 'Proper Ambition', null],
                ['Collaboration', 'Tolerance', 'Respectfulness'],
              ];

              for (let i = 0; i < 5; i++) {
                const [primary, secondary, tertiary] = virtuePairs[i];
                await insertQuest(
                  dummyPrompts[i],
                  primary,
                  secondary,
                  tertiary
                );
              }

              await loadDbInfo();

              Alert.alert('Success', 'Created 5 dummy quests.');
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

  const clearDatabase = async () => {
    Alert.alert(
      'Clear Database',
      'Are you sure you want to delete all journals from the database? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const db = await SQLite.openDatabaseAsync('garden-of-the-self.db');
              await db.runAsync('DELETE FROM journals');
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
    loadDbInfo();
    loadFileSystemInfo();
  }, []);

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
                  <ThemedText type="defaultSemiBold">Database Size: </ThemedText>
                  {formatBytes(dbInfo.totalSize)}
                </ThemedText>
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
              <ThemedView style={styles.journalList}>
                {journals.slice(0, 5).map((journal) => (
                  <ThemedView key={journal.id} style={styles.journalItem}>
                    <ThemedText style={styles.journalText}>
                      <ThemedText type="defaultSemiBold">ID: </ThemedText>
                      {journal.id}
                    </ThemedText>
                    <ThemedText style={styles.journalText}>
                      <ThemedText type="defaultSemiBold">Path: </ThemedText>
                      {journal.file_path}
                    </ThemedText>
                    <ThemedText style={styles.journalText}>
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

        <Collapsible title="Custom SQL Query">
          <ThemedView style={styles.section}>
            <TextInput
              style={styles.queryInput}
              value={customQuery}
              onChangeText={setCustomQuery}
              placeholder="Enter SQL query"
              placeholderTextColor="#999"
              multiline
            />
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
              Create dummy quests for testing. This will create 5 quests with sample prompts and primary/secondary/tertiary virtues.
            </ThemedText>
            <TouchableOpacity style={styles.button} onPress={createDummyQuests}>
              <ThemedText style={styles.buttonText}>Create Dummy Quests</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </Collapsible>

        <Collapsible title="Danger Zone">
          <ThemedView style={styles.section}>
            <TouchableOpacity style={styles.dangerButton} onPress={clearDatabase}>
              <ThemedText style={styles.dangerButtonText}>Clear All Journals</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </Collapsible>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    flex: 1,
  },
  loadingContainer: {
    padding: 10,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    padding: 12,
  },
  infoRow: {
    marginBottom: 8,
    fontSize: 14,
  },
  infoRowTop: {
    marginTop: 16,
  },
  pathText: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.7,
  },
  button: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  journalList: {
    marginTop: 12,
  },
  journalItem: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  journalText: {
    fontSize: 12,
    marginBottom: 4,
  },
  moreText: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
    marginTop: 8,
  },
  queryInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 80,
    marginBottom: 8,
    color: '#000',
  },
  queryResult: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  resultTitle: {
    marginBottom: 8,
  },
  resultText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#000',
  },
});

