/**
 * Newsletter Form - AJAX Submission
 * Handles Mailchimp form submissions via JSONP to show inline success/error messages
 */

(function () {
  "use strict";

  const TIMEOUT_MS = 10000; // 10 second timeout

  const MESSAGES = {
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
    const lang = document.documentElement.lang || "en";
    return lang.startsWith("sv") ? "sv" : "en";
  }

  function getMessage(key) {
    const lang = getLang();
    return MESSAGES[lang][key] || MESSAGES.en[key];
  }

  function showResponse(form, message, isError) {
    const successEl =
      form.querySelector(".mc-response--success") ||
      form.querySelector("#mce-success-response");
    const errorEl =
      form.querySelector(".mc-response--error") ||
      form.querySelector("#mce-error-response");

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
    const responses = form.querySelectorAll(".mc-response, .response");
    responses.forEach(function (el) {
      el.style.display = "none";
      el.textContent = "";
    });
  }

  function setLoading(form, isLoading) {
    var submitBtn = form.querySelector(
      'button[type="submit"], input[type="submit"]'
    );
    if (submitBtn) {
      submitBtn.disabled = isLoading;
      if (isLoading) {
        submitBtn.dataset.originalText =
          submitBtn.value || submitBtn.textContent;
        if (submitBtn.tagName === "INPUT") {
          submitBtn.value = "...";
        } else {
          submitBtn.textContent = "...";
        }
      } else {
        var original = submitBtn.dataset.originalText;
        if (original) {
          if (submitBtn.tagName === "INPUT") {
            submitBtn.value = original;
          } else {
            submitBtn.textContent = original;
          }
        }
      }
    }
  }

  function buildJsonpUrl(baseUrl, callbackName, params) {
    // Remove any existing callback parameter and trailing ?
    var url = baseUrl
      .replace(/&c=\?$/, "")
      .replace(/\?c=\?$/, "")
      .replace(/&c=[^&]*/, "")
      .replace(/\?c=[^&]*&/, "?")
      .replace(/\?c=[^&]*$/, "");

    // Ensure we have the post-json endpoint
    url = url.replace("/subscribe/post?", "/subscribe/post-json?");

    // Add callback parameter
    var separator = url.indexOf("?") === -1 ? "?" : "&";
    url += separator + "c=" + callbackName;

    // Add form parameters
    if (params) {
      url += "&" + params;
    }

    return url;
  }

  function cleanup(callbackName, script, timeoutId) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (window[callbackName]) {
      delete window[callbackName];
    }
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
  }

  function submitForm(form) {
    var emailInput = form.querySelector('input[type="email"]');
    var email = emailInput ? emailInput.value.trim() : "";

    if (!email || !email.includes("@")) {
      showResponse(form, getMessage("invalidEmail"), true);
      return;
    }

    hideResponses(form);
    setLoading(form, true);

    var formData = new FormData(form);
    var params = new URLSearchParams();

    formData.forEach(function (value, key) {
      params.append(key, value);
    });

    // Create unique callback name
    var callbackName = "mc_callback_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

    // Build the JSONP URL
    var url = buildJsonpUrl(form.action, callbackName, params.toString());

    var script = document.createElement("script");
    script.id = callbackName;
    var timeoutId = null;
    var completed = false;

    // Set up the callback
    window[callbackName] = function (response) {
      if (completed) return;
      completed = true;

      setLoading(form, false);

      if (response && response.result === "success") {
        showResponse(form, getMessage("success"), false);
        form.reset();
      } else {
        var errorMsg = getMessage("error");

        // Parse Mailchimp error messages
        if (response && response.msg) {
          if (response.msg.includes("already subscribed")) {
            errorMsg = getMessage("alreadySubscribed");
          } else if (response.msg.includes("invalid") || response.msg.includes("valid email")) {
            errorMsg = getMessage("invalidEmail");
          } else {
            // Clean up Mailchimp's HTML in error messages
            errorMsg = response.msg.replace(/<[^>]*>/g, "").trim();
          }
        }

        showResponse(form, errorMsg, true);
      }

      cleanup(callbackName, script, timeoutId);
    };

    // Set up timeout
    timeoutId = setTimeout(function () {
      if (completed) return;
      completed = true;

      setLoading(form, false);
      showResponse(form, getMessage("timeout"), true);
      cleanup(callbackName, script, null);
    }, TIMEOUT_MS);

    // Set up error handler
    script.onerror = function () {
      if (completed) return;
      completed = true;

      setLoading(form, false);
      showResponse(form, getMessage("error"), true);
      cleanup(callbackName, script, timeoutId);
    };

    // Start the request
    script.src = url;
    document.body.appendChild(script);
  }

  function init() {
    var forms = document.querySelectorAll("form[data-mc-form]");

    forms.forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        submitForm(form);
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
