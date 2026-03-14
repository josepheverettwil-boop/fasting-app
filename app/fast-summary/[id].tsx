import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { storage } from "@/lib/storage";
import { Fast, MoodEntry } from "@/lib/types";
import { MoodSummaryChart } from "@/components/MoodSummaryChart";
import { Button } from "@/components/Button";
import { getCurrentPhase } from "@/lib/fasting-phases";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { format } from "date-fns";

export default function FastSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [fast, setFast] = useState<Fast | null>(null);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [fastsJson, moodsJson] = await Promise.all([
        storage.get("fasting_app_fasts"),
        storage.get("fasting_app_moods"),
      ]);
      const fasts: Fast[] = fastsJson ? JSON.parse(fastsJson) : [];
      const allMoods: MoodEntry[] = moodsJson ? JSON.parse(moodsJson) : [];

      setFast(fasts.find((f) => f.id === id) ?? null);
      setMoods(allMoods.filter((m) => m.fast_id === id).sort((a, b) => a.hours_into_fast - b.hours_into_fast));
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!fast) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Fast not found</Text>
      </View>
    );
  }

  const durationMs = fast.ended_at
    ? new Date(fast.ended_at).getTime() - new Date(fast.started_at).getTime()
    : 0;
  const durationHours = durationMs / (1000 * 60 * 60);
  const completed = durationHours >= fast.target_hours;
  const phase = getCurrentPhase(durationHours);

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundLight]}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection}>
            <View style={[styles.statusBadge, { backgroundColor: completed ? colors.secondaryDim : colors.primaryDim }]}>
              <Ionicons
                name={completed ? "checkmark-circle" : "timer"}
                size={16}
                color={completed ? colors.secondary : colors.primary}
              />
              <Text style={[styles.statusText, { color: completed ? colors.secondary : colors.primary }]}>
                {completed ? "Completed" : "Ended Early"}
              </Text>
            </View>
            <Text style={styles.durationLarge}>
              {durationHours.toFixed(1)}
              <Text style={styles.durationUnit}> hours</Text>
            </Text>
            <Text style={styles.targetInfo}>
              Target: {fast.target_hours}h
              {completed ? " — Goal reached!" : ` — ${Math.round((durationHours / fast.target_hours) * 100)}% completed`}
            </Text>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Started</Text>
              <Text style={styles.detailValue}>
                {format(new Date(fast.started_at), "MMM d, yyyy h:mm a")}
              </Text>
            </View>
            {fast.ended_at && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ended</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(fast.ended_at), "MMM d, yyyy h:mm a")}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Final Phase</Text>
              <Text style={[styles.detailValue, { color: phase.color }]}>
                {phase.name}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <MoodSummaryChart entries={moods} totalHours={durationHours} />
          </View>

          {fast.notes && (
            <View style={styles.notesCard}>
              <Text style={styles.notesTitle}>Notes</Text>
              <Text style={styles.notesContent}>{fast.notes}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Button
              title="Back to Home"
              onPress={() => router.back()}
              variant="outline"
              fullWidth
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerSection: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  durationLarge: {
    fontSize: 56,
    fontWeight: "200",
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  durationUnit: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
  },
  targetInfo: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  detailsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  section: {
    marginTop: spacing.lg,
  },
  notesCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  notesTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  notesContent: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
