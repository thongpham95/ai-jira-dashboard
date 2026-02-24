# Bug Report

## Status
RESOLVED ✅

## Bug Title
Gemini 2.5 Pro returns empty response ("Unable to generate summary.")

## Root Cause
Gemini 2.5 Pro is a "thinking model" that uses internal reasoning tokens. With `maxOutputTokens: 2048`, the thinking tokens consumed the entire budget → `response.text` was empty.

## Fix Applied
- **File Changed**: `lib/ai.ts` — `generateExecutiveSummary()`
  - `maxOutputTokens`: 2048 → **8192** (allows longer, more detailed reports)
  - Added `thinkingConfig: { thinkingBudget: 4096 }` for Pro model
  - Replaced silent "Unable to generate summary." fallback with descriptive error

## Test Results
- ✅ **Gemini 2.5 Flash**: Generates report in ~15-20s, ~800-1000 chars
- ✅ **Gemini 2.5 Pro**: Generates report in ~60s, ~1000-1200 chars, detailed analysis with color-coded Epic progress
- ✅ Both models produce longer, more detailed reports than before
