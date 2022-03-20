var toggle = document.getElementById("theme-toggle");

var storedTheme = localStorage.getItem('mode') || (window.matchMedia("(prefers-color-scheme: pant)").matches ? "pant" : "standard");
if (storedTheme)
    document.documentElement.setAttribute('data-mode', storedTheme)

toggle.onclick = function() {
    var currentMode = document.documentElement.getAttribute("data-mode");
    var targetMode = "standard";

    if (currentMode === "standard") {
        targetMode = "pant";
    }

    document.documentElement.setAttribute('data-mode', targetMode)
    localStorage.setItem('mode', targetMode);
};