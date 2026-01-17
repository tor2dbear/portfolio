const brandMark = document.querySelector('[data-js="brand-mark"]');
const brandLineLeft = document.querySelector('[data-js="brand-line-left"]');
const brandLineRight = document.querySelector('[data-js="brand-line-right"]');
const brandLoop = document.querySelector('[data-js="brand-loop"]');
const brandWords = Array.from(document.querySelectorAll(".brand__word"));
const rootElement = document.documentElement;
let brandReady = false;
let rafId = null;

const loopWidth = 24;
const loopHeight = 24;

let leftMaxPx = 0;
let rightMaxPx = 0;

function updateMetrics() {
  const brandContainer = brandMark ? brandMark.parentElement : null;
  const headerContainer = brandContainer
    ? brandContainer.closest(".top-menu__container")
    : null;
  const nav = headerContainer
    ? headerContainer.querySelector(".top-menu__nav")
    : null;
  const containerWidth = headerContainer
    ? headerContainer.offsetWidth
    : brandContainer
      ? brandContainer.offsetWidth
      : 0;
  const navWidth = nav ? nav.offsetWidth : 0;
  const columnGapValue = headerContainer
    ? parseFloat(getComputedStyle(headerContainer).columnGap)
    : 0;
  const columnGap = Number.isNaN(columnGapValue) ? 0 : columnGapValue;
  const availableWidth = Math.max(0, containerWidth - navWidth - columnGap);
  const wordWidth = brandWords.reduce(
    (sum, word) => sum + word.offsetWidth,
    0
  );
  const maxGap = Math.max(0, availableWidth - wordWidth);
  const lineGap = Math.max(0, maxGap - loopWidth);

  leftMaxPx = lineGap * 0.3;
  rightMaxPx = lineGap * 0.7;
}

function markBrandReady() {
  if (!rootElement || brandReady) {
    return;
  }
  brandReady = true;
  rootElement.setAttribute("data-brand-ready", "true");
}

function scheduleProgressUpdate() {
  if (rafId !== null) {
    return;
  }
  rafId = requestAnimationFrame(() => {
    rafId = null;
    progressBar();
  });
}

function progressBar() {
  if (
    !brandMark ||
    !brandLineLeft ||
    !brandLineRight ||
    !brandLoop
  ) {
    return;
  }
  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  var height =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;
  var progress = height > 0 ? winScroll / height : 0;

  progress = Math.min(Math.max(progress, 0), 1);

  const isCompact =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 47.9375em)").matches;

  if (isCompact) {
    progress = 0;
  }

  const leftLength = leftMaxPx * progress;
  const rightLength = rightMaxPx * progress;
  const markWidth = loopWidth + leftLength + rightLength;

  const resolvedWidth = Math.max(
    loopWidth,
    Number.isFinite(markWidth) ? markWidth : loopWidth
  );

  brandMark.style.width = resolvedWidth + "px";
  brandMark.setAttribute("viewBox", "0 0 " + resolvedWidth + " " + loopHeight);

  brandLineLeft.setAttribute("x2", leftLength.toFixed(2));
  brandLineRight.setAttribute(
    "x1",
    (leftLength + loopWidth).toFixed(2)
  );
  brandLineRight.setAttribute("x2", resolvedWidth.toFixed(2));
  brandLoop.setAttribute(
    "transform",
    "translate(" + leftLength.toFixed(2) + " 0)"
  );
  markBrandReady();
}

function syncBrand() {
  updateMetrics();
  progressBar();
}

function settleBrand(frames = 12) {
  if (frames <= 0) {
    return;
  }
  syncBrand();
  requestAnimationFrame(() => {
    settleBrand(frames - 1);
  });
}

if (rootElement) {
  rootElement.setAttribute("data-brand-ready", "false");
}

window.onscroll = function () {
  scheduleProgressUpdate();
};

updateMetrics();
requestAnimationFrame(syncBrand);

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => settleBrand(6));
}

window.addEventListener("load", () => {
  settleBrand(12);
  setTimeout(() => settleBrand(6), 150);
});
window.addEventListener("pageshow", () => settleBrand(12));
window.addEventListener("resize", syncBrand);
window.addEventListener("scroll", scheduleProgressUpdate, { passive: true });
