import { useRef } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RichEditor, RichToolbar } from "react-native-pell-rich-editor";

export default function EditorScreen() {
  const richText = useRef<RichEditor>(null);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <RichToolbar editor={richText} />
      <RichEditor
        ref={richText}
        initialContentHTML="<p>Start typing...</p>"
        style={styles.editor}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editor: {
    flex: 1,
    backgroundColor: "#fff",
  },
});