    (function(){

      var doc = document.documentElement;
      var w   = window;
  
      /*
      define four variables: curScroll, prevScroll, curDirection, prevDirection
      */
  
      var curScroll;
      var prevScroll = w.scrollY || doc.scrollTop;
      var curDirection = 0;
      var prevDirection = 0;
    
      var lastY = 0;
  
      /*
      how it works:
      -------------
      create a scroll event listener
      create function to check scroll position on each scroll event,
      compare curScroll and prevScroll values to find the scroll direction
      scroll up - 1, scroll down - 2, initial - 0
      then set the direction value to curDirection
      compare curDirection and prevDirection
      if it is different, call a function to show or hide the header
      example:
      step 1: user scrolls down: curDirection 2, prevDirection 0 > hide header
      step 2: user scrolls down again: curDirection 2, prevDirection 2 > already hidden, do nothing
      step 3: user scrolls up: curDirection 1, prevDirection 2 > show header
      */
  
      var header = document.getElementById('topmenu');
      var toggled;
      var downThreshold = 300;
      var upThreshold = 200;
  
      var checkScroll = function() {
          curScroll = w.scrollY || doc.scrollTop;
          if(curScroll > prevScroll) {
              // scrolled down
              curDirection = 2;
          }
          else {
              //scrolled up
              curDirection = 1;
          }
  
          if(curDirection !== prevDirection) {
              toggled = toggleHeader();
          } else {
              lastY=curScroll
          }
  
          prevScroll = curScroll;
          if(toggled) {
              prevDirection = curDirection;
          }
      };
  
      var toggleHeader = function() { 
          toggled = true;
          //remove hide when menu active
          if(document.getElementById("layout").classList.contains("active")){
            lastY=curScroll
            header.classList.remove('hide');
          }
          //trigger faster on top
          else if(curDirection === 2 && curScroll < 10) {
              lastY=curScroll
              header.classList.add('relative');
          }
          else if(curDirection === 2 && (curScroll-lastY) > downThreshold) {
            lastY=curScroll
            header.classList.add('hide');
            header.classList.remove('relative');
          }
          else if (curDirection === 1 && (lastY-curScroll) > upThreshold) {
              lastY=curScroll
              header.classList.remove('hide');
              header.classList.remove('relative');
          }
          else {
              toggled = false;
          }
          return toggled;
      };
  
      window.addEventListener('scroll', checkScroll);
  
  })();