import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useNickname } from "@/contexts/NicknameContext";
import { useFasting } from "@/contexts/FastingContext";
import { useCommunityFeed, CommunityPost } from "@/lib/hooks/useCommunity";
import { Button } from "@/components/Button";
import { showAlert } from "@/lib/alert";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { formatDistanceToNow } from "date-fns";

function PostCard({ post, onPress }: { post: CommunityPost; onPress: () => void }) {
  const hoursLabel = post.hours_into_fast != null
    ? `${Math.floor(post.hours_into_fast)}h ${Math.round((post.hours_into_fast % 1) * 60)}m into fast`
    : null;

  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>{post.nickname[0].toUpperCase()}</Text>
        </View>
        <View style={styles.postMeta}>
          <Text style={styles.postNickname}>{post.nickname}</Text>
          <Text style={styles.postTime}>
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </Text>
        </View>
        {hoursLabel && (
          <View style={styles.fastBadge}>
            <Ionicons name="flame" size={12} color={colors.primary} />
            <Text style={styles.fastBadgeText}>{hoursLabel}</Text>
          </View>
        )}
      </View>
      <Text style={styles.postContent}>{post.content}</Text>
      <View style={styles.postFooter}>
        <View style={styles.replyCount}>
          <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} />
          <Text style={styles.replyCountText}>
            {post.reply_count ?? 0} {(post.reply_count ?? 0) === 1 ? "reply" : "replies"}
          </Text>
        </View>
        <Text style={styles.tapToReply}>Tap to reply</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SocialScreen() {
  const { nickname } = useNickname();
  const { activeFast, getElapsedHours } = useFasting();
  const { posts, loading, error, createPost, refreshPosts } = useCommunityFeed();
  const [showCompose, setShowCompose] = useState(false);
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!message.trim() || !nickname) return;
    setPosting(true);
    try {
      await createPost(
        nickname,
        message.trim(),
        activeFast ? getElapsedHours() : undefined,
        activeFast ? activeFast.target_hours : undefined
      );
      setMessage("");
      setShowCompose(false);
    } catch (e: any) {
      showAlert("Error", e.message ?? "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundLight]}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>Community</Text>
            <Text style={styles.screenSubtitle}>Support each other through the fast</Text>
          </View>
          <TouchableOpacity
            style={styles.composeBtn}
            onPress={() => setShowCompose(!showCompose)}
          >
            <Ionicons name={showCompose ? "close" : "add"} size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {showCompose && (
          <View style={styles.composeCard}>
            {activeFast && (
              <View style={styles.composeFastBadge}>
                <Ionicons name="flame" size={14} color={colors.secondary} />
                <Text style={styles.composeFastText}>
                  Currently fasting — {Math.floor(getElapsedHours())}h in
                </Text>
              </View>
            )}
            <TextInput
              style={styles.composeInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Ask a question, share how you're feeling, or offer advice..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
              autoFocus
            />
            <View style={styles.composeActions}>
              <Text style={styles.charCount}>{message.length}/500</Text>
              <Button
                title="Post"
                onPress={handlePost}
                loading={posting}
                disabled={!message.trim()}
                size="sm"
              />
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>
              Make sure you've run the community SQL migration in Supabase
            </Text>
          </View>
        )}

        {loading && posts.length === 0 ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>
              Be the first to share! Tap the + button to post a question or share how your fast is going.
            </Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                onPress={() => router.push(`/community/${item.id}`)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={refreshPosts}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  screenTitle: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  composeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  composeCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + "44",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  composeFastBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.secondaryDim,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginBottom: spacing.sm,
    gap: 4,
  },
  composeFastText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.secondary,
  },
  composeInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    minHeight: 80,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  composeActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  errorBanner: {
    backgroundColor: colors.error + "15",
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  errorHint: {
    color: colors.error,
    fontSize: fontSize.xs,
    marginTop: 4,
    opacity: 0.7,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  postCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  postAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  postAvatarText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.accent,
  },
  postMeta: {
    flex: 1,
  },
  postNickname: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  postTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  fastBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryDim,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  fastBadgeText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: "500",
  },
  postContent: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  replyCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  replyCountText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  tapToReply: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 20,
    maxWidth: 300,
  },
});
