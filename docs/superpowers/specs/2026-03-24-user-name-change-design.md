# User Name Change - Design Spec

## Overview

Allow users to change their display name from the dashboard via an inline edit interaction.

## API

### `PATCH /api/user/profile`

- **Auth**: Required (session-based via NextAuth)
- **Request body**: `{ name: string }`
- **Validation**:
  - Name must be a non-empty string after trimming
  - Maximum 50 characters
- **Response**:
  - `200`: `{ id, name, email, role }` (updated user)
  - `400`: `{ error: "Name is required" }` or `{ error: "Name must be 50 characters or less" }`
  - `401`: `{ error: "Unauthorized" }`

**Implementation**: Uses `prisma.user.update()` with the authenticated user's ID from the session.

## Dashboard UI

- Create a new `"use client"` component `src/app/dashboard/name-editor.tsx` for the interactive edit widget
- The server component `dashboard/page.tsx` passes the initial name as a prop to this client component
- Default state: displays the name with a pencil/edit icon button
- Edit state: input field (pre-filled with current name) with save and cancel buttons
- On save: call `PATCH /api/user/profile`, show success/error toast via sonner, then call `router.refresh()` to update any server-rendered name content on the dashboard
- On cancel: revert to display state with original name

## Session Sync

- After successful API response, call NextAuth `update()` from `useSession()` to refresh the session
- The nav component (`src/components/nav.tsx`) already uses `useSession()` and will automatically reflect the updated name after the session update call
- Other pages (leaderboard, player profiles, game details) read the name from the database via Prisma and will show the updated name on next page load
- Update the NextAuth JWT callback to re-fetch the user's name from the database when `trigger === "update"`:

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

Note: `token.name` must be set explicitly on update since NextAuth's default auto-copy of name to token only happens on initial sign-in.

## Validation

- **Client-side**: non-empty after trim, max 50 characters. Disable save button when invalid.
- **Server-side**: same checks, return 400 with descriptive error message on failure.

## Files to Create/Modify

- **Create**: `src/app/api/user/profile/route.ts` - PATCH endpoint
- **Create**: `src/app/dashboard/name-editor.tsx` - client component for inline name editing
- **Modify**: `src/app/dashboard/page.tsx` - embed NameEditor component, pass initial name as prop
- **Modify**: `src/lib/auth.ts` - update JWT callback to handle session updates with `trigger === "update"`
