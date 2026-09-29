---
title: "Building This Portfolio: A Log of Everything That Broke"
date: "2026-09-29"
slug: "building-this-portfolio-everything-that-broke"
excerpt: "I built this site by directing an AI coding agent instead of writing every line myself. Here's what actually happened — the bugs that made no sense at first, the wrong turns, and what debugging them taught me."
---

This portfolio is a Vite + React app, styled with Tailwind, deployed on
Vercel. Under the hood it also runs a small serverless backend, a 3D
scene built with Three.js, a voice assistant and chat panel powered by
language-model APIs, and a canvas-based PDF viewer for study material —
more moving parts than a personal site usually needs, which is exactly
why it broke in interesting ways.

I started with the basics — a hero section, an About page, a way for
people to message me directly — and built outward from there, one
feature at a time: a terminal easter egg, voice navigation, a
zero-gravity 3D scene, a GitHub activity feed, a blog, and a resources
section for study material. Each piece got tested and shipped before the
next one started. Most of what I actually learned came from the parts
that broke along the way.

## The bug that made no sense

Early on, the local dev server started throwing an error that made no
sense: it was trying to parse `index.html` as JavaScript. The file
hadn't changed. The code that used it hadn't changed. But somehow the
page's own HTML was ending up inside a JS parser.

The actual cause: a routing rule I'd added for the blog was too broad.
It was written to redirect any unmatched URL to the homepage — but it
was also catching the dev server's own internal requests for its
live-reload scripts, and handing back HTML instead of JavaScript. The
fix wasn't a workaround, it was making the rule specific: only redirect
the routes that were actually mine, and leave everything else alone.

The lesson stuck more than the fix did — when a local tool says
something impossible is happening, it's often telling the truth about
something upstream of what you're looking at, not lying to you.

## When the AI ran out of AI

The site has a voice assistant and a chat panel, both backed by
Google's Gemini API. For days, testing it felt completely normal —
until one evening every request started failing with a quota error. The
free tier allowed 20 requests a day, and testing alone had burned
through it.

The short-term fix was straightforward: switch providers, to a router
that rotates across several free models instead of one. The more useful
realization was that "free tier" is a real constraint, not a formality
— testing an AI feature at any real pace means designing for its limits
from day one, not discovering them by accident mid-project.

## Three rounds to fix a swipe

The projects section is a 3D carousel — cards receding into blur on
either side of whatever's in focus. Getting the visuals right took an
afternoon. Getting touch input right took three separate rewrites.

First pass: scrolling down the page froze the moment a finger touched a
card. Second pass fixed that but broke tapping — cards stopped
responding to a simple tap. Third pass fixed tapping but introduced
overlapping cards on some screen sizes. Each fix added more logic
trying to manually guess whether a touch gesture was a vertical scroll,
a horizontal swipe, or a tap.

The actual fix was deleting nearly all of that logic. There's a single
CSS property, `touch-action`, that tells the browser directly which
gestures belong to it and which belong to your code — once that was set
correctly, the browser handled scrolling on its own, and the JavaScript
only had to handle the swipe. Three rounds of patching a symptom,
solved by one property that removed the need to guess at all.

## A PDF that wasn't really mine

The blog has a resources section with study material — PDFs viewers can
look at but not casually save. The first version rendered PDFs in an
iframe, which is the obvious way to show a PDF in a browser. Right-click
still showed a "Save As" option anyway, no matter what code I added to
block it.

The reason: an iframe-rendered PDF is drawn by the browser's own
built-in PDF viewer, running outside the page's own document — code on
the page literally cannot reach inside it. The fix was rendering the PDF
onto a `<canvas>` element directly, using a library that draws PDF
pages as pixels rather than handing the file to the browser's plugin. A
canvas is genuinely part of the page, so blocking a right-click on it
actually works.

## Why I'm writing this down

None of these were exotic bugs. Each one had a boring, specific cause
once actually investigated — a routing rule too broad, a quota nobody
checked, gesture logic trying to do a browser's job, a rendering layer
that wasn't actually under the page's control. What made them worth
writing about is that every one of them looked like a different problem
until the real cause showed up.

That's most of what building this site actually was: fewer big
decisions, a lot more finding out where an assumption was quietly
wrong. Which, mismatched as it sounds with a philosophy about curiosity
and systems, is probably the most honest thing I could put in this
site's first post.
