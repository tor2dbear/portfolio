window.onscroll = function() {progressBar()};

function progressBar() {
  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  var scrolled = (winScroll / height) * 100 + "%";
  var corr = (winScroll / height) * 160 + "px";
  document.getElementById("myBar").style.width = "calc(" + scrolled + " - " + corr + ")";
}