// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/sound.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function __audioParamAt(def, evs, when) {
    const ev = evs.map((e, i) => ({ k: e[0], v: e[1], t: e[2], tc: e[3], i })).sort((a, b) => a.t - b.t || a.i - b.i);
    let st = { k: 'hold', v: def };
    let tp = 0;
    const val = (s, at) => (s.k === 'hold' ? s.v : s.vt + (s.v0 - s.vt) * Math.exp(-(at - s.t) / s.tc));
    for (const e of ev) {
        if (e.k === 'lin' || e.k === 'exp') {
            const v0 = val(st, tp);
            if (when < e.t) {
                if (when < tp)
                    return val(st, when);
                if (e.t <= tp)
                    return e.v;
                const f = (when - tp) / (e.t - tp);
                if (e.k === 'lin')
                    return v0 + (e.v - v0) * f;
                if (v0 === 0 || v0 * e.v < 0)
                    return v0;
                return v0 * Math.pow(e.v / v0, f);
            }
            st = { k: 'hold', v: e.v };
            tp = e.t;
        }
        else if (e.k === 'set') {
            if (when < e.t)
                return val(st, when);
            st = { k: 'hold', v: e.v };
            tp = e.t;
        }
        else {
            if (when < e.t)
                return val(st, when);
            st = { k: 'target', v0: val(st, e.t), vt: e.v, t: e.t, tc: e.tc > 0 ? e.tc : 1e-9 };
            tp = e.t;
        }
    }
    return val(st, when);
}
export function inner$clink$t(c) {
    const t = c.currentTime + 0.005;
    return t;
}
export function inner$plink$t(c) {
    const t = c.currentTime + 0.005;
    return t;
}
export function inner$tone$frequency$$envelope(f, t, d, fEnd, since) {
    const ev = [];
    ev.push(['set', f, t]);
    if (fEnd)
        ev.push(['exp', fEnd, t + d]);
    return __audioParamAt(440, ev, (ev.length ? Math.min(...ev.map((e) => e[2])) : 0) + since);
}
export function inner$tone$gain$$envelope(t, d, g, since) {
    const ev = [];
    ev.push(['set', 0, t]);
    ev.push(['lin', g, t + 0.004]);
    ev.push(['exp', 0.0001, t + d]);
    return __audioParamAt(1, ev, (ev.length ? Math.min(...ev.map((e) => e[2])) : 0) + since);
}

export const SIGS = {
  inner$clink$t: [{"name":"c","d":{"t":"obj","n":"AudioContext","p":[["baseLatency",{"t":"num"},false],["outputLatency",{"t":"num"},false],["close",{"t":"fn"},false],["createMediaElementSource",{"t":"fn"},false],["createMediaStreamDestination",{"t":"fn"},false],["createMediaStreamSource",{"t":"fn"},false],["getOutputTimestamp",{"t":"fn"},false],["resume",{"t":"fn"},false],["suspend",{"t":"fn"},false],["addEventListener",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false],["audioWorklet",{"t":"obj","n":"AudioWorklet","p":[["addModule",{"t":"fn"},false]]},false],["currentTime",{"t":"num"},false],["destination",{"t":"obj","n":"AudioDestinationNode","p":[["maxChannelCount",{"t":"num"},false],["channelCount",{"t":"num"},false],["channelCountMode",{"t":"lit","v":["clamped-max","explicit","max"]},false],["channelInterpretation",{"t":"lit","v":["discrete","speakers"]},false],["context",{"t":"obj","n":"BaseAudioContext","p":[]},false],["numberOfInputs",{"t":"num"},false],["numberOfOutputs",{"t":"num"},false],["connect",{"t":"fn"},false],["disconnect",{"t":"fn"},false],["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]},false],["listener",{"t":"obj","n":"AudioListener","p":[["forwardX",{"t":"obj","n":"AudioParam","p":[]},false],["forwardY",{"t":"obj","n":"AudioParam","p":[]},false],["forwardZ",{"t":"obj","n":"AudioParam","p":[]},false],["positionX",{"t":"obj","n":"AudioParam","p":[]},false],["positionY",{"t":"obj","n":"AudioParam","p":[]},false],["positionZ",{"t":"obj","n":"AudioParam","p":[]},false],["upX",{"t":"obj","n":"AudioParam","p":[]},false],["upY",{"t":"obj","n":"AudioParam","p":[]},false],["upZ",{"t":"obj","n":"AudioParam","p":[]},false],["setOrientation",{"t":"fn"},false],["setPosition",{"t":"fn"},false]]},false],["onstatechange",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["sampleRate",{"t":"num"},false],["state",{"t":"lit","v":["closed","running","interrupted","suspended"]},false],["createAnalyser",{"t":"fn"},false],["createBiquadFilter",{"t":"fn"},false],["createBuffer",{"t":"fn"},false],["createBufferSource",{"t":"fn"},false],["createChannelMerger",{"t":"fn"},false],["createChannelSplitter",{"t":"fn"},false],["createConstantSource",{"t":"fn"},false],["createConvolver",{"t":"fn"},false],["createDelay",{"t":"fn"},false],["createDynamicsCompressor",{"t":"fn"},false],["createGain",{"t":"fn"},false],["createIIRFilter",{"t":"fn"},false],["createOscillator",{"t":"fn"},false],["createPanner",{"t":"fn"},false],["createPeriodicWave",{"t":"fn"},false],["createScriptProcessor",{"t":"fn"},false],["createStereoPanner",{"t":"fn"},false],["createWaveShaper",{"t":"fn"},false],["decodeAudioData",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false]]},"opt":false}],
  inner$plink$t: [{"name":"c","d":{"t":"obj","n":"AudioContext","p":[["baseLatency",{"t":"num"},false],["outputLatency",{"t":"num"},false],["close",{"t":"fn"},false],["createMediaElementSource",{"t":"fn"},false],["createMediaStreamDestination",{"t":"fn"},false],["createMediaStreamSource",{"t":"fn"},false],["getOutputTimestamp",{"t":"fn"},false],["resume",{"t":"fn"},false],["suspend",{"t":"fn"},false],["addEventListener",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false],["audioWorklet",{"t":"obj","n":"AudioWorklet","p":[["addModule",{"t":"fn"},false]]},false],["currentTime",{"t":"num"},false],["destination",{"t":"obj","n":"AudioDestinationNode","p":[["maxChannelCount",{"t":"num"},false],["channelCount",{"t":"num"},false],["channelCountMode",{"t":"lit","v":["clamped-max","explicit","max"]},false],["channelInterpretation",{"t":"lit","v":["discrete","speakers"]},false],["context",{"t":"obj","n":"BaseAudioContext","p":[]},false],["numberOfInputs",{"t":"num"},false],["numberOfOutputs",{"t":"num"},false],["connect",{"t":"fn"},false],["disconnect",{"t":"fn"},false],["addEventListener",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false],["removeEventListener",{"t":"fn"},false]]},false],["listener",{"t":"obj","n":"AudioListener","p":[["forwardX",{"t":"obj","n":"AudioParam","p":[]},false],["forwardY",{"t":"obj","n":"AudioParam","p":[]},false],["forwardZ",{"t":"obj","n":"AudioParam","p":[]},false],["positionX",{"t":"obj","n":"AudioParam","p":[]},false],["positionY",{"t":"obj","n":"AudioParam","p":[]},false],["positionZ",{"t":"obj","n":"AudioParam","p":[]},false],["upX",{"t":"obj","n":"AudioParam","p":[]},false],["upY",{"t":"obj","n":"AudioParam","p":[]},false],["upZ",{"t":"obj","n":"AudioParam","p":[]},false],["setOrientation",{"t":"fn"},false],["setPosition",{"t":"fn"},false]]},false],["onstatechange",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["sampleRate",{"t":"num"},false],["state",{"t":"lit","v":["closed","running","interrupted","suspended"]},false],["createAnalyser",{"t":"fn"},false],["createBiquadFilter",{"t":"fn"},false],["createBuffer",{"t":"fn"},false],["createBufferSource",{"t":"fn"},false],["createChannelMerger",{"t":"fn"},false],["createChannelSplitter",{"t":"fn"},false],["createConstantSource",{"t":"fn"},false],["createConvolver",{"t":"fn"},false],["createDelay",{"t":"fn"},false],["createDynamicsCompressor",{"t":"fn"},false],["createGain",{"t":"fn"},false],["createIIRFilter",{"t":"fn"},false],["createOscillator",{"t":"fn"},false],["createPanner",{"t":"fn"},false],["createPeriodicWave",{"t":"fn"},false],["createScriptProcessor",{"t":"fn"},false],["createStereoPanner",{"t":"fn"},false],["createWaveShaper",{"t":"fn"},false],["decodeAudioData",{"t":"fn"},false],["dispatchEvent",{"t":"fn"},false]]},"opt":false}],
  inner$tone$frequency$$envelope: [{"name":"f","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false},{"name":"fEnd","d":{"t":"or","of":[{"t":"undef"},{"t":"num"}]},"opt":false},{"name":"since","d":{"t":"num"},"opt":false}],
  inner$tone$gain$$envelope: [{"name":"t","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"since","d":{"t":"num"},"opt":false}],
};
