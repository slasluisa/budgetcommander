"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PendingGameTools({
  gameId,
  canRemind,
  lastReminderAt,
}: {
  gameId: string;
  canRemind: boolean;
  lastReminderAt: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"remind" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: "remind" | "cancel") {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/games/${gameId}/${action}`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Action failed");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card className="mt-4 border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Pending Game Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {lastReminderAt
            ? `Last reminder sent ${new Date(lastReminderAt).toLocaleString()}.`
            : "No reminder sent yet."}
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => runAction("remind")}
            disabled={loading !== null || !canRemind}
          >
            Send Reminder
          </Button>
          <Button
            variant="destructive"
            onClick={() => runAction("cancel")}
            disabled={loading !== null}
          >
            Cancel Game
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
