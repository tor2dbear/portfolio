/**
 * Newsletter Form - AJAX Submission
 * Handles Mailchimp form submissions via JSONP to show inline success/error messages
 */

(function () {
  "use strict";

  var TIMEOUT_MS = 10000; // 10 second timeout
  var DEBUG = false; // Set to true to enable console logging

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

  function log() {
    if (DEBUG && window.console && console.log) {
      console.log.apply(console, ["[Newsletter]"].concat(Array.prototype.slice.call(arguments)));
    }
  }

  function getLang() {
    var lang = document.documentElement.lang || "en";
    return lang.indexOf("sv") === 0 ? "sv" : "en";
  }

  function getMessage(key) {
    var lang = getLang();
    return (MESSAGES[lang] && MESSAGES[lang][key]) || MESSAGES.en[key];
  }

  function showResponse(form, message, isError) {
    var successEl =
      form.querySelector(".mc-response--success") ||
      form.querySelector("#mce-success-response");
    var errorEl =
      form.querySelector(".mc-response--error") ||
      form.querySelector("#mce-error-response");

    log("showResponse:", message, "isError:", isError);

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
    var responses = form.querySelectorAll(".mc-response, .response");
    for (var i = 0; i < responses.length; i++) {
      responses[i].style.display = "none";
      responses[i].textContent = "";
    }
  }

  function setLoading(form, isLoading) {
    var submitBtn = form.querySelector(
      'button[type="submit"], input[type="submit"]'
    );
    if (submitBtn) {
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
  }

  function buildJsonpUrl(baseUrl, callbackName, formParams) {
    log("Building URL from:", baseUrl);

    // Start with base URL, decode any HTML entities
    var url = baseUrl;

    // Ensure we're using the post-json endpoint
    if (url.indexOf("/subscribe/post?") !== -1) {
      url = url.replace("/subscribe/post?", "/subscribe/post-json?");
    } else if (url.indexOf("/subscribe/post-json?") === -1 && url.indexOf("/subscribe/post-json") !== -1) {
      // Already has post-json but no query string
      url = url + "?";
    }

    // Remove any existing c= parameter (the JSONP callback placeholder)
    url = url.replace(/[&?]c=[^&]*/g, "");

    // Clean up any double && or trailing &
    url = url.replace(/&&/g, "&").replace(/\?&/g, "?").replace(/&$/g, "").replace(/\?$/g, "");

    // Add the callback parameter
    var separator = url.indexOf("?") === -1 ? "?" : "&";
    url = url + separator + "c=" + callbackName;

    // Add form parameters
    if (formParams) {
      url = url + "&" + formParams;
    }

    log("Final URL:", url);
    return url;
  }

  function cleanup(callbackName, script, timeoutId) {
    log("Cleanup:", callbackName);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    try {
      if (window[callbackName]) {
        delete window[callbackName];
      }
    } catch (e) {
      window[callbackName] = undefined;
    }
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
  }

  function submitForm(form) {
    var emailInput = form.querySelector('input[type="email"]');
    var email = emailInput ? emailInput.value.trim() : "";

    log("Submitting form, email:", email);

    if (!email || email.indexOf("@") === -1) {
      showResponse(form, getMessage("invalidEmail"), true);
      return;
    }

    hideResponses(form);
    setLoading(form, true);

    // Build form parameters
    var params = [];
    var inputs = form.querySelectorAll("input[name]");
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      var name = input.name;
      var value = input.value;
      // Skip the submit button
      if (input.type === "submit") continue;
      params.push(encodeURIComponent(name) + "=" + encodeURIComponent(value));
    }
    var formParams = params.join("&");
    log("Form params:", formParams);

    // Create unique callback name
    var callbackName = "mc_resp_" + Date.now();

    // Build the JSONP URL
    var url = buildJsonpUrl(form.getAttribute("action"), callbackName, formParams);

    var script = document.createElement("script");
    var timeoutId = null;
    var completed = false;

    // Set up the callback BEFORE adding the script
    window[callbackName] = function (response) {
      log("Callback received:", response);

      if (completed) {
        log("Already completed, ignoring");
        return;
      }
      completed = true;

      setLoading(form, false);

      if (response && response.result === "success") {
        showResponse(form, getMessage("success"), false);
        form.reset();
      } else {
        var errorMsg = getMessage("error");

        // Parse Mailchimp error messages
        if (response && response.msg) {
          log("Error msg from Mailchimp:", response.msg);
          var msg = response.msg.toLowerCase();
          if (msg.indexOf("already subscribed") !== -1) {
            errorMsg = getMessage("alreadySubscribed");
          } else if (msg.indexOf("invalid") !== -1 || msg.indexOf("valid email") !== -1) {
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
      log("Timeout fired");
      if (completed) return;
      completed = true;

      setLoading(form, false);
      showResponse(form, getMessage("timeout"), true);
      cleanup(callbackName, script, null);
    }, TIMEOUT_MS);

    // Set up error handler
    script.onerror = function (e) {
      log("Script error:", e);
      if (completed) return;
      completed = true;

      setLoading(form, false);
      showResponse(form, getMessage("error"), true);
      cleanup(callbackName, script, timeoutId);
    };

    // Start the request
    log("Loading script:", url);
    script.src = url;
    document.body.appendChild(script);
  }

  function init() {
    var forms = document.querySelectorAll("form[data-mc-form]");
    log("Found", forms.length, "newsletter forms");

    for (var i = 0; i < forms.length; i++) {
      (function(form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          submitForm(form);
        });
      })(forms[i]);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
