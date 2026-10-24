# How accurate is the model?

All numbers come from `npm run validate`, which writes every row to [`validation/results.json`](../validation/results.json).

## 1. Fit to real races

The database holds 222 real 400 m performances from Olympic and World Championship finals and semi-finals (2017–2025). For each one, the model finds the top speed and anaerobic capacity that make it run the athlete's real splits, in their real lane and conditions.

- Every published split (every 100 m, or every 50 m where available) is reproduced within **0.08 s**. The median worst-split error is 0.02 s.

This shows the model can describe real races. It does not show that it can predict them, so we also tested it on races it had not seen.

## 2. Prediction on unseen races: semi-final → final

We used 50 athletes who ran both a semi-final and the final of the same championship (2019, 2022–2025). The profile was fitted to the semi-final only, then used to predict the final.

**Test A: home-straight fatigue.** The model gets the athlete's real pacing to 300 m in the final, runs all-out from 300 m, and predicts the finish time.
Baseline: the "average finalist fade" rule (last 100 m = 27.8 % of the final time).

| Group | Athletes | Model, mean error | Baseline, mean error |
|---|---:|---:|---:|
| Semi-final run as a full effort | 43 | **0.29 s** | 0.33 s |
| Semi-final eased off (final > 0.5 s faster) | 7 | 1.05 s | 0.33 s |
| All | 50 | 0.40 s | 0.33 s |
| Men | 28 | 0.31 s | 0.35 s |
| Women | 22 | 0.51 s | 0.31 s |

**Test B: best possible time.** The model predicts the final time from the semi-final profile alone, assuming the suggested championship-shaped plan.
Baseline: "same time as the semi-final".

| Group | Athletes | Model, mean error | Baseline, mean error |
|---|---:|---:|---:|
| Semi-final run as a full effort | 43 | 0.26 s | 0.27 s |
| All | 50 | 0.34 s | 0.36 s |

## What this means

- When the input race was a genuine effort, the fatigue model beats the simple fade rule. On best-possible time it matches simply using the semi-final time, with no clear extra skill.
- **A profile is only as good as the race it comes from.** Athletes who eased off in the semi-final (for example, the 2025 women's champion) are underestimated by about 1 s. Build your profile from full efforts.
- The model is clearly weaker for women. Its fatigue settings were calibrated mostly on men's split shapes; a separate calibration for women is the next improvement.
- Real athletes' body sizes are not published consistently, so every real athlete uses a typical finalist's height and weight. This affects air drag only slightly.
