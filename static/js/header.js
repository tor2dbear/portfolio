// Create a condition that targets viewports max 768px wide
const mediaQuery = window.matchMedia('(max-width: 47.9375em)')

function handleTabletChange(e) {
    // Check if the media query is true
    if (e.matches) {
        // When the user scrolls down, hide the navbar. When the user scrolls up, show the navbar
        var prevScrollpos = window.pageYOffset;
        window.onscroll = function () {
            var currentScrollPos = window.pageYOffset;
            if (prevScrollpos > currentScrollPos) {
                document.getElementById("topmenu").style.transform = "translateY(0)";
            } else {
                document.getElementById("topmenu").style.transform = "translateY(-4.5rem)";
            }
            prevScrollpos = currentScrollPos;
        }
    } else {
        // Show navbar when window is larger than 48em
        console.log('The window is now over 48em');
    }
}

// Register event listener
mediaQuery.addEventListener('change', handleTabletChange)

// Initial check
handleTabletChange(mediaQuery)