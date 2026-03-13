import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { format } from "date-fns";

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isMine: boolean;
  senderName?: string;
}

export function MessageBubble({
  content,
  timestamp,
  isMine,
  senderName,
}: MessageBubbleProps) {
  return (
    <View style={[styles.row, isMine && styles.rowMine]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        {!isMine && senderName && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}
        <Text style={[styles.content, isMine && styles.contentMine]}>
          {content}
        </Text>
        <Text style={[styles.time, isMine && styles.timeMine]}>
          {format(new Date(timestamp), "h:mm a")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  rowMine: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "78%",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
  },
  content: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  contentMine: {
    color: "#fff",
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    alignSelf: "flex-end",
  },
  timeMine: {
    color: "rgba(255,255,255,0.6)",
  },
});
