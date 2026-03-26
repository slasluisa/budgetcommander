import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PropCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = new Set<string>(Object.values(PropCategory));

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const props = await prisma.gameProp.findMany({
    where: { gameId: id },
    include: {
      giver: { select: { id: true, name: true, avatar: true } },
      receiver: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(props);
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
  const giverId = session.user.id!;

  const body = await req.json().catch(() => ({}));
  const { receiverId, category } = body;

  if (!receiverId || typeof receiverId !== "string") {
    return NextResponse.json(
      { error: "receiverId is required" },
      { status: 400 }
    );
  }

  if (!category || !VALID_CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: "Invalid prop category" },
      { status: 400 }
    );
  }

  if (receiverId === giverId) {
    return NextResponse.json(
      { error: "You cannot give props to yourself" },
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
      { error: "Props can only be given on confirmed games" },
      { status: 400 }
    );
  }

  const isGiverParticipant = game.players.some((p) => p.userId === giverId);
  const isReceiverParticipant = game.players.some((p) => p.userId === receiverId);

  if (!isGiverParticipant) {
    return NextResponse.json(
      { error: "You are not a player in this game" },
      { status: 403 }
    );
  }

  if (!isReceiverParticipant) {
    return NextResponse.json(
      { error: "Receiver is not a player in this game" },
      { status: 400 }
    );
  }

  const existing = await prisma.gameProp.findUnique({
    where: { gameId_giverId: { gameId: id, giverId } },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You already gave props for this game" },
      { status: 409 }
    );
  }

  const prop = await prisma.gameProp.create({
    data: {
      gameId: id,
      giverId,
      receiverId,
      category: category as PropCategory,
    },
    include: {
      giver: { select: { id: true, name: true, avatar: true } },
      receiver: { select: { id: true, name: true, avatar: true } },
    },
  });

  return NextResponse.json(prop, { status: 201 });
}
