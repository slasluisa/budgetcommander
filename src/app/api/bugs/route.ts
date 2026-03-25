import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json().catch(() => ({}));
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const pagePath =
    typeof body.pagePath === "string" ? body.pagePath.trim() : "";

  if (!description) {
    return NextResponse.json(
      { error: "Bug description is required" },
      { status: 400 }
    );
  }

  if (description.length > 2000) {
    return NextResponse.json(
      { error: "Bug description must be 2000 characters or less" },
      { status: 400 }
    );
  }

  if (pagePath.length > 500) {
    return NextResponse.json(
      { error: "Page path must be 500 characters or less" },
      { status: 400 }
    );
  }

  const bugReport = await prisma.bugReport.create({
    data: {
      userId: session?.user?.id ?? null,
      description,
      pagePath: pagePath || null,
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json(bugReport, { status: 201 });
}
