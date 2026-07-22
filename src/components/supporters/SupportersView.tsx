/**
 * משפחות תומכות (תורמים) — חיפוש מנורמל, סינון קטגוריה ודרגות RFM,
 * טבלה עם מיון תלת-מצבי (עולה/יורד/כבוי), טופס תומכ/ת וכרטיס מפורט.
 */
import { useState, type KeyboardEvent } from 'react';
import type { Supporter } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import { normSearch } from '../../lib/validate';
import { hebDateFull } from '../../lib/hebrew';
import { ayinDailyRows, ayinActive, eyesTotal, featLabel, stageIndex, stageLabel } from '../../lib/ayin';
import { downloadCsv } from '../../lib/csvx';
import { Btn, Chip, Empty, Modal, PageHead, Select, TextInput } from '../ui';
import { chipStyle, fmtDate, isoToday, supScore, supTier, TIER_ORDER, totalLabel } from './lib';
import { SupporterForm } from './SupporterForm';
import { SupporterDetail } from './SupporterDetail';
import { AyinBoard } from './AyinBoard';
import { SupporterImport } from './SupporterImport';
import { CustomExport } from '../reports/CustomExport';

type SortKey =
  | 'name'
  | 'cat'
  | 'phone'
  | 'email'
  | 'count'
  | 'ils'
  | 'usd'
  | 'last'
  | 'nextDate'
  | 'score'
  | 'stage'
  | 'eyes';

const HEAD: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'תומכ/ת' },
  { key: 'cat', label: 'קטגוריה' },
  { key: 'phone', label: 'טלפון' },
  { key: 'email', label: 'אימייל' },
  { key: 'count', label: 'תרומות' },
  { key: 'ils', label: 'סה"כ ₪' },
  { key: 'usd', label: 'סה"כ $' },
  { key: 'last', label: 'תרומה אחרונה' },
  { key: 'nextDate', label: 'קשר הבא' },
  { key: 'score', label: 'ציון RFM' },
  { key: 'stage', label: 'שלב טיפול' },
  { key: 'eyes', label: 'כמות' },
];

function sortVal(sp: Supporter, key: SortKey): string | number {
  switch (key) {
    case 'name':
      return sp.name;
    case 'cat':
      return sp.cat || '';
    case 'phone':
      return sp.phone || '';
    case 'email':
      return sp.email || '';
    case 'count':
      return sp.count;
    case 'ils':
      return sp.ils;
    case 'usd':
      return sp.usd;
    case 'last':
      return sp.last || '';
    case 'nextDate':
      return sp.nextDate || '';
    case 'score':
      return supScore(sp);
    case 'stage':
      return sp.ayin ? stageIndex(sp.ayin.stage) : -1;
    case 'eyes':
      return sp.ayin ? eyesTotal(sp.ayin) : -1;
  }
}

/** צ'יפ דרגת RFM (זהב/כסף/ארד/רדומה) עם הציון בכלי-עזר. */
function TierChip(props: { sp: Supporter }) {
  const score = supScore(props.sp);
  const tier = supTier(score);
  return (
    <span style={chipStyle(tier.bg, tier.c)} title={'ציון משוקלל (R·F·M): ' + score + '/1000'}>
      {tier.label}
    </span>
  );
}

export function SupportersView() {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const rfmOn = featureOn(config, 'supporters.rfm');
  const nextOn = featureOn(config, 'supporters.nextdate');
  const ayinOn = featureOn(config, 'supporters.ayin');
  const importOn = featureOn(config, 'settings.import');
  const toast = useApp((s) => s.toast);

  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [tierF, setTierF] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);

  /** דוח יומי של מעקב הטיפול — כל מי שטופל היום. */
  function dailyReport() {
    const rows = ayinDailyRows(config, db.supporters, isoToday());
    if (rows.length <= 1) {
      toast('עדיין לא עודכן אף פריט היום — עדכנו בכרטיס והדוח יתמלא');
      return;
    }
    downloadCsv('ayin-daily-' + isoToday() + '.csv', rows);
    toast('דוח יומי: ' + (rows.length - 1) + ' פריטים שטופלו היום — הקובץ ירד');
  }

  const selected = db.supporters.find((s) => s.id === selId);
  if (selected) return <SupporterDetail supporter={selected} onBack={() => setSelId(null)} />;

  const today = isoToday();
  const nq = normSearch(q);
  const qd = q.replace(/\D/g, '');

  let list = db.supporters.filter((sp) => {
    if (cat !== 'all' && (sp.cat || '') !== cat) return false;
    if (tierF && supTier(supScore(sp)).label !== tierF) return false;
    if (!q.trim()) return true;
    const phoneHit = qd.length >= 3 && (sp.phone || '').replace(/\D/g, '').includes(qd);
    const textHit =
      !!nq && normSearch([sp.name, sp.email, sp.cat, sp.address, sp.forWho].join(' ')).includes(nq);
    return phoneHit || textHit;
  });

  if (sort) {
    const { key, dir } = sort;
    list = [...list].sort((a, b) => {
      const va = sortVal(a, key);
      const vb = sortVal(b, key);
      const c = typeof va === 'number' ? va - (vb as number) : String(va).localeCompare(String(vb), 'he');
      return c * dir;
    });
  }

  const clickSort = (key: SortKey) =>
    setSort(sort && sort.key === key ? (sort.dir > 0 ? { key, dir: -1 } : null) : { key, dir: 1 });

  const catOptions = [...new Set(db.supporters.map((s) => s.cat).filter(Boolean))];
  const tierCounts: Record<string, number> = { זהב: 0, כסף: 0, ארד: 0, רדומה: 0 };
  for (const sp of db.supporters) tierCounts[supTier(supScore(sp)).label]++;

  const tIls = db.supporters.reduce((a, x) => a + (x.ils || 0), 0);
  const tUsd = db.supporters.reduce((a, x) => a + (x.usd || 0), 0);
  const filtered = q.trim() !== '' || cat !== 'all' || !!tierF;
  const countLabel =
    (filtered ? list.length + ' מתוך ' : '') +
    db.supporters.length +
    ' משפחות תומכות · סה"כ ₪' +
    tIls.toLocaleString('he-IL') +
    ' + $' +
    tUsd.toLocaleString('he-IL');

  const openRowKey = (id: string) => (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelId(id);
    }
  };

  return (
    <div>
      <PageHead
        title="💛 משפחות תומכות"
        sub={countLabel}
        actions={
          <>
            {importOn && (
              <Btn onClick={() => setImportOpen(true)} title="ייבוא תומכות מקובץ CSV">
                ⬆ ייבוא
              </Btn>
            )}
            <Btn onClick={() => setExpOpen(true)} title='דו"ח מותאם — בחירת טווח ונתונים'>
              📊 דו"ח מותאם
            </Btn>
            {ayinOn && (
              <Btn onClick={dailyReport} title={'דוח יומי — ' + featLabel(config)}>
                📋 דוח יומי
              </Btn>
            )}
            <Btn kind="primary" onClick={() => setFormOpen(true)}>
              + תומכת חדשה
            </Btn>
          </>
        }
      />

      {ayinOn && <AyinBoard onOpen={setSelId} />}

      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', minWidth: 220 }}>
          <TextInput value={q} onChange={setQ} placeholder="חיפוש לפי שם, טלפון, מייל או קטגוריה…" />
        </div>
        <Select
          value={cat}
          onChange={setCat}
          options={[{ value: 'all', label: 'כל הקטגוריות' }, ...catOptions.map((c) => ({ value: c, label: c }))]}
        />
      </div>

      {rfmOn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>דרגות (לחיצה מסננת):</span>
          {TIER_ORDER.map((t) => (
            <Chip key={t} on={tierF === t} onClick={() => setTierF(tierF === t ? null : t)}>
              {t + ' · ' + tierCounts[t]}
            </Chip>
          ))}
        </div>
      )}

      {db.supporters.length === 0 ? (
        <Empty>עדיין אין משפחות תומכות — הוסיפו תומכת ראשונה עם "+ תומכת חדשה"</Empty>
      ) : list.length === 0 ? (
        <Empty>לא נמצאו תומכות התואמות את החיפוש והסינון</Empty>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                {HEAD.filter(
                  (h) =>
                    (nextOn || h.key !== 'nextDate') &&
                    (rfmOn || h.key !== 'score') &&
                    (ayinOn || (h.key !== 'stage' && h.key !== 'eyes')),
                ).map((h) => {
                  const dir = sort && sort.key === h.key ? sort.dir : 0;
                  return (
                    <th
                      key={h.key}
                      onClick={() => clickSort(h.key)}
                      style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                      title={'מיון לפי ' + h.label}
                      aria-sort={dir ? (dir > 0 ? 'ascending' : 'descending') : 'none'}
                    >
                      {h.label}
                      {dir ? (dir > 0 ? ' ▲' : ' ▼') : ''}
                    </th>
                  );
                })}
                {rfmOn && <th>דרגה</th>}
              </tr>
            </thead>
            <tbody>
              {list.map((sp) => (
                <tr
                  key={sp.id}
                  onClick={() => setSelId(sp.id)}
                  onKeyDown={openRowKey(sp.id)}
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ fontWeight: 700 }}>{sp.name}</div>
                    {(sp.cat || sp.forWho) && (
                      <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                        {[sp.cat, sp.forWho].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </td>
                  <td>{sp.cat || '—'}</td>
                  <td style={{ direction: 'ltr', textAlign: 'right' }}>{sp.phone || '—'}</td>
                  <td style={{ direction: 'ltr', textAlign: 'right' }}>{sp.email || '—'}</td>
                  <td title="מתי וכמה בכל תרומה — בכרטיס">{sp.count}</td>
                  <td>{sp.ils ? '₪' + sp.ils.toLocaleString('he-IL') : '—'}</td>
                  <td>{sp.usd ? '$' + sp.usd.toLocaleString('he-IL') : '—'}</td>
                  <td title={totalLabel(sp) + (sp.last ? ' · ' + hebDateFull(sp.last) : '')}>
                    {sp.last ? fmtDate(sp.last) : '—'}
                  </td>
                  {nextOn && (
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {sp.nextDate ? (
                        sp.nextDate <= today ? (
                          <span style={{ color: 'var(--red)', fontWeight: 700 }}>🔔 יעד עבר</span>
                        ) : (
                          // התאריך העברי ראשי — הלועזי בשורת משנה (חובה אצל הקהל החרדי)
                          <span title={fmtDate(sp.nextDate)}>
                            🎯 {hebDateFull(sp.nextDate)}
                            <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-faint)' }}>
                              {fmtDate(sp.nextDate)}
                            </span>
                          </span>
                        )
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                  {rfmOn && <td style={{ fontWeight: 700 }}>{supScore(sp)}</td>}
                  {ayinOn && <td>{sp.ayin && ayinActive(sp.ayin) ? stageLabel(config, sp.ayin.stage) : '—'}</td>}
                  {ayinOn && <td>{sp.ayin && eyesTotal(sp.ayin) ? eyesTotal(sp.ayin) : '—'}</td>}
                  {rfmOn && (
                    <td>
                      <TierChip sp={sp} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 14 }}>
        💡 משפחות תומכות אינן מחוברות לקורסים — הן זמינות בחיפוש (⌘K), בלוח השנה (תזכורת 📞) ובגיבויים.
      </p>

      {formOpen && (
        <SupporterForm
          supporter={null}
          onClose={(newId) => {
            setFormOpen(false);
            if (newId) setSelId(newId);
          }}
        />
      )}

      {importOpen && (
        <Modal title="⬆ ייבוא תומכות מ-CSV" onClose={() => setImportOpen(false)}>
          <SupporterImport onDone={() => setImportOpen(false)} />
        </Modal>
      )}

      {expOpen && <CustomExport target="supporters" onClose={() => setExpOpen(false)} />}
    </div>
  );
}
