---
title: "Learning Order Flow Imbalance: My First Quant Research Project, From Scratch"
date: "2026-09-30"
slug: "learning-order-flow-imbalance-from-scratch"
excerpt: "I'd never touched market microstructure before this. Here's how I built my first quantitative research project — order flow imbalance analysis — one phase at a time, and what actually held up when I tested it."
---

I didn't come into this knowing what a limit order book was. Everything in this post started from zero, learned in three deliberate phases, each one tested before moving to the next.

Phase 0: Just reading the data correctly

Before any modeling, the first job was understanding the vocabulary — bids, asks, spread, mid-price — and getting real limit order book data (LOBSTER-format data) into pandas without breaking anything. This phase produced nothing more exciting than plots of mid-price and spread over time. That was the point. If you can't load and visualize the data correctly, nothing built on top of it means anything.

Phase 1: Does order flow actually say anything?

The core idea behind order flow imbalance (OFI) is simple to state and easy to get wrong in practice: when there's more buying pressure than selling pressure sitting in the order book, does that actually predict where price moves next, even a little?

This phase was about computing OFI two ways — at the event level, and aggregated over rolling time windows — and then directly comparing it against forward price change. Not assuming a relationship exists. Checking for one.

Phase 2: Making sure it wasn't a fluke

This was the phase that mattered most, methodologically. It's easy to fit a regression, get a result that looks meaningful, and call it done. It's much harder to make sure that result isn't just the model memorizing noise in the exact data it was trained on.

The discipline here was a chronological train/test split — not a random shuffle, which would let future information leak backward into training in a time-series context — with an embargo gap between the training and test periods to further guard against that leakage. Then an OLS regression, fit only on the training side, and validated out-of-sample on data the model had never seen.

That's the actual bar for "does this hold up": not how well it fits the data you built it on, but whether it says anything on data it didn't.

What this project actually is

This isn't a trading system, and I'm not going to describe it like one. It's a foundational research project — the first serious rep at the kind of discipline (correct data handling, honest validation, resistance to lookahead bias) that any real quantitative work depends on, regardless of what gets built on top of it later.

The next chapter is Hawkes processes — modeling order flow as a self-exciting point process instead of a single regression — which is where this project is headed next, not where it already is.
