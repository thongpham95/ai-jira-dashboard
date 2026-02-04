# Jira Dashboard

Dashboard nội bộ giúp Team Lead/PM theo dõi tiến độ và hiệu suất dự án từ Jira.

## ✨ Features

- **Dashboard Overview**: Thống kê dự án, task mở, bug nghiêm trọng, giờ làm tuần
- **Project Details**: Chi tiết sprint, phân bổ trạng thái, workload team
- **Member Report**: Báo cáo hiệu suất cá nhân (Hours, Punctuality, Charts)
- **Role-Based Access**: Admin xem toàn bộ, User chỉ xem báo cáo cá nhân
- **OAuth 2.0 Login**: Đăng nhập qua Atlassian (không cần nhập token thủ công)
- **Multi-language**: Tiếng Việt / English
- **Dark/Light Mode**: Tùy chỉnh giao diện

## 🛠 Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS 4, shadcn/ui, Recharts
- **Auth**: NextAuth.js + Atlassian OAuth 2.0 (3LO)
- **Deployment**: Docker & Docker Compose

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Atlassian Developer App (OAuth 2.0)

### 1. Setup Atlassian OAuth App
1. Truy cập [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Tạo OAuth 2.0 App với các scopes:
   - `read:jira-work`
   - `read:jira-user`
   - `read:me`
3. Thêm Callback URL: `http://localhost:3000/api/auth/callback/atlassian`

### 2. Configure Environment
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Atlassian OAuth 2.0
ATLASSIAN_CLIENT_ID=your-client-id
ATLASSIAN_CLIENT_SECRET=your-client-secret
```

### 3. Install & Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Docker (Optional)
```bash
docker-compose up -d --build
```

## 📁 Project Structure

```
app/
├── api/auth/           # NextAuth API routes
├── api/projects/       # Jira proxy APIs
├── projects/           # Project views
├── resources/          # Team & Member views
│   └── [userId]/       # Member Report (Core Feature)
├── settings/           # Settings (Language, Theme)
└── page.tsx            # Main Dashboard

components/
├── dashboard/          # Admin Dashboard
├── reports/            # Member Report View
├── charts/             # Recharts components
├── layout/             # Sidebar, Header
└── ui/                 # shadcn/ui components

lib/
├── jira.ts             # Jira API (OAuth only)
└── translations.ts     # i18n (vi/en)
```

## 📖 Documentation

- [PRD](docs/PRD.md) - Product Requirements
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) - Development phases
- [Test Plan](docs/TEST_PLAN.md) - Test cases
- [Deployment](docs/DEPLOYMENT.md) - Docker deployment guide
