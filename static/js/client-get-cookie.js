const url = localStorage.getItem("lsClientUrl");
const client = localStorage.getItem("lsClient");
const urlLetter = url + "#letter";
const urlPortfolio = url + "#portfolio";
const urlCv = url + "#cv";
const urlDownload = url + "#download";
const urlContact = url + "#contact";

window.onload = function setClientUrl() {
  document.getElementById("client-breadcrumb-back").innerHTML =
    '<a href="' + url + '">' + client + "</a>";
  document.getElementById("client-letter").href = urlLetter;
  document.getElementById("client-portfolio").href = urlPortfolio;
  document.getElementById("client-cv").href = urlCv;
  document.getElementById("client-download").href = urlDownload;
  document.getElementById("client-contact").href = urlContact;
};
