import { prisma } from "@/lib/prisma";

export async function createNotifications(
  userIds: string[],
  input: { title: string; body: string; href?: string | null }
) {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueUserIds.length === 0) return;

  await prisma.notification.createMany({
    data: uniqueUserIds.map((userId) => ({
      userId,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    })),
  });
}
