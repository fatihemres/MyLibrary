import { afterEach, describe, expect, it, vi } from 'vitest';
import { Children, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Detail } from '../pages/Detail';
import { CopyEditor } from '../components/CopyEditor';
import { emptyBook, type Snapshot } from './types';
import { setLanguage, t } from '../i18n';
import { api } from '../services/api';

vi.mock('../services/api', () => ({ api: vi.fn().mockResolvedValue(undefined) }));
vi.mock('react', async (importOriginal) => {
  const react = await importOriginal<typeof import('react')>();
  return {
    ...react,
    // Open the existing physical editor tab while retaining real draft state.
    useState: (initial: unknown) => react.useState(initial === 'Identity' ? 'Physical' : initial),
  };
});

const cases = [
  ['New', 'Yeni'],
  ['Like New', 'Yeni Gibi'],
  ['Very Good', 'Çok İyi'],
  ['Good', 'İyi'],
  ['Acceptable', 'Kabul Edilebilir'],
  ['Poor', 'Kötü'],
];
const data: Snapshot = {
  books: [],
  searchIds: null,
  people: [],
  publishers: [],
  series: [],
  sources: [],
  fields: [],
  terms: [],
  loans: [],
  entries: [],
  attachments: [],
  settings: [],
  dataDir: '',
  locations: [],
};
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

describe.each(['en', 'tr'])('Physical condition in %s', (language) => {
  it.each(cases)(
    'localizes Overview for %s without changing domain or user text',
    async (condition, turkish) => {
      await setLanguage(language);
      const book = {
        ...emptyBook(),
        id: 'synthetic-copy',
        edition_id: 'synthetic-edition',
        condition,
        title: 'Good',
        publisher: 'New',
        language: 'Poor',
        copy_extra: { personal_notes: 'Like New' },
        extra: { synopsis: 'Very Good' },
      };
      const before = structuredClone(book);
      const html = renderToStaticMarkup(
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
      const overview = html.match(
        /<section class="panel"><h2>[^<]*<\/h2><dl>(.*?)<\/dl><\/section>/s,
      )?.[1];
      expect(overview).toBeDefined();
      expect(html).toContain(`<h2>${t('ui.atAGlance')}</h2>`);
      expect(overview).toContain(
        `<dt>${t('ui.condition')}</dt><dd>${language === 'tr' ? turkish : condition}</dd>`,
      );
      expect(overview).toContain('<dd>New</dd>');
      expect(overview).toContain('<dd>Poor</dd>');
      expect(html).toContain('<h1>Good</h1>');
      expect(html).toContain('<p class="prose">Like New</p>');
      expect(html).toContain('<p class="prose">Very Good</p>');
      expect(book).toEqual(before);
      expect(api).not.toHaveBeenCalled();
    },
  );

  it.each(cases)('preserves editor labels and saved domain value for %s', async (condition) => {
    await setLanguage(language);
    const book = { ...emptyBook(), id: 'synthetic-copy', condition };
    const before = structuredClone(book);
    const onSaved = vi.fn().mockResolvedValue(undefined);
    let form: Element | undefined;
    function Capture() {
      const tree = CopyEditor({ book, data, mode: 'edit', onClose: vi.fn(), onSaved });
      form = findForm(tree);
      return tree;
    }
    const html = renderToStaticMarkup(<Capture />);
    for (const [value, turkish] of cases) {
      expect(html).toContain(
        `<option value="${value}"${condition === value ? ' selected=""' : ''}>${language === 'tr' ? turkish : value}</option>`,
      );
    }
    expect(form?.props.onSubmit).toBeDefined();
    form!.props.onSubmit!({ preventDefault: vi.fn() });
    await Promise.resolve();
    expect(api).toHaveBeenCalledExactlyOnceWith(
      'save_copy',
      expect.objectContaining({ id: book.id, condition }),
    );
    expect(onSaved).toHaveBeenCalledOnce();
    expect(book).toEqual(before);
  });
});
