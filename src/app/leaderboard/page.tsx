import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Badge } from "@/components/ui/badge";

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
      games: stats.wins + stats.losses,
      winRate: stats.wins + stats.losses > 0
        ? (stats.wins / (stats.wins + stats.losses)) * 100
        : 0,
    }))
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);

  const topCommander = await prisma.gamePlayer.groupBy({
    by: ["deckId"],
    where: {
      game: { seasonId: activeSeason.id, status: "CONFIRMED" },
      deckId: { not: null },
    },
    _count: { deckId: true },
    orderBy: { _count: { deckId: "desc" } },
    take: 1,
  });

  const commanderDeck = topCommander[0]?.deckId
    ? await prisma.deck.findUnique({
        where: { id: topCommander[0].deckId },
        select: { commander: true, name: true },
      })
    : null;

  const grinder = players
    .slice()
    .sort((a, b) => (b.games ?? 0) - (a.games ?? 0))[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{activeSeason.name} — Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            Current season standings with quick league analytics.
          </p>
        </div>
        <Link
          href="/seasons"
          className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Season Archive
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Leader</p>
            <p className="text-xl font-semibold">{players[0]?.username ?? "TBD"}</p>
            <p className="text-sm text-muted-foreground">
              {players[0] ? `${players[0].wins} wins` : "No confirmed games yet"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Most Active</p>
            <p className="text-xl font-semibold">{grinder?.username ?? "TBD"}</p>
            <p className="text-sm text-muted-foreground">
              {grinder ? `${grinder.games} games` : "No games yet"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Most Played Commander</p>
            <p className="text-xl font-semibold">{commanderDeck?.commander ?? "TBD"}</p>
            <p className="text-sm text-muted-foreground">
              {commanderDeck ? commanderDeck.name : "No deck data yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <LeaderboardTable players={players} />
        </CardContent>
      </Card>

      {players.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-primary/20 text-primary">
            Season award: {players[0].username} is in first place
          </Badge>
          {grinder && (
            <Badge className="bg-secondary/20 text-secondary">
              Grinder: {grinder.username}
            </Badge>
          )}
          {commanderDeck && (
            <Badge variant="outline" className="border-border text-muted-foreground">
              Signature brew: {commanderDeck.commander}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
