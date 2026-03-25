import Form from "next/form";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GameCard } from "@/components/game-card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const seasonId = typeof params.seasonId === "string" ? params.seasonId : "";
  const playerId = typeof params.playerId === "string" ? params.playerId : "";
  const status = typeof params.status === "string" ? params.status : "";
  const overdue = params.overdue === "true";
  const overdueCutoff = new Date();
  overdueCutoff.setDate(overdueCutoff.getDate() - 3);

  const [seasons, players, games] = await Promise.all([
    prisma.season.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, status: true },
    }),
    prisma.user.findMany({
      where: { banned: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.game.findMany({
      where: {
        ...(seasonId ? { seasonId } : {}),
        ...(playerId ? { players: { some: { userId: playerId } } } : {}),
        ...(status ? { status: status as "PENDING" | "CONFIRMED" | "DISPUTED" | "CANCELLED" } : {}),
        ...(overdue
          ? {
              status: "PENDING",
              createdAt: {
                lte: overdueCutoff,
              },
            }
          : {}),
        ...(q
          ? {
              players: {
                some: {
                  user: {
                    name: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                },
              },
            }
          : {}),
      },
      include: {
        players: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            deck: { select: { name: true, commander: true } },
          },
        },
        season: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Game History</h1>
          <p className="text-sm text-muted-foreground">
            Filter by season, player, status, or overdue confirmations.
          </p>
        </div>
        <Link href="/games/new">
          <Button>Log Game</Button>
        </Link>
      </div>

      <Form action="" className="grid gap-3 rounded-xl border border-border bg-card/50 p-4 md:grid-cols-5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search player name..."
          className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground"
        />
        <select
          name="seasonId"
          defaultValue={seasonId}
          className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground"
        >
          <option value="">All seasons</option>
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name}
            </option>
          ))}
        </select>
        <select
          name="playerId"
          defaultValue={playerId}
          className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground"
        >
          <option value="">All players</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground"
        >
          <option value="">Any status</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PENDING">Pending</option>
          <option value="DISPUTED">Disputed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <label className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">
          <input type="checkbox" name="overdue" value="true" defaultChecked={overdue} />
          Overdue only
        </label>
        <div className="flex gap-2 md:col-span-5">
          <Button type="submit">Apply Filters</Button>
          <Link
            href="/games"
            className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </Link>
        </div>
      </Form>

      <p className="text-sm text-muted-foreground">
        {games.length} game{games.length !== 1 ? "s" : ""} matched.
      </p>

      {games.length === 0 ? (
        <p className="text-muted-foreground">No games matched these filters.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {games.map((game) => (
            <GameCard key={game.id} game={JSON.parse(JSON.stringify(game))} />
          ))}
        </div>
      )}
    </div>
  );
}
