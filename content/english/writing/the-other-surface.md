+++
title = "The Other Surface"
date = "2025-11-25"
author = "Torbjörn Hedberg"
draft = false
hidden = false
description = "Why product work has two faces, and why we keep designing only one"
tags = ["product", "process", "design"]
topics = []
slug = "writing"
translationKey = "the-other-surface"
+++

Years ago, when I was still spending most of my time laying out magazines, an editor I worked with watched me build a particularly elaborate set of InDesign templates — paragraph styles, table presets, an InCopy setup so the editorial team could write into the layout in parallel — and said, half-joking, that I was going to optimise myself out of a job. He was wrong about the specific. I kept working with him for years. But he was right about something else, something I have only slowly come to understand: that what I was doing was not really about saving time.

I was designing the surface the editorial team faced when they did their work. The magazine was the thing readers eventually held in their hands. But what I was actually shaping that day, with my templates, was something else. Something that faced inward. Something that had its own users, its own affordances, its own failure modes — and that, like any other designed thing, could be done well or done badly.

I have come to think this is one of the least-examined facts about product work. Every product team operates on two surfaces at once. One faces the user. The other faces the team. Most of our craft, our vocabulary, and our self-understanding addresses only the first.

## Two surfaces

The first surface is the one we talk about. It is the product. It is what the user sees, touches, struggles with, abandons or returns to. We bring our entire design tradition to bear on it: research, prototyping, iteration, systems, accessibility, motion, copy. We argue about pixels because the pixels matter, and because we know that the user feels, in some pre-verbal way, the difference between an interface that has been thought about and one that has not.

The second surface is the one we rarely call a surface at all. It is the apparatus by which the team produces the first one. The backlog. The ticket. The sprint. The spec. The retrospective document. The Slack channel where releases get announced. The status field that nobody updates. The criteria, written or unwritten, that decide whether something is ready for development. This second surface has users too — the people on the team, including the product owner — and it shapes their behaviour as surely as a checkout flow shapes a customer's. The difference is that almost nobody treats it as a designed object.

I find this asymmetry strange. If I were to ship a product where required information was hidden three clicks deep, where errors were silent, where users had to remember context the system could remember for them, I would consider that a failure of craft. And yet teams routinely operate inside ticketing systems with exactly those properties, and the response is to ask the team to be more disciplined.

The team is not the problem. The surface is the problem. And the surface is something a product owner can design.

## What the second surface actually is

It might help to be concrete. In the team I work with now, much of my product ownership has migrated, over time, into the structure of how work is described and tracked. We use Notion. The structure has four stages — Initiative, Epics, Backlog Refinement, Sprint Planning — each with explicit entry and exit criteria. A task cannot be set as ready for sprint without an estimate. A customer issue cannot be set as ready without a customer link. A release decision that has not been communicated through Slack is automatically flagged. Filtered views surface omissions without anyone having to look for them.

More recently we have started classifying every task and epic into one of four capacity streams: Maintenance & Stability, Growth, Conversion & Product, Monetisation. It is, on the face of it, just another tag. In practice it does something else. It makes visible, sprint by sprint, how the team's actual time is distributed across strategic categories — not what we said we prioritised, but what we actually did. What used to be a quarterly conversation in abstract terms becomes a routine signal that falls out of the work without extra effort.

None of this is glamorous. It is largely a question of which fields are required, what statuses exist, what filters surface what omissions, and which automations notify whom. It is not the romantic part of product ownership. But it is, I am increasingly convinced, where most of the leverage actually lies.

## The shift from decisions to defaults

There is a common image of the product owner as a decision-maker. Someone who, day after day, weighs trade-offs, sets priorities, picks the next thing. The image is not wrong, but it is incomplete. The most valuable decisions a product owner makes are not the daily ones. They are the meta-decisions about how the daily ones will get made.

When a sprint has an explicit capacity ceiling, no one needs to decide, in the moment, not to take in more. When every ticket requires a customer link, no one needs to be reminded to think about the customer. When capacity streams are part of the taxonomy, no one needs to compute strategic distribution after the fact. The decision has been made once, in the structure, and it falls out a thousand times in practice.

This is what I think is actually happening when one designs the second surface well. One is moving cognitive load from the human to the system. Not out of mistrust of people, but out of a clear-eyed recognition of the conditions people work under: time is short, attention is fragmented, new commitments arrive constantly. The only sane response is to make the right thing easy to produce, and deviations visible by themselves.

The vocabulary for this exists, scattered across other disciplines. Lean talks about it as standardisation in service of improvement. Behavioural economics calls it nudges and defaults. Architecture has Christopher Alexander's pattern language. None of these are quite the same idea, but they are pointing at the same underlying observation: that the structure around a behaviour does much more work than exhortation ever will.

In product ownership the equivalent observation is that the backlog, taken seriously, is not a list. It is an interface. Every field, every required tick, every filtered view is a design decision that shapes what the team thinks about and what the team forgets. The only question is whether that design is conscious or accidental.

## Why this is harder than it looks

I should be honest about the failure mode I keep watching for in myself. The optimising instinct, taken too far, becomes its own distraction. There is always one more field that could be added, one more automation that could be wired up, one more view that could surface one more omission. At some point the second surface starts to demand the attention that should be going to the first. The team meets with the customer less because the team meets with the structure more.

This is not hypothetical. I have done it. I suspect anyone with a temperament for this work has done it. The best counter I have found is to keep asking what the structure is for — not what it could do, but what it is currently in service of. A surface that helps the team see clearly is doing its job. A surface that demands maintenance for its own sake is not.

The other failure mode, more subtle, is to mistake structure for thought. A well-organised backlog can give the impression that the product is well-understood. It is not the same thing. The structure can be excellent and the strategy can still be wrong. The second surface enables good work. It does not produce it.

## Where this is going

For most of the time I have done this kind of work, the team facing the second surface has been a team of people. That is starting to change. The same backlogs, the same specs, the same definitions of done are increasingly being read by language models — first as drafting aids, now as participants in writing the actual code. What used to be a surface designed for human teammates is becoming a surface that has non-human readers as well.

I do not yet know what that does to the craft. My suspicion is that it makes the question of the second surface much sharper, not softer. A field that a human teammate would have intuited around becomes, for an agent, the difference between a correct implementation and a confident hallucination. A spec that was good enough as a starting point for a conversation may not be good enough as a direct instruction. The latitude that human collaboration absorbed is being replaced by something that asks the structure to be more explicit, more complete, more honest about what it actually requires.

That is the next thing I want to think about. For now, what I keep returning to is something simpler: that there are two surfaces in any product team's work, and only one of them is conventionally treated as designed. The other one — the one facing inward — is where a great deal of what determines product quality is actually decided. The product owner who notices this has, I think, found the part of the role with the most leverage and the least competition for attention.

The editor who joked that I was going to optimise myself out of a job had it backwards. What I was doing was not making my work disappear. It was moving it to a surface he had not yet learned to see.
