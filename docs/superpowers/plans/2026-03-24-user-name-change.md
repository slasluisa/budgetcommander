# User Name Change Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to change their display name from the dashboard via inline editing.

**Architecture:** A PATCH API endpoint handles name updates with server-side validation. A client component on the dashboard provides the inline edit UX with optimistic display and session sync. The NextAuth JWT callback is updated to re-fetch name on session update so the nav reflects changes immediately.

**Tech Stack:** Next.js 16, NextAuth 5 (beta), Prisma 7, shadcn/ui (Input, Button), sonner (toasts), lucide-react (icons)

---

### Task 1: Add Toaster to root layout

The sonner `Toaster` component exists at `src/components/ui/sonner.tsx` but is not mounted in the app. It must be added to enable toast notifications.

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add Toaster import and component to layout**

Add the import and place `<Toaster />` inside `<Providers>` after `<main>`:

```tsx
import { Toaster } from "@/components/ui/sonner";
```

Add `<Toaster />` right before the closing `</Providers>` tag.

- [ ] **Step 2: Verify the app still loads**

Run: `npm run build` or load a page in the browser to confirm no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(ui): mount Toaster component in root layout"
```

---

### Task 2: Create PATCH /api/user/profile endpoint

**Files:**
- Create: `src/app/api/user/profile/route.ts`

- [ ] **Step 1: Create the API route**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (name.length > 50) {
    return NextResponse.json(
      { error: "Name must be 50 characters or less" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(updated);
}
```

- [ ] **Step 2: Test manually with curl or the browser**

Start the dev server and test:
```bash
curl -X PATCH http://localhost:3000/api/user/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"name": "New Name"}'
```

Expected: `200` with updated user JSON. Test without auth (expect 401), empty name (expect 400), and 51+ char name (expect 400).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/user/profile/route.ts
git commit -m "feat(api): add PATCH /api/user/profile endpoint for name changes"
```

---

### Task 3: Update NextAuth JWT callback for session refresh

**Files:**
- Modify: `src/lib/auth.ts:34-40` (the `prisma` import already exists on line 4 — do not duplicate it)

- [ ] **Step 1: Update the jwt callback to handle trigger === "update"**

Replace the existing `jwt` callback (lines 34-40) with:

```ts
async jwt({ token, user, trigger }) {
  if (user) {
    token.id = user.id;
    token.role = (user as any).role;
  }
  if (trigger === "update") {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { name: true },
    });
    if (dbUser) token.name = dbUser.name;
  }
  return token;
},
```

- [ ] **Step 2: Verify the app still builds**

Run: `npm run build` to confirm no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat(auth): update JWT callback to re-fetch name on session update"
```

---

### Task 4: Create NameEditor client component

**Files:**
- Create: `src/app/dashboard/name-editor.tsx`

- [ ] **Step 1: Create the NameEditor component**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

export function NameEditor({ initialName }: { initialName: string }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const { update } = useSession();
  const router = useRouter();

  const trimmed = name.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= 50;

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update name");
        return;
      }
      await update();
      router.refresh();
      setEditing(false);
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setName(initialName);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold">{initialName}</h1>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Edit name"
          onClick={() => setEditing(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
        className="max-w-xs text-lg"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") handleCancel();
        }}
      />
      <Button
        size="sm"
        onClick={handleSave}
        disabled={!isValid || saving}
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        disabled={saving}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/name-editor.tsx
git commit -m "feat(ui): create NameEditor client component for inline name editing"
```

---

### Task 5: Integrate NameEditor into dashboard page

**Files:**
- Modify: `src/app/dashboard/page.tsx:1-7,49`

- [ ] **Step 1: Add import and fetch user name**

Add the import at the top of the file:

```tsx
import { NameEditor } from "./name-editor";
```

After the existing `userId` declaration (line 15), fetch the user's name:

```tsx
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { name: true },
});
```

- [ ] **Step 2: Replace the Dashboard heading with NameEditor**

Replace the `<h1>` tag on line 49:

```tsx
<h1 className="text-3xl font-bold">Dashboard</h1>
```

With:

```tsx
<NameEditor initialName={user?.name ?? "User"} />
```

- [ ] **Step 3: Verify in the browser**

Load `/dashboard`. Confirm:
1. The user's name displays with a pencil icon
2. Clicking the pencil shows an input with save/cancel buttons
3. Saving calls the API and updates the name
4. The nav bar name updates without page reload
5. Canceling reverts to the original name
6. Empty or 51+ char names cannot be saved

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(dashboard): integrate NameEditor for inline name editing"
```
