import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { GroupFastWithMembers, Profile } from "@/lib/types";

export function useGroupFasts() {
  const { user } = useAuth();
  const [groupFasts, setGroupFasts] = useState<GroupFastWithMembers[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroupFasts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: memberRows } = await supabase
      .from("group_fast_members")
      .select("group_fast_id")
      .eq("user_id", user.id);

    const memberGroupIds = memberRows?.map((r) => r.group_fast_id) ?? [];

    const { data: created } = await supabase
      .from("group_fasts")
      .select("*")
      .eq("creator_id", user.id);

    const createdIds = created?.map((g) => g.id) ?? [];
    const allGroupIds = [...new Set([...memberGroupIds, ...createdIds])];

    if (allGroupIds.length === 0) {
      setGroupFasts([]);
      setLoading(false);
      return;
    }

    const { data: groups } = await supabase
      .from("group_fasts")
      .select("*")
      .in("id", allGroupIds)
      .order("scheduled_start", { ascending: false });

    if (!groups) {
      setLoading(false);
      return;
    }

    const { data: allMembers } = await supabase
      .from("group_fast_members")
      .select("*")
      .in("group_fast_id", allGroupIds);

    const allUserIds = new Set<string>();
    groups.forEach((g) => allUserIds.add(g.creator_id));
    allMembers?.forEach((m) => allUserIds.add(m.user_id));

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", Array.from(allUserIds));

    const profileMap = new Map<string, Profile>();
    profiles?.forEach((p) => profileMap.set(p.id, p));

    setGroupFasts(
      groups.map((g) => ({
        ...g,
        creator: profileMap.get(g.creator_id)!,
        members: (allMembers ?? [])
          .filter((m) => m.group_fast_id === g.id)
          .map((m) => ({ ...m, profile: profileMap.get(m.user_id)! }))
          .filter((m) => m.profile),
      }))
    );

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGroupFasts();
  }, [fetchGroupFasts]);

  const createGroupFast = async (
    title: string,
    description: string,
    targetHours: number,
    scheduledStart: Date
  ) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("group_fasts")
      .insert({
        creator_id: user.id,
        title,
        description,
        target_hours: targetHours,
        scheduled_start: scheduledStart.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-join as member
    await supabase.from("group_fast_members").insert({
      group_fast_id: data.id,
      user_id: user.id,
    });

    await fetchGroupFasts();
    return data;
  };

  const joinGroupFast = async (groupFastId: string) => {
    if (!user) return;

    const { error } = await supabase.from("group_fast_members").insert({
      group_fast_id: groupFastId,
      user_id: user.id,
    });

    if (error) throw error;
    await fetchGroupFasts();
  };

  return {
    groupFasts,
    loading,
    createGroupFast,
    joinGroupFast,
    refreshGroupFasts: fetchGroupFasts,
  };
}
