# Admin Delete Functionality

Add the ability for admins to delete seasons, poll votes, games, and users for cleanup purposes.

## API Endpoints

All endpoints require ADMIN role authentication.

### DELETE /api/admin/seasons/[id]

- **Guard:** Rejects if season status = ACTIVE (must end it first)
- **Cascade:** Deletes associated PollVotes, Games, and GamePlayers (via DB cascade)
- **Response:** 200 on success, 400 if ACTIVE, 404 if not found

### DELETE /api/admin/poll/votes/[id]

- **Guard:** None
- **Cascade:** None
- **Response:** 200 on success, 404 if not found

### DELETE /api/admin/games/[id]

- **Guard:** None
- **Cascade:** Deletes associated GamePlayers (via DB cascade)
- **Response:** 200 on success, 404 if not found

### DELETE /api/admin/users/[id]

- **Guard:** Rejects if target user role = ADMIN. Rejects if target = self.
- **Cascade:** Deletes associated PollVotes, Decks, Games (created by), and GamePlayers (as participant) via DB cascade. GamePlayers referencing the user's decks have `deckId` set to null.
- **Response:** 200 on success, 400 if ADMIN or self, 404 if not found

## Schema Changes

Add `onDelete: Cascade` to these relations in `prisma/schema.prisma`:

| Model | Relation field | onDelete |
|-------|---------------|----------|
| PollVote | season | Cascade |
| PollVote | user | Cascade |
| Game | season | Cascade |
| Game | createdBy | Cascade |
| GamePlayer | game | Cascade |
| GamePlayer | user | Cascade |
| GamePlayer | deck | SetNull |
| Deck | user | Cascade |

This ensures the database handles cascading deletes atomically. The `GamePlayer.deck` relation uses `SetNull` (since `deckId` is already nullable) so that deleting a User's Decks doesn't fail due to GamePlayer foreign key constraints.

## UI Changes

### Budget Tab

- Add a delete button (red outline variant, trash icon) next to the current season display
- Disabled with tooltip "End season before deleting" when status = ACTIVE
- Enabled for POLLING and COMPLETED seasons
- Confirmation dialog mentions cascade: "This will also delete all associated poll votes and games."

### Polls Tab

- Change data fetching: fetch individual PollVote records (with id, user name, choice) instead of only aggregated counts
- Display individual votes with user name, choice, and a remove button per row
- Keep showing aggregated totals (counts/percentages) above the individual list
- Confirmation dialog: "Remove [user]'s vote?"

### New Games Tab

- New tab in admin panel, positioned between Disputes and Users
- Lists all games across all seasons
- Displays: season name, date, players, status (PENDING/CONFIRMED/DISPUTED)
- Delete button on each row
- Confirmation dialog: "This will also delete all player records for this game."

### Users Tab

- Add a delete button next to each user row
- Hidden for ADMIN role users
- Hidden for the currently logged-in admin (no self-deletion)
- Confirmation dialog: "This will permanently delete [user] and all their data (decks, votes, games)."

### Confirmation Dialog

- Reuse shadcn AlertDialog component
- Red destructive action button
- Mentions cascade impact in the description

## Data Fetching

The admin `page.tsx` server component needs to additionally fetch:

- All games (for the new Games tab) with season name, players, and status
- Individual PollVote records (for the Polls tab) with id, user name, and choice — replacing or supplementing the current `groupBy` aggregation

Existing queries already cover seasons, disputed games, and users.

## Guard Rail Summary

| Entity | Condition | Behavior |
|--------|-----------|----------|
| Season | status = ACTIVE | Delete button disabled, tooltip explains |
| User | role = ADMIN | Delete button hidden |
| User | target = self | Delete button hidden |
| All | Any delete | Confirmation dialog required |
