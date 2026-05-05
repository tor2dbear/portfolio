+++
title = "Failing your own pull requests"
date = "2026-05-04"
author = "Torbjörn Hedberg"
draft = false
hidden = false
description = "On running a quality gate on a personal portfolio — what blocks a merge, what doesn't, and why bother at all"
tags = ["ci", "quality", "portfolio"]
topics = []
slug = "writing"
translationKey = "failing-your-own-pull-requests"
+++

There is a step in the CI pipeline for this portfolio that checks whether the site is fast enough, accessible enough, and well-structured enough to be allowed to merge. If it isn't, the pull request fails.

This is a personal website. There is no team. Nobody is reviewing the code. The only person being blocked by a failed quality gate is me.

It took a while to decide whether this made sense.

## What the system actually checks

Every pull request runs Lighthouse and axe-core against a local build of the site. Lighthouse measures performance, accessibility, best practices, and SEO — scored 0 to 100 per category. axe-core scans for accessibility violations and classifies them by impact: critical, serious, moderate, minor.

The results go into a report that gets posted as a comment on the pull request. Most of what ends up in that report doesn't block anything — it's just visible, sitting in the backlog. But some things do block. The PR doesn't merge until they're fixed.

The line between "block" and "just report" was the interesting design question.

## What actually blocks a merge

Three categories of things will fail the gate:

**Accessibility violations with critical or serious impact.** Not moderate. Not minor. The threshold is calibrated to things that genuinely make content unusable — missing labels, broken keyboard navigation, images with no alt text in meaningful context. Moderate violations appear in the report under a "fix soon" label. Minor ones go to backlog. Neither stops a merge.

The reasoning is simple enough: serious accessibility problems are not polish items. They're errors. A site that's visually finished but broken for a screen reader user isn't actually finished.

**Any Lighthouse category below its floor.** Performance must stay above 65. Accessibility, best practices, and SEO must each stay above 90. These are different thresholds for a reason — performance is volatile and harder to keep high, so the floor is set lower. The other three categories are easier to maintain once they're solid, so the bar is higher.

**Performance regression beyond 5 points from baseline.** This one is subtler, and unique to performance. The reasoning is that performance degrades quietly and incrementally — add a slightly heavier font, forget to lazy-load an image, pull in a slightly larger dependency, and the score creeps down without anyone noticing. The regression threshold catches that drift before it compounds.

Accessibility, best practices, and SEO don't have the same problem. Once they're solid, they tend to stay solid unless something goes actively wrong — and "something going actively wrong" is exactly what the absolute floor catches.

## When the tools themselves fail

There's a fourth blocker: if Lighthouse or axe fails to produce results at all, the pull request is blocked.

This one is about philosophy more than measurement. The system doesn't interpret missing data as "nothing wrong" — it interprets it as "we don't know, so assume worst." A flaky CI run that produces no output is treated the same as a run that found critical failures. The merge requires a successful re-run.

This is more conservative than it needs to be for a personal site. In practice, a silent tool failure probably means a transient CI error, not an actual problem. But the alternative — allowing silently failed checks to pass — creates a gap where the gate exists but doesn't actually enforce anything. The conservative approach is simpler and more honest about what the gate is for.

## What the report does with everything else

The report that appears on every PR is deliberately generous. Beyond the blockers, it surfaces the top Lighthouse opportunities per route — things like serving images in modern formats, reducing JavaScript execution time, improving cache headers. It also lists the axe moderate and minor violations. None of it blocks. All of it is visible.

The idea is that a quality gate doesn't have to choose between "block it" and "ignore it." There's a third option: surface it, let it accumulate in a visible backlog, and deal with it when it matters. The blockers are the things that matter now. The backlog is the things that matter eventually.

## Why enforce this at all

A personal portfolio doesn't need a quality gate in any functional sense. Pushing directly to production works fine. The site will load. Nobody gets fired.

The gate is there for a different reason: a portfolio is an argument about how you work, and it's a weak argument if the site itself doesn't reflect that. Running Lighthouse and axe-core on every pull request and publishing the results in a PR comment is a decision that sits in the code, not in the prose. It's visible to anyone who looks at the repository. It either holds or it doesn't.

There's also a more practical reason. Without a quality gate, "I'll fix the accessibility issues later" is a sentence that gets said and then forgotten. The blocker makes "later" a specific moment rather than an intention.

Whether that's worth the setup time is a reasonable question. It probably isn't, purely on efficiency grounds. But efficiency isn't really what the portfolio is measuring.
