+++
title = "Designing in the Native Material"
date = "2026-05-08"
author = "Torbjörn Hedberg"
draft = false
hidden = false
description = "Sketch to understand, code to verify"
tags = ["design", "tools", "process"]
topics = []
slug = "writing"
translationKey = "designing-in-the-native-material"
+++

Working draft — May 2026

---

I am writing this from the middle of something I do not yet know how to finish.

For most of my working life I have preferred to design directly in the medium the product is actually made from. In the late nineties that meant adjusting CSS in a browser, resizing windows, tweaking values in real time. Even then it felt obvious to me that the web was already its own design environment. The browser was not a preview of the work. It was the work.

That instinct never went away, but for two decades I worked around it. The industry built an enormous infrastructure around the gap between design and code. Some of it is translation — handoff, specs, prototype fidelity — and some of it, like design systems and token architectures, is something more durable: a way to make decisions that outlive any particular representation. The translation layer is what is collapsing now. The decision layer is not. If anything, it is becoming more important — and that is part of why I have ended up where I have.

This is not an essay about whether that infrastructure was wrong. Other writing of mine has tried to make that argument more carefully. This is an essay about what it feels like to be the person inside the shift.

---

Here is what I keep noticing.

When I open Figma now, I am rarely there to define a product. I am there to think. What I want, more than anything else, is to see a flow as a single shape — entry to exit, not screen by screen. I want to put alternatives next to each other. I want to leave a half-finished idea visible while a decision settles, so that the next thought can land somewhere it can be seen.

The canvas is not, for me, primarily a representation of software. It is a cognitive environment. It is the place where I can hold more in view than I can hold in my head.

This is the part that surprises me. I expected, as I moved more of my work into code, that the canvas would feel less and less necessary. The opposite has happened. The more I work in the production codebase, the more I rely on the canvas for a different kind of thinking — the spatial, comparative, peripheral kind. Code is excellent for almost everything except seeing several things at once.

---

It has taken me a while to find the right word for what the canvas actually is.

It is not a representation. It is a sketch. And a sketch is not the same kind of object as a mockup.

A sketch is a way of asking a question in low resolution. It can happen on a napkin, on a whiteboard, on a Figma canvas, in a margin. The medium hardly matters. What matters is that it lets me hold an idea loosely enough to test it against another idea, to compare two possible shapes for the same problem, to see whether something is worth pursuing before committing the energy to build it.

A mockup is something else. A mockup tries to look like the answer. It dresses an unverified idea in the clothes of a decided one. That is what makes high-fidelity mockups uncomfortable for me now — not that they represent, but that they over-represent. They look settled when nothing has been settled.

So the division I trust is not between canvas and code. It is between sketching and verifying. The canvas is where I sketch. The code is where I find out whether the sketch was right.

That is the medium becoming honest with itself. A sketch in any medium can be a question. Only the running system can be an answer.

---

At work, I am in the middle of moving the production codebase toward being the single source of truth for our design. The component library I have been maintaining in parallel, with its own Storybook and design studio, is being repositioned — from a thing that mirrors production to a place where I can sketch quickly and cheaply against real components. It is being migrated into the production repo. There is a Storybook inventory to do before I can even begin to address the token drift between what design intends and what the developers have built.

None of this is glamorous. It is largely organisational and infrastructural. But it is, on a daily basis, what the abstraction in my other writing actually looks like. The collapse of the translation layer is not a sudden event. It is a long sequence of small, unromantic decisions about where the truth of a design now lives, and where the questions about it can still be asked.

I find that my role is changing inside this work. I am spending less time producing screens and more time making sure the production codebase is a good design medium — for myself, for the developers I work with, and now also for AI agents that increasingly participate in writing the code. That last part is new, and I do not have a settled view on it yet.

---

There is a version of this story where nothing has really changed.

Architects have always moved from sketch to model to drawing to building. Every mature design discipline has a low-resolution form for thinking and a high-resolution form for committing. The medium of the sketch varies — charcoal, foam, CAD — but the gesture is the same. Ask a question loosely. Answer it precisely.

What is different for software is not the gesture. It is the distance. For most of design's history, the chain from sketch to artefact held because the artefact could not easily be unmade. A building cannot be un-built. A printed book cannot be re-set after the run. Representation existed in the intervening space because production was expensive and one-directional.

Software's chain is shorter now, because the artefact and the prototype increasingly share a material. I can ask a question on a napkin and verify the answer in code by the afternoon. The intermediate representations — the high-fidelity mockup, the click-through prototype, the spec — were built for a longer journey than the one we are still making.

The shape of design work in this shorter chain is what I am trying to learn.

---

*What I have come to trust, for now, is smaller and more practical than I expected. Sketch to understand. Code to verify. The medium of the sketch matters less than I once thought; the truthfulness of the verification matters more.*

And then, almost immediately, the next question.

I have started wondering whether the code can become the sketch as well. And, beyond that — whether it could become the canvas. Whether the medium itself has grown quick enough, malleable enough, spatial enough, that I could hold an idea loosely in it, see several at once, find out if I am right, all in the same place.

I do not know yet. The division I have just spent this essay describing — sketch in one place, verify in another — may turn out to be the right one for now and the wrong one in five years. I am suspicious of my own conclusions in proportion to how cleanly they arrived.

What I do know is that this is the most interesting thing in front of me right now. I keep the canvas open. I keep the codebase open. And I am paying close attention to what happens at the edge between them.
