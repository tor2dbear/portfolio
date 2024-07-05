document.addEventListener("DOMContentLoaded", function () {
  // Define onSubmit globally
  window.onSubmit = function (token) {
    document.getElementById("recaptchaToken").value = token;
    var form = document.getElementById("contact-form");

    // Handle form submission via JavaScript
    var formData = new FormData(form);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", form.action, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onload = function () {
      var successMessage = document.getElementById("successMessage");
      var errorMessage = document.getElementById("errorMessage");
      if (xhr.status >= 200 && xhr.status < 400) {
        successMessage.style.display = "block";
        errorMessage.style.display = "none";
        form.reset();
      } else {
        errorMessage.style.display = "block";
        successMessage.style.display = "none";
      }
    };

    xhr.onerror = function () {
      var errorMessage = document.getElementById("errorMessage");
      errorMessage.style.display = "block";
      var successMessage = document.getElementById("successMessage");
      successMessage.style.display = "none";
    };

    xhr.send(new URLSearchParams(formData).toString());
  };

  grecaptcha.ready(function () {
    document
      .getElementById("submitButton")
      .addEventListener("click", function (event) {
        event.preventDefault();
        grecaptcha
          .execute("6LeDDAAqAAAAAHLkCglixFS15w54eLJyTocW4k7U", {
            action: "submit",
          })
          .then(function (token) {
            window.onSubmit(token);
          });
      });

    var form = document.getElementById("contact-form");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
    });
  });
});
