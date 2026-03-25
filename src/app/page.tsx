import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPollResultsForSeason } from "@/lib/poll";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameCard } from "@/components/game-card";
import { BrandMark } from "@/components/brand-logo";
import { PollWidget } from "@/components/poll-widget";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [session, currentSeason, recentGames] = await Promise.all([
    auth(),
    prisma.season.findFirst({
      where: { status: { in: ["POLLING", "ACTIVE"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.game.findMany({
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
    }),
  ]);

  // Top 5 players from leaderboard
  const [topPlayers, openPollResults] = await Promise.all([
    currentSeason
      ? prisma.gamePlayer
          .findMany({
            where: { game: { seasonId: currentSeason.id, status: "CONFIRMED" } },
            include: { user: { select: { id: true, name: true, avatar: true } } },
          })
          .then((gps) => {
            const map = new Map<string, { name: string; wins: number; games: number }>();
            for (const gp of gps) {
              const entry = map.get(gp.userId) ?? {
                name: gp.user.name,
                wins: 0,
                games: 0,
              };
              entry.games++;
              if (gp.isWinner) entry.wins++;
              map.set(gp.userId, entry);
            }
            return Array.from(map.entries())
              .map(([id, standings]) => ({ id, ...standings }))
              .sort((a, b) => b.wins - a.wins)
              .slice(0, 5);
          })
      : Promise.resolve([]),
    currentSeason?.status === "POLLING"
      ? getPollResultsForSeason(currentSeason.id, session?.user?.id)
      : Promise.resolve(null),
  ]);

  return (
    <div>
      {/* Hero */}
      <div className="relative mb-12 flex flex-col items-center justify-center py-16 text-center">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/10 to-transparent opacity-50" />
        <div className="relative mb-6 rounded-[2rem] border border-white/10 bg-white/5 p-3 shadow-[0_0_60px_rgba(124,58,237,0.18)] backdrop-blur-sm">
          <BrandMark className="h-24 w-24 md:h-28 md:w-28" title="Budget Commander League emblem" />
        </div>
        <h1 className="relative text-5xl font-extrabold tracking-tight md:text-6xl">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Budget Commander
          </span>
        </h1>
        <p className="relative mt-3 text-xl uppercase tracking-[0.45em] text-muted-foreground">
          League
        </p>
        <p className="relative mt-4 max-w-2xl text-pretty text-sm text-slate-300 md:text-base">
          Track league seasons, log four-player pods, confirm results, and keep the budget
          battles feeling a little mythic.
        </p>
        {currentSeason && (
          <Badge variant="outline" className="relative mt-4 border-primary/30 text-primary">
            {currentSeason.name} — {currentSeason.status === "POLLING" ? "Voting Open" : `$${currentSeason.budgetCap} Budget`}
          </Badge>
        )}
        {currentSeason?.status === "POLLING" && openPollResults ? (
          <section
            id="current-poll"
            className="relative mt-10 w-full max-w-5xl overflow-hidden rounded-[2rem] border border-primary/20 bg-card/75 p-6 text-left shadow-[0_24px_80px_rgba(124,58,237,0.16)] backdrop-blur md:p-8"
          >
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-secondary/10 to-transparent lg:block" />
            <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <Badge variant="outline" className="border-primary/30 text-primary">
                  Poll Open Now
                </Badge>
                <h2 className="mt-4 max-w-xl text-3xl font-bold tracking-tight md:text-4xl">
                  Help set the {currentSeason.name} budget cap
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  Vote right here for a $20, $50, or $100 season. If you already have an
                  account, pick your number below. If you are new, sign up and join the vote
                  before the poll closes.
                </p>
                {session?.user ? (
                  <p className="mt-4 text-sm text-primary/90">
                    Your vote saves immediately, and you can update it anytime while the poll is
                    open.
                  </p>
                ) : (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/register" className={buttonVariants({ size: "lg" })}>
                      Sign Up to Vote
                    </Link>
                    <Link
                      href="/login"
                      className={buttonVariants({ variant: "outline", size: "lg" }) + " border-border"}
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>
              <PollWidget
                results={openPollResults}
                title={session?.user ? "Cast Your Vote" : "Live Poll Results"}
                description={
                  session?.user
                    ? "Pick your budget cap and watch the results update here."
                    : "Create an account or sign in from this page to join the vote."
                }
                className="border-primary/20 bg-background/70"
              />
            </div>
          </section>
        ) : null}
        <div className="relative mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/leaderboard" className={buttonVariants({ variant: "outline" }) + " border-border"}>
            View Standings
          </Link>
          <Link href="/seasons" className={buttonVariants({ variant: "outline" }) + " border-border"}>
            Season Archive
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
