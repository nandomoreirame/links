import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const script = new URL("../about.sh", import.meta.url).pathname;

const run = (args = [], env = {}) =>
  spawnSync("sh", [script, ...args], {
    encoding: "utf8",
    input: "",
    timeout: 10000,
    env: { HOME: "/nonexistent", PATH: "/usr/bin:/bin", ...env },
  });

test("--help exits 0 and prints usage on stdout", () => {
  for (const flag of ["--help", "-h"]) {
    const r = run([flag]);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /^Usage:/);
  }
});

test("--version prints the version", () => {
  const r = run(["--version"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^about \d+\.\d+\.\d+\n$/);
});

test("an unknown flag exits 2 with the error on stderr", () => {
  const r = run(["--bogus"]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /^error: /);
  assert.match(r.stderr, /Usage:/);
  assert.equal(r.stdout, "");
});

test("an invalid --lang value exits 2", () => {
  assert.equal(run(["--lang", "xx"]).status, 2);
  assert.equal(run(["--lang"]).status, 2);
});

test("piped output carries no ANSI escape", () => {
  const r = run(["--lang", "en"]);
  assert.equal(r.status, 0);
  assert.doesNotMatch(r.stdout, /\x1b/);
});

test("--lang picks the language and wins over LANG", () => {
  assert.match(run(["--lang", "pt"], { LANG: "en_US.UTF-8" }).stdout, /Engenheiro de software/);
  assert.match(run(["--lang", "en"], { LANG: "pt_BR.UTF-8" }).stdout, /Software engineer/);
});

test("LANG decides the language when --lang is absent", () => {
  assert.match(run([], { LANG: "pt_BR.UTF-8" }).stdout, /Engenheiro de software/);
  assert.match(run([], { LANG: "C" }).stdout, /Software engineer/);
  assert.match(run([], { LC_ALL: "pt_BR.UTF-8", LANG: "C" }).stdout, /Engenheiro de software/);
});

test("the card lists the links and never an email or phone", () => {
  const out = run(["--lang", "en"]).stdout;
  for (const url of ["https://github.com/nandomoreirame", "https://nandomoreira.dev/sobre", "https://www.youtube.com/@nandomoreiradev"]) {
    assert.ok(out.includes(url), url);
  }
  assert.doesNotMatch(out, /@nandomoreira\.dev|wa\.me|mailto:/);
});

test("no em or en dashes in the script", () => {
  assert.doesNotMatch(readFileSync(script, "utf8"), /[—–]/);
});
