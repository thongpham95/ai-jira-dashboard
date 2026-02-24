# Đề xuất Tối ưu hoá & Bổ sung Tính năng (Phase 2 - AI Integration & Performance)

Dựa trên việc nghiên cứu kiến trúc hiện tại của `ai-jira-dashboard` (Next.js 16, Dashboard thống kê từ Jira), dưới đây là các đề xuất tối ưu hóa hệ thống và bổ sung các tính năng đột phá, tập trung vào việc áp dụng AI đúng với tiền tố "ai-" của dự án.

## 1. Đề xuất Tối ưu hoá Hệ thống (Optimizations)

### 1.1 Tối ưu hiệu suất API (Caching Layer) *(Backlog)*
- **Giải pháp:** Tích hợp caching cho Jira API responses (5-15 phút TTL).

### 1.2 Tải trang mượt mà (Progressive Loading & Skeleton) *(Backlog)*
- **Giải pháp:** Skeleton Loaders + `<Suspense>` streaming.

### 1.3 Cải thiện Data Tables *(Backlog)*
- Sort, Pagination, Filter cho các bảng.

---

## 2. Đề xuất Tính năng Mới (New Features)

### 2.1 🤖 AI Executive Summary & Epic-based Progress ✅ DONE
Widget AI phân tích tổng quan dự án bằng Google Gemini. Tích hợp tại Admin Dashboard + Project Detail.

### 2.2 🎙️ AI Daily Standup Generator ✅ DONE
Widget tự động sinh daily standup report từ worklog 24h. Tích hợp tại Member Report page.

### 2.3 🔎 Natural Language to JQL (AI Search) ✅ DONE
Search bar toggle AI mode — chuyển ngôn ngữ tự nhiên thành JQL qua Gemini.

### 2.4 📝 Issue TL;DR (Tóm tắt Ticket) *(Backlog)*
- Tóm tắt description + comment thread thành 2 gạch đầu dòng.

### 2.5 ⚙️ LLM Provider Settings ✅ DONE
API Key quản lý qua environment variable. Model selector tích hợp trong widget.

---

# Kế hoạch Thực hiện Chi tiết (Implementation Plan)

## Phase 1: Performance Tuning & Caching Foundation *(Backlog)*
- [ ] Config Cache cho Jira API Service
- [ ] UI Skeletons cho Dashboard & Member Report
- [ ] Table Sort/Pagination

## Phase 2: AI Settings & Integration Layer ✅ DONE
- [x] `lib/ai.ts` — Google GenAI SDK ✅
- [x] `POST /api/ai/summary` — Executive Summary API ✅
- [x] Models: `gemini-2.5-flash` (default) + `gemini-2.5-pro` ✅
- [x] API Key via `GEMINI_API_KEY` env var ✅

## Phase 3: Implement AI Focus Features ✅ ALL DONE
- [x] **Feature 1: Executive Summary & Epic Progress** ✅
  - [x] Query Jira API gom nhóm data theo Epic/Phase
  - [x] Prompt Engineering cho Markdown report
  - [x] Widget UI + Dashboard integration
  - [x] ThinkingConfig cho Gemini 2.5 Pro

- [x] **Feature 2: Standup Generator** ✅
  - [x] API route `/api/ai/standup` — fetch worklogs + status changes 24h
  - [x] Prompt sinh standup 3 sections (Yesterday/Today/Blockers)
  - [x] Widget UI trên Member Report + Copy-to-clipboard

- [x] **Feature 3: AI JQL Search** ✅
  - [x] API route `/api/ai/jql` — Natural language → JQL
  - [x] Header sparkle toggle (✨) cho AI mode
  - [x] Search page AI context banner

## Phase 4: Testing & Polish ✅ DONE
- [x] Kiểm tra tính chính xác của AI Output ✅
- [x] Fallback nếu API AI bị lỗi/hết quota ✅
- [x] Cập nhật TEST_PLAN.md ✅
