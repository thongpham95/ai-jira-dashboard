# 🚀 AI Jira Dashboard

Dashboard nội bộ giúp Team Lead/PM theo dõi tiến độ và hiệu suất dự án từ Jira, tích hợp **Google Gemini AI** để tự động phân tích, tóm tắt tình hình dự án, sinh báo cáo standup, và hỗ trợ tìm kiếm bằng ngôn ngữ tự nhiên.

## ✨ Features

### Core
- **Dashboard Overview**: Thống kê dự án, task mở, bug nghiêm trọng, giờ làm tuần
- **Project Details**: Chi tiết sprint, phân bổ trạng thái, workload team
- **Member Report**: Báo cáo hiệu suất cá nhân (Hours, Punctuality, Radar Charts)
- **Role-Based Access**: Admin xem toàn bộ, User chỉ xem báo cáo cá nhân
- **OAuth 2.0 Login**: Đăng nhập qua Atlassian (không cần nhập token thủ công)

### 🤖 AI-Powered (Google Gemini)
- **AI Executive Summary**: Phân tích tổng quan dự án — Tiến độ Epic, Rủi ro, Đề xuất hành động
- **AI Standup Generator**: Tự động sinh daily standup report từ worklog 24h (Yesterday/Today/Blockers)
- **AI JQL Search**: Tìm kiếm bằng ngôn ngữ tự nhiên (tiếng Việt/English) — AI chuyển thành JQL
- **AI Performance Review**: Đánh giá hiệu suất cá nhân dựa trên phân tích dữ liệu lịch sử cycle time, quality metrics từ Jira.
- **Dual Model Support**: Gemini 2.5 Flash (nhanh, miễn phí) + Gemini 2.5 Pro (phân tích sâu)

### UX
- **Multi-language**: Tiếng Việt / English
- **Dark/Light Mode**: Tùy chỉnh giao diện
- **Animations**: Framer Motion cho AI reports, Recharts cho biểu đồ

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui, Recharts, Framer Motion |
| Auth | NextAuth.js + Atlassian OAuth 2.0 (3LO) |
| AI | Google Gemini (`gemini-2.5-flash`, `gemini-2.5-pro`) via `@google/genai` |
| API | Jira REST API v3 |
| Deploy | Docker & Docker Compose |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Atlassian Developer App (OAuth 2.0)
- Google Gemini API Key (miễn phí — cho tính năng AI)

### 1. Setup Atlassian OAuth App
1. Truy cập [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Tạo OAuth 2.0 App với các scopes:
   - `read:jira-work`
   - `read:jira-user`
   - `read:me`
3. Thêm Callback URL: `http://localhost:3000/api/auth/callback/atlassian`

### 2. Get Gemini API Key (Free)
1. Truy cập [Google AI Studio](https://aistudio.google.com/apikey)
2. Tạo API Key miễn phí

### 3. Configure Environment
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
# NextAuth (Required)
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Atlassian OAuth 2.0 (Required)
ATLASSIAN_CLIENT_ID=your-client-id
ATLASSIAN_CLIENT_SECRET=your-client-secret

# AI Features (Optional — cho AI features)
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Install & Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Docker (Optional)
```bash
docker-compose up -d --build
```

## 🤖 AI Features Guide

### AI Executive Summary
1. Truy cập **Dashboard** (Admin) hoặc **Project Detail**
2. Chọn model AI (Flash = nhanh, Pro = phân tích sâu)
3. Click **"Tạo báo cáo AI"**
4. Đợi 15-60s — AI phân tích Epics, Bugs, Overdue Tasks, Team Workload

### AI Standup Generator
1. Truy cập **Member Report** page
2. Tìm widget **"AI Daily Standup"**
3. Click **"Tạo Standup Report"**
4. Click **"Sao chép"** để paste vào Slack/Teams/Email

### AI JQL Search
1. Ở thanh search bar header, click **nút ✨** (sparkle) để bật AI mode
2. Gõ tiếng Việt hoặc English: *"tìm bug critical tuần này"*
3. AI tự chuyển thành JQL và tìm kiếm

| User Input | Generated JQL |
|-----------|---------------|
| "tìm bug critical tuần này" | `issuetype = Bug AND priority in (Highest, High) AND created >= startOfWeek()` |
| "task của tôi chưa xong" | `assignee = currentUser() AND resolution = Unresolved` |
| "issues quá hạn" | `duedate < now() AND resolution = Unresolved` |

## 📁 Project Structure

```
app/
├── api/
│   ├── auth/              # NextAuth + RBAC
│   ├── ai/
│   │   ├── summary/       # AI Executive Summary
│   │   ├── standup/       # AI Standup Generator
│   │   └── jql/           # AI Natural Language → JQL
│   ├── projects/           # Project list
│   ├── issues/             # Issue search & count
│   ├── worklogs/           # Worklog data
│   ├── users/              # User list
│   └── reports/member/     # Member report data
├── projects/[id]/          # Project detail (+ AI widget)
├── resources/[userId]/     # Member report (+ Standup widget)
├── search/                 # JQL search (+ AI banner)
├── settings/               # Language & Theme
└── page.tsx                # Home (Dashboard / Member Report)

components/
├── dashboard/
│   ├── AdminDashboard.tsx         # Admin dashboard
│   └── AIExecutiveSummary.tsx     # AI summary widget
├── reports/
│   ├── MemberReportView.tsx       # Member report
│   └── AIStandupGenerator.tsx     # AI standup widget
├── layout/
│   └── Header.tsx                 # Header with AI search toggle
├── charts/                        # Recharts components
└── ui/                            # shadcn/ui components

lib/
├── ai.ts                  # Gemini AI (Summary, Standup, JQL)
├── jira.ts                # Jira API client (OAuth)
└── translations.ts        # i18n (vi/en)
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [PRD](docs/PRD.md) | Product Requirements |
| [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) | Development phases & progress |
| [Test Plan](docs/TEST_PLAN.md) | Test cases & results |
| [Phase 2 Proposal](docs/PHASE_2_PROPOSAL.md) | AI features proposal & status |
| [Deployment](docs/DEPLOYMENT.md) | Docker deployment guide |

## 📝 License

Private project — Internal use only.
