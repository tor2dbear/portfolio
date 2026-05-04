+++
title = "Three dots in the footer"
date = "2026-05-03"
author = "Torbjörn Hedberg"
draft = false
hidden = false
description = "Why this portfolio has a Pantone Color of the Year player, and what it took to build it properly"
tags = ["design", "color", "portfolio"]
topics = []
translationKey = "three-dots-in-the-footer"
+++

The theme panel on this site has a Pantone option. Most visitors probably won't find it — not because it's hidden, but because it doesn't announce itself. You open the panel, you see it, you either activate it or you don't.

If you do, a small player appears in the footer. Three dots, collapsed. Hover over them and it expands: play, pause, previous, next, shuffle. Press play and the whole site slowly changes color — working through Pantone's Color of the Year archive, all twenty-seven years of it, from Cerulean Blue in 2000 to Cloud Dancer in 2026.

It's built this way deliberately. The feature doesn't impose itself on anyone. It waits for the people who go looking.

## A color a year

Pantone has been naming a Color of the Year since 2000. On the surface it's a marketing exercise — a color company reminding you that color is important, annual press release included. But if you follow the choices over time, a different picture emerges.

Mimosa in 2009 — a warm, optimistic yellow — arrived in January, days after the financial crisis had gutted confidence in essentially everything. Pantone described it as evoking "the warmth and nourishment of the sun." Classic Blue in 2020: a color chosen months before the pandemic, marketed as "instilling calm, confidence, and connection," as though someone had quietly sensed that those were precisely the things people were about to need. In 2016 they named two colors for the first time: Rose Quartz and Serenity, a pairing that edged up to questions about gender and identity that most institutional color choices carefully avoid. And in 2022, they simply invented a color — Very Peri, a blue-violet with red undertones that didn't previously exist in the Pantone system — because, apparently, the year called for something new.

You can argue about whether they're reading the culture or just good at sounding like they are. Either way, twenty-seven years of choices make for an interesting archive.

## You can't just say you care about color

I'm a designer. I care about color. Every designer says that. It's on every portfolio, in every intro, embedded in every case study. It means nothing anymore.

At some point I got tired of trying to write my way into credibility and decided to build my way there instead. This feature isn't here because it's useful. Nobody hires a designer because their portfolio cycles through Pantone history. It's here because it's a specific, slightly odd thing that only someone who actually finds color history interesting for its own sake would spend this much time on.

## How it got here

It didn't start as a COTY feature. The site had a set of palettes — a few different color options a visitor could switch between — and Pantone's current year was one of them. That's a reasonable thing to build. Multiple palettes, COTY as a nice-to-have.

At some point I removed everything except COTY. It felt more honest. A set of generic palettes says "here are some options." Twenty-seven years of a specific color archive says something different. It's a commitment to an idea rather than a flexibility hedge.

## What selecting a year actually does

Choosing a year doesn't swap a single color — it recalculates the entire system. Every surface, text color, border, and image on the page derives from that year's source color. The system determines whether the color should function as the primary action color or as a surface tone, based on its contrast against white. Then it builds a twelve-step scale from it and applies the whole thing across the site. The transition takes about four seconds.

Getting the images right took longer than the rest of it combined.

The first version used a monotone blend — tinting images toward the COTY color. It was technically simple and looked flat immediately. Monotone collapses all the tonal information in an image into one dimension; you lose the sense that light is hitting anything. Duotone was better — mapping shadows to one color and highlights to another gave back some dimensionality. But with COTY colors, the source color itself often needs to live somewhere between the extremes, not just at the shadow or highlight end. That's what pushed it to tritone: three mapped points — dark, source color, light — with the source color anchored in the mid-tones. The images finally looked like they belonged to the palette rather than just being stained by it.

## The part that turned out to be hard

The scales. The plan was to generate a good twelve-step color scale algorithmically from each year's hex value — write the math once, apply it to all twenty-seven years.

The math lives in OKLch, a color space built around perceptual uniformity, where a step in any direction should feel like the same size visually regardless of hue. Warm and cool colors still need different chroma curves — reds desaturate toward darker steps or they look muddy, blues can carry more saturation in mid-tones. There are hue-specific adjustments, anchor-point logic that pins the source color to a specific step in the scale, gamut mapping to keep values inside sRGB.

It still wasn't good enough.

Not close-but-acceptable. Just not good enough. A generated scale for Marsala (2015) or Sand Dollar (2006) would produce results that looked technically correct — hit the right lightness values, stayed in gamut — and felt wrong in ways that were hard to articulate but obvious once you spent time with them. Color is partly a perceptual problem and partly an aesthetic one, and the algorithm could only solve the first half.

So the scales are manual. Twenty-seven years, each with a light mode scale and a dark mode scale, most of them built or significantly reworked by hand, step by step. It took a long time, and it's the part of the project that's hardest to show anyone — there's no clever code to point to, just a lot of values in a TOML file that were arrived at by looking carefully.

## Whether it was worth it

Depends on what "worth it" means.

If the question is whether it earns its place in a portfolio functionally, probably not. If the question is whether it says something that couldn't have been said by writing "I have a passion for color systems" — I think it does.

There's a version of portfolio-building where you describe yourself accurately and hope someone believes it. There's another version where you build the thing that would only exist if the description were true. I think I prefer the second version, even when the thing is a music player for colors.
