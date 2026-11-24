import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const js = readFileSync(new URL("../city.js", import.meta.url), "utf8");

const element = (tag) => ({
  tag,
  attributes: {},
  children: [],
  listeners: {},
  dataset: {},
  hidden: false,
  textContent: "",
  style: { setProperty() {} },
  setAttribute(n, v) { this.attributes[n] = String(v); },
  removeAttribute(n) { delete this.attributes[n]; },
  getAttribute(n) { return this.attributes[n]; },
  hasAttribute(n) { return Object.hasOwn(this.attributes, n); },
  append(...nodes) { this.children.push(...nodes); },
  addEventListener(type, fn) { this.listeners[type] = fn; },
  focus() {},
});

// Runs city.js against a fake DOM that has one Copy button and its command.
const boot = ({ clipboard }) => {
  const button = element("button");
  button.dataset.copy = "about-cmd";
  button.dataset.labelCopied = "Copiado";
  button.hidden = true;
  button.textContent = "Copiar";
  const command = element("code");
  command.textContent = "curl -fsSL links.nandomoreira.dev/about | sh";
  const timers = [];
  const selection = { ranges: [], removeAllRanges() { this.ranges = []; }, addRange(r) { this.ranges.push(r); } };
  runInNewContext(js, {
    document: {
      body: element("body"),
      documentElement: { ...element("html"), lang: "pt-BR" },
      createElement: element,
      createElementNS: (_, tag) => element(tag),
      createRange: () => ({ selectNodeContents(node) { this.node = node; } }),
      querySelectorAll: (sel) => (sel === "[data-copy]" ? [button] : []),
      getElementById: (id) => (id === "about-cmd" ? command : null),
    },
    window: { ...element("window"), innerWidth: 1000, innerHeight: 800, getSelection: () => selection },
    navigator: clipboard === undefined ? {} : { clipboard },
    matchMedia: () => ({ ...element("media"), matches: true }),
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
    setTimeout: (callback, delay) => { const t = { callback, delay }; timers.push(t); return t; },
    clearTimeout: () => {},
    Math: { floor: Math.floor, round: Math.round, random: () => 0.5 },
  });
  return { button, command, timers, selection };
};

test("Copy is revealed once the script runs", () => {
  const { button } = boot({ clipboard: { writeText: async () => {} } });
  assert.equal(button.hidden, false);
});

test("a click copies only the command and shows the copied state, then clears it", async () => {
  const written = [];
  const { button, timers } = boot({ clipboard: { writeText: async (text) => written.push(text) } });
  await button.listeners.click();
  assert.deepEqual(written, ["curl -fsSL links.nandomoreira.dev/about | sh"]);
  assert.equal(button.textContent, "Copiado");
  assert.equal(button.hasAttribute("data-copied"), true);
  const reset = timers.at(-1);
  assert.ok(reset.delay >= 1500 && reset.delay <= 3000);
  reset.callback();
  assert.equal(button.textContent, "Copiar");
  assert.equal(button.hasAttribute("data-copied"), false);
});

test("without the clipboard API the command is selected for a manual copy", async () => {
  const { button, command, selection } = boot({ clipboard: undefined });
  await button.listeners.click();
  assert.equal(selection.ranges.length, 1);
  assert.equal(selection.ranges[0].node, command);
  assert.equal(button.hasAttribute("data-copied"), false);
});

test("a rejected clipboard write also falls back to selecting the command", async () => {
  const { button, selection } = boot({ clipboard: { writeText: async () => { throw new Error("denied"); } } });
  await button.listeners.click();
  assert.equal(selection.ranges.length, 1);
  assert.equal(button.hasAttribute("data-copied"), false);
});
