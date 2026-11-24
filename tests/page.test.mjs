import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { runInNewContext } from "node:vm";

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
  assert.match(scripts[0], /src="city\.js\?v=\d+\.\d+\.\d+"/);
  assert.doesNotMatch(scripts[0], /https?:/);
});

test("renders an interactive SVG city and resets its parallax on pointer exit", () => {
  const element = tag => ({
    tag,
    attributes: {},
    children: [],
    listeners: {},
    style: { setProperty(name, value) { this[name] = value; } },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    getAttribute(name) { return this.attributes[name]; },
    hasAttribute(name) { return Object.hasOwn(this.attributes, name); },
    append(...nodes) { this.children.push(...nodes); },
    addEventListener(type, handler) { this.listeners[type] = handler; },
    focus() { this.focused = true; },
  });
  const body = element("body");
  const root = { ...element("html"), lang: "pt-BR" };
  const viewport = { ...element("window"), innerWidth: 1000, innerHeight: 800 };
  const motion = { ...element("media"), matches: true };
  let paint;
  const timers = [];
  const js = readFileSync(new URL("../city.js", import.meta.url), "utf8");
  runInNewContext(js, {
    document: {
      body,
      documentElement: root,
      createElement: element,
      createElementNS: (_, tag) => element(tag),
    },
    window: viewport,
    matchMedia: () => motion,
    requestAnimationFrame: callback => { paint = callback; return 1; },
    cancelAnimationFrame: () => {},
    setTimeout: (callback, delay) => {
      const timer = { callback, delay, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimeout: timer => { timer.cleared = true; },
    Math: { floor: Math.floor, round: Math.round, random: () => 0.5 },
  });
  const [scene] = body.children;
  const layers = name => scene.children.filter(child => child.attributes.class.split(" ").includes(name));
  const [moon] = layers("noir-moon");
  const [skyline] = layers("noir-skyline-near");
  const [farSkyline] = layers("noir-skyline-far");
  assert.equal(moon.tag, "svg");
  assert.equal(moon.attributes["aria-hidden"], "true");
  assert.equal(skyline.tag, "svg");
  assert.equal(farSkyline.attributes["aria-hidden"], "true");
  const staticLights = farSkyline.children.filter(child => child.attributes.class?.split(" ").includes("window-light-static"));
  assert.ok(staticLights.length >= 32);
  assert.ok(staticLights.every(light => !light.attributes.role && !light.attributes["data-random-lit"]));
  assert.equal(layers("noir-rain").length, 2);
  assert.equal(layers("noir-skyline").length, 2);
  const windows = skyline.children.filter(child => child.attributes.role === "button");
  assert.ok(windows.length > 60);
  const [window, nextWindow] = windows;
  assert.equal(window.attributes.tabindex, "0");
  assert.match(window.attributes["aria-label"], /^Janela /);
  assert.equal(window.attributes["aria-pressed"], "false");
  const buildingLights = () => {
    const groups = new Map();
    for (const item of windows) {
      const building = item.attributes["data-building"];
      const lit = item.attributes["data-random-lit"] !== undefined || item.attributes["aria-pressed"] === "true";
      groups.set(building, (groups.get(building) ?? 0) + Number(lit));
    }
    return groups;
  };
  assert.equal(buildingLights().size, 16);
  for (const count of buildingLights().values()) assert.ok(count === 3 || count === 4);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 1000);
  const beforeTick = windows.filter(item => item.attributes["data-random-lit"] !== undefined).length;
  timers[0].callback();
  for (const count of buildingLights().values()) assert.ok(count === 3 || count === 4);
  const afterTick = windows.filter(item => item.attributes["data-random-lit"] !== undefined).length;
  assert.equal(Math.abs(afterTick - beforeTick), 1);
  assert.equal(timers.at(-1).delay, 1000);
  window.listeners.click();
  assert.equal(window.attributes["aria-pressed"], "true");
  for (const count of buildingLights().values()) assert.ok(count === 3 || count === 4);
  window.listeners.keydown({ key: " ", preventDefault() {} });
  assert.equal(window.attributes["aria-pressed"], "false");
  for (const count of buildingLights().values()) assert.ok(count === 3 || count === 4);
  assert.ok(Object.hasOwn(window.attributes, "data-interacted"));
  window.listeners.keydown({ key: "ArrowRight", preventDefault() {} });
  assert.equal(window.attributes.tabindex, "-1");
  assert.equal(nextWindow.attributes.tabindex, "0");
  assert.equal(nextWindow.focused, true);

  viewport.listeners.pointermove({ clientX: 750, clientY: 200, pointerType: "mouse" });
  paint();
  assert.equal(scene.style["--scene-x"], "8px");
  assert.equal(scene.style["--scene-y"], "-8px");

  root.listeners.pointerleave();
  assert.equal(scene.style["--scene-x"], "0px");
  assert.equal(scene.style["--scene-y"], "0px");
});

test("link label slides right on hover, only without reduced motion", () => {
  const block = css.match(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}\n/)[0];
  assert.match(block, /\.link:hover \.label[\s\S]*translateX\(6px\)/);
});

test("open graph image and url are absolute", () => {
  assert.match(html, /property="og:image" content="https:\/\/[^"]+"/);
  assert.match(html, /property="og:url" content="https:\/\/[^"]+"/);
});

test("the credit footer is gone and the about card closes the main", () => {
  for (const path of ["../index.html", "../en/index.html"]) {
    const page = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(page, /<footer/, path);
    assert.match(page, /<section class="about-card"[\s\S]*<\/section>\s*<\/main>/, path);
  }
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

test("both language pages start with the main content", () => {
  for (const path of ["../index.html", "../en/index.html"]) {
    const page = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(page, /<body\b[^>]*>\s*<main>/, path);
  }
});

test("uses the Fernando Moreira logo favicons, all present on disk", () => {
  for (const href of ["favicon.ico", "favicon.svg", "favicon-32.png", "favicon-16.png", "apple-touch-icon.png"]) {
    assert.match(html, new RegExp(`<link rel="(?:icon|apple-touch-icon)" href="${href}"`), href);
    assert.ok(existsSync(new URL(`../${href}`, import.meta.url)), `missing file: ${href}`);
  }
});
