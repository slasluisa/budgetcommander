import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const recaps = await prisma.gameRecap.findMany({
    where: { gameId: id },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(recaps);
}

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
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text || text.length > 280) {
    return NextResponse.json(
      { error: "Recap must be 1-280 characters" },
      { status: 400 }
    );
  }

  const game = await prisma.game.findUnique({
    where: { id },
    include: { players: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: "Recaps can only be added to confirmed games" },
      { status: 400 }
    );
  }

  const isParticipant = game.players.some((p) => p.userId === userId);
  if (!isParticipant) {
    return NextResponse.json(
      { error: "You are not a player in this game" },
      { status: 403 }
    );
  }

  const existing = await prisma.gameRecap.findUnique({
    where: { gameId_userId: { gameId: id, userId } },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You already submitted a recap for this game" },
      { status: 409 }
    );
  }

  const recap = await prisma.gameRecap.create({
    data: { gameId: id, userId, text },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  return NextResponse.json(recap, { status: 201 });
}
