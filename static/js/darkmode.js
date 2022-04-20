var toggle = document.getElementById("darkmode-toggle");
var delay = document.body;

var storedTheme = localStorage.getItem('theme') || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
if (storedTheme)
    document.documentElement.setAttribute('data-theme', storedTheme)


toggle.onclick = function() {
    var currentTheme = document.documentElement.getAttribute("data-theme");
    var targetTheme = "light";
    delay.classList.add("darkmodeTransition");
    setTimeout(function() {
        delay.classList.remove("darkmodeTransition");
      }, 1000);

    if (currentTheme === "light") {
        targetTheme = "dark";
        
    }
    

    document.documentElement.setAttribute('data-theme', targetTheme)
    localStorage.setItem('theme', targetTheme);
};