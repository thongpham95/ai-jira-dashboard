# Product Requirements Document (PRD) - Jira Dashboard

## 1. Overview
Dashboard nội bộ giúp Team Lead/PM theo dõi tiến độ và hiệu suất dự án từ Jira. Tích hợp **Google Gemini AI** để tự động phân tích, tóm tắt và cảnh báo rủi ro dự án. Tập trung vào tính minh bạch, chính xác và giao diện tối giản.

## 2. Tech Stack
| Category | Technology |
|----------|------------|
| Framework | Next.js 16, React 19, TypeScript |
| UI/UX | Tailwind CSS 4, shadcn/ui, Recharts, Framer Motion |
| Auth | NextAuth.js + Atlassian OAuth 2.0 (3LO) |
| API | Jira REST API v3 |
| AI | Google Gemini (gemini-2.5-flash, gemini-2.5-pro) via @google/genai SDK |
| Deployment | Docker & Docker Compose |

## 3. Core Features

### 3.1 Authentication
- **OAuth 2.0 Login**: Đăng nhập qua Atlassian (không cần nhập token thủ công)
- **Auto-Token**: Tự động lấy Access Token từ session
- **Logout**: Đăng xuất và xóa session

### 3.2 Role-Based Access Control (RBAC)
| Role | Permissions |
|------|-------------|
| **Admin/Team Lead** | Dashboard đầy đủ, xem báo cáo tất cả thành viên, AI Executive Summary |
| **User/Member** | Chỉ xem báo cáo cá nhân (Member Report) |

### 3.3 Dashboard (Admin Only)
- **Stat Cards**: Active Projects, Open Tasks, Critical Bugs, Weekly Hours
- **AI Executive Summary**: Widget AI phân tích tổng quan dự án (xem 3.6)
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

### 3.5 Project Detail (`/projects/[id]`)
- **Stat Cards**: Sprint hiện tại, Tổng công việc, Lỗi (Bug), Tổng giờ
- **AI Executive Summary**: Widget AI phân tích dự án specific
- **Charts**: Workload theo thành viên, Trạng thái công việc (Pie chart với click-to-filter)
- **Task Table**: Danh sách công việc với filter theo trạng thái

### 3.6 🤖 AI Executive Summary (Google Gemini)
**Tính năng AI cốt lõi** — Giúp PM/Leader nắm tổng quan dự án trong vài giây.

#### Mô tả
Widget "AI Executive Summary" tích hợp tại Admin Dashboard và trang Project Detail. Sử dụng Google Gemini để phân tích dữ liệu Jira và sinh báo cáo tự động.

#### Models hỗ trợ
| Model | Mô tả | Use Case |
|-------|--------|----------|
| `gemini-2.5-flash` (mặc định) | Nhanh, free tier friendly | Báo cáo nhanh hàng ngày |
| `gemini-2.5-pro` | Phân tích sâu, thinking model | Phân tích chi tiết định kỳ |

#### Data Sources (thu thập từ Jira)
- **Epics**: Tiến độ từng Epic/Phase (% done, in progress, to do, blockers)
- **Critical Bugs**: Bugs priority High/Highest/Critical chưa resolve
- **Overdue Tasks**: Tasks quá hạn deadline
- **Team Workload**: Phân bổ công việc theo thành viên (14 ngày gần nhất)

#### Report Output (Markdown)
- 📊 **Tổng quan / Overview**: 2-3 câu đánh giá tổng thể sức khỏe dự án
- 📈 **Tiến độ theo Epic**: Completion %, blockers, behind-schedule warnings
- 🚨 **Rủi ro & Vấn đề**: Top 3-5 risks (bugs, overdue, overload)
- 💡 **Đề xuất hành động**: 3-5 recommended actions cho PM/Team Lead

#### Technical Details
- **API Route**: `POST /api/ai/summary`
- **Service Layer**: `lib/ai.ts` (Google GenAI SDK)
- **Config**: `GEMINI_API_KEY` environment variable
- **Gemini 2.5 Pro**: ThinkingConfig with `thinkingBudget: 4096` tokens
- **Max Output**: 8192 tokens
- **Temperature**: 0.3 (factual, low hallucination)

### 3.7 🎙️ AI Daily Standup Generator
**Tính năng AI** — Tự động sinh báo cáo standup từ worklog 24h.

#### Mô tả
Widget "AI Daily Standup" tích hợp tại Member Report page. Dựa vào worklog và status transitions trong 24h qua, AI sinh ra standup report.

#### Report Output (Markdown)
- ✅ **Hôm qua đã làm**: Tóm tắt hoạt động từ worklogs, grouped by task
- 📋 **Hôm nay sẽ làm**: Dự đoán công việc dựa trên items đang in-progress
- 🚧 **Blockers**: Tickets bị stuck hoặc có vấn đề

#### Technical Details
- **API Route**: `POST /api/ai/standup`
- **Data Sources**: Worklogs (24h) + Status transitions (changelog)
- **Max Output**: 4096 tokens
- **Copy-to-clipboard**: Sao chép nhanh để paste vào Slack/Teams

### 3.8 🔎 AI JQL Search (Natural Language → JQL)
**Tính năng AI** — Tìm kiếm bằng ngôn ngữ tự nhiên thay vì JQL syntax.

#### Mô tả
Toggle AI mode trên search bar (✨ sparkle button). Khi bật, user gõ tiếng Việt/English → AI chuyển thành JQL.

#### Examples
| User Input | Generated JQL |
|-----------|---------------|
| "tìm bug critical tuần này" | `issuetype = Bug AND priority in (Highest, High) AND created >= startOfWeek()` |
| "task của tôi chưa xong" | `assignee = currentUser() AND resolution = Unresolved` |
| "issues quá hạn" | `duedate < now() AND resolution = Unresolved ORDER BY duedate ASC` |

#### Technical Details
- **API Route**: `POST /api/ai/jql`
- **Context**: Auto-fetches project keys for accurate mapping
- **Temperature**: 0.1 (very precise for code output)
- **UI**: Toggle button in Header, AI banner on Search results page

### 3.9 UX Features
- **Multi-language**: Tiếng Việt / English
- **Dark/Light Mode**: Tùy chỉnh giao diện
- **Loading Animation**: Smooth transitions, skeleton loaders
- **Framer Motion**: Animated AI report appearance

## 4. Environment Variables
```env
# NextAuth (Required)
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Atlassian OAuth 2.0 (Required)
ATLASSIAN_CLIENT_ID=your-client-id
ATLASSIAN_CLIENT_SECRET=your-client-secret

# AI Features (Optional — required for AI features)
GEMINI_API_KEY=your-gemini-api-key
```

## 5. Atlassian OAuth Scopes
| API | Scope |
|-----|-------|
| Jira API | `read:jira-work`, `read:jira-user` |
| User Identity | `read:me` |

## 6. Future Features (Backlog)
- 📝 **Issue TL;DR**: Tóm tắt ticket description + comment thread
- ⚡ **Performance**: API caching, pagination optimization
- 📊 **Advanced Reporting**: Time filtering, export PDF/CSV

