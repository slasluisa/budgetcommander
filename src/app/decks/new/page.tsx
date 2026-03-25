import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DeckForm } from "@/components/deck-form";

export const dynamic = "force-dynamic";

export default async function NewDeckPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const activeSeason = await prisma.season.findFirst({
    where: { status: "ACTIVE", budgetCap: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { name: true, budgetCap: true },
  });

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl font-bold">Register Deck</h1>
      <DeckForm
        activeSeasonName={activeSeason?.name}
        activeBudgetCap={activeSeason?.budgetCap}
      />
    </div>
  );
}
