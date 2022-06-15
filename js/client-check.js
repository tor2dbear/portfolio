var layoutClient = document.getElementById("layout");
const queryString = window.location.search;
const clientsDir = window.location.href.indexOf("tutorial") > -1;

if (
  queryString.includes("?source=client") ||
  window.location.href.indexOf("/clients/") > -1
) {
  layoutClient.classList.add("clientpage");
}
