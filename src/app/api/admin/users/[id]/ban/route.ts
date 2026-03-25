import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(
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

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.role === "ADMIN") {
    return NextResponse.json(
      { error: "Cannot ban an admin user" },
      { status: 403 }
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { banned: !user.banned },
    select: { id: true, name: true, username: true, role: true, banned: true },
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: updated.banned ? "user.ban" : "user.unban",
    targetType: "user",
    targetId: updated.id,
    summary: `${updated.banned ? "Banned" : "Unbanned"} user ${updated.name}`,
    details: { username: updated.username },
  });

  return NextResponse.json(updated);
}
