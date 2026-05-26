// Procedural Web Audio — no external files required.
// AudioContext is created on first user interaction to satisfy browser autoplay policy.

type CoinTier =
  | "copper" | "silver" | "gold" | "note" | "bundle"
  | "silver-bar" | "gold-bar" | "chest" | "crown";

let ctx: AudioContext | null = null;
let ambientGain: GainNode | null = null;
let ambientStarted = false;
let muted = false;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function masterGain(ac: AudioContext): GainNode {
  const g = ac.createGain();
  g.gain.value = muted ? 0 : 1;
  g.connect(ac.destination);
  return g;
}

// ── Ambient underwater hum ───────────────────────────────────────────────────

function startAmbient() {
  if (ambientStarted || muted) return;
  ambientStarted = true;
  const ac = getCtx();

  // Two layers: low filtered noise + very slow oscillator wobble
  const bufferSize = ac.sampleRate * 4;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const lpf = ac.createBiquadFilter();
  lpf.type = "lowpass";
  lpf.frequency.value = 180;
  lpf.Q.value = 0.8;

  ambientGain = ac.createGain();
  ambientGain.gain.value = 0;

  const master = masterGain(ac);
  noise.connect(lpf);
  lpf.connect(ambientGain);
  ambientGain.connect(master);
  noise.start();

  // Fade ambient in gently
  ambientGain.gain.linearRampToValueAtTime(0.03, ac.currentTime + 3);
}

// ── Feed plop ────────────────────────────────────────────────────────────────

export function playFeedSound() {
  if (muted) return;
  try {
    const ac = getCtx();
    startAmbient();
    const osc = ac.createOscillator();
    const env = ac.createGain();
    const master = masterGain(ac);

    osc.type = "sine";
    osc.frequency.setValueAtTime(320, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.12);

    env.gain.setValueAtTime(0, ac.currentTime);
    env.gain.linearRampToValueAtTime(0.18, ac.currentTime + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);

    osc.connect(env);
    env.connect(master);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.2);
  } catch { /* audio not available */ }
}

// ── Coin collection chime (pitch + chord scaled to tier) ─────────────────────

const TIER_NOTES: Record<CoinTier, number[]> = {
  copper:      [880],
  silver:      [1046, 1318],
  gold:        [1046, 1318, 1568],
  note:        [659,  880],
  bundle:      [784,  988,  1175],
  "silver-bar":[1318, 1568],
  "gold-bar":  [1568, 1976, 2349],
  chest:       [1046, 1318, 1568, 1976],
  crown:       [1046, 1318, 1568, 1976, 2349],
};

export function playCoinSound(tier: CoinTier = "copper") {
  if (muted) return;
  try {
    const ac = getCtx();
    startAmbient();
    const notes = TIER_NOTES[tier] ?? TIER_NOTES.copper;
    const master = masterGain(ac);
    const gainVal = Math.min(0.22, 0.1 + notes.length * 0.025);

    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const env = ac.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0, ac.currentTime + i * 0.04);
      env.gain.linearRampToValueAtTime(gainVal, ac.currentTime + i * 0.04 + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.04 + 0.35);
      osc.connect(env);
      env.connect(master);
      osc.start(ac.currentTime + i * 0.04);
      osc.stop(ac.currentTime + i * 0.04 + 0.4);
    });
  } catch { /* audio not available */ }
}

// ── Streak chime ─────────────────────────────────────────────────────────────

export function playStreakSound(streak: number) {
  if (muted) return;
  try {
    const ac = getCtx();
    startAmbient();
    const master = masterGain(ac);
    const baseFreq = 523 + streak * 130;

    for (let i = 0; i < 2; i++) {
      const osc = ac.createOscillator();
      const env = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = baseFreq * (i === 1 ? 1.5 : 1);
      env.gain.setValueAtTime(0, ac.currentTime + i * 0.08);
      env.gain.linearRampToValueAtTime(0.15, ac.currentTime + i * 0.08 + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.08 + 0.4);
      osc.connect(env);
      env.connect(master);
      osc.start(ac.currentTime + i * 0.08);
      osc.stop(ac.currentTime + i * 0.08 + 0.45);
    }
  } catch { /* audio not available */ }
}

// ── Toggle mute ──────────────────────────────────────────────────────────────

export function useGameAudio() {
  function toggleMute() {
    muted = !muted;
    if (ambientGain) ambientGain.gain.value = muted ? 0 : 0.03;
  }

  function isMuted() { return muted; }

  // Kick off the ambient layer on first call (needs a user gesture to have happened already)
  onMounted(() => {
    if (process.client) startAmbient();
  });

  return { playFeedSound, playCoinSound, playStreakSound, toggleMute, isMuted };
}
