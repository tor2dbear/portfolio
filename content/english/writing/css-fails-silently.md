+++
title = "CSS fails silently"
date = "2026-05-16"
author = "Torbjörn Hedberg"
draft = false
hidden = false
description = "On testing a language that never tells you when something is wrong"
tags = ["css", "testing", "design-system"]
topics = []
slug = "writing"
translationKey = "css-fails-silently"
+++

CSS doesn't throw errors.

Write a JavaScript function that calls a method that doesn't exist, and the console tells you immediately. Reference a CSS custom property that hasn't been defined, and nothing happens. The property just doesn't apply. The element renders with whatever value it inherited or defaulted to, and the page looks almost right, or slightly off, or exactly right in the one viewport and one theme you happened to check.

This is the core of why CSS testing is difficult, and it's not the reason most people give.

## What people usually mean when they say CSS is hard to test

The common answer is that CSS produces a visual output that requires a browser to evaluate. You can't assert that a component "looks right" without pixels, and pixels require rendering. Visual regression testing exists for this — tools that screenshot your UI and compare it frame by frame against a baseline — but it doesn't test whether something looks right. It tests whether it looks the same as last time. For a design that's actively evolving, that's a meaningful distinction.

That problem is real. But it's also kind of tractable. The noisier problem is elsewhere.

## The thing testing frameworks don't understand

CSS is relational and declarative. The value of a property is meaningful only in context — what other tokens resolve to, what mode the document is in, what the design intent behind the naming convention was. Most testing tools don't hold that knowledge. They see text, not a system.

A mixin or token bundle makes this sharper: the same block of CSS produces different results in different contexts, which means correctness can't be established at the definition — only at every point of use.

A JavaScript test can assert that a function returns a specific value. A CSS "test" has to first figure out what value anything even has, which requires understanding a cascade across potentially dozens of files with conditional selectors. Then it has to decide what "correct" means for that value, which requires understanding what the design system promised.

Those are two genuinely different problems, and most tools only address the second — usually by screenshotting.

## What can be tested without a browser

A few things can be verified statically, without rendering:

Token chain integrity. A design system built on CSS custom properties makes a chain of promises — this semantic token refers to this color scale step, which is defined in this mode file. That chain can be parsed and verified. If `--text-default` resolves through `--gray-12`, and `--gray-12` is defined in the light mode file, the chain is intact. If it resolves to nothing, there's a bug — even if nothing visibly broke.

Contrast ratios. Once you can resolve the chain for a specific combination of mode and palette, you can compute a contrast ratio. WCAG thresholds are numbers. This is checkable without a browser.

Naming conventions and expected structure. Whether the tokens that are supposed to exist actually exist. Whether scales have the steps they should have.

I added these checks to this portfolio. The token validation found bugs on the first run — a typo (`--space-8` instead of `--spacing-8`), and two references to a spacing value that doesn't exist in the scale, quietly falling back to nothing. But the contrast tests found something more interesting: the 2014 Pantone Color of the Year, Radiant Orchid, had a contrast ratio of 3.88:1 between text and background in light mode — below WCAG AA's 4.5:1 threshold. The color looked fine. Nothing was visibly broken. The palette had been in the codebase for a year. The test caught it because it checked all 27 Color of the Year palettes across both light and dark mode — 54 combinations in total.

## The gap that remains

What these static tests can cover is the structure of the design system — whether it's internally consistent, whether the contracts it makes are honored in the code. What they can't cover is whether those contracts produce the right experience for a person using the site.

That gap is probably irreducible without a browser. But it's also smaller than it looks, because most CSS bugs aren't "the layout is subtly wrong in a way only a human could notice." They're "this token resolves to nothing" or "this contrast is 3.88:1 in light mode with this palette." Those are checkable.

## How it should work

The ideal version of CSS testing would understand design intent. It would know that `--text-default` placed against `--surface-page` is a promise about readability, not just two strings. It would know that a design system with 27 color palettes across two modes creates 54 combinations that all need to honor that promise, and verify them automatically when either token changes.

Some of that is buildable today — not with off-the-shelf tooling, but with tests that know what the system is supposed to mean. The interesting work is in the gap between "screenshot everything" and "trust the CSS."

CSS still won't throw errors. But it can fail a test. That turns out to be enough to find the things that matter.
