import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useNickname } from "@/contexts/NicknameContext";
import { useFasting } from "@/contexts/FastingContext";
import { CircularTimer } from "@/components/CircularTimer";
import { MoodTracker } from "@/components/MoodTracker";
import { Button } from "@/components/Button";
import { FAST_PRESETS } from "@/lib/fasting-phases";
import { showAlert } from "@/lib/alert";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { formatDistanceToNow } from "date-fns";

export default function TimerScreen() {
  const { nickname } = useNickname();
  const { activeFast, pastFasts, startFast, endFast, logMood, loading } = useFasting();
  const [selectedPreset, setSelectedPreset] = useState(1);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartFast = async () => {
    setStarting(true);
    setError(null);
    try {
      await startFast(FAST_PRESETS[selectedPreset].hours);
    } catch (e: any) {
      const msg = e.message ?? "Failed to start fast";
      setError(msg);
      showAlert("Error", msg);
    } finally {
      setStarting(false);
    }
  };

  const handleEndFast = () => {
    showAlert(
      "End Fast",
      "Are you sure you want to end your current fast?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Fast",
          style: "destructive",
          onPress: async () => {
            const fastId = activeFast?.id;
            await endFast();
            if (fastId) {
              router.push(`/fast-summary/${fastId}`);
            }
          },
        },
      ]
    );
  };

  if (activeFast) {
    return (
      <LinearGradient
        colors={[colors.background, colors.backgroundLight]}
        style={styles.flex}
      >
        <SafeAreaView style={styles.flex} edges={["top"]}>
          <ScrollView
            contentContainerStyle={styles.activeContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.greeting}>
              Keep going, {nickname}
            </Text>

            <CircularTimer
              startedAt={activeFast.started_at}
              targetHours={activeFast.target_hours}
            />

            <View style={styles.section}>
              <MoodTracker onSubmit={logMood} />
            </View>

            <View style={styles.section}>
              <Button
                title="End Fast"
                onPress={handleEndFast}
                variant="outline"
                fullWidth
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundLight]}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.startContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.greeting}>Hey, {nickname}</Text>
          <Text style={styles.screenTitle}>Start a Fast</Text>
          <Text style={styles.screenSubtitle}>
            Choose your fasting window
          </Text>

          <View style={styles.presetsGrid}>
            {FAST_PRESETS.map((preset, i) => (
              <TouchableOpacity
                key={preset.label}
                style={[
                  styles.presetCard,
                  selectedPreset === i && styles.presetCardSelected,
                ]}
                onPress={() => setSelectedPreset(i)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.presetLabel,
                    selectedPreset === i && styles.presetLabelSelected,
                  ]}
                >
                  {preset.label}
                </Text>
                <Text style={styles.presetDesc}>{preset.description}</Text>
                <Text style={styles.presetHours}>{preset.hours}h</Text>
              </TouchableOpacity>
            ))}
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            title={`Start ${FAST_PRESETS[selectedPreset].label} Fast`}
            onPress={handleStartFast}
            loading={starting}
            fullWidth
            size="lg"
          />

          {pastFasts.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Recent Fasts</Text>
              {pastFasts.slice(0, 5).map((fast) => {
                const duration = fast.ended_at
                  ? (new Date(fast.ended_at).getTime() -
                      new Date(fast.started_at).getTime()) /
                    (1000 * 60 * 60)
                  : 0;
                return (
                  <TouchableOpacity
                    key={fast.id}
                    style={styles.historyCard}
                    onPress={() => router.push(`/fast-summary/${fast.id}`)}
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text style={styles.historyDuration}>
                        {duration.toFixed(1)} hours
                      </Text>
                      <Text style={styles.historyDate}>
                        {formatDistanceToNow(new Date(fast.started_at), {
                          addSuffix: true,
                        })}
                      </Text>
                    </View>
                    <View style={styles.historyTarget}>
                      <Text style={styles.historyTargetText}>
                        {duration >= fast.target_hours ? "Completed" : `${Math.round((duration / fast.target_hours) * 100)}%`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  activeContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  startContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  greeting: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  screenTitle: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  screenSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  presetCard: {
    width: "48%",
    flexBasis: "48%",
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  presetCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDim,
  },
  presetLabel: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  presetLabelSelected: {
    color: colors.primary,
  },
  presetDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  presetHours: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  errorBanner: {
    backgroundColor: colors.error + "20",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error + "44",
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  historySection: {
    marginTop: spacing.xl,
  },
  historyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  historyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  historyDuration: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  historyDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyTarget: {
    backgroundColor: colors.secondaryDim,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  historyTargetText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.secondary,
  },
});
