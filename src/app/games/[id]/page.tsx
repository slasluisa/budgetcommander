import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameActions } from "./game-actions";
import { PendingGameTools } from "@/components/pending-game-tools";
import { canSendReminder, getPendingAgeLabel, isGameOverdue } from "@/lib/league";

export const dynamic = "force-dynamic";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      players: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          deck: { select: { id: true, name: true, commander: true, externalLink: true } },
        },
      },
      season: { select: { name: true, budgetCap: true } },
    },
  });

  if (!game) notFound();

  const currentPlayer = session?.user
    ? game.players.find((p) => p.user.id === session.user!.id)
    : null;
  const needsAction = Boolean(
    currentPlayer && !currentPlayer.confirmed && game.status === "PENDING"
  );
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";
  const canManagePending = Boolean(
    game.status === "PENDING" &&
      session?.user &&
      (game.createdById === session.user.id || isAdmin)
  );

  let userDecks: { id: string; name: string; commander: string }[] = [];
  let currentUser: { defaultDeckId: string | null } | null = null;

  if ((needsAction || canManagePending) && session?.user) {
    [userDecks, currentUser] = await Promise.all([
      prisma.deck.findMany({
        where: { userId: session.user.id, archived: false },
        select: { id: true, name: true, commander: true },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { defaultDeckId: true },
      }),
    ]);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Game Detail</h1>
        <Badge
          variant="outline"
          className={
            game.status === "CONFIRMED"
              ? "border-green-500/30 text-green-400"
              : game.status === "DISPUTED"
              ? "border-red-500/30 text-red-400"
              : game.status === "CANCELLED"
              ? "border-slate-500/30 text-slate-300"
              : "border-yellow-500/30 text-yellow-400"
          }
        >
          {game.status}
        </Badge>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {game.season.name} &middot; Budget: ${game.season.budgetCap ?? "TBD"} &middot;{" "}
        {new Date(game.createdAt).toLocaleDateString()}
      </p>
      {game.status === "PENDING" && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="outline" className="border-border text-muted-foreground">
            {getPendingAgeLabel(game.createdAt)}
          </Badge>
          {isGameOverdue(game.createdAt) && (
            <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
              Overdue
            </Badge>
          )}
          {game.lastReminderAt && (
            <Badge variant="outline" className="border-border text-muted-foreground">
              Reminder sent
            </Badge>
          )}
        </div>
      )}

      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Players</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {game.players.map((p) => (
            <div
              key={p.user.id}
              className={`flex items-center justify-between rounded-lg p-3 ${
                p.isWinner ? "bg-primary/10 border border-primary/30" : "bg-muted/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={p.user.avatar ?? undefined} />
                  <AvatarFallback>{p.user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{p.user.name}</p>
                  {p.deck ? (
                    <p className="text-sm text-muted-foreground">
                      {p.deck.commander}
                      {p.deck.externalLink && (
                        <>
                          {" "}
                          &middot;{" "}
                          <a
                            href={p.deck.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary hover:underline"
                          >
                            Decklist
                          </a>
                        </>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Deck not selected</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.isWinner && <Badge className="bg-primary/20 text-primary">Winner</Badge>}
                {p.confirmed ? (
                  <Badge variant="outline" className="border-green-500/30 text-green-400">
                    Confirmed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                    Pending
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {needsAction && (
        <GameActions
          gameId={game.id}
          decks={userDecks}
          initialDeckId={currentUser?.defaultDeckId}
        />
      )}

      {canManagePending && (
        <PendingGameTools
          gameId={game.id}
          canRemind={canSendReminder(game.lastReminderAt)}
          lastReminderAt={game.lastReminderAt?.toISOString() ?? null}
        />
      )}
    </div>
  );
}
