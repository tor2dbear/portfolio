let scrollpos = window.scrollY
  const header = document.querySelector("#topmenu")
  const header_height = header.offsetHeight

  const add_class_on_scroll = () => header.classList.add("bottom-line")
  const remove_class_on_scroll = () => header.classList.remove("bottom-line")

  window.addEventListener('scroll', function() { 
    scrollpos = window.scrollY;

    if (scrollpos >= header_height) { add_class_on_scroll() }
    else { remove_class_on_scroll() }

    console.log(scrollpos)
  })