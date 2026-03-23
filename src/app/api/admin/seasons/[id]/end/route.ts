import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
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

  const season = await prisma.season.findUnique({ where: { id } });
  if (!season) {
    return NextResponse.json({ error: "Season not found" }, { status: 404 });
  }

  const updated = await prisma.season.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json(updated);
}
