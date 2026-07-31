/**
 * 🌌 רקע ה-Hero של מסך ההרשמה (אורביט, SIGNUP מיתוג 2) — הכדור-מוח התלת-ממדי
 * מ-three-scene (מגודר signup.hero3d) על רקע קוסמי. דגל כבוי / אין WebGL ⇒
 * רקע סטטי (`/orbit/orbit-hero.png`) לטעינה מהירה. הלוגו ותווית-הצד נשארים
 * בשתי המצבים. mount/unmount נקי דרך ה-controller.dispose.
 */
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import { mountBrainScene, type BrainSceneHandle } from '../../lib/three-scene';

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
    // הרכבה עצלה — שלא תעכב את הצגת הכרטיס/הטופס
    const id = window.setTimeout(() => {
      if (!canvasRef.current) return;
      handle = mountBrainScene(canvasRef.current, { palette: 'Aurora', pulse: 1, bloom: 0.5 });
      setLive(!!handle);
    }, 30);
    return () => {
      window.clearTimeout(id);
      handle?.dispose();
    };
  }, [hero3d]);

  return (
    <div className="orbit-hero" aria-hidden>
      {/* רקע סטטי — תמיד מתחת; הכדור החי מכסה אותו כשעלה */}
      <div className="orbit-hero-static" style={{ backgroundImage: `url(${base}orbit/orbit-hero.png)`, opacity: live ? 0 : 1 }} />
      {hero3d && <canvas ref={canvasRef} className="orbit-hero-canvas" />}
      <img className="orbit-hero-logo" src={`${base}orbit/orbit-logo.png`} alt="ORBIT" />
      <div className="orbit-hero-side">ORBIT · מערכת ההפעלה לעסק</div>
    </div>
  );
}
