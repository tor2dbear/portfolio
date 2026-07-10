# Terminal structure — repo vs. presentation, and an alignment strategy

> **Status:** working draft / decision doc. The terminal presents the site as a
> filesystem (`ls`, `cd`, `cat`). This maps what the repo _actually_ is against
> what the terminal _shows_, flags where they diverge, and proposes one model to
> align them. Decisions live here, not in chat. Built on the command engine in
> `assets/js/darkmode.js`.

---

## 1. What the repo actually is (Hugo)

From `content/english/` (Swedish mirrors it):

| Path                                | Hugo kind             | Reality                                         |
| ----------------------------------- | --------------------- | ----------------------------------------------- |
| `works/`                            | section (`_index.md`) | **directory** — 11 project posts (leaf bundles) |
| `writing/`                          | section               | **directory** — 9 article `.md` files           |
| `newsletter/`                       | section               | a list page + a subscribe action                |
| `clients/`, `employers/`            | section               | taxonomy-style groupings for works              |
| `tags/`                             | taxonomy              | **directory** of tag terms                      |
| `about/`                            | page (`index.md`)     | **single page** — one document (intro + CV)     |
| `contact/`                          | page                  | a **form** (an action, not a document)          |
| `license/`, `privacy/`, `thankyou/` | page                  | single utility/legal pages                      |
| `ui-library/`, `palette-generator/` | section / page        | **visual tools** — can't collapse to text       |

So the repo already has a clean three-way split: **directories** (sections,
taxonomies), **documents** (posts, about, legal pages), and **things that aren't
documents** (contact form, the visual tools).

## 2. What the terminal shows today

- `ls ~` → `about/  contact/  works/  writing/`
- `cd works` / `cd writing` → move into the section; `ls` lists posts; `cat
post.md` prints one. ✅ matches the repo.
- Posts render as `slug.md` files. ✅
- `about` renders as **one file** (`cat about.md`), `cv` prints the résumé. ✅
- Footer/tour commands (`cat colophon`, `subscribe`, `cat 'newsletter.txt'`,
  `ls -R ~/`, hero `cat welcome.txt`, `ls works/ --featured`) reproduce. ✅

## 3. Where they diverge

| #      | Repo                                      | Terminal shows                                               | Problem                                                                                                                        |
| ------ | ----------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **D1** | `about` = document                        | `about/` in `ls ~`; `cd about` enters it                     | half-file, half-dir: `cat about.md` works and `ls` inside says "it's a file", yet the listing and `cd` treat it as a directory |
| **D2** | `contact` = form (action)                 | `contact/` in `ls ~`; `cd contact` enters it                 | it's not a place _or_ a file — it's the `contact` command                                                                      |
| **D3** | `works` section lives at `/works/`        | nav "Works" → `/works/tags/`                                 | the nav target is a taxonomy, not the section root (minor, cosmetic)                                                           |
| **D4** | `newsletter` = section                    | scattered: footer `subscribe` + `cat 'newsletter.txt'` blurb | is it a place, a file, or an action? Undeclared                                                                                |
| **D5** | `license`, `privacy` = pages              | only footer links; not in `ls ~`                             | reachable documents that the filesystem never lists                                                                            |
| **D6** | `ui-library`, `palette-generator` = tools | opt out of terminal (`data-terminal-exempt`)                 | ✅ correct — no change                                                                                                         |

The root cause of D1/D2/D4: **the client can't tell a section from a page from a
nav link alone.** It currently guesses with a hardcoded list
(`TERMINAL_SECTION_DIRS = {works, writing, arbeten, texter}` in `darkmode.js`).
Anything not on that list falls through to ad-hoc handling — which is why
`about`/`contact` ended up half-and-half.

## 4. Proposed model — four kinds

Give every reachable thing exactly one kind, derived from Hugo, not guessed:

| Kind       | Repo source                         | Terminal render   | Commands                                | Examples                          |
| ---------- | ----------------------------------- | ----------------- | --------------------------------------- | --------------------------------- |
| **dir**    | section / taxonomy with children    | `name/`           | `cd`, `ls`, `cat child.md`              | `works/`, `writing/`, `tags/`     |
| **file**   | post or standalone content page     | `name.md`         | `cat`, `open`; `cd` → "not a directory" | a post, `about.md`, `license.md`  |
| **action** | interactive page (no readable body) | `name` (no slash) | run it as a command                     | `contact`, `subscribe`            |
| **exempt** | visual tool                         | (not listed)      | `open` to load the real page            | `ui-library`, `palette-generator` |

Consequences:

- `ls ~` → `about.md  license.md  works/  writing/  contact  …` — files, dirs and
  actions visually distinct.
- `cd about` / `cd license` → `not a directory — try: cat about.md`.
- `cat about.md` / `cat license.md` → the document (already works for about).
- `contact` stays the form command; it's no longer a fake directory.
- Legal pages become real, listable files instead of footer-only links.

## 5. The one enabling change

Stop guessing on the client. **Stamp the kind server-side** and let the terminal
read it:

- In `topmenu.html` / the nav data, emit `data-terminal-kind="dir|file|action"`
  on each entry, computed from Hugo (`.Kind`, `.IsSection`, path depth, or an
  explicit front-matter flag like `terminal_kind`).
- In `darkmode.js`, build the dir tree from that attribute instead of
  `TERMINAL_SECTION_DIRS`. `ls`, `cd`, `tree` then classify correctly and the
  hardcoded list goes away.

Everything else (posts as files, `cat`, `cv`, `colophon`, quote parsing, the
prompt-freeze) already fits this model — this change just makes the _top level_
honest and deletes the guesswork.

## 6. Open decisions (need your call)

1. **Contact** — action command only (recommended), or also a readable
   `contact.md`?
2. **Newsletter** — treat as an **action** (`subscribe`, plus the
   `newsletter.txt` blurb), and drop it as a "place"? Or keep a `newsletter/`
   directory listing past issues (if you ever publish any)?
3. **Legal pages** (`license`, `privacy`) — surface as files in `~`, tuck them
   under a `legal/` directory, or leave them footer-only?
4. **`works` nav target** — point it at `/works/` (the section) instead of
   `/works/tags/`, so `cd works` and the nav agree?

## 7. Scope / cost

Small–medium. The server stamp is a few lines in a partial; the client change
swaps a hardcoded lookup for an attribute read and adjusts three render sites
(`ls`, `tree`, `cd`). No content restructuring required (unlike making `about/`
a real directory, which we explicitly rejected — it would degrade the non-terminal
`/about/` page). Fully reversible.
