import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SeasonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const season = await prisma.season.findUnique({
    where: { id },
    include: {
      games: {
        where: { status: "CONFIRMED" },
        include: {
          players: {
            include: {
              user: { select: { id: true, name: true, avatar: true } },
              deck: { select: { commander: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      pollVotes: true,
    },
  });

  if (!season) notFound();

  const playerStats = new Map<
    string,
    { username: string; avatar: string | null; wins: number; losses: number; games: number }
  >();
  const commanderCounts = new Map<string, number>();

  for (const game of season.games) {
    for (const player of game.players) {
      const existing = playerStats.get(player.user.id) ?? {
        username: player.user.name,
        avatar: player.user.avatar,
        wins: 0,
        losses: 0,
        games: 0,
      };
      existing.games += 1;
      if (player.isWinner) existing.wins += 1;
      else existing.losses += 1;
      playerStats.set(player.user.id, existing);

      if (player.deck?.commander) {
        commanderCounts.set(
          player.deck.commander,
          (commanderCounts.get(player.deck.commander) ?? 0) + 1
        );
      }
    }
  }

  const players = Array.from(playerStats.entries())
    .map(([playerId, stats]) => ({
      id: playerId,
      username: stats.username,
      avatar: stats.avatar,
      wins: stats.wins,
      losses: stats.losses,
      winRate: stats.games > 0 ? (stats.wins / stats.games) * 100 : 0,
    }))
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);

  const champion = players[0];
  const grinder = Array.from(playerStats.entries())
    .map(([playerId, stats]) => ({ id: playerId, username: stats.username, games: stats.games }))
    .sort((a, b) => b.games - a.games)[0];
  const signatureCommander =
    Array.from(commanderCounts.entries()).sort((a, b) => b[1] - a[1])[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{season.name}</h1>
        <Badge
          variant="outline"
          className={
            season.status === "ACTIVE"
              ? "border-green-500/30 text-green-400"
              : season.status === "POLLING"
              ? "border-yellow-500/30 text-yellow-400"
              : "border-border text-muted-foreground"
          }
        >
          {season.status}
        </Badge>
        <Badge variant="outline" className="border-border text-muted-foreground">
          Budget {season.budgetCap ? `$${season.budgetCap}` : "TBD"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Champion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{champion?.username ?? "TBD"}</p>
            <p className="text-sm text-muted-foreground">
              {champion ? `${champion.wins} wins` : "No confirmed games yet"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Most Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{grinder?.username ?? "TBD"}</p>
            <p className="text-sm text-muted-foreground">
              {grinder ? `${grinder.games} confirmed games` : "No confirmed games yet"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Signature Commander</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{signatureCommander?.[0] ?? "TBD"}</p>
            <p className="text-sm text-muted-foreground">
              {signatureCommander ? `${signatureCommander[1]} appearances` : "No commander data yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Standings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <LeaderboardTable players={players} />
        </CardContent>
      </Card>

      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Recent Confirmed Games</CardTitle>
        </CardHeader>
        <CardContent>
          {season.games.length === 0 ? (
            <p className="text-muted-foreground">No confirmed games yet.</p>
          ) : (
            <div className="space-y-3">
              {season.games.slice(0, 8).map((game) => (
                <div key={game.id} className="rounded-lg bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      Winner: {game.players.find((player) => player.isWinner)?.user.name ?? "Unknown"}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(game.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {game.players
                      .map((player) =>
                        `${player.user.name}${player.deck?.commander ? ` (${player.deck.commander})` : ""}`
                      )
                      .join(", ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
