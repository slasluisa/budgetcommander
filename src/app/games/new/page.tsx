import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LogGameForm } from "./log-game-form";

export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const [players, decks] = await Promise.all([
    prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        banned: false,
      },
      select: { id: true, name: true, avatar: true },
      orderBy: { name: "asc" },
    }),
    prisma.deck.findMany({
      where: { userId: session.user.id, archived: false },
    }),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-3xl font-bold">Log a Game</h1>
      <LogGameForm
        currentUserId={session.user.id!}
        currentUserName={session.user.name ?? "You"}
        players={players}
        decks={decks}
      />
    </div>
  );
}
