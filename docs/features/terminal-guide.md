# Terminal — how to use it

> A personal reference for the terminal layout. Turning on terminal mode is a
> deliberate act, so this leans all-in on terminal behaviour: the site _is_ a
> little filesystem you drive with `ls`, `cd`, `cat`. Type `help` in the prompt
> for the short version; this is the long one.

## The mental model

- **The site is a filesystem.** Sections are directories, documents are files.
  - `works/`, `writing/` — directories of project/article files.
  - a project or article — a `slug.md` **file** you `cat`.
  - `about.md` — a single file (intro + CV in one).
- **It's append-only, like a real shell.** `cd`, `ls`, `cat` never rewrite what's
  above — they move the prompt or print _below_ it. Your scrollback is history:
  each old prompt keeps the directory it ran in; only the bottom prompt tracks
  where you are now.
- **What you see is typeable.** Every `~$ cat '…'` / `~$ ls …` the page prints is
  a real command you can type to reproduce it.

## Turning it on / off

- **On:** Settings → Layout → Terminal (or type `layout terminal` from any other
  layout).
- **Off:** `exit`, press `Esc`, click `[exit]`, or `layout column|editorial|index`.

## Getting around

| Command                | Does                                                  |
| ---------------------- | ----------------------------------------------------- |
| `ls`                   | list the current directory                            |
| `ls ~`                 | list the top level (nav)                              |
| `ls settings/`         | list the settings toggles                             |
| `ls works/ --featured` | the featured selection                                |
| `cd works`             | move into a section (prompt only — append-only)       |
| `cd ~` / `cd ..`       | home / up                                             |
| `cat utblick-no.2.md`  | print a project/article into the buffer               |
| `cat about.md`         | print the about page                                  |
| `cv`                   | just the résumé section of about                      |
| `open <name>`          | load the _real_ page (escape hatch out of the buffer) |
| `tree`                 | the whole site map                                    |
| `pwd`                  | where am I                                            |

On a project page, extra lenses: `ls --info` (role/details/client), `ls
--related` (siblings), `ls --images` (count). Click an `[image N]` token to open
the picture in the lightbox (it echoes `open <file>`).

## Reading & reaching things

- `cat <post>.md` works even for a file you only saw via `ls` in a section you
  `cd`'d into — it fetches it.
- Quotes work like a real shell: `cat 'a file with spaces.md'` is one argument.
- `cat colophon` — the footer (© / license / status), reproduced.
- `cat 'newsletter.txt'` — the newsletter blurb.

## Settings, mode & effects (all live)

| Command                                       | Does                                           |
| --------------------------------------------- | ---------------------------------------------- |
| `dark` / `light` / `system`                   | colour mode                                    |
| `pantone [on\|off\|YYYY]`                     | colour-of-the-year palette (and pick a year)   |
| `grain` / `blend` / `motion` `on\|off`        | visual effects                                 |
| `grid`                                        | layout grid overlay                            |
| `layout <column\|editorial\|index\|terminal>` | switch layout                                  |
| `lang [sv\|en]`                               | language                                       |
| `env`                                         | dump the current state (mode/palette/layout/…) |
| `reset`                                       | restore defaults                               |

## Actions

- `contact` — the contact form, one field at a time (`cancel`/`Esc` aborts).
- `subscribe` — newsletter signup, same wizard style.
- `hire` / `social` — quick pointers. `copy email` / `copy url` — to clipboard.

## Keys (desktop)

- `↑` / `↓` — history recall
- `Tab` — complete a command or path
- `^L` clear · `^C` cancel line · `^U` clear line

## Keys (mobile)

The accessory bar above the keyboard gives you the keys iOS doesn't: `↑` `↓`
history, `Tab`, `^C`, and a `⌄` to dismiss the keyboard.

## Easter eggs

There are a few hidden ones (a shell has to have them). `neofetch`, `fortune`,
`matrix`, `sudo …`, `cowsay`, the Konami code at the prompt — and `easteregg`
lists the rest. Left out of `help` on purpose.

## Notes / still evolving

- The top-level file/directory model is being tidied so standalone pages
  (`about`, legal pages) read as files rather than directories — see
  `terminal-structure-strategy.md`.
