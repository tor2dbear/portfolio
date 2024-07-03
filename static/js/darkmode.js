document
  .getElementById("theme-menu-toggle")
  .addEventListener("click", function () {
    const menuContainer = document.querySelector(".theme-menu-container");
    const overlay = document.getElementById("overlay");
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

  menuContainer.setAttribute("data-visible", visible);
  overlay.setAttribute("data-visible", visible);
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
}

function updateSystemTheme() {
  var systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  document.documentElement.setAttribute("data-theme", systemTheme);
}

function updateMenuIcon(theme) {
  const icon = document.getElementById("theme-menu-icon");
  if (theme === "light") {
    icon.innerHTML = `
      <path d="M5.25 12a6.75 6.75 0 1 0 13.5 0 6.75 6.75 0 1 0 -13.5 0Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="m12 2.25 0 -1.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="m18.894 5.106 1.061 -1.061" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="m21.75 12 1.5 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="m18.894 18.894 1.061 1.061" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="m12 21.75 0 1.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="m5.106 18.894 -1.061 1.061" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="m2.25 12 -1.5 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="M5.106 5.106 4.045 4.045" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
    `;
  } else if (theme === "dark") {
    icon.innerHTML = `
      <path d="M17.6734 16.4621C10.5886 16.4605 5.5204 9.6128 7.5887 2.8366C0.2201 6.233 -0.7085 16.3326 5.9172 21.0158C11.7807 25.1602 19.9814 22.3565 22.0804 15.4898C20.6995 16.1302 19.1956 16.4619 17.6734 16.4621Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="M11.9957 3.4844H16.8623" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="M14.429 1.0511V5.9177" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="M19.2956 8.351H22.5401" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="M20.9179 6.7288V9.9732" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
    `;
  } else if (theme === "system") {
    icon.innerHTML = `
      <path d="M5.5 12a6.5 6.5 0 1 0 13 0 6.5 6.5 0 1 0 -13 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="M12 2.93 12 1" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="m12 23 0 -1.93" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="M21.07 12 23 12" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="m1 12 1.93 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="m18.414 5.586 1.364 -1.364" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="m4.222 19.778 1.364 -1.364" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="m18.414 18.414 1.364 1.364" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="m4.222 4.222 1.364 1.364" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
      <path d="M12.5 8.5v7a3.5 3.5 0 0 0 0 -7Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
    `;
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
