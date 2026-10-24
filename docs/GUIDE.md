# 400m Race Lab — User guide

The same guide is built into the tool (the **Guide** button at the top left).

## Quick start

1. **Set up your profile.** In *Race setup*, "You" is your athlete. Pick a typical profile as a starting point, or open *From PBs* and enter your 100 m and 400 m personal bests.
2. **Add someone to race.** Use *+ Real athlete* for an Olympic or World Championship finalist, or *+ New profile* for an athlete you build yourself.
3. **Press Run race.** Watch the race in 3D. Then scroll down to *Your report*: it shows where you lose time and what would gain the most.
4. **Tell the report what matters to you.** In *Your priorities and levers*, mark qualities as Focus, Normal or Skip and set how much each could realistically improve.
5. **Keep going.** Every run is saved in *History*. Change one thing, run again, and compare the two runs.

## Lanes and athletes

The track has nine lanes. Each athlete in the *Lanes* list has one lane, a colour, and a type:

- **Your profile**: always present and cannot be removed.
- **Created profile** (*+ New profile*): an athlete you build from metrics, PBs and a race plan, such as a training partner or a target version of yourself.
- **Real athlete** (*+ Real athlete*): a real performance from an Olympic or World Championship final or semi-final, run again in the simulator from its published splits.
- **Past run** (*+ Past run*): one of your recorded runs or saved simulations brought back as a runner.
- **Ghost**: a see-through runner in the same lane as an athlete, so they race a past version of themselves.

Click an athlete to edit it, and to make the TV camera follow them. *Reset race* removes everyone except your profile and clears the report.

## Profiles, PBs and race plans

An editable profile has three tabs:

- **Metrics**: body mass, height, top speed, acceleration, reaction time, anaerobic capacity and VO₂max. "Same strength when body mass changes" makes weight changes also change speed and endurance, as an approximation. When it is off, mass only changes air drag.
- **From PBs**: enter a 100 m and a 400 m time. The tool fits top speed and anaerobic capacity so the model runs both times.
- **Race plan**: a target time for each 100 m. The athlete holds these targets for as long as the energy lasts; with "all-out from 300 m" ticked, they run as hard as possible from 300 m. *Fill in the suggested plan* gives the fastest plan the athlete can hold, shaped like real finalists' splits.

Under *Starting point*, "Adjust the typical profiles" lets you change what world-class, national or club level means. Enter the times each should run, and the tool refits them.

## Real athletes

*+ Real athlete* → choose Olympic Games or World Championships, the category, the year and the round (final or semi-final), then tick one or more athletes.

The database holds 222 performances from 2017 to 2025: finals, plus semi-finals for 2022, 2023 and 2025 and some for 2019 and 2024. Splits are every 100 m, and every 50 m where published. Each athlete runs their real splits in their real conditions. Their top speed and anaerobic capacity are **estimates** fitted to those splits; body size is set to a typical finalist.

*Make an editable copy* turns a real athlete into a profile you can change, for example to see what they would run with a different race plan.

## Your recorded runs

History → *Recorded runs* → *Add a run* stores real 400 m runs from training or competition. Two ways in:

- **Type times**: the time at every 100 m or every 50 m. Lap times are converted for you, and you can paste all the times at once.
- **Upload a file**:

- **GPS watch**: GPX, TCX or FIT from Garmin, Coros, Suunto, Polar, Wahoo or Apple Watch exports. The tool finds the fastest 400 m in the recording, so warm-ups don't matter. GPS is approximate: expect errors of a few tenths of a second per split.
- **Timing gates, laser or radar**: a CSV with time and distance columns, or time and speed. The most precise option.
- **Split tables**: a CSV or text file with a distance and a time per row.

Say whether timing started at the gun (reaction time included) or at first movement, as in training and with gates.

Each saved run can be *added to the race*, raced as a *ghost*, or used to *update my profile*, which refits your top speed and anaerobic capacity to that run.

## Past runs and ghosts

*+ Past run* lists your recorded runs and your saved simulations. Each has two buttons:

- **Add to a lane**: the run takes its own lane, like any other athlete.
- **Ghost**: the run becomes a see-through runner in the lane you choose, on the outer half of the lane. Use it to race yourself: today's settings against last month's run.

When an athlete has a ghost, the report compares them with it automatically. The ghost's speed line is dashed in the chart. The selected athlete's editor also has *Choose a ghost*.

## Conditions and the track

- **Wind**: speed and direction relative to the track. It helps on one straight and hurts on the other.
- **Temperature, humidity and altitude**: thinner air means less drag. *Copy conditions from a final* loads a championship's recorded values.
- **Wet track**: an approximation, with a small push-off loss and a larger cost on the bends.
- **Track colour**: red, blue or purple.

Conditions apply to your own athletes. Real athletes and past runs keep the conditions of their own race.

## The 3D view and live table

- **Cameras**: TV follow tracks the athlete selected in the Lanes list. Overview shows the whole lap, Finish line is the home straight, and Free lets you drag to rotate and scroll to zoom.
- **Playback**: pause, restart, and ¼× to 2× speed. Labels can be hidden.
- **Live table**: position, speed, stride length and frequency, gap to the leader, gap to the athlete's own plan at the last 100 m mark, and anaerobic fuel left.

## Your report

- **Verdict**: one sentence on where the race was won or lost against the athlete you compare with (a ghost by default, otherwise the fastest other runner). It also gives the best time possible with current fitness.
- **Priorities and levers**: for each quality, the time gained from a realistic improvement, by re-running the race with that one change. Mark Focus, Normal or Skip and set the sizes; the verdict, the advice and the goal mix follow your choices.
- **Where time is won and lost**: speed over the race for every runner, with a red and green band showing every 10 m where time is lost or gained.
- **What to work on**: the training priorities in plain words.
- **Goal**: enter a target time to see how much each quality would have to improve on its own, and a balanced mix based on your realistic sizes.
- **Export**: save the report as an image or a PDF to send to an athlete or coach.

## History and comparing runs

Every press of *Run race* saves the full setup and your report as a run inside a session. You can rename sessions, start new ones, and delete runs.

- **Open a run**: click it to bring back that exact dashboard. Changes to priorities and the goal are saved into it.
- **Compare**: tick two runs and press *Compare* to see what changed between them (metrics, plan, conditions, lane) and the effect on each 100 m.

History is private to you. It is saved to your account when the page is opened in Claude, and otherwise in your browser.

## How the model works, and how accurate it is

Each runner is a force-velocity sprinter with a limited anaerobic energy store, topped up by an aerobic supply that switches on over the first seconds. The force an athlete can produce falls as the store empties, which creates the slowdown in the home straight. Air drag depends on body size, wind and air density. Bends cost speed and energy, so tighter inside lanes cost slightly more. Lanes and staggers follow standard track geometry.

**Accuracy, measured on races the model had not seen.** For 50 athletes who ran both a semi-final and the final of the same championship, we fitted the profile to the semi and predicted the final:

- Given the athlete's real pacing to 300 m, the model predicted the final time within **0.29 s on average** when the semi was a full effort (43 of 50 athletes). A simple "average finalist fade" rule gets 0.33 s.
- For the 7 athletes who eased off in their semi (their final was more than 0.5 s faster), errors were about 1 s. A profile is only as good as the race it comes from, so build yours from full efforts.
- Predictions are better for men (0.31 s) than for women (0.51 s).

Fitted to their own races, the 222 real performances are reproduced within 0.08 s at every published split.

## Data sources

- Official World Athletics results and race analysis sheets (Seiko timing): splits, reaction times, lanes and conditions.
- World Athletics biomechanical report, London 2017.
- Athlete First split compilation (2025), for races without an official analysis sheet and for 50 m splits.
