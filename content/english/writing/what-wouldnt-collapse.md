+++
title = "What Wouldn't Collapse"
date = "2026-07-12"
author = "Torbjörn Hedberg"
draft = true
hidden = false
description = "A graphic designer lets AI agents rebuild his portfolio as a terminal — notes on directing work you never draw"
tags = ["design", "process", "ai"]
topics = []
slug = "writing"
translationKey = "what-wouldnt-collapse"
+++

There is a hidden mode on this site. Push the theme toggle past dark and the portfolio re-renders itself as a terminal: a boot transcript, a prompt, a filesystem. `ls ~` lists the sections. `cd writing` enters this one. `cat` prints the essay you are reading — as markdown source, heading marks and all.

I am a graphic designer. I have spent most of my working life making things look like something. And over five days in July, across a dozen pull requests and something over a hundred commits, this site grew the least visual interface it could possibly have — and I wrote almost none of the code. AI agents wrote it. I directed.

I have circled this territory before in the abstract — the designer as coordinator, the production codebase as the design medium. Abstractions are cheap. This is what the shift looked like at the scale of one feature, on one small site, over one week. I want to write it down while the transcript is still fresh, because some of what happened was not what I expected.

## The filesystem was already there

The honest place to start: the terminal is not a metaphor laid over the site. It is closer to the opposite.

This site is built with Hugo, which means its content genuinely is a tree of text files. A `works/` directory holding eleven project posts. A `writing/` directory holding these essays as `.md` files. `about` as a single document. The visual site — the grid, the type, the images, everything I would normally call my work — is a rendering of that tree. The terminal is simply another rendering, and in one uncomfortable sense a more truthful one: it shows the site as it actually is in the repository, before my visual interpretation gets to it.

So when you `cat` an essay in the terminal, you see the markdown source. The `##` before the headings. The asterisks around the emphasis. The materials show. For someone who has spent a career hiding seams, there is something both wrong and clarifying about publishing the seams as the interface. The terminal did not require inventing a fiction about the site. It required removing one.

## What directing actually consisted of

Here is what I did not do during those five days: draw a single screen. There was no Figma file. There is no mockup of the terminal anywhere.

What I did instead was rule on a model. Early on, a decision document went into the repository — written by an agent, at my instruction — that mapped what the repo actually is against what the terminal was showing, and flagged every place they diverged. One line in it I have come to think about a lot: *"Decisions live here, not in chat."* The sessions were ephemeral. The agents forgot everything between runs. The document was the only place the design could accumulate.

And the divergences it surfaced were, to my surprise, the entire design problem. Is `about` a file or a directory? The visual site never has to answer — it's a page, you click it. The terminal has to answer, because `cd about` and `cat about.md` are different claims about what kind of thing it is. Is `contact` a place you go? No — it turned out to be a verb. It's not in the filesystem at all; it is the `contact` command, an action that starts a dialogue. The newsletter had been three different things in three different places, and the terminal forced it to become one.

None of these are code decisions. They are not visual decisions either. They are decisions about what things *are* — ontology, if the word weren't so heavy for a portfolio site. That was the design work. My taste ended up expressed not in pixels but in rulings, and the rulings are the only part of the terminal I can genuinely say I made.

## What wouldn't collapse

Nearly everything collapsed into text gracefully. The posts became files. The sections became directories. The tags became directories of symlinks, which is what tags have secretly always been. The settings panel became a `set` command with git-config syntax, and I would quietly argue it is a better settings interface than the panel it mirrors.

Two things refused.

The forms refused to be places, so they became verbs — `contact`, `subscribe`, small interactive dialogues at the prompt. That was a negotiation, not a defeat; the terminal has a native form for actions and the forms were happier there.

But the visual tools — a palette generator, a UI component library — would not collapse at all. There is no textual rendering of a colour relationship that is worth having. We tried nothing and I was still sure. In the end the ruling was exclusion: the tools opt out of the terminal entirely, and choosing them from inside it sends you back to the visual site. The terminal's boundary is drawn exactly where text stops being an honest medium — and I find I trust the whole thing more because it admits to having a boundary.

There was a structural version of this lesson too. The command engine was not designed into its own module. It grew, commit by commit, inside a file called `darkmode.js` — an entire world accreting inside the theme toggle, because that is where the door to it happened to be. Only at the end, once the shape was known, was it extracted into files with honest names. I used to think structure like that could be planned in advance. Watching it happen at this speed, I no longer believe the planning would have survived contact with the third commit.

## The fake AI

One more thing happened that week that I am still turning over.

The terminal has an assistant. Type `ai` and something called *clanker* wakes up — a deliberately shabby, rule-based bot, no language model anywhere in it, named after the slur for robots. It pattern-matches your question, points you at a project or an essay, and files a GitHub issue if it fails you.

Which means the situation, stated plainly, is this: I directed real AI agents — fluent, capable, increasingly hard to distinguish from a colleague — to write a fake AI, and to make the fake one clumsy on purpose. At one point I found myself reviewing the comic timing of its jokes; there is a commit in the history that says *"defer the npm-install punchline for comic timing."* That is not a sentence from any design process I was trained in. It is a director's note.

I don't fully know why I wanted clanker to exist. Part of it is just a joke. But part of it, I suspect, is that the terminal needed one inhabitant that was visibly, honestly artificial — a marker of where the theatre is — precisely because everything else in the production had become so seamless that the seams needed to be reintroduced somewhere.

## Is this design?

A dozen pull requests. A hundred-odd commits. A quality gate standing over every one of them. A decision document instead of a canvas. Rulings instead of screens. Code I can read but did not write, implementing decisions I made but cannot point to in any artefact except the behaviour itself.

I genuinely do not know whether the terminal is the least representative thing in this portfolio or the most. The visual site shows what I can make. The terminal shows something narrower and maybe rarer: what is left of a designer when every ability to draw is taken away — a model of what things are, a set of boundaries honestly drawn, and a sense of timing about a punchline.

I am suspicious of that conclusion in proportion to how flattering it is. It may just be a week of elaborate procrastination with a very good crew. But the transcript is in the repository, every ruling and reversal of it, and that is more than I can say for most design processes I have been part of. `cat` it yourself.
