/**
 * Tests for theme-share.js — window.ThemeShare.buildUrl
 *
 * buildUrl() encodes the live composition (layout, typography, mode, palette,
 * Pantone year, blend, grain) into a `?theme=` query param. It is now a public
 * API (the terminal `share` command uses it), and it is URL-construction code —
 * the same class as the employer-href whitespace bug — so it is worth pinning:
 * it must ADD/replace only the theme param while preserving any existing query
 * (?view=client&ref=…) and hash.
 *
 * The module is an IIFE that attaches window.ThemeShare on load; buildUrl reads
 * the DOM/localStorage/location live at call time.
 */

require("../theme-share.js");

const DATA_ATTRS = [
  "data-layout",
  "data-typography",
  "data-palette",
  "data-coty-year",
  "data-effect-blend",
  "data-effect-grain",
];

// buildUrl reads window.location; set it without touching real navigation.
function setLocation(pathWithQuery) {
  window.history.replaceState(null, "", pathWithQuery);
}

function setMode(mode) {
  localStorage.setItem("theme-mode", mode);
}

// Decode the theme payload out of a built URL.
function themeOf(url) {
  return new URL(url).searchParams.get("theme");
}

describe("ThemeShare.buildUrl", () => {
  beforeEach(() => {
    DATA_ATTRS.forEach((a) => document.documentElement.removeAttribute(a));
    setLocation("/");
    localStorage.clear();
  });

  test("adds a theme param while preserving existing query and hash", () => {
    setLocation("/works/foo/?view=client&ref=acme#portfolio");
    document.documentElement.setAttribute("data-layout", "terminal");
    document.documentElement.setAttribute("data-typography", "technical");
    document.documentElement.setAttribute("data-palette", "standard");
    setMode("dark");

    const url = new URL(window.ThemeShare.buildUrl());

    expect(url.pathname).toBe("/works/foo/");
    expect(url.searchParams.get("view")).toBe("client");
    expect(url.searchParams.get("ref")).toBe("acme");
    expect(url.hash).toBe("#portfolio");
    expect(url.searchParams.get("theme")).toBe(
      "layout:terminal,font:technical,mode:dark,palette:standard,blend:0,grain:0"
    );
  });

  test("replaces an existing theme param instead of duplicating it", () => {
    setLocation("/?theme=layout:column,mode:light");
    document.documentElement.setAttribute("data-layout", "editorial");
    setMode("system");

    const url = new URL(window.ThemeShare.buildUrl());

    expect(url.searchParams.getAll("theme")).toHaveLength(1);
    expect(themeOf(url.href)).toContain("layout:editorial");
    expect(themeOf(url.href)).not.toContain("column");
  });

  test("falls back to defaults when the composition attrs are absent", () => {
    setMode("system");
    expect(themeOf(window.ThemeShare.buildUrl())).toBe(
      "layout:column,font:editorial,mode:system,palette:standard,blend:0,grain:0"
    );
  });

  test("encodes a Pantone palette with a valid four-digit year", () => {
    document.documentElement.setAttribute("data-palette", "pantone");
    document.documentElement.setAttribute("data-coty-year", "2026");
    setMode("light");

    const theme = themeOf(window.ThemeShare.buildUrl());
    expect(theme).toContain("palette:pantone");
    expect(theme).toContain("year:2026");
  });

  test("omits a Pantone year that is not four digits", () => {
    document.documentElement.setAttribute("data-palette", "pantone");
    document.documentElement.setAttribute("data-coty-year", "99");

    const theme = themeOf(window.ThemeShare.buildUrl());
    expect(theme).toContain("palette:pantone");
    expect(theme).not.toContain("year:");
  });

  test("omits the palette entirely for a device-local custom palette", () => {
    document.documentElement.setAttribute("data-palette", "custom");
    const theme = themeOf(window.ThemeShare.buildUrl());
    expect(theme).not.toContain("palette:");
  });

  test("reflects active blend and grain effects", () => {
    document.documentElement.setAttribute("data-effect-blend", "on");
    document.documentElement.setAttribute("data-effect-grain", "on");
    const theme = themeOf(window.ThemeShare.buildUrl());
    expect(theme).toContain("blend:1");
    expect(theme).toContain("grain:1");
  });

  test("drops composition values outside the allow-list", () => {
    document.documentElement.setAttribute("data-layout", "bogus");
    document.documentElement.setAttribute("data-typography", "nope");
    const theme = themeOf(window.ThemeShare.buildUrl());
    expect(theme).not.toContain("layout:");
    expect(theme).not.toContain("font:");
  });
});
