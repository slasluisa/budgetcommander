-- CreateEnum
CREATE TYPE "PropCategory" AS ENUM ('BEST_PLAY', 'SCARIEST_BOARD', 'CLUTCH_WIN', 'KINGMAKER', 'BEST_SPORT');

-- CreateTable
CREATE TABLE "GameRecap" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" VARCHAR(280) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameRecap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameProp" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "giverId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "category" "PropCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameProp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameRecap_gameId_userId_key" ON "GameRecap"("gameId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "GameProp_gameId_giverId_key" ON "GameProp"("gameId", "giverId");

-- AddForeignKey
ALTER TABLE "GameRecap" ADD CONSTRAINT "GameRecap_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRecap" ADD CONSTRAINT "GameRecap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameProp" ADD CONSTRAINT "GameProp_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameProp" ADD CONSTRAINT "GameProp_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameProp" ADD CONSTRAINT "GameProp_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
