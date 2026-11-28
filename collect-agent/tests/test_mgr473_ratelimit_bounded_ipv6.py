"""מנהל 473 (מבקר 294🟡 + ℹ️): RateLimiter חסום ומופחת, IPv6 מקובץ ל-/64, TRUST_PROXY_HEADERS מתועד.

לפני: מעבר ל-max_keys כל בקשה הריצה gc מלא (סריקת 50k חלונות בתוך ה-middleware) והמפתחות גדלו בלי גבול;
סיבוב כתובות IPv6 בתוך /64 עקף את ההגבלה פר-כתובת.
"""
from __future__ import annotations

from pathlib import Path

from app.ratelimit import RateLimiter, Rule, ip_key


class Clock:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


def test_ip_key_groups_ipv6_by_64_and_keeps_ipv4():
    assert ip_key("2001:db8:1:2::1") == ip_key("2001:db8:1:2:ffff::9") == "2001:db8:1:2::/64"
    assert ip_key("2001:db8:1:3::1") != ip_key("2001:db8:1:2::1")
    assert ip_key("203.0.113.7") == "203.0.113.7"
    assert ip_key("::ffff:203.0.113.7") == "203.0.113.7"
    assert ip_key("fe80::1%eth0") == "fe80::/64"
    assert ip_key("unknown") == "unknown"
    assert ip_key("testclient") == "testclient"


def test_rotation_inside_64_hits_the_same_limit():
    rl = RateLimiter(rules={"public_link": Rule(5, 60)}, clock=Clock())
    res = [rl.check("public_link", ip_key(f"2001:db8::{i:x}")) for i in range(6)]
    assert res[:5] == [None] * 5
    assert res[5] is not None


def test_bounded_and_amortized_gc():
    rl = RateLimiter(max_keys=1000, clock=Clock())
    calls = {"n": 0}
    orig = rl.gc
    rl.gc = lambda: (calls.__setitem__("n", calls["n"] + 1), orig())[1]
    for i in range(5000):
        rl.check("public_link", f"10.0.{i // 256}.{i % 256}")
        assert len(rl._hits) <= 1000
    # 4000 מפתחות מעבר לתקרה, gc מוריד ל-900 ⇒ ~40 ריצות (לא 4000)
    assert calls["n"] <= 45


def test_lru_keeps_active_blocked_key_while_rotation_floods():
    """מפתח חסום שממשיך לנסות (נגיש לאחרונה) לא מפונה ע"י הצפת מפתחות חדשים — החסימה נשמרת."""
    clk = Clock()
    rl = RateLimiter(rules={"public_link": Rule(3, 60)}, max_keys=100, clock=clk)
    for _ in range(3):
        assert rl.check("public_link", "attacker") is None
    for i in range(1000):
        rl.check("public_link", f"r{i}")
        if i % 50 == 0:
            assert rl.check("public_link", "attacker") is not None  # עדיין חסום ונגיש ⇒ לא מפונה
    assert rl.check("public_link", "attacker") is not None


def test_expired_windows_collected_before_lru_eviction():
    clk = Clock()
    rl = RateLimiter(rules={"public_link": Rule(60, 60)}, max_keys=10, clock=clk)
    for i in range(10):
        rl.check("public_link", f"old{i}")
    clk.t += 61  # כולם פגו
    for i in range(2):
        rl.check("public_link", f"new{i}")
    assert set(k[1] for k in rl._hits) == {"new0", "new1"}


def test_blocked_without_record_does_not_create_keys():
    rl = RateLimiter(clock=Clock())
    assert rl.blocked("auth_fail", "1.2.3.4") is None
    assert rl.check("public_link", "1.2.3.4", record=False) is None
    assert len(rl._hits) == 0


def test_trust_proxy_documented_in_env_example():
    env = (Path(__file__).resolve().parent.parent / ".env.example").read_text(encoding="utf-8")
    assert "TRUST_PROXY_HEADERS=" in env
