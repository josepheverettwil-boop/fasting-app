import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { colors, moodColors, moodLabels, spacing, fontSize, borderRadius } from "@/lib/theme";
import { Button } from "./Button";

interface MoodTrackerProps {
  onSubmit: (score: 1 | 2 | 3 | 4 | 5, note?: string) => Promise<void>;
}

const MOOD_EMOJIS = ["😫", "😔", "😐", "🙂", "🤩"];

export function MoodTracker({ onSubmit }: MoodTrackerProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (selected === null) return;
    setLoading(true);
    try {
      await onSubmit((selected + 1) as 1 | 2 | 3 | 4 | 5, note || undefined);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelected(null);
        setNote("");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <Text style={styles.successText}>Mood logged!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling?</Text>
      <View style={styles.moodRow}>
        {MOOD_EMOJIS.map((emoji, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setSelected(i)}
            style={[
              styles.moodButton,
              selected === i && {
                backgroundColor: moodColors[i] + "33",
                borderColor: moodColors[i],
              },
            ]}
          >
            <Text style={styles.moodEmoji}>{emoji}</Text>
            <Text
              style={[
                styles.moodLabel,
                selected === i && { color: moodColors[i] },
              ]}
            >
              {moodLabels[i]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {selected !== null && (
        <>
          <TextInput
            style={styles.noteInput}
            placeholder="Add a note (optional)..."
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
          />
          <Button
            title="Log Mood"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            size="sm"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  moodButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  moodLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  noteInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    padding: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    minHeight: 60,
    textAlignVertical: "top",
  },
  successText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.secondary,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});
