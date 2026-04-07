# Test Plan

## Feature 1: Real-Time Active Tasks Visualization (Phase 23)
- [ ] **TC1.1**: UI Component displays `Real-time Active Tasks` list on the Admin Dashboard.
- [ ] **TC1.2**: Active Tasks fetch the `/api/reports/active-tasks` endpoint without errors.
- [ ] **TC1.3**: The widget displays tasks grouped by Assignee, showing avatars, names, issues keys, summaries, statuses, and time in status.
- [ ] **TC1.4**: Widget auto-refreshes data (simulated or observed over 30 seconds).
- [ ] **TC1.5**: Supports translations (vi/en) correctly without type errors.

## Feature 2: Peer Comparison & Enhancements (Phase 24)
- [ ] **TC2.1**: UI displays team average values for Cycle Time and First Time Pass Rate in the Performance Dashboard table.
- [ ] **TC2.2**: Trend indicators (↑/↓) correctly show if a member is performing better or worse than the team average.
- [ ] **TC2.3**: AI Performance Review accurately receives and mentions Team Averages compared to Individual metrics in the generated report.

## Regression
- [ ] **TC3.1**: `Build` runs successfully without any type errors.
- [ ] **TC3.2**: Existing features (Member Report UI, AI Standup, etc.) continue to work unaffected.
