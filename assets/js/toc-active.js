/**
 * Table of Contents active section indicator
 */
(function () {
  function setActiveLink(links, activeId) {
    links.forEach((link) => {
      const isActive = link.getAttribute("data-toc-link") === activeId;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function initTocActive() {
    const toc = document.querySelector(".toc");
    if (!toc) return;

    const links = Array.from(toc.querySelectorAll("[data-toc-link]"));
    if (!links.length) return;

    const sections = Array.from(document.querySelectorAll("[data-toc-section]"));
    const linkIds = new Set(
      links.map((link) => link.getAttribute("data-toc-link"))
    );

    const initialId = window.location.hash.replace("#", "");
    if (initialId && linkIds.has(initialId)) {
      setActiveLink(links, initialId);
    } else {
      const firstId = links[0].getAttribute("data-toc-link");
      if (firstId) setActiveLink(links, firstId);
    }

    if (!("IntersectionObserver" in window) || !sections.length) return;

    let activeId = null;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute("data-toc-section");
          if (!id || id === activeId || !linkIds.has(id)) return;
          activeId = id;
          setActiveLink(links, id);
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -60% 0px",
        threshold: 0.1,
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  document.addEventListener("DOMContentLoaded", initTocActive);
})();
