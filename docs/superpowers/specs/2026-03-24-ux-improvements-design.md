# UX Improvements: Game CTA, Required Deck Link, Budget Validation

**Date:** 2026-03-24
**Status:** Approved

## Overview

Three improvements to the Budget Commander app:
1. Add a prominent "Log Game" CTA on the home page for logged-in users
2. Make the decklist link required when registering a deck
3. (Future) Validate deck price against the season budget cap via Moxfield API

---

## Feature 1: "Log Game" CTA on Home Page

### Problem
Logged-in users have no visible way to log a game from the home page (`/`). The "Log Game" action is buried in the nav dropdown and dashboard.

### Solution
Add a "Log Game" button to the hero button row on the home page, visible only to authenticated users.

### Changes
- **`src/app/page.tsx`**: Import `auth` from `@/lib/auth`. Call `auth()` at the top of the component.
- **"Log Game" button:** Rendered when `session?.user` is truthy, independent of season state. Uses `buttonVariants()` (primary) and links to `/games/new` (route already exists at `src/app/games/new/page.tsx`). Placed as the first element in the hero button row, outside the existing `currentSeason?.status === "POLLING"` conditional.
- **"Vote Now" button:** Demoted from `buttonVariants()` to `buttonVariants({ variant: "outline" })` to avoid two primary buttons in the same row.

### Button row behavior
- **Logged in + polling season:** `[Log Game (primary)] [Vote Now (outline)] [View Standings (outline)]`
- **Logged in + active season:** `[Log Game (primary)] [View Standings (outline)]`
- **Logged in + no season:** `[Log Game (primary)] [View Standings (outline)]`
- **Logged out:** `[View Standings (outline)]` (unchanged)

---

## Feature 2: Required Deck Link

### Problem
The decklist link is optional when registering a deck. It should be required so all registered decks have a viewable list.

### Solution
Enforce the requirement at the form and API level. The database column stays nullable (`String?`) for backward compatibility with existing decks.

### Changes
- **`src/components/deck-form.tsx`**:
  - Change label from "Decklist Link (optional)" to "Decklist Link".
  - Add `required` attribute to the input.
  - Change `(formData.get("externalLink") as string) || undefined` to `(formData.get("externalLink") as string)?.trim() || undefined` so whitespace-only input doesn't slip through.
  - Note: `type="url"` already exists on this input — no change needed there.
- **`src/app/api/decks/route.ts`**: Add server-side validation — if `!externalLink?.trim()`, return 400 with error "Decklist link is required". The browser `required` + `type="url"` attributes are a UX hint; the API is the real backstop. The existing error display in the form (`body.error`) will surface this message to the user.

### What doesn't change
- Prisma schema: `externalLink` stays `String?` — no migration needed.
- Existing decks with null links are unaffected.

---

## Feature 3: Budget Validation via Moxfield API (Future)

> **This feature is deferred.** This section is an outline only.

### Concept
When a user registers a deck, the API extracts the deck ID from the Moxfield URL, calls the Moxfield API to fetch the deck's total price, and compares it against the active season's `budgetCap`. If over budget, the deck is rejected with an error showing the deck price vs. the cap.

### Key considerations
- **Moxfield API:** Availability, rate limits, and authentication requirements need investigation.
- **URL parsing:** Only Moxfield URLs supported initially. Extract deck ID from URL pattern (e.g., `https://www.moxfield.com/decks/<id>`).
- **Price timing:** Validate at registration time only. Card prices fluctuate — periodic re-checks are a separate concern.
- **No budget cap:** If the active season has `budgetCap: null` or there is no active season, skip validation.
- **Price type mismatch:** `budgetCap` is `Int` (whole dollars). Moxfield prices are decimal. Need to decide on rounding/comparison strategy (e.g., ceil the deck price, or store `budgetCap` in cents).
- **Error UX:** Show a clear message like "Deck costs $X, but the season budget cap is $Y."
