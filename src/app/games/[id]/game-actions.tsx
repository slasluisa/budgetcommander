"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Deck = { id: string; name: string; commander: string };

export function GameActions({ gameId, decks }: { gameId: string; decks: Deck[] }) {
  const router = useRouter();
  const [selectedDeck, setSelectedDeck] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${gameId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId: selectedDeck || null }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDispute() {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${gameId}/dispute`, {
        method: "POST",
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-4 border-yellow-500/30 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-yellow-400">Action Required</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">Select your deck:</label>
          <select
            value={selectedDeck}
            onChange={(e) => setSelectedDeck(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground"
          >
            <option value="">Choose a deck...</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name} ({deck.commander})
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleConfirm} disabled={loading} className="flex-1">
            Confirm Result
          </Button>
          <Button
            onClick={handleDispute}
            disabled={loading}
            variant="destructive"
            className="flex-1"
          >
            Dispute
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
