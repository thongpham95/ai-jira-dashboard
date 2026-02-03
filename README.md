# Internal Jira Project Management Dashboard

A comprehensive dashboard for Project Managers to track progress, workload, and efficiency using Jira data.

## Features
- **Dashboard Overview:** Aggregated stats, activity stream, and JQL search.
- **Project Details:** Burndown charts, status distribution, and sprint velocity.
- **Resource Management:** Member allocation, workload analysis, and efficiency reports.
- **Tech Stack:** Next.js 14, TypeScript, Tailwind CSS (Minimalist), Shadcn UI, Recharts.

## Getting Started

1. **Prerequisites:**
   - Node.js 18+ installed.
   - A Jira account with an API Token.

2. **Setup Credentials:**
   Copy `.env.local.example` to `.env.local` and fill in your details:
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local`:
   ```env
   JIRA_HOST=https://your-domain.atlassian.net
   JIRA_EMAIL=your-email@example.com
   JIRA_API_TOKEN=your-api-token
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Project Structure
- `app/`: Next.js App Router pages and API routes.
- `components/`: UI components, charts, and layout.
- `lib/`: Utilities and Jira client configuration.

## Key metrics
- **Burndown:** Tracks sprint progress.
- **Punctuality:** Percentage of tasks completed on or before due date.
- **Bug Fix Time:** Average time spent resolving bugs.
