import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NameEditor } from "./name-editor";
import { SignOutButton } from "./sign-out-button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeckManager } from "@/components/deck-manager";
import { NotificationsPanel } from "@/components/notifications-panel";
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

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userId = session.user.id!;
  const activeSeason = await prisma.season.findFirst({
    where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, budgetCap: true, status: true },
  });

  const [user, pendingGames, decks, confirmedEntries, notifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, createdAt: true, defaultDeckId: true },
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
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.deck.findMany({
      where: { userId, archived: false },
      include: {
        gamePlayers: {
          where: {
            game: {
              seasonId: activeSeason?.id ?? "__none__",
              status: "CONFIRMED",
            },
          },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.gamePlayer.findMany({
      where: { userId, game: { status: "CONFIRMED" } },
      include: {
        deck: { select: { id: true, name: true, commander: true } },
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
      },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  confirmedEntries.sort(
    (a, b) => new Date(b.game.createdAt).getTime() - new Date(a.game.createdAt).getTime()
  );

  const overall = summarizeWins(confirmedEntries);
  const favoriteCommanderCounts = new Map<string, number>();
  const uniqueDeckIds = new Set<string>();
  for (const entry of confirmedEntries) {
    if (entry.deck?.commander) {
      favoriteCommanderCounts.set(
        entry.deck.commander,
        (favoriteCommanderCounts.get(entry.deck.commander) ?? 0) + 1
      );
    }
    if (entry.deckId) uniqueDeckIds.add(entry.deckId);
  }
  const favoriteCommander =
    Array.from(favoriteCommanderCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    null;
  const achievements = buildPlayerAchievements({
    wins: overall.wins,
    games: overall.games,
    currentStreak: getCurrentStreak(confirmedEntries),
    favoriteCommander,
    uniqueDecks: uniqueDeckIds.size,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl font-semibold">
          {user?.name?.[0] ?? "?"}
        </div>
        <div>
          <NameEditor initialName={user?.name ?? "User"} />
          {user?.createdAt && (
            <p className="text-sm text-muted-foreground">
              Member since{" "}
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{overall.games}</p>
            <p className="text-xs text-muted-foreground">Confirmed Games</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-400">{overall.wins}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-accent">{overall.winRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{uniqueDeckIds.size}</p>
            <p className="text-xs text-muted-foreground">Decks Logged</p>
          </CardContent>
        </Card>
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

      {pendingGames.length > 0 && (
        <Card className="border-yellow-500/30 bg-card/50 backdrop-blur-sm">
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
                  {game.players.map((player) => player.user.name).join(", ")}
                </span>
                <div className="flex items-center gap-2">
                  {game.lastReminderAt && (
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      Reminder sent
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                    Needs Confirmation
                  </Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Decks</CardTitle>
            <Link
              href="/decks/new"
              className={
                buttonVariants({ variant: "outline", size: "sm" }) + " border-border"
              }
            >
              + Add Deck
            </Link>
          </CardHeader>
          <CardContent>
            <DeckManager
              decks={decks.map((deck) => ({
                id: deck.id,
                name: deck.name,
                commander: deck.commander,
                externalLink: deck.externalLink,
                isDefault: deck.id === user?.defaultDeckId,
                usedThisSeason: deck.gamePlayers.length > 0,
              }))}
              activeSeasonLabel={activeSeason?.name}
              activeSeasonBudgetCap={
                activeSeason?.status === "ACTIVE" ? activeSeason.budgetCap : null
              }
            />
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationsPanel notifications={JSON.parse(JSON.stringify(notifications))} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Recent Game Log</CardTitle>
        </CardHeader>
        <CardContent>
          {confirmedEntries.length === 0 ? (
            <p className="text-muted-foreground">No confirmed games yet.</p>
          ) : (
            <div className="space-y-3">
              {confirmedEntries.slice(0, 8).map((entry) => (
                <Link
                  key={entry.id}
                  href={`/games/${entry.game.id}`}
                  className="block rounded-lg bg-muted/20 p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {entry.isWinner ? "Win" : "Loss"} • {entry.game.season.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.deck?.commander ?? "No deck selected"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.game.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Pod:{" "}
                    {entry.game.players.map((player) => player.user.name).join(", ")}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SignOutButton />
    </div>
  );
}
