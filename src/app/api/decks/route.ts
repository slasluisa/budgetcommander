import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decks = await prisma.deck.findMany({
    where: { userId: session.user.id!, archived: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(decks);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, commander, externalLink } = body;

  if (!name || !commander) {
    return NextResponse.json(
      { error: "name and commander are required" },
      { status: 400 }
    );
  }

  const deck = await prisma.deck.create({
    data: {
      userId: session.user.id!,
      name,
      commander,
      externalLink: externalLink ?? null,
    },
  });

  return NextResponse.json(deck, { status: 201 });
}
