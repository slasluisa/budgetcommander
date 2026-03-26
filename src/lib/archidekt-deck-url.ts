const ARCHIDEKT_HOSTS = new Set(["archidekt.com", "www.archidekt.com"]);

export function normalizeArchidektDeckUrl(externalLink: string): string | null {
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

  return `https://archidekt.com/decks/${deckId}`;
}

export function shouldRevalidateDeckLink({
  previousExternalLink,
  nextExternalLink,
  previousValidatedPriceCents,
}: {
  previousExternalLink: string | null;
  nextExternalLink: string;
  previousValidatedPriceCents: number | null;
}) {
  if (previousValidatedPriceCents == null) {
    return true;
  }

  if (nextExternalLink === previousExternalLink) {
    return false;
  }

  return (
    normalizeArchidektDeckUrl(nextExternalLink) !==
    normalizeArchidektDeckUrl(previousExternalLink ?? "")
  );
}
