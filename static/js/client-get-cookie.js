var cookies = document.cookie
  .split(";")
  .map((cookie) => cookie.split("="))
  .reduce(
    (accumulator, [key, value]) => ({
      ...accumulator,
      [key.trim()]: decodeURIComponent(value),
    }),
    {}
  );

window.onload = function setClientUrl() {
  document.getElementById("client-back").innerHTML =
    '<a href="' + cookies.clientUrl + '">Back to application</a>';
};
