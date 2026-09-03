/**
 * 💬 צ׳אט-תמיכה חי (17.8) — שיחה דו-כיוונית אמיתית בין הלקוח (הארגון) לתמיכת-
 * אורביט, בזמן-אמת דרך Firestore (onSnapshot). מראה בהשראת בנייה-חכמה (בועות
 * נכנס/יוצא, מפרידי-יום, מחבר-רוד), אבל **חי-באמת** — לא מוקאפ.
 *
 * `SupportChat` = תצוגת-השיחה המשותפת (לקוח + תמיכה). `SupportChatModal` = כניסת-
 * הלקוח מ-❓. `SupportInbox` = תיבת-השיחות של התמיכה (מייל-על, מלוח-הבקרה).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../store/useApp';
import { isoToday } from '../../lib/date-util';
import {
  isSendableSupportText,
  sortSupportMsgs,
  sortSupportThreads,
  sortTeamMsgs,
  supportDayLabel,
  supportMsgTime,
  supportPreview,
  supportUnread,
  type SupportMsg,
  type SupportSide,
  type SupportThread,
  type TeamMsg,
} from '../../lib/supportChat';
import { Modal } from '../ui';
import { parsePortalChat } from '../public/portal';
import { waLink } from '../../lib/wa';

type CloudMod = typeof import('../../store/cloudSync');

/**
 * 📥 כרטיס-פנייה (פאזה 2) — הודעת-צ׳אט שמקורה בשער-ההרשמה בעמוד-השיווק מרונדרת
 * ככרטיס-פעולה: פרטי-הילד/הורה/חוג + חיוג/וואטסאפ ישיר להורה. מחזיר null אם ההודעה
 * אינה בקשת-שער (⇒ הבועה מציגה טקסט רגיל). אפס-שרת — הכול קישורי-URI.
 */
function PortalReqCard({ text, onClose }: { text: string; onClose: () => void }) {
  const openEnrollDraft = useApp((s) => s.openEnrollDraft);
  const req = parsePortalChat(text);
  if (!req) return null;
  const tel = req.phone.replace(/[^\d+]/g, '');
  const wa = req.phone ? waLink(req.phone, 'שלום, בנוגע לבקשת-ההרשמה לחוג — ') : null;
  const row = (label: string, val: string) =>
    val ? (
      <div style={{ fontSize: 13 }}>
        <span style={{ color: 'var(--ink-faint)' }}>{label}: </span>
        <span style={{ fontWeight: 700 }}>{val}</span>
      </div>
    ) : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: '#8a5a1a' }}>📥 בקשת הרשמה לחוג</div>
      {row('ילד/ה', req.childName)}
      {row('הורה', req.parentName)}
      {row('חוג', req.course)}
      {req.phone && <div style={{ fontSize: 13 }} dir="ltr">📞 {req.phone}</div>}
      {row('הערה', req.note)}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, fontWeight: 700, textDecoration: 'none', color: '#12803c', background: '#e4f5ea', borderRadius: 999, padding: '3px 10px' }}>💬 וואטסאפ</a>
        )}
        {tel && (
          <a href={'tel:' + tel} style={{ fontSize: 12.5, fontWeight: 700, textDecoration: 'none', color: '#33477e', background: '#e8ecfa', borderRadius: 999, padding: '3px 10px' }}>📞 חיוג</a>
        )}
        {/* פאזה 3: פנייה⇒שיבוץ — פותח טופס-משפחה עם טלפון+הערת-הפנייה ממולאים */}
        <button
          type="button"
          onClick={() => { openEnrollDraft(req); onClose(); }}
          style={{ fontSize: 12.5, fontWeight: 800, border: 'none', cursor: 'pointer', color: '#fff', background: '#7c5cff', borderRadius: 999, padding: '3px 12px' }}
        >
          ➕ שבץ
        </button>
      </div>
    </div>
  );
}

/** תצוגת-שיחה חיה — בועות + מחבר-רוד. `side` = מי אני (user/admin). */
export function SupportChat({
  uid,
  side,
  mod,
  meta,
}: {
  uid: string;
  side: SupportSide;
  mod: CloudMod;
  meta?: { email?: string; orgName?: string };
}) {
  const toast = useApp((s) => s.toast);
  const [msgs, setMsgs] = useState<SupportMsg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = mod.watchSupportMessages(uid, setMsgs);
    return unsub;
  }, [uid, mod]);

  const sorted = useMemo(() => sortSupportMsgs(msgs), [msgs]);

  // פתחתי / הגיעה הודעה חדשה ⇒ מסמן נקרא לצד שלי + גולל לתחתית
  useEffect(() => {
    void mod.markSupportRead(uid, side);
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sorted.length, uid, side, mod]);

  async function send() {
    const t = text;
    if (!isSendableSupportText(t) || busy) return;
    setBusy(true);
    setText('');
    try {
      if (side === 'user') await mod.sendSupportMessage(uid, meta ?? {}, t);
      else await mod.sendSupportReply(uid, t);
    } catch {
      setText(t); // כשל ⇒ מחזירים את הטקסט לתיבה
      toast('⚠ ההודעה לא נשלחה — בדקו חיבור ונסו שוב');
    } finally {
      setBusy(false);
    }
  }

  const today = isoToday();
  let lastDay = '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'min(60vh, 460px)' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 2px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sorted.length === 0 && (
          <div className="empty" style={{ margin: 'auto', textAlign: 'center', fontSize: 13.5 }}>
            {side === 'user' ? 'כתבו לנו — נשמח לעזור 💬' : 'אין הודעות עדיין'}
          </div>
        )}
        {sorted.map((m, i) => {
          const mine = m.from === side;
          const day = supportDayLabel(m.at, today);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={i}>
              {showDay && (
                <div style={{ textAlign: 'center', margin: '10px 0 6px' }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-faint)', background: 'var(--bg-soft, rgba(127,127,127,.1))', borderRadius: 10, padding: '2px 10px' }}>
                    {day}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: mine ? 'flex-start' : 'flex-end' }}>
                <div
                  style={{
                    maxWidth: '78%',
                    background: mine ? 'var(--accent)' : 'var(--bg-soft, rgba(127,127,127,.12))',
                    color: mine ? '#fff' : 'var(--ink)',
                    borderRadius: 16,
                    borderBottomRightRadius: mine ? 16 : 4,
                    borderBottomLeftRadius: mine ? 4 : 16,
                    padding: '7px 12px',
                    fontSize: 14.5,
                    lineHeight: 1.45,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {m.text}
                  <span style={{ display: 'block', fontSize: 10.5, opacity: 0.7, textAlign: 'start', marginTop: 2 }}>
                    {supportMsgTime(m.at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--line, rgba(127,127,127,.15))' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="כתבו הודעה…"
          rows={1}
          style={{ flex: 1, resize: 'none', borderRadius: 22, border: '1px solid var(--line, rgba(127,127,127,.25))', padding: '10px 14px', fontSize: 14.5, fontFamily: 'inherit', maxHeight: 120 }}
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={busy || !isSendableSupportText(text)}
          aria-label="שליחה"
          style={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 18, cursor: 'pointer', opacity: busy || !isSendableSupportText(text) ? 0.5 : 1 }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

/** כניסת-הלקוח מ-❓ — מודאל צ׳אט עם התמיכה. השיחה = ה-uid של המשתמש. */
export function SupportChatModal({ onClose }: { onClose: () => void }) {
  const user = useApp((s) => s.cloud.user);
  const orgName = useApp((s) => s.config.orgName);
  const [mod, setMod] = useState<CloudMod | null>(null);
  useEffect(() => {
    void import('../../store/cloudSync').then(setMod).catch(() => { /* צ׳אנק לא נטען */ });
  }, []);
  return (
    <Modal title="💬 צ׳אט עם התמיכה" onClose={onClose}>
      {!user ? (
        <div className="empty">צ׳אט התמיכה זמין אחרי התחברות לחשבון.</div>
      ) : !mod ? (
        <div className="empty">טוען…</div>
      ) : (
        <SupportChat uid={user.uid} side="user" mod={mod} meta={{ email: user.email, orgName }} />
      )}
    </Modal>
  );
}

/** תיבת-השיחות של התמיכה (מייל-על) — רשימת-שיחות חיה + פתיחת-שיחה. */
export function SupportInbox({ onClose }: { onClose: () => void }) {
  const [mod, setMod] = useState<CloudMod | null>(null);
  const [threads, setThreads] = useState<Array<SupportThread & { uid: string }>>([]);
  const [open, setOpen] = useState<(SupportThread & { uid: string }) | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    // דליפת-מאזין: החזרת unsub מתוך callback של .then אינה ה-cleanup של useEffect ⇒
    // watchAllSupportThreads לא בוטל אף פעם (onSnapshot חי + setThreads על רכיב מפורק).
    // כמו TeamChatModal: unsub בסקופ-חיצוני + cleanup אמיתי מה-effect.
    let unsub: (() => void) | undefined;
    let alive = true; // ביקורת-עומק 2.9: סגירה לפני פתרון-הצ׳אנק ⇒ onSnapshot יתום
    void import('../../store/cloudSync').then((m) => {
      if (!alive) return;
      setMod(m);
      unsub = m.watchAllSupportThreads(setThreads);
    }).catch(() => { /* צ׳אנק לא נטען */ });
    return () => { alive = false; unsub?.(); };
  }, []);

  const shown = useMemo(() => {
    const sorted = sortSupportThreads(threads);
    const t = q.trim().toLowerCase();
    if (!t) return sorted;
    return sorted.filter((x) => `${x.orgName ?? ''} ${x.email ?? ''} ${x.lastText ?? ''}`.toLowerCase().includes(t));
  }, [threads, q]);

  if (open && mod) {
    return (
      <Modal title={`💬 ${open.orgName || open.email || 'שיחה'}`} onClose={() => setOpen(null)}>
        <button type="button" className="chip" onClick={() => setOpen(null)} style={{ marginBottom: 8 }}>← כל השיחות</button>
        <SupportChat uid={open.uid} side="admin" mod={mod} />
      </Modal>
    );
  }

  return (
    <Modal title="💬 שיחות תמיכה" onClose={onClose}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔎 חיפוש שיחה…"
        style={{ width: '100%', borderRadius: 22, border: '1px solid var(--line, rgba(127,127,127,.25))', padding: '9px 14px', fontSize: 14, marginBottom: 10 }}
      />
      {shown.length === 0 ? (
        <div className="empty">אין שיחות עדיין.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {shown.map((t) => {
            const unread = supportUnread(t, 'admin');
            return (
              <button
                key={t.uid}
                type="button"
                onClick={() => setOpen(t)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'start', borderRadius: 10 }}
              >
                <span style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 16 }}>
                  {(t.orgName || t.email || '?').trim().charAt(0).toUpperCase()}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <b style={{ fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.orgName || t.email || t.uid.slice(0, 6)}</b>
                    <span style={{ fontSize: 11, color: 'var(--ink-faint)', flexShrink: 0 }}>{t.lastAt ? supportMsgTime(t.lastAt) : ''}</span>
                  </span>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.lastFrom === 'admin' ? 'את/ה: ' : ''}{supportPreview(t.lastText)}
                    </span>
                    {unread > 0 && (
                      <span style={{ flexShrink: 0, minWidth: 20, height: 20, borderRadius: 10, background: 'var(--accent)', color: '#fff', fontSize: 11.5, fontWeight: 700, display: 'grid', placeItems: 'center', padding: '0 6px' }}>
                        {unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

/**
 * 💬 צ׳אט-צוות תוך-ארגוני (17.8) — ערוץ-קבוצה אחד לכל אנשי-הצוות של הארגון.
 * חי דרך Firestore (teamChats/{slug}/messages). "שלי" = sender==המייל-שלי;
 * בבועות-אחרים מוצג שם-השולח. מגודר `shell.teamchat` (הכניסה ב-App).
 */
export function TeamChatModal({ onClose }: { onClose: () => void }) {
  const user = useApp((s) => s.cloud.user);
  const slug = useApp((s) => s.config.slug) || 'default';
  const toast = useApp((s) => s.toast);
  const [mod, setMod] = useState<CloudMod | null>(null);
  const [msgs, setMsgs] = useState<TeamMsg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let alive = true;
    void import('../../store/cloudSync').then((m) => {
      if (!alive) return;
      setMod(m);
      unsub = m.watchTeamMessages(slug, setMsgs);
    }).catch(() => { /* צ׳אנק לא נטען */ });
    return () => { alive = false; unsub?.(); };
  }, [slug]);

  const sorted = useMemo(() => sortTeamMsgs(msgs), [msgs]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [sorted.length]);

  const myEmail = (user?.email ?? '').toLowerCase();
  const myName = myEmail.split('@')[0] || 'אני';

  async function send() {
    const t = text;
    if (!isSendableSupportText(t) || busy || !mod || !user) return;
    setBusy(true);
    setText('');
    try {
      await mod.sendTeamMessage(slug, myEmail, myName, t);
    } catch {
      setText(t);
      toast('⚠ ההודעה לא נשלחה — בדקו חיבור ונסו שוב');
    } finally {
      setBusy(false);
    }
  }

  const today = isoToday();
  let lastDay = '';

  return (
    <Modal title="💬 צ׳אט הצוות" onClose={onClose}>
      {!user ? (
        <div className="empty">צ׳אט הצוות זמין אחרי התחברות לחשבון.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'min(60vh, 460px)' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 2px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sorted.length === 0 && (
              <div className="empty" style={{ margin: 'auto', textAlign: 'center', fontSize: 13.5 }}>
                אין הודעות עדיין — כתבו לצוות 💬
              </div>
            )}
            {sorted.map((m, i) => {
              const mine = (m.sender ?? '').toLowerCase() === myEmail;
              const day = supportDayLabel(m.at, today);
              const showDay = day !== lastDay;
              lastDay = day;
              return (
                <div key={i}>
                  {showDay && (
                    <div style={{ textAlign: 'center', margin: '10px 0 6px' }}>
                      <span style={{ fontSize: 11, color: 'var(--ink-faint)', background: 'var(--bg-soft, rgba(127,127,127,.1))', borderRadius: 10, padding: '2px 10px' }}>{day}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: mine ? 'flex-start' : 'flex-end' }}>
                    <div
                      style={{
                        maxWidth: '78%',
                        background: mine ? 'var(--accent)' : 'var(--bg-soft, rgba(127,127,127,.12))',
                        color: mine ? '#fff' : 'var(--ink)',
                        borderRadius: 16,
                        borderBottomRightRadius: mine ? 16 : 4,
                        borderBottomLeftRadius: mine ? 4 : 16,
                        padding: '7px 12px',
                        fontSize: 14.5,
                        lineHeight: 1.45,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {!mine && (
                        <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, opacity: 0.85, marginBottom: 1 }}>{m.name || (m.sender ?? '').split('@')[0]}</span>
                      )}
                      {/* פאזה 2: בקשת-שער מרונדרת ככרטיס-פעולה; אחרת טקסט רגיל */}
                      {parsePortalChat(m.text) ? <PortalReqCard text={m.text} onClose={onClose} /> : m.text}
                      <span style={{ display: 'block', fontSize: 10.5, opacity: 0.7, textAlign: 'start', marginTop: 2 }}>{supportMsgTime(m.at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--line, rgba(127,127,127,.15))' }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
              placeholder="כתבו לצוות…"
              rows={1}
              style={{ flex: 1, resize: 'none', borderRadius: 22, border: '1px solid var(--line, rgba(127,127,127,.25))', padding: '10px 14px', fontSize: 14.5, fontFamily: 'inherit', maxHeight: 120 }}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={busy || !isSendableSupportText(text)}
              aria-label="שליחה"
              style={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 18, cursor: 'pointer', opacity: busy || !isSendableSupportText(text) ? 0.5 : 1 }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
