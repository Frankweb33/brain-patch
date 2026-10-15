# Contributing

Run `npm test` and `npm run demo` before submitting a change. There are no runtime dependencies.

For a new review rule, include the wording that triggers it, the question it asks, a positive test, and an example of where it could be wrong. Do not label a heuristic result as a diagnosis, a probability of profit or a verified fact.

Model providers, wallet connections and trade execution are not implemented. Discuss the data flow and permissions before adding integrations. Never commit keys, journals or private trading records.
