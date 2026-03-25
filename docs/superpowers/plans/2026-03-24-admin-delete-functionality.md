# Admin Delete Functionality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give admins the ability to delete seasons, poll votes, games, and users with appropriate guard rails and confirmation dialogs.

**Architecture:** Add `onDelete: Cascade/SetNull` to Prisma schema relations, create four DELETE API endpoints following the existing route handler pattern, install shadcn AlertDialog, then update the admin panel UI with delete buttons and a new Games tab.

**Tech Stack:** Next.js 16, Prisma 7, React 19, shadcn/ui, Tailwind CSS 4

---

### Task 1: Add cascade rules to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add onDelete to PollVote relations**

In `prisma/schema.prisma`, update the PollVote model's relation fields:

```prisma
  season Season @relation(fields: [seasonId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
```

- [ ] **Step 2: Add onDelete to Game relations**

```prisma
  season    Season       @relation(fields: [seasonId], references: [id], onDelete: Cascade)
  createdBy User         @relation("GameCreator", fields: [createdById], references: [id], onDelete: Cascade)
```

- [ ] **Step 3: Add onDelete to GamePlayer relations**

```prisma
  game Game  @relation(fields: [gameId], references: [id], onDelete: Cascade)
  user User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  deck Deck? @relation(fields: [deckId], references: [id], onDelete: SetNull)
```

- [ ] **Step 4: Add onDelete to Deck relation**

```prisma
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

- [ ] **Step 5: Generate migration and Prisma client**

```bash
npx prisma migrate dev --name add-cascade-deletes
```

Expected: Migration created successfully, Prisma client regenerated.

- [ ] **Step 6: Commit**

```bash
git add prisma/
git commit -m "feat(schema): add cascade delete rules for admin cleanup"
```

---

### Task 2: Create DELETE /api/admin/seasons/[id] endpoint

**Files:**
- Create: `src/app/api/admin/seasons/[id]/route.ts`

- [ ] **Step 1: Create the route handler**

Create `src/app/api/admin/seasons/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const season = await prisma.season.findUnique({ where: { id } });
  if (!season) {
    return NextResponse.json({ error: "Season not found" }, { status: 404 });
  }

  if (season.status === "ACTIVE") {
    return NextResponse.json(
      { error: "Cannot delete an ACTIVE season. End it first." },
      { status: 400 }
    );
  }

  await prisma.season.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/seasons/[id]/route.ts
git commit -m "feat(api): add DELETE /api/admin/seasons/[id] endpoint"
```

---

### Task 3: Create DELETE /api/admin/poll/votes/[id] endpoint

**Files:**
- Create: `src/app/api/admin/poll/votes/[id]/route.ts`

- [ ] **Step 1: Create the route handler**

Create `src/app/api/admin/poll/votes/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const vote = await prisma.pollVote.findUnique({ where: { id } });
  if (!vote) {
    return NextResponse.json({ error: "Vote not found" }, { status: 404 });
  }

  await prisma.pollVote.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/poll/votes/
git commit -m "feat(api): add DELETE /api/admin/poll/votes/[id] endpoint"
```

---

### Task 4: Create DELETE /api/admin/games/[id] endpoint

**Files:**
- Create: `src/app/api/admin/games/[id]/route.ts`

- [ ] **Step 1: Create the route handler**

Create `src/app/api/admin/games/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  await prisma.game.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/games/[id]/route.ts
git commit -m "feat(api): add DELETE /api/admin/games/[id] endpoint"
```

---

### Task 5: Create DELETE /api/admin/users/[id] endpoint

**Files:**
- Create: `src/app/api/admin/users/[id]/route.ts`

- [ ] **Step 1: Create the route handler**

Create `src/app/api/admin/users/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.role === "ADMIN") {
    return NextResponse.json(
      { error: "Cannot delete an admin user" },
      { status: 400 }
    );
  }

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Cannot delete yourself" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/users/[id]/route.ts
git commit -m "feat(api): add DELETE /api/admin/users/[id] endpoint"
```

---

### Task 6: Install shadcn AlertDialog component

**Files:**
- Create: `src/components/ui/alert-dialog.tsx` (generated by shadcn CLI)

- [ ] **Step 1: Install AlertDialog**

```bash
npx shadcn@latest add alert-dialog
```

Expected: `src/components/ui/alert-dialog.tsx` created.

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/alert-dialog.tsx
git commit -m "feat(ui): add shadcn AlertDialog component"
```

---

### Task 7: Update admin page.tsx data fetching

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Add individual poll votes and all games queries**

In `src/app/admin/page.tsx`, update the `Promise.all` to include:

1. Individual poll vote records (replace the `groupBy` with a `findMany` that gets both individual records and can still compute counts client-side)
2. All games for the new Games tab

Replace the existing data fetching block:

```typescript
  const [pollVotes, allGames, disputedGames, users] = await Promise.all([
    currentSeason
      ? prisma.pollVote.findMany({
          where: { seasonId: currentSeason.id },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { choice: "asc" },
        })
      : Promise.resolve([]),
    prisma.game.findMany({
      include: {
        players: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        season: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.game.findMany({
      where: { status: "DISPUTED" },
      include: {
        players: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        season: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true, banned: true },
    }),
  ]);
```

Remove the `voteCounts` mapping line (`const voteCounts = rawVotes.map(...)`).

Update the `AdminPanel` props to pass the new data:

```tsx
<AdminPanel
  currentSeason={currentSeason ? JSON.parse(JSON.stringify(currentSeason)) : null}
  pollVotes={JSON.parse(JSON.stringify(pollVotes))}
  allGames={JSON.parse(JSON.stringify(allGames))}
  disputedGames={JSON.parse(JSON.stringify(disputedGames))}
  users={users}
  currentUserId={session.user.id}
/>
```

Note: `currentUserId` is needed so the Users tab can hide the delete button for the logged-in admin.

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin): expand data fetching for delete functionality and games tab"
```

---

### Task 8: Update AdminPanel component — types, props, and confirmation dialog helper

**Files:**
- Modify: `src/app/admin/admin-panel.tsx`

- [ ] **Step 1: Update types and AdminPanel props**

At the top of `src/app/admin/admin-panel.tsx`, update/add types:

```typescript
type PollVoteRecord = {
  id: string;
  choice: number;
  user: { id: string; name: string };
};
type GameRecord = {
  id: string;
  createdAt: string;
  status: string;
  season: { name: string };
  players: { userId: string; user: { id: string; name: string }; isWinner: boolean }[];
};
```

Update the `AdminPanel` function signature to accept:

```typescript
export function AdminPanel({
  currentSeason,
  pollVotes,
  allGames,
  disputedGames,
  users,
  currentUserId,
}: {
  currentSeason: Season | null;
  pollVotes: PollVoteRecord[];
  allGames: GameRecord[];
  disputedGames: DisputedGame[];
  users: User[];
  currentUserId: string;
})
```

- [ ] **Step 2: Add imports for AlertDialog**

Add at the top of the file:

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
```

- [ ] **Step 3: Add the Games tab to the TabsList and TabsContent**

In the `AdminPanel` return, add a Games tab trigger between Disputes and Users in the `TabsList`:

```tsx
<TabsTrigger value="games">Games</TabsTrigger>
```

Add the Games tab content:

```tsx
<TabsContent value="games">
  <GamesTab games={allGames} onRefresh={() => router.refresh()} />
</TabsContent>
```

- [ ] **Step 4: Update PollsTab and UsersTab props in the render**

Update the `PollsTab` call to pass `pollVotes` instead of `voteCounts`:

```tsx
<PollsTab currentSeason={currentSeason} pollVotes={pollVotes} onRefresh={() => router.refresh()} />
```

Update the `UsersTab` call to pass `currentUserId`:

```tsx
<UsersTab users={users} currentUserId={currentUserId} onRefresh={() => router.refresh()} />
```

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/admin-panel.tsx
git commit -m "feat(admin): update types, props, and tab structure for delete functionality"
```

---

### Task 9: Update BudgetTab with delete button

**Files:**
- Modify: `src/app/admin/admin-panel.tsx` (BudgetTab function)

- [ ] **Step 1: Add delete handler to BudgetTab**

Add a `deleteSeason` async function inside `BudgetTab`:

```typescript
  async function deleteSeason() {
    if (!currentSeason) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/seasons/${currentSeason.id}`, { method: "DELETE" });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }
```

- [ ] **Step 2: Add delete button with AlertDialog to the season display**

In the non-create-form branch (where season is POLLING or ACTIVE), add a delete button wrapped in AlertDialog next to the "End Season" button. For ACTIVE seasons, the button is disabled.

Add after the existing "End Season" `<Button>`, inside the same flex container:

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button
      size="sm"
      variant="outline"
      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
      disabled={loading || currentSeason.status === "ACTIVE"}
      title={currentSeason.status === "ACTIVE" ? "End season before deleting" : undefined}
    >
      Delete
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete season "{currentSeason.name}"?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete this season and all associated poll votes and games. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={deleteSeason} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

Also add a delete button for COMPLETED seasons in the `showCreateForm` branch, next to the completed season display.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/admin-panel.tsx
git commit -m "feat(admin): add season delete button to BudgetTab"
```

---

### Task 10: Update PollsTab to show individual votes with delete

**Files:**
- Modify: `src/app/admin/admin-panel.tsx` (PollsTab function)

- [ ] **Step 1: Update PollsTab signature and compute vote counts from individual records**

Change the PollsTab props from `voteCounts: VoteCount[]` to `pollVotes: PollVoteRecord[]`:

```typescript
function PollsTab({
  currentSeason,
  pollVotes,
  onRefresh,
}: {
  currentSeason: Season | null;
  pollVotes: PollVoteRecord[];
  onRefresh: () => void;
}) {
```

Compute vote counts from individual records inside the component:

```typescript
  const voteCounts = [20, 50, 100].map((choice) => ({
    choice,
    count: pollVotes.filter((v) => v.choice === choice).length,
  }));
  const totalVotes = pollVotes.length;
```

Update the `noActivePoll` check to use `pollVotes.length`:

```typescript
  const noActivePoll = !currentSeason || (currentSeason.status !== "POLLING" && pollVotes.length === 0);
```

- [ ] **Step 2: Add delete vote handler**

```typescript
  async function deleteVote(voteId: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/poll/votes/${voteId}`, { method: "DELETE" });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }
```

- [ ] **Step 3: Add individual votes list below the aggregated view**

After the existing aggregated vote bars and total count, add:

```tsx
{pollVotes.length > 0 && (
  <div className="space-y-1 pt-2 border-t border-border">
    <p className="text-sm font-medium text-muted-foreground mb-2">Individual Votes</p>
    {pollVotes.map((vote) => (
      <div key={vote.id} className="flex items-center justify-between rounded-md bg-muted/10 px-3 py-1.5 text-sm">
        <span>
          {vote.user.name} — <span className="text-muted-foreground">${vote.choice}</span>
        </span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10" disabled={loading}>
              Remove
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {vote.user.name}'s vote?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove their ${vote.choice} vote. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteVote(vote.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/admin-panel.tsx
git commit -m "feat(admin): show individual poll votes with delete in PollsTab"
```

---

### Task 11: Create GamesTab component

**Files:**
- Modify: `src/app/admin/admin-panel.tsx` (add GamesTab function)

- [ ] **Step 1: Create the GamesTab function**

Add a new `GamesTab` function component in `admin-panel.tsx`:

```typescript
function GamesTab({ games, onRefresh }: { games: GameRecord[]; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);

  async function deleteGame(gameId: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/games/${gameId}`, { method: "DELETE" });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  if (games.length === 0) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center text-muted-foreground">
          No games recorded.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>All Games</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {games.map((game) => (
          <div key={game.id} className="flex items-center justify-between rounded-lg bg-muted/20 p-3">
            <div>
              <span className="font-medium">{game.season.name}</span>
              <span className="mx-2 text-muted-foreground">&middot;</span>
              <span className="text-sm text-muted-foreground">
                {new Date(game.createdAt).toLocaleDateString()}
              </span>
              <Badge
                variant="outline"
                className={`ml-2 ${
                  game.status === "CONFIRMED"
                    ? "border-green-500/30 text-green-400"
                    : game.status === "DISPUTED"
                      ? "border-red-500/30 text-red-400"
                      : "border-yellow-500/30 text-yellow-400"
                }`}
              >
                {game.status}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {game.players.map((p) => p.user.name).join(", ")}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  disabled={loading}
                >
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this game?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this game and all player records for it. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteGame(game.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/admin-panel.tsx
git commit -m "feat(admin): add GamesTab with delete functionality"
```

---

### Task 12: Update UsersTab with delete button

**Files:**
- Modify: `src/app/admin/admin-panel.tsx` (UsersTab function)

- [ ] **Step 1: Update UsersTab to accept currentUserId**

Update the function signature:

```typescript
function UsersTab({ users, currentUserId, onRefresh }: { users: User[]; currentUserId: string; onRefresh: () => void }) {
```

- [ ] **Step 2: Add delete handler**

```typescript
  async function deleteUser(userId: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }
```

- [ ] **Step 3: Add delete button next to each user row**

Inside the user row div, after the Ban/Unban button, add a delete button — only shown for non-admin, non-self users:

```tsx
{user.role !== "ADMIN" && user.id !== currentUserId && (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button
        size="sm"
        variant="outline"
        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        disabled={loading}
      >
        Delete
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete user "{user.name}"?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently delete {user.name} and all their data (decks, votes, games). This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={() => deleteUser(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/admin-panel.tsx
git commit -m "feat(admin): add user delete button to UsersTab"
```

---

### Task 13: Verify the build compiles

**Files:** None (verification only)

- [ ] **Step 1: Run the build**

```bash
npx next build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 2: Fix any issues found**

If there are type errors or import issues, fix them before proceeding.

- [ ] **Step 3: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix(admin): resolve build issues from delete functionality"
```
