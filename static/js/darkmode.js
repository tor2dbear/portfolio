document
  .getElementById("theme-menu-toggle")
  .addEventListener("click", function () {
    const menuContainer = document.querySelector(".theme-menu-container");
    const isVisible = menuContainer.getAttribute("data-visible") === "true";
    toggleMenu(!isVisible);
  });

document.getElementById("overlay").addEventListener("click", function () {
  closeMenu();
});

// Variables to store touch start position and animation start time
let touchStartY = 0;
let touchEndY = 0;
let touchStartTime = 0;

const menu = document.getElementById("theme-menu");
const overlay = document.getElementById("overlay");

menu.addEventListener("touchstart", function (event) {
  if (window.matchMedia("(max-width: 767px)").matches) {
    touchStartY = event.changedTouches[0].screenY;
    touchStartTime = Date.now();
    menu.style.transition = "none"; // Disable transition during drag
    overlay.style.transition = "none"; // Disable transition during drag
  }
});

menu.addEventListener("touchmove", function (event) {
  if (window.matchMedia("(max-width: 767px)").matches) {
    touchEndY = event.changedTouches[0].screenY;
    const touchDeltaY = touchEndY - touchStartY;

    if (touchDeltaY > 0) {
      menu.style.transform = `translateY(${touchDeltaY}px)`;

      // Update overlay opacity based on the position of the bottom sheet
      const maxDeltaY =
        window.innerHeight - menu.getBoundingClientRect().height - 0.5 * 16; // 0.5rem from bottom
      const opacity = 1 - touchDeltaY / maxDeltaY;
      overlay.style.opacity = Math.max(opacity, 0); // Ensure opacity doesn't go below 0
    }
  }
});

menu.addEventListener("touchend", function (event) {
  if (window.matchMedia("(max-width: 767px)").matches) {
    const touchDeltaY = touchEndY - touchStartY;
    const touchEndTime = Date.now();
    const touchDuration = (touchEndTime - touchStartTime) / 1000; // Duration in seconds

    menu.style.transition = "transform 0.3s ease-in-out";
    overlay.style.transition = "opacity 0.3s ease-in-out";
    if (touchDeltaY > 50) {
      // Swipe down detected
      closeMenu(touchDuration); // Ensure the transition duration is used
    } else {
      // Return to original position
      menu.style.transform = `translateY(0)`;
      overlay.style.opacity = 1;
    }
  }
});

function toggleMenu(visible, duration = 0.3) {
  const menuContainer = document.querySelector(".theme-menu-container");
  const menu = document.getElementById("theme-menu");
  const overlay = document.getElementById("overlay");

  menuContainer.setAttribute("data-visible", visible);
  overlay.setAttribute("data-visible", visible);
  menu.setAttribute("data-visible", visible);

  if (window.matchMedia("(max-width: 767px)").matches) {
    document.body.setAttribute("data-no-scroll", visible);
  }

  if (visible) {
    menu.style.transform = "translateY(0)";
    menu.style.opacity = "1";
    menu.style.visibility = "visible";
    menu.style.transition = `transform ${duration}s ease-in-out, opacity ${duration}s ease-in-out, visibility ${duration}s ease-in-out`;
    overlay.style.opacity = "1";
    overlay.style.visibility = "visible";
    overlay.style.transition = `opacity ${duration}s ease-in-out, visibility ${duration}s ease-in-out`;
  } else {
    menu.style.transform = "translateY(100%)";
    menu.style.opacity = "0";
    menu.style.visibility = "hidden";
    menu.style.transition = `transform ${duration}s ease-in-out, opacity ${duration}s ease-in-out, visibility ${duration}s ease-in-out`;
    overlay.style.opacity = "0";
    overlay.style.visibility = "hidden";
    overlay.style.transition = `opacity ${duration}s ease-in-out, visibility ${duration}s ease-in-out`;
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

function closeMenu(duration = 0.3) {
  toggleMenu(false, duration);
}

// Update visibility based on data-visible attribute
const observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (
      mutation.type === "attributes" &&
      mutation.attributeName === "data-visible"
    ) {
      const menuContainer = document.querySelector(".theme-menu-container");
      const menu = document.getElementById("theme-menu");
      const overlay = document.getElementById("overlay");
      const isVisible = menuContainer.getAttribute("data-visible") === "true";
      if (!isVisible) {
        menu.style.transform = `translateY(100%)`; // Reset position when closed
        menu.style.opacity = "0";
        menu.style.visibility = "hidden";
        menu.style.transition = `transform 0.3s ease-in-out, opacity 0.3s ease-in-out, visibility 0.3s ease-in-out`;
        overlay.style.opacity = "0";
        overlay.style.visibility = "hidden";
        overlay.style.transition = `opacity 0.3s ease-in-out, visibility 0.3s ease-in-out`;
      }
    }
  });
});

// Observe changes to the data-visible attribute
observer.observe(document.querySelector(".theme-menu-container"), {
  attributes: true,
});

// Close menu when clicking outside of it (desktop only)
document.addEventListener("click", function (event) {
  const menuContainer = document.querySelector(".theme-menu-container");
  const menu = document.getElementById("theme-menu");
  const overlay = document.getElementById("overlay");
  const targetElement = event.target;

  if (
    !menuContainer.contains(targetElement) &&
    !menu.contains(targetElement) &&
    !overlay.contains(targetElement)
  ) {
    closeMenu();
  }
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
