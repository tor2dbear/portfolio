window.onscroll = function () {
  progressBar();
};

const brandParts = Array.from(
  document.querySelectorAll("[data-brand-part=\"true\"]")
);
const hyphenLeft = document.querySelector('[data-js="brand-hyphen-left"]');
const hyphenRight = document.querySelector('[data-js="brand-hyphen-right"]');
const brandLink = document.querySelector('[data-js="brand-link"]');

const brandBase = brandParts.reduce((sum, part) => sum + part.offsetWidth, 0);
const brandWidth = brandBase + 5 + "px";

function progressBar() {
  if (!hyphenLeft || !hyphenRight || !brandLink) {
    return;
  }
  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  var height =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;
  var scrolledleft = (winScroll / height) * 30 + "%";
  var scrolledright = (winScroll / height) * 70 + "%";
  var corr = (winScroll / height) * 5.4 + "rem";
  var scrolledBrand = (winScroll / height) * 100 + "%";
  var corrBrand = 1 - winScroll / height;
  hyphenLeft.style.width =
    "calc(" + scrolledleft + " - " + corr + ")";
  hyphenRight.style.width =
    "calc(" + scrolledright + " - " + corr + ")";
  brandLink.style.width =
    "calc(" + brandWidth + " * " + corrBrand + " + " + scrolledBrand + ")";
}
