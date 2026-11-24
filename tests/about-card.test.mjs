import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pages = {
  pt: readFileSync(new URL("../index.html", import.meta.url), "utf8"),
  en: readFileSync(new URL("../en/index.html", import.meta.url), "utf8"),
};
const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const card = (html) => html.match(/<section class="about-card"[\s\S]*?<\/section>/)?.[0] ?? "";

test("each page has the card with a heading, the command and the script link", () => {
  for (const [lang, html] of Object.entries(pages)) {
    const c = card(html);
    assert.match(c, /<h2[^>]*>[^<]+<\/h2>/, lang);
    assert.match(c, /<code id="about-cmd"[^>]*>curl -fsSL links\.nandomoreira\.dev\/about \| sh<\/code>/, lang);
    assert.match(c, /<a [^>]*href="\/about"/, lang);
  }
});

test("the card names its language", () => {
  assert.match(card(pages.pt), /Conheça o Fernando pelo terminal/);
  assert.match(card(pages.en), /Meet Fernando in your terminal/);
  assert.doesNotMatch(card(pages.en), /Conheça|Copiar/);
});

test("Copy ships hidden so no-JS readers are never promised an action", () => {
  for (const [lang, html] of Object.entries(pages)) {
    const button = card(html).match(/<button[^>]*>/)?.[0] ?? "";
    assert.match(button, /type="button"/, lang);
    assert.match(button, /data-copy="about-cmd"/, lang);
    assert.match(button, /\bhidden\b/, lang);
    assert.match(button, /data-label-copied="[^"]+"/, lang);
    assert.match(button, /aria-live="polite"/, lang);
  }
});

test("the command line scrolls instead of wrapping and keeps a visible focus", () => {
  assert.match(css, /\.about-card [^{]*code[^{]*\{[^}]*white-space:\s*nowrap/);
  assert.match(css, /\.about-card [^{]*code[^{]*\{[^}]*overflow-x:\s*auto/);
  assert.match(pages.pt, /<code id="about-cmd" tabindex="0"/);
});

test("the card has no credit footer styles left and no dashes", () => {
  assert.doesNotMatch(css, /^footer/m);
  for (const html of Object.values(pages)) assert.doesNotMatch(card(html), /[—–]/);
});
