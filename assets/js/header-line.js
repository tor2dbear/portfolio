(function () {
  let scrollpos = window.scrollY;
  const header =
    document.querySelector('[data-js="top-menu"]') ||
    document.querySelector("#topmenu");
  if (!header) {
    return;
  }
  const header_height = header.offsetHeight;

  const add_class_on_scroll = () => header.classList.add("bottom-line");
  const remove_class_on_scroll = () => header.classList.remove("bottom-line");
  const update_header_line = () => {
    scrollpos = window.scrollY;

    if (scrollpos >= header_height) {
      add_class_on_scroll();
    } else {
      remove_class_on_scroll();
    }
  };

  const is_plain_primary_navigation = (event) =>
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey;

  const should_clear_line_for_link = (link) => {
    if (!link) {
      return false;
    }
    if (link.hasAttribute("download")) {
      return false;
    }
    if (link.target && link.target !== "_self") {
      return false;
    }

    const rawHref = link.getAttribute("href");
    if (
      !rawHref ||
      rawHref.startsWith("#") ||
      rawHref.startsWith("mailto:") ||
      rawHref.startsWith("tel:") ||
      rawHref.startsWith("javascript:")
    ) {
      return false;
    }

    try {
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) {
        return false;
      }
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.hash
      ) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  update_header_line();

  window.addEventListener("scroll", update_header_line);
  document.addEventListener(
    "click",
    function (event) {
      if (!header.classList.contains("bottom-line")) {
        return;
      }
      if (!is_plain_primary_navigation(event)) {
        return;
      }
      const link = event.target.closest("a");
      if (!should_clear_line_for_link(link)) {
        return;
      }
      remove_class_on_scroll();
    },
    true
  );
})();
