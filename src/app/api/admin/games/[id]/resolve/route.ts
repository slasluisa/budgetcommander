import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { winnerId } = body;

  if (!winnerId) {
    return NextResponse.json({ error: "winnerId is required" }, { status: 400 });
  }

  const game = await prisma.game.findUnique({
    where: { id },
    include: { players: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const winnerPlayer = game.players.find((p) => p.userId === winnerId);
  if (!winnerPlayer) {
    return NextResponse.json(
      { error: "winnerId is not a player in this game" },
      { status: 400 }
    );
  }

  const updatedGame = await prisma.$transaction(async (tx) => {
    // Reset all isWinner to false
    await tx.gamePlayer.updateMany({
      where: { gameId: id },
      data: { isWinner: false, confirmed: true },
    });

    // Set the winner
    await tx.gamePlayer.update({
      where: { id: winnerPlayer.id },
      data: { isWinner: true },
    });

    // Mark game as CONFIRMED
    return tx.game.update({
      where: { id },
      data: { status: "CONFIRMED" },
      include: {
        players: { include: { user: true, deck: true } },
        season: true,
      },
    });
  });

  return NextResponse.json(updatedGame);
}
