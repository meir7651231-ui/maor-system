import { describe, it, expect } from 'vitest';
import {
  planSupporterImport,
  mergeSupporterRow,
  newSupporterFromRow,
  type SupporterImportRow,
} from '../../components/supporters/lib';
import type { Supporter } from '../../types/domain';

function row(name: string, over: Partial<SupporterImportRow> = {}): SupporterImportRow {
  return { name, phone: '', email: '', idNum: '', address: '', cat: '', forWho: '', ...over };
}

function sup(id: string, name: string, over: Partial<Supporter> = {}): Supporter {
  return {
    id,
    name,
    phone: '',
    email: '',
    address: '',
    idNum: '',
    cat: '',
    forWho: '',
    notes: '',
    count: 0,
    ils: 0,
    usd: 0,
    first: '',
    last: '',
    nextDate: '',
    donations: [],
    ...over,
  };
}

describe('planSupporterImport — update-or-insert by normalized name', () => {
  it('existing name → update, new name → insert', () => {
    const existing = [sup('sp1', 'משפחת כהן')];
    const plan = planSupporterImport([row('משפחת כהן', { phone: '050' }), row('משפחת לוי')], existing);
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].id).toBe('sp1');
    expect(plan.inserts).toHaveLength(1);
    expect(plan.inserts[0].name).toBe('משפחת לוי');
  });

  it('normalizes names (spaces / final letters) when matching', () => {
    const existing = [sup('sp1', 'שמעון')];
    const plan = planSupporterImport([row(' שמעון ')], existing);
    expect(plan.updates).toHaveLength(1);
    expect(plan.inserts).toHaveLength(0);
  });

  it('dedups duplicate new names within the file into one insert (filling empties)', () => {
    const plan = planSupporterImport(
      [row('חדש', { phone: '' }), row('חדש', { phone: '050-111', email: 'a@b.com' })],
      [],
    );
    expect(plan.inserts).toHaveLength(1);
    expect(plan.inserts[0].phone).toBe('050-111');
    expect(plan.inserts[0].email).toBe('a@b.com');
  });

  it('skips rows without a name', () => {
    const plan = planSupporterImport([row('  '), row('אמיתי')], []);
    expect(plan.inserts).toHaveLength(1);
  });

  it('mergeSupporterRow overrides only with non-empty values', () => {
    const merged = mergeSupporterRow(sup('sp1', 'כהן', { phone: '03-old', cat: 'קרן' }), row('כהן', { phone: '050-new' }));
    expect(merged.phone).toContain('050');
    expect(merged.cat).toBe('קרן'); // לא נדרס בערך ריק
  });

  it('newSupporterFromRow starts counters at zero', () => {
    const sp = newSupporterFromRow('sp9', row('חדש', { phone: '050-1234567' }));
    expect(sp.count).toBe(0);
    expect(sp.ils).toBe(0);
    expect(sp.donations).toEqual([]);
    expect(sp.phone).toContain('050');
  });
});
