# Provider Sparring & GearShift

SOVRAIL supports two complementary comparison systems.

## GearShift
Compares capability levels (“gears”) such as Economy, Balanced, and Maximum.

## Provider Sparring
Compares vendor/model combinations for the same task. This matters because providers differ in reasoning behavior, tool ecosystems, context handling, latency, caching behavior, multimodal support, reliability, and price.

## Modes
### On-demand
The user presses **COMPARE THIS TASK**. SOVRAIL runs only approved candidate models/providers selected by policy and budget and returns a side-by-side measured report.

### Autonomous
For recurring task classes, SOVRAIL maintains a provider profile. It automatically schedules a limited re-benchmark only when:
- no trustworthy benchmark exists;
- confidence is below threshold;
- a provider/model materially changes;
- pricing changes materially;
- failure rate or latency spikes;
- observed quality drops; or
- the benchmark exceeds its configured age.

This prevents the optimization system from wasting more money benchmarking than it saves.

## Recommended comparison report
For each candidate show provider, model, gear, actual output, quality score, successful-outcome cost, direct cost, latency, cache/context effects, reliability, tool fit, privacy constraints, and whether each value is measured or estimated.

The recommendation should optimize **successful outcome value**, not lowest token price.
