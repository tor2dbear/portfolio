(function () {
  // Set mode (light/dark/system)
  var storedMode = localStorage.getItem("theme-mode") || "system";
  if (storedMode === "system") {
    var systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    document.documentElement.setAttribute("data-mode", systemTheme);
  } else {
    document.documentElement.setAttribute("data-mode", storedMode);
  }

  // Set palette (standard/pantone)
  var storedPalette = localStorage.getItem("theme-palette") || "standard";
  document.documentElement.setAttribute("data-palette", storedPalette);
})();
