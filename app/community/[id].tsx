import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNickname } from "@/contexts/NicknameContext";
import { useFasting } from "@/contexts/FastingContext";
import { useCommunityFeed, usePostReplies, CommunityReply } from "@/lib/hooks/useCommunity";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { formatDistanceToNow } from "date-fns";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { nickname } = useNickname();
  const { activeFast, getElapsedHours } = useFasting();
  const { posts } = useCommunityFeed();
  const { replies, addReply } = usePostReplies(id);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const post = posts.find((p) => p.id === id);

  const handleSend = async () => {
    if (!text.trim() || !nickname || sending) return;
    setSending(true);
    try {
      await addReply(
        nickname,
        text.trim(),
        activeFast ? getElapsedHours() : undefined
      );
      setText("");
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setSending(false);
    }
  };

  const renderReply = ({ item }: { item: CommunityReply }) => {
    const isMe = item.nickname === nickname;
    return (
      <View style={[styles.replyRow, isMe && styles.replyRowMe]}>
        <View style={[styles.replyBubble, isMe ? styles.replyBubbleMe : styles.replyBubbleOther]}>
          <View style={styles.replyHeader}>
            <Text style={[styles.replyNickname, isMe && styles.replyNicknameMe]}>
              {item.nickname}
            </Text>
            {item.hours_into_fast != null && (
              <View style={styles.replyFastBadge}>
                <Text style={styles.replyFastText}>
                  {Math.floor(item.hours_into_fast)}h in
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.replyContent, isMe && styles.replyContentMe]}>
            {item.content}
          </Text>
          <Text style={[styles.replyTime, isMe && styles.replyTimeMe]}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </Text>
        </View>
      </View>
    );
  };

  const hoursLabel = post?.hours_into_fast != null
    ? `${Math.floor(post.hours_into_fast)}h ${Math.round((post.hours_into_fast % 1) * 60)}m into fast`
    : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thread</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={replies}
        keyExtractor={(item) => item.id}
        renderItem={renderReply}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          post ? (
            <View style={styles.originalPost}>
              <View style={styles.opHeader}>
                <View style={styles.opAvatar}>
                  <Text style={styles.opAvatarText}>{post.nickname[0].toUpperCase()}</Text>
                </View>
                <View style={styles.opMeta}>
                  <Text style={styles.opNickname}>{post.nickname}</Text>
                  <Text style={styles.opTime}>
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </Text>
                </View>
              </View>
              {hoursLabel && (
                <View style={styles.opFastBadge}>
                  <Ionicons name="flame" size={14} color={colors.primary} />
                  <Text style={styles.opFastText}>{hoursLabel}</Text>
                </View>
              )}
              <Text style={styles.opContent}>{post.content}</Text>
              <View style={styles.repliesDivider}>
                <Text style={styles.repliesLabel}>
                  {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </Text>
              </View>
            </View>
          ) : null
        }
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inputBar}>
          {activeFast && (
            <View style={styles.inputFastIndicator}>
              <Ionicons name="flame" size={10} color={colors.secondary} />
              <Text style={styles.inputFastText}>
                {Math.floor(getElapsedHours())}h in
              </Text>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={setText}
              placeholder="Offer advice or support..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, text.trim() && styles.sendBtnActive]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            >
              <Ionicons
                name="send"
                size={20}
                color={text.trim() ? "#fff" : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  backBtn: {
    padding: spacing.xs,
    width: 40,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  originalPost: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  opHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  opAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  opAvatarText: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.accent,
  },
  opMeta: {
    marginLeft: spacing.sm,
  },
  opNickname: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  opTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  opFastBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryDim,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.sm,
    gap: 4,
  },
  opFastText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.primary,
  },
  opContent: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  repliesDivider: {
    marginTop: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  repliesLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  replyRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  replyRowMe: {
    alignItems: "flex-end",
  },
  replyBubble: {
    maxWidth: "82%",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  replyBubbleOther: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderBottomLeftRadius: 4,
  },
  replyBubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 4,
  },
  replyNickname: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.accent,
  },
  replyNicknameMe: {
    color: "rgba(255,255,255,0.8)",
  },
  replyFastBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  replyFastText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  replyContent: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  replyContentMe: {
    color: "#fff",
  },
  replyTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    alignSelf: "flex-end",
  },
  replyTimeMe: {
    color: "rgba(255,255,255,0.5)",
  },
  inputBar: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  inputFastIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 6,
  },
  inputFastText: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.textMuted + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnActive: {
    backgroundColor: colors.primary,
  },
});
