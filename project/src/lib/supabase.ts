import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type StudyGroup = {
  id: string;
  title: string;
  course_code: string;
  course_name: string;
  description: string;
  location: string;
  meeting_time: string;
  max_members: number;
  creator_id: string;
  created_at: string;
};

export type Membership = {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
};

export type GroupWithCount = StudyGroup & {
  member_count: number;
  creator_email: string | null;
};
