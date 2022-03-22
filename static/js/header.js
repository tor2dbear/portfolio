// Create a condition that targets viewports at least 768px wide
const mediaQuery = window.matchMedia('(max-width: 768px)')

function handleTabletChange(e) {
    // Check if the media query is true
    if (e.matches) {
        // When the user scrolls down, hide the navbar. When the user scrolls up, show the navbar
        var prevScrollpos = window.pageYOffset;
        window.onscroll = function () {
            var currentScrollPos = window.pageYOffset;
            if (prevScrollpos > currentScrollPos) {
                document.getElementById("topmenu").style.top = "0";
            } else {
                document.getElementById("topmenu").style.top = "-77px";
            }
            prevScrollpos = currentScrollPos;
        }
    } else {
        // do nothing
    }
}

// Register event listener
mediaQuery.addListener(handleTabletChange)

// Initial check
handleTabletChange(mediaQuery)