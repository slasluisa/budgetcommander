import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPanel } from "./admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") redirect("/");

  const currentSeason = await prisma.season.findFirst({ orderBy: { createdAt: "desc" } });

  const [rawVotes, disputedGames, users] = await Promise.all([
    currentSeason
      ? prisma.pollVote.groupBy({
          by: ["choice"],
          where: { seasonId: currentSeason.id },
          _count: { choice: true },
        })
      : Promise.resolve([]),
    prisma.game.findMany({
      where: { status: "DISPUTED" },
      include: {
        players: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        season: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true, banned: true },
    }),
  ]);

  const voteCounts = rawVotes.map((v) => ({ choice: v.choice, count: v._count.choice }));

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Admin Panel</h1>
      <AdminPanel
        currentSeason={currentSeason ? JSON.parse(JSON.stringify(currentSeason)) : null}
        voteCounts={voteCounts}
        disputedGames={JSON.parse(JSON.stringify(disputedGames))}
        users={users}
      />
    </div>
  );
}
