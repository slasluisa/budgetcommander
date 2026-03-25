# Email-to-Username Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace email-based auth with username-based auth across the entire app.

**Architecture:** Rename the `email` column to `username` in the User model, update all auth logic to accept/validate usernames (alphanumeric + underscores, 3-20 chars, stored lowercase), and update all UI and API references.

**Tech Stack:** Next.js 16, Prisma 7, NextAuth v5 (beta), PostgreSQL, React 19

**Spec:** `docs/superpowers/specs/2026-03-24-email-to-username-design.md`

---

### Task 1: Database Schema Migration

**Files:**
- Modify: `prisma/schema.prisma:28` (change `email` to `username`)

- [ ] **Step 1: Update Prisma schema**

In `prisma/schema.prisma`, replace line 28:

```prisma
  username     String   @unique
```

(replacing `email        String   @unique`)

- [ ] **Step 2: Create and apply migration**

```bash
npx prisma migrate dev --name replace_email_with_username
```

This will drop the existing data (fresh start). If prompted about data loss, confirm.

- [ ] **Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: replace email with username in database schema"
```

---

### Task 2: Auth Config

**Files:**
- Modify: `src/lib/auth.ts:9-31` (credentials provider + authorize function)

- [ ] **Step 1: Update credentials provider and authorize function**

In `src/lib/auth.ts`, replace the Credentials provider block (lines 9-31):

```typescript
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({
          where: { username: username.toLowerCase() },
          select: { id: true, username: true, name: true, passwordHash: true, banned: true, role: true },
        });
        if (!user) return null;
        if (user.banned) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, role: user.role };
      },
    }),
```

- [ ] **Step 2: Verify the app builds**

```bash
npx next build 2>&1 | head -30
```

Expected: Build may fail due to other files still referencing `email` — that's fine, we'll fix them in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: update auth config to use username instead of email"
```

---

### Task 3: Registration Endpoint

**Files:**
- Modify: `src/app/api/auth/register/route.ts` (full file)

- [ ] **Step 1: Update registration route**

Replace the full contents of `src/app/api/auth/register/route.ts`:

```typescript
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export async function POST(request: Request) {
  const body = await request.json();
  const { name, username, password } = body;

  if (!name || !username || !password) {
    return NextResponse.json({ error: "Name, username, and password are required" }, { status: 400 });
  }

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3-20 characters, letters, numbers, and underscores only" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const normalized = username.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { username: normalized } });
  if (existing) {
    return NextResponse.json({ error: "This username is already taken" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, username: normalized, passwordHash },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/auth/register/route.ts
git commit -m "feat: update registration endpoint for username"
```

---

### Task 4: Login Page

**Files:**
- Modify: `src/app/login/page.tsx:23-26,49-50,32` (form fields + signIn call + error message)

- [ ] **Step 1: Update login form**

In `src/app/login/page.tsx`:

1. Replace the signIn call (lines 23-27):
```typescript
    const res = await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirect: false,
    });
```

2. Replace the error message (line 32):
```typescript
      setError("Invalid username or password");
```

3. Replace the email input field (lines 48-50):
```tsx
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" type="text" required autoComplete="username" />
```

- [ ] **Step 2: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: update login page to use username"
```

---

### Task 5: Register Page

**Files:**
- Modify: `src/app/register/page.tsx:24,34,37,48-49,77-79` (form fields + fetch body + auto sign-in)

- [ ] **Step 1: Update register form**

In `src/app/register/page.tsx`:

1. Replace the form data extraction (line 24):
```typescript
    const username = formData.get("username") as string;
```
(replacing `const email = formData.get("email") as string;`)

2. Replace the fetch body (lines 34-38):
```typescript
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, password }),
    });
```

3. Replace the auto sign-in call (lines 48-52):
```typescript
    const signInRes = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
```

4. Replace the email input (lines 77-79):
```tsx
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" type="text" required autoComplete="username" pattern="^[a-zA-Z0-9_]{3,20}$" title="3-20 characters, letters, numbers, and underscores only" />
```

- [ ] **Step 2: Commit**

```bash
git add src/app/register/page.tsx
git commit -m "feat: update register page to use username"
```

---

### Task 6: Admin Panel + Admin Page + Admin Ban API

**Files:**
- Modify: `src/app/admin/admin-panel.tsx:42,568` (User type + display)
- Modify: `src/app/admin/page.tsx:47` (select clause)
- Modify: `src/app/api/admin/users/[id]/ban/route.ts:36` (select clause)

- [ ] **Step 1: Update admin-panel.tsx**

In `src/app/admin/admin-panel.tsx`:

1. Replace the User type (line 42):
```typescript
type User = { id: string; name: string; username: string; role: string; banned: boolean };
```

2. Replace the email display (line 568):
```tsx
              <span className="ml-2 text-xs text-muted-foreground">{user.username}</span>
```

- [ ] **Step 2: Update admin page.tsx**

In `src/app/admin/page.tsx`, replace the user select (line 47):
```typescript
      select: { id: true, name: true, username: true, role: true, banned: true },
```

- [ ] **Step 3: Update ban route**

In `src/app/api/admin/users/[id]/ban/route.ts`, replace the select (line 36):
```typescript
    select: { id: true, name: true, username: true, role: true, banned: true },
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/admin-panel.tsx src/app/admin/page.tsx src/app/api/admin/users/\[id\]/ban/route.ts
git commit -m "feat: update admin panel to display username instead of email"
```

---

### Task 7: Profile API

**Files:**
- Modify: `src/app/api/user/profile/route.ts:29` (select clause)

- [ ] **Step 1: Update profile route select**

In `src/app/api/user/profile/route.ts`, replace the select (line 29):
```typescript
    select: { id: true, name: true, username: true, role: true },
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/user/profile/route.ts
git commit -m "feat: update profile API to return username instead of email"
```

---

### Task 8: Build Verification

- [ ] **Step 1: Run full build**

```bash
npx next build
```

Expected: Clean build with no errors.

- [ ] **Step 2: Grep for any remaining email references in source**

```bash
grep -rn "email" src/ prisma/ --include="*.ts" --include="*.tsx" --include="*.prisma" | grep -v node_modules
```

Expected: No results (all references have been replaced).

- [ ] **Step 3: Commit any remaining fixes if needed**
