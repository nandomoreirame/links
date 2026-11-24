# Plan: about command card in the links footer

**Goal:** Replace the credit footer with a Terminal Noir card that teaches `curl -fsSL links.nandomoreira.dev | sh` and copies it with one click. Revised 2026-11-24: the command uses the home, and the card holds only a heading, the command and an icon-only Copy button.
**Origin:** /dev implement
**Status:** done
**Out of scope:** The nandomoreira.dev site card (separate plan), typing animation, run counters, a new script file.
**Total Tasks:** 3

### Task 1: Card markup and style replace the footer

**Done when:** Both pages have no footer and end with the card. The card holds a heading, the command in a code element and a hidden icon-only Copy button, with no paragraph and no link. The page has no pt text in en and no dashes.

### Task 2: One-click copy in city.js

**Done when:** A fake-DOM test shows the button is revealed, the command is copied, a copied state shows and clears, and a clipboard failure leaves the command selectable. The page still ships one script.

### Task 3: Verify in the browser and document

**Done when:** UI check passes at 360px and 1280px with no console error and no horizontal page scroll. The cache-bust versions, README and CHANGELOG are updated.
