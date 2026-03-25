# Admin Panel: Split Seasons into Budget and Polls Tabs

## Problem

The admin panel's Seasons tab combines season budget management and poll management into a single view. There is no clear distinction between configuring the season budget and managing the player poll. This makes it hard to quickly find and adjust the budget.

## Approach

UI-only reorganization. The data model (`Season` with `status: POLLING | ACTIVE | COMPLETED`, `budgetCap`, and related `PollVote` records) stays unchanged. The single "Seasons" tab splits into two top-level tabs.

## Design

### Tab Structure

Current: **Seasons | Disputes | Users**
New: **Budget | Polls | Disputes | Users**

### Budget Tab

Owns the season lifecycle: creation, budget visibility, and ending seasons.

**States:**

| Condition | Display |
|---|---|
| No active/polling season | "Create Season" form (name input + button) |
| Season in `POLLING` | Season name, budget status "Awaiting poll result", End Season button |
| Season is `ACTIVE` | Season name, budget cap displayed prominently (e.g. "$50 Budget"), End Season button |
| Most recent season is `COMPLETED` | Show completed season info, Create Season button for a new one |

### Polls Tab

Manages the voting phase. Read-only view when no poll is active.

**States:**

| Condition | Display |
|---|---|
| Season in `POLLING` | Vote breakdown (counts per $20, $50, $100 option), Lock Poll button |
| No season polling | Empty state: "No active poll. Create a season from the Budget tab to start one." |
| Season is `ACTIVE` or `COMPLETED` | Final poll results displayed read-only (what was voted, what won) |

### Behavior

- **Locking a poll** (from Polls tab) still auto-sets the season's `budgetCap` and transitions status from `POLLING` to `ACTIVE`. The Budget tab reflects the new value immediately.
- **Creating a season** (from Budget tab) creates it in `POLLING` status, same as today.
- **Ending a season** (from Budget tab) sets status to `COMPLETED`, same as today.

### What Does Not Change

- Data model (Season, PollVote, SeasonStatus enum)
- API routes (`/api/admin/seasons`, `/api/admin/poll/lock`, `/api/admin/seasons/[id]/end`)
- Disputes and Users tabs
- User-facing poll page (`/poll`)

## Files to Modify

- `src/app/admin/admin-panel.tsx` — split Seasons tab into Budget and Polls tabs, restructure content
- `src/app/admin/page.tsx` — may need to pass poll vote data separately if not already available
