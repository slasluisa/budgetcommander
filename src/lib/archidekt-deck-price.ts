const BASIC_LAND_NAMES = new Set([
  "Plains",
  "Swamp",
  "Forest",
  "Island",
  "Mountain",
]);

type ArchidektCardRecord = Record<string, unknown>;

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

function readDeckCardMap(html: string): ArchidektCardRecord[] | null {
  const nextData = readEmbeddedNextData(html);
  if (!nextData) {
    return null;
  }

  const deck = findDeckWithCardMap(nextData);
  const cardMap = deck?.cardMap;
  if (!cardMap || typeof cardMap !== "object") {
    return null;
  }

  return Object.values(cardMap).filter(
    (card): card is ArchidektCardRecord => !!card && typeof card === "object"
  );
}

function cardIsCommander(card: ArchidektCardRecord) {
  const categoryFields = [
    card.categories,
    card.globalCategories,
    card.defaultCategory,
  ];

  return categoryFields.some((value) => {
    if (typeof value === "string") {
      return value === "Commander";
    }

    if (!Array.isArray(value)) {
      return false;
    }

    return value.some((entry) => entry === "Commander");
  });
}

export function extractArchidektCommanderNamesFromHtml(html: string): string[] {
  const cards = readDeckCardMap(html);
  if (!cards) {
    return [];
  }

  const commanders = new Set<string>();

  for (const card of cards) {
    if (!cardIsCommander(card)) {
      continue;
    }

    const name = typeof card.name === "string" ? card.name.trim() : "";
    if (name) {
      commanders.add(name);
    }
  }

  return Array.from(commanders);
}

export function extractArchidektDeckTcgPriceFromHtml(
  html: string
): number | null {
  const cards = readDeckCardMap(html);
  if (!cards) {
    return null;
  }

  let total = 0;

  for (const card of cards) {
    const name = typeof card.name === "string" ? card.name : "";
    if (BASIC_LAND_NAMES.has(name)) {
      continue;
    }

    const qty = toNumber(card.qty) ?? 0;
    const prices =
      card.prices && typeof card.prices === "object"
        ? (card.prices as Record<string, unknown>)
        : null;
    const tcg = toNumber(prices?.tcg) ?? 0;

    total += qty * tcg;
  }

  return Math.round(total * 100) / 100;
}
