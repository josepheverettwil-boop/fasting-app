export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Fast {
  id: string;
  user_id: string;
  started_at: string;
  target_hours: number;
  ended_at: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface MoodEntry {
  id: string;
  fast_id: string;
  user_id: string;
  mood_score: 1 | 2 | 3 | 4 | 5;
  note: string | null;
  hours_into_fast: number;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  related_fast_id: string | null;
  created_at: string;
}

export interface GroupFast {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  target_hours: number;
  scheduled_start: string;
  created_at: string;
}

export interface GroupFastMember {
  id: string;
  group_fast_id: string;
  user_id: string;
  joined_at: string;
  fast_id: string | null;
}

export interface FriendWithProfile extends Friendship {
  profile: Profile;
  active_fast?: Fast | null;
}

export interface MessageWithSender extends Message {
  sender: Profile;
}

export interface GroupFastWithMembers extends GroupFast {
  creator: Profile;
  members: (GroupFastMember & { profile: Profile })[];
}
