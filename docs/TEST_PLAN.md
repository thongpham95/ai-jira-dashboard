# Comprehensive Test Plan - Jira Dashboard

This document outlines the test cases for the Jira Dashboard application, specifically focusing on **Authentication**, **RBAC**, **Core Features**, and **UI/UX**.

---

## 🏗 Part 1: Authentication & Security

### 1. Login Flow
- [x] **Unauthenticated Access**
    - [x] Navigating to `/` (Home) redirects to the Login prompt/page.
    - [x] Navigating to protected routes (e.g., `/resources`) redirects to Login.
- [ ] **OAuth Login**
    - [x] Clicking "Login with Jira" initiates the Atlassian OAuth flow.
    - [x] User is redirected to Atlassian authorization page. (Attempted, halted by missing credentials).
    - [ ] After approval, user is redirected back to the app (`/`).
    - [ ] **Success State**: User is logged in, Header shows User Avatar.

### 2. Logout Flow
- [ ] **Logout Action**
    - [ ] Clicking User Avatar -> "Logout" clears the session.
    - [ ] User is returned to the unauthenticated state (Login button visible).
    - [ ] Accessing protected routes now triggers a redirect or access denied.

---

## 👥 Part 2: Role-Based Access Control (RBAC)

### 3. Admin View (e.g., Team Lead)
*Pre-requisite: Login with an account having `ADMINISTER_PROJECTS` permission.*
- [x] **Dashboard Overview**
    - [x] See full dashboard with "Active Projects", "Open Issues" stats.
    - [x] **Charts**: "Workload Distribution" and "Activity Stream" are visible.
    - [x] **Project Filter**: Can switch between "All Projects" and specific ones (e.g., `[TVT] PAYDAES`).

### 4. Member View (e.g., Standard User)
*Pre-requisite: Login with an account having standard `USER` permissions.*
- [x] **Personal Report Dashboard**
    - [x] Home page (`/`) automatically renders the **Member Report View**.
    - [x] **No Global Stats**: Does NOT see team workload or global project lists.
    - [x] **My Stats**: Sees "Total Hours Logged", "Avg Time/Task", "Punctuality" for *themselves*.
    - [x] **My Tasks**: "Participated Tasks" table lists issues *they* worked on.

---

## 📊 Part 3: Core Features & Logic

### 5. Data Accuracy (Member Report)
- [x] **Worklog Attribution**
    - [x] **Scenario**: User logs 2h on a task assigned to someone else.
    - [x] **Expectation**: "Total Hours" increases by 2h. Task appears in "Participated Tasks".
- [x] **KPI Calculations**
    - [x] **Avg Time/Task**: Formula = `Total Hours / Completed Participated Tasks`.
    - [x] **Punctuality**: Formula = `(Tasks Done On Time / Total Tasks with Due Date) * 100`.
- [x] **Filtering**
    - [x] Data correctly respects the default "30 Days" window.

### 6. Search Functionality
- [x] **Global Search**
    - [x] Entering JQL in the Header search bar navigates to `/search`.
    - [x] Results table displays correct issues matching the JQL.

---

## 🎨 Part 4: UI/UX & Localization

### 7. Interface
- [x] **Theme Switching**
    - [x] Toggle Light/Dark mode. App theme updates instantly.
- [x] **Localization (i18n)**
    - [x] Switch Language to "Vietnamese".
    - [x] Header buttons change ("Đăng xuất", "Cài đặt").
    - [x] Dashboard titles change ("Tổng quan", "Báo cáo thành viên").
- [x] **Loading States**
    - [x] Verify `LoadingAnimation` (spinner) appears during data fetch or page transitions.
