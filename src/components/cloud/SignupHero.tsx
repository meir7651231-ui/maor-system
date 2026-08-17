/**
 * 🌌 רקע ה-Hero של מסך ההרשמה (אורביט, SIGNUP מיתוג 2) — הכדור-מוח התלת-ממדי
 * מ-three-scene (מגודר signup.hero3d) על רקע קוסמי. דגל כבוי / אין WebGL ⇒
 * רקע סטטי (`/orbit/orbit-hero.png`) לטעינה מהירה. הלוגו ותווית-הצד נשארים
 * בשתי המצבים. mount/unmount נקי דרך ה-controller.dispose.
 *
 * מיתוג 5 (SIGNUP2): three-scene (+three) נטען **דינמית** — Vite מפצל אותו
 * ל-chunk נפרד שיורד רק כשה-Hero מתרנדר. הבנדל הראשי (הלקוח הקיים) לא נושא
 * את משקל three. הטיפוס מיובא כ-import type (אינו משפיע על הבנדל).
 */
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import type { BrainSceneHandle } from '../../lib/three-scene';

// נתיב יחסי לפריסה תחת תת-נתיב (GitHub Pages /maor-system/) — כמו DemoDrop
const base = import.meta.env.BASE_URL;

export function SignupHero() {
  const config = useApp((s) => s.config);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const hero3d = featureOn(config, 'signup.hero3d');

  useEffect(() => {
    if (!hero3d || !canvasRef.current) return;
    let handle: BrainSceneHandle | null = null;
    let cancelled = false;
    // הרכבה עצלה — שלא תעכב את הצגת הכרטיס/הטופס
    const id = window.setTimeout(() => {
      if (cancelled || !canvasRef.current) return;
      // טעינה דינמית של three-scene (+three) — chunk נפרד, יורד רק כאן
      void import('../../lib/three-scene').then(({ mountBrainScene }) => {
        if (cancelled || !canvasRef.current) return;
        // 🕯️ מאור = אוֹר: ערכת Ember (זהוב-ורוד חם) עם זוהר מוגבר — כדור-אור, לא כדור-מוח קר
        handle = mountBrainScene(canvasRef.current, { palette: 'Ember', pulse: 1.1, bloom: 0.72 });
        setLive(!!handle);
      });
    }, 30);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
      handle?.dispose();
    };
  }, [hero3d]);

  const orgName = config.orgName || 'מאור החסד';
  return (
    <div className="orbit-hero" aria-hidden>
      {/* רקע סטטי — תמיד מתחת; הכדור-האור החי מכסה אותו כשעלה */}
      <div className="orbit-hero-static" style={{ backgroundImage: `url(${base}orbit/orbit-hero.png)`, opacity: live ? 0 : 1 }} />
      {hero3d && <canvas ref={canvasRef} className="orbit-hero-canvas" />}
      <div className="orbit-hero-side">{orgName} · מערכת הניהול</div>
    </div>
  );
}
