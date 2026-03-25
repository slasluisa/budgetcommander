# Navigation Overhaul Design

## Problem

The current UI has redundant navigation paths and missing mobile support:
- "Log Game" appears in 3 places (nav dropdown, dashboard header, home page)
- "Register Deck" appears in 3 places (nav dropdown, dashboard header, dashboard decks card)
- The avatar dropdown mixes navigation, actions, and account management
- Mobile users have no access to Leaderboard, Games, or Poll links
- Name editing is only accessible after navigating to the dashboard

## Solution

Replace the current navigation with a mobile-first bottom tab bar and a streamlined desktop top nav. Eliminate the avatar dropdown entirely. Consolidate the dashboard into a profile page.

## Mobile Navigation (< 768px)

A persistent bottom tab bar with 5 tabs, always visible on every page:

| Position | Tab | Icon | Destination |
|----------|-----|------|-------------|
| 1 | Home | House | `/` |
| 2 | Games | Gamepad | `/games` |
| 3 (center) | Log Game | `+` in raised circle | `/games/new` |
| 4 | Standings | Bar chart | `/leaderboard` |
| 5 | Profile | Person | `/profile` |

The center "Log Game" tab is visually prominent: a raised circle with a gradient background (indigo/purple), elevated above the other tabs. This makes the primary action unmissable.

The top nav bar on mobile shows only the logo. No hamburger menu needed.

## Desktop Navigation (>= 768px)

A single top nav bar with no dropdown:

**Left side:** Logo + inline links (Home, Games, Standings)

**Right side:** "Log Game" CTA button (gradient, prominent) + avatar icon

The avatar icon links directly to `/profile` — no dropdown menu. No bottom tab bar on desktop.

### Conditional elements
- **Admin link:** Appears in the top nav (subtle) only for users with admin role
- **Poll:** Not a permanent nav item. Accessible from the Home page when a poll is active

## Profile Page (`/profile`)

Replaces the current `/dashboard` route. This is the single destination for the avatar click (desktop) and Profile tab (mobile).

### Content (top to bottom)
1. **Profile header:** Avatar, display name with inline edit pencil icon, member-since date
2. **Stats row:** 3-column grid showing Games, Wins, Win Rate
3. **Pending Confirmations card:** Lists games awaiting user confirmation, with count badge. Each game links to `/games/[id]`
4. **My Decks card:** Lists user's decks with commander names. "Add Deck" link in card header navigates to `/decks/new`
5. **Sign Out button:** At the bottom, styled as a destructive/red outlined button

### Name editing
The existing `NameEditor` component moves here. Same inline edit behavior (pencil icon, Enter to save, Escape to cancel). Rarely used, so it doesn't need prominent placement.

## What Gets Removed

- **Avatar dropdown component** — deleted entirely
- **Dashboard header action buttons** — "Log Game" and "Register Deck" buttons removed from dashboard
- **`/dashboard` route** — replaced by `/profile` (redirect `/dashboard` to `/profile` for any bookmarks)
- **Duplicate "Log Game" on home page** — removed; the nav CTA/tab handles this
- **Duplicate "Register Deck" in nav dropdown** — removed; only accessible from Profile page

## What Gets Created

- **`BottomTabBar` component** — client component, renders only on mobile (< 768px), highlights active tab based on current route
- **Streamlined `Nav` component** — rewritten to remove dropdown, add Log Game CTA, make avatar a direct link
- **`/profile` route** — new page consolidating dashboard content + sign out

## What Gets Modified

- **Root layout** — add `BottomTabBar` alongside existing `Nav`, add bottom padding on mobile to account for tab bar
- **`Nav` component** — remove dropdown, remove mobile-hidden links, add Log Game CTA button, avatar links to `/profile`
- **`NameEditor`** — moved from `/dashboard` to `/profile` (no behavior changes)

## Edge Cases

- **Unauthenticated users:** Bottom tab bar shows Home, Games, Standings only. No Profile or Log Game tabs. Desktop nav shows Sign In / Register buttons instead of avatar and Log Game CTA.
- **Active tab highlighting:** Determined by matching `pathname` against tab destinations. `/games/new` highlights the Log Game tab. `/games/*` highlights Games. `/profile` highlights Profile.
- **`/dashboard` bookmarks:** Add a redirect from `/dashboard` to `/profile`.

## Testing

- Verify all 5 tabs navigate correctly on mobile
- Verify Log Game CTA works on desktop
- Verify avatar links to `/profile` (no dropdown)
- Verify unauthenticated state hides Profile and Log Game
- Verify active tab highlighting on all routes
- Verify `/dashboard` redirects to `/profile`
- Verify NameEditor works on profile page
- Verify pending confirmations and decks render on profile page
- Verify sign out works from profile page
