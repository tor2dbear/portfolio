window.onscroll = function() {progressBar()};

function progressBar() {
  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  var scrolledleft = (winScroll / height) * 30 + "%";
  var scrolledright = (winScroll / height) * 70 + "%";
  var corr = (winScroll / height) * 80 + "px";
  document.getElementById("hyphen-left").style.width = "calc(" + scrolledleft + " - " + corr + ")";
  document.getElementById("hyphen-right").style.width = "calc(" + scrolledright + " - " + corr + ")";
}