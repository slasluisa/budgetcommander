"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Player = {
  id: string;
  name: string;
};

const PROP_CATEGORIES = [
  { value: "BEST_PLAY", label: "Best Play" },
  { value: "SCARIEST_BOARD", label: "Scariest Board" },
  { value: "CLUTCH_WIN", label: "Clutch Win" },
  { value: "KINGMAKER", label: "Kingmaker" },
  { value: "BEST_SPORT", label: "Best Sport" },
] as const;

export function PropForm({
  gameId,
  otherPlayers,
}: {
  gameId: string;
  otherPlayers: Player[];
}) {
  const router = useRouter();
  const [receiverId, setReceiverId] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${gameId}/props`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, category }),
      });
      if (res.ok) {
        setReceiverId("");
        setCategory("");
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not give props");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-sm text-muted-foreground">Give props to:</label>
        <select
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground"
        >
          <option value="">Choose a player...</option>
          {otherPlayers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm text-muted-foreground">For:</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground"
        >
          <option value="">Choose a category...</option>
          {PROP_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <Button
        type="submit"
        disabled={loading || !receiverId || !category}
        size="sm"
      >
        {loading ? "Submitting..." : "Give Props"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
