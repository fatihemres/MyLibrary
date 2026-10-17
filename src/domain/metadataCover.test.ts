import { describe, expect, it, vi, beforeEach } from 'vitest';
import { acquireMetadataCover } from '../components/MetadataLookup';
import { api, lookupCover } from '../services/api';
import { applySelection } from '../services/metadataMerge';
import { normalizeOpenLibrary } from '../services/metadata';
import { emptyBook } from './types';
import en from '../i18n/locales/en.json';
import tr from '../i18n/locales/tr.json';
vi.mock('../services/api', () => ({ api: vi.fn(), lookupCover: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
const keys = [
  'coverMissing',
  'coverRefused',
  'coverRateLimited',
  'coverServer',
  'coverTimeout',
  'coverNetwork',
  'coverUnsafeRedirect',
  'coverTooLarge',
  'coverInvalid',
  'coverBusy',
];
describe('CQ-02-A explicit cover orchestration', () => {
  it('does nothing until explicitly called and passes only the ISBN to native acquisition', async () => {
    expect(lookupCover).not.toHaveBeenCalled();
    expect(api).not.toHaveBeenCalled();
    vi.mocked(lookupCover).mockResolvedValue([255, 216, 255]);
    vi.mocked(api).mockResolvedValue('covers/synthetic.jpg');
    expect(await acquireMetadataCover('9780306406157')).toEqual({ image: 'covers/synthetic.jpg' });
    expect(lookupCover).toHaveBeenCalledExactlyOnceWith('9780306406157');
    expect(api).toHaveBeenCalledExactlyOnceWith('cover', {
      name: 'isbn-cover.jpg',
      bytes: [255, 216, 255],
    });
  });
  it.each(keys)('keeps cover, permits selected fields and never persists on %s', async (key) => {
    vi.mocked(lookupCover).mockRejectedValue(`metadata.${key}`);
    const original = { ...emptyBook(), title: 'Manual title', cover: 'covers/existing.jpg' };
    const before = structuredClone(original);
    const result = await acquireMetadataCover('9780306406157');
    expect(result).toEqual({ error: `metadata.${key}` });
    expect(api).not.toHaveBeenCalled();
    expect(lookupCover).toHaveBeenCalledTimes(1);
    const provider = normalizeOpenLibrary({
      title: 'Provider title',
      publishers: [{ name: 'Selected press' }],
    });
    const draft = applySelection(original, [provider], {
      title: 'current',
      publisher: 'openLibrary',
    });
    expect(draft.cover).toBe(before.cover);
    expect(draft.title).toBe(before.title);
    expect(draft.publisher).toBe('Selected press');
    expect(original).toEqual(before);
    const name = `metadata.${key}` as keyof typeof en;
    expect(en[name]).toBeTruthy();
    expect(tr[name]).toBeTruthy();
    expect(en[name]).not.toBe(tr[name]);
  });
  it('has no retry until a new explicit action and never leaks provider details', async () => {
    vi.mocked(lookupCover).mockRejectedValue('https://private.test/secret <html>error</html>');
    expect(await acquireMetadataCover('9780306406157')).toEqual({ error: 'metadata.coverFailed' });
    expect(lookupCover).toHaveBeenCalledTimes(1);
    expect(api).not.toHaveBeenCalled();
    await acquireMetadataCover('9780306406157');
    expect(lookupCover).toHaveBeenCalledTimes(2);
  });
  it('bounds storage failures too', async () => {
    vi.mocked(lookupCover).mockResolvedValue([255, 216]);
    vi.mocked(api).mockRejectedValue(new Error('private path'));
    expect(await acquireMetadataCover('9780306406157')).toEqual({ error: 'metadata.coverFailed' });
    expect(api).toHaveBeenCalledTimes(1);
  });
});
