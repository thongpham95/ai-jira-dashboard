# Bug Report

## Status
RESOLVED ✅

## Bug Title
Performance Dashboard hiển thị 0 data cho tất cả tab — changelog không được trả về từ Jira API

## Bug Description
Trang Performance hiển thị "Issues phân tích: 1287" nhưng Developer (0), Tech Lead (0), QC (0).
AI Review cũng không có dữ liệu vì metrics = 0.

## Root Cause Analysis

**Cả hai Jira search endpoint đều KHÔNG trả changelog:**
- `POST /search/jql` (mới) — `expand=changelog` không hoạt động (trả `changelog: undefined`)
- `POST /search` (cũ) — đã bị deprecated/removed, trả 400 Invalid payload

## Fix Applied

**Two-step approach:** Search issues (no changelog) → Fetch changelogs riêng per-issue.

### Files Changed:
1. **`lib/jira.ts`**:
   - Thêm `fetchIssueChangelog()` — GET `/rest/api/3/issue/{key}/changelog` với retry cho 429
   - Sửa `searchAllJiraWithChangelog()` — batch 5 requests + 200ms delay giữa batches
   - Xóa legacy search endpoint code

2. **`lib/jira-performance.ts`**:
   - Import `searchAllJiraWithChangelog` thay vì `searchAllJira`
   - Cleanup debug logs

### Test Results:
- ✅ `POST /api/performance 200` — 460 issues, 3316 transitions, 400 issues có changelog
- ✅ `POST /api/ai/performance-review 200` — AI review thành công
- ✅ Build pass
- ✅ Status names khớp với hardcoded list (TODO, IN PROGRESS, CODE REVIEW, DONE CODE REVIEW, MERGED TO QC, TASK DONE / BUG FIXED, TVT INTERNAL REVIEW, REOPEN, CLOSED)
