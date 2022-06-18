const url = localStorage.getItem("lsClientUrl");
const client = localStorage.getItem("lsClient");

window.onload = function setClientUrl() {
  document.getElementById("client-back").innerHTML =
    '<a href="' + url + '#portfolio">Back to portfolio</a>';
  document.getElementById("client-breadcrumb-back").innerHTML =
    '<a href="' + url + '">' + client + "</a>";
};
