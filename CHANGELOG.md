# Changelog

## [Unreleased]

### Added

- Add a short Terminal Noir card in place of the credit footer, in pt and en: a heading, the `curl -fsSL links.nandomoreira.dev | sh` command and an icon-only Copy button. The credit link to nandomoreira.dev is gone.
- Add `about.sh`, served at `/about`: it prints the links in pt or en and opens them in the browser only with `--open`. A Cloudflare rewrite maps `/` to it for non-HTML clients (see the README).
- Apply the Fernando Moreira logo favicons (ico, svg, 16/32 png) and the apple-touch icon, same as nandomoreira.dev.
- Add a looping strip above the page announcing the daily live (9h00 to 12h00) with links to the YouTube and Twitch channels; it pauses on hover and stops with reduced motion.

## [0.1.1] - 2026-11-07

### Fixed

- Fix the CV link to point to nandomoreira.dev/curriculo instead of /cv.

---

## [0.1.0] - 2026-11-07

### Added

- Add a link-in-bio page in the Terminal Noir theme, with the portrait, a short bio and links to About, Articles, YouTube, GitHub, LinkedIn, X, Instagram and the CV.
- Add the dot-grid background with an amber glow that follows the pointer, active only with a fine pointer and without reduced motion.
- Add a label slide on hover and keyboard focus, and visible focus outlines on every link.
- Add a footer credit linking to nandomoreira.dev.
- Add Firebase Hosting configuration with security headers and long-lived asset caching.
- Add automatic deploy to Firebase Hosting on every push to main, gated by the test suite.
- Add open graph and Twitter card metadata with absolute URLs.

---
