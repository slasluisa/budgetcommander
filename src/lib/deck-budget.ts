import "server-only";

import { extractArchidektDeckTcgPriceFromHtml } from "@/lib/archidekt-deck-price";
import { prisma } from "@/lib/prisma";

const ARCHIDEKT_HOSTS = new Set(["archidekt.com", "www.archidekt.com"]);

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

  const activeBudgetSeason: ActiveBudgetSeason = {
    name: activeSeason.name,
    budgetCap: activeSeason.budgetCap,
  };

  const archidektDeckUrl = parseArchidektDeckUrl(externalLink);
  if (!archidektDeckUrl) {
    return {
      ok: false,
      status: 400,
      error: `Budget validation currently requires a public Archidekt deck link while ${activeBudgetSeason.name} is capped at ${formatUsd(activeBudgetSeason.budgetCap)}.`,
    };
  }

  const deckPrice = await fetchArchidektDeckPrice(
    archidektDeckUrl,
    activeBudgetSeason
  );
  if (!deckPrice.ok) {
    return deckPrice;
  }

  if (deckPrice.priceUsd > activeBudgetSeason.budgetCap) {
    return {
      ok: false,
      status: 400,
      error: `Deck costs ${formatUsd(deckPrice.priceUsd)}, but the ${activeBudgetSeason.name} budget cap is ${formatUsd(activeBudgetSeason.budgetCap)}.`,
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

function parseArchidektDeckUrl(externalLink: string) {
  let url: URL;

  try {
    url = new URL(externalLink);
  } catch {
    return null;
  }

  if (!ARCHIDEKT_HOSTS.has(url.hostname.toLowerCase())) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const decksIndex = segments.findIndex((segment) => segment === "decks");
  const deckId = decksIndex >= 0 ? segments[decksIndex + 1] : null;

  if (!deckId) {
    return null;
  }

  url.hash = "";

  return url.toString();
}

async function fetchArchidektDeckPrice(
  deckUrl: string,
  activeSeason: ActiveBudgetSeason
): Promise<
  | { ok: true; priceUsd: number }
  | { ok: false; error: string; status: 400 | 502 }
> {
  let response: Response;

  try {
    response = await fetch(deckUrl, {
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml",
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
  if (!response.ok || !contentType.includes("text/html")) {
    return {
      ok: false,
      status: response.status === 404 ? 400 : 502,
      error:
        response.status === 404
          ? "That Archidekt deck could not be found. Make sure the deck is public and the link is correct."
          : `Archidekt price verification is unavailable right now, so this deck couldn't be checked against the ${activeSeason.name} budget cap.`,
    };
  }

  const html = await response.text();
  const priceUsd = extractArchidektDeckTcgPriceFromHtml(html);

  if (priceUsd === null) {
    return {
      ok: false,
      status: 502,
      error:
        "Archidekt did not return a deck price we could validate. Make sure the deck is public and try again.",
    };
  }

  return { ok: true, priceUsd };
}
