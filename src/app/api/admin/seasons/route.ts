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

  const existing = await prisma.season.findFirst({
    where: { status: { in: ["POLLING", "ACTIVE"] } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A POLLING or ACTIVE season already exists" },
      { status: 409 }
    );
  }

  const body = await req.json();
  const { name } = body;
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const season = await prisma.season.create({
    data: { name, status: "POLLING" },
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: "season.create",
    targetType: "season",
    targetId: season.id,
    summary: `Created season ${season.name}`,
    details: { status: season.status },
  });

  return NextResponse.json(season, { status: 201 });
}
