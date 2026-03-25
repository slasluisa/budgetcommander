import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const vote = await prisma.pollVote.findUnique({ where: { id } });
  if (!vote) {
    return NextResponse.json({ error: "Vote not found" }, { status: 404 });
  }

  await prisma.pollVote.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
