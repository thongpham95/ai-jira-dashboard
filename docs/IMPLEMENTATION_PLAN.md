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

---

## Current Project Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── [...nextauth]/route.ts   # NextAuth handler
│   │   └── permissions/route.ts     # RBAC permission check
│   ├── issues/                      # Issue search & count
│   ├── projects/                    # Project list
│   ├── reports/member/              # Member report data
│   ├── users/                       # User list
│   └── worklogs/                    # Worklog data
├── projects/
│   └── [id]/                        # Project detail
├── resources/
│   └── [userId]/                    # Member report page
├── search/                          # JQL search
├── settings/                        # Language & Theme
└── page.tsx                         # Home (Dashboard or Member Report)

components/
├── auth-provider.tsx                # SessionProvider wrapper
├── dashboard/
│   └── AdminDashboard.tsx           # Admin-only dashboard
├── reports/
│   └── MemberReportView.tsx         # Member report component
├── charts/                          # Recharts components
├── layout/                          # Sidebar, Header
├── tables/                          # Data tables
└── ui/
    └── loading-animation.tsx        # Loading spinner

lib/
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
```

---

## Future Phases (Backlog)

### Phase 16: Advanced Reporting
- [ ] Time filtering (Day/Week/Month)
- [ ] Team comparison charts
- [ ] Export reports (PDF/CSV)

### Phase 17: Performance
- [ ] API response caching
- [ ] Pagination optimization
- [ ] SSR improvements
