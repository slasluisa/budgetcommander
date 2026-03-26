const BASIC_LAND_NAMES = new Set([
  "Plains",
  "Swamp",
  "Forest",
  "Island",
  "Mountain",
]);

function readEmbeddedNextData(html: string): unknown | null {
  const match = html.match(
    /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
  );

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function findDeckWithCardMap(
  value: unknown,
  depth = 0
): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || depth > 10) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const cardMap = record.cardMap;
  if (cardMap && typeof cardMap === "object") {
    return record;
  }

  if ("deck" in record) {
    const deck = findDeckWithCardMap(record.deck, depth + 1);
    if (deck) {
      return deck;
    }
  }

  for (const child of Object.values(record)) {
    const deck = findDeckWithCardMap(child, depth + 1);
    if (deck) {
      return deck;
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

export function extractArchidektDeckTcgPriceFromHtml(
  html: string
): number | null {
  const nextData = readEmbeddedNextData(html);
  if (!nextData) {
    return null;
  }

  const deck = findDeckWithCardMap(nextData);
  const cardMap = deck?.cardMap;
  if (!cardMap || typeof cardMap !== "object") {
    return null;
  }

  let total = 0;

  for (const card of Object.values(cardMap)) {
    if (!card || typeof card !== "object") {
      continue;
    }

    const record = card as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : "";
    if (BASIC_LAND_NAMES.has(name)) {
      continue;
    }

    const qty = toNumber(record.qty) ?? 0;
    const prices =
      record.prices && typeof record.prices === "object"
        ? (record.prices as Record<string, unknown>)
        : null;
    const tcg = toNumber(prices?.tcg) ?? 0;

    total += qty * tcg;
  }

  return Math.round(total * 100) / 100;
}
