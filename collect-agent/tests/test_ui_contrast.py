"""גבי עיצוב: ניגודיות AA לדשבורד הפשוט (/ui, app/ui.html) — מחושבת מה-tokens ב-:root, בהיר וכהה.
באג שתוקן: --muted #64748B היה 4.23–4.49:1 על השמנת/chip/warn-bg/sms ו---warn #b45309 4.47:1 על chip ⇒ נכשלו AA
(אותו גוון ש-web/ כבר תיקן ל-#5F6F85). כל צירוף טקסט (ink/muted/warn/bad) × רקע (bg/card/warn-bg/chip/sms) ≥4.5."""
import re
from pathlib import Path

import pytest

UI = (Path(__file__).resolve().parents[1] / "app/ui.html").read_text(encoding="utf-8")
DARK = "@media (prefers-color-scheme:dark)"


def _toks(block: str) -> dict[str, str]:
    out = {}
    for k, v in re.findall(r"--([\w-]+):(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\b", block):
        out[k] = v if len(v) == 7 else "#" + "".join(c * 2 for c in v[1:])   # #fff ⇒ #ffffff
    return out


LIGHT = _toks(UI[UI.index(":root{"):UI.index(DARK)])
DARKT = {**LIGHT, **_toks(UI[UI.index(DARK):UI.index("}}", UI.index(DARK)) + 2])}


def _lum(h: str) -> float:
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def ratio(a: str, b: str) -> float:
    x, y = sorted((_lum(a), _lum(b)), reverse=True)
    return (x + 0.05) / (y + 0.05)


@pytest.mark.parametrize("mode,t", [("light", LIGHT), ("dark", DARKT)])
@pytest.mark.parametrize("fg", ["ink", "muted", "warn", "bad"])
@pytest.mark.parametrize("bg", ["bg", "card", "warn-bg", "chip", "sms"])
def test_ui_text_tokens_pass_aa(mode, t, fg, bg):
    assert fg in t and bg in t, f"token חסר: --{fg} / --{bg}"
    r = ratio(t[fg], t[bg])
    assert r >= 4.5, f"{mode}: --{fg} {t[fg]} על --{bg} {t[bg]} = {r:.2f}:1"


def test_ratio_matches_known_values():
    assert round(ratio("#000000", "#ffffff"), 1) == 21.0
    assert round(ratio("#64748B", "#FBF8F1"), 2) == 4.49   # הגוון הישן — נכשל, ולכן הוחלף
