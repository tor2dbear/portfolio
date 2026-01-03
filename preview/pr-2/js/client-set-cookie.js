const clientUrl = window.location.href.match(/(^[^#]*)/)[0];
const clientName = document.getElementsByClassName("company_name")[0].innerHTML;

localStorage.setItem("lsClientUrl", clientUrl);
localStorage.setItem("lsClient", clientName);
