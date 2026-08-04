/**
 * Tests for lightbox.js — focus trap.
 *
 * The overlay is aria-modal="true", so Tab must stay within it while open.
 * lightbox.js is an IIFE that builds the overlay and binds its document-level
 * listeners once at require time, so we require it a single time and drive the
 * single overlay instance per test (matching production, which loads it once).
 */
require("../lightbox.js");
const overlay = document.getElementById("lightbox");
const closeBtn = overlay.querySelector(".lightbox__close");
const prevBtn = overlay.querySelector(".lightbox__nav-btn--prev");
const nextBtn = overlay.querySelector(".lightbox__nav-btn--next");

function addFigures(count) {
  for (let i = 0; i < count; i += 1) {
    const fig = document.createElement("figure");
    fig.setAttribute("data-lightbox", "/img/" + i + ".jpg");
    const im = document.createElement("img");
    im.alt = "image " + i;
    fig.appendChild(im);
    document.body.appendChild(fig);
  }
}

function openFirst() {
  document
    .querySelector("figure[data-lightbox]")
    .dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
}

function pressTab(shiftKey) {
  document.dispatchEvent(
    new window.KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: !!shiftKey,
      bubbles: true,
    })
  );
}

describe("Lightbox focus trap", () => {
  beforeEach(() => {
    overlay.classList.remove("is-open");
    document
      .querySelectorAll("figure[data-lightbox]")
      .forEach((f) => f.remove());
  });

  test("opening focuses the close button", () => {
    addFigures(1);
    openFirst();
    expect(overlay.classList.contains("is-open")).toBe(true);
    expect(document.activeElement).toBe(closeBtn);
  });

  test("single image: Tab and Shift+Tab keep focus on the close button", () => {
    addFigures(1);
    openFirst();
    pressTab(false);
    expect(document.activeElement).toBe(closeBtn);
    pressTab(true);
    expect(document.activeElement).toBe(closeBtn);
  });

  test("gallery: Tab from the last control wraps to the first", () => {
    addFigures(2);
    openFirst();
    // At index 0 the prev button is disabled, so the focusables are
    // [close, next] — next is last.
    expect(prevBtn.disabled).toBe(true);
    nextBtn.focus();
    pressTab(false);
    expect(document.activeElement).toBe(closeBtn);
  });

  test("gallery: Shift+Tab from the first control wraps to the last", () => {
    addFigures(2);
    openFirst();
    closeBtn.focus();
    pressTab(true);
    expect(document.activeElement).toBe(nextBtn);
  });

  test("gallery: Tab wraps back in when the focused control just became disabled", () => {
    addFigures(2);
    openFirst();
    // Focus Next (enabled at index 0), then activate it to reach the last image
    // — Next disables itself while staying activeElement.
    nextBtn.focus();
    nextBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(nextBtn.disabled).toBe(true);
    expect(document.activeElement).toBe(nextBtn);
    // A now-disabled active control is absent from the focusable set, so Tab
    // must wrap back to the first control rather than escaping the modal.
    pressTab(false);
    expect(document.activeElement).toBe(closeBtn);
  });

  test("Tab is ignored while the lightbox is closed", () => {
    addFigures(1);
    document.body.focus();
    const before = document.activeElement;
    pressTab(false);
    expect(document.activeElement).toBe(before);
  });
});
