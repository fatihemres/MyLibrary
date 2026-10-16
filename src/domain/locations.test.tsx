import { afterEach, describe, expect, it, vi } from 'vitest';
import { Children, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Locations } from '../pages/Locations';
import { RecordDialog } from '../components/RecordDialog';
import { label, setLanguage, t } from '../i18n';
import type { Snapshot } from './types';

const selection = vi.hoisted(() => ({ id: '' as string | undefined }));
vi.mock('react', async (importOriginal) => {
  const react = await importOriginal<typeof import('react')>();
  return {
    ...react,
    // Exercise the page's actual button guards with each selected persisted location.
    useState: (initial: unknown) =>
      selection.id !== undefined ? [selection.id, vi.fn()] : react.useState(initial),
  };
});

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
  locations: [
    { id: 'home', name: 'Synthetic home', extra: { kind: 'Home' } },
    { id: 'room', name: 'Synthetic room', parent_id: 'home', extra: { kind: 'Room' } },
    { id: 'bookcase', name: 'Synthetic bookcase', parent_id: 'room', extra: { kind: 'Bookcase' } },
    { id: 'shelf', name: 'Synthetic shelf', parent_id: 'bookcase', extra: { kind: 'Shelf' } },
  ],
};
type Element = ReactElement<{ children?: ReactNode; disabled?: boolean; onClick?: () => void }>;
function buttons(node: ReactNode): Element[] {
  return Children.toArray(node).flatMap((child) => {
    if (typeof child !== 'object' || !('props' in child)) return [];
    const element = child as Element;
    return element.type === 'button' ? [element] : buttons(element.props.children);
  });
}

afterEach(async () => {
  selection.id = undefined;
  await setLanguage('en');
});

describe.each(['en', 'tr'])('location hierarchy in %s', (language) => {
  it.each(['', 'home', 'room', 'bookcase', 'shelf'])(
    'enables only the appropriate child action for selection %s',
    async (id) => {
      await setLanguage(language);
      selection.id = id;
      const onRecord = vi.fn();
      const tree = Locations({ data, onRecord, onOpen: vi.fn(), onAction: vi.fn() });
      const actions = buttons(tree);
      const find = (name: string) => {
        const button = actions.find(
          (b) => renderToStaticMarkup(<>{b.props.children}</>).trim() === name,
        );
        expect(button).toBeDefined();
        return button!;
      };
      for (const [kind, parent] of [
        ['Bookcase', 'room'],
        ['Shelf', 'bookcase'],
      ]) {
        const button = find(t('actions.addKind', { kind: label(kind) }));
        expect(button.props.disabled).toBe(id !== parent);
        if (id === parent) {
          button.props.onClick?.();
          expect(onRecord).toHaveBeenLastCalledWith({
            type: 'locations',
            locationKind: kind,
            locationParent: data.locations.find((l) => l.id === parent),
          });
        }
      }
      const room = find(t('ui.addRoom'));
      expect(room.props.disabled).not.toBe(true);
      room.props.onClick?.();
      expect(onRecord).toHaveBeenLastCalledWith({
        type: 'locations',
        locationKind: 'Room',
        locationParent: id === 'home' ? data.locations[0] : undefined,
      });
      find(t('ui.createHomeLibrary')).props.onClick?.();
      expect(onRecord).toHaveBeenLastCalledWith({ type: 'locations', locationKind: 'Home' });
    },
  );

  it.each(['Home', 'Room', 'Bookcase', 'Shelf'])(
    'keeps dialog value %s stable while translating its label',
    async (kind) => {
      await setLanguage(language);
      selection.id = undefined;
      const html = renderToStaticMarkup(
        <RecordDialog
          request={{ type: 'locations', locationKind: kind }}
          data={data}
          onClose={() => {}}
          onSaved={async () => {}}
        />,
      );
      expect(html).toContain(`<option value="${kind}" selected="">${label(kind)}</option>`);
    },
  );
});
