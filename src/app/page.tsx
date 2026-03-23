import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameCard } from "@/components/game-card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const currentSeason = await prisma.season.findFirst({
    where: { status: { in: ["POLLING", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
  });

  const recentGames = await prisma.game.findMany({
    take: 4,
    orderBy: { createdAt: "desc" },
    include: {
      players: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          deck: { select: { name: true, commander: true } },
        },
      },
      season: { select: { name: true } },
    },
  });

  // Top 5 players from leaderboard
  const topPlayers = currentSeason
    ? await prisma.gamePlayer
        .findMany({
          where: { game: { seasonId: currentSeason.id, status: "CONFIRMED" } },
          include: { user: { select: { id: true, name: true, avatar: true } } },
        })
        .then((gps) => {
          const map = new Map<string, { name: string; wins: number; games: number }>();
          for (const gp of gps) {
            const e = map.get(gp.userId) ?? { name: gp.user.name, wins: 0, games: 0 };
            e.games++;
            if (gp.isWinner) e.wins++;
            map.set(gp.userId, e);
          }
          return Array.from(map.entries())
            .map(([id, s]) => ({ id, ...s }))
            .sort((a, b) => b.wins - a.wins)
            .slice(0, 5);
        })
    : [];

  return (
    <div>
      {/* Hero */}
      <div className="relative mb-12 flex flex-col items-center justify-center py-16 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50 rounded-xl" />
        <h1 className="relative text-5xl font-extrabold tracking-tight md:text-6xl">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Budget Commander
          </span>
        </h1>
        <p className="relative mt-3 text-xl text-muted-foreground">League</p>
        {currentSeason && (
          <Badge variant="outline" className="relative mt-4 border-primary/30 text-primary">
            {currentSeason.name} — {currentSeason.status === "POLLING" ? "Voting Open" : `$${currentSeason.budgetCap} Budget`}
          </Badge>
        )}
        <div className="relative mt-6 flex gap-3">
          {currentSeason?.status === "POLLING" && (
            <Link href="/poll" className={buttonVariants()}>
              Vote Now
            </Link>
          )}
          <Link href="/leaderboard" className={buttonVariants({ variant: "outline" }) + " border-border"}>
            View Standings
          </Link>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Recent Games */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent Games</h2>
            <Link href="/games" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              View All
            </Link>
          </div>
          {recentGames.length === 0 ? (
            <p className="text-muted-foreground">No games yet.</p>
          ) : (
            <div className="grid gap-4">
              {recentGames.map((game) => (
                <GameCard key={game.id} game={JSON.parse(JSON.stringify(game))} />
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard Preview */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Top Players</h2>
            <Link href="/leaderboard" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Full Standings
            </Link>
          </div>
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="p-0">
              {topPlayers.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground">No confirmed games yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {topPlayers.map((player, idx) => (
                    <Link
                      key={player.id}
                      href={`/players/${player.id}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-bold ${
                            idx === 0 ? "text-yellow-400" : idx === 1 ? "text-gray-300" : idx === 2 ? "text-orange-400" : "text-muted-foreground"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span>{player.name}</span>
                      </div>
                      <span className="text-sm text-green-400">{player.wins}W</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
