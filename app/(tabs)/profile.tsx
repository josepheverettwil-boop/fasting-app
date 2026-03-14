import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useNickname } from "@/contexts/NicknameContext";
import { useFasting } from "@/contexts/FastingContext";
import { Button } from "@/components/Button";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";

export default function ProfileScreen() {
  const { nickname, clearNickname } = useNickname();
  const { pastFasts } = useFasting();

  const totalFasts = pastFasts.length;
  const totalHours = pastFasts.reduce((sum, fast) => {
    if (!fast.ended_at) return sum;
    return (
      sum +
      (new Date(fast.ended_at).getTime() - new Date(fast.started_at).getTime()) /
        (1000 * 60 * 60)
    );
  }, 0);
  const completedFasts = pastFasts.filter((f) => {
    if (!f.ended_at) return false;
    const hours =
      (new Date(f.ended_at).getTime() - new Date(f.started_at).getTime()) /
      (1000 * 60 * 60);
    return hours >= f.target_hours;
  }).length;
  const longestFast = pastFasts.reduce((max, fast) => {
    if (!fast.ended_at) return max;
    const hours =
      (new Date(fast.ended_at).getTime() - new Date(fast.started_at).getTime()) /
      (1000 * 60 * 60);
    return Math.max(max, hours);
  }, 0);

  const handleChangeNickname = async () => {
    await clearNickname();
    router.replace("/welcome");
  };

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
          <View style={styles.profileHeader}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>
                {(nickname ?? "?")[0].toUpperCase()}
              </Text>
            </View>
            <Text style={styles.displayName}>{nickname}</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="flame-outline" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{totalFasts}</Text>
              <Text style={styles.statLabel}>Total Fasts</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={24} color={colors.secondary} />
              <Text style={styles.statValue}>{totalHours.toFixed(0)}h</Text>
              <Text style={styles.statLabel}>Hours Fasted</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trophy-outline" size={24} color={colors.warning} />
              <Text style={styles.statValue}>{completedFasts}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="rocket-outline" size={24} color={colors.accent} />
              <Text style={styles.statValue}>{longestFast > 0 ? `${longestFast.toFixed(1)}h` : "—"}</Text>
              <Text style={styles.statLabel}>Longest Fast</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Button
              title="Change Nickname"
              onPress={handleChangeNickname}
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
  },
  displayName: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statCard: {
    width: "48%",
    flexBasis: "48%",
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: spacing.xl,
  },
});
