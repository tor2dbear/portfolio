(function () {
  // Set mode (light/dark)
  var storedTheme = localStorage.getItem("theme") || "system";
  if (storedTheme === "system") {
    var systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    document.documentElement.setAttribute("data-mode", systemTheme);
  } else {
    document.documentElement.setAttribute("data-mode", storedTheme);
  }

  // Set palette (standard/pantone)
  var storedPalette = localStorage.getItem("palette") || "standard";
  document.documentElement.setAttribute("data-palette", storedPalette);
})();
