# Plan: about script (curl | sh)

**Goal:** Serve a POSIX sh script at `links.nandomoreira.dev/about` that prints an about-me card in the terminal and opens the links in the browser only with `--open`.
**Origin:** /dev implement
**Status:** done
**Out of scope:** Subscribe or follow actions, GitHub follow via `gh`, prompts, installers, telemetry, email and WhatsApp in the output.
**Total Tasks:** 4

### Task 1: Card output and basic flags

**Done when:** `sh about.sh` prints the card in pt or en by `--lang` or `LANG`. `--help` exits 0 with `Usage:`. An unknown flag exits 2 with the message on stderr. Piped output has no ANSI.

### Task 2: Open links with --open and --dry-run

**Done when:** `--open` calls `xdg-open`, `open` or `wslview` once per link, using stubs in `PATH`. `--open --dry-run` lists the URLs and opens nothing. A missing opener exits 1 with `error:` on stderr.

### Task 3: Serve it at /about

**Done when:** `firebase.json` rewrites `/about` to `/about.sh`. It sends `text/plain; charset=utf-8` and a short cache. It ignores `docs/**`. A test proves each rule.

### Task 4: Keep links in sync and document it

**Done when:** A test fails when the script URLs differ from the links in `index.html` and `en/index.html`. The README has the one-line command and a Security section. The changelog lists the feature.
