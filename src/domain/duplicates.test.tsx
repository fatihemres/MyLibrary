import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DuplicateChoices } from '../components/DuplicateResolver';
import { emptyBook } from './types';
import {
  fieldValue,
  hasSignals,
  requiresDecision,
  type DuplicateReport,
  type ImportGroup,
} from './duplicates';
import { setLanguage } from '../i18n';
const empty = (): DuplicateReport => ({ strong: [], weak: [], collisions: [] });
const book = () => ({
  ...emptyBook(),
  title: 'Synthetic',
  edition_id: 'edition',
  contributors: [{ name: 'Writer', role: 'Author' }],
});
describe('M2-B duplicate decision presentation', () => {
  it('does not preselect a matching edition or mutate the draft on render', async () => {
    await setLanguage('en');
    const b = book();
    const before = structuredClone(b);
    let calls = 0;
    const html = renderToStaticMarkup(
      <DuplicateChoices
        book={b}
        report={{ ...empty(), strong: [{ book: b, count: 3, archived: 1 }] }}
        onChange={() => calls++}
        reconcile
      />,
    );
    expect(html).toContain('3 physical copies');
    expect(html).toContain('1 archived');
    expect(html).not.toContain('checked=""');
    expect(calls).toBe(0);
    expect(b).toEqual(before);
  });
  it('never offers edition attachment for weak similarity or barcode alone', () => {
    const b = book();
    const html = renderToStaticMarkup(
      <DuplicateChoices
        book={b}
        report={{
          ...empty(),
          weak: [{ book: b, count: 1, archived: 0 }],
          collisions: [{ book: b, barcode: true, inventory: false }],
        }}
        onChange={() => {}}
      />,
    );
    expect(html).toContain('Possible similar record');
    expect(html).toContain('Physical copy identifier collision');
    expect(html).not.toContain('Add as new physical copy');
  });
  it('keeps existing values by default and warns that edition changes affect all copies', () => {
    const old = book();
    const b = { ...old, title: 'Incoming' };
    const html = renderToStaticMarkup(
      <DuplicateChoices
        book={b}
        report={{ ...empty(), strong: [{ book: old, count: 2, archived: 0 }] }}
        value={{ action: 'existing', target: 'edition', reviewed: true, fields: [] }}
        onChange={() => {}}
        reconcile
      />,
    );
    expect(html).toContain('ALL physical copies');
    expect(html).toContain('Synthetic');
    expect(html).toContain('Incoming');
    expect(html).toContain('type="checkbox"');
    expect(html).not.toMatch(/type="checkbox"[^>]*checked/);
  });
  it('imports show shared values but offer no shared edition patch controls', () => {
    const b = book();
    const html = renderToStaticMarkup(
      <DuplicateChoices
        book={b}
        report={{ ...empty(), strong: [{ book: b, count: 1, archived: 0 }] }}
        value={{ action: 'existing', target: 'edition', reviewed: true }}
        onChange={() => {}}
        allowSkip
      />,
    );
    expect(html).toContain('All existing edition values will be kept');
    expect(html).not.toContain('type="checkbox"');
    expect(html).toContain('Skip this incoming edition group');
  });
  it('requires explicit decisions for strong, identifier and incoming conflicts', () => {
    const g: ImportGroup = {
      group: 'row:0',
      rows: [0],
      book: book(),
      report: empty(),
      incoming: [],
      incomingWeak: [],
      incomingCollision: false,
    };
    expect(requiresDecision(g)).toBe(false);
    expect(requiresDecision({ ...g, incoming: [2] })).toBe(true);
    expect(requiresDecision({ ...g, incomingCollision: true })).toBe(true);
    expect(
      requiresDecision({
        ...g,
        report: { ...empty(), strong: [{ book: book(), count: 1, archived: 0 }] },
      }),
    ).toBe(true);
    expect(
      requiresDecision({
        ...g,
        report: { ...empty(), collisions: [{ book: book(), barcode: true, inventory: false }] },
      }),
    ).toBe(true);
    const weak = { ...empty(), weak: [{ book: book(), count: 1, archived: 0 }] };
    expect(hasSignals(weak)).toBe(true);
    expect(requiresDecision({ ...g, report: weak })).toBe(false);
  });
  it('displays Turkish labels without changing author or book data', async () => {
    await setLanguage('tr');
    const b = book();
    const html = renderToStaticMarkup(
      <DuplicateChoices
        book={b}
        report={{ ...empty(), strong: [{ book: b, count: 2, archived: 0 }] }}
        onChange={() => {}}
      />,
    );
    expect(html).toContain('Eşleşen baskılar');
    expect(html).toContain('2 fiziksel kopya');
    expect(html).toContain('Writer');
    expect(b.title).toBe('Synthetic');
    await setLanguage('en');
  });
  it('shared display excludes non-author contributors and exposes no copy control field', () => {
    const b = book();
    b.contributors.push({ name: 'Translator', role: 'Translator' });
    expect(fieldValue(b, 'authors')).toBe('Writer');
    expect(fieldValue({ ...b, extra: { synopsis: '<script>text</script>' } }, 'synopsis')).toBe(
      '<script>text</script>',
    );
  });
});
