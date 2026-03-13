import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { MessageWithSender, Profile } from "@/lib/types";

export interface Conversation {
  userId: string;
  profile: Profile;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export function useMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!messages || messages.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const userIds = new Set<string>();
    messages.forEach((m) => {
      if (m.sender_id !== user.id) userIds.add(m.sender_id);
      if (m.receiver_id !== user.id) userIds.add(m.receiver_id);
    });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", Array.from(userIds));

    const profileMap = new Map<string, Profile>();
    profiles?.forEach((p) => profileMap.set(p.id, p));

    const convMap = new Map<string, Conversation>();
    messages.forEach((m) => {
      const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!convMap.has(otherId)) {
        const profile = profileMap.get(otherId);
        if (!profile) return;
        convMap.set(otherId, {
          userId: otherId,
          profile,
          lastMessage: m.content,
          lastMessageAt: m.created_at,
          unreadCount: 0,
        });
      }
      if (m.receiver_id === user.id && !m.is_read) {
        const conv = convMap.get(otherId)!;
        conv.unreadCount++;
      }
    });

    setConversations(
      Array.from(convMap.values()).sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
      )
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, refreshConversations: fetchConversations };
}

export function useChat(otherUserId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: msgs }, { data: profile }] = await Promise.all([
      supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true }),
      supabase.from("profiles").select("*").eq("id", otherUserId).single(),
    ]);

    setOtherProfile(profile);

    if (msgs && profile) {
      const myProfile = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const profileMap = new Map<string, Profile>();
      profileMap.set(otherUserId, profile);
      if (myProfile.data) profileMap.set(user.id, myProfile.data);

      setMessages(
        msgs.map((m) => ({
          ...m,
          sender: profileMap.get(m.sender_id)!,
        }))
      );
    }

    // Mark unread messages as read
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("sender_id", otherUserId)
      .eq("receiver_id", user.id)
      .eq("is_read", false);

    setLoading(false);
  }, [user, otherUserId]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`messages:${otherUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${otherUserId}`,
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, otherUserId]);

  const sendMessage = async (content: string, relatedFastId?: string) => {
    if (!user) return;
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      content,
      related_fast_id: relatedFastId || null,
    });
    if (error) throw error;
    await fetchMessages();
  };

  return { messages, otherProfile, loading, sendMessage, refreshMessages: fetchMessages };
}
