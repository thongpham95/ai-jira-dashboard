# Implementation Plan - Jira Dashboard

## Completed Phases ✅

### Phase 1-5: Core Setup
- [x] Next.js 16 (App Router, TypeScript)
- [x] Dependencies: recharts, shadcn/ui, lucide-react, next-auth
- [x] Dark/Light mode (next-themes)
- [x] Multi-language support (vi/en)

### Phase 6-7: API & Components
- [x] API Routes: projects, issues, worklogs, users, reports/member
- [x] Components: Sidebar, Header, StatCard, Charts, Tables
- [x] Pages: Dashboard, Projects, Resources, Settings, Search

### Phase 8-14: Bug Fixes & Refinements
- [x] JQL Search functionality
- [x] Project filtering for charts
- [x] Member Report KPIs & Worklog History
- [x] Resource page improvements

### Phase 15: Authentication & RBAC ✅
- [x] **NextAuth.js + Atlassian OAuth 2.0 (3LO)**
  - [x] `app/api/auth/[...nextauth]/route.ts` - Auth handler
  - [x] `components/auth-provider.tsx` - SessionProvider wrapper
  - [x] Scopes: `read:jira-work`, `read:jira-user`, `read:me`

- [x] **OAuth-only API Client**
  - [x] Removed Basic Auth (JIRA_HOST, JIRA_EMAIL, JIRA_API_TOKEN)
  - [x] `lib/jira.ts` uses Bearer token from session
  - [x] All API routes use `getServerSession` for auth

- [x] **Role-Based Access Control**
  - [x] Check `ADMINISTER_PROJECTS` permission via `/api/auth/permissions`
  - [x] Admin: Full Dashboard (`AdminDashboard` component)
  - [x] User: Member Report only (`MemberReportView` component)

- [x] **UI Updates**
  - [x] Header: Login/Logout buttons
  - [x] Removed "Jira Connection" from Settings
  - [x] Loading animation component

### Phase 16: AI Executive Summary (Google Gemini) ✅
- [x] **AI Service Layer** (`lib/ai.ts`)
  - [x] Google GenAI SDK integration (`@google/genai`)
  - [x] Model support: `gemini-2.5-flash` (default), `gemini-2.5-pro`
  - [x] Prompt engineering for Executive Summary report
  - [x] ThinkingConfig for Pro model (budget: 4096 tokens)
  - [x] maxOutputTokens: 8192 for longer reports
  - [x] Error handling: API key missing, quota exceeded, empty response

- [x] **API Route** (`app/api/ai/summary/route.ts`)
  - [x] Fetch Epics, Critical Bugs, Overdue Tasks, Team Workload from Jira
  - [x] Pass structured data to Gemini for analysis
  - [x] Return Markdown summary + metadata

- [x] **AI Executive Summary Widget** (`components/dashboard/AIExecutiveSummary.tsx`)
  - [x] Model selector, generate button, markdown renderer
  - [x] Error display, collapse/expand, metadata footer
  - [x] Framer Motion animations

- [x] **Dashboard Integration**
  - [x] Admin Dashboard + Project Detail Page

### Phase 17: AI Standup Generator ✅
- [x] **AI Service** (`lib/ai.ts` — `generateStandupReport()`)
  - [x] StandupRequest/StandupWorklog/StandupStatusChange interfaces
  - [x] Prompt generates 3-section standup: Yesterday, Today, Blockers
  - [x] maxOutputTokens: 4096, thinkingBudget: 2048 for Pro

- [x] **API Route** (`app/api/ai/standup/route.ts`)
  - [x] Fetch worklogs from last 24h for specific member
  - [x] Fetch status transitions (changelog) from last 24h
  - [x] Pass worklogs + status changes to Gemini
  - [x] Return standup report + metadata

- [x] **UI Widget** (`components/reports/AIStandupGenerator.tsx`)
  - [x] "Tạo Standup Report" button with sparkle icon
  - [x] Copy-to-clipboard button
  - [x] Markdown renderer with issue key highlighting
  - [x] Loading skeleton, error handling
  - [x] Framer Motion animations
  - [x] Collapse/expand toggle

- [x] **Integration**
  - [x] Placed in MemberReportView between stat cards and charts

### Phase 18: AI JQL Search ✅
- [x] **AI Service** (`lib/ai.ts` — `convertNaturalLanguageToJQL()`)
  - [x] JQLConversionRequest interface
  - [x] Comprehensive JQL reference in prompt (fields, operators, functions)
  - [x] temperature: 0.1 for precise output
  - [x] Auto-cleanup of markdown code blocks from response

- [x] **API Route** (`app/api/ai/jql/route.ts`)
  - [x] Fetch available project keys for context
  - [x] Convert natural language → JQL via Gemini
  - [x] Return JQL string + metadata

- [x] **Header AI Toggle** (`components/layout/Header.tsx`)
  - [x] Sparkle button (✨) next to search input
  - [x] Toggle between JQL mode and AI mode
  - [x] AI mode: primary border, different placeholder text
  - [x] Loading spinner during AI conversion
  - [x] Auto-fallback to raw query on error

- [x] **Search Page Enhancement** (`app/search/page.tsx`)
  - [x] AI context banner when search came from AI mode
  - [x] Shows original natural language query
  - [x] Shows generated JQL query

---

## Current Project Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── [...nextauth]/route.ts   # NextAuth handler
│   │   └── permissions/route.ts     # RBAC permission check
│   ├── ai/
│   │   ├── summary/route.ts         # AI Executive Summary endpoint
│   │   ├── standup/route.ts         # AI Standup Generator endpoint
│   │   └── jql/route.ts             # AI Natural Language → JQL
│   ├── issues/                      # Issue search & count
│   ├── projects/                    # Project list
│   ├── reports/member/              # Member report data
│   ├── users/                       # User list
│   └── worklogs/                    # Worklog data
├── projects/
│   └── [id]/                        # Project detail (+ AI widget)
├── resources/
│   └── [userId]/                    # Member report page (+ Standup)
├── search/                          # JQL search (+ AI banner)
├── settings/                        # Language & Theme
└── page.tsx                         # Home (Dashboard or Member Report)

components/
├── auth-provider.tsx                # SessionProvider wrapper
├── dashboard/
│   ├── AdminDashboard.tsx           # Admin-only dashboard
│   └── AIExecutiveSummary.tsx       # AI summary widget
├── reports/
│   ├── MemberReportView.tsx         # Member report component
│   └── AIStandupGenerator.tsx       # AI standup widget
├── charts/                          # Recharts components
├── layout/
│   ├── Header.tsx                   # Header with AI search toggle
│   └── Sidebar.tsx                  # Navigation sidebar
├── search/
│   └── JQLSearch.tsx                # JQL search input
├── tables/                          # Data tables
└── ui/
    └── loading-animation.tsx        # Loading spinner

lib/
├── ai.ts                            # Gemini AI service layer (Summary, Standup, JQL)
├── jira.ts                          # Jira API (OAuth only)
└── translations.ts                  # i18n translations
```

---

## Environment Variables

```env
# NextAuth (Required)
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Atlassian OAuth 2.0 (Required)
ATLASSIAN_CLIENT_ID=your-client-id
ATLASSIAN_CLIENT_SECRET=your-client-secret

# AI Features (Optional)
GEMINI_API_KEY=your-gemini-api-key
```

---

## Future Phases (Backlog)

### Phase 19: Advanced Reporting ✅
- [x] **Time Filtering** (`components/ui/time-range-selector.tsx`)
  - [x] Reusable TimeRangeSelector component with presets (Today, Yesterday, Week, Month, Quarter, Custom)
  - [x] Date range picker with custom date inputs
  - [x] Integration with AdminDashboard for filtering worklogs
- [x] **Team Comparison Charts** (`components/charts/TeamComparisonChart.tsx`)
  - [x] Bar chart view comparing team members by selected metric
  - [x] Radar chart view for holistic performance comparison
  - [x] Metric selector (Issues Completed, Hours Logged, Cycle Time, Quality Score)
  - [x] Team averages banner
  - [x] API endpoint: `/api/reports/team-comparison`
- [x] **Export Reports** (`components/reports/ExportReports.tsx`)
  - [x] CSV export with UTF-8 BOM for Excel compatibility
  - [x] PDF export via printable HTML generation
  - [x] Print functionality with styled report layout
  - [x] Integrated export button in AdminDashboard

### Phase 20: Performance Optimizations ✅
- [x] **API Response Caching** (`lib/cache.ts`)
  - [x] In-memory cache with TTL support
  - [x] Cache helper function `withCache()` for easy integration
  - [x] Cache key generator for consistent key creation
  - [x] Cache statistics and clear endpoints (`/api/cache`)
  - [x] Applied to projects, users, and team-comparison API routes
- [x] **Pagination Optimization** (`lib/pagination.ts`, `components/ui/pagination.tsx`)
  - [x] Reusable pagination utilities for server and client
  - [x] Pagination component with page size selector
  - [x] Support for large datasets with proper offset/limit calculation
- [x] **SSR Improvements** (`lib/server-fetch.ts`, `components/ui/loading-skeletons.tsx`)
  - [x] Server-side fetch utilities with timeout and caching support
  - [x] Internal API helper for server components
  - [x] Parallel fetch with error handling
  - [x] Comprehensive loading skeleton components
  - [x] Dashboard, chart, table, and list skeleton variants

### Phase 21: AI Enhancements ✅
- [x] **Issue TL;DR** (`lib/ai.ts`, `/api/ai/issue-tldr`)
  - [x] `generateIssueTLDR()` function in AI service layer
  - [x] Summarizes issue description + comments
  - [x] Extracts key discussion points and next steps
  - [x] Handles Atlassian Document Format (ADF) parsing
  - [x] Multi-language support (vi/en)
- [x] **AI-powered Team Insights** (`lib/ai.ts`, `/api/ai/team-insights`)
  - [x] `generateTeamInsights()` function for cross-member analysis
  - [x] Team performance summary with highlights
  - [x] Identifies top performers, improvement areas
  - [x] Workload analysis and recommendations
  - [x] Comparison to team averages

### Phase 22: Team Member Performance Evaluation
- [x] **Data Aggregation Engine** (`lib/jira-performance.ts`)
  - [x] Fetch issue changelogs via Jira API to get status transitions.
  - [x] Implement logic to calculate role-specific metrics based on transition history:
    - Developer Cycle Time: `TODO` -> `IN PROGRESS` -> `CODE REVIEW`.
    - Tech Lead Cycle Time: `CODE REVIEW` -> `DONE CODE REVIEW` -> `MERGED TO QC`.
    - QC Cycle Time: `TASK DONE / BUG FIXED` -> `TVT INTERNAL REVIEW` -> `REOPEN` / `CLOSED`.
    - Quality metrics: First Time Pass Rate, Bug Fix Reopen Rate, Review Effectiveness, Bug Validity Rate.
- [x] **API Endpoint**
  - [x] Add `/api/performance` to serve aggregated performance metrics with caching.
- [x] **UI Implementation (UI/UX Pro Max Standard)**
  - [x] Ensure minimalist & professional design supporting Light/Dark Mode using `ui-ux-pro-max` guidelines.
  - [x] Add Performance Dashboard layout.
  - [x] Add Recharts visualizations for Cycle Times and Throughput.
  - [x] Implement color indicators & animations to **highlight anomalies** (e.g., long code reviews, high reopen rates).
- [x] **AI Performance Review Integration**
  - [x] Add `/api/ai/performance-review` endpoint.
  - [x] Generate natural language performance evaluation text from metrics.
  - [x] Display AI summary on the UI.

### Phase 23: Real-Time Team Member Task Visualization
- [x] **Data Fetching Layer** (`lib/jira.ts` & `app/api/reports/active-tasks/route.ts`)
  - [x] Add JQL query to fetch issues with `statusCategory = "In Progress"` assigned to team members.
  - [x] Format data to group active issues by assignee (Avatar, Name, Issue Key, Status, Time in Status).
- [x] **UI Implementation** (`components/dashboard/RealTimeActiveTasks.tsx`)
  - [x] Build a sleek, modern widget displaying team members and their current active tasks.
  - [x] Add auto-refresh/polling logic (e.g., using SWR or `setInterval`) to keep data fresh.
  - [x] Include micro-animations for task updates (e.g., when a task changes status or assignee).
- [x] **Dashboard Integration**
  - [x] Embed the widget into the main dashboard (e.g., Admin Dashboard) for high visibility.

### Phase 24: Peer Comparison & Enhancements
- [x] **Data Layer Updates**
  - [x] Calculate team averages for cycle times and quality metrics across all team members in the period.
- [x] **UI Implementation**
  - [x] Display an anonymous comparison chart or indicators comparing the user's metrics against the team average.
- [x] **AI Integration Updates**
  - [x] Feed team average context into the AI prompt so the generated text includes a comparison.

### Phase 25: Enhanced Real-Time Active Tasks Page
- [x] **Data Fetching Adjustments**
  - [x] Update `/api/reports/active-tasks` to support fetching by specific user ID.
  - [x] Add insights mapping for AI evaluation of active tasks (byStatus, byPriority, byProject, byAssignee, overdueTasks, highPriorityTasks, avgTimeInStatus).
- [x] **New Dedicated Page Implementation** (`app/active-tasks/page.tsx`)
  - [x] Create a dedicated routing page for active tasks, making it accessible to all logged-in Jira users.
  - [x] Build a filter section (User Search, Project Filter).
  - [x] Include analytical charts summarizing the real-time workflow (status distribution, priority distribution, assignee workload).
- [x] **AI Integration Updates**
  - [x] Create `/api/ai/active-tasks-review` endpoint to generate instant review of team/user active tasks.
  - [x] Integrated AI review button in EnhancedActiveTasks component.
- [x] **Navigation Integration**
  - [x] Add a link in the main Sidebar (`components/layout/Sidebar.tsx`) connecting to the new `Active Tasks` page.

---

## Progress Log
| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| Jan 2026 | Phase 1-14 | ✅ Complete | Core dashboard, charts, tables |
| Feb 2026 | Phase 15 | ✅ Complete | OAuth 2.0 + RBAC |
| Feb 2026 | Phase 16 | ✅ Complete | AI Executive Summary (Gemini 2.5) |
| Feb 24, 2026 | Phase 17 | ✅ Complete | AI Standup Generator |
| Feb 24, 2026 | Phase 18 | ✅ Complete | AI JQL Search (Natural Language) |
| Mar 10, 2026 | Phase 22 | ✅ Complete | Team Member Performance Evaluation |
| Mar 11, 2026 | Phase 23 | ✅ Complete | Real-Time Active Tasks Visualization |
| Mar 11, 2026 | Phase 24 | ✅ Complete | Peer Comparison & Enhancements |
| Mar 11, 2026 | Phase 25 | ✅ Complete | Enhanced Real-Time Active Tasks Page |
| Mar 11, 2026 | Phase 19 | ✅ Complete | Advanced Reporting (Time Filter, Team Comparison, Export) |
| Mar 11, 2026 | Phase 20 | ✅ Complete | Performance (Caching, Pagination, SSR) |
| Mar 11, 2026 | Phase 21 | ✅ Complete | AI Enhancements (Issue TL;DR, Team Insights) |

