import { prisma } from "@/lib/prisma";

const pollChoices = [20, 50, 100] as const;

export type PollResults = {
  total: number;
  votes: { choice: number; count: number; percentage: number }[];
  userVote: number | null;
  locked: boolean;
  budgetCap: number | null;
};

export async function getPollResultsForSeason(seasonId: string, userId?: string | null): Promise<PollResults> {
  const [votes, userVote] = await Promise.all([
    prisma.pollVote.groupBy({
      by: ["choice"],
      where: { seasonId },
      _count: { choice: true },
    }),
    userId
      ? prisma.pollVote.findUnique({
          where: {
            seasonId_userId: {
              seasonId,
              userId,
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    select: { status: true, budgetCap: true },
  });

  const total = votes.reduce((sum, vote) => sum + vote._count.choice, 0);

  return {
    total,
    votes: pollChoices.map((choice) => {
      const vote = votes.find((entry) => entry.choice === choice);
      const count = vote?._count.choice ?? 0;

      return {
        choice,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    }),
    userVote: userVote?.choice ?? null,
    locked: season?.status !== "POLLING",
    budgetCap: season?.budgetCap ?? null,
  };
}
