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

// On navigation the scroll-progress dash retracts from its previous length back
// to the resting loop instead of snapping. The leaving page stashes its
// progress; the next page paints that length, then tweens it to zero — after
// the view transition (if one is running) so the two motions don't fight.
const BRAND_PROGRESS_KEY = "brandProgress";
const INTRO_DURATION_MS = 300;
let introRafId = null;
let introPlaying = false;

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
  const wordWidth = brandWords.reduce((sum, word) => sum + word.offsetWidth, 0);
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

function prefersReducedMotion() {
  return (
    (rootElement &&
      rootElement.getAttribute("data-effect-reduced-motion") === "on") ||
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  );
}

// Paint the mark for a given 0..1 progress. Shared by the scroll handler and
// the retract tween so both draw the dash identically (no distortion).
function renderProgress(progress) {
  if (!brandMark || !brandLineLeft || !brandLineRight || !brandLoop) {
    return;
  }
  progress = Math.min(Math.max(progress, 0), 1);

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
  brandLineRight.setAttribute("x1", (leftLength + loopWidth).toFixed(2));
  brandLineRight.setAttribute("x2", resolvedWidth.toFixed(2));
  brandLoop.setAttribute(
    "transform",
    "translate(" + leftLength.toFixed(2) + " 0)"
  );
  markBrandReady();
}

// Progress from the current scroll position (0 on compact/terminal layouts,
// where the mark is a static loop-only glyph).
function scrollProgress() {
  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  var height =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;
  var progress = height > 0 ? winScroll / height : 0;

  const isCompact =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 47.9375em)").matches;
  const isTerminal =
    rootElement && rootElement.getAttribute("data-layout") === "terminal";

  if (isCompact || isTerminal) {
    progress = 0;
  }

  return Math.min(Math.max(progress, 0), 1);
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
  // The retract intro owns the mark while it runs.
  if (introPlaying) {
    return;
  }
  renderProgress(scrollProgress());
}

// Tween the dash from `from` back to the resting loop (0).
function playIntro(from) {
  updateMetrics();
  introPlaying = true;
  renderProgress(from);

  var startTs = null;
  function step(ts) {
    if (startTs === null) {
      startTs = ts;
    }
    var t = Math.min((ts - startTs) / INTRO_DURATION_MS, 1);
    var eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    renderProgress(from * (1 - eased));
    if (t < 1) {
      introRafId = requestAnimationFrame(step);
    } else {
      introRafId = null;
      introPlaying = false;
      progressBar();
    }
  }
  introRafId = requestAnimationFrame(step);
}

// Hand control back to the scroll handler (e.g. the user scrolls mid-intro).
function cancelIntro() {
  if (introRafId !== null) {
    cancelAnimationFrame(introRafId);
    introRafId = null;
  }
  if (introPlaying) {
    introPlaying = false;
    progressBar();
  }
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

// Stash the progress on the way out so the next page can retract from it.
function stashProgress() {
  try {
    var p = scrollProgress();
    if (p > 0.02) {
      window.sessionStorage.setItem(BRAND_PROGRESS_KEY, String(p));
    } else {
      window.sessionStorage.removeItem(BRAND_PROGRESS_KEY);
    }
  } catch (e) {
    /* sessionStorage unavailable — just skip the retract */
  }
}
window.addEventListener("pagehide", stashProgress);

window.onscroll = function () {
  scheduleProgressUpdate();
};

updateMetrics();

// Retract intro on a fresh, top-of-page navigation; otherwise sync normally.
(function initBrand() {
  var stored = 0;
  try {
    stored = parseFloat(window.sessionStorage.getItem(BRAND_PROGRESS_KEY)) || 0;
    window.sessionStorage.removeItem(BRAND_PROGRESS_KEY);
  } catch (e) {
    stored = 0;
  }

  var atTop = (window.scrollY || window.pageYOffset || 0) < 4;
  if (!(stored > 0.02) || !atTop || prefersReducedMotion() || !brandMark) {
    requestAnimationFrame(syncBrand);
    return;
  }

  // Paint the previous (scrolled) length now so it matches the outgoing page —
  // seamless if a view transition captures the header — then retract it.
  introPlaying = true;
  renderProgress(stored);

  var started = false;
  var cancelled = false;
  var start = function () {
    if (started || cancelled) {
      return;
    }
    started = true;
    playIntro(stored);
  };
  var onUserScroll = function () {
    cancelled = true;
    cancelIntro();
  };

  // Retract on the next frame (once the starting length has painted).
  requestAnimationFrame(start);

  window.addEventListener("scroll", onUserScroll, { once: true, passive: true });
})();

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
// Re-sync when the layout dimension changes (terminal freezes the mark at
// loop width; leaving terminal must restore the scroll-progress state).
window.addEventListener("theme:layout-changed", () => settleBrand(6));
