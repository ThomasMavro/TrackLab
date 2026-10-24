
/* ---------------- User guide ---------------- */
const GUIDE = [
  { id: 'start', t: 'Quick start', b: `
    <ol class="steps">
      <li><b>Set up your profile.</b> In <i>Race setup</i>, "You" is your athlete. Pick a typical profile as a starting point, or open <i>From PBs</i> and enter your 100 m and 400 m personal bests.</li>
      <li><b>Add someone to race.</b> Use <i>+ Real athlete</i> for an Olympic or World Championship finalist, or <i>+ New profile</i> for an athlete you build yourself.</li>
      <li><b>Press Run race.</b> Watch the race in 3D. Then scroll down to <i>Your report</i>: it shows where you lose time and what would gain the most.</li>
      <li><b>Tell the report what matters to you.</b> In <i>Your priorities and levers</i>, mark qualities as Focus, Normal or Skip and set how much each could realistically improve.</li>
      <li><b>Keep going.</b> Every run is saved in <i>History</i>. Change one thing, run again, and compare the two runs.</li>
    </ol>` },
  { id: 'lanes', t: 'Lanes and athletes', b: `
    <p>The track has nine lanes. Each athlete in the <i>Lanes</i> list has one lane, a colour, and a type:</p>
    <ul>
      <li><b>Your profile</b>: always present and cannot be removed.</li>
      <li><b>Created profile</b> (<i>+ New profile</i>): an athlete you build from metrics, PBs and a race plan, such as a training partner or a target version of yourself.</li>
      <li><b>Real athlete</b> (<i>+ Real athlete</i>): a real performance from an Olympic or World Championship final or semi-final, run again in the simulator from its published splits.</li>
      <li><b>Past run</b> (<i>+ Past run</i>): one of your recorded runs or saved simulations brought back as a runner.</li>
      <li><b>Ghost</b>: a see-through runner in the same lane as an athlete, so they race a past version of themselves.</li>
    </ul>
    <p>Click an athlete to edit it, and to make the TV camera follow them. <i>Reset race</i> removes everyone except your profile and clears the report.</p>` },
  { id: 'profile', t: 'Profiles, PBs and race plans', b: `
    <p>An editable profile has three tabs:</p>
    <ul>
      <li><b>Metrics</b>: body mass, height, top speed, acceleration, reaction time, anaerobic capacity and VO₂max. "Same strength when body mass changes" makes weight changes also change speed and endurance, as an approximation. When it is off, mass only changes air drag.</li>
      <li><b>From PBs</b>: enter a 100 m and a 400 m time. The tool fits top speed and anaerobic capacity so the model runs both times.</li>
      <li><b>Race plan</b>: a target time for each 100 m. The athlete holds these targets for as long as the energy lasts; with "all-out from 300 m" ticked, they run as hard as possible from 300 m. <i>Fill in the suggested plan</i> gives the fastest plan the athlete can hold, shaped like real finalists' splits.</li>
    </ul>
    <p>Under <i>Starting point</i>, "Adjust the typical profiles" lets you change what world-class, national or club level means. Enter the times each should run, and the tool refits them.</p>` },
  { id: 'real', t: 'Real athletes', b: `
    <p><i>+ Real athlete</i> → choose Olympic Games or World Championships, the category, the year and the round (final or semi-final), then tick one or more athletes.</p>
    <p>The database holds 222 performances from 2017 to 2025: finals, plus semi-finals for 2022, 2023 and 2025 and some for 2019 and 2024. Splits are every 100 m, and every 50 m where published. Each athlete runs their real splits in their real conditions. Their top speed and anaerobic capacity are <b>estimates</b> fitted to those splits; body size is set to a typical finalist.</p>
    <p><i>Make an editable copy</i> turns a real athlete into a profile you can change, for example to see what they would run with a different race plan.</p>` },
  { id: 'recorded', t: 'Your recorded runs', b: `
    <p>History → <i>Recorded runs</i> → <i>Add a run</i> stores real 400 m runs from training or competition. Two ways in:</p>
    <ul>
      <li><b>Type times</b>: the time at every 100 m or every 50 m. Lap times are converted for you, and you can paste all the times at once.</li>
      <li><b>Upload a file</b>:
        <ul>
          <li><b>GPS watch</b>: GPX, TCX or FIT from Garmin, Coros, Suunto, Polar, Wahoo or Apple Watch exports. The tool finds the fastest 400 m in the recording, so warm-ups don't matter. GPS is approximate: expect errors of a few tenths of a second per split.</li>
          <li><b>Timing gates, laser or radar</b>: a CSV with time and distance columns, or time and speed. The most precise option.</li>
          <li><b>Split tables</b>: a CSV or text file with a distance and a time per row.</li>
        </ul></li>
    </ul>
    <p>Say whether timing started at the gun (reaction time included) or at first movement, as in training and with gates.</p>
    <p>Each saved run can be <i>added to the race</i>, raced as a <i>ghost</i>, or used to <i>update my profile</i>, which refits your top speed and anaerobic capacity to that run.</p>` },
  { id: 'ghost', t: 'Past runs and ghosts', b: `
    <p><i>+ Past run</i> lists your recorded runs and your saved simulations. Each has two buttons:</p>
    <ul>
      <li><b>Add to a lane</b>: the run takes its own lane, like any other athlete.</li>
      <li><b>Ghost</b>: the run becomes a see-through runner in the lane you choose, on the outer half of the lane. Use it to race yourself: today's settings against last month's run.</li>
    </ul>
    <p>When an athlete has a ghost, the report compares them with it automatically. The ghost's speed line is dashed in the chart. The selected athlete's editor also has <i>Choose a ghost</i>.</p>` },
  { id: 'conditions', t: 'Conditions and the track', b: `
    <ul>
      <li><b>Wind</b>: speed and direction relative to the track. It helps on one straight and hurts on the other.</li>
      <li><b>Temperature, humidity and altitude</b>: thinner air means less drag. <i>Copy conditions from a final</i> loads a championship's recorded values.</li>
      <li><b>Wet track</b>: an approximation, with a small push-off loss and a larger cost on the bends.</li>
      <li><b>Track colour</b>: red, blue or purple.</li>
    </ul>
    <p>Conditions apply to your own athletes. Real athletes and past runs keep the conditions of their own race.</p>` },
  { id: 'view', t: 'The 3D view and live table', b: `
    <ul>
      <li><b>Cameras</b>: TV follow tracks the athlete selected in the Lanes list. Overview shows the whole lap, Finish line is the home straight, and Free lets you drag to rotate and scroll to zoom.</li>
      <li><b>Playback</b>: pause, restart, and ¼× to 2× speed. Labels can be hidden.</li>
      <li><b>Live table</b>: position, speed, stride length and frequency, gap to the leader, gap to the athlete's own plan at the last 100 m mark, and anaerobic fuel left.</li>
    </ul>` },
  { id: 'report', t: 'Your report', b: `
    <ul>
      <li><b>Verdict</b>: one sentence on where the race was won or lost against the athlete you compare with (a ghost by default, otherwise the fastest other runner). It also gives the best time possible with current fitness.</li>
      <li><b>Priorities and levers</b>: for each quality, the time gained from a realistic improvement, by re-running the race with that one change. Mark Focus, Normal or Skip and set the sizes; the verdict, the advice and the goal mix follow your choices.</li>
      <li><b>Where time is won and lost</b>: speed over the race for every runner, with a red and green band showing every 10 m where time is lost or gained.</li>
      <li><b>What to work on</b>: the training priorities in plain words.</li>
      <li><b>Goal</b>: enter a target time to see how much each quality would have to improve on its own, and a balanced mix based on your realistic sizes.</li>
      <li><b>Export</b>: save the report as an image or a PDF to send to an athlete or coach.</li>
    </ul>` },
  { id: 'history', t: 'History and comparing runs', b: `
    <p>Every press of <i>Run race</i> saves the full setup and your report as a run inside a session. You can rename sessions, start new ones, and delete runs.</p>
    <ul>
      <li><b>Open a run</b>: click it to bring back that exact dashboard. Changes to priorities and the goal are saved into it.</li>
      <li><b>Compare</b>: tick two runs and press <i>Compare</i> to see what changed between them (metrics, plan, conditions, lane) and the effect on each 100 m.</li>
    </ul>
    <p>History is private to you. It is saved to your account when the page is opened in Claude, and otherwise in your browser.</p>` },
  { id: 'model', t: 'How the model works, and how accurate it is', b: `
    <p>Each runner is a force-velocity sprinter with a limited anaerobic energy store, topped up by an aerobic supply that switches on over the first seconds. The force an athlete can produce falls as the store empties, which creates the slowdown in the home straight. Air drag depends on body size, wind and air density. Bends cost speed and energy, so tighter inside lanes cost slightly more. Lanes and staggers follow standard track geometry.</p>
    <p><b>Accuracy, measured on races the model had not seen.</b> For 50 athletes who ran both a semi-final and the final of the same championship, we fitted the profile to the semi and predicted the final:</p>
    <ul>
      <li>Given the athlete's real pacing to 300 m, the model predicted the final time within <b>0.29 s on average</b> when the semi was a full effort (43 of 50 athletes). A simple "average finalist fade" rule gets 0.33 s.</li>
      <li>For the 7 athletes who eased off in their semi (their final was more than 0.5 s faster), errors were about 1 s. A profile is only as good as the race it comes from, so build yours from full efforts.</li>
      <li>Predictions are better for men (0.31 s) than for women (0.51 s).</li>
    </ul>
    <p>Fitted to their own races, the 222 real performances are reproduced within 0.08 s at every published split.</p>` },
  { id: 'sources', t: 'Data sources', b: `
    <ul>
      <li>Official World Athletics results and race analysis sheets (Seiko timing): splits, reaction times, lanes and conditions.</li>
      <li>World Athletics biomechanical report, London 2017.</li>
      <li>Athlete First split compilation (2025), for races without an official analysis sheet and for 50 m splits.</li>
    </ul>` },
];
function openGuide(id) {
  const m = $('#guide');
  $('#guideNav').innerHTML = GUIDE.map(s => `<button data-gsec="${s.id}" aria-current="${s.id === id}">${s.t}</button>`).join('');
  const sec = GUIDE.find(s => s.id === id) || GUIDE[0];
  $('#guideBody').innerHTML = `<h2>${sec.t}</h2>${sec.b}`;
  $('#guideBody').scrollTop = 0;
  m.hidden = false;
  $('#guideClose').focus();
  try { localStorage.setItem('raceLabGuideSeen', '1'); } catch (e) { /* ignore */ }
  const b = $('#welcome'); if (b) b.hidden = true;
}
function closeGuide() { $('#guide').hidden = true; }
$('#guideBtn').addEventListener('click', () => openGuide('start'));
$('#guideNav').addEventListener('click', e => { const b = e.target.closest('[data-gsec]'); if (b) openGuide(b.dataset.gsec); });
$('#guideClose').addEventListener('click', closeGuide);
$('#guide').addEventListener('click', e => { if (e.target.id === 'guide') closeGuide(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#guide').hidden) closeGuide(); });
$('#welcome').addEventListener('click', e => {
  if (e.target.id === 'welcomeOpen') openGuide('start');
  if (e.target.id === 'welcomeClose') { $('#welcome').hidden = true; try { localStorage.setItem('raceLabGuideSeen', '1'); } catch (err) { /* ignore */ } }
});
(function () { let seen = false; try { seen = localStorage.getItem('raceLabGuideSeen') === '1'; } catch (e) { /* ignore */ } $('#welcome').hidden = seen; })();
document.addEventListener('click', e => { const g = e.target.closest('[data-guide]'); if (g) openGuide(g.dataset.guide); });
