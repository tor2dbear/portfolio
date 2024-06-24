function onSubmit(token) {
  var form = document.getElementById("contact-form");
  form.submit();
}

document.addEventListener("DOMContentLoaded", function () {
  grecaptcha.ready(function () {
    document
      .querySelector(".g-recaptcha")
      .addEventListener("click", function (event) {
        event.preventDefault();
        grecaptcha
          .execute("6LeDDAAqAAAAAHLkCglixFS15w54eLJyTocW4k7U", {
            action: "submit",
          })
          .then(function (token) {
            document.getElementById("recaptchaToken").value = token;
            var form = document.getElementById("contact-form");

            // Handle form submission via JavaScript
            var xhr = new XMLHttpRequest();
            xhr.open("POST", form.action, true);
            xhr.setRequestHeader(
              "Content-Type",
              "application/x-www-form-urlencoded"
            );

            // Disable the submit button
            var submitButton = document.getElementById("submitButton");
            submitButton.disabled = true;

            xhr.onload = function () {
              var successMessage = document.getElementById("successMessage");
              var errorMessage = document.getElementById("errorMessage");
              if (xhr.status >= 200 && xhr.status < 400) {
                // Successful form submission
                successMessage.style.display = "block";
                errorMessage.style.display = "none";
              } else {
                // Handle error
                errorMessage.style.display = "block";
                successMessage.style.display = "none";
                // Re-enable the submit button in case of error
                submitButton.disabled = false;
              }
            };

            xhr.onerror = function () {
              var errorMessage = document.getElementById("errorMessage");
              errorMessage.style.display = "block";
              var successMessage = document.getElementById("successMessage");
              successMessage.style.display = "none";
              // Re-enable the submit button in case of error
              submitButton.disabled = false;
            };

            xhr.send(new URLSearchParams(new FormData(form)).toString());
          });
      });

    // Prevent form's default submission
    document
      .getElementById("contact-form")
      .addEventListener("submit", function (event) {
        event.preventDefault();
      });
  });
});
