var prevScrollpos = window.pageYOffset;
    
    window.onscroll = function() {
    var currentScrollPos = window.pageYOffset;
      if (prevScrollpos > currentScrollPos) {
        document.getElementById("topmenu").style.transform = "translateY(0)";
      } else {
        document.getElementById("topmenu").style.transform = "translateY(var(--header-height-neg))";
      }
      prevScrollpos = currentScrollPos;
    }