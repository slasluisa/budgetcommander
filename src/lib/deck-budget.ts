import "server-only";

import {
  extractArchidektCommanderNamesFromHtml,
  extractArchidektDeckTcgPriceFromHtml,
} from "@/lib/archidekt-deck-price";
import { prisma } from "@/lib/prisma";

const ARCHIDEKT_HOSTS = new Set(["archidekt.com", "www.archidekt.com"]);

type ActiveBudgetSeason = {
  name: string;
  budgetCap: number;
};

export type DeckBudgetValidationResult =
  | { ok: true; commander: string }
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

  const archidektDeckUrl = parseArchidektDeckUrl(externalLink);
  const activeBudgetSeason =
    activeSeason?.budgetCap != null
      ? {
          name: activeSeason.name,
          budgetCap: activeSeason.budgetCap,
        }
      : null;

  if (!archidektDeckUrl) {
    if (!activeBudgetSeason) {
      return {
        ok: false,
        status: 400,
        error:
          "Deck registration currently requires a public Archidekt deck link so we can read the list and detect your commander.",
      };
    }

    return {
      ok: false,
      status: 400,
      error: `Budget validation currently requires a public Archidekt deck link while ${activeBudgetSeason.name} is capped at ${formatUsd(activeBudgetSeason.budgetCap)}.`,
    };
  }

  const deckInfo = await fetchArchidektDeckInfo(archidektDeckUrl, activeBudgetSeason);
  if (!deckInfo.ok) {
    return deckInfo;
  }

  if (activeBudgetSeason && deckInfo.priceUsd == null) {
    return {
      ok: false,
      status: 502,
      error: `Archidekt did not return a deck price we could validate. Make sure the deck is public and try again before submitting for the ${activeBudgetSeason.name} budget cap.`,
    };
  }

  if (
    activeBudgetSeason &&
    deckInfo.priceUsd != null &&
    deckInfo.priceUsd > activeBudgetSeason.budgetCap
  ) {
    return {
      ok: false,
      status: 400,
      error: `Deck costs ${formatUsd(deckInfo.priceUsd)}, but the ${activeBudgetSeason.name} budget cap is ${formatUsd(activeBudgetSeason.budgetCap)}.`,
    };
  }

  return { ok: true, commander: deckInfo.commander };
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

async function fetchArchidektDeckInfo(
  deckUrl: string,
  activeSeason: ActiveBudgetSeason | null
): Promise<
  | { ok: true; priceUsd: number | null; commander: string }
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
      error:
        activeSeason?.budgetCap != null
          ? `Couldn't verify this deck's price against the ${activeSeason.name} budget cap right now. Try again in a moment.`
          : "Couldn't read that Archidekt deck right now. Try again in a moment.",
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
          : activeSeason?.budgetCap != null
            ? `Archidekt price verification is unavailable right now, so this deck couldn't be checked against the ${activeSeason.name} budget cap.`
            : "Archidekt deck verification is unavailable right now, so this deck couldn't be read.",
    };
  }

  const html = await response.text();
  const priceUsd = extractArchidektDeckTcgPriceFromHtml(html);
  const commanders = extractArchidektCommanderNamesFromHtml(html);

  if (priceUsd === null && commanders.length === 0) {
    return {
      ok: false,
      status: activeSeason?.budgetCap != null ? 502 : 400,
      error:
        activeSeason?.budgetCap != null
          ? "Archidekt did not return deck data we could validate. Make sure the deck is public and try again."
          : "That Archidekt deck could not be read. Make sure the deck is public and try again.",
    };
  }

  if (commanders.length === 0) {
    return {
      ok: false,
      status: 400,
      error:
        "That Archidekt deck does not list any cards in the Commander category. Make sure the deck is set up correctly and the link is public.",
    };
  }

  return { ok: true, priceUsd, commander: commanders.join(" / ") };
}
