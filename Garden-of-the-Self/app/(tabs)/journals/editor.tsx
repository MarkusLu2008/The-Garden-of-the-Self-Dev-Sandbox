import { useRef, useState, useEffect, useCallback } from "react";
import { StyleSheet, ActivityIndicator, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { RichEditor, RichToolbar } from "react-native-pell-rich-editor";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getJournalContent, getJournalInfo, createJournal, updateJournal } from "@/services/journalManager";
import { formatDateForDisplay } from "@/utils/dateUtils";
import { useUnistyles } from "react-native-unistyles";
import { journalStyles, spacing } from "@/utils/styles";

export default function EditorScreen() {
  const richText = useRef<RichEditor>(null);
  const router = useRouter();
  const { theme } = useUnistyles();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  // Load existing journal content
  useEffect(() => {
    const loadJournal = async () => {
      if (!date) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const existingContent = await getJournalContent(date);
        
        if (existingContent) {
          setContent(existingContent);
          richText.current?.setContentHTML(existingContent);
        } else {
          const defaultContent = "<p>Start typing...</p>";
          setContent(defaultContent);
          richText.current?.setContentHTML(defaultContent);
        }
      } catch (error) {
        console.error("Failed to load journal:", error);
        const defaultContent = "<p>Start typing...</p>";
        setContent(defaultContent);
        richText.current?.setContentHTML(defaultContent);
      } finally {
        setIsLoading(false);
      }
    };

    loadJournal();
  }, [date]);

  // Auto-save function
  const saveJournal = useCallback(async (htmlContent: string) => {
    if (!date) return;

    // Prevent concurrent saves
    if (isSavingRef.current) {
      return;
    }

    try {
      setIsSaving(true);
      isSavingRef.current = true;
      
      // Get or use default prompt and virtues
      let prompt = "";
      let virtues: Record<string, number> = {};
      
      try {
        const journalInfo = await getJournalInfo(date);
        prompt = journalInfo?.prompt || "";
        virtues = journalInfo?.virtues || {};
      } catch {
        // Journal doesn't exist yet, will create new one
      }

      // Check if journal exists by trying to get content
      const existingContent = await getJournalContent(date).catch(() => null);
      
      if (existingContent !== null) {
        // Update existing journal
        await updateJournal(date, htmlContent, prompt, virtues);
      } else {
        // Create new journal first
        await createJournal(date, prompt, virtues);
        // Then update with content
        await updateJournal(date, htmlContent, prompt, virtues);
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save journal:", error);
      // Re-throw to allow callers to handle the error
      throw error;
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [date]);

  // Handle content change with debounce
  // onChange callback receives the HTML content directly
  const checkAndSaveContent = useCallback((htmlContent: string) => {
    // Update content state
    setContent(htmlContent);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (2 seconds after user stops typing)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveJournal(htmlContent);
      } catch (error) {
        console.error('Failed to save content:', error);
      }
    }, 2000);
  }, [saveJournal]);

  // Save on unmount if there's unsaved content
  useEffect(() => {
    // Capture current values for cleanup
    const currentDate = date;
    const currentContent = content;
    
    return () => {
      // Clear any pending timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      
      // Save content on unmount if we have unsaved changes
      // Note: We use the content state which is updated via onChange callback
      if (currentDate && currentContent && currentContent.trim() && !isSavingRef.current) {
        saveJournal(currentContent).catch((error: unknown) => {
          console.error('Failed to save on unmount:', error);
        });
      }
    };
  }, [date, content, saveJournal]);

  return (
    <SafeAreaView style={journalStyles.container} edges={["top"]}>
      <ThemedView style={[styles.header, journalStyles.headerBorder]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={[styles.backButtonText, { color: theme.colors.tint }]}>
            ← Back
          </ThemedText>
        </TouchableOpacity>
        <ThemedText type="defaultSemiBold" style={styles.dateText}>
          {date ? formatDateForDisplay(date) : "New Journal"}
        </ThemedText>
        <View style={styles.statusContainer}>
          {isSaving && (
            <>
              <ActivityIndicator size="small" style={styles.statusIndicator} />
              <ThemedText style={styles.statusText}>Saving...</ThemedText>
            </>
          )}
          {!isSaving && lastSaved && (
            <ThemedText style={styles.statusText}>
              Saved {lastSaved.toLocaleTimeString()}
            </ThemedText>
          )}
        </View>
      </ThemedView>
      {isLoading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </ThemedView>
      ) : (
        <ScrollView
          style={styles.editorContainer}
          contentContainerStyle={styles.editorContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <RichToolbar editor={richText} />
          <RichEditor
            ref={richText}
            initialContentHTML={content || "<p>Start typing...</p>"}
            onChange={checkAndSaveContent}
            style={[styles.editor, { backgroundColor: theme.colors.background }]}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    paddingRight: spacing.md,
  },
  backButtonText: {
    fontSize: 16,
  },
  dateText: {
    fontSize: 16,
    flex: 1,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusIndicator: {
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  editorContainer: {
    flex: 1,
  },
  editorContent: {
    flexGrow: 1,

  },
  editor: {
    flex: 1,
  },
});

