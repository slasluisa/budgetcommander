import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

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
          game: { select: { id: true, createdAt: true, season: { select: { name: true } } } },
          deck: { select: { name: true, commander: true } },
        },
      },
    },
  });

  if (!user) notFound();

  // Overall stats
  const wins = user.gamePlayers.filter((gp) => gp.isWinner).length;
  const total = user.gamePlayers.length;
  const losses = total - wins;
  const winRate = total > 0 ? (wins / total) * 100 : 0;

  // Per-deck stats
  const deckStatsMap = new Map<string, { name: string; commander: string; wins: number; games: number }>();
  for (const gp of user.gamePlayers) {
    if (!gp.deck) continue;
    const key = gp.deckId!;
    const existing = deckStatsMap.get(key) ?? {
      name: gp.deck.name,
      commander: gp.deck.commander,
      wins: 0,
      games: 0,
    };
    existing.games++;
    if (gp.isWinner) existing.wins++;
    deckStatsMap.set(key, existing);
  }
  const deckStats = Array.from(deckStatsMap.values()).sort((a, b) => b.wins - a.wins);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-4">
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

      {/* Overall Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {[
          { label: "Games", value: total, color: "text-foreground" },
          { label: "Wins", value: wins, color: "text-green-400" },
          { label: "Losses", value: losses, color: "text-red-400" },
          { label: "Win Rate", value: `${winRate.toFixed(1)}%`, color: "text-accent" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border bg-card/50 backdrop-blur-sm text-center">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-Deck Stats */}
      <Card className="mb-6 border-border bg-card/50 backdrop-blur-sm">
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

      {/* Registered Decks */}
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
