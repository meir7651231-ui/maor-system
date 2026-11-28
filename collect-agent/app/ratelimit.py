"""הגבלת קצב (in-process, חלון זז). טהור + שעון מוזרק ⇒ נבדק ביחידה.

למה ברמת האפליקציה ולא רק ב-proxy: הנתיבים הציבוריים (`/p/{code}`, `/u/{token}`) הם
bearer-tokens — קוד קצר של 7 תווים ניתן לניחוש בלי הגבלה; ה-webhook של חשבונית ירוקה
מפעיל sync מלא (עומס על ה-API של העסק); כשלי אימות חוזרים = ניחוש טוקן.
בשלב 2 (כמה תהליכים) ⇒ להעביר את המונים ל-Redis/proxy; הממשק נשאר.
"""
from __future__ import annotations

import ipaddress
import time
from collections import OrderedDict, deque
from collections.abc import Callable
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Rule:
    limit: int
    window_s: float


# (קבוצה) ⇒ כלל. פר-IP אלא אם צוין global.
DEFAULT_RULES: dict[str, Rule] = {
    "public_link": Rule(60, 60),      # /p/ /u/ /pay/ /api/pay/ — עמוד = כמה בקשות, לא מאות
    "webhook": Rule(120, 60),         # 019 / מייל / inbound חתום — בלי מפתח תקין (ניחוש)
    # מבקר 293א: webhook עם מפתח תקין = הספק עצמו. כל ה-push-ים של 019 (dlr/incoming_sms/blacklist) באים
    # מאותם שרתים ⇒ אחרי שליחת בוקר 120 דיווחי מסירה מילאו את הדלי ו«הסר» באותה דקה קיבל 429. דלי נפרד וגבוה
    # (הגנת עומס בלבד אם המפתח דלף) — לא חולק עם ניסיונות ללא מפתח.
    "webhook_auth": Rule(3000, 60),
    "gi_webhook_global": Rule(6, 60),  # כל קריאה = sync מלא מול חשבונית ירוקה
    "auth_fail": Rule(30, 300),       # כשלי אימות לבעלים מאותו IP
    "orbit_connect": Rule(20, 60),    # /connect/orbit + אימות טוקן-המסירה מאורביט (טוקן = ניחוש חתימה)
}


def ip_key(ip: str) -> str:
    """מבקר 294: מפתח ההגבלה לכתובת. IPv6 ⇒ רשת /64 (לקוח אחד מקבל /64 שלם — 2⁶⁴ כתובות; בלי קיבוץ, סיבוב כתובות
    עוקף את ההגבלה פר-כתובת). IPv4-mapped ⇒ ה-IPv4. לא-כתובת (unknown / שם מארח בבדיקות) ⇒ כפי שהוא."""
    try:
        addr = ipaddress.ip_address(ip.strip().split("%", 1)[0])
    except ValueError:
        return ip
    if isinstance(addr, ipaddress.IPv6Address):
        if addr.ipv4_mapped is not None:
            return str(addr.ipv4_mapped)
        return str(ipaddress.IPv6Network((addr, 64), strict=False))
    return str(addr)


def group_for(path: str) -> str | None:
    if path in ("/connect/orbit", "/api/connect/orbit"):
        return "orbit_connect"
    if path.startswith(("/p/", "/u/", "/pay/", "/api/pay/")):
        return "public_link"
    if path.startswith("/webhooks/") or path in ("/inbound", "/conversation/inbound"):
        return "webhook"
    return None


@dataclass
class RateLimiter:
    rules: dict[str, Rule] = field(default_factory=lambda: dict(DEFAULT_RULES))
    clock: Callable[[], float] = time.monotonic
    max_keys: int = 50_000  # הגנת זיכרון: תקרה קשיחה למספר המפתחות
    # מבקר 294: gc מנקה עד סימן-מים נמוך (90%) ⇒ רץ פעם בכ-10% מפתחות חדשים, לא בכל בקשה (סריקה מלאה בתוך
    # ה-middleware האסינכרוני חסמה את לולאת האירועים). מה שלא פג ונשאר מעל הסימן ⇒ פינוי LRU (הנגישים הכי מזמן).
    low_water: float = 0.9
    _hits: OrderedDict[tuple[str, str], deque] = field(default_factory=OrderedDict)

    def _prune(self, q: deque, now: float, window: float) -> None:
        while q and now - q[0] >= window:
            q.popleft()

    def check(self, group: str, key: str, *, record: bool = True) -> float | None:
        """None = מותר (ונרשם); אחרת = שניות עד שיתאפשר (Retry-After)."""
        rule = self.rules.get(group)
        if rule is None:
            return None
        now = self.clock()
        k = (group, key)
        q = self._hits.get(k)
        if q is None:
            q = deque()
            if record:
                self._hits[k] = q
        else:
            self._hits.move_to_end(k)  # LRU: נגיש עכשיו
        self._prune(q, now, rule.window_s)
        if len(q) >= rule.limit:
            return max(0.0, rule.window_s - (now - q[0]))
        if record:
            q.append(now)
            if len(self._hits) > self.max_keys:
                self.gc()
        return None

    def blocked(self, group: str, key: str) -> float | None:
        """בודק בלי לרשום (למשל: האם ה-IP כבר חסום בגלל כשלי אימות)."""
        rule = self.rules.get(group)
        if rule is None:
            return None
        now = self.clock()
        q = self._hits.get((group, key))
        if not q:
            return None
        self._prune(q, now, rule.window_s)
        return max(0.0, rule.window_s - (now - q[0])) if len(q) >= rule.limit else None

    def gc(self) -> None:
        now = self.clock()
        for k in list(self._hits):
            rule = self.rules.get(k[0])
            q = self._hits[k]
            if rule:
                self._prune(q, now, rule.window_s)
            if not q:
                del self._hits[k]
        target = int(self.max_keys * self.low_water)
        while len(self._hits) > target:
            self._hits.popitem(last=False)  # LRU — הישן ביותר בגישה
