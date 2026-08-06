/**
 * משפחות תומכות (תורמים) — חיפוש מנורמל, סינון קטגוריה ודרגות RFM,
 * טבלה עם מיון תלת-מצבי (עולה/יורד/כבוי), טופס תומכ/ת וכרטיס מפורט.
 */
import { useEffect, useState, type KeyboardEvent } from 'react';
import type { Supporter } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn, integrationOn, integrationSetting, safeHttpsUrl, termOf } from '../../lib/config';
import { WaBtn } from '../WaBtn';
import { IncomingPaymentsModal } from './IncomingPayments';
import { annualAllLines, downloadAnnualReport } from '../../lib/annualReport';
import { normSearch } from '../../lib/validate';
import { hebDateFull } from '../../lib/hebrew';
import { ayinDailyRows, ayinActive, eyesTotal, featLabel, stageIndex, stageLabel } from '../../lib/ayin';
import { downloadCsv } from '../../lib/csvx';
import { ActionsMenu, Btn, Chip, Empty, Modal, PageHead, Select, TextInput } from '../ui';
import { chipStyle, fmtDate, hokDue, hokRecordedThisMonth, isoToday, sup12m, supAvgDon, supScore, supScoreBins, supTier, supTotalIls, TIER_ORDER, totalLabel } from './lib';
import { numMatch } from '../families/lib';
import { SupporterForm } from './SupporterForm';
import { SupporterDetail } from './SupporterDetail';
import { AyinBoard } from './AyinBoard';
import { OrgDonationCalendar } from './DonationCalendar';
import { SupporterImport } from './SupporterImport';
import { SupDedupModal } from './SupDedupModal';
import { findSupporterDupGroups } from '../../lib/dedup';
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
  | 'eyes'
  | 'paid';

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
  // "שולם" ברמת התיק (P3 פריט 14; paid במודל מ-P0.4)
  { key: 'paid', label: 'שולם' },
];

function sortVal(sp: Supporter, key: SortKey, rate = 3.7): string | number {
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
      return supScore(sp, rate);
    case 'stage':
      return sp.ayin ? stageIndex(sp.ayin.stage) : -1;
    case 'eyes':
      return sp.ayin ? eyesTotal(sp.ayin) : -1;
    case 'paid':
      return sp.ayin?.paid ? 1 : 0;
  }
}

/** צ'יפ דרגת RFM (זהב/כסף/ארד/רדומה) עם הציון בכלי-עזר. */
function TierChip(props: { sp: Supporter; rate?: number }) {
  const score = supScore(props.sp, props.rate);
  const tier = supTier(score);
  return (
    <span style={chipStyle(tier.bg, tier.c)} title={'ציון משוקלל (R·F·M): ' + score + '/1000'}>
      {tier.label}
    </span>
  );
}

export function SupportersView() {
  const db = useApp((s) => s.db);
  const rate = db.usdRate; // שער-דולר עריך — משוקלל בכל חישובי ה-₪-שקול והציון
  const config = useApp((s) => s.config);
  const rfmOn = featureOn(config, 'supporters.rfm');
  const nextOn = featureOn(config, 'supporters.nextdate');
  const ayinOn = featureOn(config, 'supporters.ayin');
  const customReportOn = featureOn(config, 'supporters.customreport');
  // גל ג׳ (campaign): קישור-הקמפיין מהקונפיג — https בלבד (חיטוי-ענן)
  const campaignHref = integrationOn(config, 'campaign')
    ? safeHttpsUrl(integrationSetting(config, 'campaign', 'url'))
    : null;
  // גל ד׳ (payments): מסך תשלומים-נכנסים — רק לארגון-ענן מחובר
  const cloudOn = useApp((s) => s.cloud.enabled && !!s.cloud.user);
  const [incomingOpen, setIncomingOpen] = useState(false);
  const dailyReportOn = featureOn(config, 'supporters.ayin.dailyreport');
  const importOn = featureOn(config, 'settings.import');
  const toast = useApp((s) => s.toast);
  // תצוגת גריד (5.8, בקשת-בעלים) — נשמרת ב-db.ui.supView, אותו דפוס כמו famView
  const setDb = useApp((s) => s.setDb);
  // UX סבב-ד׳: ברירת-מחדל חכמה — מסך-צר בלי העדפה-שמורה ⇒ גריד (טבלת 14
  // עמודות במגע = גלילה-צידית עיוורת); בחירה מפורשת של המשתמש תמיד גוברת.
  const supView = db.ui.supView ?? (typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches ? 'grid' : 'list');
  const toggleSupView = () =>
    setDb((d) => ({ ui: { ...d.ui, supView: (d.ui.supView ?? 'list') === 'grid' ? 'list' : 'grid' } }));

  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [tierF, setTierF] = useState<string | null>(null);
  // פילטרים פר-עמודה בתחביר numMatch — 'N' / 'N+' / 'N-M' (P3 פריט 13, לגאסי scf:2809-2811)
  const [colF, setColF] = useState({ count: '', total: '', score: '' });
  // סינון מעקב הטיפול (P3 פריט 14, לגאסי): עם מונה / בלי מונה / עודכן היום
  const [ayinF, setAyinF] = useState<null | 'eyes' | 'noeyes' | 'today'>(null);
  // 🔁 סינון הו"ק (ROADMAP-100 ‏#2): פעילות / טרם-נרשמו-החודש
  const hokOn = featureOn(config, 'supporters.hok');
  const [hokF, setHokF] = useState<null | 'active' | 'due'>(null);
  // 🔗 איחוד-כפולים (#13) — הכפתור מוצג רק כשיש מה לאחד
  const [dedupOpen, setDedupOpen] = useState(false);
  const dedupCount = findSupporterDupGroups(db.supporters).length;
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);
  // לוח התרומות הכלל-ארגוני (P1.4, legacy supCalOn/supCalAll) — מוצג בלחיצה
  const [orgCalOpen, setOrgCalOpen] = useState(false);
  const donCalOn = featureOn(config, 'supporters.doncal');
  // בקשת "+ תומכת" מהפלטה (P1.6) — אותו דפוס כמו famFormReq
  const supFormReq = useApp((s) => s.supFormReq);
  const ackSupporterForm = useApp((s) => s.ackSupporterForm);
  useEffect(() => {
    if (supFormReq) {
      setFormOpen(true);
      ackSupporterForm();
    }
  }, [supFormReq, ackSupporterForm]);
  // UX סבב-ז׳: חיפוש-גלובלי נוחת על הכרטיס — בקשת-פתיחה מהפלטה (דפוס supFormReq)
  const supOpenReq = useApp((s) => s.supOpenReq);
  const ackSupporterOpen = useApp((s) => s.ackSupporterOpen);
  useEffect(() => {
    if (supOpenReq) {
      setSelId(supOpenReq);
      ackSupporterOpen();
    }
  }, [supOpenReq, ackSupporterOpen]);

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
    // 🔁 סינון הו"ק (ROADMAP-100 ‏#2): הוראות פעילות / רק שטרם-נרשמו-החודש
    if (hokF === 'active' && !sp.hok?.active) return false;
    if (hokF === 'due' && !(sp.hok?.active && !hokRecordedThisMonth(sp, today))) return false;
    if (tierF && supTier(supScore(sp, rate)).label !== tierF) return false;
    // פילטרי numMatch (פריט 13) — תרומות / סה"כ ₪-שקול (לפי השער העריך) / ציון
    if (!numMatch(colF.count, sp.count || 0)) return false;
    if (!numMatch(colF.total, Math.round(supTotalIls(sp, rate)))) return false;
    if (!numMatch(colF.score, supScore(sp, rate))) return false;
    // סינון מעקב הטיפול (פריט 14)
    if (ayinF === 'eyes' && !(sp.ayin && eyesTotal(sp.ayin) > 0)) return false;
    if (ayinF === 'noeyes' && sp.ayin && eyesTotal(sp.ayin) > 0) return false;
    if (ayinF === 'today' && !(sp.ayin && (sp.ayin.lastTouch === today || sp.ayin.log.some((l) => l.date === today)))) return false;
    if (!q.trim()) return true;
    const phoneHit = qd.length >= 3 && (sp.phone || '').replace(/\D/g, '').includes(qd);
    const textHit =
      !!nq && normSearch([sp.name, sp.email, sp.cat, sp.address, sp.forWho].join(' ')).includes(nq);
    return phoneHit || textHit;
  });

  if (sort) {
    const { key, dir } = sort;
    list = [...list].sort((a, b) => {
      const va = sortVal(a, key, rate);
      const vb = sortVal(b, key, rate);
      const c = typeof va === 'number' ? va - (vb as number) : String(va).localeCompare(String(vb), 'he');
      return c * dir;
    });
  }

  const clickSort = (key: SortKey) =>
    setSort(sort && sort.key === key ? (sort.dir > 0 ? { key, dir: -1 } : null) : { key, dir: 1 });

  const catOptions = [...new Set(db.supporters.map((s) => s.cat).filter(Boolean))];
  const tierCounts: Record<string, number> = { זהב: 0, כסף: 0, ארד: 0, רדומה: 0 };
  for (const sp of db.supporters) tierCounts[supTier(supScore(sp, rate)).label]++;

  const tIls = db.supporters.reduce((a, x) => a + (x.ils || 0), 0);
  const tUsd = db.supporters.reduce((a, x) => a + (x.usd || 0), 0);
  const filtered =
    q.trim() !== '' || cat !== 'all' || !!tierF || !!ayinF ||
    colF.count.trim() !== '' || colF.total.trim() !== '' || colF.score.trim() !== '';
  const countLabel =
    (filtered ? list.length + ' מתוך ' : '') +
    db.supporters.length +
    ' ' + termOf(config, 'nav.supporters', 'משפחות תומכות') + ' · סה"כ ₪' +
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
        title={'💛 ' + termOf(config, 'nav.supporters', 'משפחות תומכות')}
        sub={countLabel}
        actions={
          <>
            {/* גל ד׳ (payments+ענן): תשלומים-נכנסים מה-webhook — לאישור-רישום */}
            {integrationOn(config, 'payments') && cloudOn && (
              <Btn onClick={() => setIncomingOpen(true)} title="תשלומים שדווחו מחברת-הסליקה — ממתינים לרישום">
                💰 תשלומים נכנסים
              </Btn>
            )}
            {/* UX סבב-ד׳: כל הפעולות המשניות בתפריט ⋯ אחד — אפס אובדן-יכולת,
                אותם handlers בדיוק, קליק-אחד-נוסף */}
            <ActionsMenu
              title={'עוד פעולות — ' + termOf(config, 'nav.supporters', 'תורמים')}
              items={[
                importOn && { label: '⬆ ייבוא מקובץ CSV', onClick: () => setImportOpen(true) },
                customReportOn && { label: '📊 דו"ח מותאם', onClick: () => setExpOpen(true), title: 'בחירת טווח ונתונים' },
                featureOn(config, 'supporters.annualreport') && {
                  label: '📄 דוחות שנתיים לכולם',
                  onClick: () => {
                    const year = isoToday().slice(0, 4);
                    const lines = annualAllLines(config.orgName || db.orgName, config.orgTaxId, year, db.supporters);
                    downloadAnnualReport('annual-all-' + year + '.txt', lines);
                    toast('📄 דוחות שנת ' + year + ' — הקובץ ירד (מקטע לכל תורם/ת)');
                  },
                },
                ayinOn && dailyReportOn && { label: '📋 דוח יומי', onClick: dailyReport },
                dedupCount > 0 && { label: '🔗 איחוד כפולים · ' + dedupCount, onClick: () => setDedupOpen(true) },
                !!campaignHref && { label: '📣 לקמפיין הגיוס', onClick: () => window.open(campaignHref!, '_blank', 'noopener') },
              ]}
            />
            {/* תצוגת גריד לתורמים (5.8, בקשת-בעלים) — אותו דפוס כמו המשפחות (db.ui) */}
            <Btn onClick={toggleSupView} title="החלפת תצוגה: רשימה / גריד">
              {supView === 'grid' ? '☰ רשימה' : '▦ גריד'}
            </Btn>
            <Btn kind="primary" onClick={() => setFormOpen(true)}>
              ➕ הוספת {termOf(config, 'entity.supporter', 'תומך/ת')}
            </Btn>
          </>
        }
      />

      {ayinOn && <AyinBoard onOpen={setSelId} />}

      {/* לוח תרומות כלל-ארגוני — כל התומכות + אירועי המעקב (legacy supCalAll) */}
      {donCalOn && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h3 style={{ fontSize: 15 }}>🗓 לוח ה{termOf(config, 'entity.donations', 'תרומות')} הכללי</h3>
            <Btn sm onClick={() => setOrgCalOpen((v) => !v)}>
              {orgCalOpen ? '▲ סגירה' : '▼ הצגה'}
            </Btn>
          </div>
          {orgCalOpen && (
            <div style={{ marginTop: 10 }}>
              <OrgDonationCalendar onOpen={setSelId} />
            </div>
          )}
        </div>
      )}

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>דרגות (לחיצה מסננת):</span>
          {TIER_ORDER.map((t) => (
            <Chip key={t} on={tierF === t} onClick={() => setTierF(tierF === t ? null : t)}>
              {t + ' · ' + tierCounts[t]}
            </Chip>
          ))}
        </div>
      )}

      {/* P3 פריט 12 — סטטים והיסטוגרמת ציון (נוסחאות הלגאסי supBars/supAvgDon/sup12m) */}
      {rfmOn && db.supporters.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 }}>
            {'תרמו ב-12 החודשים: ' + sup12m(db.supporters, today) + ' · ממוצע ל' + termOf(config, 'entity.donation', 'תרומה') + ': ' +
              (supAvgDon(db.supporters, rate) != null ? '₪' + supAvgDon(db.supporters, rate)!.toLocaleString('he-IL') : '—')}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 34 }} aria-label="היסטוגרמת פיזור הציון">
            {supScoreBins(db.supporters, rate).map((n, i) => {
              const bins = supScoreBins(db.supporters, rate);
              const mx = Math.max(1, ...bins);
              return (
                <span
                  key={i}
                  title={i * 100 + '–' + (i * 100 + 99) + ': ' + n + ' ' + termOf(config, 'nav.supporters', 'תומכות')}
                  style={{
                    width: 10,
                    height: Math.max(5, Math.round((n / mx) * 100)) + '%',
                    borderRadius: 3,
                    background: supTier(i * 100 + 50).dot,
                    display: 'inline-block',
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 🔁 הו"ק (ROADMAP-100 ‏#2): פעילות / טרם-נרשמו-החודש (לחיצה מסננת) */}
      {hokOn && db.supporters.some((sp) => sp.hok) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>הוראות קבע:</span>
          <Chip on={hokF === 'active'} onClick={() => setHokF(hokF === 'active' ? null : 'active')}>
            {'🔁 פעילות · ' + db.supporters.filter((sp) => sp.hok?.active).length}
          </Chip>
          <Chip on={hokF === 'due'} onClick={() => setHokF(hokF === 'due' ? null : 'due')}>
            {'⏳ טרם נרשמו החודש · ' + hokDue(db.supporters, today).length}
          </Chip>
        </div>
      )}

      {/* P3 פריט 14 — סינון מעקב הטיפול: עם מונה / בלי מונה / עודכן היום */}
      {ayinOn && db.supporters.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{featLabel(config)}:</span>
          <Chip on={ayinF === 'eyes'} onClick={() => setAyinF(ayinF === 'eyes' ? null : 'eyes')}>
            עם מונה
          </Chip>
          <Chip on={ayinF === 'noeyes'} onClick={() => setAyinF(ayinF === 'noeyes' ? null : 'noeyes')}>
            בלי מונה
          </Chip>
          <Chip on={ayinF === 'today'} onClick={() => setAyinF(ayinF === 'today' ? null : 'today')}>
            {'עודכן היום · ' +
              db.supporters.filter((sp) => sp.ayin && (sp.ayin.lastTouch === today || sp.ayin.log.some((l) => l.date === today))).length}
          </Chip>
        </div>
      )}

      {db.supporters.length === 0 ? (
        <Empty>
          עדיין אין {termOf(config, 'nav.supporters', 'תומכים')} — הוסיפו עם "➕ הוספת{' '}
          {termOf(config, 'entity.supporter', 'תומך/ת')}"
        </Empty>
      ) : list.length === 0 ? (
        <Empty>לא נמצאו {termOf(config, 'nav.supporters', 'תומכים')} התואמים את החיפוש והסינון</Empty>
      ) : supView === 'grid' ? (
        /* תצוגת גריד (5.8) — כרטיסים ידידותיים-למובייל; אותו דפוס כמו המשפחות */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {list.map((sp) => {
            const score = supScore(sp, rate);
            const tier = supTier(score);
            return (
              <div
                key={sp.id}
                className="card"
                role="button"
                tabIndex={0}
                onClick={() => setSelId(sp.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelId(sp.id);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {rfmOn && (
                    <span
                      title={tier.label + ' · ציון ' + score}
                      style={{ width: 10, height: 10, borderRadius: 99, background: tier.dot, display: 'inline-block', flex: 'none' }}
                    />
                  )}
                  <span style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{sp.name}</span>
                  {sp.hok?.active && (
                    <span title={'הו"ק ' + (sp.hok.cur === '$' ? '$' : '₪') + sp.hok.amount + (hokRecordedThisMonth(sp, today) ? ' · נרשמה החודש ✓' : ' · טרם נרשמה החודש')} style={{ fontSize: 13 }}>
                      🔁
                    </span>
                  )}
                  {sp.cat && <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{sp.cat}</span>}
                </div>
                {sp.phone && (
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)', direction: 'ltr', textAlign: 'end' }}>{sp.phone}</div>
                )}
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 4 }}>
                  {sp.count + ' ' + termOf(config, 'entity.donations', 'תרומות') + ' · ' + totalLabel(sp)}
                  {sp.last ? ' · אחרונה ' + fmtDate(sp.last) : ''}
                </div>
                {nextOn && sp.nextDate && (
                  <div style={{ fontSize: 12, color: sp.nextDate <= isoToday() ? 'var(--warn, #b45309)' : 'var(--ink-faint)', marginTop: 2 }}>
                    {'☎ קשר הבא: ' + fmtDate(sp.nextDate)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                {HEAD.filter(
                  (h) =>
                    (nextOn || h.key !== 'nextDate') &&
                    (rfmOn || h.key !== 'score') &&
                    (ayinOn || (h.key !== 'stage' && h.key !== 'eyes' && h.key !== 'paid')),
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
                <th aria-hidden />
              </tr>
              {/* P3 פריט 13 — פילטרים פר-עמודה בתחביר numMatch ('3' / '3+' / '1-5'), כמו scf בלגאסי */}
              <tr>
                {HEAD.filter(
                  (h) =>
                    (nextOn || h.key !== 'nextDate') &&
                    (rfmOn || h.key !== 'score') &&
                    (ayinOn || (h.key !== 'stage' && h.key !== 'eyes' && h.key !== 'paid')),
                ).map((h) =>
                  h.key === 'count' || h.key === 'ils' || h.key === 'score' ? (
                    <th key={h.key} style={{ padding: '3px 8px' }}>
                      <input
                        value={h.key === 'count' ? colF.count : h.key === 'ils' ? colF.total : colF.score}
                        onChange={(e) =>
                          setColF({
                            ...colF,
                            [h.key === 'count' ? 'count' : h.key === 'ils' ? 'total' : 'score']: e.target.value,
                          })
                        }
                        placeholder={h.key === 'ils' ? '₪-שקול: 500+' : '3 / 3+ / 1-5'}
                        aria-label={'סינון ' + h.label}
                        style={{ width: '100%', minWidth: 70, padding: '4px 6px', fontSize: 12 }}
                        dir="ltr"
                      />
                    </th>
                  ) : (
                    <th key={h.key} />
                  ),
                )}
                {rfmOn && <th />}
                <th aria-hidden />
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
                  <td title={'מתי וכמה בכל ' + termOf(config, 'entity.donation', 'תרומה') + ' — בכרטיס'}>{sp.count}</td>
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
                  {rfmOn && <td style={{ fontWeight: 700 }}>{supScore(sp, rate)}</td>}
                  {ayinOn && <td>{sp.ayin && ayinActive(sp.ayin) ? stageLabel(config, sp.ayin.stage) : '—'}</td>}
                  {ayinOn && <td>{sp.ayin && eyesTotal(sp.ayin) ? eyesTotal(sp.ayin) : '—'}</td>}
                  {ayinOn && <td>{sp.ayin?.paid ? '✓' : '—'}</td>}
                  {rfmOn && (
                    <td>
                      <TierChip sp={sp} rate={rate} />
                    </td>
                  )}
                  {/* P3 פריט 12 — 📞 פר-שורה: חיוג ישיר בלי לפתוח את הכרטיס.
                      INTEGRATIONS גל א׳ — 💬 וואטסאפ לצדו (הרחבה נמכרת, חסר=כבוי) */}
                  <td onClick={(e) => e.stopPropagation()}>
                    {sp.phone && featureOn(config, 'supporters.click2call') ? (
                      <a href={'tel:' + sp.phone.replace(/\D/g, '')} title={'חיוג ל' + sp.name + ' — ' + sp.phone} aria-label={'חיוג ל' + sp.name}>
                        📞
                      </a>
                    ) : (
                      ''
                    )}
                    {sp.phone && integrationOn(config, 'whatsapp') ? <WaBtn phone={sp.phone} title={'וואטסאפ ל' + sp.name} /> : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 14 }}>
        {/* ביקורת 6.8: 'תומכות'+'לקורסים' היו קשיחים — דלפו בכל 7 הוורטיקלים */}
        💡 {termOf(config, 'nav.supporters', 'תורמים')} אינם מחוברים ל{termOf(config, 'nav.courses', 'חוגים')} — זמינים בחיפוש (⌘K), בלוח השנה (תזכורת 📞) ובגיבויים.
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

      {dedupOpen && <SupDedupModal onClose={() => setDedupOpen(false)} />}
      {importOpen && (
        <Modal title="⬆ ייבוא תומכות מ-CSV" onClose={() => setImportOpen(false)}>
          <SupporterImport onDone={() => setImportOpen(false)} />
        </Modal>
      )}

      {expOpen && <CustomExport target="supporters" onClose={() => setExpOpen(false)} />}
      {incomingOpen && <IncomingPaymentsModal onClose={() => setIncomingOpen(false)} />}
    </div>
  );
}
