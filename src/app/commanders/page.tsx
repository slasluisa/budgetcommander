import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CommandersPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const seasonFilter = params.season ?? "all";
  const sort = params.sort ?? "games";

  const seasons = await prisma.season.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  const gamePlayers = await prisma.gamePlayer.findMany({
    where: {
      game: {
        status: "CONFIRMED",
        ...(seasonFilter !== "all" ? { seasonId: seasonFilter } : {}),
      },
      deckId: { not: null },
    },
    select: {
      isWinner: true,
      deck: { select: { id: true, commander: true } },
    },
  });

  const commanderMap = new Map<
    string,
    { deckIds: Set<string>; games: number; wins: number }
  >();

  for (const gp of gamePlayers) {
    if (!gp.deck) continue;
    const existing = commanderMap.get(gp.deck.commander) ?? {
      deckIds: new Set<string>(),
      games: 0,
      wins: 0,
    };
    existing.deckIds.add(gp.deck.id);
    existing.games++;
    if (gp.isWinner) existing.wins++;
    commanderMap.set(gp.deck.commander, existing);
  }

  const commanders = Array.from(commanderMap.entries())
    .map(([name, stats]) => ({
      name,
      decks: stats.deckIds.size,
      games: stats.games,
      wins: stats.wins,
      winRate: stats.games > 0 ? (stats.wins / stats.games) * 100 : 0,
    }))
    .sort((a, b) => {
      if (sort === "winRate") return b.winRate - a.winRate || b.games - a.games;
      if (sort === "decks") return b.decks - a.decks || b.games - a.games;
      return b.games - a.games || b.winRate - a.winRate;
    });

  function buildHref(overrides: Record<string, string>) {
    const merged = { season: seasonFilter, sort, ...overrides };
    const qs = new URLSearchParams(merged).toString();
    return `/commanders?${qs}`;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">Commander Meta</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href={buildHref({ season: "all" })}
            className={`rounded-md border px-3 py-1 ${
              seasonFilter === "all"
                ? "border-primary bg-primary/20 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All seasons
          </Link>
          {seasons.map((s) => (
            <Link
              key={s.id}
              href={buildHref({ season: s.id })}
              className={`rounded-md border px-3 py-1 ${
                seasonFilter === s.id
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.name}
            </Link>
          ))}
        </div>

        <div className="flex gap-2 text-sm">
          {(["games", "winRate", "decks"] as const).map((s) => (
            <Link
              key={s}
              href={buildHref({ sort: s })}
              className={`rounded-md border px-3 py-1 ${
                sort === s
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "games"
                ? "Games"
                : s === "winRate"
                  ? "Win Rate"
                  : "Decks"}
            </Link>
          ))}
        </div>
      </div>

      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            {commanders.length} Commander{commanders.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {commanders.length === 0 ? (
            <p className="text-muted-foreground">No data yet</p>
          ) : (
            commanders.map((c) => {
              const undefeated = c.games > 0 && c.wins === c.games;
              return (
                <div
                  key={c.name}
                  className={`flex items-center justify-between rounded-lg bg-muted/20 p-3 ${
                    undefeated ? "text-green-400" : ""
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.decks} deck{c.decks !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="text-sm">
                      <p>
                        {c.games} game{c.games !== 1 ? "s" : ""}
                      </p>
                      <p className="text-muted-foreground">
                        {c.wins} win{c.wins !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge
                      className={
                        undefeated
                          ? "bg-green-400/20 text-green-400"
                          : "bg-primary/20 text-primary"
                      }
                    >
                      {c.winRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
