import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id!;

  const { id } = await params;
  const deck = await prisma.deck.findUnique({ where: { id } });
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }
  if (deck.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const commander =
    typeof body.commander === "string" ? body.commander.trim() : undefined;
  const externalLink =
    typeof body.externalLink === "string" ? body.externalLink.trim() : undefined;
  const isDefault =
    typeof body.isDefault === "boolean" ? body.isDefault : undefined;

  if (name !== undefined && !name) {
    return NextResponse.json({ error: "Deck name is required" }, { status: 400 });
  }
  if (commander !== undefined && !commander) {
    return NextResponse.json({ error: "Commander is required" }, { status: 400 });
  }
  if (externalLink !== undefined && !externalLink) {
    return NextResponse.json(
      { error: "Decklist link is required" },
      { status: 400 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedDeck = await tx.deck.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(commander !== undefined ? { commander } : {}),
        ...(externalLink !== undefined ? { externalLink } : {}),
      },
    });

    if (isDefault !== undefined) {
      await tx.user.update({
        where: { id: userId },
        data: { defaultDeckId: isDefault ? id : null },
      });
    }

    return updatedDeck;
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id!;

  const { id } = await params;

  const deck = await prisma.deck.findUnique({ where: { id } });
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }
  if (deck.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const archivedDeck = await tx.deck.update({
      where: { id },
      data: { archived: true },
    });

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { defaultDeckId: true },
    });

    if (user?.defaultDeckId === id) {
      const replacement = await tx.deck.findFirst({
        where: {
          userId,
          archived: false,
          id: { not: id },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      await tx.user.update({
        where: { id: userId },
        data: { defaultDeckId: replacement?.id ?? null },
      });
    }

    return archivedDeck;
  });

  return NextResponse.json(updated);
}
