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

  function isEmailish(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function nonEmpty(value) {
    return value.length > 0;
  }

  function submitContactFlow(data) {
    print("sending…", "terminal-session__out");
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
            ? "message sent — thanks, I'll be in touch."
            : "send failed — try the contact page instead.",
          "terminal-session__out"
        );
      })
      .catch(function () {
        print("send failed — you may be offline.", "terminal-session__out");
      })
      .then(scrollToEnd);
  }

  function submitSubscribeFlow(data) {
    var form = document.querySelector("form[data-mc-form]");
    if (!form) {
      print(
        "subscribe: the newsletter isn't available here.",
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
    print("subscribing…", "terminal-session__out");
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
            "couldn't subscribe — the server rejected it.",
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
            "subscribed — check your inbox to confirm.",
            "terminal-session__out"
          );
        } else if (result.error === "already_subscribed") {
          print("you're already subscribed.", "terminal-session__out");
        } else {
          print(
            "couldn't subscribe — try the footer form.",
            "terminal-session__out"
          );
        }
      })
      .catch(function () {
        print(
          "couldn't subscribe — you may be offline.",
          "terminal-session__out"
        );
      })
      .then(scrollToEnd);
  }

  var TERMINAL_FLOWS = {
    contact: {
      intro: "contact — send me a message. type 'cancel' to abort.",
      steps: [
        {
          key: "email",
          label: "email",
          validate: isEmailish,
          error: "that doesn't look like an email — try again",
        },
        {
          key: "name",
          label: "name",
          validate: nonEmpty,
          error: "name can't be empty",
        },
        {
          key: "message",
          label: "message",
          validate: nonEmpty,
          error: "message can't be empty",
        },
      ],
      confirm: "send this? [Y/n]",
      submit: submitContactFlow,
    },
    subscribe: {
      intro:
        "subscribe — the occasional note, no spam. type 'cancel' to abort.",
      steps: [
        {
          key: "email",
          label: "email",
          validate: isEmailish,
          error: "that doesn't look like an email — try again",
        },
      ],
      confirm: "subscribe with this address? [Y/n]",
      submit: submitSubscribeFlow,
    },
  };

  function startTerminalFlow(name) {
    var def = TERMINAL_FLOWS[name];
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

    // Confirmation step: empty / y / yes sends; n / no aborts.
    print(flow.def.confirm + " " + value, "terminal-session__flow");
    var answer = value.toLowerCase();
    if (answer === "" || answer === "y" || answer === "yes") {
      var submit = flow.def.submit;
      var data = flow.data;
      endTerminalFlow();
      submit(data);
    } else if (answer === "n" || answer === "no") {
      print("cancelled", "terminal-session__out");
      endTerminalFlow();
    } else {
      print("please answer y or n", "terminal-session__out");
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
