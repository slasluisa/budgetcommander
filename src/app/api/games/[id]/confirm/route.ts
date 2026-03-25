import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id!;

  const body = await req.json().catch(() => ({}));
  const { deckId } = body;

  const game = await prisma.game.findUnique({
    where: { id },
    include: { players: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const playerEntry = game.players.find((p) => p.userId === userId);
  if (!playerEntry) {
    return NextResponse.json(
      { error: "You are not a player in this game" },
      { status: 403 }
    );
  }

  if (playerEntry.confirmed) {
    return NextResponse.json(
      { error: "You have already confirmed this game" },
      { status: 409 }
    );
  }

  if (!playerEntry.deckId && !deckId) {
    return NextResponse.json(
      { error: "Select your deck before confirming" },
      { status: 400 }
    );
  }

  // Validate deck belongs to user if provided
  if (deckId) {
    const deck = await prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck || deck.userId !== userId || deck.archived) {
      return NextResponse.json(
        { error: "Invalid deck or deck does not belong to you" },
        { status: 400 }
      );
    }
  }

  // Update the player entry
  await prisma.gamePlayer.update({
    where: { id: playerEntry.id },
    data: {
      confirmed: true,
      ...(deckId ? { deckId } : {}),
    },
  });

  // Check if all 4 players are now confirmed
  const updatedPlayers = await prisma.gamePlayer.findMany({
    where: { gameId: id },
  });

  const allConfirmed = updatedPlayers.every((p) => p.confirmed);

  let updatedGame;
  if (allConfirmed) {
    updatedGame = await prisma.game.update({
      where: { id },
      data: { status: "CONFIRMED" },
      include: { players: { include: { user: true, deck: true } }, season: true },
    });
    await createNotifications(
      updatedGame.players.map((player) => player.userId),
      {
        title: "Game confirmed",
        body: "All players confirmed this pod. Standings are now updated.",
        href: `/games/${id}`,
      }
    );
  } else {
    updatedGame = await prisma.game.findUnique({
      where: { id },
      include: { players: { include: { user: true, deck: true } }, season: true },
    });
  }

  return NextResponse.json(updatedGame);
}
