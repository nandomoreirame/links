import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const pt = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const enUrl = new URL("../en/index.html", import.meta.url);
const en = existsSync(enUrl) ? readFileSync(enUrl, "utf8") : "";
const hrefs = (html) => [...html.matchAll(/<a [^>]*?href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);

test("English page exists and declares lang=en", () => {
  assert.match(en, /<html lang="en"/);
  assert.match(en, /<title>Fernando Moreira \| Links<\/title>/);
  assert.equal((en.match(/<h1[\s>]/g) ?? []).length, 1);
});

test("both pages declare each other as hreflang alternates, plus x-default", () => {
  for (const html of [pt, en]) {
    assert.match(html, /<link rel="alternate" hreflang="pt-BR" href="https:\/\/links\.nandomoreira\.dev\/">/);
    assert.match(html, /<link rel="alternate" hreflang="en" href="https:\/\/links\.nandomoreira\.dev\/en\/">/);
    assert.match(html, /<link rel="alternate" hreflang="x-default" href="https:\/\/links\.nandomoreira\.dev\/">/);
  }
  assert.match(en, /<link rel="canonical" href="https:\/\/links\.nandomoreira\.dev\/en\/">/);
  assert.match(en, /property="og:locale" content="en_US"/);
  assert.match(pt, /property="og:locale" content="pt_BR"/);
});

test("the language switcher links to the other page and marks the current one", () => {
  assert.match(pt, /<nav class="lang" aria-label="Idioma">[\s\S]*?<a [^>]*href="\/"[^>]*aria-current="page"[^>]*>PT<\/a>[\s\S]*?<a [^>]*href="\/en\/"[^>]*hreflang="en"[^>]*lang="en"[^>]*>EN<\/a>/);
  assert.match(en, /<nav class="lang" aria-label="Language">[\s\S]*?<a [^>]*href="\/"[^>]*hreflang="pt-BR"[^>]*lang="pt-BR"[^>]*>PT<\/a>[\s\S]*?<a [^>]*href="\/en\/"[^>]*aria-current="page"[^>]*>EN<\/a>/);
});

test("both pages point to the same destinations", () => {
  assert.deepEqual(hrefs(en).sort(), hrefs(pt).sort());
});

test("English copy is translated", () => {
  for (const text of ["About me", "Articles", "open source", "unfiltered commits", "behind the scenes", "career", "Résumé", "Live every day, 9:00 AM to 12:00 PM"]) {
    assert.ok(en.includes(text), text);
  }
  for (const text of ["Sobre mim", "Artigos", "código aberto", "Currículo", "feito com IA"]) {
    assert.ok(!en.includes(text), `still Portuguese: ${text}`);
  }
});

test("English page loads assets from the root and keeps external links safe", () => {
  for (const f of ["style.css", "pointer.js", "favicon.ico", "favicon.svg", "apple-touch-icon.png"]) {
    assert.match(en, new RegExp(`(?:href|src)="/${f.replace(".", "\\.")}`), f);
  }
  assert.match(en, /src="\/assets\/fernando-moreira-v3-960\.png"/);
  for (const a of en.match(/<a [^>]*href="https?:\/\/[^"]+"[^>]*>/g) ?? []) {
    assert.match(a, /rel="noopener noreferrer"/, a);
  }
  assert.doesNotMatch(en, /[—–]/);
});
