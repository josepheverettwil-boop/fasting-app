import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { FriendWithProfile, Profile, Fast } from "@/lib/types";

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: friendships } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (!friendships) {
      setLoading(false);
      return;
    }

    const accepted = friendships.filter((f) => f.status === "accepted");
    const pending = friendships.filter(
      (f) => f.status === "pending" && f.addressee_id === user.id
    );

    const friendIds = accepted.map((f) =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    );
    const pendingIds = pending.map((f) => f.requester_id);
    const allIds = [...new Set([...friendIds, ...pendingIds])];

    if (allIds.length === 0) {
      setFriends([]);
      setPendingRequests([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", allIds);

    const { data: activeFasts } = await supabase
      .from("fasts")
      .select("*")
      .in("user_id", friendIds)
      .eq("is_active", true);

    const profileMap = new Map<string, Profile>();
    profiles?.forEach((p) => profileMap.set(p.id, p));

    const fastMap = new Map<string, Fast>();
    activeFasts?.forEach((f) => fastMap.set(f.user_id, f));

    setFriends(
      accepted.map((f) => {
        const friendId =
          f.requester_id === user.id ? f.addressee_id : f.requester_id;
        return {
          ...f,
          profile: profileMap.get(friendId)!,
          active_fast: fastMap.get(friendId) ?? null,
        };
      }).filter((f) => f.profile)
    );

    setPendingRequests(
      pending.map((f) => ({
        ...f,
        profile: profileMap.get(f.requester_id)!,
      })).filter((f) => f.profile)
    );

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendFriendRequest = async (username: string) => {
    if (!user) return;

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (!targetProfile) throw new Error("User not found");
    if (targetProfile.id === user.id) throw new Error("Cannot add yourself");

    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: targetProfile.id,
    });

    if (error) {
      if (error.code === "23505") throw new Error("Request already sent");
      throw error;
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);

    if (error) throw error;
    await fetchFriends();
  };

  const declineRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "declined" })
      .eq("id", friendshipId);

    if (error) throw error;
    await fetchFriends();
  };

  return {
    friends,
    pendingRequests,
    loading,
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    refreshFriends: fetchFriends,
  };
}
