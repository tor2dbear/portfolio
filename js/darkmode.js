document
  .getElementById("theme-menu-toggle")
  .addEventListener("click", function () {
    const menuContainer = document.querySelector(".theme-menu-container");
    const overlay = document.getElementById("overlay");
    const menu = document.getElementById("theme-menu");
    const menuVisible = menuContainer.getAttribute("data-visible") === "true";
    toggleMenu(!menuVisible);
  });

document.getElementById("overlay").addEventListener("click", function () {
  closeMenu();
});

// Variables to store touch start position
let touchStartY = 0;
let touchEndY = 0;

const handle = document.querySelector(".handle");
const menu = document.getElementById("theme-menu");

handle.addEventListener("touchstart", function (event) {
  touchStartY = event.changedTouches[0].screenY;
  menu.style.transition = "none"; // Disable transition during drag
});

handle.addEventListener("touchmove", function (event) {
  touchEndY = event.changedTouches[0].screenY;
  const touchDeltaY = touchEndY - touchStartY;

  if (touchDeltaY > 0) {
    menu.style.transform = `translateY(${touchDeltaY}px)`;
  }
});

handle.addEventListener("touchend", function (event) {
  const touchDeltaY = touchEndY - touchStartY;

  if (touchDeltaY > 50) {
    // Swipe down detected
    closeMenu();
  } else {
    // Return to original position
    menu.style.transition = "transform 0.3s ease-in-out";
    menu.style.transform = `translateY(0)`;
  }
});

function toggleMenu(visible) {
  const menuContainer = document.querySelector(".theme-menu-container");
  const overlay = document.getElementById("overlay");
  const menu = document.getElementById("theme-menu");

  menuContainer.setAttribute("data-visible", visible);
  overlay.setAttribute("data-visible", visible);
  menu.setAttribute("data-visible", visible);
  document.body.classList.toggle("no-scroll", visible);

  if (visible) {
    menu.style.transform = "translateY(0)";
    menu.style.transition = "transform 0.3s ease-in-out";
  } else {
    menu.style.transform = "translateY(100%)";
  }
}

function setTheme(theme) {
  localStorage.setItem("theme", theme);
  applyTheme(theme);
  closeMenu(); // Close menu after selection
}

function applyTheme(theme) {
  if (theme === "system") {
    updateSystemTheme();
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
  updateMenuIcon(theme);
  updateThemeColor(theme); // Update the theme color meta tag
}

function updateSystemTheme() {
  var systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  document.documentElement.setAttribute("data-theme", systemTheme);
  updateThemeColor(systemTheme); // Update the theme color meta tag
}

function updateMenuIcon(theme) {
  const icon = document.getElementById("theme-menu-icon");
  let svgPath = "";

  if (theme === "light") {
    svgPath = "/img/svg/light.svg";
  } else if (theme === "dark") {
    svgPath = "/img/svg/dark.svg";
  } else if (theme === "system") {
    svgPath = "/img/svg/system.svg";
  }

  fetch(svgPath)
    .then((response) => response.text())
    .then((svg) => {
      icon.innerHTML = svg;
      icon.querySelector("svg").style.stroke = "currentColor";
    });
}

function updateThemeColor(theme) {
  const backgroundBase = getComputedStyle(document.documentElement)
    .getPropertyValue("--background-base")
    .trim();
  let themeColorMetaTag = document.querySelector('meta[name="theme-color"]');

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    themeColorMetaTag.content = systemTheme === "dark" ? "#18181b" : "#FFFFFF";
  } else {
    themeColorMetaTag.content = backgroundBase;
  }
}

function closeMenu() {
  toggleMenu(false);
}

// Update visibility based on data-visible attribute
const observer = new MutationObserver(function () {
  const menuContainer = document.querySelector(".theme-menu-container");
  const menu = document.getElementById("theme-menu");
  const isVisible = menuContainer.getAttribute("data-visible") === "true";
  menu.style.display = isVisible ? "block" : "none";
  if (!isVisible) {
    menu.style.transform = `translateY(100%)`; // Reset position when closed
  }
});

// Observe changes to the data-visible attribute
observer.observe(document.querySelector(".theme-menu-container"), {
  attributes: true,
});

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (localStorage.getItem("theme") === "system") {
      updateSystemTheme();
    }
  });

// Initial theme application
var storedTheme = localStorage.getItem("theme") || "system";
applyTheme(storedTheme);
