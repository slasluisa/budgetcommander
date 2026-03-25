import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { choice: tieBreaker } = body;

  const season = await prisma.season.findFirst({
    where: { status: "POLLING" },
  });
  if (!season) {
    return NextResponse.json(
      { error: "No active polling season" },
      { status: 409 }
    );
  }

  const votes = await prisma.pollVote.findMany({
    where: { seasonId: season.id },
  });

  if (votes.length === 0) {
    return NextResponse.json({ error: "No votes cast" }, { status: 409 });
  }

  // Count votes per choice
  const counts: Record<number, number> = {};
  for (const vote of votes) {
    counts[vote.choice] = (counts[vote.choice] ?? 0) + 1;
  }

  const maxCount = Math.max(...Object.values(counts));
  const winners = Object.entries(counts)
    .filter(([, count]) => count === maxCount)
    .map(([choice]) => Number(choice));

  let budgetCap: number;

  if (winners.length === 1) {
    budgetCap = winners[0];
  } else {
    // There is a tie
    if (tieBreaker !== undefined && winners.includes(Number(tieBreaker))) {
      budgetCap = Number(tieBreaker);
    } else {
      return NextResponse.json(
        { error: "Tie detected", tiedOptions: winners },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.season.update({
    where: { id: season.id },
    data: { status: "ACTIVE", budgetCap },
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: "poll.lock",
    targetType: "season",
    targetId: season.id,
    summary: `Locked poll for ${season.name} at $${budgetCap}`,
    details: { tiedOptions: winners.length > 1 ? winners : undefined },
  });

  return NextResponse.json(updated);
}
