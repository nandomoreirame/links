import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pages = {
  pt: readFileSync(new URL("../index.html", import.meta.url), "utf8"),
  en: readFileSync(new URL("../en/index.html", import.meta.url), "utf8"),
};
const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const card = (html) => html.match(/<section class="about-card"[\s\S]*?<\/section>/)?.[0] ?? "";

test("each page has a short card: heading and the command, nothing else", () => {
  for (const [lang, html] of Object.entries(pages)) {
    const c = card(html);
    assert.match(c, /<h2[^>]*>[^<]+<\/h2>/, lang);
    assert.match(c, /<code id="about-cmd"[^>]*>curl -fsSL links\.nandomoreira\.dev \| sh<\/code>/, lang);
    assert.doesNotMatch(c, /<p[\s>]/, `${lang}: no explanatory paragraph`);
    assert.doesNotMatch(c, /<a[\s>]/, `${lang}: no script link`);
    assert.doesNotMatch(c, /about\.sh|--open/, lang);
  }
});

test("the card names its language", () => {
  assert.match(card(pages.pt), /Veja os links no seu terminal/);
  assert.match(card(pages.en), /See my links in your terminal/);
  assert.doesNotMatch(card(pages.en), /Veja|Copiar/);
});

test("Copy is an icon with a screen reader name and ships hidden", () => {
  for (const [lang, html] of Object.entries(pages)) {
    const c = card(html);
    const button = c.match(/<button[^>]*>/)?.[0] ?? "";
    assert.match(button, /type="button"/, lang);
    assert.match(button, /data-copy="about-cmd"/, lang);
    assert.match(button, /\bhidden\b/, lang);
    assert.match(button, /data-label-copied="[^"]+"/, lang);
    assert.match(button, /aria-live="polite"/, lang);
    const inner = c.match(/<button[^>]*>([\s\S]*?)<\/button>/)[1];
    assert.match(inner, /<svg/, lang);
    assert.match(inner, /<span class="sr-only">[^<]+<\/span>/, lang);
    assert.equal(inner.replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<span class="sr-only">[^<]+<\/span>/, "").trim(), "", `${lang}: no visible label`);
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
