# Implementation Plan - Jira Dashboard

## Phase 1-5: Core Setup ✅
| Task | Status |
|------|--------|
| Next.js 14+ (App Router, TypeScript) | ✅ |
| Dependencies: jira-client, recharts, shadcn/ui, lucide-react | ✅ |
| .env.local for Jira credentials | ✅ |
| Dark/Light mode (next-themes) | ✅ |
| API Routes: projects, issues, worklogs, users, reports/member | ✅ |
| Components: Sidebar, StatCard, Charts, JQLSearch | ✅ |
| Pages: Dashboard, Projects, Resources, Settings | ✅ |

## Phase 6: Refinements ✅
| Task | Status |
|------|--------|
| Project avatars in list | ✅ |
| Resource filtering by project | ✅ |
| MemberTaskTable with sorting | ✅ |
| Settings page with connection status | ✅ |

## Phase 7: Bug Fixes ✅
- [x] 7.1 Dashboard Search (JQLSearch, Results Table)
- [x] 7.2 Dashboard Filters (Project Dropdown, Chart Updates)
- [x] 7.3 Project Detail (Sprint, Status Pie, Member Table)
- [x] 7.4 Resources & Member Report (API users, Email display, Member KPi)

## Phase 8-14: Completed Metrics & Features ✅
*(Detailed bugs and refinements from previous phases are archived in git history)*

---

## Phase 15: Auth & Role-Based Access Control (RBAC) ⏳
**Goal**: Replace manual token entry with Jira OAuth 2.0 and implement secure, role-based role views.

### 15.1 Dependencies & Setup
- [ ] Install `next-auth` and `framer-motion`.
- [ ] Configure `JIRA_CLIENT_ID`, `JIRA_CLIENT_SECRET`, `NEXTAUTH_SECRET` in `.env.local`.
- [x] **Initialize Authentication**
    - [x] Install `next-auth`.
    - [x] Configure Atlassian Provider in `app/api/auth/[...nextauth]/route.ts`.
    - [x] Update `lib/jira.ts` to support OAuth tokens (Bearer Auth).
    - [x] Wrap app with SessionProvider.

- [x] **Implement RBAC Logic**
    - [x] Create `lib/rbac.ts` (or extend `jira.ts`) to fetch user permissions.
    - [x] Define roles: `ADMIN` (access all), `USER` (access own data).
    - [x] Initial check on Frontend to store/determine role.

- [x] **Secure API Routes**
    - [x] Update `/api/projects`, `/api/issues`, `/api/worklogs` to use `getServerSession` access token.
    - [x] Update Report APIs to use session token.

- [x] **Frontend Role-Based Rendering**
    - [x] Update `Header` with Login/Logout.
    - [x] Update `Dashboard`:
        - [x] Admin: Show Full Dashboard.
        - [x] User: Show `Member Report` (My Stats) only.
    - [x] Create `LoadingAnimation` component.

### 15.3 Role-Based Access Control (RBAC) Logic
- [ ] **Role Fetching**:
    - [ ] Implement `fetchUserRoles(projectId)` using Jira API `/rest/api/3/project/{projectId}/role`.
- [ ] **View Permissions**:
    - [ ] **Admin/Team Lead**: Full access (Team Charts, All Member Reports).
    - [ ] **Member**: Restricted access (Redirect to `/resources/me` or hide Team Stats).

---

## Phase 16: Advanced Reporting & UX ⏳
**Goal**: Granular reporting for Members vs Admins, and improved visual feedback.

### 16.1 User View (Self-Tracking)
- [ ] **Time Filtering**:
    - [ ] Add Filter Component: Day / Week / Month selector.
    - [ ] Wire up charts/tables to respect this filter.
- [ ] **My Worklogs**:
    - [ ] Display list of tasks logged by current user.
    - [ ] Show specific columns: Date, Hours, Comment (Description).
- [ ] **My Performance**:
    - [ ] Show personal charts (Efficiency Radar, Weekly Hours) restricted to own data.

### 16.2 Admin View (Team Management)
- [ ] **Member Inspection**:
    - [ ] View any user's report (existing `/resources/[userId]`).
    - [ ] **Worklog Highlighting**: In MemberTaskTable, highlight "Logged Hours" and "Comments" for easier review.
- [ ] **Team Analytics**:
    - [ ] Dashboard charts (Workload, Activity) remain visible.
    - [ ] Ability to compare metrics (e.g., Radar Chart overlay: Member vs Team Avg).

### 16.3 UX Improvements
- [ ] **Loading Animation**:
    - [ ] Create `components/ui/loading-animation.tsx` using `framer-motion` (e.g., spinning logo or skeleton pulse).
    - [ ] Replace default `loading.tsx` with new component.

---

## Verification Plan

### Automated Tests
- None planned for this phase (heavy reliance on Jira OAuth flow).

### Manual Verification
1.  **Auth Flow**:
    - Login redirects to Atlassian -> Approve -> Back to App.
    - "Login with Jira" button disappears, Avatar appears.
    - Logout clears session.
2.  **Role Testing**:
    - **User Account**: Verify Team Charts are hidden or access denied. Verify can only see own stats.
    - **Admin Account**: Verify full access.
3.  **Data Accuracy**:
    - Compare "My Worklogs" total hours with Jira web interface.
    - Verify Admin sees exactly what the Member sees + Team context.
4.  **UI/UX**:
    - Verify Loading Animation plays smoothly during page transitions.
    - Verify filter (Day/Week/Month) updates charts correctly.
