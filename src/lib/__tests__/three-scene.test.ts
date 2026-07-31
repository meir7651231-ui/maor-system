/**
 * ratchet — סצנת הכדור-מוח (SIGNUP מיתוג 1). הגנת-מקור: Three.js **נארז
 * ב-bundle** (import סטטי מ-'three'), אפס CDN (unpkg/cdnjs/googleapis);
 * ה-controller חושף dispose לניקוי. `three` ב-dependencies.
 */
import { describe, expect, it } from 'vitest';
import sceneSrc from '../three-scene.ts?raw';
import pkg from '../../../package.json';

describe('🧠 ratchet — מיתוג 1: הכדור-מוח נארז מקומית', () => {
  it('אפס CDN בקוד הסצנה — unpkg/cdnjs/fonts.googleapis לא מופיעים', () => {
    expect(sceneSrc).not.toContain('unpkg');
    expect(sceneSrc).not.toContain('cdnjs');
    expect(sceneSrc).not.toContain('fonts.googleapis');
    expect(sceneSrc).not.toContain('http://');
    expect(sceneSrc).not.toContain('https://');
  });

  it('import סטטי מ-three (נארז ב-Vite) — לא importmap/dynamic-CDN', () => {
    expect(sceneSrc).toContain("import * as THREE from 'three'");
    expect(sceneSrc).toContain("from 'three/examples/jsm/postprocessing/EffectComposer.js'");
  });

  it('mountBrainScene מחזיר controller עם dispose (ניקוי GPU + מאזיני חלון)', () => {
    expect(sceneSrc).toContain('export function mountBrainScene');
    expect(sceneSrc).toContain('dispose()');
    expect(sceneSrc).toContain("removeEventListener('resize'");
    expect(sceneSrc).toContain('renderer.dispose()');
    // ניפול בטוח כשאין WebGL — mount מחזיר null
    expect(sceneSrc).toContain('return null');
  });

  it('three ב-dependencies (לא CDN)', () => {
    expect((pkg.dependencies as Record<string, string>).three).toBeTruthy();
  });
});
