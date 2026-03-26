import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatUsdFromCents } from "@/lib/currency";
import { buildPlayerAchievements, summarizeWins } from "@/lib/league";

export const dynamic = "force-dynamic";

function getCurrentStreak(results: { isWinner: boolean }[]) {
  let streak = 0;
  for (const result of results) {
    if (!result.isWinner) break;
    streak += 1;
  }
  return streak;
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      decks: { where: { archived: false }, orderBy: { createdAt: "desc" } },
      gamePlayers: {
        where: { game: { status: "CONFIRMED" } },
        include: {
          game: {
            select: {
              id: true,
              createdAt: true,
              season: { select: { name: true } },
              players: {
                include: {
                  user: { select: { id: true, name: true } },
                  deck: { select: { commander: true } },
                },
              },
            },
          },
          deck: {
            select: { id: true, name: true, commander: true, validatedPriceCents: true },
          },
        },
      },
    },
  });

  if (!user) notFound();

  user.gamePlayers.sort(
    (a, b) => new Date(b.game.createdAt).getTime() - new Date(a.game.createdAt).getTime()
  );

  const overall = summarizeWins(user.gamePlayers);
  const deckStatsMap = new Map<
    string,
    {
      name: string;
      commander: string;
      validatedPriceCents: number | null;
      wins: number;
      games: number;
    }
  >();
  const opponentMap = new Map<string, number>();
  const favoriteCommanderCounts = new Map<string, number>();

  for (const gp of user.gamePlayers) {
    if (gp.deck) {
      const key = gp.deckId!;
      const existing = deckStatsMap.get(key) ?? {
        name: gp.deck.name,
        commander: gp.deck.commander,
        validatedPriceCents: gp.deck.validatedPriceCents,
        wins: 0,
        games: 0,
      };
      existing.games++;
      if (gp.isWinner) existing.wins++;
      deckStatsMap.set(key, existing);

      favoriteCommanderCounts.set(
        gp.deck.commander,
        (favoriteCommanderCounts.get(gp.deck.commander) ?? 0) + 1
      );
    }

    for (const player of gp.game.players) {
      if (player.user.id === user.id) continue;
      opponentMap.set(player.user.name, (opponentMap.get(player.user.name) ?? 0) + 1);
    }
  }

  const favoriteCommander =
    Array.from(favoriteCommanderCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    null;
  const deckStats = Array.from(deckStatsMap.values()).sort((a, b) => b.wins - a.wins);
  const topOpponents = Array.from(opponentMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const achievements = buildPlayerAchievements({
    wins: overall.wins,
    games: overall.games,
    currentStreak: getCurrentStreak(user.gamePlayers),
    favoriteCommander,
    uniqueDecks: deckStats.length,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.avatar ?? undefined} />
          <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Games", value: overall.games, color: "text-foreground" },
          { label: "Wins", value: overall.wins, color: "text-green-400" },
          { label: "Losses", value: overall.losses, color: "text-red-400" },
          { label: "Win Rate", value: `${overall.winRate.toFixed(1)}%`, color: "text-accent" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border bg-card/50 backdrop-blur-sm text-center">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {achievements.length > 0 && (
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {achievements.map((achievement) => (
              <Badge key={achievement.label} className="bg-primary/20 text-primary">
                {achievement.label}: {achievement.description}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Deck Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {deckStats.length === 0 ? (
              <p className="text-muted-foreground">No confirmed games yet.</p>
            ) : (
              <div className="space-y-3">
                {deckStats.map((deck) => (
                  <div key={deck.commander} className="flex items-center justify-between rounded-lg bg-muted/20 p-3">
                    <div>
                      <p className="font-medium">{deck.name}</p>
                      <p className="text-sm text-muted-foreground">{deck.commander}</p>
                      {deck.validatedPriceCents != null ? (
                        <p className="text-sm text-muted-foreground">
                          Saved validated price: {formatUsdFromCents(deck.validatedPriceCents)}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        <span className="text-green-400">{deck.wins}W</span>
                        {" / "}
                        <span className="text-red-400">{deck.games - deck.wins}L</span>
                      </p>
                      <p className="text-xs text-accent">
                        {((deck.wins / deck.games) * 100).toFixed(0)}% win rate
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted/20 p-3">
              <p className="text-sm text-muted-foreground">Current win streak</p>
              <p className="text-xl font-semibold">{getCurrentStreak(user.gamePlayers)}</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-3">
              <p className="text-sm text-muted-foreground">Favorite commander</p>
              <p className="text-xl font-semibold">{favoriteCommander ?? "None yet"}</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-3">
              <p className="text-sm text-muted-foreground">Top pod-mates</p>
              {topOpponents.length === 0 ? (
                <p className="text-sm">No repeat opponents yet.</p>
              ) : (
                <div className="space-y-1">
                  {topOpponents.map(([name, games]) => (
                    <p key={name} className="text-sm">
                      {name} • {games} pods
                    </p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Game Log</CardTitle>
        </CardHeader>
        <CardContent>
          {user.gamePlayers.length === 0 ? (
            <p className="text-muted-foreground">No confirmed games yet.</p>
          ) : (
            <div className="space-y-3">
              {user.gamePlayers.slice(0, 12).map((gamePlayer) => (
                <Link
                  key={gamePlayer.id}
                  href={`/games/${gamePlayer.game.id}`}
                  className="block rounded-lg bg-muted/20 p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {gamePlayer.isWinner ? "Win" : "Loss"} • {gamePlayer.game.season.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {gamePlayer.deck?.commander ?? "No deck selected"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(gamePlayer.game.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Pod: {gamePlayer.game.players.map((player) => player.user.name).join(", ")}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Registered Decks</CardTitle>
        </CardHeader>
        <CardContent>
          {user.decks.length === 0 ? (
            <p className="text-muted-foreground">No decks registered.</p>
          ) : (
            <div className="space-y-2">
              {user.decks.map((deck) => (
                <div key={deck.id} className="flex items-center justify-between rounded-lg bg-muted/20 p-3">
                  <div>
                    <p className="font-medium">{deck.name}</p>
                    <p className="text-sm text-muted-foreground">{deck.commander}</p>
                    {deck.validatedPriceCents != null ? (
                      <p className="text-sm text-muted-foreground">
                        Saved validated price: {formatUsdFromCents(deck.validatedPriceCents)}
                      </p>
                    ) : null}
                  </div>
                  {deck.externalLink && (
                    <a
                      href={deck.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-secondary hover:underline"
                    >
                      View List
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
