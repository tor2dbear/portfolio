(function () {
  var storedTheme = localStorage.getItem("theme") || "system";
  if (storedTheme === "system") {
    var systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    document.documentElement.setAttribute("data-theme", systemTheme);
  } else {
    document.documentElement.setAttribute("data-theme", storedTheme);
  }
})();
