"use client";

import { useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Player = {
  id: string;
  name: string;
  avatar: string | null;
};

type Pod = Player[];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function chunkIntoPods(players: Player[]): Pod[] {
  const pods: Pod[] = [];
  for (let i = 0; i < players.length; i += 4) {
    pods.push(players.slice(i, i + 4));
  }
  return pods;
}

export function PodRandomizer({ players }: { players: Player[] }) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(players.map((p) => p.id)),
  );
  const [pods, setPods] = useState<Pod[]>([]);

  const togglePlayer = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(players.map((p) => p.id)));
  }, [players]);

  const deselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const randomize = useCallback(() => {
    const chosen = players.filter((p) => selected.has(p.id));
    const shuffled = shuffle(chosen);
    setPods(chunkIntoPods(shuffled));
  }, [players, selected]);

  const selectedCount = selected.size;

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Deselect All
            </Button>
            <span className="text-sm text-muted-foreground ml-auto">
              {selectedCount} selected
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {players.map((player) => (
              <label
                key={player.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/10"
              >
                <input
                  type="checkbox"
                  checked={selected.has(player.id)}
                  onChange={() => togglePlayer(player.id)}
                  className="accent-primary size-4 shrink-0"
                />
                <Avatar size="sm">
                  {player.avatar && <AvatarImage src={player.avatar} />}
                  <AvatarFallback>
                    {player.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">{player.name}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          onClick={randomize}
          disabled={selectedCount < 4}
        >
          {pods.length > 0 ? "Re-shuffle" : "Randomize Pods"}
        </Button>
        {selectedCount < 4 && (
          <p className="text-sm text-destructive">
            Select at least 4 players to form a pod.
          </p>
        )}
      </div>

      {pods.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {pods.map((pod, i) => (
            <Card key={i} className="border-border bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">Pod {i + 1}</p>
                  {pod.length < 4 && (
                    <span className="text-xs text-muted-foreground">
                      {pod.length} players (partial pod)
                    </span>
                  )}
                </div>
                <ul className="space-y-2">
                  {pod.map((player) => (
                    <li key={player.id} className="flex items-center gap-2">
                      <Avatar size="sm">
                        {player.avatar && <AvatarImage src={player.avatar} />}
                        <AvatarFallback>
                          {player.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{player.name}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
