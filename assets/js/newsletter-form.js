/**
 * Newsletter Form - AJAX Submission
 * Proxies to Brevo via a Netlify Function to show inline success/error messages
 */

(function () {
  "use strict";

  var MESSAGES = {
    en: {
      success: "Thank you for subscribing!",
      error: "Something went wrong. Please try again.",
      invalidEmail: "Please enter a valid email address.",
      alreadySubscribed: "You're already subscribed!",
      timeout: "Request timed out. Please try again.",
    },
    sv: {
      success: "Tack för din prenumeration!",
      error: "Något gick fel. Försök igen.",
      invalidEmail: "Ange en giltig e-postadress.",
      alreadySubscribed: "Du prenumererar redan!",
      timeout: "Förfrågan tog för lång tid. Försök igen.",
    },
  };

  function getLang() {
    var lang = document.documentElement.lang || "en";
    return lang.indexOf("sv") === 0 ? "sv" : "en";
  }

  function getMessage(key) {
    var lang = getLang();
    return (MESSAGES[lang] && MESSAGES[lang][key]) || MESSAGES.en[key];
  }

  function showResponse(form, message, isError) {
    var successEl = form.querySelector(".mc-response--success");
    var errorEl = form.querySelector(".mc-response--error");
    if (successEl) {
      successEl.style.display = isError ? "none" : "block";
      if (!isError) successEl.textContent = message;
    }
    if (errorEl) {
      errorEl.style.display = isError ? "block" : "none";
      if (isError) errorEl.textContent = message;
    }
  }

  function hideResponses(form) {
    var responses = form.querySelectorAll(".mc-response");
    for (var i = 0; i < responses.length; i++) {
      responses[i].style.display = "none";
      responses[i].textContent = "";
    }
  }

  function setLoading(form, isLoading) {
    var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    if (isLoading) {
      submitBtn.setAttribute("data-original-text", submitBtn.value || submitBtn.textContent);
      if (submitBtn.tagName === "INPUT") {
        submitBtn.value = "...";
      } else {
        submitBtn.textContent = "...";
      }
    } else {
      var original = submitBtn.getAttribute("data-original-text");
      if (original) {
        if (submitBtn.tagName === "INPUT") {
          submitBtn.value = original;
        } else {
          submitBtn.textContent = original;
        }
      }
    }
  }

  function submitForm(form) {
    var emailInput = form.querySelector('input[type="email"]');
    var email = emailInput ? emailInput.value.trim() : "";

    if (!email || email.indexOf("@") === -1) {
      showResponse(form, getMessage("invalidEmail"), true);
      return;
    }

    hideResponses(form);
    setLoading(form, true);

    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timeoutId = controller ? setTimeout(function () { controller.abort(); }, 10000) : null;

    fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData(form)).toString(),
      signal: controller ? controller.signal : undefined,
    })
      .then(function (response) {
        clearTimeout(timeoutId);
        setLoading(form, false);
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          showResponse(form, getMessage("success"), false);
          form.reset();
        } else if (data.error === "already_subscribed") {
          showResponse(form, getMessage("alreadySubscribed"), true);
        } else if (data.error === "invalid_email") {
          showResponse(form, getMessage("invalidEmail"), true);
        } else {
          showResponse(form, getMessage("error"), true);
        }
      })
      .catch(function (err) {
        clearTimeout(timeoutId);
        setLoading(form, false);
        if (err && err.name === "AbortError") {
          showResponse(form, getMessage("timeout"), true);
        } else {
          showResponse(form, getMessage("error"), true);
        }
      });
  }

  function init() {
    var forms = document.querySelectorAll("form[data-mc-form]");
    for (var i = 0; i < forms.length; i++) {
      (function (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          submitForm(form);
        });
      })(forms[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
