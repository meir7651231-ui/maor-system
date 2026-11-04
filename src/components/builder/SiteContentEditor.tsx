/**
 * 🌐 עורך תוכן האתר-הציבורי — רכיב משותף (29.10.2026, «מערכת לשליטה למנהל הארגון לעריכת האתר»).
 * חולץ מהאשף (BuilderWizard) **כמות-שהוא**: אותם שדות, אותם תיקונים (onBlur לשדות-שורות, linesKeep ששומר
 * תרגום). שני צרכנים: האשף (patch לקונפיג) ומסך «עריכת האתר» של מנהל-הארגון (טיוטה ⇒ שמירה לענן).
 * מקבל site ומחזיר site מלא ב-onChange — בלי store, בלי ענן.
 */
import type { CSSProperties, ReactNode } from 'react';
import { Btn, Chip, Field, TextInput } from '../ui';
import { SITE_SECTION_LABELS, siteSectionOrder } from '../../lib/publicSite';
import type {
  LocalizedText,
  PublicSiteContent,
  PublicSiteEvent,
  PublicSiteFaq,
  PublicSiteLive,
  PublicSiteLiveCard,
  PublicSiteLiveWeek,
  PublicSiteMilestone,
  PublicSitePayMethod,
  PublicSiteService,
  PublicSiteStat,
  PublicSiteTestimonial,
  PublicSiteTier,
  SiteSectionKey,
} from '../../types/config';
import { SITE_SECTION_KEYS } from '../../types/config';

/* עורך-רשימות גנרי לאתר-הציבורי: שורה לכל פריט + ↑↓ + 🗑 + "➕ הוספה".
   כל פעולה בונה מערך חדש ומעבירה ל-onChange (⇒ setSite ⇒ patch — אותו live-apply). */
const MINI_BTN: CSSProperties = { fontSize: 12, lineHeight: 1, padding: '3px 7px', borderRadius: 6, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink-soft)', cursor: 'pointer' };
const NUM_STYLE: CSSProperties = { width: '100%', boxSizing: 'border-box', fontSize: 13, padding: '6px 8px' };
const TA_STYLE: CSSProperties = { width: '100%', boxSizing: 'border-box', fontSize: 13, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)', fontFamily: 'inherit', resize: 'vertical', minHeight: 46 };

/** כותרת-תת-קבוצה בעורך האתר-הציבורי. */
function SubHead({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 700, margin: '12px 0 2px', borderTop: '1px solid var(--line-soft)', paddingTop: 10 }}>{children}</div>;
}

function ListEditor<T extends object>({ items, onChange, empty, addLabel, row }: {
  items: T[];
  onChange: (next: T[]) => void;
  empty: () => T;
  addLabel: string;
  row: (item: T, set: (patch: Partial<T>) => void) => ReactNode;
}) {
  const setAt = (i: number, patch: Partial<T>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const removeAt = (i: number) => onChange(items.filter((_, j) => j !== i));
  const move = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    const tmp = next[i]; next[i] = next[j]; next[j] = tmp;
    onChange(next);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
      {items.map((it, i) => (
        <div key={i} style={{ border: '1px solid var(--line-soft)', borderRadius: 8, padding: '6px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <span style={{ flex: 1, fontSize: 11, color: 'var(--ink-faint)' }}>#{i + 1}</span>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="הזז למעלה" style={MINI_BTN}>↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="הזז למטה" style={MINI_BTN}>↓</button>
            <button type="button" onClick={() => removeAt(i)} aria-label="מחיקה" style={{ ...MINI_BTN, color: '#b3362a' }}>🗑</button>
          </div>
          {row(it, (patch) => setAt(i, patch))}
        </div>
      ))}
      <div><Btn onClick={() => onChange([...items, empty()])}>➕ {addLabel}</Btn></div>
    </div>
  );
}

/** 📡 «שידור חי» — מספר מהמערכת לעומת מה שבאתר (רמז מתחת לשדה). */
function SysHint({ sys, cur, onUse }: { sys?: string; cur: string; onUse: () => void }) {
  if (sys === undefined || sys === cur) return null;
  return (
    <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>
      מהמערכת: <b dir="ltr">{sys}</b>{' '}
      <button type="button" onClick={onUse} style={{ ...MINI_BTN, fontSize: 11 }}>השתמש</button>
    </div>
  );
}

export function SiteContentEditor({ site, onChange, systemLive }: {
  site: PublicSiteContent | undefined;
  onChange: (site: PublicSiteContent) => void;
  /** 📡 הצעת-המספרים מנתוני-המשרד (siteLiveFromDb) — חסר ⇒ אין כפתורי-מילוי (העורך עובד גם בלעדיו). */
  systemLive?: () => PublicSiteLive;
}) {
  /* 🌐 האתר-הציבורי — עריכה חיה של config.site דרך אותו צינור patch כמו כל האשף.
     טקסט רב-לשוני נערך בעברית (putHe שומר en/yi קיימים). מספרים/תאריך = ערכים גולמיים;
     החיטוי (allowlist, https, תקרות) קורה ב-normalizeSite בטעינה/ייצוא. */
  const wsite = site ?? {};
  const setSite = (p: Partial<PublicSiteContent>) => onChange({ ...site, ...p });
  const siteHe = (v?: LocalizedText): string => (typeof v === 'string' ? v : v?.he ?? '');
  const putHe = (old: LocalizedText | undefined, v: string): LocalizedText | undefined =>
    !v.trim() ? undefined : old && typeof old === 'object' ? { ...old, he: v } : v;
  const setSiteText = (key: keyof PublicSiteContent, v: string) =>
    setSite({ [key]: putHe(wsite[key] as LocalizedText | undefined, v) } as Partial<PublicSiteContent>);
  const setCamp = (p: Partial<NonNullable<PublicSiteContent['campaign']>>) =>
    setSite({ campaign: { ...wsite.campaign, ...p } });
  const setSiteContact = (p: Partial<NonNullable<PublicSiteContent['contact']>>) =>
    setSite({ contact: { ...wsite.contact, ...p } });
  const setFounder = (p: Partial<NonNullable<PublicSiteContent['founder']>>) =>
    setSite({ founder: { ...wsite.founder, ...p } });
  const setCalcF = (p: Partial<NonNullable<PublicSiteContent['calc']>>) =>
    setSite({ calc: { ...wsite.calc, ...p } });
  const setGrowth = (p: Partial<NonNullable<PublicSiteContent['growth']>>) =>
    setSite({ growth: { ...wsite.growth, ...p } });
  const setTransp = (p: Partial<NonNullable<PublicSiteContent['transparency']>>) =>
    setSite({ transparency: { ...wsite.transparency, ...p } });
  const setSiteForm = (p: Partial<NonNullable<PublicSiteContent['contactForm']>>) =>
    setSite({ contactForm: { ...wsite.contactForm, ...p } });
  /** רשימות-מחרוזת (מרקיזה/מדליונים/הטבות/גלריה): "שורה לכל פריט". */
  const heLines = (arr?: LocalizedText[]): string => (arr ?? []).map((v) => siteHe(v)).join('\n');
  const toLines = (text: string): string[] => text.split('\n').map((s) => s.trim()).filter(Boolean);
  /** 26.10.2026: שורות ⇒ LocalizedText ששומר את התרגום (en/yi) של אותה שורה — היה נדרס למחרוזת-עברית. */
  const linesKeep = (old: LocalizedText[] | undefined, text: string): LocalizedText[] =>
    toLines(text).map((l, i) => putHe(old?.[i], l) ?? l);
  const camp = wsite.campaign ?? {};
  const phonesText = (wsite.contact?.phones ?? []).join(', ');
  return (
    <>
      {/* 🧱 סדר החלקים באתר (3.11.2026, «לעלות ולהוריד את הסדר») */}
      <SubHead>🧱 סדר החלקים באתר</SubHead>
      <SectionOrderEditor site={wsite} onChange={(sections) => setSite({ sections })} />

      {/* 🎨 מיתוג */}
      <SubHead>🎨 מיתוג</SubHead>
      <Field label="שורת-מותג (מתחת לשם, בניווט)">
        <TextInput value={siteHe(wsite.brandLine)} onChange={(v) => setSiteText('brandLine', v)} placeholder="אור לאלמנה וליתום" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
        <Field label="אייקון">
          <TextInput value={wsite.icon ?? ''} onChange={(v) => setSite({ icon: v || undefined })} placeholder="🕯️" />
        </Field>
        <Field label="תג מעל הכותרת (Hero)">
          <TextInput value={siteHe(wsite.heroBadge)} onChange={(v) => setSiteText('heroBadge', v)} placeholder="2,800 משפחות איתנו היום" />
        </Field>
      </div>
      <Field label="תווית על הווידאו (רשות)">
        <TextInput value={siteHe(wsite.heroCaption)} onChange={(v) => setSiteText('heroCaption', v)} placeholder="מהשטח, השבוע" />
      </Field>

      {/* ✍️ טקסטים ראשיים (עברית; en/yi קיימים נשמרים) */}
      <SubHead>✍️ טקסטים ראשיים</SubHead>
      <Field label="כותרת ראשית (Hero)">
        <TextInput value={siteHe(wsite.heroTitle)} onChange={(v) => setSiteText('heroTitle', v)} placeholder="הבית של" />
      </Field>
      <Field label="מילה מודגשת (בקורל, שורה שנייה)">
        <TextInput value={siteHe(wsite.titleAccent)} onChange={(v) => setSiteText('titleAccent', v)} placeholder="האלמנות." />
      </Field>
      <Field label="תת-כותרת (פסקת פתיחה)">
        <TextInput value={siteHe(wsite.tagline)} onChange={(v) => setSiteText('tagline', v)} placeholder="כבר 24 שנה…" />
      </Field>
      <Field label="רצועת קמפיין עליונה (טיקר)">
        <TextInput value={siteHe(wsite.ticker)} onChange={(v) => setSiteText('ticker', v)} placeholder="קמפיין החגים · ₪X נאספו · מתעדכן חי" />
      </Field>
      <Field label="שורת מיקרו (מתחת לכפתור)">
        <TextInput value={siteHe(wsite.microCopy)} onChange={(v) => setSiteText('microCopy', v)} placeholder="כל ₪9 = ארוחה חמה לילד ♡" />
      </Field>

      {/* 🧩 שירותים */}
      <SubHead>🧩 שירותים (מה אנחנו עושות)</SubHead>
      <Field label="כותרת הסעיף">
        <TextInput value={siteHe(wsite.servicesHeading)} onChange={(v) => setSiteText('servicesHeading', v)} placeholder="שישה דרכים לחבק משפחה" />
      </Field>
      <ListEditor<PublicSiteService>
        items={wsite.services ?? []}
        onChange={(v) => setSite({ services: v })}
        empty={() => ({ title: '' })}
        addLabel="שירות"
        row={(it, set) => (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 6 }}>
              <Field label="אייקון"><TextInput value={it.icon ?? ''} onChange={(v) => set({ icon: v })} placeholder="🍞" /></Field>
              <Field label="כותרת"><TextInput value={siteHe(it.title)} onChange={(v) => set({ title: putHe(it.title, v) ?? '' })} /></Field>
            </div>
            <Field label="תיאור"><TextInput value={siteHe(it.text)} onChange={(v) => set({ text: putHe(it.text, v) })} /></Field>
          </>
        )}
      />

      {/* 📈 מספרים + גרף */}
      <SubHead>📈 מספרים</SubHead>
      <ListEditor<PublicSiteStat>
        items={wsite.stats ?? []}
        onChange={(v) => setSite({ stats: v })}
        empty={() => ({ value: '', label: '' })}
        addLabel="מספר"
        row={(it, set) => (
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 6 }}>
            <Field label="ערך"><TextInput dir="ltr" value={it.value} onChange={(v) => set({ value: v })} placeholder="2,800" /></Field>
            <Field label="תווית"><TextInput value={siteHe(it.label)} onChange={(v) => set({ label: putHe(it.label, v) })} placeholder="משפחות בליווי" /></Field>
          </div>
        )}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="תווית גרף-הצמיחה">
          <TextInput value={siteHe(wsite.growth?.label)} onChange={(v) => setGrowth({ label: putHe(wsite.growth?.label, v) })} placeholder="סלים · 12 חודשים" />
        </Field>
        <Field label="שינוי (טקסט)">
          <TextInput value={wsite.growth?.delta ?? ''} onChange={(v) => setGrowth({ delta: v || undefined })} placeholder="+38% מהשנה שעברה" />
        </Field>
      </div>

      {/* 📡 שידור חי (3.11.2026) — המערכת מציעה, המנהל שולט ומפרסם */}
      <SubHead>📡 שידור חי — מה קורה עכשיו בבית</SubHead>
      <LiveEditor live={wsite.live} onChange={(live) => setSite({ live })} systemLive={systemLive} siteHe={siteHe} putHe={putHe} heLines={heLines} linesKeep={linesKeep} />

      {/* 🛡️ שקיפות ואמון */}
      <SubHead>🛡️ שקיפות ואמון</SubHead>
      <Field label="כותרת">
        <TextInput value={siteHe(wsite.transparency?.heading)} onChange={(v) => setTransp({ heading: putHe(wsite.transparency?.heading, v) })} placeholder="כל שקל מתועד…" />
      </Field>
      <Field label="טקסט">
        <TextInput value={siteHe(wsite.transparency?.text)} onChange={(v) => setTransp({ text: putHe(wsite.transparency?.text, v) })} />
      </Field>
      <Field label="מדליוני-אמון (שורה לכל אחד)">
        <textarea key={'b' + heLines(wsite.transparency?.badges)} style={TA_STYLE} defaultValue={heLines(wsite.transparency?.badges)} onBlur={(e) => setTransp({ badges: linesKeep(wsite.transparency?.badges, e.target.value) })} placeholder={'ניהול תקין 2026\nאישור סעיף 46\nדו״ח שנתי פתוח'} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="קישור לאישורים הרשמיים (https, למשל גיידסטאר)"><TextInput dir="ltr" value={wsite.transparency?.reportsUrl ?? ''} onChange={(v) => setTransp({ reportsUrl: v || undefined })} placeholder="https://www.guidestar.org.il/organization/580…" /></Field>
        <Field label="טקסט הכפתור"><TextInput value={siteHe(wsite.transparency?.reportsLabel)} onChange={(v) => setTransp({ reportsLabel: putHe(wsite.transparency?.reportsLabel, v) })} placeholder="לאישורים הרשמיים בגיידסטאר" /></Field>
      </div>

      {/* 📖 סיפור + מייסד + ציר-זמן */}
      <SubHead>📖 סיפור</SubHead>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="כותרת הסיפור"><TextInput value={siteHe(wsite.storyTitle)} onChange={(v) => setSiteText('storyTitle', v)} placeholder="24 שנה של בית חם." /></Field>
        <Field label="מילה מודגשת"><TextInput value={siteHe(wsite.storyTitleAccent)} onChange={(v) => setSiteText('storyTitleAccent', v)} placeholder="וזה רק מתחיל." /></Field>
      </div>
      <Field label="הסיפור (פסקה)">
        <textarea style={TA_STYLE} value={siteHe(wsite.story)} onChange={(e) => setSiteText('story', e.target.value)} placeholder="לפני 24 שנה…" />
      </Field>
      <Field label="צ׳יפ-ברכה">
        <TextInput value={siteHe(wsite.storyBadge)} onChange={(v) => setSiteText('storyBadge', v)} placeholder="בברכת גדולי ישראל ♡" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="שם המייסד/ת"><TextInput value={siteHe(wsite.founder?.name)} onChange={(v) => setFounder({ name: putHe(wsite.founder?.name, v) })} placeholder="מרים לוצקין · מייסדת" /></Field>
        <Field label="תמונת מייסד/ת (https)"><TextInput dir="ltr" value={wsite.founder?.photo ?? ''} onChange={(v) => setFounder({ photo: v || undefined })} placeholder="https://…jpg" /></Field>
      </div>
      <Field label="ציטוט המייסד/ת">
        <TextInput value={siteHe(wsite.founder?.quote)} onChange={(v) => setFounder({ quote: putHe(wsite.founder?.quote, v) })} placeholder="חסד אמיתי זה לא לתת — זה להיות שם." />
      </Field>
      <div style={{ fontSize: 12, fontWeight: 600, margin: '6px 0 0', color: 'var(--ink-soft)' }}>ציר-זמן (אבני-דרך)</div>
      <ListEditor<PublicSiteMilestone>
        items={wsite.timeline ?? []}
        onChange={(v) => setSite({ timeline: v })}
        empty={() => ({ year: '', title: '' })}
        addLabel="אבן-דרך"
        row={(it, set) => (
          <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 6 }}>
            <Field label="שנה"><TextInput dir="ltr" value={it.year} onChange={(v) => set({ year: v })} placeholder="2002" /></Field>
            <Field label="כותרת"><TextInput value={siteHe(it.title)} onChange={(v) => set({ title: putHe(it.title, v) ?? '' })} placeholder="ההתחלה" /></Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="הערה"><TextInput value={siteHe(it.note)} onChange={(v) => set({ note: putHe(it.note, v) })} placeholder="סל ראשון לשכנה" /></Field>
            </div>
          </div>
        )}
      />

      {/* 🧮 מחשבון */}
      <SubHead>🧮 מחשבון-השפעה</SubHead>
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8 }}>
        <Field label="₪ ליחידה">
          <input type="number" min={1} dir="ltr" value={wsite.calc?.unitAmount ?? ''} onChange={(e) => setCalcF({ unitAmount: e.target.value ? Math.max(1, Math.round(+e.target.value)) : undefined })} style={NUM_STYLE} />
        </Field>
        <Field label="שם היחידה">
          <TextInput value={siteHe(wsite.calc?.unit)} onChange={(v) => setCalcF({ unit: putHe(wsite.calc?.unit, v) })} placeholder="ארוחות חמות" />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8 }}>
        <Field label="₪ ליחידה 2">
          <input type="number" min={1} dir="ltr" value={wsite.calc?.unit2Amount ?? ''} onChange={(e) => setCalcF({ unit2Amount: e.target.value ? Math.max(1, Math.round(+e.target.value)) : undefined })} style={NUM_STYLE} />
        </Field>
        <Field label="שם יחידה 2 (רשות)">
          <TextInput value={siteHe(wsite.calc?.unit2)} onChange={(v) => setCalcF({ unit2: putHe(wsite.calc?.unit2, v) })} placeholder="חודשי אימוץ יתום" />
        </Field>
      </div>
      <Field label="הערת המחשבון">
        <TextInput value={siteHe(wsite.calc?.note)} onChange={(v) => setCalcF({ note: putHe(wsite.calc?.note, v) })} placeholder="כל ₪9 = ארוחה חמה לילד ♡" />
      </Field>
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
        בלי «₪ ליחידה» — המחשבון לא מוצג באתר (לא ממציאים יחידות).
      </div>
      <Field label="סכומי-בחירה בתרומה (₪, מופרדים בפסיק)">
        {/* לא-נשלט + onBlur: בשדה נשלט הפסיק נבלע מיד ואי אפשר להקליד סכום שני */}
        <input key={(wsite.amounts ?? []).join(',')} dir="ltr" defaultValue={(wsite.amounts ?? []).join(', ')} onBlur={(e) => { const am = e.target.value.split(/[,\s]+/).map((x) => Math.round(+x)).filter((x) => x > 0).slice(0, 6); setSite({ amounts: am.length ? am : undefined }); }} placeholder="50, 180, 360, 720" style={{ ...NUM_STYLE, width: '100%' }} />
      </Field>

      {/* 📊 קמפיין */}
      <SubHead>📊 קמפיין</SubHead>
      <Field label="כותרת הקמפיין (מעל בוחר-התרומה)">
        <TextInput value={siteHe(camp.title)} onChange={(v) => setCamp({ title: putHe(camp.title, v) })} placeholder="בחרו את התרומה שלכם" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="🎯 יעד הגיוס (₪)">
          <input type="number" min={0} dir="ltr" value={camp.goal ?? ''} onChange={(e) => setCamp({ goal: e.target.value ? Math.max(0, Math.round(+e.target.value)) : undefined })} style={NUM_STYLE} />
        </Field>
        <Field label="💰 נאסף עד כה (₪)">
          <input type="number" min={0} dir="ltr" value={camp.raised ?? ''} onChange={(e) => setCamp({ raised: e.target.value ? Math.max(0, Math.round(+e.target.value)) : undefined })} style={NUM_STYLE} />
        </Field>
      </div>
      <Field label="📅 תאריך יעד (סוף הקמפיין · לספירה לאחור)">
        <input type="date" dir="ltr" value={camp.end ?? ''} onChange={(e) => setCamp({ end: e.target.value || undefined })} style={NUM_STYLE} />
      </Field>

      {/* 💳 בוחר-תרומה */}
      <SubHead>💳 בוחר-תרומה</SubHead>
      <Field label="🔗 כפתור התרומה (https) — קישור לעמוד-הסליקה">
        <TextInput dir="ltr" value={wsite.donateUrl ?? ''} onChange={(v) => setSite({ donateUrl: v })} placeholder="https://pay.example/give" />
      </Field>
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
        ריק — הכפתור נופל אוטומטית לקישור-התשלום מ«הרחבות ← 💳 תשלומים» אם הוגדר.
      </div>
      <Field label="🌍 קישור-תרומה לחו״ל (https, רשות) — באתר באנגלית הכפתורים מובילים אליו">
        <TextInput dir="ltr" value={wsite.donateUrlIntl ?? ''} onChange={(v) => setSite({ donateUrlIntl: v || undefined })} placeholder="https://secure.cardknox.com/…" />
      </Field>
      <Field label="הערת-תחתית">
        <TextInput value={siteHe(wsite.donateNote)} onChange={(v) => setSiteText('donateNote', v)} placeholder="תרומות מוכרות למס לפי סעיף 46 · ביטול בכל רגע" />
      </Field>
      <div style={{ fontSize: 12, fontWeight: 600, margin: '6px 0 0', color: 'var(--ink-soft)' }}>אמצעי-תשלום</div>
      <ListEditor<PublicSitePayMethod>
        items={wsite.paymentMethods ?? []}
        onChange={(v) => setSite({ paymentMethods: v })}
        empty={() => ({ label: '', detail: '' })}
        addLabel="אמצעי-תשלום"
        row={(it, set) => (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '56px 120px 1fr', gap: 6 }}>
              <Field label="סמל"><TextInput value={it.icon ?? ''} onChange={(v) => set({ icon: v || undefined })} placeholder="💳" /></Field>
              <Field label="שם"><TextInput value={siteHe(it.label)} onChange={(v) => set({ label: putHe(it.label, v) ?? '' })} placeholder="אונליין" /></Field>
              <Field label="פרטים"><TextInput value={siteHe(it.detail)} onChange={(v) => set({ detail: putHe(it.detail, v) ?? '' })} placeholder="אשראי / ביט / PayPal" /></Field>
            </div>
            <Field label="קישור-תשלום (https, רשות) — מוסיף כפתור «לתרומה»"><TextInput dir="ltr" value={it.url ?? ''} onChange={(v) => set({ url: v || undefined })} placeholder="https://secure.cardknox.com/…" /></Field>
            <Chip on={!!it.ltr} onClick={() => set({ ltr: !it.ltr })}>{it.ltr ? '↤ שמאל (LTR)' : 'יישור אוטומטי'}</Chip>
          </>
        )}
      />

      {/* 💬 עדויות */}
      <SubHead>💬 עדויות</SubHead>
      <ListEditor<PublicSiteTestimonial>
        items={wsite.testimonials ?? []}
        onChange={(v) => setSite({ testimonials: v })}
        empty={() => ({ quote: '' })}
        addLabel="עדות"
        row={(it, set) => (
          <>
            <Field label="ציטוט"><TextInput value={siteHe(it.quote)} onChange={(v) => set({ quote: putHe(it.quote, v) ?? '' })} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <Field label="שם"><TextInput value={it.author ?? ''} onChange={(v) => set({ author: v })} placeholder="ר׳" /></Field>
              <Field label="תפקיד/מיקום"><TextInput value={siteHe(it.role)} onChange={(v) => set({ role: putHe(it.role, v) })} placeholder="אם לשלושה · ירושלים" /></Field>
            </div>
          </>
        )}
      />

      {/* 🎯 מסלולי-שותפות */}
      <SubHead>🎯 מסלולי-שותפות</SubHead>
      <ListEditor<PublicSiteTier>
        items={wsite.tiers ?? []}
        onChange={(v) => setSite({ tiers: v })}
        empty={() => ({ name: '' })}
        addLabel="מסלול"
        row={(it, set) => (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: 6 }}>
              <Field label="שם"><TextInput value={siteHe(it.name)} onChange={(v) => set({ name: putHe(it.name, v) ?? '' })} placeholder="שותפה ♡" /></Field>
              <Field label="סכום (₪)"><input type="number" min={0} dir="ltr" value={it.amount ?? ''} onChange={(e) => set({ amount: e.target.value ? Math.max(0, Math.round(+e.target.value)) : undefined })} style={NUM_STYLE} /></Field>
              <Field label="לתקופה"><TextInput value={siteHe(it.period)} onChange={(v) => set({ period: putHe(it.period, v) })} placeholder="/ חודש" /></Field>
            </div>
            <Field label="הטבות (שורה לכל אחת)">
              <textarea key={'p' + heLines(it.perks)} style={TA_STYLE} defaultValue={heLines(it.perks)} onBlur={(e) => set({ perks: linesKeep(it.perks, e.target.value) })} placeholder={'2 סלים שבועיים\nשם על לוח השותפים'} />
            </Field>
            <Chip on={!!it.featured} onClick={() => set({ featured: !it.featured })}>{it.featured ? '★ מודגש (הכי אהוב)' : 'רגיל'}</Chip>
          </>
        )}
      />

      {/* 📅 אירועים */}
      <SubHead>📅 אירועים</SubHead>
      <ListEditor<PublicSiteEvent>
        items={wsite.events ?? []}
        onChange={(v) => setSite({ events: v })}
        empty={() => ({ title: '' })}
        addLabel="אירוע"
        row={(it, set) => (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 6 }}>
              <Field label="תאריך (תצוגה)"><TextInput value={it.date ?? ''} onChange={(v) => set({ date: v })} placeholder="14 ספט׳" /></Field>
              <Field label="כותרת"><TextInput value={siteHe(it.title)} onChange={(v) => set({ title: putHe(it.title, v) ?? '' })} placeholder="מגבית ערב ראש השנה" /></Field>
            </div>
            <Field label="פרטים"><TextInput value={siteHe(it.meta)} onChange={(v) => set({ meta: putHe(it.meta, v) })} placeholder="שידור חי · כל הארץ" /></Field>
          </>
        )}
      />

      {/* ❓ שאלות ותשובות */}
      <SubHead>❓ שאלות נפוצות</SubHead>
      <ListEditor<PublicSiteFaq>
        items={wsite.faq ?? []}
        onChange={(v) => setSite({ faq: v })}
        empty={() => ({ q: '', a: '' })}
        addLabel="שאלה"
        row={(it, set) => (
          <>
            <Field label="שאלה"><TextInput value={siteHe(it.q)} onChange={(v) => set({ q: putHe(it.q, v) ?? '' })} placeholder="לאן הולך הכסף שלי?" /></Field>
            <Field label="תשובה"><textarea style={TA_STYLE} value={siteHe(it.a)} onChange={(e) => set({ a: putHe(it.a, e.target.value) ?? '' })} /></Field>
          </>
        )}
      />

      {/* 🖼️ גלריה + מרקיזה */}
      <SubHead>🖼️ גלריה ומרקיזה</SubHead>
      <Field label="תמונות גלריה (כתובת https · שורה לכל תמונה)">
        <textarea key={'g' + (wsite.gallery ?? []).join('|')} style={TA_STYLE} dir="ltr" defaultValue={(wsite.gallery ?? []).join('\n')} onBlur={(e) => setSite({ gallery: toLines(e.target.value) })} placeholder={'https://…/1.jpg\nhttps://…/2.jpg'} />
      </Field>
      <Field label="מרקיזה נגללת (שורה לכל פריט)">
        <textarea key={'m' + heLines(wsite.marquee)} style={TA_STYLE} defaultValue={heLines(wsite.marquee)} onBlur={(e) => setSite({ marquee: linesKeep(wsite.marquee, e.target.value) })} placeholder={'סל למשפחה = ₪90\n92% מכל שקל — ישירות למשפחות'} />
      </Field>

      {/* 📰 חדשות */}
      <SubHead>📰 חדשות</SubHead>
      <Field label="עדכון «מה חדש»">
        <TextInput value={siteHe(wsite.news)} onChange={(v) => setSiteText('news', v)} placeholder="נפתחה ההרשמה למלגות…" />
      </Field>

      {/* 📞 פרטי קשר */}
      <SubHead>📞 פרטי קשר</SubHead>
      <Field label="טלפונים (מופרדים בפסיק)">
        {/* לא-נשלט + onBlur (26.10.2026): בשדה נשלט הפסיק נבלע מיד ואי אפשר היה להקליד טלפון שני */}
        <input key={phonesText} dir="ltr" defaultValue={phonesText} onBlur={(e) => setSiteContact({ phones: e.target.value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean) })} placeholder="02-000-0000, 058-000-0000" style={NUM_STYLE} />
      </Field>
      <Field label="תוויות לטלפונים, לפי הסדר (רשות, מופרדות בפסיק)">
        <input key={'l' + (wsite.contact?.phoneLabels ?? []).map((l) => siteHe(l)).join(',')} defaultValue={(wsite.contact?.phoneLabels ?? []).map((l) => siteHe(l)).join(', ')} onBlur={(e) => { const ls = e.target.value.split(',').map((s) => s.trim()); setSiteContact({ phoneLabels: ls.some(Boolean) ? ls.map((s, i) => putHe(wsite.contact?.phoneLabels?.[i], s) ?? '') : undefined }); }} placeholder="ישראל, ארה״ב, מקסיקו" style={NUM_STYLE} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="וואטסאפ"><TextInput dir="ltr" value={wsite.contact?.whatsapp ?? ''} onChange={(v) => setSiteContact({ whatsapp: v })} placeholder="058-000-0000" /></Field>
        <Field label="אימייל"><TextInput dir="ltr" value={wsite.contact?.email ?? ''} onChange={(v) => setSiteContact({ email: v })} placeholder="info@org.org.il" /></Field>
      </div>
      <Field label="שעות פעילות"><TextInput value={siteHe(wsite.contact?.hours)} onChange={(v) => setSiteContact({ hours: putHe(wsite.contact?.hours, v) })} placeholder="א׳–ה׳ 9:00–17:00 · ו׳ עד 12:00" /></Field>
      <Field label="כתובת"><TextInput value={siteHe(wsite.contact?.address)} onChange={(v) => setSiteContact({ address: putHe(wsite.contact?.address, v) })} placeholder="רחוב… , עיר" /></Field>
      <Field label="הערת-תחתית משפטית"><TextInput value={siteHe(wsite.contact?.taxNote)} onChange={(v) => setSiteContact({ taxNote: putHe(wsite.contact?.taxNote, v) })} placeholder="ע.ר. 580… · אישור ניהול תקין" /></Field>
      <Field label="⚖️ הצהרת נגישות (מופיעה בתחתית האתר; שורה לכל פסקה)">
        <textarea key={'a' + siteHe(wsite.accessibility)} style={{ ...TA_STYLE, minHeight: 120 }} defaultValue={siteHe(wsite.accessibility)} onBlur={(e) => setSite({ accessibility: putHe(wsite.accessibility, e.target.value) })} />
      </Field>
      <Field label="🔒 מדיניות פרטיות (מופיעה בתחתית האתר; שורה לכל פסקה)">
        <textarea key={'v' + siteHe(wsite.privacy)} style={{ ...TA_STYLE, minHeight: 120 }} defaultValue={siteHe(wsite.privacy)} onBlur={(e) => setSite({ privacy: putHe(wsite.privacy, e.target.value) })} />
      </Field>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        <Chip on={wsite.contactForm?.enabled !== false} onClick={() => setSiteForm({ enabled: wsite.contactForm?.enabled === false })}>
          {wsite.contactForm?.enabled !== false ? '✅ טופס-קשר מוצג' : 'טופס-קשר מוסתר'}
        </Chip>
      </div>
      <Field label="הערת טופס-הקשר"><TextInput value={siteHe(wsite.contactForm?.note)} onChange={(v) => setSiteForm({ note: putHe(wsite.contactForm?.note, v) })} placeholder="מענה תוך יום עסקים · דיסקרטיות מלאה" /></Field>
    </>
  );
}

/** 📡 עורך «שידור חי»: מילוי-מהמערכת (פעם ראשונה) / רענון-מספרים (שומר כותרות/הסתרה), ושליטה מלאה בכל ערך. */
function LiveEditor({ live, onChange, systemLive, siteHe, putHe, heLines, linesKeep }: {
  live: PublicSiteLive | undefined;
  onChange: (live: PublicSiteLive) => void;
  systemLive?: () => PublicSiteLive;
  siteHe: (v?: LocalizedText) => string;
  putHe: (old: LocalizedText | undefined, v: string) => LocalizedText | undefined;
  heLines: (arr?: LocalizedText[]) => string;
  linesKeep: (old: LocalizedText[] | undefined, text: string) => LocalizedText[];
}) {
  const L = live ?? {};
  const set = (p: Partial<PublicSiteLive>) => onChange({ ...L, ...p });
  const sys = systemLive ? systemLive() : undefined;
  const empty = !L.cards?.length && !L.today?.length && !L.week?.length && !L.ticker?.length && L.raised?.value === undefined;
  const fill = () => {
    if (!sys) return;
    if (empty) onChange({ ...sys, enabled: L.enabled });
    else onChange(refreshLive(L, sys));
  };
  const sysCard = (list: PublicSiteLiveCard[] | undefined, src?: string) => (src ? list?.find((c) => c.src === src)?.value : undefined);
  const cardRow = (list: 'cards' | 'today') => (it: PublicSiteLiveCard, setIt: (p: Partial<PublicSiteLiveCard>) => void) => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: list === 'cards' ? '56px 96px 1fr' : '96px 1fr', gap: 6 }}>
        {list === 'cards' && <Field label="אייקון"><TextInput value={it.icon ?? ''} onChange={(v) => setIt({ icon: v || undefined })} placeholder="🏠" /></Field>}
        <Field label="מספר"><TextInput dir="ltr" value={it.value} onChange={(v) => setIt({ value: v })} placeholder="למשל 1,234" /></Field>
        <Field label="כותרת"><TextInput value={siteHe(it.label)} onChange={(v) => setIt({ label: putHe(it.label, v) ?? '' })} placeholder="משפחות בליווי קבוע" /></Field>
      </div>
      <SysHint sys={sysCard(sys?.[list], it.src)} cur={it.value} onUse={() => setIt({ value: sysCard(sys?.[list], it.src) ?? it.value })} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
        {list === 'cards' && (
          <div style={{ flex: 1 }}><TextInput value={siteHe(it.badge)} onChange={(v) => setIt({ badge: putHe(it.badge, v) })} placeholder="תגית (רשות) — ‎+38 השנה" /></div>
        )}
        <Chip on={!it.hidden} onClick={() => setIt({ hidden: !it.hidden || undefined })}>{it.hidden ? '🙈 מוסתר באתר' : '👁 מוצג באתר'}</Chip>
      </div>
    </div>
  );
  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
        מספרים כוללים בלבד — בלי שמות. המערכת <b>מציעה</b> מספרים מנתוני-המשרד; אתם בודקים, משנים או מסתירים — ושום דבר לא עולה לאתר עד «שמירה ופרסום».
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '6px 0' }}>
        <Chip on={!!L.enabled} onClick={() => set({ enabled: !L.enabled || undefined })}>{L.enabled ? '✓ מוצג באתר' : 'כבוי — לא מוצג באתר'}</Chip>
        {sys && <Btn onClick={fill}>{empty ? '🔄 מילוי המספרים מהמערכת' : '🔄 רענון המספרים מהמערכת'}</Btn>}
        {L.asOf && <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>המספרים נכונים ל-{L.asOf.split('-').reverse().join('/')}</span>}
      </div>
      {!empty && (
        <>
          <Field label="כותרת החלק">
            <TextInput value={siteHe(L.title)} onChange={(v) => set({ title: putHe(L.title, v) })} placeholder="מה קורה עכשיו בבית." />
          </Field>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 6 }}>💰 גויסו השנה</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, alignItems: 'end' }}>
            <Field label="סכום (₪)"><input type="number" min={0} style={NUM_STYLE} value={L.raised?.value ?? ''} onChange={(e) => set({ raised: { ...L.raised, value: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)) } })} /></Field>
            <Field label="יעד שנתי (₪, רשות)"><input type="number" min={0} style={NUM_STYLE} value={L.raised?.goal ?? ''} onChange={(e) => set({ raised: { ...L.raised, goal: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)) } })} /></Field>
            <Chip on={!!L.raised?.show} onClick={() => set({ raised: { ...L.raised, show: !L.raised?.show || undefined } })}>{L.raised?.show ? '👁 מוצג' : '🙈 מוסתר'}</Chip>
          </div>
          <SysHint sys={sys?.raised?.value !== undefined ? '₪' + sys.raised.value.toLocaleString('he-IL') : undefined} cur={L.raised?.value !== undefined ? '₪' + L.raised.value.toLocaleString('he-IL') : ''} onUse={() => set({ raised: { ...L.raised, value: sys?.raised?.value } })} />
          <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8 }}>🗂 כרטיסים</div>
          <ListEditor<PublicSiteLiveCard> items={L.cards ?? []} onChange={(v) => set({ cards: v })} empty={() => ({ value: '', label: '' })} addLabel="כרטיס" row={cardRow('cards')} />
          <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8 }}>☀️ פס «היום»</div>
          <ListEditor<PublicSiteLiveCard> items={L.today ?? []} onChange={(v) => set({ today: v })} empty={() => ({ value: '', label: '' })} addLabel="נתון" row={cardRow('today')} />
          <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8 }}>📅 השבוע בבית (חגים וחוגים בלבד)</div>
          <ListEditor<PublicSiteLiveWeek>
            items={L.week ?? []}
            onChange={(v) => set({ week: v })}
            empty={() => ({ when: '', title: '' })}
            addLabel="שורה"
            row={(it, setIt) => (
              <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr', gap: 6 }}>
                <Field label="מתי"><TextInput value={it.when} onChange={(v) => setIt({ when: v })} placeholder="כ״א חשוון" /></Field>
                <Field label="מה"><TextInput value={siteHe(it.title)} onChange={(v) => setIt({ title: putHe(it.title, v) ?? '' })} placeholder="ערב נשים בבית" /></Field>
                <Field label="פירוט"><TextInput value={siteHe(it.note)} onChange={(v) => setIt({ note: putHe(it.note, v) })} placeholder="20:00" /></Field>
              </div>
            )}
          />
          <Field label="📣 פס עדכונים (שורה לכל עדכון — בלי שמות!)">
            <textarea key={'lt' + heLines(L.ticker)} style={TA_STYLE} defaultValue={heLines(L.ticker)} onBlur={(e) => set({ ticker: linesKeep(L.ticker, e.target.value) })} placeholder={'♡ 38 משפחות הצטרפו לבית השנה\n♡ הבית פתוח 24/7'} />
          </Field>
        </>
      )}
    </>
  );
}

/** רענון-ערכים לפי src (שומר כותרות/הסתרה/סדר) — עטיפה מקומית כדי שהעורך לא ימשוך את מנוע-הקיר לבנדל-האשף. */
function refreshLive(cur: PublicSiteLive, fresh: PublicSiteLive): PublicSiteLive {
  const upd = (list: PublicSiteLiveCard[] | undefined, src: PublicSiteLiveCard[] | undefined) =>
    list?.map((c) => {
      const f = c.src ? src?.find((x) => x.src === c.src) : undefined;
      return f ? { ...c, value: f.value, ...(f.badge ? { badge: f.badge } : {}) } : c;
    });
  return {
    ...cur,
    cards: upd(cur.cards, fresh.cards),
    today: upd(cur.today, fresh.today),
    raised: { ...cur.raised, value: fresh.raised?.value, goal: cur.raised?.goal ?? fresh.raised?.goal },
    week: fresh.week,
    ticker: fresh.ticker,
    asOf: fresh.asOf,
  };
}

/** 🧱 סדר-החלקים: ↑/↓ להזזה, 👁/🙈 להסתרה, ↺ חזרה לסדר-המקורי. נשמר ב-site.sections (חסר ⇒ הסדר של היום). */
function SectionOrderEditor({ site, onChange }: { site: PublicSiteContent; onChange: (s: PublicSiteContent['sections']) => void }) {
  const hidden = new Set(site.sections?.hidden ?? []);
  // הסדר המלא (כולל מוסתרים) — siteSectionOrder על אתר בלי מוסתרים
  const full = siteSectionOrder({ sections: { order: site.sections?.order } });
  const save = (order: SiteSectionKey[], hid: Set<SiteSectionKey>) => {
    const isDefault = order.every((k, i) => k === SITE_SECTION_KEYS[i]);
    const next = { ...(isDefault ? {} : { order }), ...(hid.size ? { hidden: SITE_SECTION_KEYS.filter((k) => hid.has(k)) } : {}) };
    onChange(Object.keys(next).length ? next : undefined);
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= full.length) return;
    const o = full.slice();
    [o[i], o[j]] = [o[j], o[i]];
    save(o, hidden);
  };
  const toggle = (k: SiteSectionKey) => {
    const h = new Set(hidden);
    if (h.has(k)) h.delete(k);
    else h.add(k);
    save(full, h);
  };
  const changed = !!site.sections?.order?.length || hidden.size > 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>מלמעלה למטה — כך יופיעו החלקים באתר (אחרי הפתיחה). חלק ריק לא מוצג גם אם הוא דלוק.</div>
      {full.map((k, i) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--line-soft)', borderRadius: 8, padding: '5px 8px', opacity: hidden.has(k) ? 0.55 : 1 }}>
          <span style={{ width: 22, fontSize: 11, color: 'var(--ink-faint)' }}>{i + 1}</span>
          <span style={{ flex: 1, fontSize: 13.5, textDecoration: hidden.has(k) ? 'line-through' : 'none' }}>{SITE_SECTION_LABELS[k]}</span>
          <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={'הזזה למעלה — ' + SITE_SECTION_LABELS[k]} style={MINI_BTN}>↑</button>
          <button type="button" onClick={() => move(i, 1)} disabled={i === full.length - 1} aria-label={'הזזה למטה — ' + SITE_SECTION_LABELS[k]} style={MINI_BTN}>↓</button>
          <button type="button" onClick={() => toggle(k)} aria-label={(hidden.has(k) ? 'הצגה — ' : 'הסתרה — ') + SITE_SECTION_LABELS[k]} style={{ ...MINI_BTN, minWidth: 74 }}>{hidden.has(k) ? '🙈 מוסתר' : '👁 מוצג'}</button>
        </div>
      ))}
      {changed && <div><Btn onClick={() => onChange(undefined)}>↺ חזרה לסדר המקורי</Btn></div>}
    </div>
  );
}
