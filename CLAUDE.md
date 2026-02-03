# Jira Dashboard - Project Context

## Tổng quan
Dashboard nội bộ giúp PM/Team Lead theo dõi tiến độ và hiệu suất từ Jira. Thiết kế tập trung vào sự tối giản và tính năng "Member Report" chuyên sâu.

## Tech Stack
- **Core**: Next.js 16, React 19, TypeScript.
- **Style**: Tailwind CSS 4, shadcn/ui.
- **Charts**: Recharts.
- **Deployment**: Docker, Docker Compose.

## Project Structure
```text
app/
├── api/                        # Backend API Routes (Jira Proxy)
├── projects/                   # Project based views
├── resources/                  # Team & Member views
│   └── [userId]/               # Member Report (Main Feature)
├── settings/                   # App Settings (Theme, Connection)
└── page.tsx                    # Main Dashboard

components/
├── charts/                     # Recharts components (Radar, Bar, Pie...)
├── layout/                     # Sidebar, Header
├── tables/                     # Data Tables (MemberTask, WorklogHistory)
└── ui/                         # shadcn/ui primitive components

lib/
├── jira.ts                     # Jira API Wrapper
└── utils.ts                    # Helper functions
```

## Key Modules

### 1. Dashboard (`/`)
- Tổng quan dự án, task mở, bug nghiêm trọng.
- Biểu đồ Workload thành viên & Activity Stream mới nhất.

### 2. Member Report (`/resources/[userId]`)
Tính năng cốt lõi để đánh giá nhân sự:
- **KPIs**: Hours, Punctuality, Fix Speed (kèm công thức tóm tắt).
- **Charts**: Radar Chart (Skill profile), Weekly Progress.
- **Tables**:
    - **Worklog History**: Chi tiết từng log (ngày, giờ, comment).
    - **Task List**: Các task đã tham gia/assign.

### 3. Docker Support
Dự án đã được Dockerize hoàn chỉnh.
- `Dockerfile`: Multi-stage build (deps -> builder -> runner).
- `docker-compose.yml`: Chạy service `jira-dashboard` ở port 3000.

## Development Commands

### NPM
```bash
npm install     # Cài đặt
npm run dev     # Chạy môi trường dev (Localhost:3000)
npm run build   # Build production
```

### Docker
```bash
# Chạy container (Build & Start)
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Dừng container
docker-compose down
```

## Environment (.env.local)
```env
JIRA_HOST=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
```
