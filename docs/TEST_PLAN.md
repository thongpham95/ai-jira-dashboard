# Comprehensive Test Plan - Jira Dashboard

This document outlines the test cases for the entire Jira Dashboard application, covering **Phases 1 through 10**.

---

## 0. Build & Static Analysis
- [x] **Build Check**
    - [x] `npm run build` completes without errors.
- [x] **Docker Package**
    - [x] `docker-compose build` completes successfully.
    - [ ] Container starts and serves traffic on port 3000.

## 🏗 Phase 1-5: Core Features

### 1. Dashboard Overview (`/`)
- [x] **Stat Cards**
    - [x] Displays "Active Projects", "Open Issues", "Critical Bugs", "Weekly Hours".
    - [x] "Weekly Hours" shows data for the last 7 days calculated from worklogs.
    - [x] "Open Issues" and "Critical Bugs" counts match Jira data (verify against `/api/issues/count`).
- [ ] **Project Filter**
    - [ ] Dropdown loads available projects from Jira.
    - [ ] Defaults to "PAYDAES" (if available).
    - [ ] Changing filter updates the "Workload Distribution" chart.
    - [ ] Changing filter updates the "Recent Activity" stream.
- [ ] **Activity Stream**
    - [ ] Shows recent 6 updated issues.
    - [ ] Issues link to Jira.
    - [ ] Work logs are correctly attributed.

### 2. Projects List (`/projects`)
- [ ] **List View**
    - [ ] Displays all projects with Avatar, Key, and Name.
    - [ ] "View Details" button links to correct Project Detail page (`/projects/[id]`).
- [ ] **UI States**
    - [ ] Loading skeletons appear while fetching data.
    - [ ] Error message displayed if API fails.

### 3. Project Detail (`/projects/[id]`)
- [ ] **Header Info**
    - [ ] Displays Project Name, Key, and Lead.
    - [ ] Shows "Current Sprint" name (extracted from active sprint issues).
- [ ] **Statistics**
    - [ ] Stat cards: "Issues", "Bugs", "Total Hours".
    - [ ] "Total Hours" calculated from last 30 days of worklogs for this project.
- [ ] **Charts & Tables**
    - [ ] "Workload" bar chart shows team distribution for this project.
    - [ ] "Status" pie chart shows issue status breakdown.
    - [ ] **Interactive Filter**: Clicking a slice in Status Pie Chart filters the Task Table below.
    - [ ] "Clear Filter" button resets the table view.
    - [ ] Task Table displays issues correctly with status badges.

### 4. Resources / Members (`/resources`)
- [x] **Member List**
    - [x] Displays list of users with Avatars and Emails.
    - [ ] **Bot Filtering**: Bots (e.g., "Atlassian Add-on") are hidden.
    - [ ] "Project Filter" works to filter the user list.
    - [ ] "View Report" button links to `/resources/[userId]`.

---

## 🛠 Phase 6-8: Refinements & Search

### 5. Global Search (`/search`)
- [ ] **Header Search**
    - [ ] Typing in top bar and hitting Enter navigates to `/search?query=...`.
- [ ] **Search Results**
    - [ ] Page executes JQL query from URL parameters.
    - [ ] Displays matching results in a sortable table.
    - [ ] **Error Handling**: Displays friendly error for invalid JQL.
    - [ ] **Dark Mode**: Error messages are readable in Dark Mode.

### 6. Settings (`/settings`)
- [ ] **Connection Check**
    - [ ] Shows Connection Status (Green/Connected).
    - [ ] Displays masked API Token and Host URL.
    - [ ] "Refresh Connection" button works.
- [ ] **Theme**
    - [ ] Toggle Light/Dark/System works correctly.
    - [ ] Application background, text, and charts update immediately.

---

## 🔗 Phase 9: Performance Charts & Links

### 7. Integration Features
- [ ] **Deep Links**
    - [ ] Issue Keys in all tables link to the actual Jira issue (open in new tab).
    - [ ] Project Keys link to the Jira project page.
    - [ ] `jiraHost` is correctly passed from environmental variables.

### 8. Enhanced Member Charts
- [ ] **Visualization**
    - [ ] "Tasks Completed per Week" (Bar Chart) loads correct historical data.
    - [ ] "Hours Logged per Week" (Area Chart) loads correct historical data.
    - [ ] Charts handle empty data weeks gracefully (show 0).

---

## 🚀 Phase 10: Advanced Employee Metrics

### 9. Unit Tests (Backend Logic)
Kiểm tra logic tính toán các chỉ số trong `app/api/reports/member/route.ts`.

- [ ] **Calculate Average Time Per Task**
    - [ ] Input: 2 tasks (1h, 2h). Expect: 1.5h.
    - [ ] Input: 0 tasks. Expect: 0.
- [ ] **Calculate Average Bug Fix Time**
    - [ ] Input: 1 Bug (Cycle Time: 4h), 1 Task (Time Spent: 2h - ignored). Expect: 4h.
    - [ ] Input: Bug with no resolution date. Expect: Ignored or fallback to Time Spent.
- [ ] **Calculate Punctuality**
    - [ ] Input: 1 Task (Due: Today, Resolved: Yesterday) -> On Time.
    - [ ] Input: 1 Task (Due: Yesterday, Resolved: Today) -> Late.
    - [ ] Input: Task with no Due Date. Expect: Ignored from denominator.
- [ ] **Calculate Consistency (Standard Deviation)**
    - [ ] Input: Weekly Counts [5, 5, 5, 5]. Expect: StdDev = 0, Consistency Score = 100.
    - [ ] Input: Weekly Counts [0, 10, 0, 10]. Expect: High StdDev, Low Consistency Score.
- [ ] **Calculate Radar Scores (Normalization)**
    - [ ] Check mapping of raw metrics to 0-100 scale.
    - [ ] Verify caps (score never > 100 or < 0).

### 11. Phase 11: Dual-Query Logic Verification
- [x] **Worklog Attribution (Precision)**
    - [x] **Scenario 1**: User A logs 2h on Task 1 (Assigned to User B).
        - [x] User A Report: Shows +2h logged.
        - [x] User B Report: Shows 0h logged (if they didn't work on it).
    - [x] **Scenario 2**: Task has 10h total spent (5h by A, 5h by B).
        - [x] User A Report -> Total Hours = 5h.
        - [x] User B Report -> Total Hours = 5h.
- [x] **Date Filtering**
    - [x] Worklog from last month on a task updated today -> Should NOT be counted in "Last 30 Days" report.
    - [x] Worklog from today on a task closed yesterday (reopened/logged late) -> Should be counted.

### 10. API Integration Tests (`/api/reports/member`)
- [ ] **Response Structure**
    - [ ] `metrics` object contains: `avgTimePerTaskSeconds`, `avgBugFixTimeSeconds`, `punctualityPercentage`, `totalCompleted`, `totalBugsFixed`.
    - [ ] `radarData` is an array of 5 objects (Punctuality, Speed, Volume, Bug Fix Rate, Consistency).
    - [ ] `radarData` objects contain both `A` (Member) and `B` (Team) values.
- [ ] **Data Validity**
    - [ ] `weeklyCompletions` and `weeklyHours` arrays have 8 items (last 8 weeks).
    - [ ] Team values (`B`) in `radarData` are non-negative.
- [ ] **Error Handling**
    - [ ] Request without `userId` -> Returns 400.
    - [ ] Request with invalid `days` -> Handled gracefully (default 30).

### 12. Phase 12: Worklog Transparency
- [x] **Worklog History Table**
    - [x] Displays table with columns: Date, Task, Hours, Note.
    - [x] Rows match the "Total Hours" count.
    - [x] Sorting by Date works (default descending).
- [x] **Metric Formulas**
    - [x] Stat Cards have tooltips (or visible captions) with formulas.
    - [x] Verify text: "Total Hours = Sum(Worklogs)", etc.
### 13. Phase 13: Worklog-Centric Performance
- [x] **Participated Tasks only**
    - [x] Task list only shows issues where user logged work.
    - [x] Verify issues assigned to user but with NO worklog are excluded.
- [x] **Metrics Alignment**
    - [x] "Tasks Completed" counts Participated Tasks that are Done.
    - [x] "Avg Time" uses Total Logged Hours / Participated Done Tasks.
    - [x] "Punctuality" checks ONLY participated tasks.
- [x] **Visualization**
    - [x] 5 Stat Cards are displayed in a grid.
    - [x] Values match the API response.
- [x] **Tooltips (New)**
    - [x] Hovering over the Info (i) icon on "Total Hours Logged" shows correct tooltip text.
    - [x] Hovering over "Avg Time/Task" shows explanation.
    - [x] Hovering over "Avg Bug Fix Time" explains "Cycle Time".
    - [x] Hovering over "Punctuality" explains "% On Time".

#### 11.2 Performance Radar Chart
- [x] **Rendering**
    - [x] Chart displays a Spider/Radar graph.
    - [x] **Comparison**: Two data polygons are visible: "Member" (Teal) and "Team Avg" (Gray).
    - [x] Legend clearly distinguishes Member vs Team.
    - [x] Axes have correct labels (Punctuality, Speed, etc.).
- [x] **Data Accuracy**
    - [x] Visual points correspond roughly to the scores in the API.

#### 11.3 Member Task Table (Deep Dive)
- [ ] **Sorting**
    - [ ] Clicking "Logged" column header sorts tasks by Time Spent.
    - [ ] Clicking "ID" sorts by Issue Key.
- [x] **Progress Bar (Visual Progress)**
    - [x] Tasks with `Original Estimate` show a progress bar.
    - [x] Tasks where Time Spent < Estimate show a partial bar.
    - [x] Tasks where Time Spent > Estimate show a full bar.
- [ ] **Links**
    - [ ] Clicking Issue ID opens Jira in a new tab.

### 12. Browser / Cross-Device Tests
- [ ] **Responsive Design**
    - [ ] Mobile View: Radar chart stacks correctly below Stat Cards.
    - [ ] Mobile View: Table scrolls horizontally if needed.
- [ ] **Theme**
    - [ ] Check Dark Mode visibility (contrasts for Radar Chart lines and Tooltips).
