// Writes the pointer position into CSS variables; the dot grid and the glow are CSS.
// Without JavaScript, on touch, or with reduced motion the grid simply stays still.
const field = document.querySelector("[data-pointer-field]");
const fine = matchMedia("(pointer: fine)").matches;
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (field && fine && !calm) {
  let last = null;
  let frame = 0;
  let snap = true;

  const paint = () => {
    frame = 0;
    if (!last) return;
    if (snap) {
      // First paint after enter: place the glow, then ease later moves.
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
