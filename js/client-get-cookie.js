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

setInterval(function () {
  document.getElementById("client-back").innerHTML =
    '<a href="' + cookies.clientUrl + '">Link</a>';
}, 300);
