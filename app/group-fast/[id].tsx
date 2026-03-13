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
import { TouchableOpacity } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupFasts } from "@/lib/hooks/useGroupFasts";
import { Button } from "@/components/Button";
import { GroupFastWithMembers, Profile } from "@/lib/types";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { format, formatDistanceToNow } from "date-fns";

export default function GroupFastDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { joinGroupFast } = useGroupFasts();
  const [groupFast, setGroupFast] = useState<GroupFastWithMembers | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: gf } = await supabase
        .from("group_fasts")
        .select("*")
        .eq("id", id)
        .single();

      if (!gf) {
        setLoading(false);
        return;
      }

      const { data: members } = await supabase
        .from("group_fast_members")
        .select("*")
        .eq("group_fast_id", id);

      const userIds = new Set<string>([gf.creator_id]);
      members?.forEach((m) => userIds.add(m.user_id));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(userIds));

      const profileMap = new Map<string, Profile>();
      profiles?.forEach((p) => profileMap.set(p.id, p));

      setGroupFast({
        ...gf,
        creator: profileMap.get(gf.creator_id)!,
        members: (members ?? []).map((m) => ({
          ...m,
          profile: profileMap.get(m.user_id)!,
        })).filter((m) => m.profile),
      });

      setLoading(false);
    };
    load();
  }, [id]);

  const isMember = groupFast?.members.some((m) => m.user_id === user?.id);
  const isCreator = groupFast?.creator_id === user?.id;
  const hasStarted = groupFast
    ? new Date(groupFast.scheduled_start) <= new Date()
    : false;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!groupFast) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Group fast not found</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundLight]}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {groupFast.title}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <View style={styles.targetBadge}>
              <Text style={styles.targetBadgeText}>{groupFast.target_hours}h fast</Text>
            </View>
            <Text style={styles.scheduledText}>
              {hasStarted
                ? `Started ${formatDistanceToNow(new Date(groupFast.scheduled_start), { addSuffix: true })}`
                : `Starts ${format(new Date(groupFast.scheduled_start), "MMM d 'at' h:mm a")}`}
            </Text>
          </View>

          {groupFast.description && (
            <View style={styles.descCard}>
              <Text style={styles.descText}>{groupFast.description}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Created by
            </Text>
            <View style={styles.creatorRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(groupFast.creator.display_name ?? groupFast.creator.username)[0].toUpperCase()}
                </Text>
              </View>
              <Text style={styles.creatorName}>
                {groupFast.creator.display_name ?? groupFast.creator.username}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Members ({groupFast.members.length})
            </Text>
            {groupFast.members.map((m) => (
              <View key={m.id} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {(m.profile.display_name ?? m.profile.username)[0].toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.memberName}>
                    {m.profile.display_name ?? m.profile.username}
                  </Text>
                  <Text style={styles.memberJoined}>
                    Joined {formatDistanceToNow(new Date(m.joined_at), { addSuffix: true })}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {!isMember && (
            <View style={styles.section}>
              <Button
                title="Join Group Fast"
                onPress={async () => {
                  await joinGroupFast(groupFast.id);
                  router.back();
                }}
                fullWidth
                size="lg"
              />
            </View>
          )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backBtn: {
    padding: spacing.xs,
    width: 40,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  targetBadge: {
    backgroundColor: colors.primaryDim,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  targetBadgeText: {
    fontSize: fontSize.lg,
    fontWeight: "800",
    color: colors.primary,
  },
  scheduledText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  descCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  descText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.primary,
  },
  creatorName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  memberAvatarText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.accent,
  },
  memberName: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  memberJoined: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
});
