import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { NameEditor } from "./name-editor";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userId = session.user.id!;

  const [user, pendingGames, decks, confirmedGames] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    prisma.game.findMany({
      where: {
        status: "PENDING",
        players: {
          some: { userId, confirmed: false },
        },
      },
      include: {
        players: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.deck.findMany({
      where: { userId, archived: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.gamePlayer.findMany({
      where: { userId, game: { status: "CONFIRMED" } },
    }),
  ]);

  const wins = confirmedGames.filter((gp) => gp.isWinner).length;
  const total = confirmedGames.length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <NameEditor initialName={user?.name ?? "User"} />
        <div className="flex gap-2">
          <Link href="/games/new" className={buttonVariants()}>
            Log Game
          </Link>
          <Link href="/decks/new" className={buttonVariants({ variant: "outline" }) + " border-border"}>
            Register Deck
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card className="border-border bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Games</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-400">{wins}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-accent">
              {total > 0 ? ((wins / total) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Confirmations */}
      {pendingGames.length > 0 && (
        <Card className="mb-6 border-yellow-500/30 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-yellow-400">
              Pending Confirmations ({pendingGames.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingGames.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="flex items-center justify-between rounded-lg bg-muted/20 p-3 hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm">
                  {game.players.map((p) => p.user.name).join(", ")}
                </span>
                <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                  Needs Confirmation
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* My Decks */}
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Decks</CardTitle>
          <Link href="/decks/new" className={buttonVariants({ variant: "outline", size: "sm" }) + " border-border"}>
            + Add Deck
          </Link>
        </CardHeader>
        <CardContent>
          {decks.length === 0 ? (
            <p className="text-muted-foreground">No decks registered yet.</p>
          ) : (
            <div className="space-y-2">
              {decks.map((deck) => (
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
