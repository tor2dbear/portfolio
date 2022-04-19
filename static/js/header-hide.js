  let prevScrollpos = window.scrollY
    const headerhide = document.querySelector("#topmenu")

    const add_class_on_scrol = () => headerhide.classList.add("hide")
    const remove_class_on_scrol = () => headerhide.classList.remove("hide")

    window.addEventListener('scroll', function() { 
      currentScrollPos = window.scrollY;

      if (prevScrollpos > currentScrollPos) { remove_class_on_scrol() }
      else { add_class_on_scrol() }

      prevScrollpos = currentScrollPos;
    })