import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_CHOICES = [20, 50, 100];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { choice } = body;

  if (!VALID_CHOICES.includes(choice)) {
    return NextResponse.json(
      { error: "Choice must be 20, 50, or 100" },
      { status: 400 }
    );
  }

  const season = await prisma.season.findFirst({
    where: { status: "POLLING" },
  });
  if (!season) {
    return NextResponse.json(
      { error: "No active polling season" },
      { status: 409 }
    );
  }

  const userId = session.user.id!;

  const vote = await prisma.pollVote.upsert({
    where: { seasonId_userId: { seasonId: season.id, userId } },
    create: { seasonId: season.id, userId, choice },
    update: { choice },
  });

  return NextResponse.json(vote);
}
