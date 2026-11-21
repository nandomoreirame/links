// Writes the pointer position into CSS variables for the decorative code mask.
// Without JavaScript, on touch, or with reduced motion the grid simply stays still.
const field = document.querySelector("[data-pointer-field]");
const fine = matchMedia("(pointer: fine)").matches;
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (field && fine && !calm) {
  const code = document.createElement("pre");
  code.className = "pointer-code";
  code.setAttribute("aria-hidden", "true");
  const source = `<!doctype html>
<main class="links">
  <header class="profile">
    <h1>Fernando Moreira</h1>
    <p>Open source · AI · Linux</p>
  </header>
  <nav aria-label="Links">
    <ul>
      <li><a href="/posts">Blog</a></li>
      <li><a href="/lab">Lab</a></li>
      <li><a href="/portfolio">Work</a></li>
    </ul>
  </nav>
  <footer>nandomoreira.dev</footer>
</main>

.links {
  display: grid;
  gap: 0.75rem;
  margin-inline: auto;
}

.link:hover {
  border-color: var(--primary);
  background: var(--elevated);
}

const links = [
  { label: "Blog", href: "/posts" },
  { label: "Lab", href: "/lab" },
  { label: "Work", href: "/portfolio" },
];

const destinations = links.map(
  ({ href }) => href
);

`.repeat(12);
  // Match only the token forms used in the decorative sample.
  const tokens = /(?<string>"[^"\n]*")|(?<tag><\/?[\w!-]+)|(?<selector>^\.[\w:-]+)|(?<keyword>\bconst\b)|(?<property>[\w-]+(?=\s*:|="))|(?<number>\b\d+(?:\.\d+)?(?:rem)?\b)/gm;
  let offset = 0;
  for (const match of source.matchAll(tokens)) {
    const token = document.createElement("span");
    const kind = Object.keys(match.groups).find(name => match.groups[name] !== undefined);
    token.className = "token-" + kind;
    token.textContent = match[0];
    code.append(source.slice(offset, match.index), token);
    offset = match.index + match[0].length;
  }
  code.append(source.slice(offset));
  field.prepend(code);

  let last = null;
  let frame = 0;
  let snap = true;

  const paint = () => {
    frame = 0;
    if (!last) return;
    if (snap) {
      // Place the mask on entry, then ease subsequent moves.
      field.dataset.snap = "";
      snap = false;
      requestAnimationFrame(() => delete field.dataset.snap);
    }
    field.style.setProperty("--gx", `${last.clientX}px`);
    field.style.setProperty("--gy", `${last.clientY}px`);
  };

  field.addEventListener("pointermove", (event) => {
    last = event;
    field.dataset.active = "";
    if (!frame) frame = requestAnimationFrame(paint);
  });

  field.addEventListener("pointerleave", () => {
    last = null;
    snap = true;
    delete field.dataset.active;
    delete field.dataset.snap;
  });
}
