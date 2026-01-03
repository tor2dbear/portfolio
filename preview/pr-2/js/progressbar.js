window.onscroll = function () {
  progressBar();
};

let first = document.querySelector(".brand-first");
let widthFirst = first.offsetWidth;
let second = document.querySelector(".brand-second");
let widthSecond = second.offsetWidth;
let third = document.querySelector(".brand-third");
let widthThird = third.offsetWidth;
let fourth = document.querySelector(".brand-fourth");
let widthFourth = fourth.offsetWidth;
let fifth = document.querySelector(".brand-fifth");
let widthFifth = fifth.offsetWidth;
let brandBase =
  widthFirst + widthSecond + widthThird + widthFourth + widthFifth;
let brandWidth = brandBase + 5 + "px";

function progressBar() {
  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  var height =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;
  var scrolledleft = (winScroll / height) * 30 + "%";
  var scrolledright = (winScroll / height) * 70 + "%";
  var corr = (winScroll / height) * 5.4 + "rem";
  var scrolledBrand = (winScroll / height) * 100 + "%";
  var corrBrand = 1 - winScroll / height;
  document.getElementById("hyphen-left").style.width =
    "calc(" + scrolledleft + " - " + corr + ")";
  document.getElementById("hyphen-right").style.width =
    "calc(" + scrolledright + " - " + corr + ")";
  document.getElementById("brand-link").style.width =
    "calc(" + brandWidth + " * " + corrBrand + " + " + scrolledBrand + ")";
}
