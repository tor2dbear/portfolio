/**
 * Terminal command engine — static data.
 *
 * The literal tables the engine reads: help text, the Tab-completion command
 * vocabulary, cat-able pseudo-files, fortune cookies, the easter-egg index,
 * the konami sequence and the selectable layouts. Same data-module pattern as
 * terminal-ai-data.js: pure literals, no logic, published as
 * window.TerminalData. Load BEFORE terminal.js, which aliases these at init.
 * (TERMINAL_EFFECTS stays in terminal.js — it carries live function refs.)
 */

(function () {
  "use strict";

  // The Konami code (typed while the prompt is focused) toggles party mode.
  // Keys are compared lowercased, so ArrowUp → "arrowup", B → "b".
  var KONAMI_SEQUENCE = [
    "arrowup",
    "arrowup",
    "arrowdown",
    "arrowdown",
    "arrowleft",
    "arrowright",
    "arrowleft",
    "arrowright",
    "b",
    "a",
  ];

  // The four selectable layouts, for the `layout`/`theme` command.
  var TERMINAL_LAYOUTS = ["column", "editorial", "index", "terminal"];

  // Kept narrow (a ~12-char command column + short descriptions) so every
  // line fits a phone's ~36-char terminal width without wrapping mid-column.
  const TERMINAL_HELP = [
    "commands:",
    "  help      this list",
    "  whoami    who's asking",
    "  date      date & time",
    "  pwd       working dir",
    "  ls        list dir",
    "  cd <page> change page",
    "  cv        résumé (about)",
    "  tree      site map",
    "  lang [sv|en]  language",
    "  echo      print text",
    "  neofetch  session info",
    "  dark|light|system  mode",
    "  pantone   [on|off|play|pause|random|YYYY]",
    "  grain|blend|motion on/off",
    "  grid      layout grid",
    "  set [k v] view/set settings",
    "  share     copy this look",
    "  layout <name>  switch layout",
    "  hire      let's work together",
    "  social    my links",
    "  copy <x>  to clipboard",
    "  ai        chat with clanker",
    "  contact   message me",
    "  subscribe newsletter",
    "  clear     wipe the screen",
    "  exit      leave the terminal",
    "keys: ↑↓ history · Tab complete · ^L/^C/^U",
  ];

  // Command words offered by Tab completion (primary spellings only).
  const TERMINAL_COMMAND_NAMES = [
    "help",
    "whoami",
    "date",
    "pwd",
    "ls",
    "cd",
    "cv",
    "tree",
    "lang",
    "echo",
    "neofetch",
    "dark",
    "light",
    "system",
    "pantone",
    "grain",
    "blend",
    "motion",
    "grid",
    "set",
    "share",
    "layout",
    "theme",
    "hire",
    "social",
    "links",
    "email",
    "resume",
    "cv",
    "copy",
    "cat",
    "open",
    "man",
    "uname",
    "colour",
    "fortune",
    "history",
    "uptime",
    "top",
    "debug",
    "env",
    "reset",
    "ai",
    "report",
    "contact",
    "subscribe",
    "clear",
    "exit",
    "sl",
    "cowsay",
    "logo",
    "ascii",
    "weather",
    "matrix",
    "ping",
    "moo",
    "xyzzy",
    "easteregg",
  ];

  // `cat`-able pseudo-files. A leading dot and a trailing .txt/.md are
  // stripped before lookup, so `cat colophon`, `cat colophon.txt` and
  // `cat .secret` all resolve.
  const TERMINAL_FILES = {
    welcome: [
      "Hi, Torbjörn here — a designer.",
      "For over a decade I've worked across editorial design,",
      "brand and digital product. Based in Gothenburg.",
      "",
      "you're in the terminal — try 'ls', 'cd works', 'help'.",
    ],
    readme: [
      "it's a portfolio. poke around.",
      "type 'help' for the command list.",
    ],
    about: ["designer & developer.", "type 'cd about' for the long version."],
    colophon: [
      "Hugo · vanilla JS · no frameworks.",
      "hand-rolled design tokens.",
      "no trackers, no cookies.",
    ],
    secret: [
      "there are no secrets here.",
      "(the source is right there — view-source:)",
    ],
    config: [
      "# ~/.config — terminal preferences",
      "shell   tor-sh 1.0",
      "prompt  ~$ (edit via the settings panel)",
    ],
  };

  // `fortune` cookies — design & typography aphorisms, printed at random.
  const TERMINAL_FORTUNES = [
    "Less, but better. — Dieter Rams",
    "Good design is as little design as possible. — Dieter Rams",
    "Design is not just what it looks like — design is how it works. — Steve Jobs",
    "The details are not the details. They make the design. — Charles Eames",
    "White space is to be regarded as an active element. — Jan Tschichold",
    "Simplicity is the ultimate sophistication. — Leonardo da Vinci",
    "Perfection is reached when there is nothing left to take away. — Antoine de Saint-Exupéry",
    "Type is a beautiful group of letters, not a group of beautiful letters. — Matthew Carter",
  ];

  // A private index of the hidden commands, surfaced only by `easteregg` —
  // deliberately kept out of `help` so it stays a discovery, not a menu.
  const TERMINAL_EASTER_EGGS = [
    "easter eggs:",
    "  sudo      permission denied",
    "  coffee    HTTP 418",
    "  cat <f>   readme/about/colophon…",
    "  man <cmd> one-line manual",
    "  uname     shell / -a session",
    "  colour    palette swatches",
    "  fortune   design aphorism",
    "  history   command scrollback",
    "  uptime    session age",
    "  top       process list",
    "  vim/nano/emacs  editor jokes",
    "  :q :wq    quit like vim",
    "  rm -rf /  it's all in git",
    "  git <sub> blame/commit/push…",
    "  npm i     fake resolve",
    "  hello     greeting",
    "  konami    party (↑↑↓↓←→←→ba)",
    "  sl        choo choo",
    "  cowsay <x> talking cow",
    "  moo       super cow powers",
    "  xyzzy     nothing happens",
    "  42        the answer",
    "  ping      pong",
    "  weather   fake forecast",
    "  logo      brand curl",
    "  matrix    digital rain",
    "  debug/env theme state",
    "  reset     restore defaults",
  ];

  window.TerminalData = {
    KONAMI_SEQUENCE: KONAMI_SEQUENCE,
    TERMINAL_LAYOUTS: TERMINAL_LAYOUTS,
    TERMINAL_HELP: TERMINAL_HELP,
    TERMINAL_COMMAND_NAMES: TERMINAL_COMMAND_NAMES,
    TERMINAL_FILES: TERMINAL_FILES,
    TERMINAL_FORTUNES: TERMINAL_FORTUNES,
    TERMINAL_EASTER_EGGS: TERMINAL_EASTER_EGGS,
  };
})();
