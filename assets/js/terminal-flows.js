/**
 * Terminal interactive flows (contact / subscribe).
 *
 * The CLI-wizard commands: they collect a few fields one prompt at a time, then
 * POST to the same backends the on-page forms use (contact → the Netlify form
 * endpoint; subscribe → the footer newsletter form's action + hidden fields).
 *
 * Extracted from terminal.js. It owns its own flow state and speaks to the
 * terminal only through the window.Terminal seam (print / setPrompt / scrollToEnd),
 * exactly like terminal-ai.js. It publishes window.TerminalFlows, which the
 * terminal's input handler queries: while a flow isActive() it routes Enter to
 * handleLine() instead of the parser, and ^C / Escape / exit call cancel(). The
 * `flow` action (from the contact/subscribe commands and the ai hand-off) calls
 * start(). Load AFTER terminal.js; with neither seam present the module is inert.
 */

(function () {
  "use strict";

  // The running flow: { def, step, data, confirming }, or null. Owned here; the
  // terminal only sees it through window.TerminalFlows.isActive().
  var activeFlow = null;

  // ----------------------------------------------------------------------
  // I/O via the window.Terminal seam (resolved at call time — terminal.js
  // publishes it during its DOMContentLoaded, after this module's IIFE runs).
  // ----------------------------------------------------------------------
  function print(text, className) {
    if (window.Terminal) {
      window.Terminal.print(text, { className: className });
    }
  }

  function setPrompt(label, hint) {
    if (window.Terminal) {
      window.Terminal.setPrompt(label, hint ? { hint: hint } : undefined);
    }
  }

  function scrollToEnd() {
    if (window.Terminal) {
      window.Terminal.scrollToEnd();
    }
  }

  // Localized flow strings from the shared catalog (footer.html →
  // data-js="terminal-i18n", the same blob terminal.js reads). Read lazily and
  // cached: a flow only starts on user interaction, well after the catalog is
  // in the DOM. Falls back to the English literal passed to ft().
  var _flowsI18n = null;
  function flowsI18n() {
    if (_flowsI18n) {
      return _flowsI18n;
    }
    _flowsI18n = {};
    var el = document.querySelector('[data-js="terminal-i18n"]');
    if (el && el.textContent) {
      try {
        _flowsI18n = (JSON.parse(el.textContent) || {}).flows || {};
      } catch (e) {
        /* malformed catalog — English fallbacks below */
      }
    }
    return _flowsI18n;
  }
  function ft(key, fallback) {
    var v = flowsI18n()[key];
    return typeof v === "string" ? v : fallback;
  }

  function isEmailish(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function nonEmpty(value) {
    return value.length > 0;
  }

  function submitContactFlow(data) {
    print(ft("sending", "sending…"), "terminal-session__out");
    var body = new window.URLSearchParams({
      "form-name": "contact",
      "bot-field": "",
      name: data.name || "",
      email: data.email || "",
      message: data.message || "",
    }).toString();
    window
      .fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body,
      })
      .then(function (response) {
        print(
          response && response.ok
            ? ft("sent", "message sent — thanks, I'll be in touch.")
            : ft("sendFailPage", "send failed — try the contact page instead."),
          "terminal-session__out"
        );
      })
      .catch(function () {
        print(
          ft("sendFailOffline", "send failed — you may be offline."),
          "terminal-session__out"
        );
      })
      .then(scrollToEnd);
  }

  function submitSubscribeFlow(data) {
    var form = document.querySelector("form[data-mc-form]");
    if (!form) {
      print(
        ft("subUnavailable", "subscribe: the newsletter isn't available here."),
        "terminal-session__out"
      );
      scrollToEnd();
      return;
    }
    var emailField = form.querySelector('input[type="email"]');
    var formData = new window.FormData(form);
    if (emailField && emailField.name) {
      formData.set(emailField.name, data.email);
    }
    print(ft("subscribing", "subscribing…"), "terminal-session__out");
    window
      .fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new window.URLSearchParams(formData).toString(),
      })
      .then(function (response) {
        // A non-OK status returns HTML, not JSON — surface it as a server
        // error rather than letting response.json() reject into the generic
        // "offline" catch.
        if (!response || !response.ok) {
          print(
            ft("subReject", "couldn't subscribe — the server rejected it."),
            "terminal-session__out"
          );
          return null;
        }
        return response.json();
      })
      .then(function (result) {
        if (!result) {
          return; // non-OK already reported
        }
        if (result.success) {
          print(
            ft("subConfirm", "subscribed — check your inbox to confirm."),
            "terminal-session__out"
          );
        } else if (result.error === "already_subscribed") {
          print(
            ft("subAlready", "you're already subscribed."),
            "terminal-session__out"
          );
        } else {
          print(
            ft("subFailFooter", "couldn't subscribe — try the footer form."),
            "terminal-session__out"
          );
        }
      })
      .catch(function () {
        print(
          ft("subFailOffline", "couldn't subscribe — you may be offline."),
          "terminal-session__out"
        );
      })
      .then(scrollToEnd);
  }

  // Built on demand (not at module load) so its localized strings read from the
  // catalog, which is in the DOM by the time a flow starts.
  function terminalFlows() {
    var emailStep = {
      key: "email",
      label: ft("labelEmail", "email"),
      validate: isEmailish,
      error: ft("errEmail", "that doesn't look like an email — try again"),
    };
    return {
      contact: {
        intro: ft(
          "contactIntro",
          "contact — send me a message. type 'cancel' to abort."
        ),
        steps: [
          emailStep,
          {
            key: "name",
            label: ft("labelName", "name"),
            validate: nonEmpty,
            error: ft("errName", "name can't be empty"),
          },
          {
            key: "message",
            label: ft("labelMessage", "message"),
            validate: nonEmpty,
            error: ft("errMessage", "message can't be empty"),
          },
        ],
        confirm: ft("confirmSend", "send this? [Y/n]"),
        submit: submitContactFlow,
      },
      subscribe: {
        intro: ft(
          "subscribeIntro",
          "subscribe — the occasional note, no spam. type 'cancel' to abort."
        ),
        steps: [emailStep],
        confirm: ft("confirmSubscribe", "subscribe with this address? [Y/n]"),
        submit: submitSubscribeFlow,
      },
    };
  }

  function startTerminalFlow(name) {
    var def = terminalFlows()[name];
    if (!def) {
      return;
    }
    activeFlow = { def: def, step: 0, data: {}, confirming: false };
    print(def.intro, "terminal-session__out");
    setPrompt(def.steps[0].label + ">");
  }

  function endTerminalFlow() {
    activeFlow = null;
    setPrompt(null);
  }

  function handleTerminalFlowInput(raw) {
    var flow = activeFlow;
    var value = String(raw === null || raw === undefined ? "" : raw).trim();

    if (value.toLowerCase() === "cancel") {
      print("^C", "terminal-session__out");
      endTerminalFlow();
      return;
    }

    if (!flow.confirming) {
      var stepDef = flow.def.steps[flow.step];
      print(stepDef.label + "> " + value, "terminal-session__flow");
      if (stepDef.validate && !stepDef.validate(value)) {
        print(stepDef.error, "terminal-session__out");
        return; // stay on this step
      }
      flow.data[stepDef.key] = value;
      flow.step += 1;
      if (flow.step < flow.def.steps.length) {
        setPrompt(flow.def.steps[flow.step].label + ">");
      } else {
        flow.confirming = true;
        setPrompt(flow.def.confirm);
      }
      return;
    }

    // Confirmation step: empty / y / yes (or Swedish j / ja) sends; n / no / nej
    // aborts — both languages accepted whichever the [Y/n] hint is shown in.
    print(flow.def.confirm + " " + value, "terminal-session__flow");
    var answer = value.toLowerCase();
    if (
      answer === "" ||
      answer === "y" ||
      answer === "yes" ||
      answer === "j" ||
      answer === "ja"
    ) {
      var submit = flow.def.submit;
      var data = flow.data;
      endTerminalFlow();
      submit(data);
    } else if (answer === "n" || answer === "no" || answer === "nej") {
      print(ft("cancelled", "cancelled"), "terminal-session__out");
      endTerminalFlow();
    } else {
      print(ft("answerYn", "please answer y or n"), "terminal-session__out");
    }
  }

  // ==========================================================================
  // Public seam (window.TerminalFlows)
  // The terminal's input handler routes Enter to handleLine while isActive(),
  // and ^C / Escape / exit call cancel(); the `flow` action calls start().
  // ==========================================================================
  window.TerminalFlows = {
    start: startTerminalFlow,
    isActive: function () {
      return !!activeFlow;
    },
    handleLine: handleTerminalFlowInput,
    cancel: endTerminalFlow,
  };
})();
