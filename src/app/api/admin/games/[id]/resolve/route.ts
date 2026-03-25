import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
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
  if ((session.user as { role?: string }).role !== "ADMIN") {
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

  await writeAuditLog({
    actorId: session.user.id,
    action: "game.resolve",
    targetType: "game",
    targetId: updatedGame.id,
    summary: `Resolved disputed game ${updatedGame.id}`,
    details: { winnerId },
  });

  await createNotifications(
    updatedGame.players.map((player) => player.userId),
    {
      title: "Dispute resolved",
      body: "An admin resolved the disputed pod and updated the result.",
      href: `/games/${updatedGame.id}`,
    }
  );

  return NextResponse.json(updatedGame);
}
