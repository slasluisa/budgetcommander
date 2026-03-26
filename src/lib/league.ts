const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export const GAME_REMINDER_COOLDOWN_HOURS = 24;
export const GAME_OVERDUE_DAYS = 3;

export function isGameOverdue(createdAt: Date | string) {
  return Date.now() - new Date(createdAt).getTime() >= GAME_OVERDUE_DAYS * MS_PER_DAY;
}

export function canSendReminder(lastReminderAt: Date | string | null | undefined) {
  if (!lastReminderAt) return true;
  return Date.now() - new Date(lastReminderAt).getTime() >= GAME_REMINDER_COOLDOWN_HOURS * MS_PER_HOUR;
}

export function getPendingAgeLabel(createdAt: Date | string) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(ageMs / MS_PER_DAY);
  if (days >= 1) return `${days}d old`;
  const hours = Math.max(1, Math.floor(ageMs / MS_PER_HOUR));
  return `${hours}h old`;
}

export function summarizeWins<T extends { isWinner: boolean }>(entries: T[]) {
  const wins = entries.filter((entry) => entry.isWinner).length;
  const games = entries.length;
  const losses = games - wins;
  const winRate = games > 0 ? (wins / games) * 100 : 0;
  return { wins, losses, games, winRate };
}

export type Achievement = {
  label: string;
  description: string;
};

export function buildPlayerAchievements(input: {
  wins: number;
  games: number;
  currentStreak: number;
  favoriteCommander?: string | null;
  uniqueDecks: number;
}) {
  const achievements: Achievement[] = [];

  if (input.currentStreak >= 3) {
    achievements.push({
      label: "Hot Streak",
      description: `${input.currentStreak} straight wins`,
    });
  }
  if (input.games >= 10) {
    achievements.push({
      label: "Regular",
      description: `${input.games} confirmed league games`,
    });
  }
  if (input.wins >= 5 && input.games > 0 && input.wins / input.games >= 0.6) {
    achievements.push({
      label: "Closer",
      description: "60%+ win rate with at least 5 wins",
    });
  }
  if (input.uniqueDecks >= 3) {
    achievements.push({
      label: "Brewer",
      description: `${input.uniqueDecks} decks logged`,
    });
  }
  if (input.favoriteCommander) {
    achievements.push({
      label: "Signature Commander",
      description: input.favoriteCommander,
    });
  }

  return achievements.slice(0, 4);
}

export type RivalryRecord = {
  opponentId: string;
  opponentName: string;
  opponentAvatar: string | null;
  wins: number;
  losses: number;
  games: number;
  gameIds: string[];
};

export function buildRivalries(
  gamePlayers: Array<{
    isWinner: boolean;
    game: {
      id: string;
      players: Array<{
        userId: string;
        user: { id: string; name: string; avatar?: string | null };
        isWinner: boolean;
      }>;
    };
  }>,
  playerId: string
): RivalryRecord[] {
  const map = new Map<string, RivalryRecord>();

  for (const gp of gamePlayers) {
    for (const opponent of gp.game.players) {
      if (opponent.userId === playerId) continue;
      const record = map.get(opponent.userId) ?? {
        opponentId: opponent.userId,
        opponentName: opponent.user.name,
        opponentAvatar: opponent.user.avatar ?? null,
        wins: 0,
        losses: 0,
        games: 0,
        gameIds: [],
      };
      record.games++;
      if (gp.isWinner) record.wins++;
      else record.losses++;
      record.gameIds.push(gp.game.id);
      map.set(opponent.userId, record);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.games - a.games);
}
