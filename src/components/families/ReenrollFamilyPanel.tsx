/**
 * פאנל רישום-לשנה-הבאה בכרטיס-המשפחה (courses.reenroll · חיווט-לכרטיס).
 * ------------------------------------------------------------------
 * מציג לכל ילד/ה במשפחה את השיבוצים שלו/ה עם החלטת-ההמשך (ממשיך/בהמתנה/עוזב),
 * כפתור היסטוריה (איפה השתתף/ה ומתי), ורישום-לשנה-הבאה (בחירת חוג-יעד+קבוצה).
 * מגודר opt-in מפורש (===true) + תת-דגל familypanel; כבוי ⇒ מוסתר לגמרי.
 */
import { useMemo, useState } from 'react';
import type { Family } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn, moduleOn, termOf } from '../../lib/config';
import { Btn, Empty } from '../ui';
import { enrollSummary, renewOf, isRenewed } from '../courses/reenroll-lib';
import { HistoryModal, RegisterModal } from '../courses/ReenrollModals';

const DEC_META: Record<string, { label: string; bg: string; c: string }> = {
  yes: { label: '✅ ממשיך', bg: '#e3f5e8', c: '#2f7d52' },
  hold: { label: '⏸ בהמתנה', bg: '#fdf1d6', c: '#a5651a' },
  no: { label: '✖ עוזב', bg: '#fbe6e2', c: '#b04530' },
};

export function ReenrollFamilyPanel(props: { fam: Family }) {
  const enrollments = useApp((s) => s.db.enrollments);
  const courses = useApp((s) => s.db.courses);
  const cfg = useApp((s) => s.config);
  const setRenewDecision = useApp((s) => s.setRenewDecision);
  const go = useApp((s) => s.go);

  const [regEnrollId, setRegEnrollId] = useState<string | null>(null);
  const [histMember, setHistMember] = useState<{ id: string; name: string } | null>(null);

  const reenrollOn = cfg?.features?.['courses.reenroll'] === true;
  const panelOn = reenrollOn && featureOn(cfg, 'courses.reenroll.familypanel');
  const studentW = termOf(cfg, 'entity.student', 'תלמיד/ה');

  const memberIds = useMemo(() => new Set(props.fam.members.map((m) => m.id)), [props.fam.members]);
  const rows = useMemo(
    () =>
      enrollments
        .filter((e) => memberIds.has(e.memberId))
        .map((e) => ({
          e,
          first: props.fam.members.find((m) => m.id === e.memberId)?.first ?? '',
          courseName: courses.find((c) => c.id === e.courseId)?.name ?? '—',
          decision: renewOf(e),
          renewed: isRenewed(e),
          summary: enrollSummary(e),
        })),
    [enrollments, memberIds, courses, props.fam.members],
  );

  if (!panelOn || !moduleOn(cfg, 'courses')) return null;

  const regEnroll = regEnrollId ? enrollments.find((e) => e.id === regEnrollId) ?? null : null;

  return (
    <section className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>🗓 רישום לשנה הבאה</h3>
        <Btn sm onClick={() => go('reenroll')} title="מעבר למסך הרישום המלא">
          למסך המלא ←
        </Btn>
      </div>

      {rows.length === 0 ? (
        <Empty>אין {termOf(cfg, 'entity.enrollments', 'שיבוצים')} ל{studentW} במשפחה.</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => (
            <div
              key={r.e.id}
              style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, borderTop: '1px solid var(--line, #eee)', paddingTop: 8 }}
            >
              <span style={{ fontWeight: 700 }}>{r.first || '—'}</span>
              <span style={{ color: 'var(--ink-faint, #8a8378)', fontSize: 13 }}>· {r.courseName}</span>
              <button
                type="button"
                title={'היסטוריה מלאה — איפה השתתף/ה ומתי'}
                aria-label={'היסטוריה של ' + r.first}
                onClick={() => setHistMember({ id: r.e.memberId, name: r.first })}
                style={{ cursor: 'pointer', border: 0, background: 'transparent', fontSize: 14, padding: 0 }}
              >
                🕘
              </button>
              <span style={{ flex: 1 }} />

              {/* צ׳יפי-החלטה — אותה סמנטיקה כמו במסך המלא */}
              <div style={{ display: 'inline-flex', gap: 4 }}>
                {(['yes', 'hold', 'no'] as const).map((d) => {
                  const active = r.decision === d;
                  const m = DEC_META[d];
                  return (
                    <button
                      key={d}
                      type="button"
                      title={m.label}
                      onClick={() => setRenewDecision(r.e.id, active ? '' : d, r.e.renewNote)}
                      style={{
                        cursor: 'pointer',
                        border: active ? `1px solid ${m.c}` : '1px solid #ddd',
                        background: active ? m.bg : 'var(--panel, #fff)',
                        color: active ? m.c : '#999',
                        borderRadius: 8,
                        padding: '3px 7px',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {m.label.split(' ')[0]}
                    </button>
                  );
                })}
              </div>

              {r.renewed ? (
                <span style={{ color: '#2f7d52', fontWeight: 700, fontSize: 13 }}>✓ נרשם</span>
              ) : (
                <Btn sm onClick={() => setRegEnrollId(r.e.id)} disabled={r.decision === 'no'} title={r.decision === 'no' ? 'סומן «עוזב»' : 'רישום לשנה הבאה'}>
                  רישום ←
                </Btn>
              )}
            </div>
          ))}
        </div>
      )}

      {regEnroll && <RegisterModal enrollment={regEnroll} onClose={() => setRegEnrollId(null)} />}
      {histMember && <HistoryModal memberId={histMember.id} memberName={histMember.name} onClose={() => setHistMember(null)} />}
    </section>
  );
}
