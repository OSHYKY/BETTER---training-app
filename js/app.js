const $ = (id) => document.getElementById(id);

const state = {
  work: 240,
  rest: 180,
  count: 4,
  current: 1,
  phase: 'work',
  remaining: 240,
  phaseDuration: 240,
  running: false,
  paused: false,
  sound: true,
  countdown: true,
  vibration: true,
  timerId: null,
  lastTick: 0,
  wakeLock: null
};

const formatTime = (seconds) => {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const updateSetupLabels = () => {
  $('workValue').textContent = formatTime(state.work);
  $('restValue').textContent = formatTime(state.rest);
  $('countValue').textContent = state.count;
};

$('workSlider').addEventListener('input', (e) => { state.work = +e.target.value; updateSetupLabels(); markCustom(); });
$('restSlider').addEventListener('input', (e) => { state.rest = +e.target.value; updateSetupLabels(); markCustom(); });
$('countSlider').addEventListener('input', (e) => { state.count = +e.target.value; updateSetupLabels(); markCustom(); });

function markCustom() {
  document.querySelectorAll('.preset').forEach(b => b.classList.toggle('active', b.dataset.preset === 'custom'));
}

const presets = {
  quick: [240, 180, 4],
  power: [180, 180, 6],
  custom: [state.work, state.rest, state.count]
};

document.querySelectorAll('.preset').forEach(button => {
  button.addEventListener('click', () => {
    const [work, rest, count] = presets[button.dataset.preset];
    if (button.dataset.preset !== 'custom') {
      state.work = work; state.rest = rest; state.count = count;
      $('workSlider').value = work; $('restSlider').value = rest; $('countSlider').value = count;
      updateSetupLabels();
    }
    document.querySelectorAll('.preset').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
  });
});

document.querySelector('.preset[data-preset="quick"]').classList.add('active');

$('countdownToggle').addEventListener('change', e => state.countdown = e.target.checked);
$('vibrationToggle').addEventListener('change', e => state.vibration = e.target.checked);
$('soundToggle').addEventListener('click', () => {
  state.sound = !state.sound;
  $('soundToggle').textContent = state.sound ? '🔊' : '🔇';
  $('soundToggle').classList.toggle('muted-icon', !state.sound);
  if (state.sound) unlockAudio();
});

let audioContext;
function unlockAudio() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
}

function beep(type = 'change') {
  if (!state.sound) return;
  unlockAudio();
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.connect(gain); gain.connect(audioContext.destination);
  oscillator.type = 'sine';
  oscillator.frequency.value = type === 'countdown' ? 720 : (type === 'finish' ? 920 : 560);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (type === 'finish' ? .35 : .16));
  oscillator.start(now);
  oscillator.stop(now + (type === 'finish' ? .36 : .17));
  if (type === 'finish') setTimeout(() => beep('change'), 180);
}

function buzz(pattern = [100]) {
  if (state.vibration && navigator.vibrate) navigator.vibrate(pattern);
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) state.wakeLock = await navigator.wakeLock.request('screen');
  } catch (_) {}
}
function releaseWakeLock() {
  if (state.wakeLock) { state.wakeLock.release().catch(() => {}); state.wakeLock = null; }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.running && !state.paused) requestWakeLock();
});

function show(view) {
  ['setupView', 'timerView', 'completeView'].forEach(id => $(id).classList.toggle('hidden', id !== view));
}

function updateTimerUI() {
  $('timerDisplay').textContent = formatTime(state.remaining);
  $('phaseCount').textContent = `Interval ${state.current} / ${state.count}`;
  $('phaseLabel').textContent = state.phase === 'work' ? 'INTERVAL' : 'REST';
  $('timerCard').classList.toggle('work-phase', state.phase === 'work');
  $('timerCard').classList.toggle('rest-phase', state.phase === 'rest');
  $('nextLabel').textContent = state.phase === 'work'
    ? (state.current < state.count ? 'Next: Rest' : 'Next: Finish')
    : 'Next: Interval';
  const progress = state.phaseDuration ? state.remaining / state.phaseDuration : 0;
  $('progressBar').style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
}

function startWorkout() {
  unlockAudio();
  state.current = 1;
  state.phase = 'work';
  state.phaseDuration = state.work;
  state.remaining = state.work;
  state.running = true;
  state.paused = false;
  $('pauseButton').textContent = 'Pause';
  show('timerView');
  requestWakeLock();
  buzz([60]);
  beep('change');
  updateTimerUI();
  state.lastTick = performance.now();
  state.timerId = requestAnimationFrame(tick);
}

function tick(now) {
  if (!state.running) return;
  if (!state.paused) {
    const elapsed = (now - state.lastTick) / 1000;
    state.lastTick = now;
    state.remaining -= elapsed;
    const whole = Math.ceil(state.remaining);
    if (state.countdown && whole <= 3 && whole > 0 && Math.abs(state.remaining - whole) < 0.05) {
      beep('countdown');
      buzz([35]);
      $('timerCard').classList.add('countdown-phase');
      setTimeout(() => $('timerCard').classList.remove('countdown-phase'), 180);
    }
    if (state.remaining <= 0) {
      advancePhase();
      return;
    }
    updateTimerUI();
  } else {
    state.lastTick = now;
  }
  state.timerId = requestAnimationFrame(tick);
}

function advancePhase() {
  if (state.phase === 'work') {
    if (state.current >= state.count) {
      finishWorkout();
      return;
    }
    state.phase = 'rest';
    state.phaseDuration = state.rest;
    state.remaining = state.rest;
    beep('change'); buzz([120, 60, 120]);
  } else {
    state.current += 1;
    state.phase = 'work';
    state.phaseDuration = state.work;
    state.remaining = state.work;
    beep('change'); buzz([120, 60, 120]);
  }
  updateTimerUI();
  state.lastTick = performance.now();
  if (state.phase === 'rest' && state.rest === 0) advancePhase();
}

function pauseWorkout() {
  if (!state.running) return;
  state.paused = !state.paused;
  $('pauseButton').textContent = state.paused ? 'Resume' : 'Pause';
  if (!state.paused) {
    unlockAudio(); requestWakeLock(); state.lastTick = performance.now(); beep('countdown');
  } else {
    releaseWakeLock(); buzz([50]);
  }
}

function skipPhase() {
  if (!state.running) return;
  state.remaining = 0;
  advancePhase();
}

function stopWorkout() {
  state.running = false;
  state.paused = false;
  if (state.timerId) cancelAnimationFrame(state.timerId);
  releaseWakeLock();
  show('setupView');
}

function finishWorkout() {
  state.running = false;
  state.paused = false;
  if (state.timerId) cancelAnimationFrame(state.timerId);
  releaseWakeLock();
  beep('finish');
  buzz([150, 80, 150, 80, 300]);
  $('summaryText').textContent = `${state.count} × ${formatTime(state.work)} intervals completed.`;
  show('completeView');
}

$('startButton').addEventListener('click', startWorkout);
$('pauseButton').addEventListener('click', pauseWorkout);
$('skipButton').addEventListener('click', skipPhase);
$('stopButton').addEventListener('click', stopWorkout);
$('backButton').addEventListener('click', stopWorkout);
$('againButton').addEventListener('click', () => show('setupView'));

updateSetupLabels();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
