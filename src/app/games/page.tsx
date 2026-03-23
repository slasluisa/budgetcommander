import { prisma } from "@/lib/prisma";
import { GameCard } from "@/components/game-card";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const games = await prisma.game.findMany({
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
  });

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Game History</h1>
      {games.length === 0 ? (
        <p className="text-muted-foreground">No games played yet.</p>
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
