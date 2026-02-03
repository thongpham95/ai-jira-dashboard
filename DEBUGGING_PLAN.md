# Debugging Report: Member Detail Page - All Stats Show 0

## Bug Description
When navigating from Resources -> View Report for a member, the Member Report page (`/resources/[userId]`) shows:
- Total Hours Logged: **0.0h**
- Avg Time / Task: **0.0h**
- Avg Bug Fix Time: **0.0h**
- Punctuality: **0%**
- Tasks Completed: **0**
- Assigned Tasks & Bugs: **(0)** - "No tasks found."

## Root Cause Analysis

### Primary Bug: URL-Encoded `accountId` in Dynamic Route

**Flow:**
1. Resources page renders a link: `/resources/${user.accountId}?name=...`
2. accountId contains a colon: `712020:933ba53e-92ef-447a-bb20-a7da48ff2085`
3. Browser navigates and may encode the colon as `%3A` in the URL path
4. Next.js App Router passes the param to the page via `use(params)`
5. The param value may still be URL-encoded: `712020%3A933ba53e-92ef-447a-bb20-a7da48ff2085`
6. Page builds JQL: `assignee = "712020%3A933ba53e-..."` (WRONG)
7. Jira API returns 0 results because `%3A` is not a valid accountId character

**Evidence:**
```
# With URL-encoded colon -> 0 results
JQL: assignee = "712020%3A933ba53e-..." -> 0 tasks

# With raw colon -> 14 results
JQL: assignee = "712020:933ba53e-..." -> 14 tasks
```

### Secondary Issue: `timespent = 0` for all tasks

For user `nam.doan`, all 14 assigned tasks have `timespent: 0`. This is valid Jira data - the member has not logged time on individual tasks. However, worklogs may exist separately (team logged time on issues this member was assigned to).

### Tertiary Issue: `statusCategory = Done` with 30-day window

KPI stats only count tasks with `statusCategory = Done AND updated >= 30 days ago`. If the member has no recently completed tasks, all KPIs show 0. This is correct behavior but may appear broken.

## Affected Files

| File | Issue |
|------|-------|
| `app/resources/[userId]/page.tsx` | Missing `decodeURIComponent()` on `userId` param |
| `app/resources/page.tsx` | Link `href` passes raw accountId (colon gets encoded by browser) |

## Fix

### 1. Decode userId in Member Report page
```typescript
// BEFORE (broken)
const { userId } = use(params);

// AFTER (fixed)
const { userId: rawUserId } = use(params);
const userId = decodeURIComponent(rawUserId);
```

### 2. Encode accountId in Resources page Link (best practice)
```typescript
// BEFORE
href={`/resources/${user.accountId}?name=...`}

// AFTER
href={`/resources/${encodeURIComponent(user.accountId)}?name=...`}
```

## Verification

After fix, test with multiple users including those with colons in accountId:
- `712020:933ba53e-...` (nam.doan) - previously broken
- `712020:f0ef415e-...` (Quynh Vu) - had data
- `712020:32a1b1fb-...` (Henry) - had data

## Test Cases to Add

1. Member with 0 logged hours but assigned tasks -> should show tasks, 0.0h
2. Member with logged hours -> should show correct total
3. Member with no completed tasks in 30 days -> KPIs show 0, but task list shows all assigned tasks
4. AccountId with special characters (colon) -> decoded correctly in JQL
