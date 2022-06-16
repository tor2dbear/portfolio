const clientUrl = window.location.href;
var cookie = "clientUrl=" + clientUrl + "; path=/";
document.cookie = cookie;
let cookies = document.cookie;
