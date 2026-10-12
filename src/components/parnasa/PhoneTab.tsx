/**
 * 📒 פרנסה׳לע — לשונית 📞 הקו (אשכול 6ב · parnasa.phone): **סימולטור — לא קו חי.** מה קו-טלפון כשר
 * היה אומר למתקשר: עסקי-המדריך המאושרים ומודעות-הלוח, ברגע הזה בשעון-הקהילה, דרך מודל-הקו הטהור
 * (phoneLine: buildPhoneMenu · phoneStep/walkPhone · resolveDialCode · resolveSpeech) ומצב-הסימולטור
 * (phoneSim). אין מספר, אין ספק, אין שרת ואין שיחה — צומת-חיבור רק מתאר מה היה קורה (אין קישור-חיוג).
 *   · הנוסח של הצומת הנוכחי + האפשרויות · מקלדת 1–9 * 0 # · "אמרו משהו" (תמליל ⇒ resolveSpeech ⇒
 *     צומת-אישור, לעולם לא חיבור) · המסלול + 🔄 מההתחלה · שבת/יו״ט: הקו סגור — וגם תצוגת "בשבת" /
 *     "ביום חול" (phonePreviewMs), כדי שהגבאי ישמע את הודעת-הסגירה בלי לחכות לשבת.
 *   · 🔊 השמעה — speechSynthesis עם קול עברי, רק כשקיים במכשיר (בלי קול עברי ⇒ הערה קצרה, בלי שגיאה).
 *   · ⬇ תסריט הקו — phoneScriptText דרך שער יציאת-המידע (downloadTextDoc ⇒ guardExport), ונרשם ביומן-
 *     הגישה רק כשירד בפועל — כמו החוברת; מגודר parnasa.export.
 * פרטיות: המודל קורא רק מאושרים ומודעות מאושרות — בקשות-תושבים לא נכנסות לקו בכלל.
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { Btn, Chip, TextInput } from '../ui';
import { duplicateDialCodes } from './lib';
import { buildPhoneMenu, nodeSpeech, PHONE_KIND_LABELS, phoneKeyName, phoneScriptText } from './phoneLine';
import { hebrewVoice, phonePreviewMs, simListening, simNode, simPress, simSay, simStart, type PhonePreview, type PhoneSimState } from './phoneSim';
import { clockAt } from './zmanimBoard';
import { downloadTextDoc } from './exportDoc';
import type { PrNow } from './hooks';

/** מקלדת-הטלפון בסדר הפיזי (LTR): 1 2 3 · 4 5 6 · 7 8 9 · * 0 #. */
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const;

const FAINT = { fontSize: 12.5, color: 'var(--ink-faint)' } as const;
const KEY_BADGE = { display: 'inline-block', minWidth: 22, textAlign: 'center', fontWeight: 800, border: '1px solid var(--line)', borderRadius: 6, marginInlineEnd: 6 } as const;

type Tts = { state: 'checking' } | { state: 'none' } | { state: 'ready'; voice: SpeechSynthesisVoice };

/** קול עברי להשמעה — זיהוי-יכולת בלבד: אין speechSynthesis / אין קול עברי ⇒ 'none' (הערה, לא שגיאה). */
function useHebrewVoice(): Tts {
  const [tts, setTts] = useState<Tts>({ state: 'checking' });
  useEffect(() => {
    let synth: SpeechSynthesis | undefined;
    try {
      synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined;
    } catch {
      synth = undefined;
    }
    if (!synth) {
      setTts({ state: 'none' });
      return;
    }
    const s = synth;
    const pick = (): void => {
      try {
        const voice = hebrewVoice(s.getVoices());
        if (voice) setTts({ state: 'ready', voice });
      } catch {
        setTts({ state: 'none' });
      }
    };
    pick();
    // בחלק מהדפדפנים הקולות נטענים באיחור (voiceschanged); בלי קול עברי תוך 2 שניות ⇒ "אין"
    try {
      s.addEventListener('voiceschanged', pick);
    } catch {
      /* דפדפן ישן — מסתפקים בבדיקה הראשונה */
    }
    const t = setTimeout(() => setTts((x) => (x.state === 'checking' ? { state: 'none' } : x)), 2000);
    return () => {
      clearTimeout(t);
      try {
        s.removeEventListener('voiceschanged', pick);
        s.cancel();
      } catch {
        /* ניקוי בלבד */
      }
    };
  }, []);
  return tts;
}

export function PhoneTab(props: { now: PrNow }) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const posts = useApp((s) => s.db.prPosts);
  const prefs = useApp((s) => s.db.ui.parnasa);
  const logAccess = useApp((s) => s.logAccess);
  const toast = useApp((s) => s.toast);
  const exportOn = featureOn(config, 'parnasa.export');
  const tts = useHebrewVoice();
  const { now } = props;
  const [mode, setMode] = useState<PhonePreview>('now');
  const [said, setSaid] = useState('');

  // הרגע שהקו "נשמע" בו: עכשיו, או השבת / יום-החול הקרובים (תצוגה) — תמיד בשעון-הקהילה
  const atMs = useMemo(() => phonePreviewMs(now.nowMs, now.loc, mode), [now.nowMs, now.loc, mode]);
  const clock = useMemo(() => clockAt(atMs, now.loc.tz), [atMs, now.loc.tz]);
  const menu = useMemo(() => buildPhoneMenu({ listings, posts, prefs, nowMs: atMs, loc: now.loc, config }), [listings, posts, prefs, atMs, now.loc, config]);
  const dups = useMemo(() => duplicateDialCodes(listings, clock.iso), [listings, clock.iso]);

  // מצב-הסימולטור קשור לשורש ולתצוגה: שבת נכנסה/יצאה או מעבר-תצוגה ⇒ מתחילים מההתחלה (בלי אפקט)
  const rootKey = mode + '|' + menu.root;
  const [box, setBox] = useState<{ key: string; st: PhoneSimState }>(() => ({ key: rootKey, st: simStart(menu) }));
  const sim = box.key === rootKey ? box.st : simStart(menu);
  const setSim = (st: PhoneSimState): void => setBox({ key: rootKey, st });
  const node = simNode(menu, sim);
  const listening = simListening(node);

  const brand = termOf(config, 'nav.parnasa', 'פרנסה׳לע');
  const words = termOf(config, 'entity.prListings', 'עסקים');
  const nodes = Object.values(menu.nodes);
  const bizCount = nodes.filter((n) => n.kind === 'listing').length;

  function press(k: string): void {
    setSim(simPress(menu, sim, k));
  }

  function say(e: FormEvent): void {
    e.preventDefault();
    const t = said.trim();
    if (!t || !listening) return;
    setSim(simSay(menu, sim, t, listings, { todayIso: clock.iso, clock, closureAt: now.closureAt }));
    setSaid('');
  }

  function speak(): void {
    if (tts.state !== 'ready' || !node) return;
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(nodeSpeech(node));
      u.voice = tts.voice;
      u.lang = tts.voice.lang;
      u.rate = 0.95;
      synth.speak(u);
    } catch {
      /* השמעה נכשלה — שקט, בלי שגיאה (הנוסח מוצג על המסך) */
    }
  }

  function downloadScript(): void {
    const ok = downloadTextDoc('parnasa-line-script-' + clock.iso + '.txt', phoneScriptText(menu));
    if (!ok) return; // שער יציאת-המידע סירב (הטוסט — מהשער)
    logAccess('📞 הורדת תסריט הקו ' + brand, nodes.length + ' צמתים · ' + bizCount + ' ' + words + ' · נכון ל-' + menu.asOf);
    toast('תסריט הקו ירד כקובץ טקסט — לכל צומת: הנוסח, המקשים והפעולה');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div role="note" className="card" style={{ border: '1px dashed #b08d2e', fontSize: 13, lineHeight: 1.7 }}>
        <b>📞 תצוגה בלבד — הקו עוד לא חי.</b>
        {' אין מספר טלפון, אין ספק ואין שיחות. כאן רואים (ושומעים) מה קו-הטלפון הכשר '}
        <b>היה</b>
        {' אומר למתקשר — על ' + words + ' המאושרים במדריך ועל מודעות הלוח, ברגע שנבחר.'}
      </div>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <h2 style={{ fontSize: 15, fontWeight: 800 }}>{'☎ הקו של ' + menu.brand}</h2>
          <span style={FAINT}>
            {(menu.closed ? '🕯 סגור' : '🟢 פתוח') + ' ברגע ' + menu.asOf + ' · ' + bizCount + ' ' + words + ' · ' + Object.keys(menu.codes).length + ' קודי-חיוג'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={FAINT}>הקו ברגע:</span>
          <Chip on={mode === 'now'} onClick={() => setMode('now')}>
            עכשיו
          </Chip>
          <Chip on={mode === 'shabbat'} onClick={() => setMode('shabbat')}>
            🕯 בשבת
          </Chip>
          <Chip on={mode === 'weekday'} onClick={() => setMode('weekday')}>
            ☀ ביום חול
          </Chip>
        </div>
        {menu.closed && (
          <div role="status" style={{ fontSize: 13, color: '#7a5b12' }}>
            🕯 שבת/חג — הקו עונה בהודעת-הסגירה ומנתק: אין תפריט, אין קוד ואין חיבור עד צאת השבת או החג.
          </div>
        )}
        {dups.length > 0 && (
          <div role="status" style={{ fontSize: 13, color: '#a16207' }}>
            {'⚠ קוד-חיוג כפול — הקו לא עונה לו: ' +
              dups.map((d) => d.code + ' (' + d.listings.map((l) => l.name).join(' · ') + ')').join(' · ') +
              '. תנו לאחד מהם קוד אחר בכרטיס.'}
          </div>
        )}

        {node && (
          <div aria-live="polite" style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={FAINT}>
                {[PHONE_KIND_LABELS[node.kind], node.id === menu.root ? 'שורש' : '', node.speech ? '🎙 דיבור או מקשים' : ''].filter(Boolean).join(' · ')}
              </span>
              {tts.state === 'ready' && (
                <Btn sm onClick={speak} title="השמעת הנוסח בקול העברי של המכשיר">
                  🔊 השמעה
                </Btn>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.7 }}>{node.prompt}</div>
            {node.options.length > 0 && (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 13.5, lineHeight: 1.9 }}>
                {node.options.map((o) => (
                  <li key={o.digit + '>' + o.to}>
                    <span dir="ltr" style={KEY_BADGE}>
                      {o.digit}
                    </span>
                    {o.say}
                  </li>
                ))}
              </ul>
            )}
            {node.collect ? (
              <div style={{ fontSize: 13.5 }}>
                {'הוקשו: '}
                <span dir="ltr" style={{ fontWeight: 800, letterSpacing: 4 }}>
                  {(sim.buf + '___').slice(0, Math.max(node.collect, sim.buf.length))}
                </span>
              </div>
            ) : null}
            {node.action?.kind === 'connect' && (
              <div role="note" style={{ fontSize: 13, color: '#7a5b12' }}>
                {'📵 כאן הקו היה מחבר את השיחה אל ' + node.action.label + ' — בסימולטור אין שיחה.'}
              </div>
            )}
            {node.action?.kind === 'readNumber' && (
              <div style={{ fontSize: 13 }}>
                {'🔢 הקו מקריא ספרה-ספרה: '}
                <span dir="ltr">{node.action.groups.join('-')}</span>
              </div>
            )}
            {!listening && <div style={FAINT}>{node.kind === 'closed' ? 'הקו עונה ומנתק.' : 'הקו סיים כאן — הוא לא מקשיב יותר.'} 🔄 מההתחלה — למטה.</div>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div dir="ltr" role="group" aria-label="מקלדת הטלפון" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 56px)', gap: 6 }}>
            {KEYS.map((k) => (
              <button
                key={k}
                type="button"
                className="btn"
                aria-label={'מקש ' + phoneKeyName(k)}
                disabled={!listening}
                onClick={() => press(k)}
                style={{ fontSize: 18, fontWeight: 800, minHeight: 44, justifyContent: 'center', opacity: listening ? 1 : 0.45 }}
              >
                {k}
              </button>
            ))}
          </div>
          <form onSubmit={say} style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 220 }}>
            <label htmlFor="pr-phone-say" style={{ fontSize: 13, fontWeight: 700 }}>
              🎙 אמרו משהו (כמו שמתקשר היה אומר)
            </label>
            <TextInput id="pr-phone-say" value={said} onChange={(v) => setSaid(v.slice(0, 200))} placeholder="יש לי נזילה בכיור…" />
            <div>
              <Btn type="submit" disabled={!listening || !said.trim()}>
                🎙 אמירה
              </Btn>
            </div>
            <div style={FAINT}>
              {!listening
                ? 'הקו לא מקשיב בצומת הזה.'
                : node && !node.speech
                  ? 'בצומת הזה הקו מקבל רק מקשים — דיבור יענה "כאן אפשר רק להקיש".'
                  : 'הקו מזהה מה צריך ומבקש אישור (1) — לעולם לא מחבר ישר מדיבור.'}
            </div>
          </form>
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', fontSize: 12.5 }}>
          <span style={{ color: 'var(--ink-faint)' }}>המסלול:</span>
          {sim.trail.map((s, i) => (
            <span key={i + ':' + s.node.id}>
              {(i ? ' ← ' : '') + (s.via ? '[' + (s.via === '🗣' ? '🗣' : phoneKeyName(s.via)) + '] ' : '') + s.node.label}
            </span>
          ))}
          <Btn sm onClick={() => setSim(simStart(menu))}>
            🔄 מההתחלה
          </Btn>
        </div>
        {tts.state === 'none' && <div style={FAINT}>🔇 אין במכשיר הזה קול עברי להשמעה — הנוסח מוצג למעלה.</div>}
      </section>

      <section className="card" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13 }}>תסריט הקריינות — כל צמתי הקו, הנוסחים, המקשים והפעולות (להקלטה בעתיד):</span>
        {exportOn ? (
          <Btn onClick={downloadScript}>⬇ תסריט הקו</Btn>
        ) : (
          <span style={FAINT}>הורדת התסריט כבויה באשף (תדפיס וייצוא).</span>
        )}
      </section>
    </div>
  );
}
