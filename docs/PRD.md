# Product Requirements Document (PRD) - Jira Dashboard

## 1. Overview
Dashboard nội bộ giúp Team Lead/PM theo dõi tiến độ và hiệu suất dự án từ Jira. Tập trung vào tính minh bạch, chính xác và giao diện tối giản.

## 2. Tech Stack
| Category | Technology |
|----------|------------|
| Framework | Next.js 16, React 19, TypeScript |
| UI/UX | Tailwind CSS 4, shadcn/ui, Recharts |
| Auth | NextAuth.js + Atlassian OAuth 2.0 (3LO) |
| API | Jira REST API v3 |
| Deployment | Docker & Docker Compose |

## 3. Core Features

### 3.1 Authentication
- **OAuth 2.0 Login**: Đăng nhập qua Atlassian (không cần nhập token thủ công)
- **Auto-Token**: Tự động lấy Access Token từ session
- **Logout**: Đăng xuất và xóa session

### 3.2 Role-Based Access Control (RBAC)
| Role | Permissions |
|------|-------------|
| **Admin/Team Lead** | Dashboard đầy đủ, xem báo cáo tất cả thành viên |
| **User/Member** | Chỉ xem báo cáo cá nhân (Member Report) |

### 3.3 Dashboard (Admin Only)
- **Stat Cards**: Active Projects, Open Tasks, Critical Bugs, Weekly Hours
- **Charts**: Team Workload (Bar), Activity Stream
- **Filter**: Dropdown chọn dự án

### 3.4 Member Report (`/resources/[userId]`)
**Core Feature** - Đánh giá hiệu suất dựa trên Worklog thực tế.

#### KPIs
| Metric | Formula |
|--------|---------|
| Total Hours | Sum(`worklog.timeSpent`) |
| Avg Time/Task | `Total Hours / Completed Tasks` |
| Avg Bug Fix | Avg(`ResolutionDate - CreatedDate`) cho Bug |
| Punctuality | % Task hoàn thành đúng/trước Due Date |

#### Charts & Tables
- Weekly Tasks/Hours Charts
- Efficiency Radar (Volume, Speed, Quality, Punctuality)
- Worklog History Table
- Participated Tasks Table

### 3.5 UX Features
- **Multi-language**: Tiếng Việt / English
- **Dark/Light Mode**: Tùy chỉnh giao diện
- **Loading Animation**: Smooth transitions

## 4. Environment Variables
```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
ATLASSIAN_CLIENT_ID=your-client-id
ATLASSIAN_CLIENT_SECRET=your-client-secret
```

## 5. Atlassian OAuth Scopes
| API | Scope |
|-----|-------|
| Jira API | `read:jira-work`, `read:jira-user` |
| User Identity | `read:me` |
