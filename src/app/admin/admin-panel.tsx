"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Season = { id: string; name: string; status: string; budgetCap: number | null; createdAt: string };
type VoteCount = { choice: number; count: number };
type DisputedGame = {
  id: string;
  createdAt: string;
  season: { name: string };
  players: { userId: string; user: { id: string; name: string }; isWinner: boolean }[];
};
type User = { id: string; name: string; email: string; role: string; banned: boolean };

export function AdminPanel({
  currentSeason,
  voteCounts,
  disputedGames,
  users,
}: {
  currentSeason: Season | null;
  voteCounts: VoteCount[];
  disputedGames: DisputedGame[];
  users: User[];
}) {
  const router = useRouter();

  return (
    <Tabs defaultValue="budget">
      <TabsList className="bg-muted border border-border">
        <TabsTrigger value="budget">Budget</TabsTrigger>
        <TabsTrigger value="polls">Polls</TabsTrigger>
        <TabsTrigger value="disputes">
          Disputes {disputedGames.length > 0 && `(${disputedGames.length})`}
        </TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
      </TabsList>

      <TabsContent value="budget">
        <BudgetTab currentSeason={currentSeason} onRefresh={() => router.refresh()} />
      </TabsContent>

      <TabsContent value="polls">
        <PollsTab currentSeason={currentSeason} voteCounts={voteCounts} onRefresh={() => router.refresh()} />
      </TabsContent>

      <TabsContent value="disputes">
        <DisputesTab games={disputedGames} onRefresh={() => router.refresh()} />
      </TabsContent>

      <TabsContent value="users">
        <UsersTab users={users} onRefresh={() => router.refresh()} />
      </TabsContent>
    </Tabs>
  );
}

function BudgetTab({ currentSeason, onRefresh }: { currentSeason: Season | null; onRefresh: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function createSeason() {
    if (!name) return;
    setLoading(true);
    try {
      await fetch("/api/admin/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setName("");
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  async function endSeason() {
    if (!currentSeason) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/seasons/${currentSeason.id}/end`, { method: "POST" });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  const showCreateForm = !currentSeason || currentSeason.status === "COMPLETED";

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Season Budget</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreateForm ? (
          <>
            {currentSeason?.status === "COMPLETED" && (
              <div className="rounded-lg bg-muted/20 p-3">
                <span className="font-medium">{currentSeason.name}</span>
                <Badge variant="outline" className="ml-2 border-border text-muted-foreground">
                  COMPLETED
                </Badge>
                {currentSeason.budgetCap && (
                  <span className="ml-2 text-sm text-muted-foreground">${currentSeason.budgetCap}</span>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New season name..."
                className="bg-muted border-border"
              />
              <Button onClick={createSeason} disabled={loading || !name}>
                Create Season
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between rounded-lg bg-muted/20 p-3">
            <div>
              <span className="font-medium text-lg">{currentSeason.name}</span>
              <Badge
                variant="outline"
                className={`ml-2 ${
                  currentSeason.status === "ACTIVE"
                    ? "border-green-500/30 text-green-400"
                    : "border-yellow-500/30 text-yellow-400"
                }`}
              >
                {currentSeason.status}
              </Badge>
              {currentSeason.status === "ACTIVE" && currentSeason.budgetCap ? (
                <span className="ml-3 text-2xl font-bold">${currentSeason.budgetCap} Budget</span>
              ) : (
                <span className="ml-3 text-sm text-muted-foreground">Awaiting poll result</span>
              )}
            </div>
            <Button size="sm" variant="destructive" onClick={endSeason} disabled={loading}>
              End Season
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PollsTab({
  currentSeason,
  voteCounts,
  onRefresh,
}: {
  currentSeason: Season | null;
  voteCounts: VoteCount[];
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function lockPoll(choice?: number) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/poll/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(choice ? { choice } : {}),
      });
      const data = await res.json();
      if (res.status === 409 && data.tied) {
        const pick = prompt(`Tie between: $${data.tied.join(", $")}. Enter the winning amount:`);
        if (pick) await lockPoll(parseInt(pick));
        return;
      }
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  const noActivePoll = !currentSeason || (currentSeason.status !== "POLLING" && voteCounts.length === 0);

  if (noActivePoll) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center text-muted-foreground">
          No active poll. Create a season from the Budget tab to start one.
        </CardContent>
      </Card>
    );
  }

  const totalVotes = voteCounts.reduce((sum, v) => sum + v.count, 0);
  const isPolling = currentSeason.status === "POLLING";

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>{isPolling ? "Active Poll" : "Poll Results"} — {currentSeason.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {voteCounts.length === 0 ? (
          <p className="text-muted-foreground">No votes yet.</p>
        ) : (
          <div className="space-y-2">
            {[20, 50, 100].map((choice) => {
              const vote = voteCounts.find((v) => v.choice === choice);
              const count = vote?.count ?? 0;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const isWinner = !isPolling && currentSeason.budgetCap === choice;
              return (
                <div
                  key={choice}
                  className={`flex items-center justify-between rounded-lg p-3 ${
                    isWinner ? "bg-green-500/10 border border-green-500/30" : "bg-muted/20"
                  }`}
                >
                  <span className="font-medium">
                    ${choice}
                    {isWinner && <Badge className="ml-2 bg-green-500/20 text-green-400">Winner</Badge>}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {count} vote{count !== 1 ? "s" : ""} ({pct}%)
                  </span>
                </div>
              );
            })}
            <p className="text-sm text-muted-foreground">{totalVotes} total vote{totalVotes !== 1 ? "s" : ""}</p>
          </div>
        )}

        {isPolling && (
          <Button onClick={() => lockPoll()} disabled={loading}>
            Lock Poll
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function DisputesTab({ games, onRefresh }: { games: DisputedGame[]; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);

  async function resolve(gameId: string, winnerId: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/games/${gameId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId }),
      });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  if (games.length === 0) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center text-muted-foreground">
          No disputed games.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Disputed Games</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {games.map((game) => (
          <div key={game.id} className="rounded-lg bg-muted/20 p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              {game.season.name} &middot; {new Date(game.createdAt).toLocaleDateString()}
            </p>
            <p className="text-sm">
              Players: {game.players.map((p) => p.user.name).join(", ")}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Pick winner:</span>
              {game.players.map((p) => (
                <Button
                  key={p.userId}
                  size="sm"
                  variant="outline"
                  className="border-border"
                  onClick={() => resolve(game.id, p.userId)}
                  disabled={loading}
                >
                  {p.user.name}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function UsersTab({ users, onRefresh }: { users: User[]; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);

  async function toggleBan(userId: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/users/${userId}/ban`, { method: "POST" });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-lg bg-muted/20 p-3">
            <div>
              <span className="font-medium">{user.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{user.email}</span>
              {user.role === "ADMIN" && (
                <Badge className="ml-2 bg-primary/20 text-primary">Admin</Badge>
              )}
            </div>
            <Button
              size="sm"
              variant={user.banned ? "default" : "destructive"}
              onClick={() => toggleBan(user.id)}
              disabled={loading || user.role === "ADMIN"}
            >
              {user.banned ? "Unban" : "Ban"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
