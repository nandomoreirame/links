import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, mkdtempSync, writeFileSync, chmodSync, rmSync, existsSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const script = new URL("../links.sh", import.meta.url).pathname;

const run = (args = [], env = {}) =>
  spawnSync("/bin/sh", [script, ...args], {
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
  assert.match(r.stdout, /^links \d+\.\d+\.\d+\n$/);
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

// --open: stub openers in a temp PATH so no browser starts.
const withOpener = (name, fn) => {
  const dir = mkdtempSync(join(tmpdir(), "links-"));
  const log = join(dir, "opened.log");
  symlinkSync("/usr/bin/cat", join(dir, "cat")); // the only tool the script needs besides sh builtins
  if (name) {
    const bin = join(dir, name);
    writeFileSync(bin, `#!/bin/sh\necho "$1" >> "${log}"\n`);
    chmodSync(bin, 0o755);
  }
  try {
    return fn({ dir, log, env: { PATH: dir } });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const linkCount = readFileSync(script, "utf8").match(/^[^|\n]+\|https:\/\/[^|]+\|/gm).length;

test("--open calls the opener once per link", () => {
  withOpener("xdg-open", ({ log, env }) => {
    const r = run(["--open", "--lang", "en"], env);
    assert.equal(r.status, 0);
    const opened = readFileSync(log, "utf8").trim().split("\n");
    assert.equal(opened.length, linkCount);
    assert.ok(opened.includes("https://github.com/nandomoreirame"));
  });
});

test("--open falls back to open when xdg-open is missing", () => {
  withOpener("open", ({ log, env }) => {
    assert.equal(run(["--open"], env).status, 0);
    assert.equal(readFileSync(log, "utf8").trim().split("\n").length, linkCount);
  });
});

test("--open --dry-run lists the URLs and opens nothing", () => {
  withOpener("xdg-open", ({ log, env }) => {
    const r = run(["--open", "--dry-run"], env);
    assert.equal(r.status, 0);
    assert.equal(existsSync(log), false);
    assert.ok(r.stdout.includes("would open: https://github.com/nandomoreirame"));
  });
});

test("--open without an opener exits 1 with an error", () => {
  withOpener(null, ({ env }) => {
    const r = run(["--open"], env);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /^error: no browser opener found/);
  });
});

test("without --open nothing is opened", () => {
  withOpener("xdg-open", ({ log, env }) => {
    run([], env);
    assert.equal(existsSync(log), false);
  });
});

// The script is a third copy of the page links; fail when they drift.
test("the script links match index.html and en/index.html", () => {
  const hrefs = (file) => {
    const html = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    const nav = html.match(/<nav aria-label="[^"]*">\s*<ul>([\s\S]*?)<\/ul>/)[1];
    return [...nav.matchAll(/href="(https:[^"]+)"/g)].map((m) => m[1]);
  };
  const inScript = readFileSync(script, "utf8")
    .match(/^[^|\n]+\|(https:\/\/[^|]+)\|/gm)
    .map((l) => l.split("|")[1]);
  assert.deepEqual(inScript, hrefs("index.html"));
  assert.deepEqual(inScript, hrefs("en/index.html"));
});

test("the script header documents the home command", () => {
  assert.match(readFileSync(script, "utf8"), /curl -fsSL links\.nandomoreira\.dev \| sh/);
});
