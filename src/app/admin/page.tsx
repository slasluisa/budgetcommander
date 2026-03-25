import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPanel } from "./admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") redirect("/");

  const currentSeason = await prisma.season.findFirst({ orderBy: { createdAt: "desc" } });

  const [pollVotes, allGames, disputedGames, users, auditLogs] = await Promise.all([
    currentSeason
      ? prisma.pollVote.findMany({
          where: { seasonId: currentSeason.id },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { choice: "asc" },
        })
      : Promise.resolve([]),
    prisma.game.findMany({
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
      select: { id: true, name: true, username: true, role: true, banned: true },
    }),
    prisma.auditLog.findMany({
      include: {
        actor: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Admin Panel</h1>
      <AdminPanel
        currentSeason={currentSeason ? JSON.parse(JSON.stringify(currentSeason)) : null}
        pollVotes={JSON.parse(JSON.stringify(pollVotes))}
        allGames={JSON.parse(JSON.stringify(allGames))}
        disputedGames={JSON.parse(JSON.stringify(disputedGames))}
        users={users}
        auditLogs={JSON.parse(JSON.stringify(auditLogs))}
        currentUserId={session.user.id!}
      />
    </div>
  );
}
