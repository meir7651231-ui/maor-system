// גרף הגבייה בדשבורד. טהור.
export interface WeekPoint { week: string; collected_agorot: number; count: number }
export interface Bar { label: string; value: number; count: number }

/** שבוע ISO (ראשון) ⇒ תווית "8.11"; ערך בשקלים. */
export function toBars(series: WeekPoint[]): Bar[] {
  return series.map(p => {
    const [, m, d] = p.week.split('-');
    return { label: `${Number(d)}.${Number(m)}`, value: p.collected_agorot / 100, count: p.count };
  });
}

/** קו מגמה מצטבר (לשטח מתחת לעמודות). */
export const cumulative = (bars: Bar[]): number[] => bars.reduce<number[]>((a, b) => [...a, (a.at(-1) ?? 0) + b.value], []);

/** נתיב SVG לשטח מצטבר בתוך w×h (RTL: הכי ישן מימין). pad = חצי רוחב עמודה ⇒ הנקודות במרכזי העמודות. */
export function areaPath(values: number[], w: number, h: number, pad = 0): string {
  if (!values.length) return '';
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? (w - 2 * pad) / (values.length - 1) : 0;
  const pts = values.map((v, i) => [w - pad - i * step, h - (v / max) * h] as const);
  return `M${w},${h} ` + pts.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ` L${pts.at(-1)![0].toFixed(1)},${h} Z`;
}
