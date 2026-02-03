# Jira Dashboard - Project Context

## Tổng quan
Dashboard nội bộ cho Project Manager theo dõi tiến độ dự án, công việc và khối lượng làm việc từ Jira. Thiết kế **Tối giản (Minimalist)**.

## Tech Stack
- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Styling:** Tailwind CSS, shadcn/ui
- **Charts:** Recharts
- **Icons:** Lucide-React

## Cấu trúc Dự án
```
app/
├── page.tsx                    # Dashboard Overview
├── projects/
│   ├── page.tsx                # Projects List
│   └── [id]/page.tsx           # Project Detail
├── resources/
│   ├── page.tsx                # Team Resources
│   └── [userId]/page.tsx       # Member Report
├── search/page.tsx             # Search Results
├── settings/page.tsx           # Settings
└── api/
    ├── projects/route.ts       # GET /api/projects
    ├── issues/route.ts         # POST /api/issues (JQL)
    ├── worklogs/route.ts       # POST /api/worklogs
    ├── users/route.ts          # GET /api/users
    ├── reports/member/route.ts # GET /api/reports/member
    ├── settings/status/route.ts # GET /api/settings/status
    └── settings/jira-host/route.ts # GET /api/settings/jira-host

components/
├── layout/
│   ├── Sidebar.tsx             # Navigation
│   └── Header.tsx              # Theme toggle
├── charts/
│   ├── WorkloadBarChart.tsx    # Member workload
│   ├── StatusPieChart.tsx      # Status distribution
│   ├── BurndownChart.tsx       # Sprint progress
│   ├── EfficiencyRadarChart.tsx # Performance radar
│   ├── CompletionBarChart.tsx  # Weekly task completions
│   └── HoursTimelineChart.tsx  # Hours logged over time
├── tables/
│   └── MemberTaskTable.tsx     # Task list with sorting
├── search/
│   └── JQLSearch.tsx           # JQL search input
└── ui/                         # shadcn components

lib/
├── jira.ts                     # Jira API client
└── utils.ts                    # Utilities

scripts/
└── validate-users.ts           # User validation script
```

## Tính năng Chính

### 1. Dashboard Overview (`/`)
- StatCards: Active Projects, Open Issues, Critical Bugs, Weekly Hours
- Project Filter dropdown (mặc định: `[TVT] PAYDAES`)
- WorkloadBarChart: Giờ làm việc theo thành viên
- ActivityStream: Hoạt động gần đây
- JQL Search: Tìm kiếm nâng cao

### 2. Project Detail (`/projects/[id]`)
- Current Sprint info
- StatCards: Sprint, Total Issues, Bugs, Hours
- WorkloadBarChart: Workload theo thành viên
- StatusPieChart: Phân bố trạng thái (click để filter)
- MemberTaskTable: Danh sách task

### 3. Resources (`/resources`)
- Lọc theo Project
- Bảng thành viên: Avatar, Name, Email, Action
- Link đến Member Report

### 4. Member Report (`/resources/[userId]`)
- KPIs: Total Hours Logged, Avg Time/Task, Bug Fix Time, Punctuality, Completed
- Performance Charts: CompletionBarChart (weekly), HoursTimelineChart (weekly), EfficiencyRadarChart (radar)
- MemberTaskTable: Danh sách task/bug được gán (có cột Logged hours, sortable)
- Clickable Jira Links: Task keys link to Jira issue page (external link icon)
- Fetch tất cả tasks (phân trang tự động, không giới hạn 50)
- accountId trong URL path phải được decode (`decodeURIComponent`) trước khi dùng trong JQL

### 5. Settings (`/settings`)
- Jira Connection status
- Theme toggle (Light/Dark/System)

## Jira API Endpoints
```
/rest/api/3/project          # List projects
/rest/api/3/search/jql       # Search issues (JQL, POST, cursor-based pagination)
/rest/api/3/issue/{key}/worklog # Worklogs
/rest/api/3/user             # Users
```

## Environment Variables
```env
JIRA_HOST=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
```

## Commands
```bash
npm install    # Install dependencies
npm run dev    # Start dev server
npm run build  # Production build
```
