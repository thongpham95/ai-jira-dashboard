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

## 🎨 Part 4: UI/UX

### 4.1 Settings
| Test Case | Status | Notes |
|-----------|--------|-------|
| Language switch (vi/en) works | ✅ | All text updates |
| Theme switch (Light/Dark/System) works | ✅ | Instant update |
| No "Jira Connection" section | ✅ | Removed (OAuth replaces it) |

### 4.2 Loading & Animations
| Test Case | Status | Notes |
|-----------|--------|-------|
| Loading animation on page transitions | ✅ | LoadingAnimation component |
| Smooth chart animations | ✅ | Recharts animations work |

---

## ⚙️ Part 5: Technical

### 5.1 API Routes
| Route | Auth Required | Status |
|-------|---------------|--------|
| `/api/auth/[...nextauth]` | No | ✅ |
| `/api/auth/permissions` | Yes | ✅ |
| `/api/projects` | Yes | ✅ |
| `/api/issues` | Yes | ✅ |
| `/api/worklogs` | Yes | ✅ |
| `/api/users` | Yes | ✅ |
| `/api/reports/member` | Yes | ✅ |

### 5.2 Build & Deploy
| Test Case | Status | Notes |
|-----------|--------|-------|
| `npm run build` succeeds | ✅ | No TypeScript errors |
| `npm run dev` works | ✅ | Hot reload functional |
| Docker build works | ✅ | Multi-stage build |
