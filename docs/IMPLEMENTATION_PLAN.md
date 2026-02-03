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

### 7.1 Dashboard Search
- [x] JQLSearch component
- [x] /search page with results table
- [x] Test: Complex JQL queries ✅

### 7.2 Dashboard Filters
- [x] Project dropdown (default: PAYDAES)
- [x] WorkloadBarChart accepts projectId
- [x] ActivityStream accepts projectId
- [x] Test: Filter changes update charts ✅

### 7.3 Project Detail
- [x] Current Sprint display
- [x] StatusPieChart with click-to-filter
- [x] MemberTaskTable for filtered tasks
- [x] Test: Pie slice click filters list ✅

### 7.4 Resources & Member Report
- [x] API users with increased maxResults
- [x] Full email display
- [x] JQL filter by accountId
- [x] Test: Member report shows actual tasks ✅

## Phase 8: Code Audit & Bug Fixes ✅

### 8.1 Bugs Fixed (Round 1 - Static Analysis)
| Bug | File | Fix |
|-----|------|-----|
| MemberTaskTable stale state - table didn't update when parent filtered tasks | `components/tables/MemberTaskTable.tsx` | Added `useEffect` to sync internal state when `initialTasks` prop changes |
| ActivityStream broken link - linked to non-existent route `/projects/issue/` | `components/ActivityStream.tsx` | Removed broken Link, display issue key as text |
| Dashboard Weekly Hours always 0 | `app/page.tsx` | Now fetches from `/api/worklogs` for last 7 days and calculates total hours |
| Dashboard JQL duplicate "Done" in `not in (Done, Done)` | `app/page.tsx` | Fixed to `statusCategory != Done` |
| Header search non-functional | `components/layout/Header.tsx` | Added form submit handler that navigates to `/search?query=...` |
| Project Detail sprint hardcoded "Sprint 1" | `app/projects/[id]/page.tsx` | Now extracts active sprint name from issue `sprint` field |
| Project Detail Total Hours always "--" | `app/projects/[id]/page.tsx` | Now fetches worklogs for project (last 30 days) and calculates total |
| Dark mode error styling broken | `app/page.tsx`, `app/search/page.tsx` | Added `dark:` variants for error message backgrounds and text colors |

### 8.2 Bugs Fixed (Round 2 - Runtime Testing)
| Bug | File | Fix |
|-----|------|-----|
| `maxResults: 0` rejected by new `/search/jql` API (min is 1) | `lib/jira.ts`, `app/api/issues/count/route.ts` | Added `countJira()` function + new `/api/issues/count` endpoint; enforced `Math.max(maxResults, 1)` |
| Dashboard stat cards showed 0 (no `total` in new API response) | `app/page.tsx` | Switched to new `/api/issues/count` endpoint |
| ActivityStream unbounded JQL failed on `/search/jql` endpoint | `components/ActivityStream.tsx` | Changed to `updated >= -7d ORDER BY updated DESC` |
| `jira.getAssignableUsers` not a function (jira-client library) | `app/api/users/route.ts` | Rewrote to use Jira REST API directly (`/rest/api/3/user/assignable/search`) |
| Member report returned 0 results (resolutiondate always null) | `app/api/reports/member/route.ts` | Changed JQL from `resolved >=` to `updated >=`; punctuality fallback to `updated` when `resolutiondate` is null |

### 8.3 Bugs Fixed (Round 3 - Member Report Deep Debug)
| Bug | File | Fix |
|-----|------|-----|
| **URL-encoded accountId breaks JQL** - `params.userId` contains `%3A` instead of `:`, causing `assignee = "712020%3A..."` to return 0 results | `app/resources/[userId]/page.tsx` | Added `decodeURIComponent(rawUserId)` to decode the URL parameter before use in JQL and API calls |
| **Task list limited to 50** - `maxResults: 50` truncated member task list | `lib/jira.ts`, `app/api/issues/route.ts` | Added `searchAllJira()` function with auto-pagination; issues API supports `fetchAll: true` param |
| **Missing Total Hours Logged** - No stat card for member's total logged hours | `app/resources/[userId]/page.tsx` | Added "Total Hours Logged" stat card calculated from `timespent` across all tasks |
| **No Logged hours column** - MemberTaskTable didn't show time logged per task | `components/tables/MemberTaskTable.tsx` | Added optional "Logged" column with `showTimeSpent` prop, sortable |
| **Member report KPIs limited to 100** - `searchJira` maxResults capped metrics | `app/api/reports/member/route.ts` | Switched to `searchAllJira()` for complete KPI calculation |
| **Status badges broken in dark mode** - Hard-coded light-only colors | `components/tables/MemberTaskTable.tsx` | Added `dark:` variants for all status badge colors |

---

## API Endpoints Status

| Endpoint | Method | Description | Tested | Status |
|----------|--------|-------------|--------|--------|
| `/api/projects` | GET | List all projects | ✅ 3 projects | ✅ |
| `/api/issues` | POST | Search issues via JQL | ✅ returns issues | ✅ |
| `/api/issues/count` | POST | Count issues by JQL | ✅ 285 open, 51 bugs | ✅ |
| `/api/worklogs` | POST | Get worklogs by date range | ✅ 27 worklogs | ✅ |
| `/api/users` | GET | Get users (optional project filter) | ✅ 20 users (TVT) | ✅ |
| `/api/reports/member` | GET | Member metrics (userId required) | ✅ 100 completed | ✅ |
| `/api/settings/status` | GET | Jira connection status | ✅ connected | ✅ |

## Pages Status

| Page | Route | HTTP | Status |
|------|-------|------|--------|
| Dashboard | `/` | 200 | ✅ |
| Projects | `/projects` | 200 | ✅ |
| Project Detail | `/projects/[id]` | 200 | ✅ |
| Resources | `/resources` | 200 | ✅ |
| Member Report | `/resources/[userId]` | 200 | ✅ |
| Search | `/search` | 200 | ✅ |
| Settings | `/settings` | 200 | ✅ |

## Test Plan & Results

### Build Test
- [x] `npm run build` - Compiles successfully, 0 TypeScript errors, 15 routes

### API Test Results (Live Jira)

| Test | Endpoint | Result |
|------|----------|--------|
| Connection status | GET /api/settings/status | ✅ connected=true |
| List projects | GET /api/projects | ✅ 3 projects (TVT, DAF, FRCMS) |
| Search issues (JQL) | POST /api/issues | ✅ Returns issues with all fields |
| Count open issues | POST /api/issues/count | ✅ 285 open issues |
| Count critical bugs | POST /api/issues/count | ✅ 51 critical bugs |
| Users by project | GET /api/users?project=TVT | ✅ 20 Atlassian users |
| Worklogs (30d) | POST /api/worklogs | ✅ 27 worklogs returned |
| Member report | GET /api/reports/member | ✅ 100 completed tasks, metrics calculated |

### Feature Tests

#### T1: Dashboard Overview (`/`)
- [x] StatCards display: Active Projects, Open Issues, Critical Bugs, Weekly Hours
- [x] Weekly Hours fetches actual worklog data (last 7 days)
- [x] Open Issues/Critical Bugs use `/api/issues/count` endpoint
- [x] Project filter dropdown loads projects, defaults to PAYDAES if found
- [x] WorkloadBarChart updates when project filter changes
- [x] ActivityStream updates when project filter changes (bounded JQL)
- [x] JQL Search navigates to `/search` with query
- [x] Error message displays correctly in both light and dark mode

#### T2: Projects List (`/projects`)
- [x] Loads and displays all projects from Jira
- [x] Project cards show avatar, name, key
- [x] "View Details" links to `/projects/[id]`
- [x] Loading skeleton displayed while fetching

#### T3: Project Detail (`/projects/[id]`)
- [x] Finds project by ID or key
- [x] Shows project name and key
- [x] Current Sprint extracted from issue sprint field
- [x] StatCards: Sprint, Total Issues, Bugs, Total Hours (calculated from worklogs)
- [x] WorkloadBarChart shows member workload for this project
- [x] StatusPieChart shows status distribution
- [x] Clicking pie slice filters MemberTaskTable (toggle on/off)
- [x] MemberTaskTable updates correctly when filter changes (stale state bug fixed)
- [x] Clear Filter button resets view

#### T4: Resources (`/resources`)
- [x] Project filter dropdown loads all projects
- [x] Users fetched via REST API (assignable/search) - no more jira-client errors
- [x] Table shows Avatar, Name, Email
- [x] "View Report" links to `/resources/[userId]` with name and project params
- [x] Bots filtered out (accountType = atlassian only)
- [x] Users deduplicated by accountId

#### T5: Member Report (`/resources/[userId]`)
- [x] accountId with colon decoded correctly via `decodeURIComponent` (was causing 0 results)
- [x] KPIs: Total Hours Logged, Avg Time/Task, Bug Fix Time, Punctuality, Tasks Completed
- [x] Total Hours Logged calculated from `timespent` across all assigned tasks
- [x] Metrics calculated from completed tasks (uses `updated >=` instead of `resolved >=`)
- [x] Punctuality falls back to `updated` date when `resolutiondate` is null
- [x] All tasks fetched via pagination (`fetchAll: true`), not limited to 50
- [x] MemberTaskTable shows assigned tasks with "Logged" hours column (sortable)
- [x] Project filter passed from resources page works
- [x] Back button navigates to resources
- [x] Member with 0 logged hours shows tasks correctly (nam.doan: 14 tasks, 0.0h)
- [x] Member with many tasks shows all tasks (Quynh Vu: 139 tasks, 227.2h)

#### T6: Search (`/search`)
- [x] JQL query from URL parameter executed
- [x] Results displayed in MemberTaskTable
- [x] New search from search page updates URL and results
- [x] Error messages display correctly in dark mode
- [x] Empty query shows no results gracefully

#### T7: Settings (`/settings`)
- [x] Jira connection status check (green/red indicator)
- [x] Displays host, email, masked token
- [x] Refresh button re-checks connection
- [x] Theme toggle: Light, Dark, System buttons work
- [x] Active theme highlighted

#### T8: Header & Sidebar
- [x] Sidebar navigation: Dashboard, Projects, Resources, Settings
- [x] Active route highlighted in sidebar
- [x] Header search bar functional - submits JQL to `/search` page
- [x] Theme toggle dropdown in header works

#### T9: Components
- [x] MemberTaskTable: Sortable by ID, Type, Priority, Epic
- [x] MemberTaskTable: Syncs with parent prop changes (useEffect fix)
- [x] StatusPieChart: Interactive slices with click callback
- [x] WorkloadBarChart: Aggregates worklogs by author, shows top 10
- [x] JQLSearch: Form submission, loading state, initial query support
- [x] ActivityStream: Shows recent 6 updated issues (bounded JQL)
- [x] BurndownChart: Component ready (line chart with ideal vs remaining)
- [x] EfficiencyRadarChart: Component ready (radar chart)

---

## Quick Commands
```bash
npm run dev     # Start development server
npm run build   # Production build
npm run lint    # Run ESLint
```

## Troubleshooting

### API 410 Error (Deprecated)
- **Issue:** `/rest/api/3/search` removed
- **Fix:** Use `/rest/api/3/search/jql` endpoint (POST, cursor-based pagination with `nextPageToken`)
- **Note:** New API does NOT return `total` field. Use `/api/issues/count` for counting.

### maxResults must be >= 1
- **Issue:** New `/search/jql` rejects `maxResults: 0`
- **Fix:** Use `/api/issues/count` endpoint for counting, or `Math.max(maxResults, 1)`

### No data displayed
1. Check .env.local credentials
2. Verify JIRA_HOST format: `https://domain.atlassian.net`
3. Check browser console for API errors

### Member report empty
1. Uses `updated >=` instead of `resolved >=` (resolutiondate may be null)
2. Verify accountId format in JQL
3. Check if user has completed tasks in date range

---

## Phase 9: Jira Links, User Validation & Performance Charts

### 9.1 Clickable Jira Links
| Task | File | Status |
|------|------|--------|
| New API endpoint `/api/settings/jira-host` returns JIRA_HOST | `app/api/settings/jira-host/route.ts` | ✅ |
| MemberTaskTable: `jiraHost` prop, task key as external link | `components/tables/MemberTaskTable.tsx` | ✅ |
| Wire up jiraHost in Member Report page | `app/resources/[userId]/page.tsx` | ✅ |
| Wire up jiraHost in Project Detail page | `app/projects/[id]/page.tsx` | ✅ |
| Wire up jiraHost in Search page | `app/search/page.tsx` | ✅ |

### 9.2 User Validation Script
| Task | File | Status |
|------|------|--------|
| Validation script: fetch all users, check tasks/hours | `scripts/validate-users.ts` | ✅ |

### 9.3 Performance Charts per User
| Task | File | Status |
|------|------|--------|
| Enhanced `/api/reports/member` with weeklyCompletions, weeklyHours, radarData | `app/api/reports/member/route.ts` | ✅ |
| CompletionBarChart: weekly task completions bar chart | `components/charts/CompletionBarChart.tsx` | ✅ |
| HoursTimelineChart: weekly hours area chart | `components/charts/HoursTimelineChart.tsx` | ✅ |
| Wire up 3 charts (Completion, Hours, Radar) on Member Report page | `app/resources/[userId]/page.tsx` | ✅ |

### 9.4 Documentation Updates
| Task | File | Status |
|------|------|--------|
| Updated CLAUDE.md with new features | `CLAUDE.md` | ✅ |
| Updated IMPLEMENTATION_PLAN.md with Phase 9 | `IMPLEMENTATION_PLAN.md` | ✅ |

---

## Phase 10: Advanced Employee Performance Metrics Refinement ⏳

### 10.1 Backend: Advanced Metrics Calculation
- [x] **Calculate Team Averages for Radar Chart**
    - [x] Update `/api/reports/member/route.ts` to fetch **all** team issues (or cache team stats) to calculate baseline averages for Punctuality, Speed, Volume, BugFixRate.
    - [x] Return `teamMetrics` in API response.
- [x] **Refine "Speed" Metric (Cycle Time)**
    - [x] Use `ResolutionDate - InProgressDate` (Cycle Time) instead of just `timespent`.
    - [x] Need to fetch `changelog` or `history` for issues to find "In Progress" transition time (or approximate using `timetracking` if reliable). *Fallback: Use Time Spent / Story Points if Cycle Time unavailable.*
- [x] **Refine "Consistency" Metric**
    - [x] Implement Standard Deviation of weekly volume/hours to calculate consistency score (100 - coeff_of_variation).
- [x] **Refine "Punctuality" Metric**
    - [x] Ensure `ResolutionDate <= DueDate` logic handles timezones correctly.

### 10.2 Frontend: Deep Analysis UI
- [x] **Enhanced EfficiencyRadarChart**
    - [x] Update component to accept and display 2 data series: "Member" vs "Team Average".
    - [x] Add legend and distinct colors (e.g., Member = Teal, Team = Gray/Outline).
- [x] **Metric Explanations (Tooltips)**
    - [x] Add Info Icon + Tooltips to Stat Cards and Radar Chart to explain how metrics are calculated (e.g., "Speed = Avg Cycle Time").
- [x] **Detailed Work Log Table**
    - [x] Ensure "Logged Hours" column is sortable (already done, verify).
    - [x] Add "Visual Progress" bar (Time Spent vs Estimate) in the table if `timeoriginalestimate` exists.

### 10.3 Verification Plan
- [x] **Manual Verification**
    - [x] Compare "Punctuality" % on Dashboard with manual count of tasks in Table.
    - [x] Verify Radar Chart "Team Avg" looks reasonable (not all 0 or 100).
    - [x] Verify "Consistency" score drops for users with irregular logs (e.g., 0 hours one week, 40 next).

---

## Phase 11: Accurate Metrics via Dual-Query Logic ⏳

### 11.1 Backend: Accurate Hours Calculation
- [ ] **Dual-Query Implementation** in `app/api/reports/member/route.ts`:
    - [ ] **Query A (Worklog)**: Search issues where `worklogAuthor = user` AND `worklogDate` in range.
    - [ ] **Query B (Delivery)**: Search issues where `assignee = user` AND `status = Done` in range.
- [ ] **Data Processing**:
    - [ ] Filter `worklog.worklogs` array to count ONLY entries by the target user within the date range.
    - [ ] Use `Query A` results for: Total Hours, Hours per Week, Consistency.
    - [ ] Use `Query B` results for: Tasks Completed, Punctuality, Cycle Time.

### 11.2 Precision Verification
- [x] **Test Case**: User A logs 2h on Task X (assigned to User B).
    - [x] Verify User A report shows +2h.
    - [x] Verify User B report does NOT show +2h (unless they also logged time).
- [x] **Test Case**: User A logs work in previous month vs current month.
    - [x] Verify date filtering respects the `started` date of worklog, not just issue update date.

---

## Phase 12: Worklog Transparency & Education ⏳

### 12.1 Backend: Detailed Worklog Return
- [x] **Modify `app/api/reports/member/route.ts`**:
    - [x] Return `detailedWorklogs` array extracted from Query A.
    - [x] Structure: `{ date, issueKey, issueSummary, hours, comment }`.
    - [x] Sort by date descending.

### 12.2 Frontend: Worklog History Table
- [x] **Create `WorklogHistoryTable` component**:
    - [x] Columns: Date, Task, Hours, Note.
    - [x] Pagination or Scrollable list.
- [x] **Update Member Report Page**:
    - [x] Add "Worklog History" tab or section below charts.
    - [x] Display the table.

### 12.3 Frontend: Metric Education
- [x] **Add Formulas**:
    - [x] Display explicit formulas below each Stat Card or in a "Methodology" footer.
    - [x] Example: "Avg Time = Total Hours / Completed Tasks".

---

## Phase 13: Pivot to Worklog-Centric Performance ⏳

### 13.1 Backend: Unify Metrics Source
- [ ] **Refactor `app/api/reports/member/route.ts`**:
    - [ ] Remove Query B (Delivery Data / Assignee search).
    - [ ] Update `searchAllJira` for Query A (Worklog) to include fields: `status`, `duedate`, `resolutiondate`, `issuetype`, `priority`, `timeoriginalestimate`, `timespent`.
    - [ ] Calculate "Delivery Metrics" (Completed, Punctuality) based on the **Worklog Issues** list.
        - [ ] **Tasks Completed**: Count of unique worklog issues where `status = Done`.
        - [ ] **Punctuality**: Check `ResolutionDate <= DueDate` for those done issues.
        - [ ] **Radar Data**: Calculate Volume, Speed, etc. from worklog issues.

### 13.2 Frontend: Participated Tasks
- [x] **Update `app/resources/[userId]/page.tsx`**:
    - [x] Change JQL for Task List to `worklogAuthor = user`.
    - [x] Display "My Logged Hours" vs "Total Task Hours" if possible (requires extra processing or just show My Logged Hours).
    - [x] Update tooltips to explain "Based on tasks you logged work on".

---

## Phase 14: Docker & Deployment 📦

### 14.1 Docker Configuration
- [x] **Verify `Dockerfile`**:
    - [x] Ensure `node:20-alpine` (or LTS).
    - [x] Check `output: standalone` support.
    - [x] Confirm `.env.local` handling (via docker-compose or build args).
- [x] **Verify `docker-compose.yml`**:
    - [x] Services defined correctly.
    - [x] Ports mapped (3000:3000).
    - [x] Env file included.

### 14.2 Build & Package
- [x] **Rebuild Image**:
    - [x] Run `docker-compose build --no-cache` to ensure clean build with latest code.
    - [x] Verify image creation.
- [ ] **Run Container**:
    - [ ] Run `docker-compose up -d`.
    - [ ] Verify application health check.



