import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id!;

  const game = await prisma.game.findUnique({
    where: { id },
    include: { players: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const isPlayer = game.players.some((p) => p.userId === userId);
  if (!isPlayer) {
    return NextResponse.json(
      { error: "You are not a player in this game" },
      { status: 403 }
    );
  }

  if (game.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only PENDING games can be disputed" },
      { status: 409 }
    );
  }

  const updated = await prisma.game.update({
    where: { id },
    data: { status: "DISPUTED" },
    include: { players: { include: { user: true, deck: true } }, season: true },
  });

  return NextResponse.json(updated);
}
