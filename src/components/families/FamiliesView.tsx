/**
 * CRM המשפחות — רשימה/גריד (נשמר ב-db.ui.famView), חיפוש חכם (סבלני לשגיאות
 * הקלדה ולתעתיק) + צ'יפים של חיזוי, סינון סטטוס/עיר/קהילה, מיון בלחיצה על
 * כותרת עמודה, שורת סינון-עמודות, פאנל סינון מורחב וגלגל מאתר המשפחות.
 */
import { useEffect, useState, type KeyboardEvent } from 'react';
import type { Family } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import { levenshtein, smartFilter } from '../../lib/search';
import { normSearch } from '../../lib/validate';
import { hebDateFull } from '../../lib/hebrew';
import { Btn, Empty, PageHead, Select, TextInput } from '../ui';
import { chipStyle, famEnrollments, finderAxisValue, numMatch, STATUS_META, tierOf } from './lib';
import { FamilyFinder } from './FamilyFinder';
import { FamilyForm } from './FamilyForm';
import { FamilyDetail } from './FamilyDetail';

function kidsOf(f: Family) {
  return f.members.filter((m) => !m.isParent);
}

function TierDot(props: { f: Family }) {
  const tier = tierOf(props.f.cred.score);
  return (
    <span
      title={'מדד אמינות: ' + props.f.cred.score + ' — ' + tier.label}
      style={{
        display: 'inline-block',
        width: 9,
        height: 9,
        borderRadius: 99,
        background: tier.dot,
        flex: 'none',
      }}
    />
  );
}

type SortKey = 'name' | 'phone' | 'kids' | 'courses' | 'status';

const EMPTY_COLF = { name: '', phone: '', kids: '', courses: '', status: 'all' };

/** מסנני הפאנל המורחב — 'all' = לא מסנן. */
const EMPTY_ADV = { mar: 'all', lang: 'all', sefach: 'all', kids: 'all', enrolled: 'all', tier: 'all' };

const TIER_OPTIONS = [
  { value: 'all', label: 'הכל' },
  { value: 'titan', label: 'טיטאן (950+)' },
  { value: 'lion', label: 'לביאה (800+)' },
  { value: 'pale', label: 'טעון שיפור (500+)' },
  { value: 'red', label: 'סיכון (<500)' },
];

const YES_NO = (yes: string, no: string) => [
  { value: 'all', label: 'הכל' },
  { value: 'yes', label: yes },
  { value: 'no', label: no },
];

export function FamiliesView() {
  const db = useApp((s) => s.db);
  const setDb = useApp((s) => s.setDb);
  const selFamilyId = useApp((s) => s.selFamilyId);
  const selectFamily = useApp((s) => s.selectFamily);
  const config = useApp((s) => s.config);
  const credOn = featureOn(config, 'families.cred');
  const finderOn = featureOn(config, 'families.finder');

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [city, setCity] = useState('all');
  const [comm, setComm] = useState('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const [colFOn, setColFOn] = useState(false);
  const [colF, setColF] = useState(EMPTY_COLF);
  const [advOn, setAdvOn] = useState(false);
  const [adv, setAdv] = useState(EMPTY_ADV);
  const [commMulti, setCommMulti] = useState<string[]>([]);
  const [finderOpen, setFinderOpen] = useState(false);
  const [fwLocks, setFwLocks] = useState<Record<string, string>>({});
  const [fwRot, setFwRot] = useState(0);
  const [formOpen, setFormOpen] = useState(false);

  // בקשת "משפחה חדשה" מהכרום (כותרת צֹהַר / פעולות מהירות) — אותו טופס בדיוק
  const famFormReq = useApp((s) => s.famFormReq);
  const ackFamilyForm = useApp((s) => s.ackFamilyForm);
  useEffect(() => {
    if (famFormReq) {
      setFormOpen(true);
      ackFamilyForm();
    }
  }, [famFormReq, ackFamilyForm]);

  const selected = db.families.find((f) => f.id === selFamilyId);
  if (selected) return <FamilyDetail family={selected} />;

  const famView = db.ui.famView;
  const toggleView = () =>
    setDb((d) => ({ ui: { ...d.ui, famView: d.ui.famView === 'grid' ? 'list' : 'grid' } }));

  const prefiltered = db.families.filter((f) => {
    if (status !== 'all' && f.status !== status) return false;
    if (city !== 'all' && f.city !== city) return false;
    if (comm !== 'all' && f.community !== comm) return false;
    if (commMulti.length && !commMulti.includes(f.community)) return false;
    // גלגל המאתר פתוח — נעילותיו מסננות את הטבלה חי
    if (finderOpen && !Object.entries(fwLocks).every(([k, v]) => finderAxisValue(db, f, k) === v)) return false;
    // שורת סינון-עמודות
    if (colF.name.trim() && !normSearch([f.name, f.father, f.mother].join(' ')).includes(normSearch(colF.name))) return false;
    if (colF.phone.trim()) {
      const pd = colF.phone.replace(/\D/g, '');
      if (!pd || !((f.phone || '') + (f.phone2 || '')).replace(/\D/g, '').includes(pd)) return false;
    }
    if (!numMatch(colF.kids, kidsOf(f).length)) return false;
    if (!numMatch(colF.courses, famEnrollments(db, f).length)) return false;
    if (colF.status !== 'all' && f.status !== colF.status) return false;
    // הפאנל המורחב
    if (adv.mar !== 'all' && (f.maritalStatus || '') !== adv.mar) return false;
    if (adv.lang !== 'all' && (f.language || '') !== adv.lang) return false;
    if (adv.sefach !== 'all' && f.fullSefach !== (adv.sefach === 'yes')) return false;
    if (adv.kids !== 'all' && kidsOf(f).length > 0 !== (adv.kids === 'yes')) return false;
    if (adv.enrolled !== 'all' && famEnrollments(db, f).length > 0 !== (adv.enrolled === 'yes')) return false;
    if (adv.tier !== 'all' && tierOf(f.cred?.score ?? 700).key !== adv.tier) return false;
    return true;
  });
  // חיפוש חכם — סבלני לשגיאות הקלדה ולתעתיק עברית/לועזית
  const searched = q.trim()
    ? smartFilter(q, prefiltered, (f) =>
        [
          f.name,
          f.father,
          f.mother,
          f.city,
          f.community,
          (f.phone || '').replace(/\D/g, ''),
          (f.phone2 || '').replace(/\D/g, ''),
          ...f.members.map((m) => m.first),
        ].filter(Boolean),
      )
    : prefiltered;

  const sortVal = (f: Family, key: SortKey): string | number =>
    key === 'name' ? f.name
    : key === 'phone' ? f.phone || ''
    : key === 'kids' ? kidsOf(f).length
    : key === 'courses' ? famEnrollments(db, f).length
    : { active: 0, pending: 1, inactive: 2 }[f.status] ?? 3;
  const filtered = sort
    ? [...searched].sort((a, b) => {
        const va = sortVal(a, sort.key);
        const vb = sortVal(b, sort.key);
        const c = typeof va === 'string' ? va.localeCompare(String(vb), 'he') : va - (vb as number);
        return c * sort.dir;
      })
    : searched;

  const clickSort = (key: SortKey) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  // צ'יפים של חיזוי — השלמת המילה האחרונה משמות/ערים/קהילות קיימים
  const lastTok = normSearch(q.trim().split(/\s+/).pop() ?? '');
  const suggests: string[] = [];
  if (lastTok) {
    const seen = new Set<string>();
    outer: for (const f of db.families) {
      for (const t of [f.name, f.father, f.mother, f.city, f.community, ...f.members.map((m) => m.first)]) {
        if (!t) continue;
        const nt = normSearch(t);
        if (!nt || nt === lastTok || seen.has(nt)) continue;
        if (nt.startsWith(lastTok) || (lastTok.length >= 3 && levenshtein(lastTok, nt) <= 1)) {
          seen.add(nt);
          suggests.push(t);
          if (suggests.length >= 7) break outer;
        }
      }
    }
  }
  const applySuggest = (t: string) => {
    const parts = q.trim().split(/\s+/);
    parts[parts.length - 1] = t;
    setQ(parts.join(' ') + ' ');
  };

  const cityOptions = [...new Set(db.families.map((f) => f.city).filter(Boolean))];
  const commOptions = [...new Set(db.families.map((f) => f.community).filter(Boolean))];
  const marOptions = [...new Set(db.families.map((f) => f.maritalStatus).filter(Boolean))];
  const langOptions = [...new Set(db.families.map((f) => f.language).filter(Boolean))];
  const totalKids = filtered.reduce((a, f) => a + kidsOf(f).length, 0);

  const colFActive = colF.name.trim() !== '' || colF.phone.trim() !== '' || colF.kids.trim() !== '' || colF.courses.trim() !== '' || colF.status !== 'all';
  const advCount =
    Object.values(adv).filter((v) => v !== 'all').length + (commMulti.length ? 1 : 0);

  const clearAll = () => {
    setQ('');
    setStatus('all');
    setCity('all');
    setComm('all');
    setColF(EMPTY_COLF);
    setAdv(EMPTY_ADV);
    setCommMulti([]);
    setSort(null);
  };

  /** החלת נעילות הגלגל על המסננים הרגילים — כמו fwApply במקור. */
  const applyFinder = () => {
    const l = fwLocks;
    const stRev: Record<string, string> = { פעילה: 'active', ממתינה: 'pending', 'לא פעילה': 'inactive' };
    const tierRev: Record<string, string> = { טיטאן: 'titan', לביאה: 'lion', 'טעון שיפור': 'pale', 'סיכון נטישה': 'red' };
    if (l.city) setCity(l.city);
    if (l.comm) setComm(l.comm);
    if (l.status) setStatus(stRev[l.status] ?? 'all');
    setAdv({
      mar: l.marital && l.marital !== 'לא ידוע' ? l.marital : 'all',
      lang: l.lang ?? 'all',
      sefach: l.sefach ? (l.sefach === 'קיים' ? 'yes' : 'no') : 'all',
      kids: l.kids ? (l.kids === 'עם ילדים' ? 'yes' : 'no') : 'all',
      enrolled: l.enrolled ? (l.enrolled === 'משתתפות בחוגים' ? 'yes' : 'no') : 'all',
      tier: l.cred ? (tierRev[l.cred] ?? 'all') : 'all',
    });
    setAdvOn(true);
    setFinderOpen(false);
    setFwLocks({});
  };

  const openRowKey = (id: string) => (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectFamily(id);
    }
  };

  const thSort = (key: SortKey, label: string) => (
    <th
      onClick={() => clickSort(key)}
      title="מיון לפי העמודה — לחיצה נוספת הופכת כיוון"
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      {label}{' '}
      <span style={{ fontSize: 10, opacity: sort?.key === key ? 1 : 0.35 }}>
        {sort?.key === key ? (sort.dir === 1 ? '▲' : '▼') : '↕'}
      </span>
    </th>
  );

  const colInput = (field: 'name' | 'phone' | 'kids' | 'courses', placeholder: string) => (
    <th style={{ padding: '4px 8px' }}>
      <input
        value={colF[field]}
        onChange={(e) => setColF({ ...colF, [field]: e.target.value })}
        placeholder={placeholder}
        style={{ width: '100%', minWidth: 64, padding: '5px 8px', fontSize: 12 }}
      />
    </th>
  );

  return (
    <div>
      <PageHead
        title="משפחות"
        sub={filtered.length + ' משפחות · ' + totalKids + ' ילדים'}
        actions={
          <>
            <Btn onClick={toggleView} title="החלפת תצוגה: רשימה / גריד">
              {famView === 'grid' ? '☰ רשימה' : '▦ גריד'}
            </Btn>
            <Btn kind="primary" onClick={() => setFormOpen(true)}>
              + משפחה חדשה
            </Btn>
          </>
        }
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', minWidth: 220 }}>
          <TextInput value={q} onChange={setQ} placeholder="חיפוש לפי שם משפחה, הורה, ילד או טלפון…" />
        </div>
        <Select
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'כל הסטטוסים' },
            { value: 'active', label: 'פעילה' },
            { value: 'pending', label: 'ממתינה' },
            { value: 'inactive', label: 'לא פעילה' },
          ]}
        />
        <Select
          value={city}
          onChange={setCity}
          options={[{ value: 'all', label: 'כל הערים' }, ...cityOptions.map((c) => ({ value: c, label: c }))]}
        />
        <Select
          value={comm}
          onChange={setComm}
          options={[{ value: 'all', label: 'כל הקהילות' }, ...commOptions.map((c) => ({ value: c, label: c }))]}
        />
        {famView === 'list' && (
          <Btn
            onClick={() => setColFOn(!colFOn)}
            title="שורת סינון מתחת לכל עמודה: שם, טלפון, ילדים (3 / 3+ / 2-4), חוגים וסטטוס"
            kind={colFOn || colFActive ? 'primary' : undefined}
          >
            ⏷ סינון עמודות
          </Btn>
        )}
        <Btn
          onClick={() => setAdvOn(!advOn)}
          title="מסננים מתקדמים: מצב משפחתי, שפה, ספח, ילדים, חוגים ומדד אמינות"
          kind={advOn || advCount > 0 ? 'primary' : undefined}
        >
          ✦ סינון מורחב{advCount > 0 ? ' · ' + advCount : ''}
        </Btn>
        {finderOn && (
          <Btn
            onClick={() => {
              setFinderOpen(!finderOpen);
              if (finderOpen) setFwLocks({});
            }}
            title="מאתר המשפחות — הגלגל נפתח כאן בדף והטבלה מסתננת חי"
            kind={finderOpen ? 'primary' : undefined}
          >
            🎡 מאתר המשפחות
          </Btn>
        )}
      </div>

      {suggests.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '-6px 0 12px', alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink-faint)' }}>חיזוי:</span>
          {suggests.map((t) => (
            <button key={t} type="button" className="chip" onClick={() => applySuggest(t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      {advOn && (
        <div
          className="card"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end', marginBottom: 14, padding: '12px 14px' }}
        >
          <div className="field" style={{ margin: 0 }}>
            <label>מצב משפחתי</label>
            <Select
              value={adv.mar}
              onChange={(v) => setAdv({ ...adv, mar: v })}
              options={[{ value: 'all', label: 'הכל' }, ...marOptions.map((m) => ({ value: m, label: m }))]}
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>שפה מדוברת</label>
            <Select
              value={adv.lang}
              onChange={(v) => setAdv({ ...adv, lang: v })}
              options={[{ value: 'all', label: 'הכל' }, ...langOptions.map((l) => ({ value: l, label: l }))]}
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>ספח מלא</label>
            <Select value={adv.sefach} onChange={(v) => setAdv({ ...adv, sefach: v })} options={YES_NO('קיים ✓', 'חסר')} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>ילדים רשומים</label>
            <Select value={adv.kids} onChange={(v) => setAdv({ ...adv, kids: v })} options={YES_NO('עם ילדים', 'בלי ילדים')} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>השתתפות בחוגים</label>
            <Select
              value={adv.enrolled}
              onChange={(v) => setAdv({ ...adv, enrolled: v })}
              options={YES_NO('משתתפות', 'לא משתתפות')}
            />
          </div>
          {credOn && (
            <div className="field" style={{ margin: 0 }}>
              <label>מדד אמינות</label>
              <Select value={adv.tier} onChange={(v) => setAdv({ ...adv, tier: v })} options={TIER_OPTIONS} />
            </div>
          )}
          {commOptions.length > 1 && (
            <div style={{ flexBasis: '100%', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-faint)' }}>תת-קהילות (בחירה מרובה):</span>
              {commOptions.map((c) => {
                const on = commMulti.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    className={'chip' + (on ? ' on' : '')}
                    onClick={() => setCommMulti(on ? commMulti.filter((x) => x !== c) : [...commMulti, c])}
                  >
                    {on ? '✓ ' : ''}
                    {c}
                  </button>
                );
              })}
            </div>
          )}
          <Btn onClick={clearAll} kind="danger" sm>
            נקה הכל
          </Btn>
        </div>
      )}

      {finderOn && finderOpen && (
        <FamilyFinder
          db={db}
          locks={fwLocks}
          rot={fwRot}
          onLocks={(locks, spin) => {
            setFwLocks(locks);
            setFwRot((r) => r + spin);
          }}
          onApply={applyFinder}
          onClose={() => {
            setFinderOpen(false);
            setFwLocks({});
          }}
          onOpenFamily={selectFamily}
        />
      )}

      {db.families.length === 0 ? (
        <Empty>עדיין אין משפחות במערכת — הוסיפו משפחה ראשונה עם "+ משפחה חדשה"</Empty>
      ) : filtered.length === 0 ? (
        <Empty>לא נמצאו משפחות התואמות את החיפוש והסינון</Empty>
      ) : famView === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {filtered.map((f) => {
            const st = STATUS_META[f.status];
            const kids = kidsOf(f);
            const parents = [f.father, f.mother].filter(Boolean).join(' ו');
            return (
              <div
                key={f.id}
                className="card"
                role="button"
                tabIndex={0}
                onClick={() => selectFamily(f.id)}
                onKeyDown={openRowKey(f.id)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {credOn && <TierDot f={f} />}
                  <span style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>משפחת {f.name}</span>
                  <span style={chipStyle(st.bg, st.c)}>{st.label}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                  {[parents, f.city].filter(Boolean).join(' · ') || '—'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}>
                  {kids.length} ילדים · {famEnrollments(db, f).length} חוגים
                  {f.createdAt ? ' · נרשמה ' + hebDateFull(f.createdAt) : ''}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                {thSort('name', 'משפחה')}
                <th>הורים</th>
                {thSort('phone', 'טלפון')}
                {thSort('kids', 'ילדים')}
                {thSort('courses', 'חוגים')}
                {thSort('status', 'סטטוס')}
              </tr>
              {colFOn && (
                <tr>
                  {colInput('name', 'שם/הורה…')}
                  <th />
                  {colInput('phone', 'טלפון…')}
                  {colInput('kids', '3 / 3+ / 2-4')}
                  {colInput('courses', '1 / 1+')}
                  <th style={{ padding: '4px 8px' }}>
                    <select
                      value={colF.status}
                      onChange={(e) => setColF({ ...colF, status: e.target.value })}
                      style={{ width: '100%', padding: '5px 6px', fontSize: 12 }}
                    >
                      <option value="all">הכל</option>
                      <option value="active">פעילה</option>
                      <option value="pending">ממתינה</option>
                      <option value="inactive">לא פעילה</option>
                    </select>
                  </th>
                </tr>
              )}
            </thead>
            <tbody>
              {filtered.map((f) => {
                const st = STATUS_META[f.status];
                const kids = kidsOf(f);
                const kidsLine = kids.length
                  ? kids
                      .slice(0, 3)
                      .map((m) => m.first)
                      .join(', ') + (kids.length > 3 ? ' +' + (kids.length - 3) : '')
                  : '—';
                const enrolls = famEnrollments(db, f).length;
                return (
                  <tr
                    key={f.id}
                    onClick={() => selectFamily(f.id)}
                    onKeyDown={openRowKey(f.id)}
                    tabIndex={0}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        {credOn && <TierDot f={f} />}
                        <span style={{ fontWeight: 700 }}>משפחת {f.name}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{kidsLine}</div>
                    </td>
                    <td>{[f.father, f.mother].filter(Boolean).join(' ו') || '—'}</td>
                    <td style={{ direction: 'ltr', textAlign: 'right' }}>{f.phone || '—'}</td>
                    <td>{kids.length}</td>
                    <td>{enrolls || '—'}</td>
                    <td>
                      <span style={chipStyle(st.bg, st.c)}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && <FamilyForm family={null} onClose={() => setFormOpen(false)} />}
    </div>
  );
}
