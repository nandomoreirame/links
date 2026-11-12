import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");

test("declares language, viewport and a title", () => {
  assert.match(html, /<html lang="pt-BR"/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /<title>[^<]+<\/title>/);
});

test("has exactly one h1", () => {
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
});

test("lists the main links", () => {
  for (const label of ["YouTube", "GitHub", "LinkedIn", "/dev/null", "Currículo"]) {
    assert.match(html, new RegExp(label), `missing link: ${label}`);
  }
});

test("links to the dev-null profile", () => {
  assert.match(html, /href="https:\/\/dev-null\.sh\/@nandomoreirame"/);
});

test("external links open safely", () => {
  const external = html.match(/<a [^>]*href="https?:\/\/[^"]+"[^>]*>/g) ?? [];
  assert.ok(external.length >= 5);
  for (const a of external) assert.match(a, /rel="noopener noreferrer"/, a);
});

test("avatar has alt text and exists on disk", () => {
  assert.match(html, /<img[^>]+alt="[^"]+"/);
  for (const [, src] of html.matchAll(/(?:src|srcset)="(assets\/[^"\s]+)/g)) {
    assert.ok(existsSync(new URL(`../${src}`, import.meta.url)), src);
  }
});

test("uses the Terminal Noir palette", () => {
  for (const hex of ["#0b0b0c", "#f4f4f5", "#f5a623", "#a1a1aa"]) {
    assert.ok(css.includes(hex), hex);
  }
});

test("keyboard focus is visible and motion is respected", () => {
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});

test("no em or en dashes in the copy", () => {
  assert.doesNotMatch(html, /[—–]/);
});

test("ships one local script and no third-party code", () => {
  const scripts = html.match(/<script[^>]*>/g) ?? [];
  assert.equal(scripts.length, 1);
  assert.match(scripts[0], /src="pointer\.js"/);
  assert.doesNotMatch(scripts[0], /https?:/);
});

test("body is the pointer field with a dot grid and amber glow", () => {
  assert.match(html, /<body[^>]*data-pointer-field/);
  assert.match(css, /@property --gx/);
  assert.match(css, /\[data-pointer-field\]::after/);
  assert.match(css, /mask-image: radial-gradient\(circle 7rem at var\(--gx\) var\(--gy\)/);
});

test("pointer script only runs for a fine pointer and no reduced motion", () => {
  const js = readFileSync(new URL("../pointer.js", import.meta.url), "utf8");
  assert.match(js, /\(pointer: fine\)/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(js, /--gx/);
});

test("link label slides right on hover, only without reduced motion", () => {
  const block = css.match(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}\n/)[0];
  assert.match(block, /\.link:hover \.label[\s\S]*translateX\(6px\)/);
});

test("open graph image and url are absolute", () => {
  assert.match(html, /property="og:image" content="https:\/\/[^"]+"/);
  assert.match(html, /property="og:url" content="https:\/\/[^"]+"/);
});

test("footer credits the author with a link", () => {
  assert.match(html, /<footer>\s*feito com IA e com &lt;3 por <a href="https:\/\/nandomoreira\.dev"[^>]*>nandomoreira\.dev<\/a>\s*<\/footer>/);
});

test("main pushes deploy to Firebase Hosting after the tests pass", () => {
  const wf = readFileSync(new URL("../.github/workflows/deploy.yml", import.meta.url), "utf8");
  assert.match(wf, /on:\s*\n\s*push:\s*\n\s*branches: \[main\]/);
  assert.match(wf, /npm test/);
  assert.match(wf, /FirebaseExtended\/action-hosting-deploy@[0-9a-f]{40}/);
  assert.match(wf, /\$\{\{ secrets\.FIREBASE_SERVICE_ACCOUNT \}\}/);
  assert.match(wf, /channelId: live/);
  assert.doesNotMatch(wf, /pull_request/);
  for (const [, ref] of wf.matchAll(/uses: \S+@(\S+)/g)) assert.match(ref, /^[0-9a-f]{40}$/, ref);
});

test("CV link points to /curriculo", () => {
  assert.match(html, /href="https:\/\/nandomoreira\.dev\/curriculo"[^>]*>\s*<span class="label">Currículo/);
});

test("live strip links both channels, repeats them hidden from assistive tech and stops under reduced motion", () => {
  for (const url of ["https://www.youtube.com/@nandomoreiradev", "https://www.twitch.tv/baratotonto"]) {
    assert.equal((html.match(new RegExp(`class="live-item" href="${url}"`, "g")) ?? []).length, 2, url);
  }
  assert.match(html, /<div class="live-group" aria-hidden="true">[\s\S]*?tabindex="-1"[\s\S]*?tabindex="-1"/);
  assert.match(html, /9h00 às 12h00/);
  assert.match(css, /@keyframes live-slide \{ to \{ transform: translateX\(-50%\)/);
  const motion = css.match(/@media \(prefers-reduced-motion: no-preference\) \{\s*\.live-track \{ animation: live-slide/);
  assert.ok(motion, "animation only under no-preference");
});

test("uses the Fernando Moreira logo favicons, all present on disk", () => {
  for (const href of ["favicon.ico", "favicon.svg", "favicon-32.png", "favicon-16.png", "apple-touch-icon.png"]) {
    assert.match(html, new RegExp(`<link rel="(?:icon|apple-touch-icon)" href="${href}"`), href);
    assert.ok(existsSync(new URL(`../${href}`, import.meta.url)), `missing file: ${href}`);
  }
});
