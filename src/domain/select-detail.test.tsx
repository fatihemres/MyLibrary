import { afterEach, describe, expect, it, vi } from 'vitest';
import { Children, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Detail } from '../pages/Detail';
import { BookEditor } from '../components/BookEditor';
import { CopyEditor } from '../components/CopyEditor';
import { emptyBook, type Book, type Snapshot } from './types';
import { setLanguage } from '../i18n';
import { api } from '../services/api';

const view = vi.hoisted(() => ({ tab: 'Publication' }));
vi.mock('../services/api', () => ({ api: vi.fn().mockResolvedValue(undefined) }));
vi.mock('react', async (importOriginal) => {
  const react = await importOriginal<typeof import('react')>();
  return {
    ...react,
    // Select a section for server rendering; retain real record/draft state.
    useState: (initial: unknown) =>
      react.useState(
        typeof initial === 'string' && ['Overview', 'General', 'Identity'].includes(initial)
          ? view.tab
          : initial,
      ),
  };
});

const groups: {
  key: string;
  scope: 'extra' | 'copy_extra';
  tab: string;
  labels: [string, string];
  options: [string, string][];
}[] = [
  {
    key: 'binding',
    scope: 'extra',
    tab: 'Publication',
    labels: ['Binding', 'Cilt türü'],
    options: [
      ['Hardcover', 'Sert kapak'],
      ['Paperback', 'Karton kapak'],
      ['Leather', 'Deri'],
      ['Spiral', 'Spiral'],
      ['Other', 'Diğer'],
    ],
  },
  {
    key: 'priority',
    scope: 'copy_extra',
    tab: 'Reading',
    labels: ['Priority', 'Öncelik'],
    options: [
      ['Low', 'Düşük'],
      ['Normal', 'Normal'],
      ['High', 'Yüksek'],
    ],
  },
  {
    key: 'ownership',
    scope: 'copy_extra',
    tab: 'Ownership',
    labels: ['Ownership status', 'Sahiplik durumu'],
    options: [
      ['Owned', 'Sahip olunan'],
      ['Borrowed', 'Ödünç alınmış'],
      ['Wishlist', 'İstek listesi'],
      ['Previously owned', 'Önceden sahip olunan'],
    ],
  },
];
const data: Snapshot = {
  books: [],
  searchIds: null,
  people: [],
  publishers: [],
  series: [],
  sources: [],
  fields: [
    {
      id: 'synthetic-custom',
      name: 'Synthetic custom',
      kind: 'select',
      extra: { options: 'High,Owned,Other,New,Good' },
    },
  ],
  terms: [],
  loans: [],
  entries: [],
  attachments: [],
  settings: [],
  dataDir: '',
  locations: [],
};
const fixture = (): Book => ({
  ...emptyBook(),
  id: 'synthetic-copy',
  edition_id: 'synthetic-edition',
  title: 'Synthetic book',
});
function detail(book: Book) {
  return renderToStaticMarkup(
    <Detail
      book={book}
      data={{ ...data, books: [book] }}
      onBack={vi.fn()}
      onEdit={vi.fn()}
      onRecord={vi.fn()}
      onAction={vi.fn()}
      onOpen={vi.fn()}
      onReload={async () => {}}
    />,
  );
}
type Element = ReactElement<{
  children?: ReactNode;
  onSubmit?: (event: { preventDefault: () => void }) => void;
}>;
function findForm(node: ReactNode): Element | undefined {
  for (const child of Children.toArray(node)) {
    if (typeof child !== 'object' || !('props' in child)) continue;
    const element = child as Element;
    if (element.type === 'form') return element;
    const nested = findForm(element.props.children);
    if (nested) return nested;
  }
}
afterEach(async () => {
  vi.clearAllMocks();
  await setLanguage('en');
});

describe.each(groups)('$key built-in select', (group) => {
  it.each(group.options)(
    'renders %s through EN/TR/EN without mutating the record',
    async (value, turkish) => {
      const book = fixture();
      book[group.scope][group.key] = value;
      const before = structuredClone(book);
      for (const language of ['en', 'tr', 'en']) {
        await setLanguage(language);
        const tabs =
          group.key === 'binding'
            ? ['Publication']
            : group.key === 'priority'
              ? ['Reading', 'Details']
              : ['Details'];
        for (const tab of tabs) {
          view.tab = tab;
          expect(detail(book)).toContain(
            `<dt>${group.labels[language === 'tr' ? 1 : 0]}</dt><dd>${language === 'tr' ? turkish : value}</dd>`,
          );
          expect(book).toEqual(before);
          expect(book[group.scope][group.key]).toBe(value);
        }
      }
      expect(api).not.toHaveBeenCalled();
    },
  );

  it.each(['en', 'tr'])(
    'preserves editor options and save payloads in %s (frontend contract)',
    async (language) => {
      await setLanguage(language);
      view.tab = group.tab;
      for (const [value] of group.options) {
        const book = fixture();
        book[group.scope][group.key] = value;
        const before = structuredClone(book);
        // BookEditor also exposes the physical-copy metadata sections.
        for (const editor of group.key === 'ownership' ? ['book', 'copy'] : ['book']) {
          vi.mocked(api).mockClear();
          let form: Element | undefined;
          function Capture() {
            const tree =
              editor === 'book'
                ? BookEditor({
                    initial: book,
                    data,
                    quick: false,
                    onClose: vi.fn(),
                    onSaved: async () => {},
                  })
                : CopyEditor({
                    book,
                    data,
                    mode: 'edit',
                    onClose: vi.fn(),
                    onSaved: async () => {},
                  });
            form = findForm(tree);
            return tree;
          }
          const html = renderToStaticMarkup(<Capture />);
          expect(html).toContain(group.labels[language === 'tr' ? 1 : 0]);
          for (const [option, turkish] of group.options) {
            if (group.key === 'ownership' && option === 'Wishlist' && value !== 'Wishlist') {
              expect(html).not.toContain('<option value="Wishlist"');
              continue;
            }
            expect(html).toContain(
              `<option value="${option}"${option === value ? ' selected=""' : ''}>${language === 'tr' ? turkish : option}</option>`,
            );
          }
          expect(form?.props.onSubmit).toBeDefined();
          form!.props.onSubmit!({ preventDefault: vi.fn() });
          await Promise.resolve();
          expect(api).toHaveBeenCalledExactlyOnceWith(
            editor === 'book' ? 'save' : 'save_copy',
            expect.objectContaining({
              [group.scope]: expect.objectContaining({ [group.key]: value }),
            }),
          );
          expect(book).toEqual(before);
        }
      }
    },
  );

  it.each(['en', 'tr'])('preserves unknown and absent values in %s', async (language) => {
    await setLanguage(language);
    view.tab = group.key === 'ownership' ? 'Details' : group.tab;
    for (const value of ['Legacy value', 'Good', 'High', '', null, undefined]) {
      if (group.options.some(([option]) => option === value)) continue;
      const book = fixture();
      // Historical null/missing payloads are handled defensively by the display boundary.
      Object.assign(book[group.scope], { [group.key]: value });
      if (value === undefined) delete book[group.scope][group.key];
      const before = structuredClone(book);
      const row = `<dt>${group.labels[language === 'tr' ? 1 : 0]}</dt>`;
      const html = detail(book);
      if (value === '' || value == null) expect(html).not.toContain(row);
      else expect(html).toContain(`${row}<dd>${value}</dd>`);
      expect(book).toEqual(before);
    }
  });
});

it.each(['en', 'tr'])('keeps user text and non-select values verbatim in %s', async (language) => {
  await setLanguage(language);
  for (const value of ['High', 'Owned', 'Other', 'New', 'Good']) {
    const book = {
      ...fixture(),
      title: value,
      publisher: value,
      isbn10: value,
      isbn13: value,
      barcode: value,
      contributors: [{ name: value, role: 'Author' }],
      extra: { original_title: value, synopsis: value, format: value },
      copy_extra: {
        review: value,
        currency: value,
        personal_notes: value,
        times_read: 0,
        gift: false,
      },
      custom: { 'synthetic-custom': value },
    };
    const before = structuredClone(book);
    for (const tab of ['Publication', 'Reading', 'Details']) {
      view.tab = tab;
      const html = detail(book);
      const rows = [...html.matchAll(/<dt>[^<]*<\/dt><dd>(.*?)<\/dd>/g)].map((match) => match[1]);
      expect(rows.filter((text) => text === value).length).toBeGreaterThanOrEqual(
        tab === 'Publication' ? 8 : tab === 'Reading' ? 1 : 5,
      );
      expect(html).toContain(`<h1>${value}</h1>`);
      if (tab !== 'Publication') expect(rows).toContain('0');
      if (tab === 'Details') expect(rows).toContain(language === 'tr' ? 'Hayır' : 'No');
      if (tab === 'Details') expect(html).toContain(`<dt>Synthetic custom</dt><dd>${value}</dd>`);
      expect(book).toEqual(before);
    }
  }
  expect(api).not.toHaveBeenCalled();
});
