import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface CommunityPost {
  id: string;
  nickname: string;
  content: string;
  hours_into_fast: number | null;
  fast_target_hours: number | null;
  created_at: string;
  reply_count?: number;
}

export interface CommunityReply {
  id: string;
  post_id: string;
  nickname: string;
  content: string;
  hours_into_fast: number | null;
  created_at: string;
}

export function useCommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (err) throw err;

      if (data) {
        const postIds = data.map((p) => p.id);
        const { data: replies } = await supabase
          .from("community_replies")
          .select("post_id")
          .in("post_id", postIds);

        const countMap = new Map<string, number>();
        replies?.forEach((r) => {
          countMap.set(r.post_id, (countMap.get(r.post_id) ?? 0) + 1);
        });

        setPosts(
          data.map((p) => ({ ...p, reply_count: countMap.get(p.id) ?? 0 }))
        );
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to load community feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel("community_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_posts" },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  const createPost = async (
    nickname: string,
    content: string,
    hoursIntoFast?: number,
    fastTargetHours?: number
  ) => {
    const { error } = await supabase.from("community_posts").insert({
      nickname,
      content,
      hours_into_fast: hoursIntoFast ?? null,
      fast_target_hours: fastTargetHours ?? null,
    });
    if (error) throw error;
    await fetchPosts();
  };

  return { posts, loading, error, createPost, refreshPosts: fetchPosts };
}

export function usePostReplies(postId: string) {
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReplies = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("community_replies")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    setReplies(data ?? []);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchReplies();

    const channel = supabase
      .channel(`replies_${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_replies",
          filter: `post_id=eq.${postId}`,
        },
        () => fetchReplies()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReplies, postId]);

  const addReply = async (
    nickname: string,
    content: string,
    hoursIntoFast?: number
  ) => {
    const { error } = await supabase.from("community_replies").insert({
      post_id: postId,
      nickname,
      content,
      hours_into_fast: hoursIntoFast ?? null,
    });
    if (error) throw error;
    await fetchReplies();
  };

  return { replies, loading, addReply, refreshReplies: fetchReplies };
}
