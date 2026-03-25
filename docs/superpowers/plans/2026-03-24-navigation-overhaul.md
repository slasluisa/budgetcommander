# Navigation Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dropdown-based navigation with a mobile bottom tab bar and streamlined desktop top nav, making "Log Game" the most prominent action.

**Architecture:** The existing `Nav` component gets rewritten to remove the dropdown and add a Log Game CTA. A new `BottomTabBar` client component handles mobile navigation. The current `/dashboard` route becomes `/profile` with a redirect. No new dependencies needed — uses existing lucide-react icons, next-auth session, and shadcn/ui components.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, lucide-react, next-auth, shadcn/ui

**Important:** This project uses Next.js 16 which has breaking changes. Before writing any component code, check `node_modules/next/dist/docs/` for relevant docs (especially routing and redirects). Heed deprecation notices.

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/components/bottom-tab-bar.tsx` | Mobile bottom tab bar (client component) |
| Rewrite | `src/components/nav.tsx` | Desktop top nav — no dropdown, Log Game CTA, avatar links to /profile |
| Create | `src/app/profile/page.tsx` | Profile page (server component, consolidates dashboard) |
| Move | `src/app/dashboard/name-editor.tsx` → `src/app/profile/name-editor.tsx` | NameEditor moves with profile page |
| Modify | `src/app/layout.tsx` | Add BottomTabBar, add bottom padding for mobile |
| Create | `src/app/dashboard/page.tsx` | Redirect to /profile |
| Modify | `src/app/page.tsx` | Remove duplicate "Log Game" button from hero |

---

### Task 1: Create the BottomTabBar component

**Files:**
- Create: `src/components/bottom-tab-bar.tsx`

- [ ] **Step 1: Create BottomTabBar component**

This is a client component that renders a fixed bottom tab bar on mobile only. It uses `usePathname()` to highlight the active tab and `useSession()` to conditionally show auth-dependent tabs.

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Gamepad2, Plus, BarChart3, User } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: Home, authRequired: false },
  { href: "/games", label: "Games", icon: Gamepad2, authRequired: false },
  { href: "/games/new", label: "Log Game", icon: Plus, authRequired: true, center: true },
  { href: "/leaderboard", label: "Standings", icon: BarChart3, authRequired: false },
  { href: "/profile", label: "Profile", icon: User, authRequired: true },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const visibleTabs = tabs.filter((tab) => !tab.authRequired || session?.user);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm md:hidden">
      <div className="flex items-end justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1">
        {visibleTabs.map((tab) => {
          const active = isActive(tab.href);
          if (tab.center) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-0.5 -mt-3"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30">
                  <tab.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-[10px] font-semibold text-primary">
                  {tab.label}
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 py-1.5 px-2"
            >
              <tab.icon
                className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] ${active ? "text-primary font-medium" : "text-muted-foreground"}`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds (component not yet imported anywhere, but should compile)

- [ ] **Step 3: Commit**

```bash
git add src/components/bottom-tab-bar.tsx
git commit -m "feat: create BottomTabBar component for mobile navigation"
```

---

### Task 2: Rewrite the Nav component

**Files:**
- Rewrite: `src/components/nav.tsx`

**Context:** The current Nav uses a `DropdownMenu` with 5 items (Dashboard, Register Deck, Log Game, Admin, Sign Out). Replace it with a streamlined bar: Logo + links on the left, Log Game CTA + avatar link on the right. No dropdown. Desktop-only links (hidden on mobile since the tab bar handles mobile nav).

- [ ] **Step 1: Read the current Nav component**

Read `src/components/nav.tsx` to confirm current state before rewriting.

- [ ] **Step 2: Rewrite Nav component**

```tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";

export function Nav() {
  const { data: session } = useSession();

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-primary">
            Budget Commander
          </Link>
          <div className="hidden gap-4 md:flex">
            <Link
              href="/games"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Games
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Standings
            </Link>
            {(session?.user as any)?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link
                href="/games/new"
                className={
                  buttonVariants() +
                  " hidden gap-1.5 bg-gradient-to-r from-primary to-secondary md:inline-flex"
                }
              >
                <Plus className="h-4 w-4" />
                Log Game
              </Link>
              <Link href="/profile">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image ?? undefined} />
                  <AvatarFallback>
                    {session.user.name?.[0] ?? "?"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/login"
                className={
                  buttonVariants({ variant: "outline", size: "sm" }) +
                  " border-primary/50 text-primary hover:bg-primary/10"
                }
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={
                  buttonVariants({ variant: "outline", size: "sm" }) +
                  " border-secondary/50 text-secondary hover:bg-secondary/10"
                }
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
```

Note: This removes the `useRouter`, `Button`, `DropdownMenu`, and `DropdownMenuContent/Item/Trigger` imports entirely. Uses `Link` components instead of `router.push()` for better Next.js navigation.

- [ ] **Step 3: Verify it builds**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/nav.tsx
git commit -m "feat: rewrite Nav to remove dropdown, add Log Game CTA"
```

---

### Task 3: Create the Profile page

**Files:**
- Create: `src/app/profile/page.tsx`
- Move: `src/app/dashboard/name-editor.tsx` → `src/app/profile/name-editor.tsx`

**Context:** The profile page consolidates the current dashboard content plus Sign Out. It's a server component that fetches user data, stats, pending games, and decks. The `NameEditor` client component moves here unchanged (just update its file location). Check `node_modules/next/dist/docs/` for any Next.js 16 routing changes before writing.

- [ ] **Step 1: Copy NameEditor to profile directory**

```bash
mkdir -p src/app/profile
cp src/app/dashboard/name-editor.tsx src/app/profile/name-editor.tsx
```

No changes needed to NameEditor — it works as-is.

- [ ] **Step 2: Create the profile page**

The profile page is the current dashboard with these changes:
- Remove "Log Game" and "Register Deck" header buttons
- Add Sign Out button at the bottom
- Keep everything else (stats, pending confirmations, decks)

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { NameEditor } from "./name-editor";
import { SignOutButton } from "./sign-out-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userId = session.user.id!;

  const [user, pendingGames, decks, confirmedGames] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, createdAt: true },
    }),
    prisma.game.findMany({
      where: {
        status: "PENDING",
        players: {
          some: { userId, confirmed: false },
        },
      },
      include: {
        players: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.deck.findMany({
      where: { userId, archived: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.gamePlayer.findMany({
      where: { userId, game: { status: "CONFIRMED" } },
    }),
  ]);

  const wins = confirmedGames.filter((gp) => gp.isWinner).length;
  const total = confirmedGames.length;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Profile Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl font-semibold">
          {user?.name?.[0] ?? "?"}
        </div>
        <div>
          <NameEditor initialName={user?.name ?? "User"} />
          {user?.createdAt && (
            <p className="text-sm text-muted-foreground">
              Member since{" "}
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card className="border-border bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Games</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-400">{wins}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-accent">
              {total > 0 ? ((wins / total) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Confirmations */}
      {pendingGames.length > 0 && (
        <Card className="mb-6 border-yellow-500/30 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-yellow-400">
              Pending Confirmations ({pendingGames.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingGames.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="flex items-center justify-between rounded-lg bg-muted/20 p-3 hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm">
                  {game.players.map((p) => p.user.name).join(", ")}
                </span>
                <Badge
                  variant="outline"
                  className="border-yellow-500/30 text-yellow-400"
                >
                  Needs Confirmation
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* My Decks */}
      <Card className="mb-6 border-border bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Decks</CardTitle>
          <Link
            href="/decks/new"
            className={
              buttonVariants({ variant: "outline", size: "sm" }) +
              " border-border"
            }
          >
            + Add Deck
          </Link>
        </CardHeader>
        <CardContent>
          {decks.length === 0 ? (
            <p className="text-muted-foreground">No decks registered yet.</p>
          ) : (
            <div className="space-y-2">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="flex items-center justify-between rounded-lg bg-muted/20 p-3"
                >
                  <div>
                    <p className="font-medium">{deck.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {deck.commander}
                    </p>
                  </div>
                  {deck.externalLink && (
                    <a
                      href={deck.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-secondary hover:underline"
                    >
                      View List
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sign Out */}
      <SignOutButton />
    </div>
  );
}
```

- [ ] **Step 3: Create the SignOutButton client component**

Create `src/app/profile/sign-out-button.tsx`:

```tsx
"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="w-full rounded-lg border border-border p-3 text-center text-sm text-destructive hover:bg-destructive/10 transition-colors"
    >
      Sign Out
    </button>
  );
}
```

- [ ] **Step 4: Verify it builds**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/app/profile/
git commit -m "feat: create profile page consolidating dashboard + sign out"
```

---

### Task 4: Add BottomTabBar to layout and adjust spacing

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Read the current layout**

Read `src/app/layout.tsx` to confirm current state.

- [ ] **Step 2: Update layout**

Add BottomTabBar import and render it after the Toaster. Add `pb-20 md:pb-0` to the `<main>` element so content isn't hidden behind the mobile tab bar.

Changes to `src/app/layout.tsx`:
- Add import: `import { BottomTabBar } from "@/components/bottom-tab-bar";`
- Add `pb-20 md:pb-0` to the `<main>` className
- Add `<BottomTabBar />` after `<Toaster />`

The layout should look like:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Budget Commander League",
  description: "MTG Budget Commander League Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <Nav />
          <main className="mx-auto max-w-6xl px-4 py-8 pb-20 md:pb-8">
            {children}
          </main>
          <Toaster />
          <BottomTabBar />
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify it builds**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add BottomTabBar to layout with mobile spacing"
```

---

### Task 5: Replace dashboard with redirect

**Files:**
- Rewrite: `src/app/dashboard/page.tsx`

**Context:** The old dashboard route needs to redirect to `/profile` for anyone with bookmarks. Check `node_modules/next/dist/docs/01-app/` for the Next.js 16 way to handle redirects (could be via `redirect()` in the page, or via `next.config`). The simplest approach is to keep the page file and use `redirect()`.

- [ ] **Step 1: Read Next.js 16 redirect docs**

Check `node_modules/next/dist/docs/01-app/` for redirect guidance.

- [ ] **Step 2: Replace dashboard page with redirect**

Rewrite `src/app/dashboard/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect("/profile");
}
```

- [ ] **Step 3: Delete the old name-editor from dashboard**

```bash
rm src/app/dashboard/name-editor.tsx
```

- [ ] **Step 4: Verify it builds**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/ src/app/profile/
git commit -m "feat: redirect /dashboard to /profile, remove old name-editor"
```

---

### Task 6: Remove duplicate Log Game from home page

**Files:**
- Modify: `src/app/page.tsx`

**Context:** The home page hero has a conditional "Log Game" button that duplicates the nav CTA and tab bar. Remove it. Keep the "Vote Now" and "View Standings" buttons.

- [ ] **Step 1: Read the current home page**

Read `src/app/page.tsx` to confirm current state.

- [ ] **Step 2: Remove the Log Game button from hero**

In `src/app/page.tsx`, find and remove these lines from the hero button group (around lines 71-74):

```tsx
// DELETE these lines:
{session?.user && (
  <Link href="/games/new" className={buttonVariants()}>
    Log Game
  </Link>
)}
```

Also remove the `auth` import and `session` variable if they're no longer used elsewhere in the component. Check if `session` is used — it's only used for the Log Game button, so remove:
- The `import { auth } from "@/lib/auth";` line
- The `const session = await auth();` line

- [ ] **Step 3: Verify it builds**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "fix: remove duplicate Log Game button from home page hero"
```

---

### Task 7: Manual verification

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify desktop navigation**

Open the app in a browser at desktop width. Verify:
- Top nav shows: Logo, Games, Standings links + Log Game CTA button + avatar
- No dropdown menu on avatar click — it navigates to `/profile`
- Log Game CTA navigates to `/games/new`
- No bottom tab bar visible on desktop

- [ ] **Step 3: Verify mobile navigation**

Resize browser to mobile width (< 768px). Verify:
- Bottom tab bar visible with 5 tabs (or 3 if logged out)
- Log Game center button is raised and prominent
- All tabs navigate correctly
- Top nav only shows logo (no links, no dropdown)
- No hamburger menu

- [ ] **Step 4: Verify profile page**

Navigate to `/profile`. Verify:
- Shows avatar, name with edit pencil, member-since date
- Stats cards (Games, Wins, Win Rate)
- Pending confirmations (if any)
- My Decks with "Add Deck" link
- Sign Out button at bottom
- NameEditor works (click pencil, edit, save)

- [ ] **Step 5: Verify redirect**

Navigate to `/dashboard`. Verify it redirects to `/profile`.

- [ ] **Step 6: Verify unauthenticated state**

Log out. Verify:
- Desktop: Shows Sign In / Register buttons, no Log Game CTA, no avatar
- Mobile: Tab bar shows only Home, Games, Standings (no Log Game or Profile)

- [ ] **Step 7: Commit any fixes from verification**

If any issues found during verification, fix and commit.
