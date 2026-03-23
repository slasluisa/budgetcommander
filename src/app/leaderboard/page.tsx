import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/leaderboard-table";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const activeSeason = await prisma.season.findFirst({
    where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!activeSeason) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No active season yet.</p>
      </div>
    );
  }

  const gamePlayers = await prisma.gamePlayer.findMany({
    where: {
      game: { seasonId: activeSeason.id, status: "CONFIRMED" },
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  const statsMap = new Map<string, { username: string; avatar: string | null; wins: number; losses: number }>();

  for (const gp of gamePlayers) {
    const existing = statsMap.get(gp.userId) ?? {
      username: gp.user.name,
      avatar: gp.user.avatar,
      wins: 0,
      losses: 0,
    };
    if (gp.isWinner) existing.wins++;
    else existing.losses++;
    statsMap.set(gp.userId, existing);
  }

  const players = Array.from(statsMap.entries())
    .map(([id, stats]) => ({
      id,
      ...stats,
      winRate: stats.wins + stats.losses > 0
        ? (stats.wins / (stats.wins + stats.losses)) * 100
        : 0,
    }))
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{activeSeason.name} — Leaderboard</h1>
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <LeaderboardTable players={players} />
        </CardContent>
      </Card>
    </div>
  );
}
