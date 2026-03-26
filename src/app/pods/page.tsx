import { prisma } from "@/lib/prisma";
import { PodRandomizer } from "@/components/pod-randomizer";

export const dynamic = "force-dynamic";

export default async function PodsPage() {
  const players = await prisma.user.findMany({
    where: { banned: false },
    select: { id: true, name: true, avatar: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pod Randomizer</h1>
        <p className="text-sm text-muted-foreground">
          Select players and randomize them into pods of 4.
        </p>
      </div>
      <PodRandomizer players={players} />
    </div>
  );
}
