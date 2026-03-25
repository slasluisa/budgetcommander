"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

type Deck = {
  id: string;
  name: string;
  commander: string;
  externalLink: string | null;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    commander: string;
    externalLink: string;
  }>({ name: "", commander: "", externalLink: "" });

  function beginEdit(deck: Deck) {
    setError(null);
    setEditingId(deck.id);
    setForm({
      name: deck.name,
      commander: deck.commander,
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
      await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault }),
      });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  async function archive(deckId: string) {
    setLoadingId(deckId);
    try {
      setError(null);
      await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  if (decks.length === 0) {
    return <p className="text-muted-foreground">No decks registered yet.</p>;
  }

  return (
    <div className="space-y-3">
      {activeSeasonBudgetCap != null ? (
        <p className="text-sm text-muted-foreground">
          {activeSeasonLabel} is capped at {formatUsd(activeSeasonBudgetCap)}. Deck links must
          point to a public Moxfield list for budget validation.
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {decks.map((deck) => {
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
                      value={form.commander}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, commander: event.target.value }))
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
                      placeholder="https://www.moxfield.com/decks/..."
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
