import { DUE_ESTIMATED_HELP, DUE_ESTIMATED_LABEL } from '../lib/dueEstimate.ts';

/** תג «מועד מוערך» ליד המועד. withHelp ⇒ גם ההסבר גלוי (לא רק ב-title). צבעים ≥4.5:1 (שומר הניגודיות הסטטי). */
export function DueEstimatedBadge({ withHelp = false }: { withHelp?: boolean }) {
  return (
    <span className="whitespace-normal" data-testid="due-estimated">
      <span title={DUE_ESTIMATED_HELP} aria-label={`${DUE_ESTIMATED_LABEL}: ${DUE_ESTIMATED_HELP}`}
        className="ms-1.5 rounded bg-amber-100 text-amber-900 text-[11px] font-bold px-1.5 py-0.5 whitespace-nowrap">{DUE_ESTIMATED_LABEL}</span>
      {withHelp && <span className="ms-1 text-xs text-ink-700" data-testid="due-estimated-help">({DUE_ESTIMATED_HELP})</span>}
    </span>
  );
}
