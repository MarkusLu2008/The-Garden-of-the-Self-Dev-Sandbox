import { useRef, useState, useEffect, useCallback } from "react";
import { StyleSheet, ActivityIndicator, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { EnrichedTextInput, type EnrichedTextInputInstance, type OnChangeStateEvent } from "react-native-enriched";
import type { NativeSyntheticEvent } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getJournalContent, getJournalInfo, createJournal, updateJournal } from "@/services/journalManager";
import { formatDateForDisplay } from "@/utils/dateUtils";
import { useUnistyles } from '@/lib/unistyles-compat';
import { journalStyles, spacing } from "@/utils/styles";

type StyleState = OnChangeStateEvent;

function decodeParam(value: string | undefined): string {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function buildQuestReflectionTemplate(questPrompt: string): string {
  const normalizedPrompt = questPrompt.trim();
  if (!normalizedPrompt) return '';

  return [
    `Quest completed: ${normalizedPrompt}`,
    '',
    'How did this quest challenge me?',
    '',
    'What did I learn about myself?',
    '',
    'What is one thing I want to carry into tomorrow?',
    '',
  ].join('\n');
}

interface ToolbarButton {
  label: string;
  style: keyof StyleState;
  action: (ref: EnrichedTextInputInstance) => void;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { label: "B", style: "bold", action: (r) => r.toggleBold() },
  { label: "I", style: "italic", action: (r) => r.toggleItalic() },
  { label: "U", style: "underline", action: (r) => r.toggleUnderline() },
  { label: "S", style: "strikeThrough", action: (r) => r.toggleStrikeThrough() },
];

export default function EditorScreen() {
  const richText = useRef<EnrichedTextInputInstance>(null);
  const router = useRouter();
  const { theme } = useUnistyles();
  const { date, sourceQuestPrompt } = useLocalSearchParams<{
    date: string;
    sourceQuestPrompt?: string;
  }>();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [defaultValue, setDefaultValue] = useState("");
  const [styleState, setStyleState] = useState<StyleState | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const latestContentRef = useRef("");

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
        const decodedQuestPrompt = decodeParam(sourceQuestPrompt);

        if (existingContent && existingContent.trim().length > 0) {
          setDefaultValue(existingContent);
          latestContentRef.current = existingContent;
        } else if (decodedQuestPrompt) {
          const questTemplate = buildQuestReflectionTemplate(decodedQuestPrompt);
          setDefaultValue(questTemplate);
          latestContentRef.current = questTemplate;
        }
      } catch (error) {
        console.error("Failed to load journal:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadJournal();
  }, [date, sourceQuestPrompt]);

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
      throw error;
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [date]);

  // Handle content change with debounce
  const checkAndSaveContent = useCallback((htmlContent: string) => {
    latestContentRef.current = htmlContent;

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
    return () => {
      // Clear any pending timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      // Save content on unmount using the latest content ref
      const currentContent = latestContentRef.current;
      if (date && currentContent && currentContent.trim() && !isSavingRef.current) {
        saveJournal(currentContent).catch((error: unknown) => {
          console.error('Failed to save on unmount:', error);
        });
      }
    };
  }, [date, saveJournal]);

  const handleChangeHtml = useCallback((e: NativeSyntheticEvent<{ value: string }>) => {
    checkAndSaveContent(e.nativeEvent.value);
  }, [checkAndSaveContent]);

  const handleChangeState = useCallback((e: NativeSyntheticEvent<OnChangeStateEvent>) => {
    setStyleState(e.nativeEvent);
  }, []);

  return (
    <SafeAreaView style={journalStyles.container} edges={["top"]}>
      <ThemedView style={[styles.header, journalStyles.headerBorder]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
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
        <View style={styles.editorContainer}>
          <View style={[styles.toolbar, { borderBottomColor: theme.colors.icon }]}>
            {TOOLBAR_BUTTONS.map((button) => {
              const isActive = styleState?.[button.style]?.isActive ?? false;
              return (
                <TouchableOpacity
                  key={button.label}
                  onPress={() => {
                    if (richText.current) {
                      button.action(richText.current);
                    }
                  }}
                  style={[
                    styles.toolbarButton,
                    isActive && { backgroundColor: theme.colors.tint },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.toolbarButtonText,
                      button.style === "bold" && { fontWeight: "bold" },
                      button.style === "italic" && { fontStyle: "italic" },
                      button.style === "underline" && { textDecorationLine: "underline" },
                      button.style === "strikeThrough" && { textDecorationLine: "line-through" },
                      isActive && { color: "#fff" },
                    ]}
                  >
                    {button.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
          <EnrichedTextInput
            ref={richText}
            defaultValue={defaultValue}
            placeholder="Start typing..."
            placeholderTextColor={theme.colors.tabIconDefault}
            onChangeHtml={handleChangeHtml}
            onChangeState={handleChangeState}
            style={{
              flex: 1,
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              fontSize: 16,
              padding: spacing.md,
            }}
          />
        </View>
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
    gap: spacing.xs,
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
  toolbar: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  toolbarButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  toolbarButtonText: {
    fontSize: 16,
  },
});
