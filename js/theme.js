var toggle = document.getElementById("theme-toggle");
var delay = document.body;

var storedTheme =
  localStorage.getItem("mode") ||
  (window.matchMedia("(prefers-color-scheme: pant)").matches
    ? "pant"
    : "standard");
if (storedTheme)
  document.documentElement.setAttribute("data-mode", storedTheme);

toggle.onclick = function () {
  var currentMode = document.documentElement.getAttribute("data-mode");
  var targetMode = "standard";
  delay.classList.add("darkmodeTransition");
  setTimeout(function () {
    delay.classList.remove("darkmodeTransition");
  }, 1000);

  if (currentMode === "standard") {
    targetMode = "pant";
  }

  document.documentElement.setAttribute("data-mode", targetMode);
  localStorage.setItem("mode", targetMode);
};
// Set the meta tag content based on the CSS variable
// Function to get the value of a CSS variable
function getCssVariableValue(variableName) {
  return getComputedStyle(document.documentElement).getPropertyValue(
    variableName
  );
}

// Set the theme color meta tag content to the value of --bg-color
const themeColorMetaTag = document.querySelector('meta[name="theme-color"]');
themeColorMetaTag.setAttribute(
  "content",
  getCssVariableValue("--bg-color").trim()
);
