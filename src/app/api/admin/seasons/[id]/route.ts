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

  const season = await prisma.season.findUnique({ where: { id } });
  if (!season) {
    return NextResponse.json({ error: "Season not found" }, { status: 404 });
  }

  if (season.status === "ACTIVE") {
    return NextResponse.json(
      { error: "Cannot delete an ACTIVE season. End it first." },
      { status: 400 }
    );
  }

  await prisma.season.delete({ where: { id } });

  await writeAuditLog({
    actorId: session.user.id,
    action: "season.delete",
    targetType: "season",
    targetId: season.id,
    summary: `Deleted season ${season.name}`,
    details: { status: season.status, budgetCap: season.budgetCap },
  });

  return NextResponse.json({ success: true });
}
