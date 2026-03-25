import { NextResponse } from "next/server";
import { GameStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get("seasonId") ?? undefined;
  const playerId = searchParams.get("playerId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const overdueOnly = searchParams.get("overdue") === "true";
  const q = searchParams.get("q")?.trim();

  const games = await prisma.game.findMany({
    where: {
      ...(seasonId ? { seasonId } : {}),
      ...(playerId ? { players: { some: { userId: playerId } } } : {}),
      ...(status ? { status: status as GameStatus } : {}),
      ...(overdueOnly
        ? {
            status: "PENDING",
            createdAt: {
              lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            },
          }
        : {}),
      ...(q
        ? {
            players: {
              some: {
                user: {
                  name: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
              },
            },
          }
        : {}),
    },
    include: {
      players: {
        include: {
          user: true,
          deck: true,
        },
      },
      season: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(games);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { playerIds, deckId, winnerId } = body;

  if (
    !Array.isArray(playerIds) ||
    playerIds.length !== 3 ||
    !deckId ||
    !winnerId
  ) {
    return NextResponse.json(
      { error: "playerIds (3), deckId, and winnerId are required" },
      { status: 400 }
    );
  }

  const creatorId = session.user.id!;

  // Validate active season
  const season = await prisma.season.findFirst({
    where: { status: "ACTIVE" },
  });
  if (!season) {
    return NextResponse.json(
      { error: "No active season" },
      { status: 409 }
    );
  }

  // Validate deck ownership
  const deck = await prisma.deck.findUnique({ where: { id: deckId } });
  if (!deck || deck.userId !== creatorId || deck.archived) {
    return NextResponse.json(
      { error: "Invalid deck or deck does not belong to you" },
      { status: 400 }
    );
  }

  // All 4 players: creator + 3 others
  const allPlayerIds = [creatorId, ...playerIds];

  // Validate winnerId is one of the players
  if (!allPlayerIds.includes(winnerId)) {
    return NextResponse.json(
      { error: "winnerId must be one of the players" },
      { status: 400 }
    );
  }

  const existingPendingGames = await prisma.game.findMany({
    where: {
      seasonId: season.id,
      status: "PENDING",
      players: {
        some: {
          userId: { in: allPlayerIds },
        },
      },
    },
    include: {
      players: {
        select: { userId: true },
      },
    },
  });

  const duplicateGame = existingPendingGames.find((pendingGame) => {
    const existingIds = pendingGame.players.map((player) => player.userId).sort();
    const nextIds = [...allPlayerIds].sort();
    return (
      existingIds.length === nextIds.length &&
      existingIds.every((id, index) => id === nextIds[index])
    );
  });

  if (duplicateGame) {
    return NextResponse.json(
      { error: "This pod already has a pending game waiting for confirmation" },
      { status: 409 }
    );
  }

  const game = await prisma.game.create({
    data: {
      seasonId: season.id,
      createdById: creatorId,
      status: "PENDING",
      players: {
        create: allPlayerIds.map((userId) => ({
          userId,
          deckId: userId === creatorId ? deckId : null,
          isWinner: userId === winnerId,
          confirmed: userId === creatorId,
        })),
      },
    },
    include: {
      players: {
        include: {
          user: true,
          deck: true,
        },
      },
      season: true,
    },
  });

  await createNotifications(playerIds, {
    title: "Game confirmation requested",
    body: `${session.user.name ?? "A player"} logged a pod and needs your confirmation.`,
    href: `/games/${game.id}`,
  });

  return NextResponse.json(game, { status: 201 });
}
