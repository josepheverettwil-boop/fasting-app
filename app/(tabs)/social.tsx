import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFriends } from "@/lib/hooks/useFriends";
import { useGroupFasts } from "@/lib/hooks/useGroupFasts";
import { FriendCard } from "@/components/FriendCard";
import { Button } from "@/components/Button";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { format } from "date-fns";

export default function SocialScreen() {
  const { friends, pendingRequests, sendFriendRequest, acceptRequest, declineRequest, loading } = useFriends();
  const { groupFasts } = useGroupFasts();
  const [username, setUsername] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);

  const handleAddFriend = async () => {
    if (!username.trim()) return;
    setAddingFriend(true);
    try {
      await sendFriendRequest(username.trim());
      Alert.alert("Sent!", `Friend request sent to @${username}`);
      setUsername("");
      setShowAddFriend(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setAddingFriend(false);
    }
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
          <View style={styles.headerRow}>
            <Text style={styles.screenTitle}>Social</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAddFriend(!showAddFriend)}
            >
              <Ionicons name="person-add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {showAddFriend && (
            <View style={styles.addFriendCard}>
              <Text style={styles.addFriendTitle}>Add a Friend</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor={colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <Button
                title="Send Request"
                onPress={handleAddFriend}
                loading={addingFriend}
                fullWidth
                size="sm"
              />
            </View>
          )}

          {pendingRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Friend Requests ({pendingRequests.length})
              </Text>
              {pendingRequests.map((req) => (
                <View key={req.id} style={styles.requestCard}>
                  <View style={styles.requestInfo}>
                    <View style={styles.reqAvatar}>
                      <Text style={styles.reqAvatarText}>
                        {(req.profile.display_name ?? req.profile.username)[0].toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.reqName}>
                        {req.profile.display_name ?? req.profile.username}
                      </Text>
                      <Text style={styles.reqUsername}>
                        @{req.profile.username}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => acceptRequest(req.id)}
                    >
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineBtn}
                      onPress={() => declineRequest(req.id)}
                    >
                      <Ionicons name="close" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Friends {friends.length > 0 ? `(${friends.length})` : ""}
            </Text>
            {friends.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="people-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>
                  Add friends to see their fasting progress
                </Text>
              </View>
            ) : (
              friends.map((friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  onPress={() => {}}
                  onMessage={() =>
                    router.push(`/chat/${friend.profile.id}`)
                  }
                />
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Group Fasts</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => router.push("/group-fast/create")}
              >
                <Ionicons name="add" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
            {groupFasts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="fitness-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>
                  Create or join a group fast with friends
                </Text>
                <Button
                  title="Create Group Fast"
                  onPress={() => router.push("/group-fast/create")}
                  variant="outline"
                  size="sm"
                  style={{ marginTop: spacing.md }}
                />
              </View>
            ) : (
              groupFasts.map((gf) => (
                <TouchableOpacity
                  key={gf.id}
                  style={styles.groupFastCard}
                  onPress={() => router.push(`/group-fast/${gf.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.gfHeader}>
                    <Text style={styles.gfTitle}>{gf.title}</Text>
                    <View style={styles.gfBadge}>
                      <Text style={styles.gfBadgeText}>{gf.target_hours}h</Text>
                    </View>
                  </View>
                  {gf.description && (
                    <Text style={styles.gfDesc} numberOfLines={2}>
                      {gf.description}
                    </Text>
                  )}
                  <View style={styles.gfFooter}>
                    <Text style={styles.gfMeta}>
                      {format(new Date(gf.scheduled_start), "MMM d, h:mm a")}
                    </Text>
                    <Text style={styles.gfMembers}>
                      {gf.members.length} member{gf.members.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  screenTitle: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  addFriendCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  addFriendTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.accent + "44",
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  requestInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  reqAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  reqAvatarText: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.accent,
  },
  reqName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  reqUsername: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  requestActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  acceptBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  groupFastCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  gfHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gfTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  gfBadge: {
    backgroundColor: colors.primaryDim,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  gfBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.primary,
  },
  gfDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  gfFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  gfMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  gfMembers: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: "500",
  },
});
