"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatUsd, formatUsdFromCents } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Deck = {
  id: string;
  name: string;
  commander: string;
  externalLink: string | null;
  validatedPriceCents: number | null;
  isDefault: boolean;
  usedThisSeason: boolean;
};

export function DeckManager({
  decks,
  activeSeasonLabel,
  activeSeasonBudgetCap,
}: {
  decks: Deck[];
  activeSeasonLabel?: string | null;
  activeSeasonBudgetCap?: number | null;
}) {
  const router = useRouter();
  const [localDecks, setLocalDecks] = useState(decks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    externalLink: string;
  }>({ name: "", externalLink: "" });

  useEffect(() => {
    setLocalDecks(decks);
  }, [decks]);

  function beginEdit(deck: Deck) {
    setError(null);
    setEditingId(deck.id);
    setForm({
      name: deck.name,
      externalLink: deck.externalLink ?? "",
    });
  }

  async function save(deckId: string) {
    setLoadingId(deckId);
    try {
      setError(null);
      const res = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Failed to update deck");
        return;
      }
      const updatedDeck = (await res.json()) as Deck;
      setLocalDecks((current) =>
        current.map((deck) =>
          deck.id === deckId
            ? {
                ...deck,
                ...updatedDeck,
              }
            : deck
        )
      );
      setEditingId(null);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  async function setDefault(deckId: string, isDefault: boolean) {
    setLoadingId(deckId);
    try {
      setError(null);
      const res = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Failed to update deck");
        return;
      }
      setLocalDecks((current) =>
        current.map((deck) => ({
          ...deck,
          isDefault: isDefault ? deck.id === deckId : false,
        }))
      );
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  async function archive(deckId: string) {
    setLoadingId(deckId);
    try {
      setError(null);
      const res = await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Failed to archive deck");
        return;
      }
      setLocalDecks((current) => current.filter((deck) => deck.id !== deckId));
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  if (localDecks.length === 0) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-accent">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </div>
        <p className="font-medium">No decks yet</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Register an Archidekt decklist to start logging games and tracking your stats.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeSeasonBudgetCap != null ? (
        <p className="text-sm text-muted-foreground">
          {activeSeasonLabel} is capped at {formatUsd(activeSeasonBudgetCap)}. If you update
          the deck link, we&apos;ll re-check the current TCG price from your public Archidekt
          list. Basic lands are excluded, and the commander is pulled from the list
          automatically.
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {localDecks.map((deck) => {
        const editing = editingId === deck.id;
        return (
          <div key={deck.id} className="rounded-lg bg-muted/20 p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                {editing ? (
                  <div className="space-y-2">
                    <Input
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                      className="bg-muted border-border"
                    />
                    <Input
                      value={form.externalLink}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          externalLink: event.target.value,
                        }))
                      }
                      type="url"
                      placeholder="https://archidekt.com/decks/..."
                      className="bg-muted border-border"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{deck.name}</p>
                      {deck.isDefault && (
                        <Badge className="bg-primary/20 text-primary">Default</Badge>
                      )}
                      {deck.usedThisSeason && (
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          {activeSeasonLabel ? `Used in ${activeSeasonLabel}` : "Used this season"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{deck.commander}</p>
                    {deck.validatedPriceCents != null ? (
                      <p className="text-sm text-muted-foreground">
                        Saved validated price: {formatUsdFromCents(deck.validatedPriceCents)}
                      </p>
                    ) : null}
                    {deck.externalLink && (
                      <a
                        href={deck.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-secondary hover:underline"
                      >
                        View List
                      </a>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {editing ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => save(deck.id)}
                      disabled={loadingId === deck.id}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setError(null);
                        setEditingId(null);
                      }}
                      disabled={loadingId === deck.id}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => beginEdit(deck)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDefault(deck.id, !deck.isDefault)}
                      disabled={loadingId === deck.id}
                    >
                      {deck.isDefault ? "Unset Default" : "Make Default"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => archive(deck.id)}
                      disabled={loadingId === deck.id}
                    >
                      Archive
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
