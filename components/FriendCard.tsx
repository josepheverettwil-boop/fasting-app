import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { FriendWithProfile } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface FriendCardProps {
  friend: FriendWithProfile;
  onPress: () => void;
  onMessage: () => void;
}

export function FriendCard({ friend, onPress, onMessage }: FriendCardProps) {
  const { profile, active_fast } = friend;

  const getFastingStatus = () => {
    if (!active_fast) return null;
    const start = new Date(active_fast.started_at).getTime();
    const hours = (Date.now() - start) / (1000 * 60 * 60);
    return {
      hours: Math.floor(hours),
      started: formatDistanceToNow(new Date(active_fast.started_at), {
        addSuffix: true,
      }),
    };
  };

  const fastStatus = getFastingStatus();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(profile.display_name ?? profile.username)[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>
          {profile.display_name ?? profile.username}
        </Text>
        <Text style={styles.username}>@{profile.username}</Text>
        {fastStatus && (
          <View style={styles.fastingBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.fastingText}>
              Fasting for {fastStatus.hours}h
            </Text>
          </View>
        )}
      </View>
      {fastStatus && (
        <TouchableOpacity style={styles.messageBtn} onPress={onMessage}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.primary,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  username: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 1,
  },
  fastingBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginRight: spacing.xs,
  },
  fastingText: {
    fontSize: fontSize.xs,
    color: colors.secondary,
    fontWeight: "500",
  },
  messageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
});
