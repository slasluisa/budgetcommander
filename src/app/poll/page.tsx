import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PollWidget } from "@/components/poll-widget";

export const dynamic = "force-dynamic";

export default async function PollPage() {
  const session = await auth();

  const season = await prisma.season.findFirst({
    where: { status: { in: ["POLLING", "ACTIVE", "COMPLETED"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!season) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No season created yet.</p>
      </div>
    );
  }

  const votes = await prisma.pollVote.groupBy({
    by: ["choice"],
    where: { seasonId: season.id },
    _count: { choice: true },
  });

  const total = votes.reduce((sum, v) => sum + v._count.choice, 0);

  const userVote = session?.user
    ? await prisma.pollVote.findUnique({
        where: {
          seasonId_userId: {
            seasonId: season.id,
            userId: session.user.id!,
          },
        },
      })
    : null;

  const results = {
    total,
    votes: [20, 50, 100].map((choice) => {
      const v = votes.find((x) => x.choice === choice);
      const count = v?._count.choice ?? 0;
      return {
        choice,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    }),
    userVote: userVote?.choice ?? null,
    locked: season.status !== "POLLING",
    budgetCap: season.budgetCap,
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-center text-3xl font-bold">{season.name} — Budget Poll</h1>
      <PollWidget results={results} />
    </div>
  );
}
