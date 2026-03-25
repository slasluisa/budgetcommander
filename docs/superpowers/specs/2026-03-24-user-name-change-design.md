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

- Add an editable name display near the top of the dashboard where the user greeting is shown
- Default state: displays the name with a pencil/edit icon button
- Edit state: input field (pre-filled with current name) with save and cancel buttons
- On save: call `PATCH /api/user/profile`, show success/error toast via sonner
- On cancel: revert to display state with original name

## Session Sync

- After successful API response, call NextAuth `update()` from `useSession()` to refresh the session
- Update the NextAuth JWT callback to re-fetch the user's name from the database when `trigger === "update"` is passed, so the nav and other session-dependent UI reflect the new name without a page reload

## Validation

- **Client-side**: non-empty after trim, max 50 characters. Disable save button when invalid.
- **Server-side**: same checks, return 400 with descriptive error message on failure.

## Files to Create/Modify

- **Create**: `src/app/api/user/profile/route.ts` - PATCH endpoint
- **Modify**: `src/app/dashboard/page.tsx` - add inline name edit UI
- **Modify**: `src/lib/auth.ts` - update JWT callback to handle session updates
