"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Season = { id: string; name: string; status: string; budgetCap: number | null; createdAt: string };
type DisputedGame = {
  id: string;
  createdAt: string;
  season: { name: string };
  players: { userId: string; user: { id: string; name: string }; isWinner: boolean }[];
};
type User = { id: string; name: string; email: string; role: string; banned: boolean };

export function AdminPanel({
  seasons,
  disputedGames,
  users,
}: {
  seasons: Season[];
  disputedGames: DisputedGame[];
  users: User[];
}) {
  const router = useRouter();

  return (
    <Tabs defaultValue="seasons">
      <TabsList className="bg-muted border border-border">
        <TabsTrigger value="seasons">Seasons</TabsTrigger>
        <TabsTrigger value="disputes">
          Disputes {disputedGames.length > 0 && `(${disputedGames.length})`}
        </TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
      </TabsList>

      <TabsContent value="seasons">
        <SeasonsTab seasons={seasons} onRefresh={() => router.refresh()} />
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

function SeasonsTab({ seasons, onRefresh }: { seasons: Season[]; onRefresh: () => void }) {
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

  async function endSeason(id: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/seasons/${id}/end`, { method: "POST" });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Seasons</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Season name..."
            className="bg-muted border-border"
          />
          <Button onClick={createSeason} disabled={loading || !name}>
            Create
          </Button>
        </div>

        <div className="space-y-2">
          {seasons.map((season) => (
            <div key={season.id} className="flex items-center justify-between rounded-lg bg-muted/20 p-3">
              <div>
                <span className="font-medium">{season.name}</span>
                {season.budgetCap && (
                  <span className="ml-2 text-sm text-muted-foreground">${season.budgetCap}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    season.status === "ACTIVE"
                      ? "border-green-500/30 text-green-400"
                      : season.status === "POLLING"
                      ? "border-yellow-500/30 text-yellow-400"
                      : "border-border text-muted-foreground"
                  }
                >
                  {season.status}
                </Badge>
                {season.status === "POLLING" && (
                  <Button size="sm" onClick={() => lockPoll()} disabled={loading}>
                    Lock Poll
                  </Button>
                )}
                {(season.status === "ACTIVE" || season.status === "POLLING") && (
                  <Button size="sm" variant="destructive" onClick={() => endSeason(season.id)} disabled={loading}>
                    End
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
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
