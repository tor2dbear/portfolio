var toggle = document.querySelector('[data-js="palette-toggle"]');
var delay = document.body;

var storedPalette =
  localStorage.getItem("theme-palette") ||
  localStorage.getItem("palette") ||
  "standard";
if (storedPalette) {
  document.documentElement.setAttribute("data-palette", storedPalette);
  if (!localStorage.getItem("theme-palette")) {
    localStorage.setItem("theme-palette", storedPalette);
  }
}

if (toggle) {
  toggle.onclick = function () {
    var currentPalette = document.documentElement.getAttribute("data-palette");
    var targetPalette = "standard";
    delay.classList.add("darkmodeTransition");
    setTimeout(function () {
      delay.classList.remove("darkmodeTransition");
    }, 1000);

    if (currentPalette === "standard") {
      targetPalette = "pantone";
    }

    document.documentElement.setAttribute("data-palette", targetPalette);
    localStorage.setItem("theme-palette", targetPalette);
    localStorage.setItem("palette", targetPalette);
  };
}
