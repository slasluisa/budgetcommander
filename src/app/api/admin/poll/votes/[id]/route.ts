import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
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

  const vote = await prisma.pollVote.findUnique({ where: { id } });
  if (!vote) {
    return NextResponse.json({ error: "Vote not found" }, { status: 404 });
  }

  await prisma.pollVote.delete({ where: { id } });

  await writeAuditLog({
    actorId: session.user.id,
    action: "poll.vote.delete",
    targetType: "pollVote",
    targetId: vote.id,
    summary: `Removed a $${vote.choice} vote`,
    details: { seasonId: vote.seasonId, userId: vote.userId },
  });

  return NextResponse.json({ success: true });
}
