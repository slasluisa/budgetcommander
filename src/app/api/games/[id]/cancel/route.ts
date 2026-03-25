import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotifications } from "@/lib/notifications";

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
  const game = await prisma.game.findUnique({
    where: { id },
    include: { players: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const isAdmin = (session.user as { role?: string }).role === "ADMIN";
  if (game.createdById !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (game.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only pending games can be cancelled" },
      { status: 409 }
    );
  }

  const updated = await prisma.game.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
    include: {
      players: { include: { user: true, deck: true } },
      season: true,
    },
  });

  await createNotifications(
    game.players.map((player) => player.userId),
    {
      title: "Pending game cancelled",
      body: "This pod was cancelled before confirmation completed.",
      href: `/games/${id}`,
    }
  );

  return NextResponse.json(updated);
}
