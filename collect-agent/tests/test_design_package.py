"""חבילת גבי עיצוב מוכנה לחתימה (marketing/ads/SIGN-OFF.md) — הבדיקה נכשלת אם משהו חסר או סוטה:
כל נכס קיים במידות הנכונות, הסרטונים (רגיל+שקט) קיימים עם/בלי אודיו, אין gabi.example/«דמו»/«מוק» בטקסט
המודעות, המחיר המלא + מע״מ במודעות ובכרטיס-הסיום, והדומיין נקרא רק ממקור-השיווק היחיד."""
from __future__ import annotations

import json
import struct
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
ADS = ROOT / "marketing/ads"
VID = ROOT / "marketing/video"
SIZES = {
    "thumb-16x9": (1280, 720), "thumb-9x16": (1080, 1920), "ad-square-1x1": (1080, 1080),
    "ad-feed-1200x628": (1200, 628), "ad-portrait-4x5": (1080, 1350), "ad-story-9x16": (1080, 1920),
    **{f"vert-{v}-1x1": (1080, 1080) for v in ("barber", "garage", "clinic", "b2b")},
    **{f"vert-{v}-9x16": (1080, 1920) for v in ("barber", "garage", "clinic", "b2b")},
}
PRICE = ("₪119 לחודש", "₪1,190 לשנה", "כולל מע״מ ככל שחל")


def png_size(p: Path) -> tuple[int, int]:
    b = p.read_bytes()[:24]
    assert b[:8] == b"\x89PNG\r\n\x1a\n", p
    return struct.unpack(">II", b[16:24])


@pytest.mark.parametrize("name", sorted(SIZES))
def test_every_ad_exists_with_exact_size(name):
    p = ADS / "out" / f"{name}.png"
    assert p.is_file(), f"חסר נכס {p}"
    assert png_size(p) == SIZES[name]


def test_manifest_covers_all_assets_and_text_is_clean():
    m = json.loads((ADS / "out/manifest.json").read_text(encoding="utf-8"))
    assert {a["name"] for a in m["assets"]} == set(SIZES)
    for a in m["assets"]:
        assert not a["overflow"], a["name"]
        for bad in ("gabi.example", "דמו", "מוק"):
            assert bad not in a["text"], (a["name"], bad)
        if a["name"].startswith(("ad-", "vert-")):
            assert all(s in a["text"] for s in PRICE), a["name"]


@pytest.mark.parametrize("name", ["gabi-demo-16x9", "gabi-reel-9x16"])
def test_videos_and_silent_versions_exist(name):
    for suf in ("", "-silent"):
        p = VID / f"{name}{suf}.mp4"
        assert p.is_file() and p.stat().st_size > 1_000_000, p
    # גרסה שקטה = בלי טראק אודיו (אין 'soun' handler ב-moov); רגילה = עם
    assert b"soun" in (VID / f"{name}.mp4").read_bytes()
    assert b"soun" not in (VID / f"{name}-silent.mp4").read_bytes()


def test_end_card_has_full_price_and_reads_single_domain_source():
    src = (VID / "compose/endcard.mjs").read_text(encoding="utf-8")
    assert all(s in src for s in PRICE)
    assert "launch/launch.json" in src and "ads/launch.json" not in src
    for f in ("end/end_h.png", "end/end_v.png"):
        assert png_size(VID / "compose" / f) == ((1280, 720) if f.endswith("h.png") else (720, 1280))


def test_ads_read_only_the_marketing_domain_source():
    src = (ADS / "render.mjs").read_text(encoding="utf-8")
    assert "../launch/launch.json" in src            # המודעות קוראות ישירות ממקור-השיווק
    assert "gabi.example" not in src
    # marketing/ads/launch.json = מראה שמסונכרן ע"י set_domain.py (בדיקה של גבי שיווק) — לא נקרא ע"י המרנדר
    assert "'launch.json'" not in src.replace("../launch/launch.json", "")


def test_signoff_lists_every_asset_group():
    t = (ADS / "SIGN-OFF.md").read_text(encoding="utf-8")
    for needle in ("gabi-demo-16x9", "gabi-reel-9x16", "thumb-", "ad-", "vert-", "logo.ts", "set_domain.py"):
        assert needle in t, needle
