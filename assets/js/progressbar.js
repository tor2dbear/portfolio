window.onscroll = function () {
  progressBar();
};

const brandParts = Array.from(
  document.querySelectorAll("[data-brand-part=\"true\"]")
);
const brandMark = document.querySelector('[data-js="brand-mark"]');
const brandLineLeft = document.querySelector('[data-js="brand-line-left"]');
const brandLineRight = document.querySelector('[data-js="brand-line-right"]');
const brandLoop = document.querySelector('[data-js="brand-loop"]');
const brandLink = document.querySelector('[data-js="brand-link"]');
const brandWords = Array.from(document.querySelectorAll(".brand__word"));

const loopWidth = 24;
const loopHeight = 24;

let brandWidth = 0;
let leftMaxPx = 0;
let rightMaxPx = 0;

function updateMetrics() {
  if (!brandParts.length) {
    brandWidth = 0;
  } else {
    const brandBase = brandParts.reduce(
      (sum, part) => sum + part.offsetWidth,
      0
    );
    brandWidth = brandBase + 5;
  }

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

updateMetrics();

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(updateMetrics);
}

window.addEventListener("resize", updateMetrics);

function progressBar() {
  if (
    !brandMark ||
    !brandLineLeft ||
    !brandLineRight ||
    !brandLoop ||
    !brandLink
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

  brandMark.style.width = markWidth + "px";
  brandMark.setAttribute("viewBox", "0 0 " + markWidth + " " + loopHeight);

  brandLineLeft.setAttribute("x2", leftLength.toFixed(2));
  brandLineRight.setAttribute(
    "x1",
    (leftLength + loopWidth).toFixed(2)
  );
  brandLineRight.setAttribute("x2", markWidth.toFixed(2));
  brandLoop.setAttribute("transform", "translate(" + leftLength.toFixed(2) + " 0)");

  const scrolledBrand = progress * 100 + "%";
  const corrBrand = 1 - progress;

  brandLink.style.width =
    "calc(" + brandWidth + "px * " + corrBrand + " + " + scrolledBrand + ")";
}

progressBar();
