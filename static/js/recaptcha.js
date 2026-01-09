document.addEventListener("DOMContentLoaded", function () {
  let formSubmitted = false;

  function onSubmit(token) {
    if (formSubmitted) return;
    formSubmitted = true;

    var submitButton =
      document.querySelector('[data-js="contact-submit"]') ||
      document.getElementById("submitButton");
    submitButton.disabled = true; // Disable the submit button to prevent multiple submissions
    var recaptchaToken =
      document.querySelector('[data-js="contact-recaptcha"]') ||
      document.getElementById("recaptchaToken");
    recaptchaToken.value = token;
    var form =
      document.querySelector('[data-js="contact-form"]') ||
      document.getElementById("contact-form");

    // Handle form submission via JavaScript
    var formData = new FormData(form);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", form.action, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onload = function () {
      var successMessage =
        document.querySelector('[data-js="contact-success"]') ||
        document.getElementById("successMessage");
      var errorMessage =
        document.querySelector('[data-js="contact-error"]') ||
        document.getElementById("errorMessage");
      if (xhr.status >= 200 && xhr.status < 400) {
        successMessage.style.display = "block";
        errorMessage.style.display = "none";
        form.reset();
      } else {
        errorMessage.style.display = "block";
        successMessage.style.display = "none";
      }
      submitButton.disabled = false; // Re-enable the submit button after the response
      formSubmitted = false;
    };

    xhr.onerror = function () {
      var errorMessage =
        document.querySelector('[data-js="contact-error"]') ||
        document.getElementById("errorMessage");
      errorMessage.style.display = "block";
      var successMessage =
        document.querySelector('[data-js="contact-success"]') ||
        document.getElementById("successMessage");
      successMessage.style.display = "none";
      submitButton.disabled = false; // Re-enable the submit button after the error
      formSubmitted = false;
    };

    xhr.send(new URLSearchParams(formData).toString());
  }

  // Ensure onSubmit is globally accessible
  window.onSubmit = onSubmit;

  grecaptcha.ready(function () {
    var submitButton =
      document.querySelector('[data-js="contact-submit"]') ||
      document.getElementById("submitButton");
    if (submitButton) {
      submitButton.addEventListener("click", function (event) {
        event.preventDefault();
        grecaptcha
          .execute("6LeDDAAqAAAAAHLkCglixFS15w54eLJyTocW4k7U", {
            action: "submit",
          })
          .then(function (token) {
            window.onSubmit(token);
          });
      });
    }

    // Prevent the form from submitting the default way
    var form =
      document.querySelector('[data-js="contact-form"]') ||
      document.getElementById("contact-form");
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
      });
    }
  });
});
