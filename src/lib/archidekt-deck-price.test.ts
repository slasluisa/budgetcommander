import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  extractArchidektCommanderNamesFromHtml,
  extractArchidektDeckTcgPriceFromHtml,
} from "./archidekt-deck-price.ts";

test("extracts the TCG total from an Archidekt deck page fixture", () => {
  const html = readFileSync(
    new URL("./__fixtures__/archidekt-turtle-power.html", import.meta.url),
    "utf8"
  );

  const price = extractArchidektDeckTcgPriceFromHtml(html);

  assert.equal(price, 101.41);
});

test("returns null when the Archidekt page is missing __NEXT_DATA__", () => {
  const price = extractArchidektDeckTcgPriceFromHtml("<html></html>");

  assert.equal(price, null);
});

test("ignores basic lands when totaling TCG price", () => {
  const html = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
    props: {
      pageProps: {
        redux: {
          deck: {
            cardMap: {
              a: { name: "Plains", qty: 2, prices: { tcg: 0.19 } },
              b: { name: "Forest", qty: 4, prices: { tcg: 0.18 } },
              c: { name: "Sol Ring", qty: 1, prices: { tcg: 1.24 } },
            },
          },
        },
      },
    },
  })}</script>`;

  const price = extractArchidektDeckTcgPriceFromHtml(html);

  assert.equal(price, 1.24);
});

test("extracts one or more commanders from Archidekt card categories", () => {
  const html = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
    props: {
      pageProps: {
        redux: {
          deck: {
            cardMap: {
              a: {
                name: "Tymna the Weaver",
                categories: ["Commander"],
                qty: 1,
                prices: { tcg: 18.5 },
              },
              b: {
                name: "Kraum, Ludevic's Opus",
                categories: ["Commander", "Creature"],
                qty: 1,
                prices: { tcg: 12.5 },
              },
              c: {
                name: "Esper Sentinel",
                categories: ["Creature"],
                qty: 1,
                prices: { tcg: 20 },
              },
            },
          },
        },
      },
    },
  })}</script>`;

  const commanders = extractArchidektCommanderNamesFromHtml(html);

  assert.deepEqual(commanders, ["Tymna the Weaver", "Kraum, Ludevic's Opus"]);
});
