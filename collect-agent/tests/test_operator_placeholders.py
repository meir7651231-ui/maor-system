"""פרטי החברה המפעילה: מהסביבה, כולם או אף אחד; אף placeholder לא נשאר כשהם מוגדרים (BACKLOG גבי משפט)."""
from __future__ import annotations

import re
from pathlib import Path

import pytest

from app import golive, legal
from app.config import load_settings

ROOT = Path(__file__).resolve().parents[1]
REAL = {"OPERATOR_NAME": "גבי בע״מ", "OPERATOR_ID": "51-000000-0",
        "OPERATOR_ADDRESS": "הרצל 1, תל אביב", "OPERATOR_PRIVACY_EMAIL": "privacy@gabi.co.il"}


def test_default_is_placeholder_and_gate_blocks():
    assert legal.load_operator({}) == legal.PLACEHOLDER_OPERATOR
    assert any("placeholder" in b for b in golive.real_send_blockers(load_settings({}),
                                                                       operator=legal.load_operator({})))


@pytest.mark.parametrize("drop", list(REAL))
def test_partial_operator_refused(drop):
    with pytest.raises(ValueError, match=drop):
        legal.load_operator({**REAL, drop: " "})


def test_bad_privacy_email_refused():
    with pytest.raises(ValueError):
        legal.load_operator({**REAL, "OPERATOR_PRIVACY_EMAIL": "privacy"})


def test_real_operator_reaches_every_dynamic_page(monkeypatch):
    monkeypatch.setattr(legal, "OPERATOR", legal.load_operator(REAL))
    pages = [legal.privacy_html("סטודיו"), legal.draft_footer(),
             " ".join(legal.privacy_points("סטודיו").values())]
    for html in pages:
        assert "placeholder" not in html and "[שם החברה" not in html
    assert REAL["OPERATOR_NAME"] in pages[0] and REAL["OPERATOR_PRIVACY_EMAIL"] in pages[2]


def test_gate_lists_static_files_when_operator_set_but_files_not_updated(monkeypatch):
    monkeypatch.setattr(legal, "OPERATOR", legal.load_operator(REAL))
    b = [x for x in golive.real_send_blockers(load_settings({})) if "קבצים עדיין placeholder" in x]
    assert len(b) == 1 and "legal/TERMS.md" in b[0]
    monkeypatch.setattr(legal, "static_placeholder_files", lambda root=None: [])
    assert not [x for x in golive.real_send_blockers(load_settings({})) if "placeholder" in x]


def test_table_lists_exactly_the_static_placeholder_files():
    """מקום חדש עם placeholder (או מקום שכבר עודכן) ⇒ לעדכן את הטבלה, שלא יישכח ביום ההקמה."""
    table = (ROOT / "legal" / "OPERATOR-PLACEHOLDERS.md").read_text("utf-8")
    static = re.findall(r"^\| `([^`]+)` \|", table.split("## ב.")[1], re.M)
    assert sorted(static) == legal.static_placeholder_files()
    assert legal.DRAFT_LABEL in table
