const svgNamespace = "http://www.w3.org/2000/svg";

function svgElement(tag, attributes, ...children) {
  const node = document.createElementNS(svgNamespace, tag);
  for (const [name, value] of Object.entries(attributes)) {
    node.setAttribute(name, String(value));
  }
  node.append(...children);
  return node;
}

const portuguese = document.documentElement.lang === "pt-BR";
const scene = document.createElement("div");
scene.setAttribute("class", "noir-scene");

const moon = svgElement("svg", { class: "noir-moon", viewBox: "0 0 96 96", "aria-hidden": "true" },
  svgElement("circle", { class: "moon-target", cx: 48, cy: 48, r: 44 }),
  svgElement("path", { class: "moon-crescent", d: "M46 14a36 36 0 1 0 35 57A33 33 0 0 1 46 14Z" }),
);

const skylineSize = { viewBox: "0 0 1200 270", preserveAspectRatio: "none" };
const distantSkyline = svgElement("svg", {
  ...skylineSize,
  class: "noir-skyline noir-skyline-far",
  "aria-hidden": "true",
});
const skyline = svgElement("svg", {
  ...skylineSize,
  class: "noir-skyline noir-skyline-near",
  role: "group",
  "aria-label": portuguese ? "Janelas da cidade" : "City windows",
  "aria-describedby": "city-window-instructions",
});
const instructions = svgElement("desc", { id: "city-window-instructions" });
instructions.textContent = portuguese
  ? "Use as setas para percorrer as janelas. Pressione Enter ou Espaço para acender ou apagar."
  : "Use the arrow keys to move between windows. Press Enter or Space to turn a light on or off.";
skyline.append(instructions);
const randomLightsAllowed = matchMedia("(prefers-reduced-motion: no-preference)");
const interactiveBuildings = [];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function isLit(window) {
  return window.getAttribute("aria-pressed") === "true" || window.hasAttribute("data-random-lit");
}

function rebalanceBuilding(windows) {
  let lit = windows.filter(isLit).length;
  while (lit < 3) {
    const dark = windows.filter(window => !window.hasAttribute("data-interacted") && !isLit(window));
    if (!dark.length) break;
    randomItem(dark).setAttribute("data-random-lit", "");
    lit++;
  }
  while (lit > 4) {
    const bright = windows.filter(window => !window.hasAttribute("data-interacted") && window.hasAttribute("data-random-lit"));
    if (!bright.length) break;
    randomItem(bright).removeAttribute("data-random-lit");
    lit--;
  }
}

function scheduleCityLights(buildings) {
  if (!randomLightsAllowed.matches || !buildings.length) return;

  let buildingIndex = 0;
  const rotate = () => {
    const windows = buildings[buildingIndex % buildings.length];
    buildingIndex++;
    const lit = windows.filter(isLit).length;
    if (lit <= 3) {
      const dark = windows.filter(window => !window.hasAttribute("data-interacted") && !isLit(window));
      if (dark.length) randomItem(dark).setAttribute("data-random-lit", "");
    } else {
      const bright = windows.filter(window => !window.hasAttribute("data-interacted") && window.hasAttribute("data-random-lit"));
      if (bright.length) randomItem(bright).removeAttribute("data-random-lit");
    }
    setTimeout(rotate, 1000);
  };
  setTimeout(rotate, 1000);
}

function addBuildings(layer, buildings, interactive) {
  const facades = svgElement("g", { class: "city-facades", "aria-hidden": "true" });
  const windows = [];
  let offset = 0;
  let activeWindow;
  for (const [index, [width, top]] of buildings.entries()) {
    const buildingWindows = [];
    const x = offset;
    offset += width;
    facades.append(svgElement("rect", { x, y: top, width, height: 270 - top }));

    if (index % 3 === 1) {
      const center = x + width / 2;
      facades.append(svgElement("path", {
        d: `M${center - 10} ${top}v-12h20v12 M${center - 13} ${top - 12}l13 -9 13 9Z`,
      }));
    }

    const columns = width >= 80 ? 3 : 2;
    const columnWidth = width / columns;
    let buildingWindowIndex = 0;
    for (let y = top + 17; y < 261; y += 22) {
      for (let column = 0; column < columns; column++) {
        const center = x + (column + 0.5) * columnWidth;
        const light = svgElement("rect", { class: "window-light", x: center - 4, y: y - 6, width: 8, height: 12, rx: 1 });
        const localWindowIndex = buildingWindowIndex++;
        if (!interactive) {
          if (localWindowIndex % 6 === 1) light.setAttribute("class", "window-light window-light-static");
          windows.push(light);
          continue;
        }

        const windowIndex = windows.length;
        const window = svgElement("g", {
          class: "city-window",
          role: "button",
          tabindex: windowIndex === 0 ? 0 : -1,
          "data-building": index,
          "aria-label": `${portuguese ? "Janela" : "Window"} ${windowIndex + 1}`,
          "aria-pressed": "false",
        },
        svgElement("rect", { class: "window-target", x: center - columnWidth / 2, y: y - 11, width: columnWidth, height: 22, rx: 2 }),
        light);
        const select = () => {
          activeWindow?.setAttribute("tabindex", -1);
          window.setAttribute("tabindex", 0);
          activeWindow = window;
        };
        const toggle = () => {
          select();
          window.removeAttribute("data-random-lit");
          window.setAttribute("aria-pressed", window.getAttribute("aria-pressed") === "false");
          window.setAttribute("data-interacted", "");
          rebalanceBuilding(buildingWindows);
        };
        window.addEventListener("click", toggle);
        window.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!event.repeat) toggle();
          }

          const step = { ArrowLeft: -1, ArrowUp: -columns, ArrowRight: 1, ArrowDown: columns }[event.key];
          if (!step) return;
          event.preventDefault();
          const next = windows[(windowIndex + step + windows.length) % windows.length];
          activeWindow?.setAttribute("tabindex", -1);
          next.setAttribute("tabindex", 0);
          activeWindow = next;
          next.focus();
        });
        windows.push(window);
        buildingWindows.push(window);
        activeWindow ??= window;
      }
    }
    if (interactive) {
      const initialLights = 3 + Math.floor(Math.random() * 2);
      for (let count = 0; count < initialLights; count++) {
        const dark = buildingWindows.filter(window => !window.hasAttribute("data-random-lit"));
        randomItem(dark).setAttribute("data-random-lit", "");
      }
      interactiveBuildings.push(buildingWindows);
    }
  }
  layer.append(facades, ...windows);
}

addBuildings(distantSkyline, [
  [63, 87], [71, 99], [76, 63], [58, 108], [83, 78], [71, 98], [78, 65], [68, 94],
  [82, 73], [66, 100], [94, 69], [68, 108], [82, 80], [71, 67], [62, 101], [107, 82],
], false);
addBuildings(skyline, [
  [68, 147], [86, 125], [62, 161], [91, 115], [71, 143], [78, 156], [84, 120], [63, 173],
  [86, 146], [79, 122], [60, 160], [95, 128], [63, 176], [80, 139], [68, 152], [66, 116],
], true);
scheduleCityLights(interactiveBuildings);

function rainLayer(depth, width, height, strokes) {
  const patternId = `noir-rain-${depth}-lines`;
  return svgElement("svg", { class: `noir-rain noir-rain-${depth}`, "aria-hidden": "true" },
    svgElement("defs", {},
      svgElement("pattern", { id: patternId, width, height, patternUnits: "userSpaceOnUse" },
        svgElement("path", { d: strokes }),
      ),
    ),
    svgElement("rect", { width: "100%", height: "100%", fill: `url(#${patternId})` }),
  );
}

const farRain = rainLayer("far", 255, 171, "M18 57l4 25 M64 110l5 27 M118 17l5 26 M144 72l6 32 M209 128l4 21 M242 52l3 18");
const nearRain = rainLayer("near", 294, 222, "M18 23l9 47 M67 113l11 66 M142 4l5 26 M178 65l13 63 M239 150l8 44 M278 55l4 22");
scene.append(farRain, moon, distantSkyline, skyline, nearRain);
document.body.append(scene);

const parallaxAllowed = matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
const parallaxRange = 16;
let lastPointer = null;
let parallaxFrame = 0;

function positionScene(x, y) {
  scene.style.setProperty("--scene-x", `${x}px`);
  scene.style.setProperty("--scene-y", `${y}px`);
}

function resetParallax() {
  cancelAnimationFrame(parallaxFrame);
  parallaxFrame = 0;
  lastPointer = null;
  positionScene(0, 0);
}

window.addEventListener("pointermove", event => {
  if (!parallaxAllowed.matches || event.pointerType === "touch") return;
  lastPointer = event;
  if (parallaxFrame) return;

  parallaxFrame = requestAnimationFrame(() => {
    parallaxFrame = 0;
    const x = (2 * lastPointer.clientX / window.innerWidth - 1) * parallaxRange;
    const y = (2 * lastPointer.clientY / window.innerHeight - 1) * parallaxRange;
    positionScene(Math.round(x), Math.round(y));
  });
}, { passive: true });

document.documentElement.addEventListener("pointerleave", resetParallax);
window.addEventListener("blur", resetParallax);
parallaxAllowed.addEventListener("change", resetParallax);

// Copy buttons ship hidden: without this script the page never promises an action.
for (const button of document.querySelectorAll?.("[data-copy]") ?? []) {
  const source = document.getElementById(button.dataset.copy);
  if (!source) continue;
  const text = button.querySelector("span") ?? button;
  const label = text.textContent;
  let resetTimer = 0;

  const selectSource = () => {
    const range = document.createRange();
    range.selectNodeContents(source);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const showCopied = () => {
    clearTimeout(resetTimer);
    button.setAttribute("data-copied", "");
    text.textContent = button.dataset.labelCopied;
    resetTimer = setTimeout(() => {
      button.removeAttribute("data-copied");
      text.textContent = label;
    }, 2000);
  };

  button.hidden = false;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(source.textContent);
      showCopied();
    } catch {
      selectSource();
    }
  });
}
