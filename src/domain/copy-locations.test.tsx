import { afterEach, describe, expect, it, vi } from 'vitest';
import { Children, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CopyEditor } from '../components/CopyEditor';
import { emptyBook, type Snapshot } from './types';
import { label, setLanguage, t } from '../i18n';

const locationRequest = vi.hoisted(() => vi.fn());
vi.mock('react', async (importOriginal) => {
  const react = await importOriginal<typeof import('react')>();
  return {
    ...react,
    useState: (initial: unknown) => {
      const state = react.useState(initial);
      // Capture the nested location-dialog request; retain real draft initialization.
      return initial === null ? [state[0], locationRequest] : state;
    },
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
  locationRequest.mockClear();
  await setLanguage('en');
});

describe.each(['en', 'tr'])('CopyEditor location controls in %s', (language) => {
  it.each(['', 'home', 'room', 'bookcase', 'shelf'])(
    'preserves child kind and parent for selection %s',
    async (id) => {
      await setLanguage(language);
      const book = { ...emptyBook(), id: 'synthetic-copy', location_id: id };
      const before = structuredClone(book);
      let actions: Element[] = [];
      function Capture() {
        const tree = CopyEditor({
          book,
          data,
          mode: 'move',
          onClose: vi.fn(),
          onSaved: async () => {},
        });
        actions = buttons(tree);
        return tree;
      }
      renderToStaticMarkup(<Capture />);
      expect(locationRequest).not.toHaveBeenCalled();
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
          expect(locationRequest).toHaveBeenLastCalledWith({
            type: 'locations',
            locationKind: kind,
            locationParent: data.locations.find((l) => l.id === parent),
          });
        }
      }
      const room = find(t('ui.addRoom'));
      expect(room.props.disabled).not.toBe(true);
      room.props.onClick?.();
      expect(locationRequest).toHaveBeenLastCalledWith({ type: 'locations', locationKind: 'Room' });
      expect(book).toEqual(before);
    },
  );
});
