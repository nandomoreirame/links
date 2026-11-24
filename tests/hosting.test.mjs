import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { hosting } = JSON.parse(readFileSync(new URL("../firebase.json", import.meta.url), "utf8"));
const headersFor = (source) => hosting.headers.find((h) => h.source === source)?.headers ?? [];
const value = (list, key) => list.find((h) => h.key === key)?.value;

test("/about rewrites to the links.sh script", () => {
  assert.deepEqual(hosting.rewrites, [{ source: "/about", destination: "/links.sh" }]);
});

test("the script is served as plain text so a browser shows it instead of downloading", () => {
  for (const source of ["/about", "/links.sh"]) {
    assert.equal(value(headersFor(source), "Content-Type"), "text/plain; charset=utf-8", source);
  }
});

test("the script is cached for minutes, not a year", () => {
  for (const source of ["/about", "/links.sh"]) {
    assert.equal(value(headersFor(source), "Cache-Control"), "public, max-age=300", source);
  }
});

test("docs and tests are not published", () => {
  assert.ok(hosting.ignore.includes("docs/**"));
  assert.ok(hosting.ignore.includes("tests/**"));
});

test("the script itself is not ignored", () => {
  assert.ok(!hosting.ignore.some((g) => g === "links.sh" || g === "*.sh" || g === "**/*.sh"));
});
