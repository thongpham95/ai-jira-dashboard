# Jira Dashboard - Project Context

## Tổng quan
Dashboard nội bộ giúp PM/Team Lead theo dõi tiến độ và hiệu suất từ Jira. Sử dụng OAuth 2.0 để đăng nhập và phân quyền theo vai trò (Admin/User).

## Tech Stack
- **Core**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS 4, shadcn/ui, Recharts
- **Auth**: NextAuth.js + Atlassian OAuth 2.0 (3LO)
- **Deployment**: Docker, Docker Compose

## Project Structure
```text
app/
├── api/
│   ├── auth/                   # NextAuth (OAuth 2.0)
│   │   ├── [...nextauth]/      # Auth handler
│   │   └── permissions/        # RBAC check
│   ├── projects/               # Jira proxy
│   ├── issues/                 # Issue search
│   ├── worklogs/               # Worklog data
│   └── reports/member/         # Member report
├── projects/                   # Project views
├── resources/[userId]/         # Member Report (Core Feature)
├── settings/                   # Language & Theme
└── page.tsx                    # Home (Dashboard or Member Report)

components/
├── auth-provider.tsx           # SessionProvider wrapper
├── dashboard/AdminDashboard.tsx
├── reports/MemberReportView.tsx
├── charts/                     # Recharts components
├── layout/                     # Sidebar, Header
└── ui/                         # shadcn/ui + LoadingAnimation

lib/
├── jira.ts                     # Jira API (OAuth only)
└── translations.ts             # i18n (vi/en)
```

## Key Features

### 1. Authentication (OAuth 2.0)
- Đăng nhập qua Atlassian (không cần nhập token thủ công)
- Auto-token từ session để gọi API
- Scopes: `read:jira-work`, `read:jira-user`, `read:me`

### 2. Role-Based Access Control
| Role | View |
|------|------|
| Admin (`ADMINISTER_PROJECTS`) | Full Dashboard + All Member Reports |
| User | Member Report (own stats only) |

### 3. Member Report (`/resources/[userId]`)
**Core Feature** - Đánh giá hiệu suất dựa trên Worklog.
- **KPIs**: Total Hours, Avg Time/Task, Punctuality, Bug Fix Time
- **Charts**: Weekly Tasks/Hours, Efficiency Radar
- **Tables**: Worklog History, Participated Tasks

### 4. UX
- Multi-language: Tiếng Việt / English
- Dark/Light Mode
- Loading animations

## Development Commands

### NPM
```bash
npm install     # Install dependencies
npm run dev     # Dev server (localhost:3000)
npm run build   # Production build
```

### Docker
```bash
docker-compose up -d --build    # Build & Start
docker-compose logs -f          # View logs
docker-compose down             # Stop
```

## Environment Variables
```env
# NextAuth (Required)
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Atlassian OAuth 2.0 (Required)
ATLASSIAN_CLIENT_ID=your-client-id
ATLASSIAN_CLIENT_SECRET=your-client-secret
```

## Atlassian OAuth Setup
1. Truy cập [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Tạo OAuth 2.0 App
3. Thêm Permissions:
   - Jira API: `read:jira-work`, `read:jira-user`
   - User Identity API: `read:me`
4. Thêm Callback URL: `http://localhost:3000/api/auth/callback/atlassian`

## Documentation
- [PRD](docs/PRD.md) - Product Requirements
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) - Development phases
- [Test Plan](docs/TEST_PLAN.md) - Test cases
- [Deployment](docs/DEPLOYMENT.md) - Docker guide
