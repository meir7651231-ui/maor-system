/**
 * 📒 פרנסה׳לע — צלילי-המטבעות של המקור (SND, parnasale.html L3531–3542): מסונתזים ב-WebAudio, נוצרים רק במחווה
 * הראשונה (לעולם לא autoplay), מושתקים פר-צופה ("צלילים"), ושותקים בימי בין-המצרים (period 'bh') — כמו במקור.
 * clink = מטבע נוקש · plink = מטבע נופל לפושקע. אין קבצי-שמע; כשל-דפדפן ⇒ שקט.
 */

type Ctx = AudioContext;

const SND: { ctx: Ctx | null; out: GainNode | null; muted: boolean; period: string } = { ctx: null, out: null, muted: false, period: '' };

/** מצב-ההשתקה ותקופת-השנה (נקבעים מהמסך). */
export function setSoundState(muted: boolean, period: string): void {
  SND.muted = muted;
  SND.period = period;
}

function init(): void {
  if (SND.ctx || SND.muted || typeof window === 'undefined') return;
  const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  try {
    SND.ctx = new AC();
    SND.out = SND.ctx.createGain();
    SND.out.gain.value = 0.5;
    SND.out.connect(SND.ctx.destination);
  } catch {
    SND.ctx = null;
  }
}

/** במחווה (לחיצה/מקש): יוצר/מעיר את ההקשר. */
export function wakeSound(): void {
  init();
  if (SND.ctx && SND.ctx.state === 'suspended') SND.ctx.resume().catch(() => {});
}

function ok(): boolean {
  return !!(SND.ctx && SND.out && !SND.muted && SND.period !== 'bh' && SND.ctx.state === 'running');
}

function tone(f: number, t: number, d: number, g: number, fEnd?: number): void {
  const c = SND.ctx as Ctx;
  const o = c.createOscillator();
  const v = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(f, t);
  if (fEnd) o.frequency.exponentialRampToValueAtTime(fEnd, t + d);
  v.gain.setValueAtTime(0, t);
  v.gain.linearRampToValueAtTime(g, t + 0.004);
  v.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(v);
  v.connect(SND.out as GainNode);
  o.start(t);
  o.stop(t + d + 0.03);
}

function tick(t: number, d: number, g: number, hp: number): void {
  const c = SND.ctx as Ctx;
  const b = c.createBuffer(1, Math.ceil(c.sampleRate * d), c.sampleRate);
  const a = b.getChannelData(0);
  for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / a.length);
  const s = c.createBufferSource();
  const f = c.createBiquadFilter();
  const v = c.createGain();
  s.buffer = b;
  f.type = 'highpass';
  f.frequency.value = hp;
  v.gain.value = g;
  s.connect(f);
  f.connect(v);
  v.connect(SND.out as GainNode);
  s.start(t);
}

/** מטבע נוקש (היפוך/עף). */
export function clink(): void {
  if (!ok()) return;
  try {
    const c = SND.ctx as Ctx;
    const t = c.currentTime + 0.005;
    const j = 1 + Math.random() * 0.01;
    for (const [f, g, d] of [
      [2637, 0.14, 0.34],
      [3960, 0.08, 0.24],
      [5280, 0.05, 0.17],
      [7120, 0.025, 0.1],
    ] as const)
      tone(f * j, t, d, g);
    tick(t, 0.025, 0.06, 5000);
  } catch {
    /* שקט */
  }
}

/** מטבע נופל לפושקע. */
export function plink(): void {
  if (!ok()) return;
  try {
    const c = SND.ctx as Ctx;
    const t = c.currentTime + 0.005;
    tone(175, t, 0.16, 0.3, 70);
    for (const [f, g, d] of [
      [1047, 0.17, 0.55],
      [1580, 0.08, 0.38],
      [2093, 0.05, 0.26],
    ] as const)
      tone(f, t, d, g);
    for (const [f, g, d] of [
      [1318, 0.06, 0.22],
      [2637, 0.03, 0.12],
    ] as const)
      tone(f, t + 0.09, d, g);
    tick(t, 0.03, 0.08, 1800);
  } catch {
    /* שקט */
  }
}
