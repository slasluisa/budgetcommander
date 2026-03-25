-- Truncate dependent tables first (cascade data loss is acceptable)
TRUNCATE TABLE "GamePlayer", "PollVote", "Game", "Deck", "User" CASCADE;

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" RENAME COLUMN "email" TO "username";

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
