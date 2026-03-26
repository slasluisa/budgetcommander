"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatUsdFromCents } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type Player = { id: string; name: string; avatar: string | null };
type Deck = {
  id: string;
  name: string;
  commander: string;
  validatedPriceCents: number | null;
};

export function LogGameForm({
  currentUserId,
  currentUserName,
  players,
  decks,
  initialDeckId,
}: {
  currentUserId: string;
  currentUserName: string;
  players: Player[];
  decks: Deck[];
  initialDeckId?: string | null;
}) {
  const router = useRouter();
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(["", "", ""]);
  const [selectedDeck, setSelectedDeck] = useState(initialDeckId ?? "");
  const [winnerId, setWinnerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedDeckRecord = decks.find((deck) => deck.id === selectedDeck) ?? null;

  function updatePlayer(index: number, value: string) {
    const updated = [...selectedPlayers];
    updated[index] = value;
    setSelectedPlayers(updated);
  }

  const allPlayerIds = [currentUserId, ...selectedPlayers.filter(Boolean)];
  const winnerOptions = allPlayerIds
    .map((id) => {
      if (id === currentUserId) return { id, name: currentUserName };
      return players.find((p) => p.id === id);
    })
    .filter(Boolean) as { id: string; name: string }[];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const playerIds = selectedPlayers.filter(Boolean);
    if (playerIds.length !== 3) {
      setError("Select exactly 3 other players");
      return;
    }
    if (new Set(playerIds).size !== 3) {
      setError("Each player must be different");
      return;
    }
    if (!selectedDeck) {
      setError("Select your deck");
      return;
    }
    if (!winnerId) {
      setError("Select the winner");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerIds,
          deckId: selectedDeck,
          winnerId,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Failed to create game");
        return;
      }

      const game = await res.json();
      router.push(`/games/${game.id}`);
    } finally {
      setLoading(false);
    }
  }

  const selectClass = "w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground";

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Game Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="space-y-1">
              <Label>Player {idx + 2}</Label>
              <select
                value={selectedPlayers[idx]}
                onChange={(e) => updatePlayer(idx, e.target.value)}
                className={selectClass}
              >
                <option value="">Select a player...</option>
                {players
                  .filter(
                    (p) =>
                      !selectedPlayers.includes(p.id) || selectedPlayers[idx] === p.id
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
          ))}

          <div className="space-y-1">
            <Label>Your Deck</Label>
            <select
              value={selectedDeck}
              onChange={(e) => setSelectedDeck(e.target.value)}
              className={selectClass}
            >
              <option value="">Select your deck...</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.commander})
                </option>
              ))}
            </select>
            {selectedDeckRecord?.validatedPriceCents != null ? (
              <p className="text-xs text-muted-foreground">
                Saved validated price:{" "}
                {formatUsdFromCents(selectedDeckRecord.validatedPriceCents)}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <Label>Winner</Label>
            <select
              value={winnerId}
              onChange={(e) => setWinnerId(e.target.value)}
              className={selectClass}
            >
              <option value="">Who won?</option>
              {winnerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {initialDeckId && (
            <p className="text-xs text-muted-foreground">
              Your default deck is pre-selected. You can change it before logging.
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Logging..." : "Log Game"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
