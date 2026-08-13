// ─────────────────────────────────────────────────────────────────────────────
// telephony · generate — המנוע. tenant מנורמל → קונפיג-מרכזייה מוכן-להתקנה.
//
// זו אבן-הפינה של המוצר: הלקוח ממלא נתונים, והמערכת מחוללת לבד את כל הניתוב.
// הפלט דטרמיניסטי (אין Date/Math.random) ⇒ ניתן-להקפאה כ-golden ולהשוואה ביט-לביט.
//
// עיקרון-ברזל (pure-downstream) נאכף בקוד: הדיאלפלן מדבר רק עם ציוד-הלקוח —
// שער-GSM עם ה-SIM שלו — ועם ה-softphones של הלקוח. אין gateway של שום ספק,
// אין SIP-trunk שנקנה מחברה, אין API-ספק. device-link (ווצאפ) מדולג מהדיאלפלן
// הקולי לגמרי. virtual/customer-forward = הלקוח מפנה אצל הספק הקיים שלו אלינו.
// ─────────────────────────────────────────────────────────────────────────────

const XML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => XML_ESC[c]);
}

// 0=ראשון..6=שבת (המודל שלנו) → wday של FreeSWITCH (1=ראשון..7=שבת).
function daysToWday(days) {
  const w = days.map((d) => d + 1).sort((a, b) => a - b);
  // כווץ לטווחים רציפים: [1,2,3,4,5] → "1-5"; [1,3,5] → "1,3,5".
  const parts = [];
  let start = w[0];
  let prev = w[0];
  for (let i = 1; i <= w.length; i++) {
    if (i < w.length && w[i] === prev + 1) {
      prev = w[i];
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    if (i < w.length) {
      start = w[i];
      prev = w[i];
    }
  }
  return parts.join(',');
}

// "09:00" → "9:00" (FreeSWITCH time-of-day לא אוהב אפס-מוביל בשעה).
function fsTime(hhmm) {
  const [h, m] = hhmm.split(':');
  return `${Number(h)}:${m}`;
}

// regex-escape של e164 לתוך expression (הנקודה/הפלוס הם מטא).
function reEsc(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** מספרים נושאי-קול שמגיעים בפועל לדיאלפלן (לא device-link). */
function voiceNumbers(tenant) {
  return tenant.numbers.filter((n) => n.channels.includes('voice') && n.onramp !== 'device-link');
}
/** מספרי-יציאה: SIM בשער עם ערוץ. */
function outboundSims(tenant) {
  return tenant.numbers
    .filter((n) => n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel))
    .sort((a, b) => a.gatewayChannel - b.gatewayChannel);
}

// ── דיאלפלן: context הלקוח ──────────────────────────────────────────────────
function dialplanXml(tenant) {
  const ctx = `tenant_${tenant.tenantId}`;
  const gw = `${tenant.tenantId}-gw`;
  const oh = tenant.officeHours;
  const wday = daysToWday(oh.days);
  const tod = `${fsTime(oh.start)}-${fsTime(oh.end)}`;
  const office = tenant.destinations.office;
  const manager = tenant.destinations.manager;
  const vm = tenant.destinations.voicemail;
  const vnums = voiceNumbers(tenant);
  const sims = outboundSims(tenant);

  const officeBridge = office.ext
    .map((e) => `user/${esc(e)}@${esc(tenant.tenantId)}`)
    .join(',');

  const L = [];
  L.push(`<?xml version="1.0" encoding="utf-8"?>`);
  L.push(`<!-- מחולל אוטומטית מקונפיג-הלקוח. אין לערוך ידנית — ערוך את הנתונים והרץ מחדש. -->`);
  L.push(`<!-- ${esc(tenant.orgName)} · pure-downstream · ${vnums.length} מספרים נושאי-קול · ${sims.length} ערוצי-יציאה -->`);
  L.push(`<include>`);
  L.push(`  <context name="${esc(ctx)}">`);

  // 1. ברירת-מחדל: משרד סגור.
  L.push(``);
  L.push(`    <!-- שער-הזמן: ברירת-מחדל סגור, נפתח רק בחלון שעות-המשרד -->`);
  L.push(`    <extension name="office_default" continue="true">`);
  L.push(`      <condition>`);
  L.push(`        <action application="set" data="office_open=false"/>`);
  L.push(`      </condition>`);
  L.push(`    </extension>`);

  // 2. חלון שעות-משרד.
  L.push(`    <extension name="office_open_window" continue="true">`);
  L.push(`      <condition wday="${wday}" time-of-day="${tod}">`);
  L.push(`        <action application="set" data="office_open=true"/>`);
  L.push(`      </condition>`);
  L.push(`    </extension>`);

  // 3. כניסה פר-DID → זיהוי-קו → transfer ל-incoming.
  L.push(``);
  L.push(`    <!-- כניסה: כל מספר נושא-קול מזוהה לפי ה-DID ומנותב פנימה -->`);
  for (const n of vnums) {
    L.push(`    <extension name="in_${esc(n.id)}">`);
    L.push(`      <condition field="destination_number" expression="^${reEsc(n.e164)}$">`);
    L.push(`        <action application="set" data="inbound_line=${esc(n.label)}"/>`);
    L.push(`        <action application="set" data="inbound_number=${esc(n.e164)}"/>`);
    L.push(`        <action application="transfer" data="incoming XML ${esc(ctx)}"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  // 4. ניתוב-פנימי: פתוח → משרד, אחרת → אחרי-שעות.
  L.push(``);
  L.push(`    <!-- ניתוב: פתוח → משרד (אין-מענה נופל לאחרי-שעות); סגור → מנהל → תא-קולי -->`);
  L.push(`    <extension name="incoming">`);
  L.push(`      <condition field="destination_number" expression="^incoming$"/>`);
  L.push(`      <condition field="\${office_open}" expression="^true$">`);
  L.push(`        <action application="bridge" data="{leg_timeout=${office.ringSeconds}}${esc(officeBridge)}"/>`);
  L.push(`        <action application="transfer" data="afterhours XML ${esc(ctx)}"/>`);
  L.push(`        <anti-action application="transfer" data="afterhours XML ${esc(ctx)}"/>`);
  L.push(`      </condition>`);
  L.push(`    </extension>`);

  // 5. אחרי-שעות: מנהל → תא-קולי.
  L.push(`    <extension name="afterhours">`);
  L.push(`      <condition field="destination_number" expression="^afterhours$">`);
  L.push(`        <action application="bridge" data="{leg_timeout=${manager.ringSeconds}}user/${esc(manager.ext)}@${esc(tenant.tenantId)}"/>`);
  L.push(`        <action application="answer"/>`);
  L.push(`        <action application="sleep" data="500"/>`);
  L.push(`        <action application="voicemail" data="default ${esc(tenant.tenantId)} ${esc(vm.box)}"/>`);
  L.push(`      </condition>`);
  L.push(`    </extension>`);

  // 6. יציאה: קידומת N# → SIM לפי ערוץ-שער.
  L.push(``);
  L.push(`    <!-- יציאה: קידומת <ערוץ>#<מספר> בוחרת דרך איזה SIM לצאת -->`);
  for (const n of sims) {
    L.push(`    <extension name="out_pick_${esc(n.id)}">`);
    L.push(`      <condition field="destination_number" expression="^${n.gatewayChannel}#(\\+?\\d+)$">`);
    L.push(`        <action application="set" data="effective_caller_id_number=${esc(n.e164)}"/>`);
    L.push(`        <action application="set" data="effective_caller_id_name=${esc(n.label)}"/>`);
    L.push(`        <action application="bridge" data="sofia/gateway/${esc(gw)}${n.gatewayChannel}/$1"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  // 7. יציאת-ברירת-מחדל (בלי קידומת) → המספר שנבחר.
  const def = sims.find((n) => n.id === tenant.outbound.defaultNumberId) || sims[0];
  if (def) {
    L.push(`    <!-- יציאת-ברירת-מחדל (חיוג רגיל בלי קידומת) → ${esc(def.label)} -->`);
    L.push(`    <extension name="out_default">`);
    L.push(`      <condition field="destination_number" expression="^(0\\d{7,9}|\\+?\\d{8,15})$">`);
    L.push(`        <action application="set" data="effective_caller_id_number=${esc(def.e164)}"/>`);
    L.push(`        <action application="bridge" data="sofia/gateway/${esc(gw)}${def.gatewayChannel}/$1"/>`);
    L.push(`      </condition>`);
    L.push(`    </extension>`);
  }

  L.push(`  </context>`);
  L.push(`</include>`);
  L.push(``);
  return L.join('\n');
}

// ── directory: משתמשים (משרד, מנהל, תא-קולי) ────────────────────────────────
function directoryXml(tenant) {
  const domain = tenant.tenantId;
  const office = tenant.destinations.office;
  const manager = tenant.destinations.manager;
  const vm = tenant.destinations.voicemail;
  // אקסטנשנים ייחודיים: כל ה-office + המנהל.
  const exts = [...new Set([...office.ext, manager.ext])];

  const L = [];
  L.push(`<?xml version="1.0" encoding="utf-8"?>`);
  L.push(`<!-- מחולל אוטומטית — משתמשי ${esc(tenant.orgName)}. סיסמאות מוזרקות בהתקנה. -->`);
  L.push(`<include>`);
  L.push(`  <domain name="${esc(domain)}">`);
  L.push(`    <users>`);
  for (const ext of exts) {
    const isManager = ext === manager.ext;
    L.push(`      <user id="${esc(ext)}">`);
    L.push(`        <params>`);
    L.push(`          <param name="password" value="$\${default_provision_password}"/>`);
    L.push(`          <param name="vm-password" value="${esc(vm.box)}"/>`);
    if (isManager && vm.email) {
      L.push(`          <param name="vm-mailto" value="${esc(vm.email)}"/>`);
      L.push(`          <param name="vm-attach-file" value="true"/>`);
    }
    L.push(`        </params>`);
    L.push(`        <variables>`);
    L.push(`          <variable name="user_context" value="tenant_${esc(tenant.tenantId)}"/>`);
    L.push(`          <variable name="effective_caller_id_name" value="${esc(isManager ? 'מנהל' : 'משרד')} ${esc(tenant.orgName)}"/>`);
    L.push(`          <variable name="toll_allow" value="domestic"/>`);
    L.push(`        </variables>`);
    L.push(`      </user>`);
  }
  L.push(`    </users>`);
  L.push(`  </domain>`);
  L.push(`</include>`);
  L.push(``);
  return L.join('\n');
}

// ── gateways: שער-ה-GSM של הלקוח (ציוד-לקוח, downstream) ─────────────────────
function gatewaysXml(tenant) {
  const gw = `${tenant.tenantId}-gw`;
  const sims = outboundSims(tenant);
  const L = [];
  L.push(`<?xml version="1.0" encoding="utf-8"?>`);
  L.push(`<!-- שער-ה-GSM של הלקוח (ציוד בבעלותו, עם ה-SIM שלו). זה לא ספק — זה הלקוח. -->`);
  L.push(`<!-- כתובת-ה-IP והסיסמה מוזרקות בהתקנה לפי הרשת של הלקוח. -->`);
  L.push(`<include>`);
  for (const n of sims) {
    L.push(`  <gateway name="${esc(gw)}${n.gatewayChannel}">`);
    L.push(`    <!-- ${esc(n.label)} · ${esc(n.e164)}${n.kosher ? ' · כשר' : ''} · ערוץ ${n.gatewayChannel} -->`);
    L.push(`    <param name="username" value="${esc(gw)}${n.gatewayChannel}"/>`);
    L.push(`    <param name="password" value="$\${gsm_gateway_password}"/>`);
    L.push(`    <param name="proxy" value="$\${gsm_gateway_ip}"/>`);
    L.push(`    <param name="register" value="false"/>`);
    L.push(`    <param name="caller-id-in-from" value="true"/>`);
    L.push(`    <!-- שיחה נכנסת מה-SIM הזה נופלת ישר ל-context של הלקוח -->`);
    L.push(`    <param name="context" value="tenant_${esc(tenant.tenantId)}"/>`);
    L.push(`  </gateway>`);
  }
  L.push(`</include>`);
  L.push(``);
  return L.join('\n');
}

// ── manifest: תקציר-מה-שחולל + מפת-מסלולים + סייגים ──────────────────────────
function manifest(tenant, warnings) {
  const vnums = voiceNumbers(tenant);
  const sims = outboundSims(tenant);
  const skipped = tenant.numbers.filter((n) => n.onramp === 'device-link' || !n.channels.includes('voice'));
  return {
    tenantId: tenant.tenantId,
    orgName: tenant.orgName,
    model: 'pure-downstream',
    context: `tenant_${tenant.tenantId}`,
    officeHours: tenant.officeHours,
    inboundVoiceNumbers: vnums.map((n) => ({ id: n.id, e164: n.e164, label: n.label, onramp: n.onramp, kosher: n.kosher })),
    outboundSims: sims.map((n) => ({ id: n.id, e164: n.e164, label: n.label, prefix: `${n.gatewayChannel}#`, channel: n.gatewayChannel })),
    outboundDefault: tenant.outbound.defaultNumberId,
    nonVoiceChannels: skipped.map((n) => ({ id: n.id, e164: n.e164, label: n.label, type: n.type, onramp: n.onramp, channels: n.channels, note: n.onramp === 'device-link' ? 'ווצאפ ריבוי-מכשירים — מטופל בגשר-הודעות, לא בדיאלפלן הקולי' : 'לא נושא-קול' })),
    cti: tenant.cti,
    files: [
      `dialplan/tenant_${tenant.tenantId}.xml`,
      `directory/${tenant.tenantId}.xml`,
      `sip_profiles/gateways/${tenant.tenantId}.xml`,
    ],
    warnings,
  };
}

/**
 * המנוע הראשי. tenant מנורמל (מ-validateTenant) → מפת-קבצים + manifest.
 * @param {object} tenant
 * @param {string[]} [warnings=[]] סייגים מהוולידציה — נצרבים ל-manifest.
 * @returns {{files: Record<string,string>, manifest: object}}
 */
export function generateConfig(tenant, warnings = []) {
  const m = manifest(tenant, warnings);
  const files = {
    [`dialplan/tenant_${tenant.tenantId}.xml`]: dialplanXml(tenant),
    [`directory/${tenant.tenantId}.xml`]: directoryXml(tenant),
    [`sip_profiles/gateways/${tenant.tenantId}.xml`]: gatewaysXml(tenant),
    'manifest.json': JSON.stringify(m, null, 2) + '\n',
  };
  return { files, manifest: m };
}
