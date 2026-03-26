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
    <div className="space-y-20">
      {/* Hero */}
      <div className="relative flex flex-col items-center justify-center py-16 text-center">
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
                    ? "Pick your budget cap"
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
          <Link href="#league-rules" className={buttonVariants({ variant: "outline" }) + " border-border"}>
            View the Rules
          </Link>
        </div>
      </div>

      {/* Recent Games & Top Players */}
      <div className="grid gap-12 md:grid-cols-2 md:gap-8">
        <div>
          <div className="mb-6 flex items-center justify-between">
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

        <div>
          <div className="mb-6 flex items-center justify-between">
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

      {/* League Rules — full-bleed section */}
      <section id="league-rules" className="scroll-mt-8">
        <div className="relative min-h-[80vh] rounded-2xl border border-primary/15 bg-gradient-to-b from-card/80 via-card/50 to-transparent py-16 px-6 md:px-12 lg:px-16">
          {/* Decorative corner accents */}
          <div className="pointer-events-none absolute top-0 left-0 h-32 w-32 rounded-tl-2xl border-t-2 border-l-2 border-primary/25" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-br-2xl border-b-2 border-r-2 border-primary/25" />
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/70">
              Before You Build
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
              League Rules
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Quick deck-building rules players should know before submitting a list.
            </p>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {/* Budget Check */}
              <div className="group relative rounded-xl border border-border/60 bg-background/40 p-6 backdrop-blur-sm transition-colors hover:border-primary/30">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <h3 className="text-lg font-semibold">Budget Check</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {currentSeason?.status === "ACTIVE" && currentSeason.budgetCap != null
                    ? `${currentSeason.name} is currently capped at $${currentSeason.budgetCap}. Decks are validated against this cap using TCG pricing at the time of submission.`
                    : "Decks are checked using the current TCG price of the selected cards in the submitted list. The budget cap is set each season by community vote."}
                </p>
              </div>

              {/* Deck Submission */}
              <div className="group relative rounded-xl border border-border/60 bg-background/40 p-6 backdrop-blur-sm transition-colors hover:border-primary/30">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </div>
                <h3 className="text-lg font-semibold">Deck Submission</h3>
                <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                    Basic lands do not count toward the deck cost.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                    Decks are checked when submitted using the TCG price of the selected cards.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                    Proxies are allowed.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                    Your deck must use a public Archidekt link.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                    Your commander is pulled from the list automatically.
                  </li>
                </ul>
              </div>
            </div>

            {/* Game Format */}
            <div className="mt-8 rounded-xl border border-border/60 bg-background/40 p-6 backdrop-blur-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 className="text-lg font-semibold">Game Format</h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                All games are four-player pods. After a game, the winner logs the result and all four players confirm. Once every player confirms, the game counts toward season standings.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
