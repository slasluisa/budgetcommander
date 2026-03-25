import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SeasonsPage() {
  const seasons = await prisma.season.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { games: true, pollVotes: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Season Archive</h1>
        <p className="text-sm text-muted-foreground">
          Browse past league seasons, budgets, and results.
        </p>
      </div>

      {seasons.length === 0 ? (
        <p className="text-muted-foreground">No seasons yet.</p>
      ) : (
        <div className="space-y-4">
          {seasons.map((season) => (
            <Link key={season.id} href={`/seasons/${season.id}`}>
              <Card className="border-border bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{season.name}</CardTitle>
                  <Badge
                    variant="outline"
                    className={
                      season.status === "ACTIVE"
                        ? "border-green-500/30 text-green-400"
                        : season.status === "POLLING"
                        ? "border-yellow-500/30 text-yellow-400"
                        : "border-border text-muted-foreground"
                    }
                  >
                    {season.status}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Budget: {season.budgetCap ? `$${season.budgetCap}` : "TBD"}</span>
                  <span>{season._count.games} games</span>
                  <span>{season._count.pollVotes} poll votes</span>
                  <span>{new Date(season.createdAt).toLocaleDateString()}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
