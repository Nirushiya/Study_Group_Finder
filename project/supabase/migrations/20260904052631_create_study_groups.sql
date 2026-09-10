/*
# Study Group Finder — Schema & Security

## Purpose
A university study group finder where students sign in, create study groups
for courses, browse available groups, and join/leave them.

## New Tables

### study_groups
- `id` (uuid, primary key)
- `title` (text, not null) — name of the study group
- `course_code` (text, not null) — e.g. "CS101"
- `course_name` (text, not null) — e.g. "Intro to Computer Science"
- `description` (text) — what the group is about
- `location` (text) — where the group meets (building, room, or online link)
- `meeting_time` (text) — when the group meets (free-text day/time)
- `max_members` (int, default 10) — capacity cap
- `creator_id` (uuid, not null, default auth.uid()) — the student who created it
- `created_at` (timestamptz, default now())

### memberships
- `id` (uuid, primary key)
- `group_id` (uuid, FK → study_groups.id ON DELETE CASCADE)
- `user_id` (uuid, not null, default auth.uid()) — the joining student
- `joined_at` (timestamptz, default now())
- UNIQUE(group_id, user_id) — a student can only join a group once

## Security
- RLS enabled on both tables.
- study_groups: any authenticated student can browse (SELECT all);
  only the creator can UPDATE or DELETE their own group.
  Any authenticated student can INSERT a new group (becomes creator via default).
- memberships: any authenticated student can see all memberships (SELECT),
  can INSERT their own membership, and can DELETE their own membership (leave).
  Cannot delete others' memberships.
*/

CREATE TABLE IF NOT EXISTS study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  course_code text NOT NULL,
  course_name text NOT NULL,
  description text DEFAULT '',
  location text DEFAULT '',
  meeting_time text DEFAULT '',
  max_members int NOT NULL DEFAULT 10,
  creator_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;

-- study_groups: SELECT — any authenticated student can browse all groups
DROP POLICY IF EXISTS "select_study_groups" ON study_groups;
CREATE POLICY "select_study_groups" ON study_groups FOR SELECT
  TO authenticated USING (true);

-- study_groups: INSERT — any authenticated student can create a group
DROP POLICY IF EXISTS "insert_study_groups" ON study_groups;
CREATE POLICY "insert_study_groups" ON study_groups FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = creator_id);

-- study_groups: UPDATE — only the creator can edit their group
DROP POLICY IF EXISTS "update_study_groups" ON study_groups;
CREATE POLICY "update_study_groups" ON study_groups FOR UPDATE
  TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

-- study_groups: DELETE — only the creator can delete their group
DROP POLICY IF EXISTS "delete_study_groups" ON study_groups;
CREATE POLICY "delete_study_groups" ON study_groups FOR DELETE
  TO authenticated USING (auth.uid() = creator_id);

CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- memberships: SELECT — any authenticated student can see who joined which group
DROP POLICY IF EXISTS "select_memberships" ON memberships;
CREATE POLICY "select_memberships" ON memberships FOR SELECT
  TO authenticated USING (true);

-- memberships: INSERT — a student can only add themselves
DROP POLICY IF EXISTS "insert_memberships" ON memberships;
CREATE POLICY "insert_memberships" ON memberships FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- memberships: DELETE — a student can only remove themselves (leave a group)
DROP POLICY IF EXISTS "delete_memberships" ON memberships;
CREATE POLICY "delete_memberships" ON memberships FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_study_groups_course_code ON study_groups(course_code);
CREATE INDEX IF NOT EXISTS idx_study_groups_creator_id ON study_groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_memberships_group_id ON memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
