import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeArchidektDeckUrl,
  shouldRevalidateDeckLink,
} from "./archidekt-deck-url.ts";

test("normalizes Archidekt deck URLs to a canonical deck id path", () => {
  assert.equal(
    normalizeArchidektDeckUrl(
      "https://www.archidekt.com/decks/12345/turtle-power?foo=bar#section"
    ),
    "https://archidekt.com/decks/12345"
  );
});

test("returns null for non-Archidekt or malformed deck URLs", () => {
  assert.equal(normalizeArchidektDeckUrl("https://example.com/decks/12345"), null);
  assert.equal(normalizeArchidektDeckUrl("not-a-url"), null);
  assert.equal(normalizeArchidektDeckUrl("https://archidekt.com/users/12345"), null);
});

test("skips revalidation when the edited link still points at the same deck and a price exists", () => {
  assert.equal(
    shouldRevalidateDeckLink({
      previousExternalLink: "https://archidekt.com/decks/12345/original-name",
      nextExternalLink: "https://www.archidekt.com/decks/12345/renamed-list?view=table",
      previousValidatedPriceCents: 10141,
    }),
    false
  );
});

test("revalidates when a deck is missing a saved validated price, even if the edit keeps the same deck id", () => {
  assert.equal(
    shouldRevalidateDeckLink({
      previousExternalLink: "https://archidekt.com/decks/12345/original-name",
      nextExternalLink: "https://www.archidekt.com/decks/12345/renamed-list?view=table",
      previousValidatedPriceCents: null,
    }),
    true
  );
});

test("revalidates when a deck is missing a saved validated price, even if the exact same URL is saved again", () => {
  assert.equal(
    shouldRevalidateDeckLink({
      previousExternalLink: "https://archidekt.com/decks/12345/original-name",
      nextExternalLink: "https://archidekt.com/decks/12345/original-name",
      previousValidatedPriceCents: null,
    }),
    true
  );
});

test("revalidates when the edited link points to a different deck", () => {
  assert.equal(
    shouldRevalidateDeckLink({
      previousExternalLink: "https://archidekt.com/decks/12345/original-name",
      nextExternalLink: "https://archidekt.com/decks/67890/new-deck",
      previousValidatedPriceCents: 10141,
    }),
    true
  );
});
