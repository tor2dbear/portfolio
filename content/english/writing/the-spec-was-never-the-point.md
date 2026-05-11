+++
title = "The Spec Was Never the Point"
date = "2026-06-18"
author = "Torbjörn Hedberg"
draft = false
hidden = false
description = "On a strange artefact, and what happens when it stops being strange"
tags = ["product", "process", "writing"]
topics = []
slug = "writing"
translationKey = "the-spec-was-never-the-point"
+++

## On a strange artefact, and what happens when it stops being strange

The spec has always been an odd thing.

It is not really the product. It is not really documentation. It is not, in any honest sense, a contract — try holding a developer to its literal text and you will quickly discover that everyone involved was assuming a great deal it did not say. It is not a design, though it sometimes carries one. It is not a plan, though it sometimes pretends to be.

For most of my working life, I have understood the spec to be something else: a starting point for a conversation. The thing you write so that the conversation can begin in the right place, not so that it can be skipped. Its incompleteness was not a flaw. It was the form. A spec that tried to anticipate every question would have taken longer to write than the work would take to do, and would still have been wrong about most of what mattered.

I am writing this from the middle of noticing that this is changing.

## What the spec actually was

It is worth being precise about what specs have done, because the role is shifting underneath us and the shift only makes sense if you can see clearly what is being left behind.

A spec, in the form I have spent most of my career writing, sat at one end of a long human chain. I would describe what we wanted to build. A developer would read it, ask questions, push back on assumptions, surface technical realities I had not anticipated, propose alternatives, and eventually translate the description into code. Somewhere along that chain, much of the actual product thinking happened. Not in the spec, and not in the code, but in the negotiation between them.

The spec, in other words, was not the place where decisions were made. It was the place where decisions were *initiated*. The latitude that human collaboration absorbed — the questions, the corrections, the small moments of "did you really mean this?" — was where most of the real definition happened.

This is why the craft of writing specs has always been a strange one. The best specs I have written were not the most complete. They were the ones that left the right things open in the right way, that gave the developer enough to start without pretending to anticipate what only the work itself would surface. They were good *invitations* to think, not good *instructions* to execute.

## What is changing

Something is shifting in this picture, and I want to describe it carefully because I am still learning to see it clearly.

When the reader of a spec is a human developer, the spec's incompleteness is absorbed by the reader. Gaps get filled by judgement, context, conversation, push-back. When the reader is — increasingly — a model, that absorption stops happening in the same way. The model will fill gaps too, but it will fill them with confidence rather than with questions. What used to surface as "I don't think I understand what you mean here" surfaces, instead, as a confident implementation of something nobody asked for.

The spec is starting to behave less like an invitation and more like an instruction. Not because anyone declared it so, but because the reader on the other side has different properties.

I have been experimenting with this in my own private projects for some time now, and more recently with parts of how my team works — auto-generated tasks, design environments that respond to structured intent. The development team is on its way. None of this is finished. What I notice, even at this early stage, is that the work of writing has changed character. It is less like a memo and more like a score. Every ambiguity I leave behind is a place where something will be filled in by someone — or something — that does not share my context.

This is what I think people are reaching for when they talk about specifications becoming the centre of the development process. The terminology is unsettled, and I am not sure any of the available phrases are the right ones yet. But the underlying observation is real. The spec is moving from one end of a long chain to a much shorter one, and the journey from intent to artefact is going through fewer human hands.

## The two latitudes

This is where I think it gets genuinely interesting, and where I am most uncertain.

In the old chain, two kinds of latitude lived in the gap between spec and code. The first was *latitude of execution* — how the developer chose to implement what was described. The second, and more important, was *latitude of intent* — what the description actually meant, what trade-offs were acceptable, what the right thing to do was when the description and reality disagreed.

The first kind of latitude, execution, is the one that is most obviously changing. Models are increasingly capable of taking a structured description and producing code that runs. That is the part everyone notices.

The second kind, intent, is the part I find harder to think about. It does not go away. Someone, or something, is going to fill that gap regardless. The question is whether the model fills it with statistical defaults from its training, or whether the structure around it is rich enough to carry the intent the team actually has.

This is a design problem in a sense I am still working out. The structure that surrounds a spec — the categories it sits in, the related decisions it inherits, the prior context it can draw on, the constraints that are explicit and the ones that are merely assumed — becomes part of the spec's effective content. A sparse spec in a rich structure may be more complete, in any meaningful sense, than a dense spec in an empty one.

I notice this most clearly in my own work when I write tasks now. I find myself thinking, almost instinctively, about what context the task is sitting in: which initiative, which capacity stream, which prior conventions. I am writing less, but I am writing into more. The spec is shorter and the surrounding apparatus does more of the work. I think this is the right direction, but I cannot yet tell you why with confidence.

## What is left for the product owner

If much of the execution is being absorbed by tools, and if some of the intent can be carried by structure, what remains?

I think it is a narrower thing than the role currently is, but a more concentrated one. Less time spent on translation — converting an intention into a description that a developer can act on, then mediating between description and result. More time spent on the things that cannot be specified: which problems are worth solving, which user is actually being served, what counts as good in a situation where many things could count as good. The product owner's value migrates from *getting things built* to *getting the right things built, and knowing which things those are*.

This is not a new claim. Marty Cagan and others have been arguing for years that product management is fundamentally about discovery, judgement, and outcome rather than about output and ticket-shepherding. What is new, I think, is that the shift is being forced by the medium rather than argued for by the consultants. When the production of artefacts becomes cheap, the work of deciding which artefacts to produce becomes proportionally more visible. There is nowhere else for the role to hide.

There is also, alongside this, a new craft emerging that does not yet have a settled name. Something like *writing for systems that read*. It draws on technical writing, on editorial work, on a feel for what context an outside reader will need and what they will infer. It is closer, in some ways, to writing a recipe than to writing a memo — a recipe is a kind of writing that has always known its reader is going to act on it directly, and that has developed conventions to suit. I suspect specs are slowly becoming more recipe-like and less memo-like, and that the people who can write that way will find themselves doing more of the consequential work.

## What I do not know

A few caveats, because the ground is moving fast enough that I am writing about a position I expect to revise.

How much of this generalises is unclear to me. My own experiments are partial, and the terrain looks different inside different teams, different products, different stakes. There are domains where the cost of a confidently wrong implementation is trivial, and there are domains where it is catastrophic. The shape of spec-driven work will not be the same in each, and some of what I have written here will fit one and not the other.

Whether the role I am describing will still be called product ownership in five years is also an open question. The current title is a Frankenstein of older roles already; another decade of this might leave it unrecognisable, or it might leave the title intact while the work inside it has quietly become something else.

And the distinction I have spent this essay on — between intent and execution, between the spec and what surrounds it — may turn out to be a useful frame for the moment we are in rather than a durable description of the medium. I would not be surprised to look back at this in three years and find that the line I have just drawn was in the wrong place, or that the more interesting line was somewhere I did not think to look.

What I do know is that the spec, after years of being treated as a means to an end, is becoming a thing in itself worth attending to. It is the surface where intent meets production, and the production side is changing faster than most teams have noticed. The product owner who sees this early — who treats the spec, and the structure around it, as a designed object rather than as paperwork — has, I think, a head start on a role that is in the process of redefining itself.

Whatever it ends up being called.
