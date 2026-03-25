import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPollResultsForSeason } from "@/lib/poll";
import { PollWidget } from "@/components/poll-widget";

export const dynamic = "force-dynamic";

export default async function PollPage() {
  const session = await auth();

  const season = await prisma.season.findFirst({
    where: { status: { in: ["POLLING", "ACTIVE", "COMPLETED"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!season) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No season created yet.</p>
      </div>
    );
  }

  const results = await getPollResultsForSeason(season.id, session?.user?.id);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-center text-3xl font-bold">{season.name} — Budget Poll</h1>
      <PollWidget
        results={results}
        showAuthPrompt
        description={
          results.locked
            ? "The poll is closed. Final results are shown below."
            : "Cast or update your vote while polling is still open."
        }
      />
    </div>
  );
}
