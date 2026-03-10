# Test Plan - Jira Dashboard

## 🔐 Part 1: Authentication

### 1.1 Login Flow
| Test Case | Status | Notes |
|-----------|--------|-------|
| Unauthenticated: Home shows login prompt | ✅ | Shows "Đăng nhập với Jira" button |
| Click "Login with Jira" redirects to Atlassian | ✅ | OAuth flow initiates correctly |
| After approval, redirects back to app | ✅ | Requires correct Callback URL in Atlassian |
| Logged in: Header shows user info | ✅ | Avatar + name displayed |

### 1.2 Logout Flow
| Test Case | Status | Notes |
|-----------|--------|-------|
| Click Avatar → Logout clears session | ✅ | Returns to login state |
| Protected routes require login | ✅ | Redirects to home with login prompt |

### 1.3 OAuth Configuration
| Requirement | Value |
|-------------|-------|
| Callback URL | `http://localhost:3000/api/auth/callback/atlassian` |
| Scopes | `read:jira-work`, `read:jira-user`, `read:me` |

---

## 👥 Part 2: Role-Based Access Control

### 2.1 Admin View
*Prerequisite: Account with `ADMINISTER_PROJECTS` permission*

| Test Case | Status | Notes |
|-----------|--------|-------|
| Home shows full Dashboard | ✅ | AdminDashboard component |
| See Active Projects, Open Issues stats | ✅ | StatCards visible |
| Workload & Activity charts visible | ✅ | Bar chart + Activity stream |
| Can switch project filter | ✅ | Dropdown updates charts |
| Can view any member's report | ✅ | `/resources/[userId]` accessible |

### 2.2 Member View
*Prerequisite: Account with standard USER permissions*

| Test Case | Status | Notes |
|-----------|--------|-------|
| Home shows Member Report (own stats) | ✅ | MemberReportView component |
| No global team stats visible | ✅ | Only personal data |
| See own Hours, Punctuality, KPIs | ✅ | Personal metrics displayed |
| See own Participated Tasks | ✅ | Table shows tasks with worklogs |

---

## 📊 Part 3: Core Features

### 3.1 Member Report Data
| Test Case | Status | Notes |
|-----------|--------|-------|
| Worklog from non-assigned task counted | ✅ | Hours increase, task appears in list |
| Avg Time/Task = Total Hours / Tasks | ✅ | Formula verified |
| Punctuality = Done On Time / Total % | ✅ | Formula verified |
| Worklog History table accurate | ✅ | Matches Jira data |

### 3.2 Search Functionality
| Test Case | Status | Notes |
|-----------|--------|-------|
| JQL search returns correct results | ✅ | `/search` page works |
| Results table displays issues | ✅ | Key, Summary, Status shown |

---

## 🤖 Part 4: AI Executive Summary

### 4.1 AI Widget Display
| Test Case | Status | Notes |
|-----------|--------|-------|
| AI widget visible on Admin Dashboard | ✅ | Below stat cards, above charts |
| AI widget visible on Project Detail page | ✅ | Below stat cards, above charts |
| Model dropdown shows 2 options | ✅ | Gemini 2.5 Flash + Pro |
| Default model is Gemini 2.5 Flash | ✅ | Pre-selected in dropdown |
| "Tạo báo cáo AI" button visible | ✅ | With sparkle icon |

### 4.2 AI Report Generation — Gemini 2.5 Flash
*Prerequisite: `GEMINI_API_KEY` set in `.env.local`*

| Test Case | Status | Notes |
|-----------|--------|-------|
| Click "Tạo báo cáo AI" triggers loading | ✅ | Spinner + "Đang phân tích..." text |
| Report generates successfully | ✅ | ~15-20s response time |
| Report contains required sections | ✅ | Overview, Epic Progress, Risks, Actions |
| Report length sufficient (800+ chars) | ✅ | maxOutputTokens: 8192 |
| Metadata footer shows info | ✅ | Timestamp, model, data points |
| Collapse/expand toggle works | ✅ | Chevron button hides/shows |

### 4.3 AI Report Generation — Gemini 2.5 Pro
| Test Case | Status | Notes |
|-----------|--------|-------|
| Pro model generates successfully | ✅ | ~60s response (thinking model) |
| Pro report is more detailed | ✅ | Deeper analysis, color-coded |
| No empty response error | ✅ | Fixed with thinkingConfig |

### 4.4 AI Error Handling
| Test Case | Status | Notes |
|-----------|--------|-------|
| No GEMINI_API_KEY: shows config error | ✅ | Descriptive error message |
| Invalid API key: shows auth error | ✅ | Descriptive error message |
| Empty response: shows retry message | ✅ | Suggests switching models |

---

## 🎙️ Part 5: AI Standup Generator

### 5.1 Widget Display
| Test Case | Status | Notes |
|-----------|--------|-------|
| AI Standup widget visible on Member Report | ✅ | Between stat cards and charts |
| Widget has microphone icon + title | ✅ | Green gradient icon, "AI Daily Standup" |
| Description text shows | ✅ | "Tự động sinh báo cáo standup từ worklog 24h" |
| "Tạo Standup Report" button visible | ✅ | With sparkle icon |

### 5.2 Standup Generation
*Prerequisite: `GEMINI_API_KEY` set in `.env.local`*

| Test Case | Status | Notes |
|-----------|--------|-------|
| Click generates loading state | ✅ | "Đang tạo..." + skeleton animation |
| Report generates with 3 sections | ✅ | Yesterday, Today, Blockers |
| Ticket keys highlighted as code | ✅ | [KEY-123] rendered as inline code |
| Copy button appears after generation | ✅ | "Sao chép" with clipboard icon |
| Copy copies markdown text | ✅ | navigator.clipboard.writeText |
| Metadata footer shows info | ✅ | Timestamp, model, worklogs/transitions count |
| Collapse/expand toggle works | ✅ | ChevronUp/Down toggle |

### 5.3 Standup Error Handling
| Test Case | Status | Notes |
|-----------|--------|-------|
| No GEMINI_API_KEY: shows error | ✅ | Red error banner with message |
| API failure: graceful error display | ✅ | ⚠️ icon with error text |

---

## 🔎 Part 6: AI JQL Search

### 6.1 Header AI Toggle
| Test Case | Status | Notes |
|-----------|--------|-------|
| Sparkle button (✨) visible in header | ✅ | Next to search input |
| Click sparkle toggles AI mode | ✅ | Button changes to primary/filled |
| AI mode: search icon changes to sparkle | ✅ | Sparkles icon replaces Search icon |
| AI mode: placeholder text changes | ✅ | "Mô tả bằng tiếng Việt..." |
| AI mode: input border highlighted | ✅ | border-primary/50, bg-primary/5 |
| Click again: returns to JQL mode | ✅ | Normal search bar restored |
| Normal mode: JQL search works as before | ✅ | Redirects to /search?query=JQL |

### 6.2 AI Search Flow
*Prerequisite: `GEMINI_API_KEY` set in `.env.local`*

| Test Case | Status | Notes |
|-----------|--------|-------|
| Type natural language + Enter | ✅ | Loading spinner in search bar |
| AI converts to JQL | ✅ | Redirects to /search with JQL |
| URL includes AI params | ✅ | ?ai=1&original=query appended |
| Search page shows AI context banner | ✅ | "Tìm kiếm bằng AI" with sparkle icon |
| Banner shows original query | ✅ | Italic text with user's question |
| Banner shows generated JQL | ✅ | Code block with JQL string |
| JQL search input shows generated query | ✅ | Pre-filled with AI-generated JQL |
| Can modify and re-search generated JQL | ✅ | Edit JQL + click Search |

### 6.3 AI Search Error Handling
| Test Case | Status | Notes |
|-----------|--------|-------|
| API failure: fallback to raw query | ✅ | Searches with original text as JQL |
| No GEMINI_API_KEY: fallback to raw | ✅ | Graceful degradation |

---

## 🎨 Part 7: UI/UX

### 7.1 Settings
| Test Case | Status | Notes |
|-----------|--------|-------|
| Language switch (vi/en) works | ✅ | All text updates |
| Theme switch (Light/Dark/System) works | ✅ | Instant update |
| No AI Settings section in Settings | ✅ | API key via env var only |

### 7.2 Loading & Animations
| Test Case | Status | Notes |
|-----------|--------|-------|
| Loading animation on page transitions | ✅ | LoadingAnimation component |
| Smooth chart animations | ✅ | Recharts animations work |
| AI report fade-in animation | ✅ | Framer Motion AnimatePresence |
| AI loading skeleton pulse animation | ✅ | Staggered delay skeletons |

---

## ⚙️ Part 8: Technical

### 8.1 API Routes
| Route | Auth Required | Status |
|-------|---------------|--------|
| `/api/auth/[...nextauth]` | No | ✅ |
| `/api/auth/permissions` | Yes | ✅ |
| `/api/projects` | Yes | ✅ |
| `/api/issues` | Yes | ✅ |
| `/api/worklogs` | Yes | ✅ |
| `/api/users` | Yes | ✅ |
| `/api/reports/member` | Yes | ✅ |
| `/api/ai/summary` | Yes | ✅ |
| `/api/ai/standup` | Yes | ✅ |
| `/api/ai/jql` | Yes | ✅ |

### 8.2 Build & Deploy
| Test Case | Status | Notes |
|-----------|--------|-------|
| `npm run build` succeeds | ✅ | No TypeScript errors |
| `npm run dev` works | ✅ | Hot reload functional |
| Docker build works | ✅ | Multi-stage build |
| `npx tsc --noEmit` clean | ✅ | Zero TypeScript errors |

### 8.3 AI Service (`lib/ai.ts`)
| Test Case | Status | Notes |
|-----------|--------|-------|
| Exports generateExecutiveSummary | ✅ | Executive Summary function |
| Exports generateStandupReport | ✅ | Standup Generator function |
| Exports convertNaturalLanguageToJQL | ✅ | JQL conversion function |
| Default model is gemini-2.5-flash | ✅ | DEFAULT_MODEL constant |
| Pro model includes thinkingConfig | ✅ | thinkingBudget: 4096 |
| JQL conversion uses temp 0.1 | ✅ | Very precise for code output |
| Standup uses temp 0.3 | ✅ | Factual but flexible |

---

## 📈 Part 9: Team Member Performance Evaluation

### 9.1 Data Aggregation & Logic
| Test Case | Status | Notes |
|-----------|--------|-------|
| Parses changelog correctly | PENDING | Unit test for transition timestamp differences |
| Calculates Dev Cycle Time correctly | PENDING | `TODO` -> `IN PROGRESS` -> `CODE REVIEW` |
| Calculates TL Cycle Time correctly | PENDING | `CODE REVIEW` -> `DONE CODE REVIEW` -> `MERGED TO QC` |
| Calculates QC Cycle Time correctly | PENDING | `TASK DONE` -> `TVT INTERNAL REVIEW` -> `REOPEN`/`CLOSED` |
| Quality Metrics (Pass rate, Reopen rate) accurate | PENDING | Formulas verified against Jira history |

### 9.2 UI/UX Pro Max Guidelines
| Test Case | Status | Notes |
|-----------|--------|-------|
| Meets ui-ux-pro-max design constraints | PENDING | Minimalist & professional |
| Adapts correctly to Light/Dark Mode | PENDING | Contrast verified |
| Anomalies clearly highlighted | PENDING | Uses designated color/animation for issues (e.g. extremely long review) |
| Performance charts render accurately | PENDING | Uses Recharts |

### 9.3 AI Performance Summary
| Test Case | Status | Notes |
|-----------|--------|-------|
| `/api/ai/performance-review` generates summary | PENDING | Generates text based on metrics |
| AI widget displays output properly | PENDING | Animated display & Markdown format |

