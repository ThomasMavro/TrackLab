
/* boot */
renderList(); renderEditor(); renderEnv(); refreshSelectors(true);
init3D();
runRace();
initStore();
if (!renderer) setInterval(() => { renderLive(); updateClock(); }, 200);
window.__raceLab = { state, get runners() { return runners; }, get camera() { return camera; }, get controls() { return controls; }, setCam, placeRunners, Store };
})();
