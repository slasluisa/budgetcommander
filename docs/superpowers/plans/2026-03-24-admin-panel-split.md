# Admin Panel Budget/Polls Tab Split — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the admin panel's "Seasons" tab into separate "Budget" and "Polls" tabs so the season budget is clearly visible and adjustable, distinct from poll management.

**Architecture:** UI-only refactor of `admin-panel.tsx`. The existing `SeasonsTab` component is replaced by two new components: `BudgetTab` and `PollsTab`. The server component `page.tsx` gains a poll vote aggregation query. No data model or API changes.

**Tech Stack:** Next.js, React, Prisma, TypeScript, shadcn/ui components (Tabs, Card, Badge, Button, Input)

**Spec:** `docs/superpowers/specs/2026-03-24-admin-panel-split-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/app/admin/page.tsx` | Modify | Add poll vote count query, derive current season, pass new props |
| `src/app/admin/admin-panel.tsx` | Modify | Replace `SeasonsTab` with `BudgetTab` and `PollsTab`, update tab structure and types |

No new files. Both new components (`BudgetTab`, `PollsTab`) live in `admin-panel.tsx` alongside the existing `DisputesTab` and `UsersTab`.

---

### Task 1: Add poll vote aggregation query to page.tsx

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Add poll vote count query**

In the `Promise.all` in `AdminPage`, add a query to fetch the current season (most recent by `createdAt`) and its poll vote counts grouped by choice. Replace the existing `seasons` query with a single current-season fetch plus the vote aggregation.

```typescript
// Replace the existing seasons query with:
const currentSeason = await prisma.season.findFirst({
  orderBy: { createdAt: "desc" },
});

// Add vote counts query (only if there's a current season):
const pollVoteCounts = currentSeason
  ? await prisma.pollVote.groupBy({
      by: ["choice"],
      where: { seasonId: currentSeason.id },
      _count: { choice: true },
    })
  : [];
```

- [ ] **Step 2: Transform vote counts into a simple array**

```typescript
const voteCounts = pollVoteCounts.map((v) => ({
  choice: v.choice,
  count: v._count.choice,
}));
```

- [ ] **Step 3: Update AdminPanel props**

Pass `currentSeason` and `voteCounts` instead of `seasons`:

```tsx
<AdminPanel
  currentSeason={currentSeason ? JSON.parse(JSON.stringify(currentSeason)) : null}
  voteCounts={voteCounts}
  disputedGames={JSON.parse(JSON.stringify(disputedGames))}
  users={users}
/>
```

- [ ] **Step 4: Verify the app compiles**

Run: `npx next build` or check the dev server for errors.
Expected: Type errors in `admin-panel.tsx` since props changed — that's expected and will be fixed in Task 2.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin): fetch current season and poll vote counts"
```

---

### Task 2: Update AdminPanel types and tab structure

**Files:**
- Modify: `src/app/admin/admin-panel.tsx`

- [ ] **Step 1: Update types and AdminPanel props**

Replace the `Season` type usage and update `AdminPanel` to accept the new props:

```typescript
type VoteCount = { choice: number; count: number };

export function AdminPanel({
  currentSeason,
  voteCounts,
  disputedGames,
  users,
}: {
  currentSeason: Season | null;
  voteCounts: VoteCount[];
  disputedGames: DisputedGame[];
  users: User[];
}) {
```

- [ ] **Step 2: Replace tabs**

Update the `Tabs` component to use "budget" and "polls" instead of "seasons":

```tsx
<Tabs defaultValue="budget">
  <TabsList className="bg-muted border border-border">
    <TabsTrigger value="budget">Budget</TabsTrigger>
    <TabsTrigger value="polls">Polls</TabsTrigger>
    <TabsTrigger value="disputes">
      Disputes {disputedGames.length > 0 && `(${disputedGames.length})`}
    </TabsTrigger>
    <TabsTrigger value="users">Users</TabsTrigger>
  </TabsList>

  <TabsContent value="budget">
    <BudgetTab currentSeason={currentSeason} onRefresh={() => router.refresh()} />
  </TabsContent>

  <TabsContent value="polls">
    <PollsTab currentSeason={currentSeason} voteCounts={voteCounts} onRefresh={() => router.refresh()} />
  </TabsContent>

  <TabsContent value="disputes">
    <DisputesTab games={disputedGames} onRefresh={() => router.refresh()} />
  </TabsContent>

  <TabsContent value="users">
    <UsersTab users={users} onRefresh={() => router.refresh()} />
  </TabsContent>
</Tabs>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/admin-panel.tsx
git commit -m "feat(admin): update AdminPanel props and tab structure for budget/polls split"
```

---

### Task 3: Implement BudgetTab component

**Files:**
- Modify: `src/app/admin/admin-panel.tsx`

- [ ] **Step 1: Write BudgetTab**

Replace `SeasonsTab` with `BudgetTab`. This component handles: create season, display current season name + budget, end season.

```typescript
function BudgetTab({ currentSeason, onRefresh }: { currentSeason: Season | null; onRefresh: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function createSeason() {
    if (!name) return;
    setLoading(true);
    try {
      await fetch("/api/admin/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setName("");
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  async function endSeason() {
    if (!currentSeason) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/seasons/${currentSeason.id}/end`, { method: "POST" });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  const showCreateForm = !currentSeason || currentSeason.status === "COMPLETED";

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Season Budget</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreateForm ? (
          <>
            {currentSeason?.status === "COMPLETED" && (
              <div className="rounded-lg bg-muted/20 p-3">
                <span className="font-medium">{currentSeason.name}</span>
                <Badge variant="outline" className="ml-2 border-border text-muted-foreground">
                  COMPLETED
                </Badge>
                {currentSeason.budgetCap && (
                  <span className="ml-2 text-sm text-muted-foreground">${currentSeason.budgetCap}</span>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New season name..."
                className="bg-muted border-border"
              />
              <Button onClick={createSeason} disabled={loading || !name}>
                Create Season
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between rounded-lg bg-muted/20 p-3">
            <div>
              <span className="font-medium text-lg">{currentSeason.name}</span>
              <Badge
                variant="outline"
                className={`ml-2 ${
                  currentSeason.status === "ACTIVE"
                    ? "border-green-500/30 text-green-400"
                    : "border-yellow-500/30 text-yellow-400"
                }`}
              >
                {currentSeason.status}
              </Badge>
              {currentSeason.status === "ACTIVE" && currentSeason.budgetCap ? (
                <span className="ml-3 text-2xl font-bold">${currentSeason.budgetCap} Budget</span>
              ) : (
                <span className="ml-3 text-sm text-muted-foreground">Awaiting poll result</span>
              )}
            </div>
            <Button size="sm" variant="destructive" onClick={endSeason} disabled={loading}>
              End Season
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Remove old SeasonsTab function**

Delete the entire `SeasonsTab` function (lines 56-163 of the current file).

- [ ] **Step 3: Verify the app compiles and renders**

Run the dev server, navigate to `/admin`, confirm the Budget tab shows correctly.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/admin-panel.tsx
git commit -m "feat(admin): implement BudgetTab component for season lifecycle"
```

---

### Task 4: Implement PollsTab component

**Files:**
- Modify: `src/app/admin/admin-panel.tsx`

- [ ] **Step 1: Write PollsTab**

This component shows vote breakdown when polling, lock poll button with tie-breaking, and read-only results when active/completed.

```typescript
function PollsTab({
  currentSeason,
  voteCounts,
  onRefresh,
}: {
  currentSeason: Season | null;
  voteCounts: VoteCount[];
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function lockPoll(choice?: number) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/poll/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(choice ? { choice } : {}),
      });
      const data = await res.json();
      if (res.status === 409 && data.tied) {
        const pick = prompt(`Tie between: $${data.tied.join(", $")}. Enter the winning amount:`);
        if (pick) await lockPoll(parseInt(pick));
        return;
      }
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  if (!currentSeason || currentSeason.status === "COMPLETED" && voteCounts.length === 0) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center text-muted-foreground">
          No active poll. Create a season from the Budget tab to start one.
        </CardContent>
      </Card>
    );
  }

  const totalVotes = voteCounts.reduce((sum, v) => sum + v.count, 0);
  const isPolling = currentSeason.status === "POLLING";

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>{isPolling ? "Active Poll" : "Poll Results"} — {currentSeason.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {voteCounts.length === 0 ? (
          <p className="text-muted-foreground">No votes yet.</p>
        ) : (
          <div className="space-y-2">
            {[20, 50, 100].map((choice) => {
              const vote = voteCounts.find((v) => v.choice === choice);
              const count = vote?.count ?? 0;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const isWinner = !isPolling && currentSeason.budgetCap === choice;
              return (
                <div
                  key={choice}
                  className={`flex items-center justify-between rounded-lg p-3 ${
                    isWinner ? "bg-green-500/10 border border-green-500/30" : "bg-muted/20"
                  }`}
                >
                  <span className="font-medium">
                    ${choice}
                    {isWinner && <Badge className="ml-2 bg-green-500/20 text-green-400">Winner</Badge>}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {count} vote{count !== 1 ? "s" : ""} ({pct}%)
                  </span>
                </div>
              );
            })}
            <p className="text-sm text-muted-foreground">{totalVotes} total vote{totalVotes !== 1 ? "s" : ""}</p>
          </div>
        )}

        {isPolling && (
          <Button onClick={() => lockPoll()} disabled={loading}>
            Lock Poll
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify both tabs render correctly**

Run the dev server, navigate to `/admin`:
- Budget tab: shows current season or create form
- Polls tab: shows vote breakdown or empty state

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/admin-panel.tsx
git commit -m "feat(admin): implement PollsTab component with vote breakdown and lock"
```

---

### Task 5: Manual verification and cleanup

**Files:**
- Review: `src/app/admin/admin-panel.tsx`, `src/app/admin/page.tsx`

- [ ] **Step 1: Test all states in the admin panel**

Walk through these scenarios in the dev server:
1. No season exists → Budget tab shows create form, Polls tab shows empty state
2. Season in POLLING → Budget shows "Awaiting poll result", Polls shows vote counts + Lock button
3. Lock the poll → Budget updates to show budget cap, Polls shows read-only results with winner
4. End the season → Budget shows completed info + create form, Polls shows results or empty state

- [ ] **Step 2: Verify Disputes and Users tabs are unchanged**

Navigate to Disputes and Users tabs, confirm they still work as before.

- [ ] **Step 3: Run build**

Run: `npx next build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit any remaining fixes**

If any fixes were needed during verification:
```bash
git add src/app/admin/
git commit -m "fix(admin): address issues found during manual verification"
```
