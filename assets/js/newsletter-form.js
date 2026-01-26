/**
 * Newsletter Form - AJAX Submission
 * Handles Mailchimp form submissions via JSONP to show inline success/error messages
 */

(function () {
  "use strict";

  const MESSAGES = {
    en: {
      success: "Thank you for subscribing!",
      error: "Something went wrong. Please try again.",
      invalidEmail: "Please enter a valid email address.",
      alreadySubscribed: "You're already subscribed!",
    },
    sv: {
      success: "Tack för din prenumeration!",
      error: "Något gick fel. Försök igen.",
      invalidEmail: "Ange en giltig e-postadress.",
      alreadySubscribed: "Du prenumererar redan!",
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
    responses.forEach((el) => {
      el.style.display = "none";
      el.textContent = "";
    });
  }

  function setLoading(form, isLoading) {
    const submitBtn = form.querySelector(
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
        const original = submitBtn.dataset.originalText;
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

  function submitForm(form) {
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput ? emailInput.value.trim() : "";

    if (!email || !email.includes("@")) {
      showResponse(form, getMessage("invalidEmail"), true);
      return;
    }

    hideResponses(form);
    setLoading(form, true);

    const formData = new FormData(form);
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      params.append(key, value);
    }

    // Create JSONP request
    const callbackName = "mc_callback_" + Date.now();
    const action = form.action.replace("&c=?", "&c=" + callbackName);

    window[callbackName] = function (response) {
      setLoading(form, false);

      if (response.result === "success") {
        showResponse(form, getMessage("success"), false);
        form.reset();
      } else {
        let errorMsg = getMessage("error");

        // Parse Mailchimp error messages
        if (response.msg) {
          if (response.msg.includes("already subscribed")) {
            errorMsg = getMessage("alreadySubscribed");
          } else if (response.msg.includes("invalid")) {
            errorMsg = getMessage("invalidEmail");
          } else {
            // Clean up Mailchimp's HTML in error messages
            errorMsg = response.msg.replace(/<[^>]*>/g, "").trim();
          }
        }

        showResponse(form, errorMsg, true);
      }

      // Cleanup
      delete window[callbackName];
      const script = document.getElementById(callbackName);
      if (script) script.remove();
    };

    // Create and append script tag for JSONP
    const script = document.createElement("script");
    script.id = callbackName;
    script.src = action + "&" + params.toString();
    script.onerror = function () {
      setLoading(form, false);
      showResponse(form, getMessage("error"), true);
      delete window[callbackName];
      script.remove();
    };

    document.body.appendChild(script);
  }

  function init() {
    const forms = document.querySelectorAll("form[data-mc-form]");

    forms.forEach((form) => {
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
