import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id!;

  const decks = await prisma.deck.findMany({
    where: { userId, archived: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(decks);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id!;

  const body = await req.json();
  const { name, commander, externalLink } = body;

  if (!name || !commander) {
    return NextResponse.json(
      { error: "name and commander are required" },
      { status: 400 }
    );
  }

  const trimmedLink = externalLink?.trim();
  if (!trimmedLink) {
    return NextResponse.json(
      { error: "Decklist link is required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { defaultDeckId: true },
  });

  const deck = await prisma.$transaction(async (tx) => {
    const createdDeck = await tx.deck.create({
      data: {
        userId,
        name,
        commander,
        externalLink: trimmedLink,
      },
    });

    if (!user?.defaultDeckId) {
      await tx.user.update({
        where: { id: userId },
        data: { defaultDeckId: createdDeck.id },
      });
    }

    return createdDeck;
  });

  return NextResponse.json(deck, { status: 201 });
}
