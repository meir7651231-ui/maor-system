"""חבילת השקה: דומיין במקום אחד (marketing/launch/launch.json) ושער השקה שנכשל כל עוד נשאר placeholder.

ההכרעה על הדומיין היא של מאיר. עד אז: הכול מסונכרן ל-gabi.example, וההחלפה היא פקודה אחת.
"""
import importlib.util
import json
import re
import shutil
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
LAUNCH = ROOT / "marketing" / "launch"


def _mod(name):
    spec = importlib.util.spec_from_file_location(name, LAUNCH / f"{name}.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


check = _mod("check_launch")
setdom = _mod("set_domain")
CFG = json.loads((LAUNCH / "launch.json").read_text(encoding="utf-8"))


def test_all_launch_materials_consistent_with_single_domain():
    assert check.findings(release=False) == []


def test_web_has_domain_only_in_site_ts():
    """באג שנסגר: Landing.tsx ו-message.ts הקשיחו gabi.example ⇒ החלפת דומיין הייתה מפספסת אותם."""
    hits = [p.relative_to(ROOT).as_posix() for p in (ROOT / "web" / "src").rglob("*.ts*")
            if CFG["domain"] in p.read_text(encoding="utf-8")]
    assert hits == ["web/src/lib/site.ts"], hits


def test_site_ts_and_backend_default_match_launch_json():
    site = (ROOT / "web/src/lib/site.ts").read_text(encoding="utf-8")
    assert re.search(r"SITE_DOMAIN = '([^']+)'", site).group(1) == CFG["domain"]
    from app.config import Settings
    assert Settings.__dataclass_fields__["public_base_url"].default == f"https://{CFG['domain']}"


def test_release_gate_blocks_while_placeholder():
    """הקיר: בלי דומיין אמיתי (הכרעת מאיר) אין השקה. השער חייב להיות אדום היום."""
    out = check.findings(release=True)
    assert any("placeholder" in f and "launch.json" in f for f in out)
    assert any("gabi.example" in f for f in out)


def _copy_tree(tmp_path):
    for rel in CFG["files"] + ["marketing/launch/launch.json", "marketing/ads/launch.json",
                               "marketing/ads/out/manifest.json"]:
        dst = tmp_path / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(ROOT / rel, dst)
    return tmp_path


def test_set_domain_switches_everything_and_release_passes(tmp_path):
    root = _copy_tree(tmp_path)
    cfg_path = root / "marketing/launch/launch.json"
    dry = setdom.set_domain("gabi-test.co.il", root=root, cfg_path=cfg_path, dry=True)
    assert dry and "gabi.example" in (root / "web/src/lib/site.ts").read_text(encoding="utf-8")  # dry לא כותב
    setdom.set_domain("https://Gabi-Test.co.il/", root=root, cfg_path=cfg_path)
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    assert cfg["domain"] == "gabi-test.co.il" and cfg["placeholder"] is False
    for rel in cfg["files"]:
        text = (root / rel).read_text(encoding="utf-8")
        assert "gabi.example" not in text and "[קישור לדף]" not in text and "[דומיין]" not in text, rel
    ads = json.loads((root / "marketing/ads/launch.json").read_text(encoding="utf-8"))
    assert ads["domain"] == "gabi-test.co.il", "set_domain לא סנכרן את מקור הדומיין של המודעות"
    out = check.findings(release=True, cfg=cfg, root=root)
    # נשאר רק לרנדר מחדש: סרטונים + מודעות (ה-manifest עדיין של הרינדור הקודם)
    assert out and all(("סרטונים" in f) or ("מודעות" in f) for f in out), out
    cfg["videos_rendered_for"] = "gabi-test.co.il"
    man = root / "marketing/ads/out/manifest.json"
    m = json.loads(man.read_text(encoding="utf-8"))
    m["domain"] = "gabi-test.co.il"
    man.write_text(json.dumps(m), encoding="utf-8")
    assert check.findings(release=True, cfg=cfg, root=root) == []


@pytest.mark.parametrize("bad", ["", "not a domain", "gabi", "-x.co.il", "a..co.il"])
def test_set_domain_rejects_invalid(bad, tmp_path):
    root = _copy_tree(tmp_path)
    with pytest.raises(ValueError):
        setdom.set_domain(bad, root=root, cfg_path=root / "marketing/launch/launch.json")


def test_package_ready_for_signature_only_meir_walls_left():
    """יעד השיווק (הוראת מאיר 15.11): החבילה מוכנה ומחכה רק לחתימה. מה שבידי הצוות ירוק,
    והאדום שנשאר בשער ההשקה נעלם ברגע שיש דומיין (מלבד רינדור מחדש)."""
    assert check.readiness() == []
    assert len(check.MEIR_WALLS) == 4


def test_readiness_catches_team_side_problem(tmp_path):
    """מוטציה: דומיין placeholder זר בפוסט ⇒ «לא מוכן» (זו בעיה של הצוות, לא של מאיר)."""
    root = _copy_tree(tmp_path)
    # המחוללים נבדקים מול הקוד האמיתי — מעתיקים אותם ואת מה שהם קוראים (מקורות המשפטי + הרנדרר שלו)
    extra = ["legal/TERMS.md", "legal/PRIVACY.md", "scripts/legal_bundle.py", "marketing/terms.html",
             "marketing/privacy.html", "web/public/terms.html", "web/public/privacy.html",
             "marketing/video/compose/assets/captions.json", "marketing/video/compose/endcard.mjs",
             "marketing/video/transcript.html", "web/public/video/transcript.html",
             "marketing/video/scenes.json", "marketing/video/script.md"]
    for g in [*check.GENERATORS, *extra]:
        (root / g).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(ROOT / g, root / g)
    p = root / "marketing/posts.md"
    p.write_text(p.read_text(encoding="utf-8") + "\nhttps://other.example/x\n", encoding="utf-8")
    probs = check.readiness(root=root)
    assert any("other.example" in x for x in probs), probs


def test_every_marketing_asset_with_domain_or_placeholder_is_switched():
    """מאמר SEO 07 נוסף עם `[קישור לדף]` ולא נכנס לרשימה ⇒ set_domain היה מדלג עליו, והבדיקות למעלה (שעוברות
    רק על הרשימה) לא היו רואות. נועל: כל נכס שיווק עם הדומיין או placeholder נמצא ב-launch.json; מחוללים
    (.py) קוראים את הדומיין מ-launch.json ולא כותבים אותו ביד."""
    ph = CFG["link_placeholders"] + CFG["domain_placeholders"] + [CFG["domain"]]
    skip = ("marketing/launch/", "marketing/ads/", "marketing/video/compose/")
    missing, hard = [], []
    for p in sorted((ROOT / "marketing").rglob("*")):
        rel = p.relative_to(ROOT).as_posix()
        if not p.is_file() or rel.startswith(skip) or p.name in ("SIGN-OFF.md", "README.md") or "__pycache__" in rel:
            continue
        t = p.read_text(encoding="utf-8", errors="ignore") if p.suffix in (".md", ".html", ".py", ".mjs") else ""
        if p.suffix == ".py":
            if CFG["domain"] in t:
                hard.append(rel)
        elif any(x in t for x in ph) and rel not in CFG["files"]:
            missing.append(rel)
    assert not missing, f"נכסים עם דומיין/placeholder שלא ברשימת launch.json: {missing}"
    assert not hard, f"מחוללים עם דומיין קשיח (לקרוא מ-launch.json): {hard}"
