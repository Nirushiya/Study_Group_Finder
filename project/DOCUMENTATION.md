# StudyGroup — Web Application Documentation

## Overview

**StudyGroup** is a university study group finder web application built for the AI Web Application Challenge. It helps students discover, create, join, and manage study groups for their courses. The app was built within a 60-minute time constraint using AI-assisted development (Bolt + Claude Code).

**Tagline:** *Find your people. Ace your courses.*

---

## Problem & Intended Users

**Problem:** University students often struggle to find study partners or form study groups for specific courses. There's no centralized, easy-to-use platform to connect students who are taking the same classes.

**Intended Users:** University/college students who want to:
- Find existing study groups for their courses
- Create new study groups and invite classmates
- See who's in a group and where/when it meets
- Manage groups they've created or joined

---

## Essential User Journey

1. **Sign up / Sign in** — A new student creates an account with email and password (no email confirmation required).
2. **Discover groups** — The student browses available study groups on the Discover page, using the search bar to filter by course code, course name, or keyword.
3. **Join a group** — The student clicks a group card to view its details (description, location, meeting time, member list), then clicks "Join Group."
4. **Create a group** — The student clicks "Create Group," fills out a form (title, course code, course name, description, location, meeting time, max members), and the group appears on the Discover page.
5. **Manage groups** — The student visits "My Groups" to see groups they organize and groups they've joined. They can leave joined groups, or edit/delete groups they created.

---

## Features

### Authentication
- Email/password sign-up and sign-in powered by Supabase Auth
- Session persistence (stays logged in across page reloads)
- No email confirmation required — instant access
- Sign out button in the navigation bar
- Error handling for duplicate accounts, invalid credentials, and network issues

### Discover Page (Browse Groups)
- Grid layout of all study groups, sorted newest first
- Live search bar that filters by course code, course name, title, or description
- Each group card displays:
  - Course code badge
  - Group title and course name
  - Description (truncated to 2 lines)
  - Meeting location and time
  - Member count vs. max capacity (shows "full" in orange when at capacity)
  - "Joined" badge if the current user is a member
  - "You created this group" label if the user is the organizer
- Empty state with helpful message when no groups match the search
- "Create Group" button at the top

### Create Group Modal
- Pop-up modal form with the following fields:
  - Group Title (required)
  - Course Code (required)
  - Max Members (default 10, range 2–100)
  - Course Name (required)
  - Description (optional)
  - Location (optional)
  - Meeting Time (optional)
- Validation and error display
- On success, the user is navigated directly to the new group's detail page

### Group Detail Page
- Full group information: title, course code, course name, description, location, meeting time, member count
- Member list showing each member's email, first-letter avatar, join date, and "Organizer" badge for the creator
- "You are the organizer" message for creators
- **Join Group** button (shown when the user is not a member and the group isn't full)
- **Leave Group** button (shown when the user is a member but not the creator)
- **Edit** and **Delete** buttons (shown only to the group creator)
- "This group is full" message when capacity is reached
- Edit mode: inline form to update all group fields without leaving the page
- Back button to return to the Discover page

### My Groups Page
- Two sections:
  - **Organizing** — groups the user created
  - **Joined** — groups the user has joined (excluding ones they created)
- Each group row shows a course-code avatar, title, course info, member count, location, and meeting time
- Leave button on joined groups
- Empty state with guidance to browse or create groups

### Navigation
- Sticky header with frosted-glass backdrop blur
- Logo (graduation cap icon) that returns to the Discover page
- Two nav tabs: "Discover" and "My Groups"
- Sign Out button
- Responsive: nav labels hidden on mobile, icons remain

### Design & UX
- Blue-to-emerald gradient brand color scheme (no purple)
- Rounded corners (xl/2xl), subtle shadows, and hover lift effects
- Loading spinners during all async operations
- Responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop
- Consistent 8px spacing system
- Lucide React icons throughout
- Smooth color transitions and micro-interactions on cards and buttons

---

## Technical Architecture

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS 3
- **Icons:** Lucide React
- **Backend:** Supabase (PostgreSQL database, Auth, RLS)
- **No additional npm packages** — uses only the starter dependencies

### Database Schema

#### Table: `study_groups`
| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Auto-generated primary key |
| `title` | text | Name of the study group |
| `course_code` | text | e.g. "CS101" |
| `course_name` | text | e.g. "Intro to Computer Science" |
| `description` | text | What the group studies |
| `location` | text | Meeting location |
| `meeting_time` | text | When the group meets |
| `max_members` | int (default 10) | Capacity cap |
| `creator_id` | uuid (FK → auth.users) | Group creator, defaults to `auth.uid()` |
| `created_at` | timestamptz | Creation timestamp |

#### Table: `memberships`
| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Auto-generated primary key |
| `group_id` | uuid (FK → study_groups) | Which group the membership is for |
| `user_id` | uuid (FK → auth.users) | Which student joined |
| `joined_at` | timestamptz | When they joined |
| | | UNIQUE(group_id, user_id) — one membership per group per student |

#### Table: `profiles`
| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK, FK → auth.users) | User ID |
| `email` | text | User's email (auto-populated on signup) |
| `created_at` | timestamptz | Creation timestamp |

A database trigger (`on_auth_user_created`) automatically inserts a row into `profiles` whenever a new user signs up, capturing their email so it can be displayed in group member lists.

### Row Level Security (RLS)

All three tables have RLS enabled. Policies:

- **study_groups:**
  - SELECT: any authenticated user can browse all groups
  - INSERT: any authenticated user can create a group (must be the creator)
  - UPDATE: only the group's creator can edit
  - DELETE: only the group's creator can delete

- **memberships:**
  - SELECT: any authenticated user can see all memberships
  - INSERT: a student can only add themselves
  - DELETE: a student can only remove themselves (leave a group)

- **profiles:**
  - SELECT: any authenticated user can read all profiles
  - UPDATE: a user can only update their own profile

### File Structure

```
src/
├── App.tsx                    — Main app shell, navigation, view routing
├── main.tsx                   — React entry point
├── index.css                  — Tailwind directives
├── lib/
│   ├── supabase.ts            — Supabase client singleton + TypeScript types
│   └── auth.tsx               — Auth context provider + useAuth hook
├── components/
│   ├── AuthScreen.tsx         — Sign in / sign up screen
│   ├── BrowseGroups.tsx       — Discover page with search and group grid
│   ├── GroupCard.tsx           — Individual group card for the grid
│   ├── CreateGroupModal.tsx   — Modal form to create a new group
│   ├── GroupDetail.tsx        — Group detail page with members, join/leave, edit
│   └── MyGroups.tsx           — Dashboard for organized + joined groups
supabase/
└── migrations/
    ├── 20260904052631_create_study_groups.sql
    └── 20260904052814_create_profiles.sql
```

---

## AI Tools & Prompts Used

### Tool: Bolt (bolt.new)
**Prompt 1 (Initial build):**
> Build a Study Group Finder app for university students — they can create study groups for courses, browse available groups, and join them.

This single prompt generated the initial project scaffold, database schema, and all core components.

**Prompt 2 (Documentation request):**
> Give all the content about this web app to create a document including features of prompt

This prompt requested the generation of this documentation file.

### Development Approach
- The entire application was built using Bolt's AI-assisted development with Claude Code as the underlying model
- The AI designed the database schema, wrote the RLS policies, created all React components, and wired up navigation
- The build was verified with `npm run build` to confirm the project compiles without errors

---

## How to Run

The development server starts automatically. No manual `npm run dev` is needed.

To build for production:
```bash
npm run build
```

To type-check:
```bash
npm run typecheck
```

---

## Build Status

The project builds successfully with no errors. The production bundle is approximately 305 KB (87 KB gzipped).

---

## Future Enhancements (Not Implemented)

Potential features that could be added:
- Student profiles with name, bio, and avatar upload
- Course/subject tags for easier filtering
- Dashboard with stats (total groups, total members, etc.)
- Sorting options on the Discover page (newest, most members, etc.)
- Real-time updates via Supabase subscriptions
- In-app messaging or comment threads within groups
- Calendar integration for meeting reminders
