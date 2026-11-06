/* Sonidos sintetizados con Web Audio: cero archivos, cero dependencias.
   Se activan tras el primer gesto del usuario (política de autoplay) y
   el interruptor global se guarda en localStorage. */

export type SoundKind = 'click' | 'nav' | 'open' | 'on' | 'off' | 'ok' | 'err' | 'bell';

const KEY = 'deyra-sound';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function isSoundOn(): boolean {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}

export function setSoundOn(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent('deyra:sound', { detail: on }));
}

function audio(): { c: AudioContext; out: GainNode } | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return master ? { c: ctx, out: master } : null;
}

type ToneOpts = { type?: OscillatorType; gain?: number; attack?: number; glideTo?: number };

function tone(c: AudioContext, out: GainNode, freq: number, start: number, dur: number, o: ToneOpts = {}) {
  const { type = 'sine', gain = 0.08, attack = 0.004, glideTo } = o;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.03);
}

/* Campanilla de servicio: parciales inarmónicos con caída exponencial. */
function bell(c: AudioContext, out: GainNode, freq: number, start: number, gain = 0.07) {
  const partials: [number, number, number][] = [[1, 1, 1.5], [2.76, 0.45, 0.9], [5.4, 0.22, 0.5], [8.93, 0.1, 0.3]];
  for (const [ratio, amp, len] of partials) tone(c, out, freq * ratio, start, len, { gain: gain * amp, attack: 0.002 });
}

export function play(kind: SoundKind) {
  if (!isSoundOn()) return;
  const a = audio();
  if (!a) return;
  const { c, out } = a;
  const t = c.currentTime + 0.01;

  switch (kind) {
    case 'click':
      tone(c, out, 1900, t, 0.045, { type: 'triangle', gain: 0.05, glideTo: 1300 });
      break;
    case 'nav':
      tone(c, out, 1250, t, 0.07, { gain: 0.045 });
      tone(c, out, 1880, t + 0.035, 0.09, { gain: 0.03 });
      break;
    case 'open':
      tone(c, out, 700, t, 0.09, { gain: 0.05, glideTo: 980 });
      break;
    case 'on':
      tone(c, out, 660, t, 0.12, { type: 'triangle', gain: 0.07 });
      tone(c, out, 990, t + 0.07, 0.2, { gain: 0.07 });
      tone(c, out, 1980, t + 0.07, 0.25, { gain: 0.02 });
      break;
    case 'off':
      tone(c, out, 520, t, 0.1, { type: 'triangle', gain: 0.06 });
      tone(c, out, 360, t + 0.06, 0.16, { gain: 0.055 });
      break;
    case 'ok':
      bell(c, out, 1568, t, 0.08);
      bell(c, out, 2093, t + 0.1, 0.06);
      break;
    case 'err':
      tone(c, out, 220, t, 0.14, { type: 'triangle', gain: 0.09, glideTo: 190 });
      tone(c, out, 165, t + 0.12, 0.22, { type: 'triangle', gain: 0.09, glideTo: 130 });
      break;
    case 'bell':
      bell(c, out, 1318, t, 0.09);
      break;
  }
}

export function burst(x: number, y: number) {
  window.dispatchEvent(new CustomEvent('deyra:burst', { detail: { x, y } }));
}
