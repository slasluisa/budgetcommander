"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function DeckForm({
  activeSeasonName,
  activeBudgetCap,
}: {
  activeSeasonName?: string | null;
  activeBudgetCap?: number | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      externalLink: (formData.get("externalLink") as string)?.trim() || undefined,
    };

    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Failed to create deck");
        return;
      }

      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Register a New Deck</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Deck Name</Label>
            <Input id="name" name="name" required placeholder="e.g., Zombies Unleashed" className="bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="externalLink">Decklist Link</Label>
            <Input
              id="externalLink"
              name="externalLink"
              type="url"
              required
              placeholder="https://archidekt.com/decks/..."
              className="bg-muted border-border"
            />
            {activeBudgetCap != null ? (
              <p className="text-sm text-muted-foreground">
                {activeSeasonName} is capped at {formatUsd(activeBudgetCap)}. Use a public
                Archidekt deck link so we can validate it automatically and pull the
                commander from the list.
              </p>
            ) : null}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Registering..." : "Register Deck"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
