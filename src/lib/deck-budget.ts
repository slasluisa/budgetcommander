import "server-only";

import { prisma } from "@/lib/prisma";

const MOXFIELD_HOSTS = new Set(["moxfield.com", "www.moxfield.com"]);
const PRICE_PATHS = [
  ["prices", "paper"],
  ["prices", "usd"],
  ["price", "paper"],
  ["price", "usd"],
  ["publicPrices", "paper"],
  ["publicPrices", "usd"],
] as const;

type ActiveBudgetSeason = {
  name: string;
  budgetCap: number;
};

export type DeckBudgetValidationResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      status: 400 | 502;
    };

export async function validateDeckAgainstLeagueBudget(
  externalLink: string
): Promise<DeckBudgetValidationResult> {
  const activeSeason = await prisma.season.findFirst({
    where: { status: "ACTIVE", budgetCap: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { name: true, budgetCap: true },
  });

  if (activeSeason?.budgetCap == null) {
    return { ok: true };
  }

  const deckId = parseMoxfieldDeckId(externalLink);
  if (!deckId) {
    return {
      ok: false,
      status: 400,
      error: `Budget validation currently requires a public Moxfield deck link while ${activeSeason.name} is capped at ${formatUsd(activeSeason.budgetCap)}.`,
    };
  }

  const deckPrice = await fetchMoxfieldDeckPrice(deckId, activeSeason);
  if (!deckPrice.ok) {
    return deckPrice;
  }

  if (deckPrice.priceUsd > activeSeason.budgetCap) {
    return {
      ok: false,
      status: 400,
      error: `Deck costs ${formatUsd(deckPrice.priceUsd)}, but the ${activeSeason.name} budget cap is ${formatUsd(activeSeason.budgetCap)}.`,
    };
  }

  return { ok: true };
}

export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function parseMoxfieldDeckId(externalLink: string) {
  let url: URL;

  try {
    url = new URL(externalLink);
  } catch {
    return null;
  }

  if (!MOXFIELD_HOSTS.has(url.hostname.toLowerCase())) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const decksIndex = segments.findIndex((segment) => segment === "decks");
  const deckId = decksIndex >= 0 ? segments[decksIndex + 1] : null;

  return deckId || null;
}

async function fetchMoxfieldDeckPrice(
  deckId: string,
  activeSeason: ActiveBudgetSeason
): Promise<
  | { ok: true; priceUsd: number }
  | { ok: false; error: string; status: 400 | 502 }
> {
  let response: Response;

  try {
    response = await fetch(`https://api.moxfield.com/v2/decks/all/${deckId}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "BudgetCommander/1.0",
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return {
      ok: false,
      status: 502,
      error: `Couldn't verify this deck's price against the ${activeSeason.name} budget cap right now. Try again in a moment.`,
    };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("application/json")) {
    return {
      ok: false,
      status: response.status === 404 ? 400 : 502,
      error:
        response.status === 404
          ? "That Moxfield deck could not be found. Make sure the deck is public and the link is correct."
          : `Moxfield price verification is unavailable right now, so this deck couldn't be checked against the ${activeSeason.name} budget cap.`,
    };
  }

  const payload = (await response.json()) as unknown;
  const priceUsd = extractDeckPrice(payload);

  if (priceUsd === null) {
    return {
      ok: false,
      status: 502,
      error:
        "Moxfield did not return a deck price we could validate. Make sure the deck is public and try again.",
    };
  }

  return { ok: true, priceUsd };
}

function extractDeckPrice(payload: unknown): number | null {
  for (const path of PRICE_PATHS) {
    const value = readPath(payload, path);
    const numeric = toNumber(value);
    if (numeric !== null) {
      return numeric;
    }
  }

  return findPriceInNestedPriceObjects(payload);
}

function readPath(
  value: unknown,
  path: readonly string[]
): unknown {
  let current = value;

  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) {
      return null;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

function findPriceInNestedPriceObjects(
  value: unknown,
  depth = 0
): number | null {
  if (!value || typeof value !== "object" || depth > 6) {
    return null;
  }

  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey.includes("price")) {
      const namedPrice = extractNamedPrice(child);
      if (namedPrice !== null) {
        return namedPrice;
      }
    }

    const nestedPrice = findPriceInNestedPriceObjects(child, depth + 1);
    if (nestedPrice !== null) {
      return nestedPrice;
    }
  }

  return null;
}

function extractNamedPrice(value: unknown): number | null {
  if (!value || typeof value !== "object") {
    return toNumber(value);
  }

  const record = value as Record<string, unknown>;
  for (const key of ["paper", "usd", "regular", "total", "amount", "value"]) {
    const numeric = toNumber(record[key]);
    if (numeric !== null) {
      return numeric;
    }
  }

  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replaceAll("$", "").replaceAll(",", "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
