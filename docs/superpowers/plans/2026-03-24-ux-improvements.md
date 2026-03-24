# UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Log Game" CTA to the home page for logged-in users, and make the decklist link required when registering a deck.

**Architecture:** Two independent changes — one to the home page server component (add auth check + button), one to the deck registration form + API (enforce required link). No schema changes.

**Tech Stack:** Next.js, React, NextAuth, Prisma

**Spec:** `docs/superpowers/specs/2026-03-24-ux-improvements-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/page.tsx` | Modify (lines 1-10, 68-77) | Add auth import, add "Log Game" button, demote "Vote Now" |
| `src/components/deck-form.tsx` | Modify (lines 24, 62-69) | Make externalLink required, trim input |
| `src/app/api/decks/route.ts` | Modify (lines 28-35) | Add server-side externalLink validation |

---

### Task 1: Add "Log Game" CTA to Home Page

**Files:**
- Modify: `src/app/page.tsx:1-10` (imports)
- Modify: `src/app/page.tsx:68-77` (hero button row)

- [ ] **Step 1: Add auth import and session check**

Add `auth` import and call it at the top of the `Home` component:

```tsx
// Add to imports (line 1 area)
import { auth } from "@/lib/auth";
```

```tsx
// Add as first line inside Home() function, before the prisma calls
const session = await auth();
```

- [ ] **Step 2: Add "Log Game" button and demote "Vote Now"**

Replace the hero button row (lines 68-77) with:

```tsx
<div className="relative mt-6 flex gap-3">
  {session?.user && (
    <Link href="/games/new" className={buttonVariants()}>
      Log Game
    </Link>
  )}
  {currentSeason?.status === "POLLING" && (
    <Link href="/poll" className={buttonVariants({ variant: "outline" }) + " border-border"}>
      Vote Now
    </Link>
  )}
  <Link href="/leaderboard" className={buttonVariants({ variant: "outline" }) + " border-border"}>
    View Standings
  </Link>
</div>
```

Key changes:
- "Log Game" rendered when `session?.user` is truthy, independent of season
- "Vote Now" changed from `buttonVariants()` to `buttonVariants({ variant: "outline" })` + `border-border`
- "Vote Now" remains visible during polling for all users (logged-in and logged-out), matching current behavior
- "Log Game" is the only primary button

- [ ] **Step 3: Verify manually**

Run: `npm run dev`

Check these scenarios in browser:
- Logged out on `/`: should see only "View Standings"
- Logged in on `/`: should see "Log Game" (primary) + "View Standings" (outline)
- Logged in with polling season: should see "Log Game" + "Vote Now" + "View Standings"
- Click "Log Game" → navigates to `/games/new`

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add Log Game CTA to home page for logged-in users"
```

---

### Task 2: Make Deck Link Required in Form

**Files:**
- Modify: `src/components/deck-form.tsx:24` (trim logic)
- Modify: `src/components/deck-form.tsx:62-69` (label + required attribute)

- [ ] **Step 1: Update form data handling**

In `src/components/deck-form.tsx`, line 24, change:

```tsx
// Old
externalLink: (formData.get("externalLink") as string) || undefined,
```

to:

```tsx
// New
externalLink: (formData.get("externalLink") as string)?.trim() || undefined,
```

- [ ] **Step 2: Update label and add required attribute**

In `src/components/deck-form.tsx`, change the externalLink form group (lines 61-69):

```tsx
// Old
<Label htmlFor="externalLink">Decklist Link (optional)</Label>
<Input
  id="externalLink"
  name="externalLink"
  type="url"
  placeholder="https://www.moxfield.com/decks/..."
  className="bg-muted border-border"
/>
```

to:

```tsx
// New
<Label htmlFor="externalLink">Decklist Link</Label>
<Input
  id="externalLink"
  name="externalLink"
  type="url"
  required
  placeholder="https://www.moxfield.com/decks/..."
  className="bg-muted border-border"
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/deck-form.tsx
git commit -m "feat: make decklist link required in deck registration form"
```

---

### Task 3: Add Server-Side Deck Link Validation

**Files:**
- Modify: `src/app/api/decks/route.ts:30-35` (validation block)

- [ ] **Step 1: Add externalLink validation**

In `src/app/api/decks/route.ts`, change the validation block (lines 30-35):

```tsx
// Old
if (!name || !commander) {
  return NextResponse.json(
    { error: "name and commander are required" },
    { status: 400 }
  );
}
```

to:

```tsx
// New
if (!name || !commander) {
  return NextResponse.json(
    { error: "name and commander are required" },
    { status: 400 }
  );
}

const trimmedLink = externalLink?.trim();
if (!trimmedLink) {
  return NextResponse.json(
    { error: "Decklist link is required" },
    { status: 400 }
  );
}
```

- [ ] **Step 2: Use trimmed value in database storage**

In `src/app/api/decks/route.ts`, change the prisma create call (line 37-44):

```tsx
// Old
externalLink: externalLink ?? null,
```

to:

```tsx
// New
externalLink: trimmedLink,
```

This ensures no leading/trailing whitespace is stored in the database.

- [ ] **Step 3: Verify manually**

Run: `npm run dev`

Test deck registration:
- Submit without a link → browser blocks (HTML `required`)
- Submit with whitespace-only link via API (curl or devtools) → 400 "Decklist link is required"
- Submit with valid Moxfield URL → deck created successfully

- [ ] **Step 4: Commit**

```bash
git add src/app/api/decks/route.ts
git commit -m "feat: add server-side validation for required decklist link"
```
