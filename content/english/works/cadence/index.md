---
author: "Torbjörn Hedberg"
date: 2026-07-26
linktitle: Cadence
title: Cadence
subtitle: Motion System Designer
slug: works
weight: 1
tags: ["Digital Product", "Experimental"]
clients: []
description: The last unsystematised corner of a design system is motion. Cadence tokenises it — and gives it an opinion.
header_image: cadence-poster.jpg
hero_embed: /cadence-hero.html
featured: true
draft: true
role: "Concept, Design & Engineering"
details:
  year: 2026
  platform: "Web app"
  scope: "Design system, UI, front-end engineering"
client:
  name: "Self initiated project"
  url: "https://cadence.tor2dbear.com"
  about: "A motion-system design tool exploring motion as layered design tokens — primitives and semantic intents — with an opinion layer that critiques the whole system."
---

{{< hero-embed src="/cadence-hero.html#label" ratio="16 / 10" title="Cadence — a motion system, wordlessly: four semantic intents drawn as a fan of easing curves, each labelled with its intent, composition and duration tokens" >}}

Motion is the last unsystematised corner of a design system. Colour has tokens; type has a scale. Motion is still magic numbers — a `cubic-bezier` tuned by feel, pasted from memory, never written down. **Cadence** treats it like the rest of the system, and gives it an opinion.

![Two easings from the set — curves drawn by hand.](cadence-easing-set.jpg "The easing set — each curve drawn by hand, then named. The raw vocabulary the rest of the system refers back to.")

Two layers, borrowed from how we already handle colour. *Primitives* are the raw vocabulary: a duration ladder and a set of easings you draw by hand. *Intents* are the meaning — `enter`, `exit`, `move` — composed from the primitives by reference. You name what motion is *for*, not what it *is*; change a primitive and the whole system re-times.

{{< infographic src="cadence-two-layer-model.svg" caption="Each intent is a named composition of primitives — change a primitive and every intent that references it re-times." >}}

![The enter intent, composed from primitives.](cadence-intent.jpg "The same model in the tool — enter borrows the base duration and the emphasized easing, and resolves to a real curve.")

The decision I'm happiest with was to stop designing around components. An early version pinned four roles to four demo components and fell apart the moment I imagined a fifth. So components became a bench of instruments — each a lens on a single quality of a token, never a screen to restage. Organise a system around its own tokens and nothing can fall outside it.

Most tools generate; they don't judge. The part I'm proudest of is the one with a point of view: it reads the whole set and says where it's off — an easing that's secretly two, an exit slower than its entrance, a ladder that limps — and *what it would change*, not only what's wrong. Encoding that judgement — an art director's eye as a handful of checks — is the whole idea.

None of it stays in the tool. Cadence exports the CSS you'd have written by hand, and drives a real product surface so you can feel the system rather than just read it.

![The system driving real components, re-timing live.](cadence-demo.mp4)

The real test was turning it on myself.

![Cadence reading this very site's motion tokens.](cadence-portfolio-read.jpg "Turned on itself — reading this portfolio's own motion tokens.")

I pasted this site's own motion tokens in. It liked the rhythm — and caught me being lazy: two of my easings are, quietly, the same curve. A tool worth shipping should be able to embarrass its maker. This one did.

{{< infographic src="cadence-logomark.svg" max="120" class="infographic--logomark" caption="Even the identity is a motion token — the logomark is a dot easing along a curve." >}}

{{< media-full src="cadence-start.jpg" alt="Cadence's start page — a motion system designer." caption="Cadence itself — the live tool is one link away." >}}

**Live:** [cadence.tor2dbear.com](https://cadence.tor2dbear.com) · **Source:** [github.com/tor2dbear/cadence](https://github.com/tor2dbear/cadence)
