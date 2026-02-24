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

### Phase 19: Advanced Reporting
- [ ] Time filtering (Day/Week/Month)
- [ ] Team comparison charts
- [ ] Export reports (PDF/CSV)

### Phase 20: Performance
- [ ] API response caching
- [ ] Pagination optimization
- [ ] SSR improvements

### Phase 21: AI Enhancements
- [ ] Issue TL;DR (Summarize ticket description + comments)
- [ ] AI-powered team insights (cross-member analysis)

---

## Progress Log
| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| Jan 2026 | Phase 1-14 | ✅ Complete | Core dashboard, charts, tables |
| Feb 2026 | Phase 15 | ✅ Complete | OAuth 2.0 + RBAC |
| Feb 2026 | Phase 16 | ✅ Complete | AI Executive Summary (Gemini 2.5) |
| Feb 24, 2026 | Phase 17 | ✅ Complete | AI Standup Generator |
| Feb 24, 2026 | Phase 18 | ✅ Complete | AI JQL Search (Natural Language) |
