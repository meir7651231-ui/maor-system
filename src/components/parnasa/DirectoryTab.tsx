/**
 * 📒 פרנסה׳לע — לשונית 📇 מדריך (אשכול 5). שני מצבים, כמו "אלפון" של המקור:
 *   · "מה צריך?" — שאילתה במילים של הפונה ⇒ searchListings (מושגי-בעיה/תחיליות/גזע/שגיאת-כתיב,
 *     דירוג כיסוי ⇒ שכבה ⇒ מודגש ⇒ פתוח-עכשיו ⇒ המלצות); שורת-הד עם המושגים שזוהו; אין תוצאה ⇒
 *     פתיחת בקשה ממולאת (ניתוב לבעלי-המקצוע בתחום).
 *   · עיון — צ'יפי-שערים (15 שערי-המקור) + מסננים, מקובץ לפי שער (מודגשים ראשונים).
 * מסננים זכורים בין מסכים (useRemembered) + חזרה מהכרטיס למקום-הגלילה (useListScrollRestore).
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { useRemembered } from '../../lib/filterMemory';
import { useListScrollRestore } from '../../lib/scrollMemory';
import { downloadCsv } from '../reports/csv';
import type { PrAd, PrListing, PrRequest } from '../../types/domain';
import { Btn, Chip, Empty, TextInput } from '../ui';
import { adRotation, categoryOf, filterListings, listingsCsvRows, PR_CATEGORIES, PR_CONCEPTS, searchListings } from './lib';
import { ListingCard } from './ListingCard';
import { ListingDetail } from './ListingDetail';
import { ListingForm } from './ListingForm';
import { usePrBrand, usePrPerms, type PrNow } from './hooks';

type Aud = 'all' | 'men' | 'women';

/** תיבת-החסות בראש השער (התורנית של היום — סבב-יומי מהמנוע). */
function GateSponsor(props: { ad: PrAd | null }) {
  const a = props.ad;
  if (!a) return null;
  return (
    <div style={{ fontSize: 12.5, border: '1px dashed #b08d2e', borderRadius: 8, padding: '4px 10px' }}>
      {'👑 השער בחסות '}
      <b>{a.advertiser}</b>
      {[a.headline, a.phone].filter((x) => x && x.trim()).map((x) => ' · ' + x).join('')}
    </div>
  );
}

export function DirectoryTab(props: {
  now: PrNow;
  q: string;
  setQ: (q: string) => void;
  selId: string | null;
  setSelId: (id: string | null) => void;
  /** "לא מצאתי" ⇒ פתיחת בקשה ממולאת (null = לשונית-הבקשות כבויה). */
  onNewRequest: ((draft: Partial<PrRequest>) => void) | null;
}) {
  const config = useApp((s) => s.config);
  const listings = useApp((s) => s.db.prListings);
  const ads = useApp((s) => s.db.prAds);
  const logAccess = useApp((s) => s.logAccess);
  const toast = useApp((s) => s.toast);
  const brand = usePrBrand();
  const { canApprove } = usePrPerms();
  const [cat, setCat] = useRemembered<string>('parnasa.dir.cat', '');
  const [disc, setDisc] = useRemembered<boolean>('parnasa.dir.disc', false);
  const [free, setFree] = useRemembered<boolean>('parnasa.dir.free', false);
  const [emergency, setEmergency] = useRemembered<boolean>('parnasa.dir.emergency', false);
  const [openOnly, setOpenOnly] = useRemembered<boolean>('parnasa.dir.open', false);
  const [aud, setAud] = useRemembered<Aud>('parnasa.dir.aud', 'all');
  const [showAll, setShowAll] = useRemembered<boolean>('parnasa.dir.all', false);
  const [formOpen, setFormOpen] = useState(false);
  const sel = props.selId ? (listings.find((l) => l.id === props.selId) ?? null) : null;
  useListScrollRestore('parnasa.dir', !!sel);

  const { now } = props;
  const query = props.q.trim();
  const word = termOf(config, 'entity.prListing', 'עסק');
  const words = termOf(config, 'entity.prListings', 'עסקים');
  const reqWord = termOf(config, 'entity.prRequest', 'בקשה');
  const exportOn = featureOn(config, 'parnasa.export');
  const adsOn = featureOn(config, 'parnasa.ads');

  /** מסננים משותפים לשני המצבים (חיפוש ⇒ אחרי הדירוג). */
  const passes = useMemo(() => {
    const keep = new Set(
      filterListings(listings, {
        category: cat || undefined,
        disc,
        free,
        emergency,
        aud,
        includeAll: canApprove && showAll,
        openOnly: openOnly ? { clock: now.clock, closureAt: now.closureAt } : undefined,
        todayIso: now.todayIso,
      }).map((l) => l.id),
    );
    return (l: PrListing) => keep.has(l.id);
  }, [listings, cat, disc, free, emergency, aud, canApprove, showAll, openOnly, now]);

  const search = useMemo(
    () => (query ? searchListings(query, listings, { todayIso: now.todayIso, clock: now.clock, closureAt: now.closureAt }, 500) : null),
    [query, listings, now],
  );

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of listings) if (l.status === 'approved') m.set(categoryOf(l.category).key, (m.get(categoryOf(l.category).key) ?? 0) + 1);
    return m;
  }, [listings]);
  const approvedCount = [...counts.values()].reduce((a, b) => a + b, 0);

  if (sel) return <ListingDetail listing={sel} now={now} onBack={() => props.setSelId(null)} />;

  const hits = search ? search.hits.filter((h) => passes(h.listing)) : [];
  const browse = search ? [] : listings.filter(passes);
  const gates = PR_CATEGORIES.map((c) => ({ cat: c, items: browse.filter((l) => categoryOf(l.category).key === c.key) })).filter((g) => g.items.length);
  const topCat = search ? (PR_CONCEPTS.find((c) => c.k === search.analysis.cons[0]?.k)?.c ?? '') : '';

  function exportCsv() {
    logAccess('ייצוא מדריך ' + termOf(config, 'nav.parnasa', 'פרנסה׳לע') + ' (CSV)', approvedCount + ' ' + words);
    downloadCsv('parnasa-directory.csv', listingsCsvRows(listings, now.todayIso));
    toast('המדריך ירד כקובץ CSV — מאושרים בלבד, בלי הערות פנימיות');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>מה צריך?</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>כותבים את הבעיה במילים שלכם, ומקבלים את האדם הנכון.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextInput value={props.q} onChange={props.setQ} placeholder="נזילה, קצר בחשמל, מלמד…" ariaLabel="מה צריך?" />
          {props.q && (
            <Btn sm onClick={() => props.setQ('')}>
              ✕ ניקוי
            </Btn>
          )}
          <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {exportOn && approvedCount > 0 && (
              <Btn sm onClick={exportCsv} title="להדפסה, לבית המדרש ולמי שיש לו טלפון כשר">
                ⬇ ייצוא CSV
              </Btn>
            )}
            <Btn kind="primary" onClick={() => setFormOpen(true)}>
              ➕ הוספת {termOf(config, 'entity.prListing', 'עסק')}
            </Btn>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Chip on={!cat} onClick={() => setCat('')}>
            {'הכול (' + approvedCount + ')'}
          </Chip>
          {PR_CATEGORIES.filter((c) => counts.has(c.key) || c.key === cat).map((c) => (
            <Chip key={c.key} on={cat === c.key} onClick={() => setCat(cat === c.key ? '' : c.key)}>
              {c.icon + ' ' + c.short + ' (' + (counts.get(c.key) ?? 0) + ')'}
            </Chip>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip on={openOnly} onClick={() => setOpenOnly(!openOnly)}>
            🟢 פתוח עכשיו
          </Chip>
          <Chip on={disc} onClick={() => setDisc(!disc)}>
            הנחה לקהילה
          </Chip>
          <Chip on={free} onClick={() => setFree(!free)}>
            גמ״ח
          </Chip>
          <Chip on={emergency} onClick={() => setEmergency(!emergency)}>
            🚨 חירום
          </Chip>
          <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>מתאים ל:</span>
          {(['all', 'men', 'women'] as const).map((a) => (
            <Chip key={a} on={aud === a} onClick={() => setAud(a)}>
              {a === 'all' ? 'כולם' : a === 'men' ? 'גברים' : 'נשים'}
            </Chip>
          ))}
          {canApprove && !query && (
            <Chip on={showAll} onClick={() => setShowAll(!showAll)}>
              כולל ממתינים ומוסתרים
            </Chip>
          )}
        </div>
      </div>

      {search && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}>
          <span style={{ fontWeight: 800 }}>{'״' + query + '״'}</span>
          {search.concepts.length > 0 && <span>←</span>}
          {search.concepts.map((c) => (
            <Chip key={c}>{c}</Chip>
          ))}
          {search.nameHit && <Chip>שם</Chip>}
          {search.locHit && <Chip>אזור</Chip>}
          <span style={{ color: 'var(--ink-faint)' }}>{hits.length + ' תוצאות'}</span>
        </div>
      )}

      {search && hits.length === 0 && (
        <Empty>
          <div style={{ fontWeight: 800 }}>עוד אין לנו תשובה לזה.</div>
          <div>{'אבל הקהילה כן — פותחים ' + reqWord + ', והיא מנותבת לבעלי המקצוע בתחום.'}</div>
          {props.onNewRequest && (
            <div style={{ marginTop: 8 }}>
              <Btn kind="primary" onClick={() => props.onNewRequest?.({ text: query, category: topCat })}>
                {'➕ פתיחת ' + reqWord + ': ״' + query + '״'}
              </Btn>
            </div>
          )}
        </Empty>
      )}
      {search && hits.length > 0 && hits.length <= 2 && props.onNewRequest && (
        <div style={{ fontSize: 12.5 }}>
          {(hits.length === 1 ? 'רק תוצאה אחת?' : 'רק ' + hits.length + ' תוצאות?') + ' '}
          <Btn sm onClick={() => props.onNewRequest?.({ text: query, category: topCat })}>
            {'פתיחת ' + reqWord + ' לבעלי המקצוע'}
          </Btn>
        </div>
      )}
      {search && hits.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {hits.map((h) => (
            <ListingCard key={h.listing.id} listing={h.listing} now={now} brand={brand} query={query} via={h.via} onOpen={() => props.setSelId(h.listing.id)} />
          ))}
        </div>
      )}

      {!search && listings.length === 0 && (
        <Empty>
          <div style={{ fontWeight: 800 }}>המדריך מחכה לכרטיס הראשון…</div>
          <div>{'הוסיפו ' + word + ' עם "➕ הוספת ' + word + '" — בהסכמתו, גם מי שיש לו רק טלפון כשר.'}</div>
        </Empty>
      )}
      {!search && listings.length > 0 && gates.length === 0 && <Empty>לא נמצא מתאים — נסו להסיר מסנן.</Empty>}
      {!search &&
        gates.map((g) => (
          <section key={g.cat.key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, borderBottom: '2px solid ' + g.cat.color, paddingBottom: 3 }}>
              {g.cat.num + ' · ' + g.cat.icon + ' ' + g.cat.name + ' — ' + g.items.length + ' כרטיסים'}
            </h2>
            {adsOn && <GateSponsor ad={adRotation(ads, 'category', now.todayIso, g.cat.key).today} />}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {g.items.map((l) => (
                <ListingCard key={l.id} listing={l} now={now} brand={brand} onOpen={() => props.setSelId(l.id)} />
              ))}
            </div>
          </section>
        ))}

      {formOpen && <ListingForm listing={null} onClose={() => setFormOpen(false)} onSaved={(l) => props.setSelId(l.id)} />}
    </div>
  );
}
