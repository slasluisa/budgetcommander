"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PollResults = {
  total: number;
  votes: { choice: number; count: number; percentage: number }[];
  userVote: number | null;
  locked: boolean;
  budgetCap: number | null;
};

export function PollWidget({ results }: { results: PollResults }) {
  const { data: session } = useSession();
  const [selected, setSelected] = useState<number | null>(results.userVote);
  const [loading, setLoading] = useState(false);

  const choices = [20, 50, 100];

  async function handleVote(choice: number) {
    if (results.locked || !session) return;
    setLoading(true);
    try {
      const res = await fetch("/api/poll/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice }),
      });
      if (res.ok) {
        setSelected(choice);
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center">
          {results.locked
            ? `Budget Set: $${results.budgetCap}`
            : "Vote for the Budget Cap"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {choices.map((choice) => {
          const vote = results.votes.find((v) => v.choice === choice);
          const count = vote?.count ?? 0;
          const pct = vote?.percentage ?? 0;

          return (
            <div key={choice} className="space-y-1">
              <div className="flex items-center justify-between">
                <Button
                  variant={selected === choice ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleVote(choice)}
                  disabled={results.locked || !session || loading}
                  className={
                    selected === choice
                      ? "bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }
                >
                  ${choice}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {count} vote{count !== 1 ? "s" : ""} ({pct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        <p className="text-center text-xs text-muted-foreground">
          {results.total} total vote{results.total !== 1 ? "s" : ""}
        </p>
      </CardContent>
    </Card>
  );
}
