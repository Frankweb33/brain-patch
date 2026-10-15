# Architecture and boundaries

## Current implementation

The browser collects a structured decision. A pure JavaScript function checks only the thesis for eight configured patterns, checks whether evidence and a reconsideration condition exist, and compares a numeric position percentage with a user-provided limit. When a previous receipt is supplied, it compares thesis, horizon and position size and checks whether the evidence text changed. It never fetches sources or infers actual behavior from a wallet.

Output contains the normalized decision, exact phrase cues, review questions, rule checks, changes and an explicit limitation. Counts describe triggered rules, not probabilities or financial risk scores.

Journal snapshots are stored in localStorage, not an immutable ledger. They can be edited or deleted through browser tools. At most 50 are retained. JSON exports are manual backups. No analytics, remote fonts, CDNs, external inference or network requests are used by the app. The source link opens GitHub only when clicked.

## Future model boundary — not implemented

An eventual model adapter should accept a decision and retrieved source excerpts and return schema-validated claims, counterarguments, source references and unresolved questions. API keys must remain on a server, never in browser storage. Source content must be treated as untrusted data rather than instructions. External content cannot change user limits. Separate reviewer roles may share a model; their agreement is not independent evidence.

Proposed roles: source researcher, skeptical reviewer, deterministic rule checker and receipt-memory retriever. Only the deterministic local checks are implemented today. There is no autonomous execution path, exchange integration or wallet access.

## Evaluation

Tests cover configured cues, missing information, user-limit comparisons, revision comparisons, normalization and deterministic examples. These are software tests, not evidence of debiasing or a trading advantage. A future study should preserve false positives and missed opportunities and compare the system with a simple checklist using information available at decision time.
