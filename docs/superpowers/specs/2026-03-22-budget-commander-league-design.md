# Budget Commander League — Design Spec

## Overview

A web application for managing a local game store's Budget Commander (Magic: The Gathering) league. Players sign up, register decks, log 4-player games with mutual confirmation, and compete on a leaderboard. A one-time budget poll determines the deck price cap for each season.

Inspired by [budgetcommander.de](https://www.budgetcommander.de/).

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (customized purple/blue "MTG Mystic" theme)
- **Auth:** NextAuth.js v5 — Discord + Google providers
- **Database:** Vercel Postgres
- **ORM:** Prisma
- **Deployment:** Vercel

## Visual Design

Dark theme with deep purple/blue tones and subtle glow effects. Leans into Magic's fantasy aesthetic without being over the top. Radial gradients, soft glows on accent elements, premium feel.

- Background: deep navy/purple (#1a0a2e → #16213e)
- Accent: purple (#7c3aed, #a78bfa) and blue (#3b82f6, #93c5fd)
- Text: light slate (#e2e8f0, #94a3b8)
- Cards/surfaces: semi-transparent with colored borders

## Data Model

### User
| Field     | Type              | Notes                          |
|-----------|-------------------|--------------------------------|
| id        | String (cuid)     | Primary key                    |
| email     | String            | From OAuth provider            |
| username  | String            | Display name                   |
| avatar    | String?           | From OAuth provider            |
| role      | Enum (PLAYER, ADMIN) | Default: PLAYER             |
| createdAt | DateTime          |                                |

### Deck
| Field        | Type          | Notes                              |
|--------------|---------------|------------------------------------|
| id           | String (cuid) | Primary key                       |
| userId       | String        | FK → User                         |
| name         | String        | Deck name                         |
| commander    | String        | Commander card name                |
| externalLink | String?       | Moxfield/Archidekt URL            |
| archived     | Boolean       | Default: false (soft-delete)       |
| createdAt    | DateTime      |                                    |

### Season
| Field     | Type                              | Notes              |
|-----------|-----------------------------------|---------------------|
| id        | String (cuid)                     | Primary key         |
| name      | String                            | e.g., "Season 1"   |
| budgetCap | Int?                              | Set when poll locks |
| status    | Enum (POLLING, ACTIVE, COMPLETED) |                     |
| createdAt | DateTime                          |                     |

### PollVote
| Field    | Type          | Notes                                  |
|----------|---------------|----------------------------------------|
| id       | String (cuid) | Primary key                           |
| seasonId | String        | FK → Season                           |
| userId   | String        | FK → User                             |
| choice   | Int           | 20, 50, or 100                        |

Unique constraint: (seasonId, userId) — one vote per user per season. Users can change their vote until the poll is locked.

### Game
| Field       | Type                                | Notes               |
|-------------|-------------------------------------|----------------------|
| id          | String (cuid)                       | Primary key          |
| seasonId    | String                              | FK → Season          |
| createdById | String                              | FK → User            |
| status      | Enum (PENDING, CONFIRMED, DISPUTED) | Default: PENDING     |
| createdAt   | DateTime                            |                      |

### GamePlayer
| Field     | Type          | Notes                    |
|-----------|---------------|--------------------------|
| id        | String (cuid) | Primary key             |
| gameId    | String        | FK → Game               |
| userId    | String        | FK → User               |
| deckId    | String?       | FK → Deck (set on confirm) |
| isWinner  | Boolean       | Default: false           |
| confirmed | Boolean       | Default: false           |

## Pages

### Public (no login required)

- **`/` — Home:** Hero banner, current season info, active budget poll (if polling), recent games, leaderboard preview.
- **`/leaderboard` — Leaderboard:** Season standings: rank, player, wins, losses, win rate. Click a player for their profile with per-deck stats.
- **`/games` — Game History:** All games: date, 4 players, decks used, winner. Filterable by season/player.
- **`/players/[id]` — Player Profile:** Avatar, overall stats, deck collection with per-deck win rates, game history.
- **`/poll` — Budget Poll:** Vote for $20/$50/$100 (requires login to vote). Shows live results. Locked once admin closes it.

### Authenticated

- **`/dashboard` — My Dashboard:** Pending game confirmations, personal stats, deck list, quick actions.
- **`/decks/new` — Register Deck:** Form: deck name, commander name, external link (Moxfield/Archidekt).
- **`/games/new` — Log a Game:** Select 3 other players, pick own deck, declare winner. Creates PENDING game.
- **`/games/[id]` — Game Detail:** View game info. If participant & pending: confirm (select deck, confirm winner) or dispute.

### Admin

- **`/admin` — Admin Panel:** Manage seasons (create/end), lock polls, resolve disputed games, manage users (ban/remove), edit game results.

## API Routes

### Auth
- `GET/POST /api/auth/[...nextauth]` — NextAuth login/logout/session (Discord + Google)

### Poll
- `POST /api/poll/vote` — Cast or update vote ($20/$50/$100)
- `POST /api/admin/poll/lock` — Lock poll, set season budget to winning choice. Accepts optional `choice` param for admin to break ties.

### Decks
- `GET /api/decks` — List current user's decks
- `POST /api/decks` — Register a new deck
- `DELETE /api/decks/[id]` — Soft-delete (archive) a deck. Historical game references preserved.

### Games
- `POST /api/games` — Create a game (player IDs, own deck, proposed winner)
- `POST /api/games/[id]/confirm` — Confirm game result + select deck used
- `POST /api/games/[id]/dispute` — Dispute the result
- `GET /api/games` — List games (filterable by season, player, status)

### Admin
- `POST /api/admin/seasons` — Create a new season (starts polling phase)
- `POST /api/admin/seasons/[id]/end` — End a season (freezes stats)
- `POST /api/admin/games/[id]/resolve` — Resolve a disputed game (pick winner)
- `POST /api/admin/users/[id]/ban` — Ban a user
- `PUT /api/admin/games/[id]` — Edit game results

## Key Flows

### Logging a Game
1. Creator hits `POST /api/games` with 3 other player IDs, their own deck, and proposed winner
2. Three other players see pending confirmation on their dashboard
3. Each confirms via `POST /api/games/[id]/confirm`, selecting their deck and confirming the winner
4. All 4 confirm → status = CONFIRMED, stats recalculate
5. Anyone disputes → status = DISPUTED, appears in admin panel

### Season Lifecycle
1. Admin creates season → status = POLLING, poll opens
2. Admin locks poll → winning budget becomes budgetCap, status = ACTIVE
3. Players register decks, log games, compete
4. Admin ends season → status = COMPLETED, stats frozen, history preserved
5. Only one season can be ACTIVE at a time

### Budget Poll
1. Season created → poll opens with $20/$50/$100 options
2. Logged-in users cast one vote each (can change until locked)
3. Admin locks poll → winning option becomes the season's budget cap
4. Ties → admin picks between tied options

## Edge Cases

- **Confirmation timeout:** If a player doesn't confirm within 7 days, creator is notified and can cancel or request admin help.
- **Duplicate prevention:** A player can only be in one PENDING game at a time with the same group.
- **Account separation:** Google and Discord logins are separate accounts (no linking in v1).
- **Admin dispute resolution:** Admin picks the winner; stats recalculate accordingly.
- **Banned users:** Banning prevents future logins but preserves game history.
- **Season constraints:** Only one ACTIVE season at a time. Ending a season freezes all data.
- **Deck budget enforcement:** Not enforced by the system. Budget compliance is honor-system based, consistent with the community format.
