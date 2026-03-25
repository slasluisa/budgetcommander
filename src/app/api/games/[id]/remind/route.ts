import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canSendReminder } from "@/lib/league";
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
      { error: "Only pending games can receive reminders" },
      { status: 409 }
    );
  }

  if (!canSendReminder(game.lastReminderAt)) {
    return NextResponse.json(
      { error: "A reminder was already sent recently" },
      { status: 429 }
    );
  }

  const unconfirmedPlayers = game.players.filter((player) => !player.confirmed);

  await prisma.game.update({
    where: { id },
    data: { lastReminderAt: new Date() },
  });

  await createNotifications(
    unconfirmedPlayers.map((player) => player.userId),
    {
      title: "Reminder to confirm game",
      body: `${session.user.name ?? "A player"} is waiting on your confirmation for a pending pod.`,
      href: `/games/${id}`,
    }
  );

  return NextResponse.json({ success: true });
}
